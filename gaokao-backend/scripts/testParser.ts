import { parseAdmissionScoresMarkdown } from '../src/lib/markdownParsers';
import { readFileSync } from 'fs';

const content = readFileSync(
  'C:/Users/Administrator/Desktop/高考志愿填报数据库/03_大学招生计划/2025年全国985大学各省录取位次速查表.md',
  'utf-8'
);
const results = parseAdmissionScoresMarkdown(content, 2025);
console.log('Results count:', results.length);

// Check first 10 results
for (let i = 0; i < Math.min(10, results.length); i++) {
  console.log(`${i}: school="${results[i].universityName}" province="${results[i].provinceName}" score=${results[i].minScore} rank=${results[i].minRank}`);
}
