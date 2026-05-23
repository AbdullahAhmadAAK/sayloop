const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const rows = await p.$queryRaw`
    SELECT e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'MatchStatus'
    ORDER BY e.enumsortorder`;
  console.log(rows);
  const sample = await p.$queryRaw`SELECT id, status, topic FROM matches ORDER BY id DESC LIMIT 3`;
  console.log('recent matches:', sample);
  await p.$disconnect();
}

main().catch(console.error);
