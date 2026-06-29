import { getProvinceCode } from '../constants/provinceCodes';
import type { ProvinceRankSegmentInput, RankInfo } from '../types';
import type {
  IRankSegmentRepository,
  IProvinceRepository,
} from '../repositories/interfaces';

/**
 * 同高考模式下的默认考生总数（按科目类）
 *
 * 用于缺失省份按考生数比例缩放估算。
 */
const DEFAULT_TOTAL_COUNT: Record<string, number> = {
  物理: 280000,
  历史: 180000,
  综合改革: 60000,
  文科: 80000,
  理科: 150000,
  A类: 20000,
  B类: 20000,
};

/**
 * 位次查询服务层
 *
 * 基于省份+科目类的关键段位进行线性插值；缺失省份按同模式参考省份的考生数比例缩放估算。
 */
export class RankService {
  constructor(
    private readonly rankSegmentRepository: IRankSegmentRepository,
    private readonly provinceRepository: IProvinceRepository
  ) {}

  /**
   * 查询分数对应的位次信息
   * @param score 高考总分
   * @param province 省份中文名
   * @param subjectType 科目类
   * @returns 位次信息，无数据时返回 null
   */
  async lookup(
    score: number,
    province: string,
    subjectType: string
  ): Promise<RankInfo | null> {
    const provinceCode = getProvinceCode(province);
    if (provinceCode === '00') {
      return null;
    }

    const segments = await this.rankSegmentRepository.getSegments(
      provinceCode,
      subjectType
    );

    if (segments.length > 0) {
      return this.interpolate(score, segments, 'exact');
    }

    // 缺失省份：按同 mode 参考省份估算
    const estimated = await this.estimateByMode(score, province, subjectType);
    return estimated;
  }

  /**
   * 基于关键段位线性插值
   * @param score 查询分数
   * @param segments 关键段位（不要求已排序）
   * @param confidence 置信度
   * @returns 位次信息
   */
  private interpolate(
    score: number,
    segments: ProvinceRankSegmentInput[],
    confidence: 'exact' | 'estimated'
  ): RankInfo {
    const sorted = [...segments].sort((a, b) => b.score - a.score);

    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];

    // 高于最高段位：按最高段位同分比例外推
    if (score >= top.score) {
      const sameScore = this.estimateSameScore(sorted, 0);
      const rank = Math.max(1, Math.round(top.rank - sameScore * (score - top.score)));
      return this.buildRankInfo(rank, sameScore, confidence);
    }

    // 低于最低段位：线性衰减估算，封顶到总考生数
    if (score <= bottom.score) {
      const sameScore = this.estimateSameScore(sorted, sorted.length - 2);
      const totalCount = bottom.totalCount ?? DEFAULT_TOTAL_COUNT[bottom.subjectType] ?? 100000;
      const rank = Math.min(
        totalCount,
        Math.round(bottom.rank + sameScore * (bottom.score - score))
      );
      return this.buildRankInfo(rank, sameScore, confidence);
    }

    // 相邻两段线性插值
    for (let i = 0; i < sorted.length - 1; i++) {
      const upper = sorted[i];
      const lower = sorted[i + 1];

      if (score <= upper.score && score >= lower.score) {
        const ratio = (upper.score - score) / (upper.score - lower.score);
        const rank = Math.round(upper.rank + (lower.rank - upper.rank) * ratio);
        const sameScore = this.estimateSameScore(sorted, i);
        return this.buildRankInfo(rank, sameScore, confidence);
      }
    }

    // 兜底
    const closest = sorted.reduce((best, segment) =>
      Math.abs(segment.score - score) < Math.abs(best.score - score)
        ? segment
        : best
    );
    return this.buildRankInfo(closest.rank, 1, confidence);
  }

  /**
   * 按同高考模式参考省份估算位次
   * @param score 查询分数
   * @param province 目标省份中文名
   * @param subjectType 科目类
   * @returns 位次信息
   */
  private async estimateByMode(
    score: number,
    province: string,
    subjectType: string
  ): Promise<RankInfo | null> {
    const provinces = await this.provinceRepository.getAll();
    const current = provinces.find((p) => p.name === province);
    if (!current) {
      return null;
    }

    const reference = await this.rankSegmentRepository.getReferenceByMode(
      current.mode,
      subjectType
    );
    if (!reference || reference.length === 0) {
      return null;
    }

    const refRankInfo = this.interpolate(score, reference, 'estimated');
    const refTotal = this.getTotalCount(reference, subjectType);
    const targetTotal = DEFAULT_TOTAL_COUNT[subjectType] ?? refTotal;

    if (refTotal > 0 && targetTotal > 0) {
      const ratio = targetTotal / refTotal;
      const scaledRank = Math.max(1, Math.round(refRankInfo.rank * ratio));
      return this.buildRankInfo(scaledRank, refRankInfo.sameScore, 'estimated');
    }

    return refRankInfo;
  }

  /**
   * 从关键段位中获取总考生数
   * @param segments 关键段位
   * @param subjectType 科目类
   * @returns 总考生数
   */
  private getTotalCount(
    segments: ProvinceRankSegmentInput[],
    subjectType: string
  ): number {
    for (const segment of segments) {
      if (segment.totalCount && segment.totalCount > 0) {
        return segment.totalCount;
      }
    }
    return DEFAULT_TOTAL_COUNT[subjectType] ?? 100000;
  }

  /**
   * 估算同分人数
   * @param sorted 已排序的关键段位
   * @param upperIndex 上段位索引
   * @returns 同分人数
   */
  private estimateSameScore(
    sorted: ProvinceRankSegmentInput[],
    upperIndex: number
  ): number {
    const upper = sorted[upperIndex];
    const lower = sorted[upperIndex + 1];
    if (!upper || !lower) {
      return 1;
    }

    const scoreDiff = upper.score - lower.score;
    const rankDiff = lower.rank - upper.rank;
    if (scoreDiff <= 0) {
      return 1;
    }

    return Math.max(1, Math.round(rankDiff / scoreDiff));
  }

  /**
   * 构造位次结果
   * @param rank 估算位次
   * @param sameScore 同分人数
   * @param confidence 置信度
   * @returns 位次信息
   */
  private buildRankInfo(
    rank: number,
    sameScore: number,
    confidence: 'exact' | 'estimated'
  ): RankInfo {
    return {
      rank,
      sameScore,
      range: [rank + 1, rank + sameScore] as [number, number],
      confidence,
    };
  }
}
