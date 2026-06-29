import { readFileSync } from 'fs';
import { prisma } from '../src/lib/prisma';
import { parseBatchLinesMarkdown } from '../src/lib/markdownParsers';

const FILE_PATH =
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/01_各省分数线/2026/2026年全国各省高考分数线汇总.md';

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Importing batch lines from', FILE_PATH);

  let content: string;
  try {
    content = readFileSync(FILE_PATH, 'utf-8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read batch lines markdown:', error);
    process.exit(1);
  }

  const inputs = parseBatchLinesMarkdown(content);
  // eslint-disable-next-line no-console
  console.log(`Parsed ${inputs.length} batch line records`);

  // 幂等：清空旧数据
  await prisma.provinceBatchLine.deleteMany();

  if (inputs.length > 0) {
    await prisma.provinceBatchLine.createMany({
      data: inputs.map((input) => ({
        provinceCode: input.provinceCode,
        year: input.year,
        subjectType: input.subjectType,
        batch: input.batch,
        score: input.score,
        source: input.source ?? null,
      })),
      skipDuplicates: true,
    });
  }

  const count = await prisma.provinceBatchLine.count();
  // eslint-disable-next-line no-console
  console.log(`Batch lines imported: ${count}`);
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
