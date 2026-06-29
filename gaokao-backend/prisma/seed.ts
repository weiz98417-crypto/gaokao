import { prisma } from '../src/lib/prisma';
import { PROVINCE_CODE_MAP } from '../src/constants/provinceCodes';
import {
  PROVINCES,
  MOCK_RECOMMENDATIONS,
  RISK_DATA,
  RANK_LOOKUP,
} from '../src/data/mockData';

/**
 * 省份名称到行政区划代码映射（GB/T 2260）
 *
 * 实际映射来自 src/constants/provinceCodes，此处保留函数签名以兼容既有逻辑。
 */
function getProvinceCode(name: string): string {
  return PROVINCE_CODE_MAP[name] ?? '00';
}

/**
 * Seed 入口：将第一阶段 Mock 数据导入 PostgreSQL
 */
async function main(): Promise<void> {
  // 幂等：先清空旧数据
  await prisma.recommendation.deleteMany();
  await prisma.riskCheck.deleteMany();
  await prisma.rankLookup.deleteMany();
  await prisma.province.deleteMany();

  // 1. 省份数据
  await prisma.province.createMany({
    data: PROVINCES.map((province) => ({
      code: getProvinceCode(province.name),
      name: province.name,
      examMode: province.mode,
      totalScore: province.maxScore,
    })),
    skipDuplicates: true,
  });

  // 2. 推荐结果（每条推荐项作为独立 JSON 结果存储）
  for (const item of MOCK_RECOMMENDATIONS) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.recommendation.create({
      data: {
        result: item as unknown as Record<string, unknown>,
      },
    });
  }

  // 3. 风险诊断项
  await prisma.riskCheck.createMany({
    data: RISK_DATA.map((item, index) => ({
      name: item.name,
      status: item.status,
      detail: item.detail,
      sortOrder: index,
    })),
    skipDuplicates: true,
  });

  // 4. 分数位次映射（不绑定具体省份，作为通用映射）
  await prisma.rankLookup.createMany({
    data: Object.entries(RANK_LOOKUP).map(([scoreStr, info]) => ({
      score: Number(scoreStr),
      provinceCode: null,
      rank: info.rank,
      sameScore: info.sameScore,
      rangeMin: info.range[0],
      rangeMax: info.range[1],
    })),
    skipDuplicates: true,
  });

  const counts = {
    provinces: await prisma.province.count(),
    recommendations: await prisma.recommendation.count(),
    riskChecks: await prisma.riskCheck.count(),
    rankLookups: await prisma.rankLookup.count(),
  };

  // eslint-disable-next-line no-console
  console.log('Seed completed:', counts);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
