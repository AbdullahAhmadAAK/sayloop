const { getDb } = require('../config/database');
const usersRepo = require('./users.repo');

/** In-memory ready flags until both users confirm (matches table has no columns). */
const readyUsersByMatchId = new Map();

function normalizeStatus(status) {
  return String(status ?? '').toUpperCase();
}

function mapMatch(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    requesterId: Number(row.requester_id),
    receiverId: Number(row.receiver_id),
    topic: row.topic,
    status: normalizeStatus(row.status),
    sessionId: row.session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findById(matchId) {
  const db = getDb();
  if (!db) return null;
  const id = Number(matchId);
  const rows = await db.$queryRaw`
    SELECT * FROM matches WHERE id = ${id} LIMIT 1`;
  return mapMatch(rows[0]);
}

async function findBySessionId(sessionId) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.$queryRaw`
    SELECT * FROM matches WHERE session_id = ${sessionId} LIMIT 1`;
  return mapMatch(rows[0]);
}

async function markInSession(matchId) {
  const db = getDb();
  if (!db) return;
  await db.$queryRaw`
    UPDATE matches SET
      status = 'IN_SESSION'::"MatchStatus",
      updated_at = NOW()
    WHERE id = ${Number(matchId)}`;
}

async function markSessionEnded(matchId) {
  const db = getDb();
  if (!db) return;
  try {
    await db.$queryRaw`
      UPDATE matches SET
        status = 'EXPIRED'::"MatchStatus",
        updated_at = NOW()
      WHERE id = ${Number(matchId)}`;
  } catch {
    await db.$queryRaw`
      UPDATE matches SET updated_at = NOW()
      WHERE id = ${Number(matchId)}`;
  }
}

async function findPendingForReceiver(receiverId) {
  const db = getDb();
  if (!db) return [];
  const rid = Number(receiverId);
  const rows = await db.$queryRaw`
    SELECT m.*, u.id AS req_id, u.clerk_id, u.username, u.first_name, u.last_name,
           u.pfp_source, u.learning_language, u.xp, u.points, u.streak_length
    FROM matches m
    JOIN users u ON u.id = m.requester_id
    WHERE m.receiver_id = ${rid} AND m.status = 'PENDING'::"MatchStatus"
    ORDER BY m.created_at DESC`;
  return rows.map((row) => ({
    match: mapMatch(row),
    requester: usersRepo.mapUser({
      id: row.req_id,
      clerk_id: row.clerk_id,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      pfp_source: row.pfp_source,
      learning_language: row.learning_language,
      xp: row.xp,
      points: row.points,
      streak_length: row.streak_length,
    }),
  }));
}

async function createMatch(requesterId, receiverId, topic) {
  const db = getDb();
  if (!db) {
    const err = new Error('Database not available');
    err.status = 503;
    throw err;
  }

  const rid = Number(requesterId);
  const reid = Number(receiverId);

  const existing = await db.$queryRaw`
    SELECT * FROM matches
    WHERE status = 'PENDING'::"MatchStatus"
      AND (
        (requester_id = ${rid} AND receiver_id = ${reid})
        OR (requester_id = ${reid} AND receiver_id = ${rid})
      )
    LIMIT 1`;

  if (existing[0]) return mapMatch(existing[0]);

  const rows = await db.$queryRaw`
    INSERT INTO matches (requester_id, receiver_id, topic, status, created_at, updated_at)
    VALUES (${rid}, ${reid}, ${topic}, 'PENDING'::"MatchStatus", NOW(), NOW())
    RETURNING *`;

  readyUsersByMatchId.delete(String(rows[0].id));
  return mapMatch(rows[0]);
}

/**
 * Accept a pending challenge. Idempotent if already ACCEPTED/CONFIRMED.
 * Only the receiver (challenged user) may accept from PENDING.
 */
