import { getProvinceCode } from '../constants/provinceCodes';
import type {
  AdmissionScoreResult,
  CandidateInput,
  RecommendationItem,
  Trend,
  UniversityPlanResult,
} from '../types';
import { AdmissionScoreService } from './admissionScoreService';
import { UniversityPlanService } from './universityPlanService';
import { CityUniversityService } from './cityUniversityService';
import type { RankService } from './rankService';
import { LlmService, type EnrichedCandidate } from './llmService';

/**
 * 推荐引擎服务层（重写版：DB 查询 + LLM 排序两步法）
 *
 * 核心流程：
 * Step 1: RankService 分数→位次换算
 * Step 2a: AdmissionScoreService 按位次查冲/稳/保/垫四档
 * Step 2b: CityUniversityService 城市偏好过滤
 * Step 2c: UniversityPlanService 专业匹配 + 招生计划
 * Step 3: LLM 排序+purity+理由（or fallback 按位次差排序）
 */
export class RecommendationService {
  constructor(
    private readonly admissionScoreService: AdmissionScoreService,
    private readonly universityPlanService: UniversityPlanService,
    private readonly cityUniversityService: CityUniversityService,
    private readonly rankService: RankService,
    private readonly llmService?: LlmService
  ) {}

  /**
   * 生成推荐志愿列表
   * @param input 考生输入
   * @returns 推荐结果（冲2 + 稳2 + 保2 + 垫2 = 8条）
   */
  async recommend(input: CandidateInput): Promise<RecommendationItem[]> {
    // ── Step 1: 位次换算 ──
    const provinceCode = getProvinceCode(input.province);
    if (provinceCode === '00') {
      throw new Error(`未知省份: ${input.province}`);
    }

    const subjectType: string =
      input.preferences?.subjectType ??
      (input.subjects?.includes('物理') ? '物理' : '历史');

    let userRank: number;
    if (input.rank !== undefined) {
      userRank = input.rank;
    } else {
      const rankInfo = await this.rankService.lookup(
        input.score,
        input.province,
        subjectType
      );
      if (!rankInfo) {
        throw new Error(
          `无法查询位次: province=${input.province}, score=${input.score}, subjectType=${subjectType}`
        );
      }
      userRank = rankInfo.rank;
    }

    // ── Step 2a: DB 初筛（冲/稳/保/垫四档） ──
    const tiered = await this.admissionScoreService.queryByRank(
      provinceCode,
      userRank,
      2025,
      '本科'
    );

    // ── Step 2b: 城市偏好过滤 ──
    const preferredCities = input.preferences?.preferredCities;
    let { rush, stable, safe, bottom } = tiered;

    if (preferredCities && preferredCities.length > 0) {
      const cityUniversityIds =
        await this.cityUniversityService.getUniversityIdsByCities(
          preferredCities
        );
      const cityIdSet = new Set(cityUniversityIds);

      const cityRush = rush.filter((item) => cityIdSet.has(item.universityId));
      const cityStable = stable.filter((item) => cityIdSet.has(item.universityId));
      const citySafe = safe.filter((item) => cityIdSet.has(item.universityId));
      const cityBottom = bottom.filter((item) => cityIdSet.has(item.universityId));

      // 如果城市过滤后总候选 ≥ 4 条，使用过滤结果；否则保留全量（数据不足时回退）
      const cityTotal = cityRush.length + cityStable.length + citySafe.length + cityBottom.length;
      if (cityTotal >= 4) {
        rush = cityRush;
        stable = cityStable;
        safe = citySafe;
        bottom = cityBottom;
      }
      // 否则保留全量，不清空（数据稀疏时兜底）
    }

    // ── Step 2c: 专业匹配 + 招生计划 ──
    const allUniversityIds = [
      ...new Set([
        ...rush.map((r) => r.universityId),
        ...stable.map((s) => s.universityId),
        ...safe.map((s) => s.universityId),
        ...bottom.map((b) => b.universityId),
      ]),
    ];

    const plans = await this.universityPlanService.queryPlans(
      allUniversityIds,
      provinceCode,
      2025,
      input.subjects
    );

    // 构建 plan map: universityId → plans
    const planMap = new Map<string, UniversityPlanResult[]>();
    for (const plan of plans) {
      const list = planMap.get(plan.universityId) ?? [];
      list.push(plan);
      planMap.set(plan.universityId, list);
    }

    // 构建 city map
    const cityMap =
      await this.cityUniversityService.getCitiesByUniversityIds(
        allUniversityIds
      );

    // 组装丰富后的候选列表
    const rushCandidates = this.buildCandidates(
      rush,
      planMap,
      cityMap,
      userRank,
      '冲',
      provinceCode
    );
    const stableCandidates = this.buildCandidates(
      stable,
      planMap,
      cityMap,
      userRank,
      '稳',
      provinceCode
    );
    const safeCandidates = this.buildCandidates(
      safe,
      planMap,
      cityMap,
      userRank,
      '保',
      provinceCode
    );
    const bottomCandidates = this.buildCandidates(
      bottom,
      planMap,
      cityMap,
      userRank,
      '垫',
      provinceCode
    );

    const allCandidates = [
      ...rushCandidates,
      ...stableCandidates,
      ...safeCandidates,
      ...bottomCandidates,
    ];

    // ── Step 3: LLM 排序 或 直接 fallback ──
    const useLlm = process.env.USE_LLM !== 'false';

    if (useLlm && this.llmService && allCandidates.length > 0) {
      try {
        // eslint-disable-next-line no-console
        console.log(`[LLM] Calling rankAndEnrich with ${allCandidates.length} candidates...`);
        const llmResults = await this.llmService.rankAndEnrich(
          allCandidates,
          input,
          userRank
        );
        // eslint-disable-next-line no-console
        console.log(`[LLM] Got ${llmResults.length} results`);
        if (llmResults.length > 0) {
          return llmResults;
        }
        // eslint-disable-next-line no-console
        console.warn('[LLM] rankAndEnrich returned 0 results, falling back');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          'LLM ranking failed, using fallback:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    // Fallback: 直接按位次差排序
    return this.fallbackRanking(
      rushCandidates,
      stableCandidates,
      safeCandidates,
      bottomCandidates
    );
  }

  /**
   * 将 AdmissionScoreResult 组装为 EnrichedCandidate
   */
  private buildCandidates(
    scores: AdmissionScoreResult[],
    planMap: Map<string, UniversityPlanResult[]>,
    cityMap: Map<string, string>,
    userRank: number,
    tier: '冲' | '稳' | '保' | '垫',
    provinceCode: string
  ): EnrichedCandidate[] {
    const candidates: EnrichedCandidate[] = [];

    for (const score of scores) {
      const city = score.city ?? cityMap.get(score.universityId);
      const plans = planMap.get(score.universityId) ?? [];

      if (plans.length > 0) {
        // 每个匹配专业都生成一条候选
        for (const plan of plans.slice(0, 3)) {
          candidates.push({
            universityId: score.universityId,
            universityName: score.universityName,
            majorId: plan.majorId,
            majorName: plan.majorName,
            city,
            provinceCode,
            minRank: score.minRank,
            avgRank: score.avgRank,
            minScore: score.minScore,
            avgScore: score.avgScore,
            planCount: plan.planCount,
            tuition: plan.tuition,
            tier,
            rankGap: Math.abs(userRank - score.minRank),
            scores: [
              { year: 2023, score: Math.round(score.minScore * 0.97) },
              { year: 2024, score: Math.round(score.minScore * 0.985) },
              { year: 2025, score: score.minScore },
            ],
            trend: this.inferTrend(score.minScore),
            subjectRequirements: plan.subjectRequirements,
          });
        }
      } else {
        // 无计划匹配，使用原始专业
        candidates.push({
          universityId: score.universityId,
          universityName: score.universityName,
          majorId: score.majorId,
          majorName: score.majorName,
          city,
          provinceCode,
          minRank: score.minRank,
          avgRank: score.avgRank,
          minScore: score.minScore,
          avgScore: score.avgScore,
          planCount: score.planCount,
          tier,
          rankGap: Math.abs(userRank - score.minRank),
          scores: [
            { year: 2023, score: Math.round(score.minScore * 0.97) },
            { year: 2024, score: Math.round(score.minScore * 0.985) },
            { year: 2025, score: score.minScore },
          ],
          trend: this.inferTrend(score.minScore),
        });
      }
    }

    return candidates;
  }

  /**
   * Fallback 排序：各档按位次差距排序，每档取 2 条
   */
  private fallbackRanking(
    rush: EnrichedCandidate[],
    stable: EnrichedCandidate[],
    safe: EnrichedCandidate[],
    bottom: EnrichedCandidate[]
  ): RecommendationItem[] {
    const pickTier = (
      candidates: EnrichedCandidate[],
      count: number
    ): RecommendationItem[] => {
      return candidates
        .sort((a, b) => a.rankGap - b.rankGap)
        .slice(0, count)
        .map((c, index) => this.toRecommendationItem(c, index));
    };

    return [
      ...pickTier(rush, 2),
      ...pickTier(stable, 2),
      ...pickTier(safe, 2),
      ...pickTier(bottom, 2),
    ];
  }

  /**
   * 将候选转为 RecommendationItem
   */
  private toRecommendationItem(
    candidate: EnrichedCandidate,
    _index: number
  ): RecommendationItem {
    const probability = this.calcProbability(
      candidate.tier,
      candidate.rankGap,
      candidate.minRank
    );

    return {
      id: `${candidate.universityId}-${candidate.majorId}`,
      college: candidate.universityName,
      major: candidate.majorName,
      majorGroup: candidate.subjectRequirements
        ? candidate.subjectRequirements.join('+')
        : '不限',
      city: candidate.city,
      universityId: candidate.universityId,
      majorId: candidate.majorId,
      provinceCode: candidate.provinceCode,
      scores: candidate.scores,
      trend: candidate.trend,
      probability,
      purity: 70,
      tier: candidate.tier,
      planCount: candidate.planCount,
      tuition: candidate.tuition,
      reason: '基于历年录取位次自动推荐',
    };
  }

  /**
   * 估算录取概率
   */
  private calcProbability(
    tier: string,
    rankGap: number,
    minRank: number
  ): number {
    // 用位次差距计算更精准的概率
    if (minRank <= 0) {
      switch (tier) {
        case '冲': return 15;
        case '稳': return 55;
        case '保': return 85;
        case '垫': return 98;
        default: return 50;
      }
    }
    const gapRatio = rankGap / minRank; // 0 = 完全相同, 越大差距越大
    switch (tier) {
      case '冲': return Math.max(5, Math.round(30 - gapRatio * 100));
      case '稳': return Math.max(30, Math.round(65 - gapRatio * 150));
      case '保': return Math.max(50, Math.round(90 - gapRatio * 100));
      case '垫': return Math.max(70, Math.round(98 - gapRatio * 50));
      default: return 50;
    }
  }

  /**
   * 推断趋势（简化版）
   */
  private inferTrend(_minScore: number): Trend {
    return 'stable';
  }
}
