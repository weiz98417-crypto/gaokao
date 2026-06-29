/**
 * 构建城市-院校映射并导入 city_university_map 表
 *
 * 策略：
 *   1. 内置一份 985/211/双一流 院校的所在地映射表（至少 60 条）
 *   2. 遍历 universities 表，匹配映射表确定城市
 *   3. 幂等：先 DELETE 全表，再批量 INSERT
 *
 * 运行方式：npx tsx scripts/importCityUniversityMap.ts
 */

import { prisma } from '../src/lib/prisma';

/**
 * 985/211 院校 → 所在城市映射表
 *
 * 覆盖：39 所 985 + 主要 211 + 行业特色院校 + 异地校区
 */
const UNIVERSITY_CITY_MAP: Record<string, { city: string; provinceCode: string }> = {
  // ===== 985 院校（39所） =====
  '北京大学': { city: '北京市', provinceCode: '11' },
  '清华大学': { city: '北京市', provinceCode: '11' },
  '中国人民大学': { city: '北京市', provinceCode: '11' },
  '北京航空航天大学': { city: '北京市', provinceCode: '11' },
  '北京理工大学': { city: '北京市', provinceCode: '11' },
  '北京师范大学': { city: '北京市', provinceCode: '11' },
  '中国农业大学': { city: '北京市', provinceCode: '11' },
  '中央民族大学': { city: '北京市', provinceCode: '11' },
  '复旦大学': { city: '上海市', provinceCode: '31' },
  '上海交通大学': { city: '上海市', provinceCode: '31' },
  '同济大学': { city: '上海市', provinceCode: '31' },
  '华东师范大学': { city: '上海市', provinceCode: '31' },
  '南京大学': { city: '南京市', provinceCode: '32' },
  '东南大学': { city: '南京市', provinceCode: '32' },
  '浙江大学': { city: '杭州市', provinceCode: '33' },
  '中国科学技术大学': { city: '合肥市', provinceCode: '34' },
  '武汉大学': { city: '武汉市', provinceCode: '42' },
  '华中科技大学': { city: '武汉市', provinceCode: '42' },
  '中山大学': { city: '广州市', provinceCode: '44' },
  '华南理工大学': { city: '广州市', provinceCode: '44' },
  '四川大学': { city: '成都市', provinceCode: '51' },
  '电子科技大学': { city: '成都市', provinceCode: '51' },
  '重庆大学': { city: '重庆市', provinceCode: '50' },
  '西安交通大学': { city: '西安市', provinceCode: '61' },
  '西北工业大学': { city: '西安市', provinceCode: '61' },
  '西北农林科技大学': { city: '咸阳市', provinceCode: '61' },
  '兰州大学': { city: '兰州市', provinceCode: '62' },
  '哈尔滨工业大学': { city: '哈尔滨市', provinceCode: '23' },
  '吉林大学': { city: '长春市', provinceCode: '22' },
  '东北大学': { city: '沈阳市', provinceCode: '21' },
  '大连理工大学': { city: '大连市', provinceCode: '21' },
  '山东大学': { city: '济南市', provinceCode: '37' },
  '中国海洋大学': { city: '青岛市', provinceCode: '37' },
  '天津大学': { city: '天津市', provinceCode: '12' },
  '南开大学': { city: '天津市', provinceCode: '12' },
  '厦门大学': { city: '厦门市', provinceCode: '35' },
  '中南大学': { city: '长沙市', provinceCode: '43' },
  '湖南大学': { city: '长沙市', provinceCode: '43' },
  '国防科技大学': { city: '长沙市', provinceCode: '43' },

  // ===== 985 异地校区 =====
  '哈尔滨工业大学(深圳)': { city: '深圳市', provinceCode: '44' },
  '哈尔滨工业大学(威海)': { city: '威海市', provinceCode: '37' },
  '北京师范大学(珠海校区)': { city: '珠海市', provinceCode: '44' },
  '中山大学(珠海校区)': { city: '珠海市', provinceCode: '44' },
  '中国人民大学(苏州校区)': { city: '苏州市', provinceCode: '32' },
  '东北大学秦皇岛分校': { city: '秦皇岛市', provinceCode: '13' },
  '山东大学(威海)': { city: '威海市', provinceCode: '37' },
  '山东大学(青岛)': { city: '青岛市', provinceCode: '37' },
  '大连理工大学(盘锦校区)': { city: '盘锦市', provinceCode: '21' },

  // ===== 主要 211 院校 =====
  '北京邮电大学': { city: '北京市', provinceCode: '11' },
  '北京交通大学': { city: '北京市', provinceCode: '11' },
  '北京科技大学': { city: '北京市', provinceCode: '11' },
  '北京化工大学': { city: '北京市', provinceCode: '11' },
  '北京林业大学': { city: '北京市', provinceCode: '11' },
  '北京工业大学': { city: '北京市', provinceCode: '11' },
  '北京外国语大学': { city: '北京市', provinceCode: '11' },
  '中国传媒大学': { city: '北京市', provinceCode: '11' },
  '中央财经大学': { city: '北京市', provinceCode: '11' },
  '对外经济贸易大学': { city: '北京市', provinceCode: '11' },
  '中国政法大学': { city: '北京市', provinceCode: '11' },
  '北京中医药大学': { city: '北京市', provinceCode: '11' },
  '北京体育大学': { city: '北京市', provinceCode: '11' },
  '中国地质大学(北京)': { city: '北京市', provinceCode: '11' },
  '中国石油大学(北京)': { city: '北京市', provinceCode: '11' },
  '中国矿业大学(北京)': { city: '北京市', provinceCode: '11' },
  '华北电力大学': { city: '北京市', provinceCode: '11' },
  '中央音乐学院': { city: '北京市', provinceCode: '11' },

  '上海财经大学': { city: '上海市', provinceCode: '31' },
  '上海外国语大学': { city: '上海市', provinceCode: '31' },
  '上海大学': { city: '上海市', provinceCode: '31' },
  '东华大学': { city: '上海市', provinceCode: '31' },
  '华东理工大学': { city: '上海市', provinceCode: '31' },

  '南京航空航天大学': { city: '南京市', provinceCode: '32' },
  '南京理工大学': { city: '南京市', provinceCode: '32' },
  '南京师范大学': { city: '南京市', provinceCode: '32' },
  '南京农业大学': { city: '南京市', provinceCode: '32' },
  '河海大学': { city: '南京市', provinceCode: '32' },
  '中国药科大学': { city: '南京市', provinceCode: '32' },
  '江南大学': { city: '无锡市', provinceCode: '32' },
  '中国矿业大学': { city: '徐州市', provinceCode: '32' },
  '苏州大学': { city: '苏州市', provinceCode: '32' },

  '武汉理工大学': { city: '武汉市', provinceCode: '42' },
  '华中师范大学': { city: '武汉市', provinceCode: '42' },
  '华中农业大学': { city: '武汉市', provinceCode: '42' },
  '中南财经政法大学': { city: '武汉市', provinceCode: '42' },
  '中国地质大学(武汉)': { city: '武汉市', provinceCode: '42' },

  '西安电子科技大学': { city: '西安市', provinceCode: '61' },
  '长安大学': { city: '西安市', provinceCode: '61' },
  '陕西师范大学': { city: '西安市', provinceCode: '61' },
  '西北大学': { city: '西安市', provinceCode: '61' },

  '西南交通大学': { city: '成都市', provinceCode: '51' },
  '西南财经大学': { city: '成都市', provinceCode: '51' },
  '四川农业大学': { city: '雅安市', provinceCode: '51' },

  '西南大学': { city: '重庆市', provinceCode: '50' },

  '华南师范大学': { city: '广州市', provinceCode: '44' },
  '暨南大学': { city: '广州市', provinceCode: '44' },

  '湖南师范大学': { city: '长沙市', provinceCode: '43' },

  '郑州大学': { city: '郑州市', provinceCode: '41' },

  '南昌大学': { city: '南昌市', provinceCode: '36' },

  '福州大学': { city: '福州市', provinceCode: '35' },

  '安徽大学': { city: '合肥市', provinceCode: '34' },
  '合肥工业大学': { city: '合肥市', provinceCode: '34' },

  '太原理工大学': { city: '太原市', provinceCode: '14' },

  '河北工业大学': { city: '天津市', provinceCode: '12' },

  '大连海事大学': { city: '大连市', provinceCode: '21' },
  '辽宁大学': { city: '沈阳市', provinceCode: '21' },

  '东北师范大学': { city: '长春市', provinceCode: '22' },
  '延边大学': { city: '延吉市', provinceCode: '22' },

  '哈尔滨工程大学': { city: '哈尔滨市', provinceCode: '23' },
  '东北林业大学': { city: '哈尔滨市', provinceCode: '23' },
  '东北农业大学': { city: '哈尔滨市', provinceCode: '23' },

  '内蒙古大学': { city: '呼和浩特市', provinceCode: '15' },

  '宁夏大学': { city: '银川市', provinceCode: '64' },

  '新疆大学': { city: '乌鲁木齐市', provinceCode: '65' },
  '石河子大学': { city: '石河子市', provinceCode: '65' },

  '青海大学': { city: '西宁市', provinceCode: '63' },

  '西藏大学': { city: '拉萨市', provinceCode: '54' },

  '海南大学': { city: '海口市', provinceCode: '46' },

  '广西大学': { city: '南宁市', provinceCode: '45' },

  '云南大学': { city: '昆明市', provinceCode: '53' },

  '贵州大学': { city: '贵阳市', provinceCode: '52' },

  // ===== 行业特色院校（非211但重要） =====
  '东北电力大学': { city: '吉林市', provinceCode: '22' },
  '上海电力大学': { city: '上海市', provinceCode: '31' },
  '三峡大学': { city: '宜昌市', provinceCode: '42' },
  '长沙理工大学': { city: '长沙市', provinceCode: '43' },
  '南京工程学院': { city: '南京市', provinceCode: '32' },
  '沈阳工程学院': { city: '沈阳市', provinceCode: '21' },
  '兰州交通大学': { city: '兰州市', provinceCode: '62' },
  '石家庄铁道大学': { city: '石家庄市', provinceCode: '13' },
  '大连交通大学': { city: '大连市', provinceCode: '21' },
  '华东交通大学': { city: '南昌市', provinceCode: '36' },
  '华南农业大学': { city: '广州市', provinceCode: '44' },
  '南方医科大学': { city: '广州市', provinceCode: '44' },
  '广州医科大学': { city: '广州市', provinceCode: '44' },
  '广州中医药大学': { city: '广州市', provinceCode: '44' },
  '深圳大学': { city: '深圳市', provinceCode: '44' },
  '广东工业大学': { city: '广州市', provinceCode: '44' },
  '浙江工业大学': { city: '杭州市', provinceCode: '33' },
  '南京工业大学': { city: '南京市', provinceCode: '32' },
  '首都师范大学': { city: '北京市', provinceCode: '11' },
  '浙江师范大学': { city: '金华市', provinceCode: '33' },
  '福建师范大学': { city: '福州市', provinceCode: '35' },
};

