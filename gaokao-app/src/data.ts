export interface RecommendationItem {
  id: string;
  college: string;
  major: string;
  majorGroup: string;
  scores: { year: number; score: number }[];
  trend: 'up' | 'down' | 'stable';
  probability: number;
  purity: number;
  tier: string;
  /** 所在城市 */
  city?: string;
  /** 数据库大学ID */
  universityId?: string;
  /** 省份代码 */
  provinceCode?: string;
  /** 招生计划人数 */
  planCount?: number;
  /** 学费（元/年） */
  tuition?: number;
  /** LLM 推荐理由 */
  reason?: string;
}

export interface RiskItem {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'danger';
  detail: string;
}

export interface RankInfo {
  rank: number;
  sameScore: number;
  range: [number, number];
  confidence: 'exact' | 'estimated';
}

/** 单条批次线 */
export interface BatchLine {
  batch: string;
  score: number;
  label: string;
}

/** 批次线查询结果 */
export interface BatchLinesResult {
  province: string;
  subjectType: string;
  lines: BatchLine[];
}

/** 选科覆盖率查询结果 */
export interface SubjectCoverageResult {
  coveragePct: number;
  totalMajors: number;
  source: string;
}
