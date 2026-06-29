import type {
  Province,
  ProvinceBatchLine,
  ProvinceRankSegment,
  RankInfo,
  RecommendationItem,
  RiskItem,
  SubjectCoverage,
} from '../types';
import { loadProvinces, loadRecommendations, loadRiskChecks, loadRankLookups } from './jsonLoader';

/**
 * 第一阶段内存 Mock 数据源
 *
 * 数据从 `json/` 目录下的 JSON 文件加载，便于业务逻辑与数据解耦。
 * 第二阶段接入 PostgreSQL 后，本文件将被 Repository 实现替换。
 */

export const PROVINCES: Province[] = loadProvinces();

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = loadRecommendations();

export const RISK_DATA: RiskItem[] = loadRiskChecks();

export const RANK_LOOKUP: Record<number, RankInfo> = loadRankLookups();

/**
 * 内存 Mock 批次线数据（尽量与真实数据分布对齐）
 */
export const MOCK_BATCH_LINES: ProvinceBatchLine[] = [
  // 广东（3+1+2）
  { provinceCode: '44', year: 2026, subjectType: '物理', batch: '本科', score: 425, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', batch: '特控', score: 539, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', batch: '本科', score: 440, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', batch: '特控', score: 546, source: 'mock' },
  // 北京（3+3）
  { provinceCode: '11', year: 2026, subjectType: '综合改革', batch: '本科', score: 429, source: 'mock' },
  { provinceCode: '11', year: 2026, subjectType: '综合改革', batch: '特控', score: 521, source: 'mock' },
  // 浙江（3+3）
  { provinceCode: '33', year: 2026, subjectType: '综合改革', batch: '一段', score: 494, source: 'mock' },
  { provinceCode: '33', year: 2026, subjectType: '综合改革', batch: '二段', score: 266, source: 'mock' },
  { provinceCode: '33', year: 2026, subjectType: '综合改革', batch: '特控', score: 594, source: 'mock' },
  // 新疆（传统文理）
  { provinceCode: '65', year: 2026, subjectType: '文科', batch: '一本', score: 451, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '文科', batch: '二本', score: 315, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '理科', batch: '一本', score: 468, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '理科', batch: '二本', score: 304, source: 'mock' },
  // 西藏（A/B 类）
  { provinceCode: '54', year: 2026, subjectType: 'A类', batch: '一本', score: 330, source: 'mock' },
  { provinceCode: '54', year: 2026, subjectType: 'A类', batch: '二本', score: 294, source: 'mock' },
  { provinceCode: '54', year: 2026, subjectType: 'B类', batch: '一本', score: 400, source: 'mock' },
  { provinceCode: '54', year: 2026, subjectType: 'B类', batch: '二本', score: 304, source: 'mock' },
];

/**
 * 内存 Mock 关键段位位次数据（尽量与真实数据分布对齐）
 */
export const MOCK_RANK_SEGMENTS: ProvinceRankSegment[] = [
  // 广东 物理
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 690, rank: 115, totalCount: 433366, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 670, rank: 976, totalCount: 433366, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 650, rank: 4041, totalCount: 433366, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 600, rank: 30891, totalCount: 433366, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 539, rank: 111604, totalCount: 433366, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '物理', score: 425, rank: 303919, totalCount: 433366, source: 'mock' },
  // 广东 历史
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 650, rank: 101, totalCount: 294878, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 630, rank: 538, totalCount: 294878, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 600, rank: 3367, totalCount: 294878, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 580, rank: 7887, totalCount: 294878, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 546, rank: 22391, totalCount: 294878, source: 'mock' },
  { provinceCode: '44', year: 2026, subjectType: '历史', score: 440, rank: 114692, totalCount: 294878, source: 'mock' },
  // 北京 综合改革
  { provinceCode: '11', year: 2026, subjectType: '综合改革', score: 690, rank: 200, totalCount: 60000, source: 'mock' },
  { provinceCode: '11', year: 2026, subjectType: '综合改革', score: 650, rank: 2500, totalCount: 60000, source: 'mock' },
  { provinceCode: '11', year: 2026, subjectType: '综合改革', score: 600, rank: 9000, totalCount: 60000, source: 'mock' },
  { provinceCode: '11', year: 2026, subjectType: '综合改革', score: 521, rank: 27000, totalCount: 60000, source: 'mock' },
  { provinceCode: '11', year: 2026, subjectType: '综合改革', score: 429, rank: 43000, totalCount: 60000, source: 'mock' },
  // 新疆 理科
  { provinceCode: '65', year: 2026, subjectType: '理科', score: 600, rank: 2000, totalCount: 120000, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '理科', score: 468, rank: 20000, totalCount: 120000, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '理科', score: 304, rank: 58000, totalCount: 120000, source: 'mock' },
  // 新疆 文科
  { provinceCode: '65', year: 2026, subjectType: '文科', score: 600, rank: 500, totalCount: 80000, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '文科', score: 451, rank: 5000, totalCount: 80000, source: 'mock' },
  { provinceCode: '65', year: 2026, subjectType: '文科', score: 315, rank: 20000, totalCount: 80000, source: 'mock' },
];

