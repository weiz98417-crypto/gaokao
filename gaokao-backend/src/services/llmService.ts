import type {
  CandidateInput,
  RecommendationItem,
  RiskItem,
  ScoreYear,
  Trend,
} from '../types';

/**
 * DB 筛选后的候选条目（传给 LLM 排序用）
 */
export interface EnrichedCandidate {
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  city?: string;
  provinceCode: string;
  minRank: number;
  avgRank: number;
  minScore: number;
  avgScore: number;
  planCount: number;
  tuition?: number;
  tier: '冲' | '稳' | '保' | '垫';
  rankGap: number;
  scores: ScoreYear[];
  trend: Trend;
  subjectRequirements?: string[];
}

/**
 * DeepSeek 大模型服务
 *
 * 通过 DeepSeek OpenAI-compatible Chat API 获取推荐或风险诊断结果。
 * 若环境变量 DEEPSEEK_API_KEY 未设置或调用失败，抛出异常供上层兜底。
 */
export interface LlmOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class LlmService {
  constructor(private readonly options: LlmOptions) {}

  /**
   * 调用大模型并返回推荐志愿列表（已废弃，保留兼容）
   * @deprecated 使用 rankAndEnrich 替代
   */
  async generateRecommendations(input: CandidateInput): Promise<RecommendationItem[]> {
    const prompt = buildRecommendationPrompt(input);
    const raw = await this.chat(prompt);
    return parseRecommendationResponse(raw);
  }

  /**
   * DB 查询后的 LLM 排序+打分+理由（两步法核心）
   *
   * LLM 不再编造院校/专业名称——这些数据全部由 DB 提供。
   * LLM 仅负责：排序 + purity 打分 + 理由生成。
   *
   * @param dbResults DB 初筛+城市过滤+专业匹配后的候选列表
   * @param input 考生输入（含偏好）
   * @param userRank 考生位次
   * @returns 精选后的推荐列表（8条，含 purity + reason）
   */
  async rankAndEnrich(
    dbResults: EnrichedCandidate[],
    input: CandidateInput,
    userRank: number
  ): Promise<RecommendationItem[]> {
    const prompt = buildRankPrompt(dbResults, input, userRank);
    const raw = await this.chat(prompt);
    // eslint-disable-next-line no-console
    console.log('[LLM] Raw response length:', raw.length, 'first 200:', raw.substring(0, 200));
    return parseRankResponse(raw, dbResults);
  }

  /**
   * 调用大模型并返回风险诊断列表
   */
  async generateRiskItems(input: CandidateInput, recommendations: RecommendationItem[]): Promise<RiskItem[]> {
    const prompt = buildRiskPrompt(input, recommendations);
    const raw = await this.chat(prompt);
    return parseRiskResponse(raw);
  }

