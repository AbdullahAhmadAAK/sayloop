const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const cols = await p.$queryRaw`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches'
    ORDER BY ordinal_position`;
  console.log('matches columns:', cols);

  const users = await p.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position LIMIT 20`;
  console.log('users columns (first 20):', users);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
