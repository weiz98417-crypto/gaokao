/**
 * 导入专业招生详情数据到 majors 和 university_plans 表
 *
 * 数据源：
 *   1. 04_专业招生详情/2026/985高校各专业招生人数/*.md（约39个文件）
 *   2. 04_专业招生详情/2026/211高校各专业招生人数/*.md（约72个文件）
 *
 * 策略：
 *   1. 从文件名提取大学名
 *   2. 解析专业表格（专业名+招生人数+类别）
 *   3. majors 按 code 唯一键 upsert（批量 createMany skipDuplicates）
 *   4. university_plans 批量写入专业级招生计划
 *
 * 运行方式：npx tsx scripts/importMajors.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { prisma } from '../src/lib/prisma';
import {
  parseMajorDetailsMarkdown,
  type ParsedMajorDetail,
} from '../src/lib/markdownParsers';
import { resolveUniversityName } from '../src/lib/nameResolver';
import { getProvinceCode } from '../src/constants/provinceCodes';

const DATA_BASE =
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/04_专业招生详情/2026';

const DIRS = [
  `${DATA_BASE}/985高校各专业招生人数`,
  `${DATA_BASE}/211高校各专业招生人数`,
];

const YEAR = 2026;

/**
 * 从文件名提取大学名
 */
