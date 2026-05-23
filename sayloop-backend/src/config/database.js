let prisma;

function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

async function connectWithRetry(maxAttempts = 3) {
  const db = getDb();
  if (!db) {
    console.warn('[db] DATABASE_URL not set — skipping connection');
    return false;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.$connect();
      console.log('[db] Connected');
      return true;
    } catch (err) {
      console.warn(`[db] Connect attempt ${attempt}/${maxAttempts} failed:`, err.message);
      if (attempt === maxAttempts) {
        return false;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}

module.exports = { getDb, connectWithRetry };
