const { getDb } = require('../config/database');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    clerkId: row.clerk_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.username || row.first_name || 'Learner',
    pfpSource: row.pfp_source,
    avatarStyle: row.avatar_style || null,
    avatarSeed: row.avatar_seed || null,
    learningLanguage: row.learning_language || 'English',
    interests: row.interests,
    onboardingComplete: row.onboarding_complete != null ? Boolean(row.onboarding_complete) : true,
    xp: row.xp ?? row.points ?? 0,
    gems: row.gems ?? 0,
    streak: row.streak_length ?? 0,
  };
}

async function findByClerkId(clerkId) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.$queryRaw`
    SELECT * FROM users WHERE clerk_id = ${clerkId} LIMIT 1`;
  return mapUser(rows[0]);
}

async function findById(id) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.$queryRaw`
    SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return mapUser(rows[0]);
}

async function upsertFromClerk(clerkId, { email, firstName, lastName, pfpSource }) {
  const db = getDb();
  if (!db) {
    const err = new Error('Database not available');
    err.status = 503;
    throw err;
  }

  const existing = await findByClerkId(clerkId);
  if (existing) {
    const rows = await db.$queryRaw`
      UPDATE users SET
        email = COALESCE(${email}, email),
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name)
      WHERE clerk_id = ${clerkId}
      RETURNING *`;
    return mapUser(rows[0]);
  }

  const rows = await db.$queryRaw`
    INSERT INTO users (clerk_id, email, first_name, last_name, pfp_source, xp, gems, streak_length, points)
    VALUES (${clerkId}, ${email}, ${firstName}, ${lastName}, ${pfpSource}, 0, 0, 0, 0)
    RETURNING *`;
  return mapUser(rows[0]);
}

async function updateProfile(clerkId, data) {
  const db = getDb();
  if (!db) {
    const err = new Error('Database not available');
    err.status = 503;
    throw err;
  }

  const {
    nickname,
    pfpSource,
    avatarStyle,
    avatarSeed,
    learningLanguage,
    interests,
    onboardingComplete,
    firstName,
    lastName,
  } = data;

  const interestsJson = interests != null ? JSON.stringify(interests) : null;

  const rows = await db.$queryRaw`
    UPDATE users SET
      username = COALESCE(${nickname ?? null}, username),
      pfp_source = COALESCE(${pfpSource ?? null}, pfp_source),
      learning_language = COALESCE(${learningLanguage ?? null}, learning_language),
      interests = CASE WHEN ${interestsJson}::text IS NOT NULL THEN ${interestsJson}::jsonb ELSE interests END,
      first_name = COALESCE(${firstName ?? null}, first_name),
      last_name = COALESCE(${lastName ?? null}, last_name)
    WHERE clerk_id = ${clerkId}
    RETURNING *`;

  return mapUser(rows[0]);
}

async function addXp(userId, delta) {
  const db = getDb();
  if (!db) {
    const err = new Error('Database not available');
    err.status = 503;
    throw err;
  }

  const rows = await db.$queryRaw`
    UPDATE users SET
      xp = GREATEST(0, COALESCE(xp, COALESCE(points, 0), 0) + ${delta})
    WHERE id = ${userId}
    RETURNING xp, points`;

  const row = rows[0];
  return row?.xp ?? row?.points ?? 0;
}

module.exports = {
  mapUser,
  findByClerkId,
  findById,
  upsertFromClerk,
  updateProfile,
  addXp,
};
