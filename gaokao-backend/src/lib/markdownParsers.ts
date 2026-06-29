/**
 * Markdown 数据解析工具
 *
 * 将桌面「高考志愿填报数据库」中的 markdown 汇总文件解析为结构化输入数据，
 * 供导入脚本写入 PostgreSQL。
 */

import type {
  ProvinceBatchLineInput,
  ProvinceRankSegmentInput,
  SubjectCoverageInput,
} from '../types';
import { getProvinceCode } from '../constants/provinceCodes';

// ============ 新增：数据导入用解析类型 ============

/** 录取位次解析结果（不含 UUID，由导入脚本解析） */
export interface ParsedAdmissionScore {
  universityName: string;
  provinceName: string;
  subjectType: string;
  year: number;
  minScore: number | null;
  minRank: number | null;
  batch: string;
}

/** 招生计划汇总解析结果 */
export interface ParsedPlanSummary {
  universityName: string;
  provinceName: string;
  planCount: number;
}

/** 专业招生详情解析结果 */
export interface ParsedMajorDetail {
  majorName: string;
  planCount: number;
  category: string;
  /** 各身份招生名额 */
  provinceQuotas: { provinceName: string; quota: number }[];
}

/** 当前数据年份 */
const CURRENT_YEAR = 2026;

/**
 * 解析批次线汇总 markdown
 * @param content markdown 文本
 * @returns 批次线输入数据
 */
export function parseBatchLinesMarkdown(
  content: string
): ProvinceBatchLineInput[] {
  const results: ProvinceBatchLineInput[] = [];
  const lines = content.split(/\r?\n/);
  let currentProvince = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 省份标题
    const provinceMatch = line.match(/^###\s+(.+)$/);
    if (provinceMatch) {
      currentProvince = provinceMatch[1].trim();
      continue;
    }

    // 停止解析对比速览等无关表格
    if (line.startsWith('## 四、') || line.startsWith('## 五、')) {
      currentProvince = '';
      continue;
    }

    if (!currentProvince || !line.startsWith('|')) {
      continue;
    }

    // 尝试解析当前表格
    const table = extractTable(lines, i);
    if (!table) {
      continue;
    }

    const parsed = parseBatchLineTable(table, currentProvince);
    if (parsed.length > 0) {
      results.push(...parsed);
      i = table.endIndex;
    }
  }

  return results;
}

/**
 * 解析关键段位位次 markdown（支持两份文件合并解析）
 * @param content markdown 文本
 * @returns 关键段位输入数据
 */
export function parseRankSegmentsMarkdown(
  content: string
): ProvinceRankSegmentInput[] {
  const results: ProvinceRankSegmentInput[] = [];

  // 优先尝试「关键数据汇总」格式
  const keyDataResults = parseKeyDataSummary(content);
  if (keyDataResults.length > 0) {
    results.push(...keyDataResults);
  }

  // 再尝试「分数线与位次对照表」格式
  const comparisonResults = parseScoreRankComparison(content);
  if (comparisonResults.length > 0) {
    results.push(...comparisonResults);
  }

  return results;
}

/**
 * 解析选科覆盖率 markdown
 * @param content markdown 文本
 * @returns 选科覆盖率输入数据
 */
export function parseSubjectCoverageMarkdown(
  content: string
): SubjectCoverageInput[] {
  const results: SubjectCoverageInput[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) {
      continue;
    }

    const table = extractTable(lines, i);
    if (!table) {
      continue;
    }

    const headers = table.rows[0].map((h) => h.trim());
    const comboIndex = headers.findIndex((h) => h.includes('选科组合'));
    const coverageIndex = headers.findIndex((h) => h.includes('覆盖率'));

    if (comboIndex < 0 || coverageIndex < 0) {
      i = table.endIndex;
      continue;
    }

    for (let r = 2; r < table.rows.length; r++) {
      const cells = table.rows[r];
      if (cells.length <= Math.max(comboIndex, coverageIndex)) {
        continue;
      }

      const comboText = cells[comboIndex].trim();
      const coverageText = cells[coverageIndex].trim();

      const subjects = parseSubjectCombo(comboText);
      if (subjects.length === 0) {
        console.warn(`[subject coverage] 无法解析选科组合：${comboText}`);
        continue;
      }

      const coveragePct = parseCoverageText(coverageText);
      if (coveragePct <= 0) {
        console.warn(`[subject coverage] 无法解析覆盖率：${coverageText}`);
        continue;
      }

      results.push({
        provinceCode: null,
        year: CURRENT_YEAR,
        subjects,
        coveragePct,
        totalMajors: 800,
        source: '2026年985高校专业选科要求对照表',
      });
    }

    i = table.endIndex;
  }

  return results;
}