  private async chat(prompt: string): Promise<string> {
    const { apiKey, baseUrl, model, timeoutMs = 60000, maxRetries = 1 } = this.options;

    if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY') {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are a helpful Chinese college admission recommendation assistant. Always return valid JSON without markdown code fences.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    };

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`DeepSeek API error ${res.status}: ${text.slice(0, 200)}`);
        }

        const json = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string };
        };

        if (json.error?.message) {
          throw new Error(`DeepSeek API error: ${json.error.message}`);
        }

        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('DeepSeek API returned empty content');
        }

        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await delay(1000 * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error('LLM request failed');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRecommendationPrompt(input: CandidateInput): string {
  const subjects = input.subjects?.join('、') ?? '未指定';
  const weights = input.weights ?? [40, 30, 30];
  const preferences = JSON.stringify(input.preferences ?? {}, null, 2);

  return `你是一位资深高考志愿填报专家。请根据以下考生信息，生成 8 个推荐志愿（冲 2 个、稳 2 个、保 2 个、垫 2 个），并严格按以下 JSON 对象格式返回。

考生信息：
- 省份：${input.province}
- 高考总分：${input.score}
- 位次：${input.rank ?? '未知'}
- 选科：${subjects}
- 权重：院校 ${weights[0]}%，地域 ${weights[1]}%，专业 ${weights[2]}%
- 其他偏好：${preferences}

必须返回的 JSON 格式（不要 markdown 代码块）：
{
  "recommendations": [
    {
      "id": "1",
      "college": "大学名称",
      "major": "专业名称",
      "majorGroup": "专业组要求，如 物理+化学",
      "scores": [
        { "year": 2023, "score": 628 },
        { "year": 2024, "score": 632 },
        { "year": 2025, "score": 635 }
      ],
      "trend": "up",
      "probability": 15,
      "purity": 92,
      "tier": "冲"
    }
  ]
}

注意：
1. 必须返回严格合法的 JSON 对象，顶层字段只能是 recommendations。
2. 数据要合理，院校层次要与省份匹配。
3. probability 为 0-100 的整数，tier 只能是"冲"、"稳"、"保"、"垫"之一。
4. 院校和专业必须是真实存在或高度仿真的。`;
}

function buildRiskPrompt(input: CandidateInput, recommendations: RecommendationItem[]): string {
  return `你是一位高考志愿填报风险诊断专家。请根据以下推荐方案进行风险诊断，并严格按以下 JSON 对象格式返回。

考生信息：
- 省份：${input.province}
- 总分：${input.score}
- 位次：${input.rank ?? '未知'}
- 选科：${input.subjects?.join('、') ?? '未指定'}

推荐方案（共 ${recommendations.length} 个）：
${recommendations.map(r => `- ${r.college} ${r.major} | ${r.tier} | 概率 ${r.probability}% | 纯净度 ${r.purity}%`).join('\n')}

必须返回的 JSON 格式（不要 markdown 代码块）：
{
  "riskItems": [
    { "id": "1", "name": "梯度合理性", "status": "pass", "detail": "描述" },
    { "id": "2", "name": "撞车检测", "status": "warn", "detail": "描述" },
    { "id": "3", "name": "志愿填满", "status": "pass", "detail": "描述" },
    { "id": "4", "name": "重复院校", "status": "pass", "detail": "描述" },
    { "id": "5", "name": "选科复核", "status": "pass", "detail": "描述" },
    { "id": "6", "name": "纯净度均值", "status": "warn", "detail": "描述" }
  ]
}

status 只能是 pass、warn、danger 之一。`;
}

function parseRecommendationResponse(raw: string): RecommendationItem[] {
  const cleaned = extractJson(raw);
  const parsed = JSON.parse(cleaned) as unknown;

  const items = (parsed as any).recommendations;
  if (!Array.isArray(items)) {
    throw new Error('LLM recommendation response missing recommendations array');
  }

  return items.map((item: any) => ({
    id: String(item.id ?? cryptoRandomId()),
    college: String(item.college ?? ''),
    major: String(item.major ?? ''),
    majorGroup: String(item.majorGroup ?? ''),
    scores: Array.isArray(item.scores)
      ? item.scores.map((s: any) => ({ year: Number(s.year), score: Number(s.score) }))
      : [],
    trend: normalizeTrend(item.trend),
    probability: clamp(Number(item.probability ?? 0), 0, 100),
    purity: clamp(Number(item.purity ?? 0), 0, 100),
    tier: normalizeTier(item.tier),
  })) as RecommendationItem[];
}

function parseRiskResponse(raw: string): RiskItem[] {
  const cleaned = extractJson(raw);
  const parsed = JSON.parse(cleaned) as unknown;

  const items = (parsed as any).riskItems;
  if (!Array.isArray(items)) {
    throw new Error('LLM risk response missing riskItems array');
  }

  return items.map((item: any) => ({
    id: String(item.id ?? cryptoRandomId()),
    name: String(item.name ?? ''),
    status: normalizeRiskStatus(item.status),
    detail: String(item.detail ?? ''),
  })) as RiskItem[];
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  // Remove markdown code fences if any
  const noFences = trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  // Try to find the outermost JSON object
  const start = noFences.indexOf('{');
  const end = noFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return noFences;
  }
  return noFences.slice(start, end + 1);
}

function normalizeTrend(t: unknown): 'up' | 'down' | 'stable' {
  if (t === 'up' || t === 'down' || t === 'stable') return t;
  return 'stable';
}

function normalizeTier(t: unknown): string {
  if (t === '冲' || t === '稳' || t === '保' || t === '垫') return t;
  return '稳';
}

