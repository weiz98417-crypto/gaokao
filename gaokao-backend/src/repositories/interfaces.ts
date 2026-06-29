import type {
  AdmissionScoreQuery,
  AdmissionScoreResult,
  BatchLinesResult,
  CandidateInput,
  Province,
  ProvinceRankSegmentInput,
  RankInfo,
  RecommendationItem,
  RiskItem,
  SubjectCoverageResult,
  UniversityPlanResult,
} from '../types';

import type { UserRecord, CreateUserParams, VerificationCodeRecord } from '../types';

/**
 * 仓库接口层
 *
 * 第一阶段由内存实现；第二阶段可无缝替换为基于 PostgreSQL/Prisma/TypeORM 的持久化实现，
 * 应用服务与路由层无需修改。
 */

/** 省份数据仓库 */
export interface IProvinceRepository {
  /**
   * 获取全部省份配置
   * @returns 省份列表
   */
  getAll(): Province[] | Promise<Province[]>;
}

/** 位次数据仓库（旧版通用映射，保留以兼容既有代码） */
export interface IRankRepository {
  /**
   * 根据分数查询近似的全省位次
   * @param score 高考总分
   * @param province 省份名称（预留按省分片）
   * @returns 位次信息，无匹配时返回 null
   */
  lookup(score: number, province: string): RankInfo | null | Promise<RankInfo | null>;
}

/** 批次线数据仓库 */
export interface IBatchLineRepository {
  /**
   * 按省份与科目类查询批次线
   * @param provinceCode 省份行政区划代码
   * @param subjectType 科目类
   * @returns 批次线结果，无数据时 lines 为空
   */
  getLines(provinceCode: string, subjectType: string): Promise<BatchLinesResult>;
}

/** 关键段位位次数据仓库 */
export interface IRankSegmentRepository {
  /**
   * 按省份与科目类查询关键段位
   * @param provinceCode 省份行政区划代码
   * @param subjectType 科目类
   * @returns 关键段位列表
   */
  getSegments(
    provinceCode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[]>;

  /**
   * 按高考模式查询一条参考关键段位（用于缺失省份估算）
   * @param mode 高考模式，如 3+1+2 / 3+3 / 文理
   * @param subjectType 科目类
   * @returns 参考省份的关键段位，无匹配时返回 null
   */
  getReferenceByMode(
    mode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[] | null>;
}

/** 选科覆盖率数据仓库 */
export interface ISubjectCoverageRepository {
  /**
   * 按省份与选科组合查询覆盖率
   * @param provinceCode 省份行政区划代码，null 表示全国默认
   * @param subjects 选科组合，如 ['物理','化学','生物']
   * @returns 覆盖率结果
   */
  getCoverage(
    provinceCode: string | null,
    subjects: string[]
  ): Promise<SubjectCoverageResult>;
}

/** 推荐数据仓库 */
export interface IRecommendationRepository {
  /**
   * 根据考生输入生成推荐志愿列表
   * @param input 考生信息、成绩、偏好与权重
   * @returns 推荐志愿列表
   */
  getRecommendations(input: CandidateInput): RecommendationItem[] | Promise<RecommendationItem[]>;
}

/** 风险诊断数据仓库 */
export interface IRiskRepository {
  /**
   * 获取风险诊断项列表
   * @returns 风险诊断列表
   */
  getRiskItems(): RiskItem[] | Promise<RiskItem[]>;
}

/** 录取位次数据仓库 */
export interface IAdmissionScoreRepository {
  /**
   * 按省份+年份+批次查询录取位次数据
   * @param query 查询条件（含省份、年份、批次、可选位次区间）
   * @returns 录取位次结果列表
   */
  queryByRank(query: AdmissionScoreQuery): Promise<AdmissionScoreResult[]>;
}

/** 招生计划数据仓库 */
export interface IUniversityPlanRepository {
  /**
   * 按院校+省份+年份查询招生计划
   * @param universityIds 院校 ID 列表
   * @param provinceCode 省份代码
   * @param year 招生年份
   * @param subjects 考生选科（用于科目要求匹配，可选）
   * @returns 招生计划列表
   */
  queryPlans(
    universityIds: string[],
    provinceCode: string,
    year: number,
    subjects?: string[]
  ): Promise<UniversityPlanResult[]>;
}

/** 城市-院校映射数据仓库 */
export interface ICityUniversityRepository {
  /**
   * 按城市名列表查询对应的院校 ID 集合
   * @param cityNames 城市名列表（如 ['北京', '广州']）
   * @returns 大学 ID 列表
   */
  getByCities(cityNames: string[]): Promise<string[]>;

  /**
   * 批量查询院校所在城市
   * @param universityIds 大学 ID 列表
   * @returns Map<universityId, cityName>
   */
  getCitiesByUniversityIds(
    universityIds: string[]
  ): Promise<Map<string, string>>;
}

// ==========================================
// 认证模块仓库接口
// ==========================================

/** 认证数据仓库 */
export interface IAuthRepository {
  /** 按邮箱查找用户 */
  findByEmail(email: string): Promise<UserRecord | null>;

  /** 按 ID 查找用户 */
  findById(id: string): Promise<UserRecord | null>;

  /** 创建用户 */
  createUser(params: CreateUserParams): Promise<UserRecord>;

  /** 更新邮箱验证状态 */
  updateVerificationStatus(userId: string): Promise<void>;

  /** 更新密码哈希 */
  updatePassword(userId: string, newHash: string): Promise<void>;

  /** 增加登录失败计数 */
  incrementFailedAttempts(userId: string): Promise<void>;

  /** 重置登录失败计数 */
  resetFailedAttempts(userId: string): Promise<void>;

  /** 锁定账户至指定时间 */
  lockUntil(userId: string, until: Date): Promise<void>;

  /** 创建验证码记录 */
  createVerificationCode(params: {
    email: string;
    codeHash: string;
    type: string;
    expiresAt: Date;
    userId?: string;
  }): Promise<VerificationCodeRecord>;

  /** 查找最新一条验证码（按邮箱+类型） */
  findLatestCode(email: string, type: string): Promise<VerificationCodeRecord | null>;

  /** 标记验证码已使用 */
  markCodeUsed(id: string): Promise<void>;
}