// -------------------- 内部工具函数 --------------------

/**
 * 从行数组中提取一个 markdown 表格
 * @param lines 全部行
 * @param startIndex 表格起始行索引
 * @returns 表格数据及结束索引
 */
function extractTable(
  lines: string[],
  startIndex: number
): { rows: string[][]; endIndex: number } | null {
  const rows: string[][] = [];
  let i = startIndex;

  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) {
      break;
    }

    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter((_, index, arr) => index > 0 && index < arr.length - 1);

    if (cells.every((cell) => /^[-:]+$/.test(cell))) {
      continue;
    }

    rows.push(cells);
  }

  if (rows.length === 0) {
    return null;
  }

  return { rows, endIndex: i - 1 };
}

/**
 * 解析批次线表格
 * @param table 表格数据
 * @param provinceName 当前省份中文名
 * @returns 批次线输入数据
 */
function parseBatchLineTable(
  table: { rows: string[][] },
  provinceName: string
): ProvinceBatchLineInput[] {
  const results: ProvinceBatchLineInput[] = [];
  const provinceCode = getProvinceCode(provinceName);
  if (provinceCode === '00') {
    console.warn(`[batch lines] 未知省份：${provinceName}`);
    return [];
  }

  const headers = table.rows[0].map((h) => h.trim());
  const batchIndex = headers.findIndex((h) => h.includes('批次'));
  const subjectIndex = headers.findIndex((h) => h.includes('科类'));
  const categoryIndex = headers.findIndex((h) => h.includes('类别'));
  const scoreIndex = headers.findIndex((h) => h.includes('分数'));

  if (batchIndex < 0 || scoreIndex < 0) {
    return [];
  }

  const hasCategory = categoryIndex >= 0;
  const hasSubject = subjectIndex >= 0 && !hasCategory;

  for (let i = 1; i < table.rows.length; i++) {
    const cells = table.rows[i];
    if (cells.length <= Math.max(batchIndex, scoreIndex)) {
      continue;
    }

    const batchText = cells[batchIndex].trim();
    const scoreText = cells[scoreIndex].trim();
    const score = Number(scoreText);

    if (Number.isNaN(score)) {
      continue;
    }

    const batch = normalizeBatch(batchText);
    if (!batch) {
      continue;
    }

    let subjectType = '综合改革';
    if (hasCategory) {
      subjectType = normalizeSubjectType(cells[categoryIndex]?.trim() ?? '');
    } else if (hasSubject) {
      subjectType = normalizeSubjectType(cells[subjectIndex]?.trim() ?? '');
    } else {
      // 无科类列时按省份模式推断，3+3 用综合改革，其余默认物理
      subjectType = '综合改革';
    }

    if (!subjectType) {
      console.warn(`[batch lines] 无法识别科目类：${provinceName} ${batchText}`);
      continue;
    }

    results.push({
      provinceCode,
      year: CURRENT_YEAR,
      subjectType,
      batch,
      score,
      source: '2026年全国各省高考分数线汇总.md',
    });
  }

  return results;
}

/**
 * 解析「关键数据汇总」格式
 * @param content markdown 文本
 * @returns 关键段位输入数据
 */
function parseKeyDataSummary(content: string): ProvinceRankSegmentInput[] {
  const results: ProvinceRankSegmentInput[] = [];
  const lines = content.split(/\r?\n/);
  let currentProvince = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const provinceMatch = line.match(/^###\s+(.+)$/);
    if (provinceMatch) {
      currentProvince = provinceMatch[1].trim();
      continue;
    }

    if (!currentProvince || !line.startsWith('|')) {
      continue;
    }

    const table = extractTable(lines, i);
    if (!table) {
      continue;
    }

    const parsed = parseKeyDataTable(table, currentProvince);
    if (parsed.length > 0) {
      results.push(...parsed);
      i = table.endIndex;
      currentProvince = '';
    }
  }

  return results;
}

