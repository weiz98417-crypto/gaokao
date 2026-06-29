import { readFileSync } from 'fs';
import { prisma } from '../src/lib/prisma';
import { parseSubjectCoverageMarkdown } from '../src/lib/markdownParsers';

const FILE_PATH =
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/04_专业招生详情/2026/2026年985高校专业选科要求对照表.md';

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Importing subject coverage from', FILE_PATH);

  let content: string;
  try {
    content = readFileSync(FILE_PATH, 'utf-8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read subject coverage markdown:', error);
    process.exit(1);
  }

  const inputs = parseSubjectCoverageMarkdown(content);
  // eslint-disable-next-line no-console
  console.log(`Parsed ${inputs.length} subject coverage records`);

  // 幂等：清空旧数据
  await prisma.subjectCoverage.deleteMany();

  if (inputs.length > 0) {
    await prisma.subjectCoverage.createMany({
      data: inputs.map((input) => ({
        provinceCode: input.provinceCode,
        year: input.year,
        subjects: input.subjects,
        coveragePct: input.coveragePct,
        totalMajors: input.totalMajors,
        source: input.source ?? null,
      })),
      skipDuplicates: true,
    });
  }

  const count = await prisma.subjectCoverage.count();
  // eslint-disable-next-line no-console
  console.log(`Subject coverage imported: ${count}`);
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
