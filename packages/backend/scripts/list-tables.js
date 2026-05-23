const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const rows = await p.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY 1`;
  console.log(rows);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