function normalizeRiskStatus(s: unknown): 'pass' | 'warn' | 'danger' {
  if (s === 'pass' || s === 'warn' || s === 'danger') return s;
  return 'warn';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/**
 * 构建 LLM 排序 prompt（两步法专用）
 *
 * 关键约束：LLM 只能排序已有候选项，不允许编造任何院校/专业名称。
 */
function buildRankPrompt(
  dbResults: EnrichedCandidate[],
  input: CandidateInput,
  userRank: number
): string {
  const cities = input.preferences?.preferredCities?.join('、') ?? '不限';
  const disciplines = input.preferences?.disciplines?.join('、') ?? '不限';
  const weights = input.weights ?? [40, 30, 30];
  const subjectType = input.preferences?.subjectType ?? '未知';

  // 按分档分组描述
  const grouped = groupByTier(dbResults);
  let candidatesBlock = '';
  for (const tier of ['冲', '稳', '保', '垫'] as const) {
    const list = grouped[tier] ?? [];
    if (list.length === 0) continue;
    candidatesBlock += `\n【${tier}档】（${list.length}条）：\n`;
    candidatesBlock += list
      .map(
        (c, i) =>
          `  #${i + 1} ${c.universityName} · ${c.majorName} · ${c.city ?? '未知'} | 最低位次: ${c.minRank} | 最低分: ${c.minScore} | 招生: ${c.planCount}人 | 学费: ${c.tuition ?? '未知'}`
      )
      .join('\n');
  }

  return `【系统指令】你是一位高考志愿推荐排序专家。以下候选列表来自数据库真实查询结果（含历年录取位次、招生计划、专业详情）。你的任务是排序并评估纯度，严禁编造任何院校名称、专业名称或分数数据！你只能从已有候选项中选择和排序。

考生信息：
- 省份：${input.province}
- 高考总分：${input.score}
- 位次：${userRank}
- 选科：${input.subjects?.join('、') ?? '未指定'}
- 科目类：${subjectType}
- 偏好城市：${cities}
- 偏好专业方向：${disciplines}
- 权重：院校 ${weights[0]}%、地域 ${weights[1]}%、专业 ${weights[2]}%

候选列表（已按位次分档）：
${candidatesBlock}

要求：
1. 从每档（冲/稳/保/垫）各选 2 条最佳推荐，共 8 条
2. 排序准则：结合用户偏好的城市、专业方向和权重
3. purity（纯净度，0-100 整数）：评估专业与考生意愿的匹配度
   - 城市、专业、院校层次完全匹配 → 90-100
   - 两项匹配 → 70-89
   - 一项匹配 → 50-69
   - 无匹配 → 0-49
4. reason（推荐理由，≤30 字）：用一句话说明为什么推荐
5. 必须返回严格合法的 JSON 对象（不要 markdown 代码块）：

{
  "recommendations": [
    {
      "tier": "冲",
      "index": 1,
      "purity": 92,
      "reason": "广州本地，计算机专业实力强"
    }
  ]
}

index 是候选列表中该档的序号（#1, #2, #3...）。purity 必须是 0-100 的整数。reason 不超过 30 字。再次强调：禁止编造任何院校或专业名称！`;
}

/**
 * 按分档分组
 */
function groupByTier(
  candidates: EnrichedCandidate[]
): Record<string, EnrichedCandidate[]> {
  const grouped: Record<string, EnrichedCandidate[]> = {
    '冲': [],
    '稳': [],
    '保': [],
    '垫': [],
  };
  for (const c of candidates) {
    (grouped[c.tier] ??= []).push(c);
  }
  return grouped;
}

/**
 * 解析 LLM 排序响应，映射回原始候选数据
 */
function parseRankResponse(
  raw: string,
  originalCandidates: EnrichedCandidate[]
): RecommendationItem[] {
  const cleaned = extractJson(raw);
  const parsed = JSON.parse(cleaned) as unknown;
  const items = (parsed as Record<string, unknown>).recommendations;

  if (!Array.isArray(items)) {
    throw new Error('LLM rank response missing recommendations array');
  }

  // Group candidates by tier for index-based lookup
  const byTier: Record<string, EnrichedCandidate[]> = {};
  for (const c of originalCandidates) {
    (byTier[c.tier] ??= []).push(c);
  }

  const results: RecommendationItem[] = [];

  for (const item of items) {
    const tier = String((item as Record<string, unknown>).tier ?? '冲');
    const index = Number((item as Record<string, unknown>).index ?? 1) - 1; // 1-based to 0-based
    const purity = clamp(Number((item as Record<string, unknown>).purity ?? 70), 0, 100);
    const reason = String((item as Record<string, unknown>).reason ?? '');

    const tierCandidates = byTier[tier] ?? [];
    const candidate = tierCandidates[index];

    if (!candidate) {
      // Index out of range, skip
      continue;
    }

    const probability = calcProbabilityFromTier(candidate.tier, candidate.rankGap);

    results.push({
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
      purity,
      tier: candidate.tier,
      planCount: candidate.planCount,
      tuition: candidate.tuition,
      reason: reason || '基于历年录取位次和偏好综合推荐',
    });
  }

  return results;
}

/**
 * 根据分档和位次差距计算概率
 */
function calcProbabilityFromTier(tier: string, rankGap: number): number {
  switch (tier) {
    case '冲':
      return Math.max(5, Math.round(30 - (rankGap / 1000) * 2));
    case '稳':
      return Math.max(30, Math.round(70 - (rankGap / 1000) * 3));
    case '保':
      return Math.min(95, Math.round(80 + (rankGap / 5000) * 2));
    case '垫':
      return 98;
    default:
      return 50;
  }
}
