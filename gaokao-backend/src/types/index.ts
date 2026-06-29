/**
 * 高考志愿填报后端共享类型定义
 *
 * 本文件只包含与前端数据契约对齐的纯类型，便于后续阶段与数据库实体层对接。
 */

/** 历年分数点 */
export interface ScoreYear {
  year: number;
  score: number;
}

/** 录取趋势 */
export type Trend = 'up' | 'down' | 'stable';

/** 推荐志愿项 */
export interface RecommendationItem {
  id: string;
  college: string;
  major: string;
  majorGroup: string;
  scores: ScoreYear[];
  trend: Trend;
  probability: number;
  purity: number;
  tier: string;
  /** 扩展字段（P0 新增） */
  city?: string;
  universityId?: string;
  majorId?: string;
  provinceCode?: string;
  planCount?: number;
  tuition?: number;
  reason?: string;
}

/** 风险状态 */
export type RiskStatus = 'pass' | 'warn' | 'danger';

/** 风险诊断项 */
export interface RiskItem {
  id: string;
  name: string;
  status: RiskStatus;
  detail: string;
}

/** 省份配置 */
export interface Province {
  name: string;
  mode: string;
  maxScore: number;
}

/** 批次线 */
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

/** 位次查询结果 */
export interface RankInfo {
  rank: number;
  sameScore: number;
  range: [number, number];
  confidence: 'exact' | 'estimated';
}

/** 选科覆盖率查询结果 */
export interface SubjectCoverageResult {
  coveragePct: number;
  totalMajors: number;
  source: string;
}

/** 省份批次线原始记录 */
export interface ProvinceBatchLine {
  id?: string;
  provinceCode: string;
  year: number;
  subjectType: string;
  batch: string;
  score: number;
  source?: string;
}

/** 省份批次线输入（不含主键） */
export type ProvinceBatchLineInput = Omit<ProvinceBatchLine, 'id'>;

/** 关键段位位次原始记录 */
export interface ProvinceRankSegment {
  id?: string;
  provinceCode: string;
  year: number;
  subjectType: string;
  score: number;
  rank: number;
  totalCount?: number;
  source?: string;
}

/** 关键段位位次输入（不含主键） */
export type ProvinceRankSegmentInput = Omit<ProvinceRankSegment, 'id'>;

/** 选科覆盖率原始记录 */
export interface SubjectCoverage {
  id?: string;
  provinceCode?: string | null;
  year: number;
  subjects: string[];
  coveragePct: number;
  totalMajors: number;
  source?: string;
}

/** 选科覆盖率输入（不含主键） */
export type SubjectCoverageInput = Omit<SubjectCoverage, 'id'>;

/** 考生偏好设置（结构化类型） */
export interface CandidatePreferences {
  collegeLevel?: string;       // '985' | '211' | '双一流' | '不限'
  preferredCities?: string[];  // ['北京', '上海', '广州']
  disciplines?: string[];      // ['计算机', '临床医学']
  selectedMajor?: string;      // 选中专业
  careerOrientation?: string;  // 职业方向
  subjectType?: string;        // '物理' | '历史' | '物理类' | '历史类' | ...
}

/** 考生推荐请求入参 */
export interface CandidateInput {
  province: string;
  score: number;
  rank?: number;
  subjects?: string[];
  preferences?: CandidatePreferences;
  weights?: number[];
}

/** 录取位次查询条件 */
export interface AdmissionScoreQuery {
  provinceCode: string;
  year: number;
  batch: string;              // '本科' | '一本' | '特控' 等
  minRank?: number;
  maxRank?: number;
  subjectType?: string;
}

/** 录取位次查询结果（含 JOIN 信息） */
export interface AdmissionScoreResult {
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  minRank: number;
  avgRank: number;
  maxRank: number;
  minScore: number;
  avgScore: number;
  planCount: number;
  city?: string;
}

/** 招生计划查询结果 */
export interface UniversityPlanResult {
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  planCount: number;
  tuition?: number;
  duration?: number;
  subjectRequirements?: string[];
  city?: string;
}

// ==========================================
// 认证模块类型
// ==========================================

/** JWT 载荷 */
export interface JwtPayload {
  userId: string;
  email: string;
}

/** 注册请求 */
export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
}

/** 登录请求 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 发送验证码请求 */
export interface SendVerificationRequest {
  email: string;
  type: 'register' | 'reset_password';
}

/** 验证邮箱请求 */
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

/** 用户响应（脱敏） */
export interface UserResponse {
  id: string;
  email: string;
  nickname: string | null;
  isVerified: boolean;
  createdAt: string;
}

/** 认证响应 */
export interface AuthResponse {
  token: string;
  user: UserResponse;
}

/** 通用消息响应 */
export interface MessageResponse {
  message: string;
}

/** 认证结果（内部使用） */
export interface AuthResult {
  token: string;
  user: UserResponse;
}

/** 创建用户参数 */
export interface CreateUserParams {
  email: string;
  passwordHash: string;
  nickname?: string;
}

/** 验证码数据库记录 */
export interface VerificationCodeRecord {
  id: string;
  email: string;
  codeHash: string;
  type: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId?: string | null;
}

/** 用户数据库记录 */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string | null;
  isVerified: boolean;
  wechatOpenId: string | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 认证配置 */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  loginMaxAttempts: number;
  loginLockMinutes: number;
  codeTTLMinutes: number;
  codeCooldownSeconds: number;
}
