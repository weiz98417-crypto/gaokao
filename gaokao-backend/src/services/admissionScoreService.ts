import type { AdmissionScoreResult } from '../types';
import type { IAdmissionScoreRepository } from '../repositories/interfaces';

/**
 * 录取位次服务层
 *
 * 基于 IAdmissionScoreRepository 查询录取位次数据，按考生位次划分为
 * 冲/稳/保/垫四档。
 *
 * 分档规则：
 * - 冲（rush）：院校 min_rank < 考生位次，且差距 ≤ 30%（即 min_rank ≥ rank × 0.7）
 * - 稳（stable）：院校 min_rank ≈ 考生位次（±10%）
 * - 保（safe）：院校 min_rank > 考生位次，且差距 ≤ 50%（即 min_rank ≤ rank × 1.5）
 * - 垫（bottom）：院校 min_rank > 考生位次 × 1.5（确保录取）
 */
export class AdmissionScoreService {
  constructor(private readonly repo: IAdmissionScoreRepository) {}

  /**
   * 按位次区间查询录取数据，分冲/稳/保/垫四档
   * @param provinceCode 省份代码（如 '44'）
   * @param rank 考生位次
   * @param year 参考年份（默认 2025）
   * @param batch 批次（默认 '本科'）
   * @param limit 每档上限（默认 15）
   * @returns { rush, stable, safe, bottom } 四档结果
   */
  async queryByRank(
    provinceCode: string,
    rank: number,
    year: number = 2025,
    batch: string = '本科',
    limit: number = 15
  ): Promise<{
    rush: AdmissionScoreResult[];
    stable: AdmissionScoreResult[];
    safe: AdmissionScoreResult[];
    bottom: AdmissionScoreResult[];
  }> {
    // 一次性查询所有录取数据（无 rank 过滤，在应用层分档）
    const allScores = await this.repo.queryByRank({
      provinceCode,
      year,
      batch,
    });

    // 如果没有数据，尝试 fallback 年份
    let scores = allScores;
    if (scores.length === 0 && year !== 2024) {
      scores = await this.repo.queryByRank({
        provinceCode,
        year: 2024,
        batch,
      });
    }
    if (scores.length === 0 && year !== 2023) {
      scores = await this.repo.queryByRank({
        provinceCode,
        year: 2023,
        batch,
      });
    }

    const rush: AdmissionScoreResult[] = [];
    const stable: AdmissionScoreResult[] = [];
    const safe: AdmissionScoreResult[] = [];
    const bottom: AdmissionScoreResult[] = [];

    for (const item of scores) {
      if (item.minRank === undefined || item.minRank === null || item.minRank <= 0) {
        continue;
      }

      const gap = (rank - item.minRank) / rank; // 正数=用户位次更差, 负数=院校位次更差
      const rankBetter = item.minRank < rank; // 院校位次更好（更小）= 更难进

      if (rankBetter && Math.abs(gap) <= 0.3 && item.minRank >= rank * 0.7) {
        // 冲：院校位次更高但差距 ≤ 30%
        rush.push(item);
      } else if (Math.abs(gap) <= 0.15) {
        // 稳：差距 ±15%
        stable.push(item);
      } else if (!rankBetter && gap <= 0.5) {
        // 保：院校位次低于用户但差距 ≤ 50%
        safe.push(item);
      } else if (!rankBetter && item.minRank > rank * 1.5) {
        // 垫：院校位次远低于用户
        bottom.push(item);
      }
    }

    // 按位次差距排序，取上限
    return {
      rush: rush.sort((a, b) => a.minRank - b.minRank).slice(0, limit),
      stable: stable.sort((a, b) => Math.abs(rank - a.minRank) - Math.abs(rank - b.minRank)).slice(0, limit),
      safe: safe.sort((a, b) => a.minRank - b.minRank).slice(0, limit),
      bottom: bottom.sort((a, b) => a.minRank - b.minRank).slice(0, limit),
    };
  }
}
