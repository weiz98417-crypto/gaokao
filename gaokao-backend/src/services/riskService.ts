import type { CandidateInput, RiskItem, RecommendationItem } from '../types';
import type { IRiskRepository } from '../repositories/interfaces';
import { LlmService } from './llmService';

/**
 * 风险诊断服务层
 *
 * 若传入考生信息与推荐方案，优先调用大模型进行风险诊断；
 * 否则返回仓库中的默认风险诊断数据。
 */
export class RiskService {
  private readonly llmService: LlmService | undefined;

  constructor(private readonly repository: IRiskRepository) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1';
    const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash';

    if (apiKey && apiKey !== 'YOUR_DEEPSEEK_API_KEY') {
      this.llmService = new LlmService({ apiKey, baseUrl, model, timeoutMs: 60000 });
    }
  }

  /**
   * 获取风险诊断列表
   * @param input 可选考生输入
   * @param recommendations 可选推荐方案，用于 LLM 诊断
   * @returns 风险诊断项
   */
  async getRiskItems(input?: CandidateInput, recommendations?: RecommendationItem[]): Promise<RiskItem[]> {
    if (process.env.USE_LLM === 'false') {
      return this.repository.getRiskItems();
    }

    if (this.llmService && input && recommendations && recommendations.length > 0) {
      try {
        const items = await this.llmService.generateRiskItems(input, recommendations);
        if (items.length > 0) {
          return items;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('LLM risk diagnosis failed, fallback to mock data:', err instanceof Error ? err.message : String(err));
      }
    }

    return this.repository.getRiskItems();
  }
}
