import { readFileSync } from 'fs';
import { prisma } from '../src/lib/prisma';
import { parseRankSegmentsMarkdown } from '../src/lib/markdownParsers';

const FILE_PATHS = [
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/02_各省位次表/2026/2026年全国一分一段表关键数据汇总.md',
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/02_各省位次表/2026/2026年全国各省分数线与位次对照表.md',
];

async function main(): Promise<void> {
  const allInputs: ReturnType<typeof parseRankSegmentsMarkdown> = [];

  for (const filePath of FILE_PATHS) {
    // eslint-disable-next-line no-console
    console.log('Parsing rank segments from', filePath);

    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read rank segments markdown:', filePath, error);
      continue;
    }

    const inputs = parseRankSegmentsMarkdown(content);
    // eslint-disable-next-line no-console
    console.log(`Parsed ${inputs.length} rank segment records from ${filePath}`);
    allInputs.push(...inputs);
  }

  // 幂等：清空旧数据
  await prisma.provinceRankSegment.deleteMany();

  if (allInputs.length > 0) {
    await prisma.provinceRankSegment.createMany({
      data: allInputs.map((input) => ({
        provinceCode: input.provinceCode,
        year: input.year,
        subjectType: input.subjectType,
        score: input.score,
        rank: input.rank,
        totalCount: input.totalCount ?? null,
        source: input.source ?? null,
      })),
      skipDuplicates: true,
    });
  }

  const count = await prisma.provinceRankSegment.count();
  // eslint-disable-next-line no-console
  console.log(`Rank segments imported: ${count}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
