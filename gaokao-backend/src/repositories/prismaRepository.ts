import { prisma } from '../lib/prisma';
import { getProvinceName } from '../constants/provinceCodes';
import type {
  AdmissionScoreQuery,
  AdmissionScoreResult,
  BatchLine,
  BatchLinesResult,
  CandidateInput,
  Province,
  ProvinceRankSegmentInput,
  RankInfo,
  RecommendationItem,
  RiskItem,
  RiskStatus,
  SubjectCoverageResult,
  UniversityPlanResult,
} from '../types';
import type {
  IAdmissionScoreRepository,
  IBatchLineRepository,
  ICityUniversityRepository,
  IProvinceRepository,
  IRankRepository,
  IRankSegmentRepository,
  IRecommendationRepository,
  IRiskRepository,
  ISubjectCoverageRepository,
  IUniversityPlanRepository,
} from './interfaces';

/**
 * 基于 Prisma + PostgreSQL 的省份数据仓库
 */
export class PrismaProvinceRepository implements IProvinceRepository {
  /**
   * 获取全部省份配置
   * @returns 省份列表
   */
  async getAll(): Promise<Province[]> {
    const rows = await prisma.province.findMany({
      orderBy: { code: 'asc' },
    });

    return rows.map((row) => ({
      name: row.name,
      mode: row.examMode,
      maxScore: row.totalScore,
    }));
  }
}

/**
 * 基于 Prisma + PostgreSQL 的位次查询仓库
 *
 * 优先按省份匹配，找不到时回退到通用映射（provinceCode 为 null）。
 */
export class PrismaRankRepository implements IRankRepository {
  /**
   * 查询分数对应的位次信息
   * @param score 高考总分
   * @param province 省份名称
   * @returns 位次信息，无匹配时返回 null
   */
  async lookup(score: number, province: string): Promise<RankInfo | null> {
    const provinceRow = await prisma.province.findFirst({
      where: { name: province },
    });

    const provinceCode = provinceRow?.code ?? '';

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        rank: number;
        sameScore: number;
        rangeMin: number;
        rangeMax: number;
      }>
    >(
      `SELECT rank,
              same_score AS "sameScore",
              range_min AS "rangeMin",
              range_max AS "rangeMax"
       FROM rec.rank_lookups
       WHERE (province_code = $1 OR province_code IS NULL)
       ORDER BY ABS(score - $2)
       LIMIT 1`,
      provinceCode,
      score
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      rank: row.rank,
      sameScore: row.sameScore,
      range: [row.rangeMin, row.rangeMax] as [number, number],
      confidence: 'exact',
    };
  }
}

/**
 * 基于 Prisma + PostgreSQL 的批次线数据仓库
 */
export class PrismaBatchLineRepository implements IBatchLineRepository {
  /**
   * 按省份与科目类查询批次线
   * @param provinceCode 省份行政区划代码
   * @param subjectType 科目类
   * @returns 批次线结果
   */
  async getLines(
    provinceCode: string,
    subjectType: string
  ): Promise<BatchLinesResult> {
    const provinceName = getProvinceName(provinceCode) ?? provinceCode;

    const rows = await prisma.provinceBatchLine.findMany({
      where: {
        provinceCode,
        year: 2026,
        subjectType,
      },
      orderBy: { score: 'asc' },
    });

    const lines: BatchLine[] = rows.map((row) => ({
      batch: row.batch,
      score: row.score,
      label: buildBatchLabel(row.batch),
    }));

    return {
      province: provinceName,
      subjectType,
      lines,
    };
  }
}

/**
 * 基于 Prisma + PostgreSQL 的关键段位位次数据仓库
 */
