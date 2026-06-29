import { PROVINCE_CODE_MAP } from '../constants/provinceCodes';
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
  SubjectCoverageResult,
  UniversityPlanResult,
} from '../types';
import {
  MOCK_ADMISSION_SCORES,
  MOCK_BATCH_LINES,
  MOCK_CITY_UNIVERSITY_MAP,
  MOCK_RANK_SEGMENTS,
  MOCK_RECOMMENDATIONS,
  MOCK_SUBJECT_COVERAGES,
  MOCK_UNIVERSITY_PLANS,
  PROVINCES,
  RANK_LOOKUP,
  RISK_DATA,
} from '../data/mockData';
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
 * 内存 Mock 仓库实现
 *
 * 仅用于第一阶段本地联调，所有数据均来自 `src/data/mockData.ts`。
 */

/** 省份内存仓库 */
export class InMemoryProvinceRepository implements IProvinceRepository {
  getAll(): Province[] {
    return PROVINCES;
  }
}

/** 位次内存仓库 */
export class InMemoryRankRepository implements IRankRepository {
  lookup(score: number, _province: string): RankInfo | null {
    const scores = Object.keys(RANK_LOOKUP)
      .map(Number)
      .sort((a, b) => b - a);

    if (scores.length === 0) {
      return null;
    }

    let closest = scores[0];
    let minDiff = Math.abs(score - closest);

    for (const s of scores) {
      const diff = Math.abs(score - s);
      if (diff < minDiff) {
        minDiff = diff;
        closest = s;
      }
    }

    const result = RANK_LOOKUP[closest];
    if (!result) {
      return null;
    }

    return { ...result };
  }
}

/** 批次线内存仓库 */
export class InMemoryBatchLineRepository implements IBatchLineRepository {
  async getLines(
    provinceCode: string,
    subjectType: string
  ): Promise<BatchLinesResult> {
    const provinceName =
      Object.entries(PROVINCE_CODE_MAP).find(([, code]) => code === provinceCode)?.[0] ??
      provinceCode;

    const lines: BatchLine[] = MOCK_BATCH_LINES.filter(
      (line) =>
        line.provinceCode === provinceCode && line.subjectType === subjectType
    ).map((line) => ({
      batch: line.batch,
      score: line.score,
      label: buildBatchLabel(line.batch),
    }));

    return {
      province: provinceName,
      subjectType,
      lines,
    };
  }
}