/**
 * 内存 Mock 选科覆盖率数据（全国默认，基于 985/重点专业样本）
 */
export const MOCK_SUBJECT_COVERAGES: SubjectCoverage[] = [
  { provinceCode: null, year: 2026, subjects: ['物理', '化学', '政治'], coveragePct: 0.96, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['物理', '化学', '生物'], coveragePct: 0.94, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['物理', '化学', '地理'], coveragePct: 0.9, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['物理', '政治', '生物'], coveragePct: 0.75, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['物理', '生物', '地理'], coveragePct: 0.7, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['物理', '政治', '地理'], coveragePct: 0.6, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '化学', '政治'], coveragePct: 0.5, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '化学', '地理'], coveragePct: 0.48, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '生物', '政治'], coveragePct: 0.45, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '化学', '生物'], coveragePct: 0.45, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '生物', '地理'], coveragePct: 0.4, totalMajors: 800, source: 'mock' },
  { provinceCode: null, year: 2026, subjects: ['历史', '地理', '政治'], coveragePct: 0.38, totalMajors: 800, source: 'mock' },
];

// ──────────────────────────────────────────────
// T02 新增 Mock 数据：录取位次 / 招生计划 / 城市-院校映射
// ──────────────────────────────────────────────

/** 内存 Mock 录取位次内部类型（含省份/年份/批次过滤字段） */
export interface MockAdmissionScore {
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  provinceCode: string;
  year: number;
  batch: string;
  minRank: number;
  avgRank: number;
  maxRank: number;
  minScore: number;
  avgScore: number;
  planCount: number;
}

/**
 * 内存 Mock 录取位次数据（≥30 条，覆盖广东/北京/四川等省，冲稳保场景）
 *
 * 以广东物理类考生 584 分（位次约 47000）为基准设计三档：
 * - 冲档 (32900~47000)：华南理工大学、暨南大学
 * - 稳档 (42300~51700)：深圳大学、华南师范大学
 * - 保档 (47001~70500)：广东工业大学、南方医科大学
 * - 垫档 (>70500)：广州大学、东莞理工学院
 *
 * 同时包含北京、四川数据确保跨省逻辑完整。
 */
