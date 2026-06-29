/**
 * Seed universities table from known 985/211 lists + import data.
 * Must run before any import script that depends on universities.
 * Usage: npx tsx scripts/seedUniversities.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All 39 985 universities + branch campuses
const UNIVERSITIES_985 = [
  { name: '北京大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '中国人民大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '清华大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '北京航空航天大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '北京理工大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '中国农业大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '北京师范大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '中央民族大学', province: '北京', level: '985', is985: true, is211: true },
  { name: '南开大学', province: '天津', level: '985', is985: true, is211: true },
  { name: '天津大学', province: '天津', level: '985', is985: true, is211: true },
  { name: '大连理工大学', province: '辽宁', level: '985', is985: true, is211: true },
  { name: '东北大学', province: '辽宁', level: '985', is985: true, is211: true },
  { name: '吉林大学', province: '吉林', level: '985', is985: true, is211: true },
  { name: '哈尔滨工业大学', province: '黑龙江', level: '985', is985: true, is211: true },
  { name: '复旦大学', province: '上海', level: '985', is985: true, is211: true },
  { name: '同济大学', province: '上海', level: '985', is985: true, is211: true },
  { name: '上海交通大学', province: '上海', level: '985', is985: true, is211: true },
  { name: '华东师范大学', province: '上海', level: '985', is985: true, is211: true },
  { name: '南京大学', province: '江苏', level: '985', is985: true, is211: true },
  { name: '东南大学', province: '江苏', level: '985', is985: true, is211: true },
  { name: '浙江大学', province: '浙江', level: '985', is985: true, is211: true },
  { name: '中国科学技术大学', province: '安徽', level: '985', is985: true, is211: true },
  { name: '厦门大学', province: '福建', level: '985', is985: true, is211: true },
  { name: '山东大学', province: '山东', level: '985', is985: true, is211: true },
  { name: '中国海洋大学', province: '山东', level: '985', is985: true, is211: true },
  { name: '武汉大学', province: '湖北', level: '985', is985: true, is211: true },
  { name: '华中科技大学', province: '湖北', level: '985', is985: true, is211: true },
  { name: '湖南大学', province: '湖南', level: '985', is985: true, is211: true },
  { name: '中南大学', province: '湖南', level: '985', is985: true, is211: true },
  { name: '中山大学', province: '广东', level: '985', is985: true, is211: true },
  { name: '华南理工大学', province: '广东', level: '985', is985: true, is211: true },
  { name: '四川大学', province: '四川', level: '985', is985: true, is211: true },
  { name: '电子科技大学', province: '四川', level: '985', is985: true, is211: true },
  { name: '重庆大学', province: '重庆', level: '985', is985: true, is211: true },
  { name: '西安交通大学', province: '陕西', level: '985', is985: true, is211: true },
  { name: '西北工业大学', province: '陕西', level: '985', is985: true, is211: true },
  { name: '西北农林科技大学', province: '陕西', level: '985', is985: true, is211: true },
  { name: '兰州大学', province: '甘肃', level: '985', is985: true, is211: true },
  { name: '国防科技大学', province: '湖南', level: '985', is985: true, is211: true },
];

// 985 branch campuses
const BRANCHES = [
  { name: '哈尔滨工业大学(深圳)', province: '广东', level: '985', is985: true, is211: true },
  { name: '哈尔滨工业大学(威海)', province: '山东', level: '985', is985: true, is211: true },
  { name: '东北大学秦皇岛分校', province: '河北', level: '985', is985: true, is211: true },
  { name: '山东大学(威海)', province: '山东', level: '985', is985: true, is211: true },
  { name: '中国人民大学(苏州)', province: '江苏', level: '985', is985: true, is211: true },
  { name: '北京师范大学(珠海)', province: '广东', level: '985', is985: true, is211: true },
  { name: '北京大学医学部', province: '北京', level: '985', is985: true, is211: true },
];

// Major 211 universities not already in 985 list
const UNIVERSITIES_211 = [
  { name: '北京交通大学', province: '北京' },
  { name: '北京工业大学', province: '北京' },
  { name: '北京科技大学', province: '北京' },
  { name: '北京化工大学', province: '北京' },
  { name: '北京邮电大学', province: '北京' },
  { name: '北京林业大学', province: '北京' },
  { name: '北京中医药大学', province: '北京' },
  { name: '北京外国语大学', province: '北京' },
  { name: '中国传媒大学', province: '北京' },
  { name: '中央财经大学', province: '北京' },
  { name: '对外经济贸易大学', province: '北京' },
  { name: '北京体育大学', province: '北京' },
  { name: '中国政法大学', province: '北京' },
  { name: '中国矿业大学(北京)', province: '北京' },
  { name: '中国石油大学(北京)', province: '北京' },
  { name: '中国地质大学(北京)', province: '北京' },
  { name: '华北电力大学', province: '北京' },
  { name: '上海财经大学', province: '上海' },
  { name: '上海大学', province: '上海' },
  { name: '东华大学', province: '上海' },
  { name: '上海外国语大学', province: '上海' },
  { name: '华东理工大学', province: '上海' },
  { name: '南京航空航天大学', province: '江苏' },
  { name: '南京理工大学', province: '江苏' },
  { name: '中国矿业大学', province: '江苏' },
  { name: '河海大学', province: '江苏' },
  { name: '江南大学', province: '江苏' },
  { name: '南京农业大学', province: '江苏' },
  { name: '中国药科大学', province: '江苏' },
  { name: '南京师范大学', province: '江苏' },
  { name: '苏州大学', province: '江苏' },
  { name: '武汉理工大学', province: '湖北' },
  { name: '华中农业大学', province: '湖北' },
  { name: '华中师范大学', province: '湖北' },
  { name: '中南财经政法大学', province: '湖北' },
  { name: '中国地质大学(武汉)', province: '湖北' },
  { name: '暨南大学', province: '广东' },
  { name: '华南师范大学', province: '广东' },
  { name: '西南交通大学', province: '四川' },
  { name: '西南财经大学', province: '四川' },
  { name: '四川农业大学', province: '四川' },
  { name: '西南大学', province: '重庆' },
  { name: '西安电子科技大学', province: '陕西' },
  { name: '长安大学', province: '陕西' },
  { name: '陕西师范大学', province: '陕西' },
  { name: '西北大学', province: '陕西' },
  { name: '合肥工业大学', province: '安徽' },
  { name: '安徽大学', province: '安徽' },
  { name: '福州大学', province: '福建' },
  { name: '南昌大学', province: '江西' },
  { name: '郑州大学', province: '河南' },
  { name: '湖南师范大学', province: '湖南' },
  { name: '广西大学', province: '广西' },
  { name: '云南大学', province: '云南' },
  { name: '贵州大学', province: '贵州' },
  { name: '太原理工大学', province: '山西' },
  { name: '河北工业大学', province: '天津' },
  { name: '大连海事大学', province: '辽宁' },
  { name: '东北师范大学', province: '吉林' },
  { name: '延边大学', province: '吉林' },
  { name: '东北林业大学', province: '黑龙江' },
  { name: '东北农业大学', province: '黑龙江' },
  { name: '哈尔滨工程大学', province: '黑龙江' },
  { name: '内蒙古大学', province: '内蒙古' },
  { name: '宁夏大学', province: '宁夏' },
  { name: '新疆大学', province: '新疆' },
  { name: '石河子大学', province: '新疆' },
  { name: '海南大学', province: '海南' },
  { name: '青海大学', province: '青海' },
  { name: '西藏大学', province: '西藏' },
  { name: '辽宁大学', province: '辽宁' },
  { name: '天津医科大学', province: '天津' },
  { name: '海军军医大学', province: '上海' },
  { name: '空军军医大学', province: '陕西' },
];

// 双一流高校（22所）
const SHUANG_YI_LIU = [
  { name: '上海中医药大学', province: '上海' },
  { name: '上海海洋大学', province: '上海' },
  { name: '上海科技大学', province: '上海' },
  { name: '中国人民公安大学', province: '北京' },
  { name: '中国科学院大学', province: '北京' },
  { name: '北京协和医学院', province: '北京' },
  { name: '华南农业大学', province: '广东' },
  { name: '南京信息工程大学', province: '江苏' },
  { name: '南京医科大学', province: '江苏' },
  { name: '南京林业大学', province: '江苏' },
  { name: '南京邮电大学', province: '江苏' },
  { name: '南方医科大学', province: '广东' },
  { name: '南方科技大学', province: '广东' },
  { name: '天津工业大学', province: '天津' },
  { name: '山西大学', province: '山西' },
  { name: '广州中医药大学', province: '广东' },
  { name: '广州医科大学', province: '广东' },
  { name: '成都理工大学', province: '四川' },
  { name: '河南大学', province: '河南' },
  { name: '湘潭大学', province: '湖南' },
  { name: '西南石油大学', province: '四川' },
  { name: '首都师范大学', province: '北京' },
];

// 强势双非（25所）
const QIANG_SHI_SHUANG_FEI = [
  { name: '深圳大学', province: '广东' },
  { name: '浙江工业大学', province: '浙江' },
  { name: '江苏大学', province: '江苏' },
  { name: '扬州大学', province: '江苏' },
  { name: '南京工业大学', province: '江苏' },
  { name: '杭州电子科技大学', province: '浙江' },
  { name: '广东工业大学', province: '广东' },
  { name: '燕山大学', province: '河北' },
  { name: '福建师范大学', province: '福建' },
  { name: '上海理工大学', province: '上海' },
  { name: '昆明理工大学', province: '云南' },
  { name: '西安建筑科技大学', province: '陕西' },
  { name: '西安理工大学', province: '陕西' },
  { name: '武汉科技大学', province: '湖北' },
  { name: '湖北大学', province: '湖北' },
  { name: '长沙理工大学', province: '湖南' },
  { name: '浙江师范大学', province: '浙江' },
  { name: '宁波大学', province: '浙江' },
  { name: '杭州师范大学', province: '浙江' },
  { name: '河北大学', province: '河北' },
  { name: '山西医科大学', province: '山西' },
  { name: '青岛大学', province: '山东' },
  { name: '山东科技大学', province: '山东' },
  { name: '河南科技大学', province: '河南' },
  { name: '河南师范大学', province: '河南' },
];

// Other key universities not in any list but mentioned in plans
const OTHER_KEY = [
  { name: '中国石油大学(华东)', province: '山东' },
  { name: '华北电力大学(保定)', province: '河北' },
  { name: '上海交通大学医学院', province: '上海' },
  { name: '复旦大学上海医学院', province: '上海' },
  { name: '首都医科大学', province: '北京' },
  { name: '中国社会科学院大学', province: '北京' },
  { name: '西湖大学', province: '浙江' },
  { name: '温州医科大学', province: '浙江' },
  { name: '浙江中医药大学', province: '浙江' },
  { name: '中国计量大学', province: '浙江' },
  { name: '浙江财经大学', province: '浙江' },
  { name: '浙江农林大学', province: '浙江' },
  { name: '浙江科技大学', province: '浙江' },
  { name: '浙江工商大学', province: '浙江' },
  { name: '浙江理工大学', province: '浙江' },
  { name: '温州大学', province: '浙江' },
  { name: '广东外语外贸大学', province: '广东' },
  { name: '广州大学', province: '广东' },
  { name: '汕头大学', province: '广东' },
  { name: '东莞理工学院', province: '广东' },
  { name: '佛山科学技术学院', province: '广东' },
  { name: '北京工商大学', province: '北京' },
  { name: '北京建筑大学', province: '北京' },
  { name: '北京信息科技大学', province: '北京' },
  { name: '南京财经大学', province: '江苏' },
  { name: '南京审计大学', province: '江苏' },
  { name: '常州大学', province: '江苏' },
  { name: '苏州科技大学', province: '江苏' },
  { name: '南通大学', province: '江苏' },
  { name: '上海对外经贸大学', province: '上海' },
  { name: '上海海事大学', province: '上海' },
  { name: '上海政法学院', province: '上海' },
  { name: '华东政法大学', province: '上海' },
  { name: '上海师范大学', province: '上海' },
  { name: '上海电力大学', province: '上海' },
  { name: '上海工程技术大学', province: '上海' },
  { name: '上海应用技术大学', province: '上海' },
  { name: '上海第二工业大学', province: '上海' },
  { name: '四川师范大学', province: '四川' },
  { name: '西南民族大学', province: '四川' },
  { name: '成都大学', province: '四川' },
  { name: '湖北工业大学', province: '湖北' },
  { name: '武汉工程大学', province: '湖北' },
  { name: '湖北经济学院', province: '湖北' },
  { name: '三峡大学', province: '湖北' },
  { name: '长江大学', province: '湖北' },
  { name: '中南民族大学', province: '湖北' },
  { name: '济南大学', province: '山东' },
  { name: '山东师范大学', province: '山东' },
  { name: '山东财经大学', province: '山东' },
  { name: '曲阜师范大学', province: '山东' },
  { name: '西安邮电大学', province: '陕西' },
  { name: '西安外国语大学', province: '陕西' },
  { name: '西北政法大学', province: '陕西' },
  { name: '陕西科技大学', province: '陕西' },
  { name: '西安科技大学', province: '陕西' },
  { name: '西安工业大学', province: '陕西' },
  { name: '长沙学院', province: '湖南' },
  { name: '湖南农业大学', province: '湖南' },
  { name: '南华大学', province: '湖南' },
  { name: '湖南科技大学', province: '湖南' },
  { name: '湖南工业大学', province: '湖南' },
  { name: '吉首大学', province: '湖南' },
  { name: '湖南工商大学', province: '湖南' },
  { name: '中南林业科技大学', province: '湖南' },
  { name: '河北师范大学', province: '河北' },
  { name: '河北科技大学', province: '河北' },
  { name: '河北农业大学', province: '河北' },
  { name: '河北医科大学', province: '河北' },
  { name: '石家庄铁道大学', province: '河北' },
  { name: '华北理工大学', province: '河北' },
  { name: '安徽师范大学', province: '安徽' },
  { name: '安徽工业大学', province: '安徽' },
  { name: '安徽理工大学', province: '安徽' },
  { name: '江西财经大学', province: '江西' },
  { name: '江西师范大学', province: '江西' },
  { name: '南昌航空大学', province: '江西' },
  { name: '广西师范大学', province: '广西' },
  { name: '桂林电子科技大学', province: '广西' },
  { name: '云南师范大学', province: '云南' },
  { name: '昆明医科大学', province: '云南' },
  { name: '贵州师范大学', province: '贵州' },
  { name: '贵州财经大学', province: '贵州' },
  { name: '重庆邮电大学', province: '重庆' },
  { name: '重庆交通大学', province: '重庆' },
  { name: '重庆师范大学', province: '重庆' },
  { name: '重庆理工大学', province: '重庆' },
  { name: '重庆工商大学', province: '重庆' },
  { name: '华南农业大学珠江学院', province: '广东' },
  { name: '广东财经大学', province: '广东' },
  { name: '广东海洋大学', province: '广东' },
  { name: '广东医科大学', province: '广东' },
  { name: '广东药科大学', province: '广东' },
  { name: '五邑大学', province: '广东' },
  { name: '仲恺农业工程学院', province: '广东' },
  { name: '惠州学院', province: '广东' },
  { name: '肇庆学院', province: '广东' },
  { name: '嘉应学院', province: '广东' },
  { name: '韶关学院', province: '广东' },
  { name: '岭南师范学院', province: '广东' },
  { name: '韩山师范学院', province: '广东' },
  { name: '广东石油化工学院', province: '广东' },
  { name: '深圳技术大学', province: '广东' },
  { name: '电子科技大学成都学院', province: '四川' },
  { name: '三亚学院', province: '海南' },
  { name: '华侨大学', province: '福建' },
  { name: '集美大学', province: '福建' },
  { name: '福建农林大学', province: '福建' },
  { name: '福建理工大学', province: '福建' },
  { name: '福建医科大学', province: '福建' },
  { name: '闽南师范大学', province: '福建' },
  { name: '河南理工大学', province: '河南' },
  { name: '河南工业大学', province: '河南' },
  { name: '河南农业大学', province: '河南' },
  { name: '河南财经政法大学', province: '河南' },
  { name: '华北水利水电大学', province: '河南' },
  { name: '辽宁师范大学', province: '辽宁' },
  { name: '沈阳工业大学', province: '辽宁' },
  { name: '沈阳航空航天大学', province: '辽宁' },
  { name: '沈阳建筑大学', province: '辽宁' },
  { name: '大连交通大学', province: '辽宁' },
  { name: '大连工业大学', province: '辽宁' },
  { name: '大连大学', province: '辽宁' },
  { name: '渤海大学', province: '辽宁' },
  { name: '黑龙江大学', province: '黑龙江' },
  { name: '哈尔滨理工大学', province: '黑龙江' },
  { name: '哈尔滨商业大学', province: '黑龙江' },
  { name: '齐齐哈尔大学', province: '黑龙江' },
];

async function main() {
  console.log('========== Seed Universities ==========');

  const allUnis = [...UNIVERSITIES_985, ...BRANCHES, ...UNIVERSITIES_211, ...SHUANG_YI_LIU, ...QIANG_SHI_SHUANG_FEI, ...OTHER_KEY];

  let count = 0;
  for (let i = 0; i < allUnis.length; i++) {
    const u = allUnis[i];
    try {
      // Use Prisma client upsert - check by code first
      const code = `UNI-${String(i).padStart(4, '0')}`;
      const existing = await prisma.$queryRawUnsafe<{id: string}[]>(
        `SELECT id FROM data.universities WHERE "name" = $1 LIMIT 1`,
        u.name
      );
      if (existing.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE data.universities SET province_code = $1, level = $2, is985 = $3, is211 = $4, is_double_first = $5
           WHERE id = $6`,
          u.province, u.level || '211', u.is985 || false, u.is211 || true, true, existing[0].id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO data.universities (id, code, name, province_code, level, type, tags, is985, is211, is_double_first)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, ARRAY[$6]::text[], $7, $8, $9)`,
          code, u.name, u.province, u.level || '211', '综合', '本科', u.is985 || false, u.is211 || true, true
        );
      }
      count++;
    } catch (e: any) {
      console.warn(`  Failed to upsert #${i}: ${u.name} — ${e.message}`);
    }
  }

  // Verify
  const result = await prisma.$queryRawUnsafe<{cnt: number}[]>(
    `SELECT COUNT(*) as cnt FROM data.universities`
  );
  console.log(`\nTotal universities in DB: ${result[0].cnt}`);
  console.log(`Attempted to upsert: ${count}`);
  console.log('========== Done ==========');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