export class PrismaRankSegmentRepository implements IRankSegmentRepository {
  /**
   * 按省份与科目类查询关键段位
   * @param provinceCode 省份行政区划代码
   * @param subjectType 科目类
   * @returns 关键段位列表
   */
  async getSegments(
    provinceCode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[]> {
    const rows = await prisma.provinceRankSegment.findMany({
      where: {
        provinceCode,
        year: 2026,
        subjectType,
      },
      orderBy: { score: 'desc' },
    });

    return rows.map((row) => ({
      provinceCode: row.provinceCode,
      year: row.year,
      subjectType: row.subjectType,
      score: row.score,
      rank: row.rank,
      totalCount: row.totalCount ?? undefined,
      source: row.source ?? undefined,
    }));
  }

  /**
   * 按高考模式查询一条参考关键段位（用于缺失省份估算）
   * @param mode 高考模式
   * @param subjectType 科目类
   * @returns 参考省份的关键段位
   */
  async getReferenceByMode(
    mode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[] | null> {
    const provinces = await prisma.province.findMany({
      where: { examMode: mode },
      orderBy: { code: 'asc' },
    });

    for (const province of provinces) {
      const segments = await this.getSegments(province.code, subjectType);
      if (segments.length > 0) {
        return segments;
      }
    }

    return null;
  }
}

/**
 * 基于 Prisma + PostgreSQL 的选科覆盖率数据仓库
 */
export class PrismaSubjectCoverageRepository
  implements ISubjectCoverageRepository
{
  /**
   * 按省份与选科组合查询覆盖率
   * @param provinceCode 省份行政区划代码，null 表示全国默认
   * @param subjects 选科组合
   * @returns 覆盖率结果
   */
  async getCoverage(
    provinceCode: string | null,
    subjects: string[]
  ): Promise<SubjectCoverageResult> {
    const normalizedSubjects = normalizeSubjects(subjects);

    const row = await prisma.subjectCoverage.findFirst({
      where: {
        provinceCode,
        year: 2026,
        subjects: {
          equals: normalizedSubjects,
        },
      },
    });

    if (!row) {
      return {
        coveragePct: 0,
        totalMajors: 0,
        source: '',
      };
    }

    return {
      coveragePct: row.coveragePct,
      totalMajors: row.totalMajors,
      source: row.source ?? '',
    };
  }
}

/**
 * 基于 Prisma + PostgreSQL 的推荐数据仓库
 *
 * 当前阶段直接读取 seed 写入的推荐结果 JSON；第三阶段可替换为真实推荐算法。
 */
export class PrismaRecommendationRepository
  implements IRecommendationRepository
{
  /**
   * 获取推荐志愿列表
   * @param _input 考生输入（保留给第三阶段扩展）
   * @returns 推荐志愿列表
   */
  async getRecommendations(
    _input: CandidateInput
  ): Promise<RecommendationItem[]> {
    const rows = await prisma.recommendation.findMany({
      orderBy: { generatedAt: 'asc' },
    });

    return rows.map((row) => {
      const item = row.result as unknown as RecommendationItem;
      return item;
    });
  }
}

/**
 * 基于 Prisma + PostgreSQL 的风险诊断仓库
 */
export class PrismaRiskRepository implements IRiskRepository {
  /**
   * 获取风险诊断项列表
   * @returns 风险诊断列表
   */
  async getRiskItems(): Promise<RiskItem[]> {
    const rows = await prisma.riskCheck.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status as RiskStatus,
      detail: row.detail,
    }));
  }
}

/**
 * 将批次简写转换为前端展示文案
 * @param batch 批次简写
 * @returns 展示文案
 */
function buildBatchLabel(batch: string): string {
  const labels: Record<string, string> = {
    本科: '本科线',
    特控: '特控线',
    一本: '一本线',
    二本: '二本线',
    一段: '一段线',
    二段: '二段线',
  };
  return labels[batch] ?? `${batch}线`;
}

/**
 * 归一化选科组合：去重并按固定顺序排序
 * @param subjects 原始选科组合
 * @returns 归一化后的组合
 */
function normalizeSubjects(subjects: string[]): string[] {
  const order = ['物理', '历史', '化学', '生物', '政治', '地理'];
  const unique = Array.from(new Set(subjects));
  return unique.sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );
}

/**
 * 基于 Prisma + PostgreSQL 的录取位次数据仓库
 *
 * 使用 $queryRawUnsafe JOIN universities + majors 查询录取位次数据。
 * 由于 AdmissionScore 模型没有定义 relation，使用 raw SQL 实现 JOIN。
 */
