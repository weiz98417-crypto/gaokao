/**
 * 聚合导入脚本 — 按顺序执行全部 7 个导入任务
 *
 * 顺序：
 *   1. importBatchLines      — 省份批次线
 *   2. importRankSegments    — 关键段位位次
 *   3. importSubjectCoverage — 选科覆盖率
 *   4. importAdmissionScores — 录取位次数据
 *   5. importUniversityPlans — 招生计划数据
 *   6. importMajors          — 专业详情数据
 *   7. importCityUniversityMap — 城市-院校映射
 *
 * 任一步失败时打印错误并继续（非致命）。
 *
 * 运行方式：npx tsx scripts/importAll.ts
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

const SCRIPTS = [
  { name: 'importBatchLines', file: 'importBatchLines.ts' },
  { name: 'importRankSegments', file: 'importRankSegments.ts' },
  { name: 'importSubjectCoverage', file: 'importSubjectCoverage.ts' },
  { name: 'importAdmissionScores', file: 'importAdmissionScores.ts' },
  { name: 'importUniversityPlans', file: 'importUniversityPlans.ts' },
  { name: 'importMajors', file: 'importMajors.ts' },
  { name: 'importCityUniversityMap', file: 'importCityUniversityMap.ts' },
];

function runScript(scriptName: string, scriptFile: string): boolean {
  const scriptPath = resolve(__dirname, scriptFile);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Running: ${scriptName} (${scriptFile})`);
  console.log(`${'='.repeat(60)}`);

  try {
    execSync(`npx tsx "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
    });
    console.log(`  ✓ ${scriptName} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`  ✗ ${scriptName} FAILED:`, (error as Error).message);
    console.error(`  Continuing with next script...`);
    return false;
  }
}

async function main(): Promise<void> {
  const results: { name: string; success: boolean }[] = [];

  for (const { name, file } of SCRIPTS) {
    const success = runScript(name, file);
    results.push({ name, success });
  }

  // 汇总
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Import Summary');
  console.log(`${'='.repeat(60)}`);

  let passCount = 0;
  let failCount = 0;
  for (const { name, success } of results) {
    const status = success ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}  ${name}`);
    if (success) passCount++;
    else failCount++;
  }

  console.log(`\n  Total: ${passCount} passed, ${failCount} failed out of ${results.length}`);
  console.log(`${'='.repeat(60)}`);

  if (failCount > 0) {
    console.warn('\n  Some imports failed. Check logs above for details.');
  } else {
    console.log('\n  All imports completed successfully.');
  }
}

main().catch((error) => {
  console.error('importAll failed with unexpected error:', error);
  process.exit(1);
});
