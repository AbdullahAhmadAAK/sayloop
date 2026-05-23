const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    const count = await p.user.count();
    console.log('prisma user.count:', count);
    const sample = await p.user.findFirst();
    console.log('sample:', sample);
  } catch (e) {
    console.error('prisma user error:', e.message);
  }

  try {
    const raw = await p.$queryRaw`SELECT id, clerk_id, username, first_name FROM users LIMIT 3`;
    console.log('raw users:', raw);
  } catch (e) {
    console.error('raw users error:', e.message);
  }

  await p.$disconnect();
}

main();
