const matchesRepo = require('../../db/matches.repo');
const usersRepo = require('../../db/users.repo');
const { XP } = require('../../config/sessionConfig');

/**
 * @param {'COMPLETE' | 'DRAW' | 'RESIGN'} endType
 * @param {number} userId
 * @param {number | null} resignerId
 */
function xpDeltaForUser(endType, userId, resignerId) {
  if (endType === 'COMPLETE') return XP.SESSION_COMPLETE;
  if (endType === 'DRAW') return XP.DRAW;
  if (endType === 'RESIGN') {
    if (userId === resignerId) return XP.LOSS_ON_RESIGN;
    return XP.WIN_ON_RESIGN;
  }
  return 0;
}

function outcomeForUser(endType, userId, resignerId) {
  if (endType === 'COMPLETE') return 'COMPLETE';
  if (endType === 'DRAW') return 'DRAW';
  if (endType === 'RESIGN') {
    return userId === resignerId ? 'LOSS' : 'WIN';
  }
  return 'DRAW';
}

async function applySessionRewards(match, endType, resignerId = null) {
  const userIds = [match.requesterId, match.receiverId];
  const results = {};

  for (const uid of userIds) {
    const delta = xpDeltaForUser(endType, uid, resignerId);
    const xp = await usersRepo.addXp(uid, delta);
    results[uid] = {
      userId: uid,
      xpEarned: delta,
      totalXp: xp,
      outcome: outcomeForUser(endType, uid, resignerId),
    };
  }

  await matchesRepo.markSessionEnded(match.id);
  return results;
}

async function getMatchForSession(sessionId) {
  return matchesRepo.findBySessionId(sessionId);
}

async function assertParticipant(match, userId) {
  const uid = Number(userId);
  const requesterId = Number(match.requesterId);
  const receiverId = Number(match.receiverId);
  if (uid !== requesterId && uid !== receiverId) {
    const err = new Error('Not a participant in this session');
    err.status = 403;
    throw err;
  }
}

module.exports = {
  xpDeltaForUser,
  outcomeForUser,
  applySessionRewards,
  getMatchForSession,
  assertParticipant,
};