/**
 * 解析关键数据汇总表格
 * @param table 表格数据
 * @param provinceName 省份中文名
 * @returns 关键段位输入数据
 */
function parseKeyDataTable(
  table: { rows: string[][] },
  provinceName: string
): ProvinceRankSegmentInput[] {
  const results: ProvinceRankSegmentInput[] = [];
  const provinceCode = getProvinceCode(provinceName);
  if (provinceCode === '00') {
    return [];
  }

  const headers = table.rows[0].map((h) => h.trim());
  if (headers.length < 2) {
    return [];
  }

  const segmentIndex = 0;
  const subjectColumns: { subjectType: string; index: number }[] = [];

  for (let i = 1; i < headers.length; i++) {
    const subjectType = normalizeSubjectType(headers[i]);
    if (subjectType) {
      subjectColumns.push({ subjectType, index: i });
    }
  }

  if (subjectColumns.length === 0) {
    return [];
  }

  let totalCountBySubject: Record<string, number> = {};

  for (let i = 1; i < table.rows.length; i++) {
    const cells = table.rows[i];
    if (cells.length < headers.length) {
      continue;
    }

    const segmentText = cells[segmentIndex].trim();

    // 总考生数单独记录
    if (segmentText.includes('总考生数') || segmentText.includes('合计本科上线')) {
      for (const { subjectType, index } of subjectColumns) {
        const countText = cells[index].trim().replace(/,/g, '').replace(/—/g, '');
        const count = Number(countText);
        if (!Number.isNaN(count) && count > 0) {
          totalCountBySubject[subjectType] = count;
        }
      }
      continue;
    }

    const score = parseScoreSegment(segmentText);
    if (score === null) {
      continue;
    }

    for (const { subjectType, index } of subjectColumns) {
      const rankText = cells[index].trim().replace(/,/g, '').replace(/[~约]/g, '').replace(/—/g, '');
      const rank = Number(rankText);
      if (Number.isNaN(rank) || rank <= 0) {
        continue;
      }

      results.push({
        provinceCode,
        year: CURRENT_YEAR,
        subjectType,
        score,
        rank,
        source: '2026年全国一分一段表关键数据汇总.md',
      });
    }
  }

  // 回填 totalCount
  for (const result of results) {
    if (totalCountBySubject[result.subjectType]) {
      result.totalCount = totalCountBySubject[result.subjectType];
    }
  }

  return results;
}

/**
 * 解析「分数线与位次对照表」格式
 * @param content markdown 文本
 * @returns 关键段位输入数据
 */
function parseScoreRankComparison(content: string): ProvinceRankSegmentInput[] {
  const results: ProvinceRankSegmentInput[] = [];
  const lines = content.split(/\r?\n/);
  let currentSubjectType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('物理类/理科') || line.includes('理科')) {
      currentSubjectType = '物理';
      continue;
    }
    if (line.includes('历史类/文科') || line.includes('文科')) {
      currentSubjectType = '历史';
      continue;
    }

    if (!currentSubjectType || !line.startsWith('|')) {
      continue;
    }

    const table = extractTable(lines, i);
    if (!table) {
      continue;
    }

    const parsed = parseComparisonTable(table, currentSubjectType);
    if (parsed.length > 0) {
      results.push(...parsed);
      i = table.endIndex;
      currentSubjectType = '';
    }
  }

  return results;
}

/**
 * 解析分数线与位次对照表格
 * @param table 表格数据
 * @param subjectType 科目类
 * @returns 关键段位输入数据
 */
