const sessionStore = require('./session.store');
const sessionService = require('./session.service');
const { SESSION_DURATION_SECONDS } = require('../../config/sessionConfig');
const { getTopic } = require('../../config/topics');

function emitToUser(io, userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
}

function formatEndPayload(result, topic, partnerNickname) {
  return {
    outcome: result.outcome,
    xpEarned: result.xpEarned,
    totalXp: result.totalXp,
    topic,
    partnerName: partnerNickname,
    speakingSeconds: 0,
    opponentSeconds: 0,
  };
}

async function endSession(io, state, endType, resignerId = null) {
  if (state.ended) return;
  state.ended = true;
  sessionStore.clearTimer(state);

  const match = await sessionService.getMatchForSession(state.sessionId);
  if (!match) {
    sessionStore.destroySession(state.sessionId);
    return;
  }

  const results = await sessionService.applySessionRewards(match, endType, resignerId);
  const usersRepo = require('../../db/users.repo');
  const requester = await usersRepo.findById(match.requesterId);
  const receiver = await usersRepo.findById(match.receiverId);
  const topicMeta = getTopic(match.topic);

  for (const uid of [match.requesterId, match.receiverId]) {
    const partner = uid === match.requesterId ? receiver : requester;
    const result = results[uid];
    emitToUser(io, uid, 'session:end', {
      ...formatEndPayload(result, match.topic, partner?.nickname || 'Partner'),
      reason: endType,
      topicLabel: topicMeta?.label,
      topicPrompt: topicMeta?.prompt,
    });
    emitToUser(io, uid, 'economy:update', { xp: result.totalXp, xpDelta: result.xpEarned });
  }

  sessionStore.destroySession(state.sessionId);
}

function emitSessionStartToUser(io, state, userId) {
  const topicMeta = getTopic(state.topic);
  const remaining = sessionStore.remainingSeconds(state);
  emitToUser(io, userId, 'session:start', {
    sessionId: state.sessionId,
    durationSeconds: SESSION_DURATION_SECONDS,
    remainingSeconds: remaining,
    topic: state.topic,
    topicLabel: topicMeta?.label,
    topicPrompt: topicMeta?.prompt,
    shouldOffer: sessionStore.getShouldOffer(state, userId),
  });
  emitToUser(io, userId, 'session:timer', { remainingSeconds: remaining });
}

function startTimer(io, state) {
  if (state.timerInterval) return;

  state.endsAt = Date.now() + SESSION_DURATION_SECONDS * 1000;

  const tick = () => {
    const remaining = sessionStore.remainingSeconds(state);
    io.to(state.sessionId).emit('session:timer', { remainingSeconds: remaining });

    if (remaining <= 0) {
      endSession(io, state, 'COMPLETE');
    }
  };

  tick();
  state.timerInterval = setInterval(tick, 1000);
}

async function tryStartDebate(io, state) {
  if (state.ended || state.timerInterval) return;
  if (!sessionStore.bothJoined(state)) return;

  await require('../../db/matches.repo').markInSession(state.matchId);

  startTimer(io, state);

  emitSessionStartToUser(io, state, state.requesterId);
  emitSessionStartToUser(io, state, state.receiverId);
}

function buildJoinAck(state, userId, partnerJoined) {
  const debateStarted = sessionStore.isDebateStarted(state);
  return {
    ok: true,
    partnerJoined,
    bothJoined: sessionStore.bothJoined(state),
    debateStarted,
    remainingSeconds: debateStarted ? sessionStore.remainingSeconds(state) : SESSION_DURATION_SECONDS,
    shouldOffer: debateStarted ? sessionStore.getShouldOffer(state, userId) : false,
    topic: state.topic,
  };
}