export class PrismaAdmissionScoreRepository
  implements IAdmissionScoreRepository
{
  /**
   * 按省份+年份+批次查询录取位次数据
   * @param query 查询条件
   * @returns 录取位次结果列表
   */
  async queryByRank(query: AdmissionScoreQuery): Promise<AdmissionScoreResult[]> {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
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
      }>
    >(
      `SELECT
         ads.university_id   AS "universityId",
         u.name              AS "universityName",
         ads.major_id        AS "majorId",
         m.name              AS "majorName",
         ads.min_rank        AS "minRank",
         ads.avg_rank        AS "avgRank",
         ads.max_rank        AS "maxRank",
         ads.min_score       AS "minScore",
         ads.avg_score       AS "avgScore",
         ads.plan_count      AS "planCount"
       FROM data.admission_scores ads
       JOIN data.universities u ON u.id = ads.university_id
       JOIN data.majors m ON m.id = ads.major_id
       WHERE ads.province_code = $1
         AND ads.year = $2
         AND ads.batch = $3
       ORDER BY ads.min_rank ASC`,
      query.provinceCode,
      query.year,
      query.batch
    );

    return rows.map((row) => ({
      universityId: row.universityId,
      universityName: row.universityName,
      majorId: row.majorId,
      majorName: row.majorName,
      minRank: Number(row.minRank),
      avgRank: Number(row.avgRank),
      maxRank: Number(row.maxRank),
      minScore: Number(row.minScore),
      avgScore: Number(row.avgScore),
      planCount: Number(row.planCount ?? 0),
    }));
  }
}

/**
 * 基于 Prisma + PostgreSQL 的招生计划数据仓库
 */
export class PrismaUniversityPlanRepository
  implements IUniversityPlanRepository
{
  /**
   * 按院校列表+省份+年份查询招生计划
   * @param universityIds 院校 ID 列表
   * @param provinceCode 省份代码
   * @param year 招生年份
   * @param _subjects 考生选科（当前在 DB 层不做过滤，由 Service 层处理）
   * @returns 招生计划列表
   */
  async queryPlans(
    universityIds: string[],
    provinceCode: string,
    year: number,
    _subjects?: string[]
  ): Promise<UniversityPlanResult[]> {
    if (universityIds.length === 0) {
      return [];
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        universityId: string;
        universityName: string;
        majorId: string;
        majorName: string;
        planCount: number;
        tuition: number | null;
        duration: number;
        subjectRequirements: string[];
      }>
    >(
      `SELECT
         up.university_id             AS "universityId",
         u.name                       AS "universityName",
         up.major_id                  AS "majorId",
         m.name                       AS "majorName",
         up.plan_count                AS "planCount",
         up.tuition                   AS "tuition",
         up.duration                  AS "duration",
         up.subject_requirements      AS "subjectRequirements"
       FROM data.university_plans up
       JOIN data.universities u ON u.id = up.university_id
       JOIN data.majors m ON m.id = up.major_id
       WHERE up.university_id = ANY($1::uuid[])
         AND up.province_code = $2
         AND up.year = $3
       ORDER BY u.name, m.name`,
      universityIds,
      provinceCode,
      year
    );

    return rows.map((row) => ({
      universityId: row.universityId,
      universityName: row.universityName,
      majorId: row.majorId,
      majorName: row.majorName,
      planCount: Number(row.planCount),
      tuition: row.tuition ? Number(row.tuition) : undefined,
      duration: Number(row.duration),
      subjectRequirements: Array.isArray(row.subjectRequirements)
        ? row.subjectRequirements
        : [],
    }));
  }
}

/**
 * 基于 Prisma + PostgreSQL 的城市-院校映射数据仓库
 */
export class PrismaCityUniversityRepository
  implements ICityUniversityRepository
{
  /**
   * 按城市名列表查询对应的院校 ID 集合
   * @param cityNames 城市名列表
   * @returns 院校 ID 列表
   */
  async getByCities(cityNames: string[]): Promise<string[]> {
    if (cityNames.length === 0) {
      return [];
    }

    const rows = await prisma.cityUniversityMap.findMany({
      where: { cityName: { in: cityNames } },
      select: { universityId: true },
      distinct: ['universityId'],
    });

    return rows.map((r) => r.universityId);
  }

  /**
   * 批量查询院校所在城市
   * @param universityIds 院校 ID 列表
   * @returns Map<universityId, cityName>
   */
  async getCitiesByUniversityIds(
    universityIds: string[]
  ): Promise<Map<string, string>> {
    if (universityIds.length === 0) {
      return new Map();
    }

    const rows = await prisma.cityUniversityMap.findMany({
      where: { universityId: { in: universityIds } },
      select: { universityId: true, cityName: true },
      distinct: ['universityId'],
    });

    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.universityId, row.cityName);
    }
    return map;
  }
}