function parseComparisonTable(
  table: { rows: string[][] },
  subjectType: string
): ProvinceRankSegmentInput[] {
  const results: ProvinceRankSegmentInput[] = [];
  const headers = table.rows[0].map((h) => h.trim());

  const provinceIndex = headers.findIndex((h) => h.includes('省份'));
  const specialScoreIndex = headers.findIndex((h) => h.includes('特控线'));
  const specialRankIndex = headers.findIndex((h) => h.includes('特控线位次'));
  const undergraduateScoreIndex = headers.findIndex((h) => h === '本科线' || h.includes('本科线'));
  const undergraduateRankIndex = headers.findIndex((h) => h.includes('本科位次'));
  const highScoreIndex = headers.findIndex((h) => h.includes('600分+'));

  if (provinceIndex < 0) {
    return [];
  }

  for (let i = 1; i < table.rows.length; i++) {
    const cells = table.rows[i];
    if (cells.length < headers.length) {
      continue;
    }

    const provinceName = cells[provinceIndex].trim().replace(/\*/g, '');
    const provinceCode = getProvinceCode(provinceName);
    if (provinceCode === '00') {
      continue;
    }

    const addSegment = (scoreText: string, rankText: string, label: string) => {
      const score = Number(scoreText.replace(/[^0-9]/g, ''));
      const rank = Number(rankText.replace(/,/g, '').replace(/[~约]/g, '').replace(/[^0-9]/g, ''));
      if (Number.isNaN(score) || score <= 0 || Number.isNaN(rank) || rank <= 0) {
        return;
      }
      results.push({
        provinceCode,
        year: CURRENT_YEAR,
        subjectType,
        score,
        rank,
        source: `2026年全国各省分数线与位次对照表.md (${label})`,
      });
    };

    if (specialScoreIndex >= 0 && specialRankIndex >= 0) {
      addSegment(cells[specialScoreIndex], cells[specialRankIndex], '特控线');
    }
    if (undergraduateScoreIndex >= 0 && undergraduateRankIndex >= 0) {
      addSegment(cells[undergraduateScoreIndex], cells[undergraduateRankIndex], '本科线');
    }
    if (highScoreIndex >= 0) {
      const rankText = cells[highScoreIndex].trim().replace(/,/g, '').replace(/[~约]/g, '');
      const rank = Number(rankText.replace(/[^0-9]/g, ''));
      if (!Number.isNaN(rank) && rank > 0) {
        results.push({
          provinceCode,
          year: CURRENT_YEAR,
          subjectType,
          score: 600,
          rank,
          source: '2026年全国各省分数线与位次对照表.md (600分+)',
        });
      }
    }
  }

  return results;
}

/**
 * 解析分数段位文本为分数值
 * @param text 如 "690+"、"特控线"、"本科线"
 * @returns 分数值，无法解析或需从其他来源获取时返回 null
 */
function parseScoreSegment(text: string): number | null {
  const trimmed = text.trim();

  // 特控线/本科线在表格中没有分数，需从对照表补充，此处跳过
  if (trimmed === '特控线' || trimmed === '本科线') {
    return null;
  }
  if (trimmed === '200+') {
    return 200;
  }

  const match = trimmed.match(/^(\d+)\+?$/);
  if (match) {
    return Number(match[1]);
  }

  return null;
}

/**
 * 科目类名称归一化
 * @param text 原始科目类文本
 * @returns 归一化后的科目类
 */
function normalizeSubjectType(text: string): string {
  const trimmed = text.trim();

  // 优先提取括号内的科目关键字（如 "普通类（物理）"）
  const parenMatch = trimmed.match(/[（(]([^）)]+)[）)]/);
  if (parenMatch) {
    const inner = parenMatch[1].trim();
    const innerType = detectSubjectType(inner);
    if (innerType) {
      return innerType;
    }
  }

  return detectSubjectType(trimmed);
}

/**
 * 从文本中检测科目类关键字
 * @param text 文本
 * @returns 归一化科目类，无匹配返回空字符串
 */
function detectSubjectType(text: string): string {
  if (/物理/.test(text)) {
    return '物理';
  }
  if (/历史/.test(text)) {
    return '历史';
  }
  if (/文科|文史/.test(text)) {
    return '文科';
  }
  if (/理科|理工|留理工/.test(text)) {
    return '理科';
  }
  if (/A类/.test(text)) {
    return 'A类';
  }
  if (/B类/.test(text)) {
    return 'B类';
  }
  if (/综合|不分文理|统一/.test(text)) {
    return '综合改革';
  }

  return '';
}

