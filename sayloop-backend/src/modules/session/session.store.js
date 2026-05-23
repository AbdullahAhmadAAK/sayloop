const { SESSION_DURATION_SECONDS } = require('../../config/sessionConfig');

/** @type {Map<string, SessionState>} */
const sessions = new Map();

function normalizeUserId(id) {
  return Number(id);
}

function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

function createSession({ sessionId, matchId, requesterId, receiverId, topic }) {
  let state = sessions.get(sessionId);
  if (state) return state;

  state = {
    sessionId,
    matchId,
    requesterId: normalizeUserId(requesterId),
    receiverId: normalizeUserId(receiverId),
    topic,
    ended: false,
    timerInterval: null,
    endsAt: 0,
    drawOfferFromUserId: null,
    participants: new Map(),
    /** Last WebRTC offer for late joiners / peer-ready replay */
    lastOffer: null,
    webrtcReady: new Set(),
  };
  sessions.set(sessionId, state);
  return state;
}

function joinParticipant(sessionId, userId, socketId) {
  const state = sessions.get(sessionId);
  if (!state) return null;

  state.participants.set(normalizeUserId(userId), { socketId, joined: true });
  return state;
}

function leaveParticipant(sessionId, userId) {
  const state = sessions.get(sessionId);
  if (!state) return null;

  state.participants.delete(normalizeUserId(userId));

  if (state.participants.size === 0 && !state.timerInterval) {
    sessions.delete(sessionId);
  }
  return state;
}

function bothJoined(state) {
  return (
    state.participants.has(state.requesterId) &&
    state.participants.has(state.receiverId)
  );
}

function clearTimer(state) {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function destroySession(sessionId) {
  const state = sessions.get(sessionId);
  if (state) {
    clearTimer(state);
    sessions.delete(sessionId);
  }
}

function remainingSeconds(state) {
  if (!state.endsAt) return SESSION_DURATION_SECONDS;
  return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
}

function isDebateStarted(state) {
  return Boolean(state.timerInterval);
}

function getShouldOffer(state, userId) {
  const uid = normalizeUserId(userId);
  const initiatorId = Math.min(state.requesterId, state.receiverId);
  return uid === initiatorId;
}

module.exports = {
  sessions,
  normalizeUserId,
  getSession,
  createSession,
  joinParticipant,
  leaveParticipant,
  bothJoined,
  clearTimer,
  destroySession,
  remainingSeconds,
  isDebateStarted,
  getShouldOffer,
  SESSION_DURATION_SECONDS,
};