export const MOCK_ADMISSION_SCORES: MockAdmissionScore[] = [
  // ── 广东 物理 2025 本科 ──
  // 高分段（不在普通考生冲档范围）
  { universityId: 'univ-sysu', universityName: '中山大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', minRank: 7500, avgRank: 6800, maxRank: 9000, minScore: 635, avgScore: 642, planCount: 80 },
  { universityId: 'univ-sysu', universityName: '中山大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '44', year: 2025, batch: '本科', minRank: 5200, avgRank: 4500, maxRank: 6500, minScore: 651, avgScore: 658, planCount: 120 },
  { universityId: 'univ-sysu', universityName: '中山大学', majorId: 'major-finance', majorName: '金融学', provinceCode: '44', year: 2025, batch: '本科', minRank: 6200, avgRank: 5500, maxRank: 7500, minScore: 644, avgScore: 650, planCount: 60 },

  // 冲档段 (32900~47000)：对 47000 位次考生属于冲刺
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', minRank: 10800, avgRank: 9600, maxRank: 12500, minScore: 618, avgScore: 624, planCount: 100 },
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-me', majorName: '机械工程', provinceCode: '44', year: 2025, batch: '本科', minRank: 14500, avgRank: 13200, maxRank: 16200, minScore: 605, avgScore: 611, planCount: 90 },
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-ee', majorName: '电子信息类', provinceCode: '44', year: 2025, batch: '本科', minRank: 12500, avgRank: 11300, maxRank: 14200, minScore: 612, avgScore: 618, planCount: 85 },
  { universityId: 'univ-jnu', universityName: '暨南大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', minRank: 18500, avgRank: 17000, maxRank: 20500, minScore: 595, avgScore: 601, planCount: 70 },
  { universityId: 'univ-jnu', universityName: '暨南大学', majorId: 'major-finance', majorName: '金融学', provinceCode: '44', year: 2025, batch: '本科', minRank: 17200, avgRank: 15800, maxRank: 19200, minScore: 598, avgScore: 604, planCount: 55 },
  { universityId: 'univ-scnu', universityName: '华南师范大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', minRank: 28000, avgRank: 25500, maxRank: 31000, minScore: 576, avgScore: 582, planCount: 65 },

  // 稳档段 (42300~51700)：对 47000 位次考生较为匹配
  { universityId: 'univ-szu', universityName: '深圳大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', minRank: 34000, avgRank: 31000, maxRank: 38000, minScore: 565, avgScore: 571, planCount: 120 },
  { universityId: 'univ-szu', universityName: '深圳大学', majorId: 'major-ee', majorName: '电子信息工程', provinceCode: '44', year: 2025, batch: '本科', minRank: 39500, avgRank: 36500, maxRank: 43500, minScore: 556, avgScore: 562, planCount: 90 },
  { universityId: 'univ-scnu', universityName: '华南师范大学', majorId: 'major-me', majorName: '软件工程', provinceCode: '44', year: 2025, batch: '本科', minRank: 42000, avgRank: 39000, maxRank: 46000, minScore: 552, avgScore: 558, planCount: 75 },
  { universityId: 'univ-gzhmu', universityName: '广州医科大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '44', year: 2025, batch: '本科', minRank: 45000, avgRank: 42000, maxRank: 49000, minScore: 546, avgScore: 551, planCount: 160 },

  // 保档段 (47001~70500)：对 47000 位次考生录取把握大
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', minRank: 52000, avgRank: 48500, maxRank: 57000, minScore: 538, avgScore: 543, planCount: 200 },
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-ee', majorName: '自动化', provinceCode: '44', year: 2025, batch: '本科', minRank: 56000, avgRank: 52500, maxRank: 61000, minScore: 533, avgScore: 538, planCount: 180 },
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-me', majorName: '机械设计制造及其自动化', provinceCode: '44', year: 2025, batch: '本科', minRank: 59000, avgRank: 55500, maxRank: 64000, minScore: 529, avgScore: 534, planCount: 150 },
  { universityId: 'univ-smu', universityName: '南方医科大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '44', year: 2025, batch: '本科', minRank: 62000, avgRank: 58000, maxRank: 68000, minScore: 524, avgScore: 529, planCount: 140 },
  { universityId: 'univ-gzhu', universityName: '广州大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', minRank: 65000, avgRank: 61000, maxRank: 71000, minScore: 519, avgScore: 524, planCount: 130 },

  // 垫档段 (>70500)：确保录取
  { universityId: 'univ-gzhu', universityName: '广州大学', majorId: 'major-me', majorName: '土木工程', provinceCode: '44', year: 2025, batch: '本科', minRank: 78000, avgRank: 73000, maxRank: 85000, minScore: 505, avgScore: 510, planCount: 100 },
  { universityId: 'univ-dgut', universityName: '东莞理工学院', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', minRank: 82000, avgRank: 77000, maxRank: 89000, minScore: 498, avgScore: 503, planCount: 110 },
  { universityId: 'univ-dgut', universityName: '东莞理工学院', majorId: 'major-ee', majorName: '电子信息工程', provinceCode: '44', year: 2025, batch: '本科', minRank: 86000, avgRank: 81000, maxRank: 93000, minScore: 493, avgScore: 498, planCount: 95 },
  { universityId: 'univ-fosu', universityName: '佛山科学技术学院', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', minRank: 95000, avgRank: 89000, maxRank: 103000, minScore: 482, avgScore: 487, planCount: 80 },

  // ── 北京 综合改革 2025 本科 ──
  { universityId: 'univ-buaa', universityName: '北京航空航天大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '11', year: 2025, batch: '本科', minRank: 1200, avgRank: 1000, maxRank: 1500, minScore: 672, avgScore: 678, planCount: 40 },
  { universityId: 'univ-bit', universityName: '北京理工大学', majorId: 'major-ee', majorName: '电子信息类', provinceCode: '11', year: 2025, batch: '本科', minRank: 1800, avgRank: 1550, maxRank: 2200, minScore: 662, avgScore: 668, planCount: 45 },
  { universityId: 'univ-bupt', universityName: '北京邮电大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '11', year: 2025, batch: '本科', minRank: 3500, avgRank: 3100, maxRank: 4200, minScore: 645, avgScore: 651, planCount: 55 },
  { universityId: 'univ-bjut', universityName: '北京工业大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '11', year: 2025, batch: '本科', minRank: 8500, avgRank: 7600, maxRank: 9600, minScore: 612, avgScore: 618, planCount: 65 },
  { universityId: 'univ-bjut', universityName: '北京工业大学', majorId: 'major-me', majorName: '机械工程', provinceCode: '11', year: 2025, batch: '本科', minRank: 11000, avgRank: 10000, maxRank: 12500, minScore: 600, avgScore: 605, planCount: 55 },

  // ── 四川 理科 2025 本科 ──
  { universityId: 'univ-sicau', universityName: '四川大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '51', year: 2025, batch: '本科', minRank: 3200, avgRank: 2700, maxRank: 3900, minScore: 640, avgScore: 648, planCount: 100 },
  { universityId: 'univ-uestc', universityName: '电子科技大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '51', year: 2025, batch: '本科', minRank: 2500, avgRank: 2100, maxRank: 3100, minScore: 648, avgScore: 654, planCount: 80 },
  { universityId: 'univ-uestc', universityName: '电子科技大学', majorId: 'major-ee', majorName: '电子信息类', provinceCode: '51', year: 2025, batch: '本科', minRank: 3500, avgRank: 3000, maxRank: 4200, minScore: 636, avgScore: 642, planCount: 75 },
  { universityId: 'univ-swjtu', universityName: '西南交通大学', majorId: 'major-me', majorName: '交通运输类', provinceCode: '51', year: 2025, batch: '本科', minRank: 12000, avgRank: 10500, maxRank: 14000, minScore: 596, avgScore: 602, planCount: 90 },
  { universityId: 'univ-swufe', universityName: '西南财经大学', majorId: 'major-finance', majorName: '金融学', provinceCode: '51', year: 2025, batch: '本科', minRank: 7500, avgRank: 6400, maxRank: 8800, minScore: 616, avgScore: 622, planCount: 55 },
];

/** 内存 Mock 招生计划内部类型 */
export interface MockUniversityPlan {
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  provinceCode: string;
  year: number;
  batch: string;
  planCount: number;
  tuition?: number;
  duration: number;
  subjectRequirements: string[];
}

/**
 * 内存 Mock 招生计划数据（≥20 条，含专业+人数+学费+科目要求）
 */
export const MOCK_UNIVERSITY_PLANS: MockUniversityPlan[] = [
  // 广东 2025
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', planCount: 100, tuition: 6850, duration: 4, subjectRequirements: ['物理', '化学'] },
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-me', majorName: '机械工程', provinceCode: '44', year: 2025, batch: '本科', planCount: 90, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-scut', universityName: '华南理工大学', majorId: 'major-ee', majorName: '电子信息类', provinceCode: '44', year: 2025, batch: '本科', planCount: 85, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-jnu', universityName: '暨南大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', planCount: 70, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-jnu', universityName: '暨南大学', majorId: 'major-finance', majorName: '金融学', provinceCode: '44', year: 2025, batch: '本科', planCount: 55, tuition: 6060, duration: 4, subjectRequirements: [] },
  { universityId: 'univ-szu', universityName: '深圳大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', planCount: 120, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-szu', universityName: '深圳大学', majorId: 'major-ee', majorName: '电子信息工程', provinceCode: '44', year: 2025, batch: '本科', planCount: 90, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-scnu', universityName: '华南师范大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', planCount: 65, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-scnu', universityName: '华南师范大学', majorId: 'major-me', majorName: '软件工程', provinceCode: '44', year: 2025, batch: '本科', planCount: 75, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '44', year: 2025, batch: '本科', planCount: 200, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-ee', majorName: '自动化', provinceCode: '44', year: 2025, batch: '本科', planCount: 180, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-gdut', universityName: '广东工业大学', majorId: 'major-me', majorName: '机械设计制造及其自动化', provinceCode: '44', year: 2025, batch: '本科', planCount: 150, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-gzhmu', universityName: '广州医科大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '44', year: 2025, batch: '本科', planCount: 160, tuition: 7660, duration: 5, subjectRequirements: ['物理', '化学', '生物'] },
  { universityId: 'univ-smu', universityName: '南方医科大学', majorId: 'major-clinical', majorName: '临床医学', provinceCode: '44', year: 2025, batch: '本科', planCount: 140, tuition: 7660, duration: 5, subjectRequirements: ['物理', '化学', '生物'] },
  { universityId: 'univ-gzhu', universityName: '广州大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', planCount: 130, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-gzhu', universityName: '广州大学', majorId: 'major-me', majorName: '土木工程', provinceCode: '44', year: 2025, batch: '本科', planCount: 100, tuition: 6850, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-dgut', universityName: '东莞理工学院', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '44', year: 2025, batch: '本科', planCount: 110, tuition: 5710, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-dgut', universityName: '东莞理工学院', majorId: 'major-ee', majorName: '电子信息工程', provinceCode: '44', year: 2025, batch: '本科', planCount: 95, tuition: 5710, duration: 4, subjectRequirements: ['物理'] },

  // 北京 2025
  { universityId: 'univ-bjut', universityName: '北京工业大学', majorId: 'major-cs', majorName: '计算机科学与技术', provinceCode: '11', year: 2025, batch: '本科', planCount: 65, tuition: 5500, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-bjut', universityName: '北京工业大学', majorId: 'major-me', majorName: '机械工程', provinceCode: '11', year: 2025, batch: '本科', planCount: 55, tuition: 5500, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-bupt', universityName: '北京邮电大学', majorId: 'major-cs', majorName: '计算机类', provinceCode: '11', year: 2025, batch: '本科', planCount: 55, tuition: 5500, duration: 4, subjectRequirements: ['物理'] },

  // 四川 2025
  { universityId: 'univ-swjtu', universityName: '西南交通大学', majorId: 'major-me', majorName: '交通运输类', provinceCode: '51', year: 2025, batch: '本科', planCount: 90, tuition: 4900, duration: 4, subjectRequirements: ['物理'] },
  { universityId: 'univ-swufe', universityName: '西南财经大学', majorId: 'major-finance', majorName: '金融学', provinceCode: '51', year: 2025, batch: '本科', planCount: 55, tuition: 4600, duration: 4, subjectRequirements: [] },
];

/** 城市-院校映射内部类型 */
export interface MockCityUniversityMap {
  cityName: string;
  universityId: string;
  provinceCode: string;
}

/**
 * 内存 Mock 城市-院校映射（≥15 条，覆盖主要城市）
 *
 * 城市名使用简称（不带"市"后缀），与前端 Step4 可选城市对齐。
 */
export const MOCK_CITY_UNIVERSITY_MAP: MockCityUniversityMap[] = [
  // 北京
  { cityName: '北京', universityId: 'univ-buaa', provinceCode: '11' },
  { cityName: '北京', universityId: 'univ-bit', provinceCode: '11' },
  { cityName: '北京', universityId: 'univ-bupt', provinceCode: '11' },
  { cityName: '北京', universityId: 'univ-bjut', provinceCode: '11' },
  // 上海
  { cityName: '上海', universityId: 'univ-fudan', provinceCode: '31' },
  { cityName: '上海', universityId: 'univ-sjtu', provinceCode: '31' },
  // 广州
  { cityName: '广州', universityId: 'univ-sysu', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-scut', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-jnu', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-scnu', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-gdut', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-gzhmu', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-smu', provinceCode: '44' },
  { cityName: '广州', universityId: 'univ-gzhu', provinceCode: '44' },
  // 深圳
  { cityName: '深圳', universityId: 'univ-szu', provinceCode: '44' },
  // 杭州
  { cityName: '杭州', universityId: 'univ-zju', provinceCode: '33' },
  // 南京
  { cityName: '南京', universityId: 'univ-nju', provinceCode: '32' },
  // 成都
  { cityName: '成都', universityId: 'univ-sicau', provinceCode: '51' },
  { cityName: '成都', universityId: 'univ-uestc', provinceCode: '51' },
  { cityName: '成都', universityId: 'univ-swjtu', provinceCode: '51' },
  { cityName: '成都', universityId: 'univ-swufe', provinceCode: '51' },
  // 东莞
  { cityName: '东莞', universityId: 'univ-dgut', provinceCode: '44' },
  // 佛山
  { cityName: '佛山', universityId: 'univ-fosu', provinceCode: '44' },
];