/**
 * 批次名称归一化
 * @param text 原始批次文本
 * @returns 归一化后的批次简写
 */
function normalizeBatch(text: string): string {
  const normalized = text.trim();

  if (/特殊类型|特控|高校特殊类型|部分特殊类型/.test(normalized)) {
    return '特控';
  }
  if (/本科一批|一本/.test(normalized)) {
    return '一本';
  }
  if (/本科二批|二本/.test(normalized)) {
    return '二本';
  }
  if (/第一段|一段线|一段/.test(normalized)) {
    return '一段';
  }
  if (/第二段|二段线|二段/.test(normalized)) {
    return '二段';
  }
  if (/本科|普通类本科|最低控制线|普通类/.test(normalized)) {
    return '本科';
  }
  if (/专科|高职/.test(normalized)) {
    return '';
  }

  return '';
}

/**
 * 解析选科组合文本
 * @param text 如 "物理+化学+政治"
 * @returns 选科数组
 */
function parseSubjectCombo(text: string): string[] {
  const subjects = text
    .split(/[+＋,，/]/)
    .map((s) => s.trim())
    .filter((s) => /^(物理|历史|化学|生物|政治|地理)$/.test(s));
  return subjects;
}

/**
 * 根据描述文本估算覆盖率百分比
 * @param text 如 "737专业（最高）"、"高（纯理科）"
 * @returns 覆盖率（0~1）
 */
function parseCoverageText(text: string): number {
  const normalized = text.trim();

  // 优先匹配百分比数字
  const pctMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return Number(pctMatch[1]) / 100;
  }

  // 匹配 "X专业" 数量并估算
  const countMatch = normalized.match(/(\d+)\s*专业/);
  if (countMatch) {
    const count = Number(countMatch[1]);
    return Math.min(1, count / 800);
  }

  // 按定性描述映射
  if (normalized.includes('最高')) {
    return 0.96;
  }
  if (normalized.includes('高')) {
    return 0.9;
  }
  if (normalized.includes('较广') || normalized.includes('适中')) {
    return 0.75;
  }
  if (normalized.includes('下降') || normalized.includes('有限')) {
    return 0.55;
  }
  if (normalized.includes('较低')) {
    return 0.4;
  }
  if (normalized.includes('相似')) {
    return 0.45;
  }

  return 0;
}

// ============ 新增：位次速查表 / 招生计划 / 专业详情解析 ============

/**
 * 解析录取位次速查表（985 / 211 / 行业特色院校）
 *
 * 支持的表格格式：
 *   省份标题：## 一、广东省（新高考 3+1+2 · 物理类）
 *   表格列：| 位次区间 | 可报学校 | 代表院校及2025最低位次 |
 *   数据行：| 前500 | 清北华五 | 北大689(99位)、清华688(118位) |
 *
 * @param content markdown 文本
 * @param year 数据年份
 * @returns 录取位次解析结果数组
 */
