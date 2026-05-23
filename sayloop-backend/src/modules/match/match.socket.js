const {
  setUserOnline,
  setUserPage,
  removeUser,
  getOnlineUsers,
} = require('../presence/presence.store');
const matchService = require('./match.service');

function emitToUser(io, userId, event, payload) {
  io.to(`user:${Number(userId)}`).emit(event, payload);
}

function registerMatchHandlers(io, socket) {
  const userId = socket.dbUserId;
  const dbUser = socket.dbUser;

  const uid = Number(userId);
  setUserOnline(uid, socket.id, dbUser, '/');
  socket.join(`user:${uid}`);

  emitToUser(io, userId, 'presence:online-count', {
    count: getOnlineUsers(userId).length,
  });

  socket.on('page:join', (payload) => {
    const page = payload?.page || '/';
    setUserPage(userId, page);
    socket.join(`page:${page}`);
  });

  socket.on('page:leave', (payload) => {
    const page = payload?.page || '/';
    socket.leave(`page:${page}`);
  });

  socket.on('match:send-request', async (payload, ack) => {
    const reply = (data) => {
      if (typeof ack === 'function') ack(data);
    };

    try {
      const toUserId = Number(payload?.toUserId);
      const topic = payload?.topic;
      if (!toUserId || Number.isNaN(toUserId)) {
        return reply({ ok: false, message: 'Invalid partner id' });
      }
      if (!topic) {
        return reply({ ok: false, message: 'Pick a topic first' });
      }

      const { match, requester, receiver } = await matchService.createMatch(
        userId,
        toUserId,
        topic,
      );

      if (!requester || !receiver) {
        return reply({ ok: false, message: 'Could not load user profiles' });
      }

      const request = matchService.formatMatchRequest(match, requester);
      const partner = matchService.formatPartner(receiver);

      emitToUser(io, toUserId, 'match:request-received', { request });
      socket.emit('match:request-sent', {
        matchId: match.id,
        partner,
        topic,
      });

      reply({ ok: true, matchId: match.id, partner, topic });
    } catch (err) {
      console.error('[match] send-request', err);
      reply({ ok: false, message: err.message || 'Failed to send challenge' });
    }
  });

  socket.on('match:accept', async (payload, ack) => {
    try {
      const matchId = payload?.matchId;
      if (!matchId) throw new Error('matchId required');

      const { match } = await matchService.acceptMatch(matchId, userId);
      const requesterId = Number(match.requesterId);
      const receiverId = Number(match.receiverId);
      const forRequester = await matchService.formatMatchPayload(match, requesterId);
      const forReceiver = await matchService.formatMatchPayload(match, receiverId);
      const forAccepter = userId === receiverId ? forReceiver : forRequester;

      emitToUser(io, requesterId, 'match:accepted', forRequester);
      emitToUser(io, receiverId, 'match:accepted', forReceiver);

      if (typeof ack === 'function') ack({ ok: true, ...forAccepter });
    } catch (err) {
      console.error('[match] accept', err);
      if (typeof ack === 'function') {
        ack({ ok: false, message: err.message || 'Could not accept challenge' });
      }
    }
  });

  socket.on('match:reject', async (payload, ack) => {
    try {
      const matchId = payload?.matchId;
      if (!matchId) throw new Error('matchId required');

      const { match } = await matchService.rejectMatch(matchId, userId);

      emitToUser(io, match.requesterId, 'match:rejected', {
        matchId,
        topic: match.topic,
      });

      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      console.error('[match] reject', err);
      if (typeof ack === 'function') ack({ ok: false, message: err.message });
    }
  });

  socket.on('match:confirm-ready', async (payload, ack) => {
    try {
      const matchId = payload?.matchId;
      if (!matchId) throw new Error('matchId required');

      const { match, bothReady } = await matchService.confirmReady(matchId, userId);
      const uid = Number(userId);
      const requesterId = Number(match.requesterId);
      const receiverId = Number(match.receiverId);
      const partnerId = uid === requesterId ? receiverId : requesterId;

      emitToUser(io, partnerId, 'match:partner-ready', { matchId });

      if (bothReady) {
        const sessionRoom = match.sessionId;
        const forRequester = await matchService.formatMatchPayload(
          match,
          match.requesterId,
        );
        const forReceiver = await matchService.formatMatchPayload(
          match,
          match.receiverId,
        );

        emitToUser(io, requesterId, 'match:session-start', {
          sessionId: sessionRoom,
          ...forRequester,
        });
        emitToUser(io, receiverId, 'match:session-start', {
          sessionId: sessionRoom,
          ...forReceiver,
        });

        io.in(`user:${requesterId}`).socketsJoin(sessionRoom);
        io.in(`user:${receiverId}`).socketsJoin(sessionRoom);
      }

      if (typeof ack === 'function') {
        ack({ ok: true, bothReady, sessionId: bothReady ? match.sessionId : null });
      }
    } catch (err) {
      console.error('[match] confirm-ready', err);
      if (typeof ack === 'function') ack({ ok: false, message: err.message });
    }
  });

  socket.on('disconnect', () => {
    const stillConnected = io.sockets.adapter.rooms.get(`user:${userId}`);
    const hasOtherSocket =
      stillConnected && [...stillConnected].some((sid) => sid !== socket.id);
    if (!hasOtherSocket) {
      removeUser(userId);
      console.log('[socket] user offline', userId);
    }
  });
}

module.exports = { registerMatchHandlers };