function extractUniversityFromFilename(filename: string): string | null {
  const match = filename.match(/^(.+?)_各专业招生人数\.md$/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * 生成专业代码（确保唯一性）
 */
function generateMajorCode(name: string, category: string): string {
  const catAbbr = (category || 'GEN').substring(0, 3).toUpperCase();
  const nameHash =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 1000;
  return `${catAbbr}_${name.length}_${nameHash.toString().padStart(3, '0')}`;
}

async function loadUniversityMap(): Promise<Map<string, string>> {
  const universities = await prisma.university.findMany({
    select: { id: true, name: true },
  });
  const map = new Map<string, string>();
  for (const u of universities) {
    map.set(u.name, u.id);
  }
  return map;
}

/**
 * 收集所有文件中的专业数据
 */
function collectAllMajors(
  allFiles: { filePath: string; universityName: string }[]
): { majorName: string; category: string }[] {
  const seen = new Set<string>();
  const majors: { majorName: string; category: string }[] = [];

  for (const { filePath } of allFiles) {
    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const parsed = parseMajorDetailsMarkdown(content);
    for (const entry of parsed) {
      if (!entry.majorName || entry.majorName.length < 2) continue;
      const key = `${entry.majorName}|${entry.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        majors.push({
          majorName: entry.majorName,
          category: entry.category || '未分类',
        });
      }
    }
  }

  return majors;
}

async function main(): Promise<void> {
  console.log('========== Import Majors ==========');

  const universityMap = await loadUniversityMap();
  console.log(`Loaded ${universityMap.size} universities`);

  // 收集所有文件
  const allFiles: { filePath: string; universityName: string }[] = [];
  for (const dir of DIRS) {
    let files: string[];
    try {
      files = readdirSync(dir);
    } catch {
      console.warn(`[majors] 目录不存在: ${dir}`);
      continue;
    }
    for (const filename of files) {
      if (!filename.endsWith('.md')) continue;
      const uniName = extractUniversityFromFilename(filename);
      if (!uniName) {
        console.warn(`[majors] 无法从文件名提取大学名: ${filename}`);
        continue;
      }
      allFiles.push({
        filePath: pathResolve(dir, filename),
        universityName: uniName,
      });
    }
  }
  console.log(`Found ${allFiles.length} major detail files`);

  // === Phase 1: 收集并批量 upsert 所有专业 ===
  console.log('\n--- Phase 1: Upserting majors ---');
  const uniqueMajors = collectAllMajors(allFiles);
  console.log(`Collected ${uniqueMajors.length} unique majors`);

  // 清除旧 majors（保留 code 唯一键约束）
  // 使用 createMany skipDuplicates 批量写入
  let majorCreateCount = 0;
  const batchSize = 100;
  const newMajorRecords: { code: string; name: string; category: string; duration: number; degree: string }[] = [];

  for (const m of uniqueMajors) {
    const code = generateMajorCode(m.majorName, m.category);
    newMajorRecords.push({
      code,
      name: m.majorName,
      category: m.category,
      duration: 4,
      degree: '学士',
    });
  }

  // 分批写入（createMany 不支持 skipDuplicates 和大量数据的组合很好，分批更安全）
  for (let i = 0; i < newMajorRecords.length; i += batchSize) {
    const batch = newMajorRecords.slice(i, i + batchSize);
    try {
      await prisma.major.createMany({
        data: batch,
        skipDuplicates: true,
      });
      majorCreateCount += batch.length;
    } catch (error) {
      console.warn(`[majors] batch create error:`, (error as Error).message);
      // 逐条重试
      for (const record of batch) {
        try {
          await prisma.major.create({ data: record });
          majorCreateCount++;
        } catch {
          // skip duplicates
        }
      }
    }
  }

  // 重新加载 majors 映射
  const allMajors = await prisma.major.findMany({
    select: { id: true, name: true, code: true, category: true },
  });
  const majorNameToId = new Map<string, string>();
  for (const m of allMajors) {
    const key = `${m.name}|${m.category}`;
    if (!majorNameToId.has(key)) {
      majorNameToId.set(key, m.id);
    }
  }
  console.log(`Majors in DB: ${allMajors.length}, name map: ${majorNameToId.size}`);

  // === Phase 2: 逐文件解析并批量导入 university_plans ===
  console.log('\n--- Phase 2: Importing university plans ---');

  // 清除旧的 plan 数据（只清除全国和本年度的）
  const deletedMajors = await prisma.universityPlan.deleteMany({
    where: { year: YEAR },
  });
  console.log(`Deleted ${deletedMajors.count} existing plans (year=${YEAR})`);

  const candidates = Array.from(universityMap.keys());
  let totalPlans = 0;
  const planBatch: {
    universityId: string;
    majorId: string;
    provinceCode: string;
    year: number;
    batch: string;
    planCount: number;
  }[] = [];

  for (const { filePath, universityName } of allFiles) {
    const resolvedUniName = resolveUniversityName(universityName, candidates);
    const universityId = universityMap.get(resolvedUniName);
    if (!universityId) {
      console.warn(
        `[majors] 无法解析院校: "${universityName}" -> "${resolvedUniName}"`
      );
      continue;
    }

    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      console.warn(`[majors] 无法读取: ${filePath}`);
      continue;
    }

    const parsed = parseMajorDetailsMarkdown(content);
    console.log(
      `  ${universityName}: ${parsed.length} majors parsed`
    );

    for (const entry of parsed) {
      if (!entry.majorName || entry.majorName.length < 2) continue;
      const majorKey = `${entry.majorName}|${entry.category || '未分类'}`;
      const majorId = majorNameToId.get(majorKey);
      if (!majorId) {
        console.warn(
          `[majors] major not found: "${entry.majorName}" / ${entry.category}`
        );
        continue;
      }

      // 有省份配额时逐省写入
      if (entry.provinceQuotas.length > 0) {
        for (const pq of entry.provinceQuotas) {
          const pCode = getProvinceCode(pq.provinceName);
          if (pCode === '00') continue;

          planBatch.push({
            universityId,
            majorId,
            provinceCode: pCode,
            year: YEAR,
            batch: '本科',
            planCount: pq.quota,
          });
        }
      } else if (entry.planCount > 0) {
        // 全国招生人数
        planBatch.push({
          universityId,
          majorId,
          provinceCode: '00',
          year: YEAR,
          batch: '本科',
          planCount: entry.planCount,
        });
      }

      // 每 200 条批量写入一次
      if (planBatch.length >= 200) {
        try {
          await prisma.universityPlan.createMany({
            data: planBatch,
            skipDuplicates: true,
          });
          totalPlans += planBatch.length;
        } catch (error) {
          console.warn(
            `[majors] batch plan create error:`,
            (error as Error).message
          );
        }
        planBatch.length = 0;
      }
    }
  }

  // 写入剩余
  if (planBatch.length > 0) {
    try {
      await prisma.universityPlan.createMany({
        data: planBatch,
        skipDuplicates: true,
      });
      totalPlans += planBatch.length;
    } catch (error) {
      console.warn(`[majors] final batch error:`, (error as Error).message);
    }
  }

  const finalMajorCount = await prisma.major.count();
  const finalPlanCount = await prisma.universityPlan.count({
    where: { year: YEAR },
  });

  console.log(`\n========================================`);
  console.log(`Majors total in DB: ${finalMajorCount}`);
  console.log(`University plans (year=${YEAR}) total: ${finalPlanCount}`);
  console.log(`========================================`);
}

main()
  .catch((error) => {
    console.error('importMajors failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