/** 关键段位位次内存仓库 */
export class InMemoryRankSegmentRepository
  implements IRankSegmentRepository
{
  async getSegments(
    provinceCode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[]> {
    return MOCK_RANK_SEGMENTS.filter(
      (segment) =>
        segment.provinceCode === provinceCode &&
        segment.subjectType === subjectType
    );
  }

  async getReferenceByMode(
    mode: string,
    subjectType: string
  ): Promise<ProvinceRankSegmentInput[] | null> {
    const provincesInMode = PROVINCES.filter((p) => p.mode === mode);
    for (const province of provincesInMode) {
      const provinceCode = provinceNameToCode(province.name);
      const segments = MOCK_RANK_SEGMENTS.filter(
        (segment) =>
          segment.provinceCode === provinceCode &&
          segment.subjectType === subjectType
      );
      if (segments.length > 0) {
        return segments;
      }
    }
    return null;
  }
}

/** 选科覆盖率内存仓库 */
export class InMemorySubjectCoverageRepository
  implements ISubjectCoverageRepository
{
  async getCoverage(
    provinceCode: string | null,
    subjects: string[]
  ): Promise<SubjectCoverageResult> {
    const normalized = normalizeSubjects(subjects);

    const row = MOCK_SUBJECT_COVERAGES.find(
      (item) =>
        item.provinceCode === provinceCode &&
        subjectsEqual(item.subjects, normalized)
    );

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

/** 推荐内存仓库 */
export class InMemoryRecommendationRepository
  implements IRecommendationRepository
{
  /**
   * 返回固定 Mock 推荐列表。
   * 当前阶段忽略输入参数，仅保证响应格式与前端一致。
   */
  getRecommendations(_input: CandidateInput): RecommendationItem[] {
    const tierOrder: Record<string, number> = {
      冲: 0,
      稳: 1,
      保: 2,
      垫: 3,
    };

    return [...MOCK_RECOMMENDATIONS].sort(
      (a, b) => tierOrder[a.tier] - tierOrder[b.tier]
    );
  }
}

/** 风险诊断内存仓库 */
export class InMemoryRiskRepository implements IRiskRepository {
  getRiskItems(): RiskItem[] {
    return RISK_DATA;
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
 * 省份中文名转行政区划代码
 * @param name 省份中文名
 * @returns 行政区划代码
 */
function provinceNameToCode(name: string): string {
  return PROVINCE_CODE_MAP[name] ?? '00';
}

/**
 * 归一化选科组合：去重并按固定顺序排序
 * @param subjects 原始选科组合
 * @returns 归一化后的组合
 */
function normalizeSubjects(subjects: string[]): string[] {
  const order = ['物理', '历史', '化学', '生物', '政治', '地理'];
  const unique = Array.from(new Set(subjects));
  return unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * 比较两个选科组合是否相同（元素顺序无关）
 * @param a 组合 A
 * @param b 组合 B
 * @returns 是否相同
 */
function subjectsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/** 录取位次内存仓库 */
export class InMemoryAdmissionScoreRepository
  implements IAdmissionScoreRepository
{
  /**
   * 按查询条件过滤内存 mock 数据
   * @param query 查询条件
   * @returns 匹配的录取位次结果
   */
  async queryByRank(query: AdmissionScoreQuery): Promise<AdmissionScoreResult[]> {
    let filtered = MOCK_ADMISSION_SCORES.filter(
      (item) =>
        item.provinceCode === query.provinceCode &&
        item.year === query.year &&
        item.batch === query.batch
    );

    if (query.minRank !== undefined) {
      filtered = filtered.filter((item) => item.minRank >= query.minRank!);
    }
    if (query.maxRank !== undefined) {
      filtered = filtered.filter((item) => item.minRank <= query.maxRank!);
    }

    return filtered.sort((a, b) => a.minRank - b.minRank);
  }
}

/** 招生计划内存仓库 */
export class InMemoryUniversityPlanRepository
  implements IUniversityPlanRepository
{
  /**
   * 按院校列表+省份+年份查询招生计划
   * @param universityIds 院校 ID 列表
   * @param provinceCode 省份代码
   * @param year 招生年份
   * @param subjects 考生选科（可选）
   * @returns 匹配的招生计划
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

    const idSet = new Set(universityIds);
    return MOCK_UNIVERSITY_PLANS.filter(
      (plan) =>
        idSet.has(plan.universityId) &&
        plan.provinceCode === provinceCode &&
        plan.year === year
    );
  }
}

/** 城市-院校映射内存仓库 */
export class InMemoryCityUniversityRepository
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

    const citySet = new Set(cityNames);
    const ids = MOCK_CITY_UNIVERSITY_MAP.filter((item) =>
      citySet.has(item.cityName)
    ).map((item) => item.universityId);

    return [...new Set(ids)];
  }

  /**
   * 批量查询院校所在城市
   * @param universityIds 院校 ID 列表
   * @returns Map<universityId, cityName>
   */
  async getCitiesByUniversityIds(
    universityIds: string[]
  ): Promise<Map<string, string>> {
    const idSet = new Set(universityIds);
    const map = new Map<string, string>();

    for (const item of MOCK_CITY_UNIVERSITY_MAP) {
      if (idSet.has(item.universityId)) {
        map.set(item.universityId, item.cityName);
      }
    }

    return map;
  }
}