export function parseAdmissionScoresMarkdown(
  content: string,
  year: number
): ParsedAdmissionScore[] {
  const results: ParsedAdmissionScore[] = [];
  const lines = content.split(/\r?\n/);
  let currentProvince = '';
  let currentSubjectType = '物理';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 识别省份标题
    const provinceMatch = line.match(/^##\s+[一二三四五六七八九十]+[、.]?\s*(.+)$/);
    if (provinceMatch) {
      const header = provinceMatch[1].trim();

      // 提取省份名
      const provName = extractProvinceFromHeader(header);
      if (provName) {
        currentProvince = provName;
      }

      // 提取科目类型
      if (/物理|理科|理工/.test(header)) {
        currentSubjectType = '物理';
      } else if (/历史|文科|文史/.test(header)) {
        currentSubjectType = '历史';
      } else if (/综合|3\+3|不分文理/.test(header)) {
        currentSubjectType = '综合改革';
      }

      continue;
    }

    // 识别子标题中的科目
    const subMatch = line.match(/^###\s+(.+)$/);
    if (subMatch) {
      const subHeader = subMatch[1].trim();
      if (/物理|理科/.test(subHeader)) {
        currentSubjectType = '物理';
      } else if (/历史|文科/.test(subHeader)) {
        currentSubjectType = '历史';
      }
      continue;
    }

    if (!currentProvince || !line.startsWith('|')) {
      continue;
    }

    // 提取表格
    const table = extractTable(lines, i);
    if (!table || table.rows.length < 2) {
      continue;
    }

    const headers = table.rows[0].map((h) => h.trim());
    // 找到「代表院校」或「说明」列（优先级：代表院校 > 说明 > 可报学校，用 findLastIndex）
    const schoolColIndex = headers.map((h, idx) => ({ h, idx }))
      .filter(({ h }) => h.includes('代表院校') || h.includes('说明') || h.includes('可报学校'))
      .pop()?.idx ?? -1;

    if (schoolColIndex < 0) {
      i = table.endIndex;
      continue;
    }

    // 跳过表头行（index 0 is header, index 1 may be separator, so start from 1)
    for (let r = 1; r < table.rows.length; r++) {
      const cells = table.rows[r];
      if (cells.length <= schoolColIndex) {
        continue;
      }

      const schoolText = cells[schoolColIndex].trim();

      // 解析「学校名分数(位次)」模式
      const entries = parseSchoolScoreRankEntries(schoolText);
      for (const entry of entries) {
        results.push({
          universityName: entry.schoolName,
          provinceName: currentProvince,
          subjectType: currentSubjectType,
          year,
          minScore: entry.score,
          minRank: entry.rank,
          batch: '本科',
        });
      }
    }

    i = table.endIndex;
  }

  return results;
}

/**
 * 解析一行中的学校分数位次信息
 * 格式: "北大689(99位)、清华688(118位)、上交688(112位)"
 *       "北邮657(2398位)"
 *       "湖南大学213组534(105687位)"
 */
function parseSchoolScoreRankEntries(
  text: string
): { schoolName: string; score: number | null; rank: number | null }[] {
  const results: { schoolName: string; score: number | null; rank: number | null }[] = [];

  // 移除 markdown 加粗标记
  const cleanText = text.replace(/\*\*/g, '');

  // 按「、」「,」「；」分割
  const parts = cleanText.split(/[、,，；;]+/).filter((p) => p.trim());

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // 模式1: "北大689(99位)" - 学校名+分数+(位次)
    // 模式2: "湖南大学213组534(105687位)" - 学校名含专业组
    // 模式3: "河工大(在津)600(26323位)" - 学校名含括号
    // 模式4: "~500(180000位)" - 只有分数和位次（跳过）

    // 尝试匹配：最后一个 数字(数字位) 模式
    const match = trimmed.match(/^(.+?)(\d+(?:\.\d+)?)\s*[（(]\s*(\d[\d,]*)\s*位?\s*[）)]$/);
    if (match) {
      const schoolName = match[1].replace(/[~≈约]/g, '').trim();
      const score = Number(match[2]);
      const rank = Number(match[3].replace(/,/g, ''));

      if (schoolName && schoolName.length >= 2 && !Number.isNaN(score) && !Number.isNaN(rank)) {
        results.push({
          schoolName: cleanSchoolName(schoolName),
          score: score > 0 ? score : null,
          rank: rank > 0 ? rank : null,
        });
      }
      continue;
    }

    // 模式B: "西电628(11738位)" - 简称+分数+(位次) 不带空格
    const matchB = trimmed.match(/^([^\d]+?)(\d+(?:\.\d+)?)\s*[（(]\s*(\d[\d,]*)\s*位?\s*[）)]$/);
    if (matchB) {
      const schoolName = matchB[1].replace(/[~≈约]/g, '').trim();
      const score = Number(matchB[2]);
      const rank = Number(matchB[3].replace(/,/g, ''));

      if (schoolName && schoolName.length >= 2 && !Number.isNaN(score) && !Number.isNaN(rank)) {
        results.push({
          schoolName: cleanSchoolName(schoolName),
          score: score > 0 ? score : null,
          rank: rank > 0 ? rank : null,
        });
      }
    }
  }

  return results;
}

