const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Check admission_scores province distribution
  const r1 = await p.$queryRawUnsafe('SELECT province_code, COUNT(*)::int as cnt FROM data.admission_scores GROUP BY province_code ORDER BY cnt DESC');
  console.log('=== admission_scores by province ===');
  for (const r of r1) console.log(r.province_code + ': ' + r.cnt);

  // Check city universities
  console.log('\n=== Sample universities with city ===');
  const r2 = await p.$queryRawUnsafe('SELECT u.name, cum.city_name FROM data.universities u JOIN data.city_university_map cum ON cum.university_id = u.id LIMIT 10');
  for (const r of r2) console.log(r.name + ' -> ' + r.city_name);

  // Check if Guangzhou universities match admission scores
  console.log('\n=== Guangzhou universities in city map ===');
  const r3 = await p.$queryRawUnsafe('SELECT u.name FROM data.universities u JOIN data.city_university_map cum ON cum.university_id = u.id WHERE cum.city_name = $1', '广州市');
  for (const r of r3) console.log('  ' + r.name);

  // Check admission scores for Guangdong with city info
  console.log('\n=== Admission scores for Guangdong ===');
  const r4 = await p.$queryRawUnsafe('SELECT ads.university_id::text, u.name FROM data.admission_scores ads JOIN data.universities u ON u.id = ads.university_id WHERE ads.province_code = $1 LIMIT 10', '44');
  for (const r of r4) console.log('  ' + r.name);

  await p.$disconnect();
})();