function registerSessionHandlers(io, socket) {
  const userId = sessionStore.normalizeUserId(socket.dbUserId);

  socket.on('session:join', async (payload, ack) => {
    const reply = (data) => {
      if (typeof ack === 'function') ack(data);
    };

    try {
      const sessionId = payload?.sessionId;
      if (!sessionId) {
        return reply({ ok: false, message: 'sessionId required' });
      }

      const match = await sessionService.getMatchForSession(sessionId);
      if (!match) {
        return reply({ ok: false, message: 'Session not found — try accepting the match again' });
      }

      await sessionService.assertParticipant(match, userId);

      const state = sessionStore.createSession({
        sessionId,
        matchId: match.id,
        requesterId: match.requesterId,
        receiverId: match.receiverId,
        topic: match.topic,
      });

      if (state.ended) {
        return reply({ ok: false, message: 'Session already ended' });
      }

      sessionStore.joinParticipant(sessionId, userId, socket.id);
      socket.join(sessionId);
      socket.join(`user:${userId}`);

      const partnerId =
        userId === state.requesterId ? state.receiverId : state.requesterId;
      const partnerJoined = state.participants.has(partnerId);

      socket.emit('session:joined', {
        sessionId,
        partnerJoined,
        waitingForPartner: !partnerJoined,
      });

      if (partnerJoined && !sessionStore.isDebateStarted(state)) {
        emitToUser(io, partnerId, 'session:partner-joined', { sessionId });
        await tryStartDebate(io, state);
      }

      if (sessionStore.isDebateStarted(state)) {
        emitSessionStartToUser(io, state, userId);
      }

      reply(buildJoinAck(state, userId, partnerJoined));
    } catch (err) {
      console.error('[session] join', err);
      reply({ ok: false, message: err.message || 'Failed to join session' });
    }
  });

  socket.on('session:signal', (payload) => {
    const sessionId = payload?.sessionId;
    const signal = payload?.signal;
    if (!sessionId || !signal) return;

    const state = sessionStore.getSession(sessionId);
    if (!state || state.ended) return;

    if (signal.sdp?.type === 'offer') {
      state.lastOffer = { fromUserId: userId, signal };
    }

    socket.to(sessionId).emit('session:signal', {
      fromUserId: userId,
      signal,
    });
  });

  socket.on('session:webrtc-ready', (payload) => {
    const sessionId = payload?.sessionId;
    if (!sessionId) return;

    const state = sessionStore.getSession(sessionId);
    if (!state || state.ended) return;

    state.webrtcReady.add(userId);

    const partnerId =
      userId === state.requesterId ? state.receiverId : state.requesterId;

    emitToUser(io, partnerId, 'session:peer-webrtc-ready', { sessionId, fromUserId: userId });

    if (
      state.lastOffer &&
      Number(state.lastOffer.fromUserId) === partnerId &&
      state.webrtcReady.has(userId)
    ) {
      socket.emit('session:signal', {
        fromUserId: state.lastOffer.fromUserId,
        signal: state.lastOffer.signal,
      });
    }
  });

  socket.on('session:offer-draw', async (payload, ack) => {
    try {
      const sessionId = payload?.sessionId;
      const state = sessionStore.getSession(sessionId);
      if (!state || state.ended) throw new Error('Session not active');

      await sessionService.assertParticipant(
        await sessionService.getMatchForSession(sessionId),
        userId,
      );

      state.drawOfferFromUserId = userId;
      const partnerId =
        userId === state.requesterId ? state.receiverId : state.requesterId;

      emitToUser(io, partnerId, 'session:draw-offered', { sessionId, fromUserId: userId });

      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, message: err.message });
    }
  });

  socket.on('session:accept-draw', async (payload, ack) => {
    try {
      const sessionId = payload?.sessionId;
      const state = sessionStore.getSession(sessionId);
      if (!state || state.ended) throw new Error('Session not active');

      if (!state.drawOfferFromUserId || state.drawOfferFromUserId === userId) {
        throw new Error('No draw offer to accept');
      }

      await endSession(io, state, 'DRAW');
      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, message: err.message });
    }
  });

  socket.on('session:decline-draw', (payload) => {
    const sessionId = payload?.sessionId;
    const state = sessionStore.getSession(sessionId);
    if (!state) return;

    const offerer = state.drawOfferFromUserId;
    state.drawOfferFromUserId = null;
    if (offerer) {
      emitToUser(io, offerer, 'session:draw-declined', { sessionId });
    }
  });

  socket.on('session:resign', async (payload, ack) => {
    try {
      const sessionId = payload?.sessionId;
      const state = sessionStore.getSession(sessionId);
      if (!state || state.ended) throw new Error('Session not active');

      await sessionService.assertParticipant(
        await sessionService.getMatchForSession(sessionId),
        userId,
      );

      await endSession(io, state, 'RESIGN', userId);
      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, message: err.message });
    }
  });

  socket.on('session:leave', (payload) => {
    const sessionId = payload?.sessionId;
    if (!sessionId) return;

    const state = sessionStore.getSession(sessionId);
    socket.leave(sessionId);
    sessionStore.leaveParticipant(sessionId, userId);

    if (state && !state.ended) {
      const partnerId =
        userId === state.requesterId ? state.receiverId : state.requesterId;
      if (state.participants.has(partnerId)) {
        emitToUser(io, partnerId, 'session:partner-left', { sessionId });
      }
    }
  });

  socket.on('disconnect', () => {
    for (const [sessionId, state] of sessionStore.sessions.entries()) {
      if (!state.participants.has(userId) || state.ended) continue;

      sessionStore.leaveParticipant(sessionId, userId);
      const partnerId =
        userId === state.requesterId ? state.receiverId : state.requesterId;
      emitToUser(io, partnerId, 'session:partner-left', { sessionId });
    }
  });
}

module.exports = { registerSessionHandlers, endSession };
