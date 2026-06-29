/**
 * 导入录取位次数据到 admission_scores 表
 *
 * 数据源：
 *   1. 2025年全国985大学各省录取位次速查表.md
 *   2. 2025年全国211大学各省录取位次速查表.md
 *   3. 2025年行业特色院校录取位次速查表.md
 *   4. 2025年985高校各省实际录取分数线.md
 *
 * 运行方式：npx tsx scripts/importAdmissionScores.ts
 */

import { readFileSync } from 'fs';
import { prisma } from '../src/lib/prisma';
import {
  parseAdmissionScoresMarkdown,
  type ParsedAdmissionScore,
} from '../src/lib/markdownParsers';
import { resolveUniversityName } from '../src/lib/nameResolver';
import { getProvinceCode } from '../src/constants/provinceCodes';

const DATA_BASE =
  'C:/Users/Administrator/Desktop/高考志愿填报数据库';

const FILE_PATHS = [
  `${DATA_BASE}/03_大学招生计划/2025年全国985大学各省录取位次速查表.md`,
  `${DATA_BASE}/03_大学招生计划/2025年全国211大学各省录取位次速查表.md`,
  `${DATA_BASE}/03_大学招生计划/2025年行业特色院校录取位次速查表.md`,
];

const YEAR = 2025;
const PLACEHOLDER_MAJOR_CODE = 'ZZH0001';
const PLACEHOLDER_MAJOR_NAME = '综合招生';

async function ensurePlaceholderMajor(): Promise<string> {
  let major = await prisma.major.findUnique({
    where: { code: PLACEHOLDER_MAJOR_CODE },
  });

  if (!major) {
    major = await prisma.major.create({
      data: {
        code: PLACEHOLDER_MAJOR_CODE,
        name: PLACEHOLDER_MAJOR_NAME,
        category: '综合',
        duration: 4,
        degree: '学士',
      },
    });
    console.log(`Created placeholder major: ${PLACEHOLDER_MAJOR_NAME}`);
  }

  return major.id;
}

async function loadUniversityMap(): Promise<Map<string, string>> {
  const universities = await prisma.university.findMany({
    select: { id: true, name: true },
  });

  const map = new Map<string, string>();
  for (const u of universities) {
    map.set(u.name, u.id);
  }
  console.log(`Loaded ${map.size} universities for name resolution`);
  return map;
}

function resolveScore(
  parsed: ParsedAdmissionScore,
  universityMap: Map<string, string>
): {
  universityId: string;
  universityName: string;
} | null {
  const candidates = Array.from(universityMap.keys());
  const resolvedName = resolveUniversityName(parsed.universityName, candidates);

  const id = universityMap.get(resolvedName);
  if (!id) {
    console.warn(
      `[admission scores] 无法解析院校名: "${parsed.universityName}" -> "${resolvedName}"`
    );
    return null;
  }

  return { universityId: id, universityName: resolvedName };
}

async function importFromFile(
  filePath: string,
  universityMap: Map<string, string>,
  majorId: string
): Promise<number> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`[admission scores] 无法读取文件: ${filePath}`, error);
    return 0;
  }

  const parsed = parseAdmissionScoresMarkdown(content, YEAR);
  console.log(
    `  Parsed ${parsed.length} raw entries from ${filePath.split('/').pop()}`
  );

  let imported = 0;
  const batch: {
    universityId: string;
    majorId: string;
    provinceCode: string;
    year: number;
    batch: string;
    minScore: number | null;
    minRank: number | null;
  }[] = [];

  for (const entry of parsed) {
    const resolved = resolveScore(entry, universityMap);
    if (!resolved) continue;

    const provinceCode = getProvinceCode(entry.provinceName);
    if (provinceCode === '00') {
      console.warn(
        `[admission scores] 未知省份: "${entry.provinceName}"`
      );
      continue;
    }

    batch.push({
      universityId: resolved.universityId,
      majorId,
      provinceCode,
      year: entry.year,
      batch: entry.batch,
      minScore: entry.minScore,
      minRank: entry.minRank,
    });

    // 批量写入，每 200 条一批
    if (batch.length >= 200) {
      await prisma.admissionScore.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
      batch.length = 0;
    }
  }

  // 写入剩余
  if (batch.length > 0) {
    await prisma.admissionScore.createMany({
      data: batch,
      skipDuplicates: true,
    });
    imported += batch.length;
  }

  return imported;
}

async function main(): Promise<void> {
  console.log('========== Import Admission Scores ==========');

  // 确保占位专业存在
  const majorId = await ensurePlaceholderMajor();

  // 加载大学映射表
  const universityMap = await loadUniversityMap();

  // 幂等：按年份清空旧数据
  const deleted = await prisma.admissionScore.deleteMany({
    where: { year: YEAR },
  });
  console.log(`Deleted ${deleted.count} existing admission scores (year=${YEAR})`);

  let totalImported = 0;

  for (const filePath of FILE_PATHS) {
    console.log(`\nProcessing: ${filePath.split('/').pop()}`);
    const count = await importFromFile(filePath, universityMap, majorId);
    totalImported += count;
    console.log(`  Imported ${count} records from this file`);
  }

  const finalCount = await prisma.admissionScore.count({
    where: { year: YEAR },
  });
  console.log(`\n========================================`);
  console.log(`Admission scores imported: ${finalCount} total in DB`);
  console.log(`========================================`);
}

main()
  .catch((error) => {
    console.error('importAdmissionScores failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
