/**
 * 院校名称解析工具
 *
 * 用于数据导入时模糊匹配院校名称：精确匹配 → 别名映射 → Levenshtein 距离。
 * 同时支持推荐引擎中确认院校名称一致性。
 */

/** 常见院校别名映射 */
export const UNIVERSITY_ALIAS_MAP: Record<string, string> = {
  '中大': '中山大学',
  '华工': '华南理工大学',
  '华科': '华中科技大学',
  '西交': '西安交通大学',
  '上交': '上海交通大学',
  '复旦': '复旦大学',
  '浙大': '浙江大学',
  '南大': '南京大学',
  '武大': '武汉大学',
  '吉大': '吉林大学',
  '兰大': '兰州大学',
  '厦大': '厦门大学',
  '哈工大': '哈尔滨工业大学',
  '西电': '西安电子科技大学',
  '北邮': '北京邮电大学',
  '央财': '中央财经大学',
  '上财': '上海财经大学',
  '人大': '中国人民大学',
  '中科大': '中国科学技术大学',
  '中南': '中南大学',
  '华电': '华北电力大学',
  '北航': '北京航空航天大学',
  '北理': '北京理工大学',
  '东南': '东南大学',
  '天大': '天津大学',
  '南开': '南开大学',
  '山大': '山东大学',
  '川大': '四川大学',
  '电子科大': '电子科技大学',
  '西工大': '西北工业大学',
  '国防科大': '国防科技大学',
  '东北大学': '东北大学',
  '大工': '大连理工大学',
  '重大': '重庆大学',
  '上大': '上海大学',
  '深大': '深圳大学',
  '苏大': '苏州大学',
  '暨大': '暨南大学',
  '华师': '华南师范大学',
  '广工': '广东工业大学',
  '南方医': '南方医科大学',
  '广医': '广州医科大学',
  '广中医': '广州中医药大学',
};

/**
 * Levenshtein 编辑距离
 * @param a 字符串 A
 * @param b 字符串 B
 * @returns 编辑距离（0 表示完全相同）
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // 创建距离矩阵
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 解析院校名称：先精确匹配候选列表，再用别名映射，最后 Levenshtein fuzzy
 * @param name 输入名称（可能是简称、别名或有轻微拼写差异）
 * @param candidates 候选标准名称列表
 * @returns 匹配到的标准名称，无匹配时返回原始输入
 */
export function resolveUniversityName(
  name: string,
  candidates?: string[]
): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return trimmed;
  }

  // 1. 别名映射优先
  if (UNIVERSITY_ALIAS_MAP[trimmed]) {
    const resolved = UNIVERSITY_ALIAS_MAP[trimmed];
    // 如果提供了候选列表，验证别名解析后的名称是否在候选列表中
    if (candidates && candidates.length > 0) {
      if (candidates.includes(resolved)) {
        return resolved;
      }
    } else {
      return resolved;
    }
  }

  // 2. 精确匹配
  if (candidates && candidates.length > 0) {
    if (candidates.includes(trimmed)) {
      return trimmed;
    }

    // 3. 包含匹配（如「北京大学医学部」包含「北京大学」）
    for (const candidate of candidates) {
      if (candidate.includes(trimmed) || trimmed.includes(candidate)) {
        return candidate;
      }
    }

    // 4. Levenshtein fuzzy match（阈值 ≥80%）
    let bestMatch = '';
    let bestSimilarity = 0;
    for (const candidate of candidates) {
      const dist = levenshtein(trimmed, candidate);
      const maxLen = Math.max(trimmed.length, candidate.length);
      const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;
      if (similarity > bestSimilarity && similarity >= 0.8) {
        bestSimilarity = similarity;
        bestMatch = candidate;
      }
    }
    if (bestMatch) {
      return bestMatch;
    }
  }

  // 5. 无法匹配，返回原始输入
  return trimmed;
}
