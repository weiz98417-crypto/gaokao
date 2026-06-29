import { getProvinceCode } from '../constants/provinceCodes';
import type { BatchLinesResult } from '../types';
import type {
  IBatchLineRepository,
  IProvinceRepository,
} from '../repositories/interfaces';

/**
 * 批次线业务服务
 *
 * 按省份与科目类查询批次线，本省无数据时按同高考模式省份补全。
 */
export class BatchLineService {
  constructor(
    private readonly batchLineRepository: IBatchLineRepository,
    private readonly provinceRepository: IProvinceRepository
  ) {}

  /**
   * 查询批次线
   * @param province 省份中文名
   * @param subjectType 科目类
   * @returns 批次线结果
   */
  async getLines(province: string, subjectType: string): Promise<BatchLinesResult> {
    const provinceCode = getProvinceCode(province);
    if (provinceCode === '00') {
      return {
        province,
        subjectType,
        lines: [],
      };
    }

    const direct = await this.batchLineRepository.getLines(provinceCode, subjectType);
    if (direct.lines.length > 0) {
      return {
        province,
        subjectType,
        lines: direct.lines,
      };
    }

    // 本省缺失：按同 examMode 省份补全
    const fallback = await this.findFallbackByMode(province, subjectType);
    if (fallback) {
      return {
        province,
        subjectType,
        lines: fallback.lines,
      };
    }

    return {
      province,
      subjectType,
      lines: [],
    };
  }

  /**
   * 按同高考模式查找有数据的参考省份
   * @param province 目标省份中文名
   * @param subjectType 科目类
   * @returns 参考省份的批次线，无则返回 null
   */
  private async findFallbackByMode(
    province: string,
    subjectType: string
  ): Promise<BatchLinesResult | null> {
    const provinces = await this.provinceRepository.getAll();
    const current = provinces.find((p) => p.name === province);
    if (!current) {
      return null;
    }

    for (const candidate of provinces) {
      if (candidate.name === province || candidate.mode !== current.mode) {
        continue;
      }

      const candidateCode = getProvinceCode(candidate.name);
      if (candidateCode === '00') {
        continue;
      }

      const candidateLines = await this.batchLineRepository.getLines(
        candidateCode,
        subjectType
      );
      if (candidateLines.lines.length > 0) {
        return candidateLines;
      }
    }

    return null;
  }
}