async function main(): Promise<void> {
  console.log('========== Import City-University Map ==========');

  // 加载 universities 表
  const universities = await prisma.university.findMany({
    select: { id: true, name: true },
  });
  console.log(`Loaded ${universities.length} universities from DB`);

  // 构建映射
  const entries: {
    universityId: string;
    cityName: string;
    provinceCode: string;
  }[] = [];

  let matched = 0;
  let unmatched = 0;

  for (const uni of universities) {
    const cityInfo = UNIVERSITY_CITY_MAP[uni.name];

    if (cityInfo) {
      entries.push({
        universityId: uni.id,
        cityName: cityInfo.city,
        provinceCode: cityInfo.provinceCode,
      });
      matched++;
    } else {
      // 尝试用名称的前缀匹配
      // 例如 "中山大学" 可能匹配 "中山大学(珠海校区)" 的映射
      let found = false;
      for (const [mapName, mapInfo] of Object.entries(UNIVERSITY_CITY_MAP)) {
        if (
          uni.name.includes(mapName) ||
          mapName.includes(uni.name)
        ) {
          entries.push({
            universityId: uni.id,
            cityName: mapInfo.city,
            provinceCode: mapInfo.provinceCode,
          });
          matched++;
          found = true;
          break;
        }
      }

      if (!found) {
        // 尝试从 university 的 provinceCode 推断
        // 省级的默认城市
        const defaultCities: Record<string, string> = {
          '11': '北京市', '12': '天津市', '31': '上海市', '50': '重庆市',
        };
        const defaultCity = defaultCities[uni.name.length > 0 ? '' : ''] || '';
        unmatched++;
      }
    }
  }

  console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);

  // 幂等：清空全表
  const deleted = await prisma.cityUniversityMap.deleteMany();
  console.log(`Deleted ${deleted.count} existing city-university mappings`);

  // 批量插入
  if (entries.length > 0) {
    const chunkSize = 200;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      await prisma.cityUniversityMap.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
  }

  const finalCount = await prisma.cityUniversityMap.count();
  console.log(`\n========================================`);
  console.log(`City-university map imported: ${finalCount} records`);
  console.log(`========================================`);
}

main()
  .catch((error) => {
    console.error('importCityUniversityMap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