async function acceptMatch(matchId, userId) {
  const db = getDb();
  const id = Number(matchId);
  const uid = Number(userId);

  const existing = await findById(id);
  if (!existing) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }

  const requesterId = Number(existing.requesterId);
  const receiverId = Number(existing.receiverId);
  const status = existing.status;

  if (uid !== requesterId && uid !== receiverId) {
    const err = new Error('You are not part of this match');
    err.status = 403;
    throw err;
  }

  if (['ACCEPTED', 'CONFIRMED', 'IN_SESSION'].includes(status)) {
    return existing;
  }

  if (status !== 'PENDING') {
    const err = new Error(`This challenge was already ${status.toLowerCase()}`);
    err.status = 400;
    throw err;
  }

  if (uid !== receiverId) {
    const err = new Error('Only the person who received the challenge can accept it');
    err.status = 403;
    throw err;
  }

  const sessionId = existing.sessionId || `session_${id}_${Date.now()}`;

  const rows = await db.$queryRaw`
    UPDATE matches SET
      status = 'ACCEPTED'::"MatchStatus",
      session_id = ${sessionId},
      updated_at = NOW()
    WHERE id = ${id}
      AND receiver_id = ${uid}
      AND status = 'PENDING'::"MatchStatus"
    RETURNING *`;

  if (!rows[0]) {
    const refreshed = await findById(id);
    if (refreshed && ['ACCEPTED', 'CONFIRMED', 'IN_SESSION'].includes(refreshed.status)) {
      return refreshed;
    }
    const err = new Error('Could not accept — refresh and try again');
    err.status = 409;
    throw err;
  }

  readyUsersByMatchId.set(String(id), new Set());
  return mapMatch(rows[0]);
}

async function rejectMatch(matchId, userId) {
  const db = getDb();
  const id = Number(matchId);
  const uid = Number(userId);

  const rows = await db.$queryRaw`
    UPDATE matches SET
      status = 'REJECTED'::"MatchStatus",
      updated_at = NOW()
    WHERE id = ${id}
      AND receiver_id = ${uid}
      AND status = 'PENDING'::"MatchStatus"
    RETURNING *`;

  if (!rows[0]) {
    const err = new Error('Match not found or already handled');
    err.status = 404;
    throw err;
  }

  readyUsersByMatchId.delete(String(id));
  return mapMatch(rows[0]);
}

async function confirmReady(matchId, userId) {
  const match = await findById(matchId);
  if (!match) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }

  const status = match.status;
  if (!['ACCEPTED', 'CONFIRMED'].includes(status)) {
    const err = new Error('Match not ready for confirmation');
    err.status = 400;
    throw err;
  }

  const uid = Number(userId);
  const requesterId = Number(match.requesterId);
  const receiverId = Number(match.receiverId);

  if (uid !== requesterId && uid !== receiverId) {
    const err = new Error('Not a participant');
    err.status = 403;
    throw err;
  }

  let ready = readyUsersByMatchId.get(String(matchId));
  if (!ready) {
    ready = new Set();
    readyUsersByMatchId.set(String(matchId), ready);
  }
  ready.add(uid);

  const bothReady = ready.has(requesterId) && ready.has(receiverId);

  if (bothReady && status === 'ACCEPTED') {
    const db = getDb();
    await db.$queryRaw`
      UPDATE matches SET
        status = 'CONFIRMED'::"MatchStatus",
        updated_at = NOW()
      WHERE id = ${Number(matchId)}`;
    match.status = 'CONFIRMED';
    readyUsersByMatchId.delete(String(matchId));
  } else if (status === 'CONFIRMED') {
    match.status = 'CONFIRMED';
  }

  return { match, bothReady: bothReady || status === 'CONFIRMED' };
}

module.exports = {
  findById,
  findBySessionId,
  findPendingForReceiver,
  createMatch,
  acceptMatch,
  rejectMatch,
  confirmReady,
  markInSession,
  markSessionEnded,
};
