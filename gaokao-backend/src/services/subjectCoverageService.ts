import { getProvinceCode } from '../constants/provinceCodes';
import type { SubjectCoverageResult } from '../types';
import type { ISubjectCoverageRepository } from '../repositories/interfaces';

/**
 * 选科覆盖率业务服务
 *
 * 按省份与选科组合查询覆盖率，省份无数据时回退到全国默认。
 */
export class SubjectCoverageService {
  constructor(
    private readonly subjectCoverageRepository: ISubjectCoverageRepository
  ) {}

  /**
   * 查询选科覆盖率
   * @param province 省份中文名
   * @param subjects 选科组合
   * @returns 覆盖率结果
   */
  async getCoverage(
    province: string,
    subjects: string[]
  ): Promise<SubjectCoverageResult> {
    const provinceCode = getProvinceCode(province);

    if (provinceCode !== '00') {
      const provincial = await this.subjectCoverageRepository.getCoverage(
        provinceCode,
        subjects
      );
      if (provincial.coveragePct > 0) {
        return provincial;
      }
    }

    const national = await this.subjectCoverageRepository.getCoverage(null, subjects);
    if (national.coveragePct > 0) {
      return {
        ...national,
        source: national.source || '全国默认（基于985/重点专业样本）',
      };
    }

    // 兜底：物化组合给 85%，其他给 40%
    const hasPhysicsAndChemistry =
      subjects.includes('物理') && subjects.includes('化学');
    return {
      coveragePct: hasPhysicsAndChemistry ? 0.85 : 0.4,
      totalMajors: 800,
      source: '系统兜底估算',
    };
  }
}
