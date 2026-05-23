const { formatPresenceUser } = require('../presence/presence.store');
const matchesRepo = require('../../db/matches.repo');
const usersRepo = require('../../db/users.repo');

function formatPartner(dbUser) {
  return formatPresenceUser(dbUser);
}

function formatMatchRequest(match, requesterUser) {
  return {
    id: match.id,
    requester: formatPartner(requesterUser),
    topic: match.topic,
    status: match.status,
    sessionId: match.sessionId,
    createdAt: match.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

async function formatMatchPayload(match, forUserId) {
  const requester = await usersRepo.findById(match.requesterId);
  const receiver = await usersRepo.findById(match.receiverId);
  const uid = Number(forUserId);
  const isRequester = uid === Number(match.requesterId);
  const partner = formatPartner(isRequester ? receiver : requester);
  return {
    matchId: match.id,
    sessionId: match.sessionId,
    topic: match.topic,
    status: match.status,
    partner,
    role: isRequester ? 'requester' : 'receiver',
  };
}

async function browseOnlineUsers(excludeUserId, onlineUsers) {
  return onlineUsers;
}

async function getPendingRequests(receiverId) {
  const rows = await matchesRepo.findPendingForReceiver(receiverId);
  return rows.map(({ match, requester }) => formatMatchRequest(match, requester));
}

const { isValidTopicId } = require('../../config/topics');

async function createMatch(requesterId, receiverId, topic) {
  if (!isValidTopicId(topic)) {
    const err = new Error('Invalid debate topic');
    err.status = 400;
    throw err;
  }

  if (requesterId === receiverId) {
    const err = new Error('Cannot match with yourself');
    err.status = 400;
    throw err;
  }

  const match = await matchesRepo.createMatch(requesterId, receiverId, topic);
  const requester = await usersRepo.findById(requesterId);
  const receiver = await usersRepo.findById(receiverId);
  return { match, requester, receiver };
}

async function acceptMatch(matchId, userId) {
  const match = await matchesRepo.acceptMatch(matchId, userId);
  const requester = await usersRepo.findById(match.requesterId);
  const receiver = await usersRepo.findById(match.receiverId);
  return { match, requester, receiver };
}

async function rejectMatch(matchId, userId) {
  const match = await matchesRepo.rejectMatch(matchId, userId);
  const requester = await usersRepo.findById(match.requesterId);
  return { match, requester };
}

async function confirmReady(matchId, userId) {
  return matchesRepo.confirmReady(matchId, userId);
}

async function getMatchById(matchId) {
  return matchesRepo.findById(matchId);
}

module.exports = {
  formatPartner,
  formatMatchRequest,
  formatMatchPayload,
  browseOnlineUsers,
  getPendingRequests,
  createMatch,
  acceptMatch,
  rejectMatch,
  confirmReady,
  getMatchById,
};
