const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const tables = ['admission_scores', 'university_plans', 'city_university_map', 'universities', 'majors'];
  for (const t of tables) {
    const r = await p.$queryRawUnsafe(`SELECT count(*)::int as c FROM data.${t}`);
    console.log(`${t}: ${r[0].c}`);
  }
  await p.$disconnect();
})();