/**
 * 清洗学校名（移除括号内的专业组号、校区等干扰信息）
 */
function cleanSchoolName(name: string): string {
  // 移除末尾括号内容如「213组」「(中外合作组)」
  let cleaned = name.replace(/[（(]\d+组[)）]/g, '');
  cleaned = cleaned.replace(/[（(][^)）]*组[)）]/g, '');
  // 移除末尾的「(中外合作)」「(预科)」等
  cleaned = cleaned.replace(/[（(](?:中外合作|预科|地方专项|少数民族)[^)）]*[)）]/g, '');
  // 移除末尾空格
  cleaned = cleaned.trim();
  return cleaned;
}

/**
 * 从省份标题中提取省份名
 */
function extractProvinceFromHeader(header: string): string {
  // 匹配已知省份名
  const provinceNames = [
    '广东', '河南', '四川', '山东', '河北', '江苏', '浙江', '湖北',
    '湖南', '安徽', '江西', '辽宁', '陕西', '山西', '广西', '云南',
    '贵州', '吉林', '黑龙江', '重庆', '甘肃', '宁夏', '青海', '新疆',
    '北京', '天津', '上海', '海南', '福建', '内蒙古', '西藏',
  ];

  for (const name of provinceNames) {
    if (header.includes(name)) {
      return name;
    }
  }

  return '';
}

/**
 * 解析招生计划汇总 markdown
 *
 * 格式：
 *   ## 二、本科招生计划（前100名）
 *   | 排名 | 院校 | 2026计划人数 |
 *   | 1 | 仲恺农业工程学院 | 8771 |
 *
 * @param content markdown 文本
 * @param provinceName 省份名（从文件名提取）
 * @returns 招生计划汇总解析结果
 */
export function parsePlanSummariesMarkdown(
  content: string,
  provinceName: string
): ParsedPlanSummary[] {
  const results: ParsedPlanSummary[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 查找本科招生计划表格
    if (!line.startsWith('|')) continue;

    const table = extractTable(lines, i);
    if (!table || table.rows.length < 2) continue;

    const headers = table.rows[0].map((h) => h.trim());
    const schoolIndex = headers.findIndex(
      (h) => h.includes('院校') || h.includes('学校')
    );
    const planIndex = headers.findIndex(
      (h) =>
        h.includes('计划人数') ||
        h.includes('招生计划') ||
        h.includes('招生人数') ||
        h.includes('计划')
    );

    if (schoolIndex < 0 || planIndex < 0) {
      i = table.endIndex;
      continue;
    }

    for (let r = 1; r < table.rows.length; r++) {
      const cells = table.rows[r];
      if (cells.length <= Math.max(schoolIndex, planIndex)) continue;

      const schoolName = cells[schoolIndex].trim().replace(/\*\*/g, '');
      const planText = cells[planIndex].trim().replace(/[~,，]/g, '');
      const planCount = Number(planText);

      if (!schoolName || Number.isNaN(planCount) || planCount <= 0) continue;
      if (schoolName === '院校' || schoolName === '排名') continue;

      results.push({
        universityName: schoolName,
        provinceName,
        planCount,
      });
    }

    i = table.endIndex;
  }

  return results;
}

/**
 * 解析专业招生详情 markdown
 *
 * 格式：
 *   ## 三、64个专业招生人数完整列表
 *   | 序号 | 专业名称 | 全国招生人数 | 类别 |
 *   | 1 | **临床医学** | **828人** | 医学 |
 *
 * 也支持：
 *   ### 理工类专业
 *   | 专业 | 招生人数 | 备注 |
 *
 * @param content markdown 文本
 * @returns 专业招生详情解析结果
 */
