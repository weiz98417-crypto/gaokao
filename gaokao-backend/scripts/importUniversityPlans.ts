/**
 * 导入 2026 年招生计划数据到 university_plans 表
 *
 * 数据源：2026_招生计划/ 下 30 个省级 md 文件
 *
 * 运行方式：npx tsx scripts/importUniversityPlans.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { prisma } from '../src/lib/prisma';
import {
  parsePlanSummariesMarkdown,
  type ParsedPlanSummary,
} from '../src/lib/markdownParsers';
import { resolveUniversityName } from '../src/lib/nameResolver';
import { getProvinceCode } from '../src/constants/provinceCodes';

const DATA_DIR =
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/03_大学招生计划/2026_招生计划';

const YEAR = 2026;
const PLACEHOLDER_MAJOR_CODE = 'ZZH0001';

/**
 * 从文件名提取省份名
 * 格式: "广东_2026招生计划.md" -> "广东"
 */
function extractProvinceFromFilename(filename: string): string | null {
  const match = filename.match(/^(.+?)_2026招生计划\.md$/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * 获取招生计划 md 文件列表（排除汇总/趋势类文件）
 */
function getPlanFiles(): string[] {
  const files = readdirSync(DATA_DIR);
  return files.filter((f) => {
    if (!f.endsWith('.md')) return false;
    // 排除汇总文件和特殊文件
    const excludePatterns = [
      '2026年全国',
      '985双一流',
      '其他省份',
    ];
    for (const pattern of excludePatterns) {
      if (f.startsWith(pattern)) return false;
    }
    return true;
  });
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

async function getPlaceholderMajorId(): Promise<string> {
  const major = await prisma.major.findUnique({
    where: { code: PLACEHOLDER_MAJOR_CODE },
  });
  if (!major) {
    throw new Error(
      `Placeholder major "${PLACEHOLDER_MAJOR_CODE}" not found. Run importAdmissionScores first.`
    );
  }
  return major.id;
}

async function importFile(
  filePath: string,
  provinceName: string,
  universityMap: Map<string, string>,
  majorId: string
): Promise<number> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`[university plans] 无法读取: ${filePath}`, error);
    return 0;
  }

  const parsed = parsePlanSummariesMarkdown(content, provinceName);
  console.log(`  Parsed ${parsed.length} plans from ${provinceName}`);

  const provinceCode = getProvinceCode(provinceName);
  if (provinceCode === '00') {
    console.warn(`[university plans] 未知省份: "${provinceName}"`);
    return 0;
  }

  const candidates = Array.from(universityMap.keys());
  let imported = 0;
  const batch: {
    universityId: string;
    majorId: string;
    provinceCode: string;
    year: number;
    batch: string;
    planCount: number;
  }[] = [];

  for (const entry of parsed) {
    const resolvedName = resolveUniversityName(entry.universityName, candidates);
    const universityId = universityMap.get(resolvedName);

    if (!universityId) {
      console.warn(
        `[university plans] 无法解析院校: "${entry.universityName}" -> "${resolvedName}"`
      );
      continue;
    }

    batch.push({
      universityId,
      majorId,
      provinceCode,
      year: YEAR,
      batch: '本科',
      planCount: entry.planCount,
    });

    if (batch.length >= 200) {
      await prisma.universityPlan.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await prisma.universityPlan.createMany({
      data: batch,
      skipDuplicates: true,
    });
    imported += batch.length;
  }

  return imported;
}

async function main(): Promise<void> {
  console.log('========== Import University Plans ==========');

  const universityMap = await loadUniversityMap();
  const majorId = await getPlaceholderMajorId();

  // 幂等：按年份清空
  const deleted = await prisma.universityPlan.deleteMany({
    where: { year: YEAR },
  });
  console.log(`Deleted ${deleted.count} existing plans (year=${YEAR})`);

  const planFiles = getPlanFiles();
  console.log(`Found ${planFiles.length} province plan files\n`);

  let totalImported = 0;

  for (const filename of planFiles) {
    const provinceName = extractProvinceFromFilename(filename);
    if (!provinceName) {
      console.warn(`[university plans] 无法从文件名提取省份: ${filename}`);
      continue;
    }

    const filePath = pathResolve(DATA_DIR, filename);
    console.log(`Processing: ${filename} (${provinceName})`);
    const count = await importFile(filePath, provinceName, universityMap, majorId);
    totalImported += count;
    console.log(`  Imported ${count} records`);
  }

  const finalCount = await prisma.universityPlan.count({
    where: { year: YEAR },
  });
  console.log(`\n========================================`);
  console.log(`University plans imported: ${finalCount} total in DB`);
  console.log(`========================================`);
}

main()
  .catch((error) => {
    console.error('importUniversityPlans failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
