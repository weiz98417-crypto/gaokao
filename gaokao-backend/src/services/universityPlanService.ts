import type { UniversityPlanResult } from '../types';
import type { IUniversityPlanRepository } from '../repositories/interfaces';

/**
 * 招生计划服务层
 *
 * 封装招生计划查询逻辑，负责科目要求的 strict match 过滤。
 * 考生选科必须完全覆盖专业要求的所有科目（如专业要求 ['物理','化学']，
 * 考生必须同时选了物理和化学才匹配）。
 */
export class UniversityPlanService {
  constructor(private readonly repo: IUniversityPlanRepository) {}

  /**
   * 按大学列表+省份+年份查询招生计划，并过滤科目要求
   * @param universityIds 大学 ID 列表
   * @param provinceCode 目标省份代码
   * @param year 招生年份（默认 2025）
   * @param subjects 考生选科（如 ['物理', '化学', '生物']）
   * @returns 匹配的招生计划列表
   */
  async queryPlans(
    universityIds: string[],
    provinceCode: string,
    year: number = 2025,
    subjects?: string[]
  ): Promise<UniversityPlanResult[]> {
    if (universityIds.length === 0) {
      return [];
    }

    const plans = await this.repo.queryPlans(
      universityIds,
      provinceCode,
      year,
      subjects
    );

    // 如果考生没有提供选科，不过滤
    if (!subjects || subjects.length === 0) {
      return plans;
    }

    return plans.filter((plan) => this.matchesSubjects(plan, subjects));
  }

  /**
   * Strict match：考生选科必须完全覆盖专业要求
   * @param plan 招生计划项
   * @param candidateSubjects 考生选科列表
   * @returns 是否满足科目要求
   */
  private matchesSubjects(
    plan: UniversityPlanResult,
    candidateSubjects: string[]
  ): boolean {
    const requirements = plan.subjectRequirements;
    // 无科目要求 → 匹配所有考生
    if (!requirements || requirements.length === 0) {
      return true;
    }

    const candidateSet = new Set(candidateSubjects);
    return requirements.every((req: string) => candidateSet.has(req));
  }
}