export function parseMajorDetailsMarkdown(content: string): ParsedMajorDetail[] {
  const results: ParsedMajorDetail[] = [];
  const lines = content.split(/\r?\n/);

  // 先解析各省招生配额
  const provinceQuotas = parseProvinceQuotas(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith('|')) continue;

    const table = extractTable(lines, i);
    if (!table || table.rows.length < 2) continue;

    const headers = table.rows[0].map((h) => h.trim());

    // 检查是否专业招生表格：必须包含专业名列
    const majorIndex = headers.findIndex(
      (h) =>
        h.includes('专业名称') ||
        h.includes('专业')
    );
    const countIndex = headers.findIndex(
      (h) =>
        h.includes('招生人数') ||
        h.includes('人数') ||
        h.includes('招生')
    );
    const categoryIndex = headers.findIndex(
      (h) =>
        h.includes('类别') ||
        h.includes('学科') ||
        h.includes('科类')
    );

    if (majorIndex < 0) {
      i = table.endIndex;
      continue;
    }

    for (let r = 1; r < table.rows.length; r++) {
      const cells = table.rows[r];
      if (cells.length <= majorIndex) continue;

      const majorName = cells[majorIndex].trim().replace(/\*\*/g, '');
      if (!majorName || majorName === '专业名称' || majorName === '序号') continue;

      let planCount = 0;
      if (countIndex >= 0 && cells.length > countIndex) {
        const countText = cells[countIndex].trim().replace(/[~人,，\*\s]/g, '');
        const num = Number(countText);
        if (!Number.isNaN(num) && num > 0) {
          planCount = num;
        }
      }

      // 如果 planCount 为 0 但 countText 为 "—"，跳过该行
      if (planCount === 0 && countIndex >= 0) {
        const rawCount = cells[countIndex]?.trim() || '';
        if (rawCount !== '—' && rawCount !== '-' && rawCount !== '') {
          // 可能是无法解析的数字，尝试数字提取
          const extracted = rawCount.match(/(\d+)/);
          if (extracted) {
            planCount = Number(extracted[1]);
          }
        }
      }

      let category = '';
      if (categoryIndex >= 0 && cells.length > categoryIndex) {
        category = cells[categoryIndex].trim().replace(/\*\*/g, '');
      }

      results.push({
        majorName,
        planCount,
        category,
        provinceQuotas,
      });
    }

    i = table.endIndex;
  }

  return results;
}

/**
 * 从 markdown 内容中解析各省招生配额
 */
function parseProvinceQuotas(
  lines: string[]
): { provinceName: string; quota: number }[] {
  const quotas: { provinceName: string; quota: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith('|')) continue;

    const table = extractTable(lines, i);
    if (!table || table.rows.length < 2) continue;

    const headers = table.rows[0].map((h) => h.trim());
    const prov1Idx = headers.findIndex((h) => h.includes('省份'));
    const quota1Idx = headers.findIndex((h) => h.includes('招生名额') || h.includes('名额') || (h.includes('招生') && h.includes('人')));
    const prov2Idx = headers.findIndex((h, idx) => idx > prov1Idx && h.includes('省份'));
    const quota2Idx = headers.findIndex((h, idx) => idx > (quota1Idx >= 0 ? quota1Idx : 0) && (h.includes('招生名额') || h.includes('名额')));

    if (prov1Idx < 0 || quota1Idx < 0) {
      i = table.endIndex;
      continue;
    }

    for (let r = 1; r < table.rows.length; r++) {
      const cells = table.rows[r];

      // 列A
      if (cells.length > Math.max(prov1Idx, quota1Idx)) {
        const prov = cells[prov1Idx].trim().replace(/\*\*/g, '');
        const quotaText = cells[quota1Idx].trim().replace(/[人,，]/g, '');
        const qMatch = quotaText.match(/(\d[\d.]*)/);
        if (prov && qMatch && prov.length >= 2) {
          quotas.push({ provinceName: prov, quota: Number(qMatch[1]) });
        }
      }

      // 列B
      if (prov2Idx >= 0 && quota2Idx >= 0 && cells.length > Math.max(prov2Idx, quota2Idx)) {
        const prov = cells[prov2Idx].trim().replace(/\*\*/g, '');
        const quotaText = cells[quota2Idx].trim().replace(/[人,，]/g, '');
        const qMatch = quotaText.match(/(\d[\d.]*)/);
        if (prov && qMatch && prov.length >= 2) {
          quotas.push({ provinceName: prov, quota: Number(qMatch[1]) });
        }
      }
    }

    i = table.endIndex;
    break; // 只取第一个匹配的表格
  }

  return quotas;
}
