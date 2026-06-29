# 高考志愿填报 APP — 增量架构设计（全数据推荐引擎）

> **设计人**：高见远（Architect）  
> **日期**：2026-06-29  
> **目标**：解决「地域偏好被无视」「分数不匹配」「结果无专业」三大致命问题，实现 DB 查询 + LLM 排序两步法推荐引擎  
> **兼容约束**：USE_DATABASE=true/false 双模式、InMemoryRepository 同步新增、导入脚本幂等

---

## 一、实现方案概述（5条）

1. **Prisma Schema 新增 `CityUniversityMap` 模型**（data schema），建立城市→大学的多对多映射，支持地域偏好过滤。无需新增 npm 依赖包。

2. **新增 3 个 Repository 层**（AdmissionScore / UniversityPlan / CityUniversity），沿袭现有 `I*Repository` 接口 + `InMemory*` + `Prisma*` 双实现模式，保证 USE_DATABASE 双模兼容。

3. **新增 3 个 Service 类**（AdmissionScoreService / UniversityPlanService / CityUniversityService），封装业务查询逻辑，分别负责位次匹配录取数据、招生计划查询、城市-院校映射。

4. **重写 RecommendationService**（两步法）：Step 1—RankService 分数→位次；Step 2a—AdmissionScoreService 查冲/稳/保三档；Step 2b—CityUniversityService 城市过滤；Step 2c—UniversityPlanService 专业匹配；Step 3—LLM 仅排序+purity+理由（不再由 LLM 编造院校/分数数据）。

5. **5 个新导入脚本**：分别从 985/211/行业特色院校位次表、30省招生计划、985+211专业详情 Markdown 文件解析并幂等导入 PostgreSQL，同时处理院校名 fuzzy match（如「中大」→「中山大学」）。

---

## 二、新增/修改文件清单

```
# === 修改现有文件 ===
gaokao-backend/prisma/schema.prisma              # 新增 CityUniversityMap 模型
gaokao-backend/prisma/seed.ts                     # 新增 CityUniversityMap seed
gaokao-backend/src/types/index.ts                 # 扩展 CandidateInput / RecommendationItem 类型
gaokao-backend/src/repositories/interfaces.ts     # 新增 3 个仓库接口
gaokao-backend/src/repositories/inMemoryRepository.ts  # 新增 3 个 InMemory 实现
gaokao-backend/src/repositories/prismaRepository.ts    # 新增 3 个 Prisma 实现
gaokao-backend/src/services/recommendationService.ts   # 重写为两步法
gaokao-backend/src/services/llmService.ts              # 修复 Prompt（P0-6）
gaokao-backend/src/app.ts                              # 新增 3 个 Service/Repo 的 DI 组装
gaokao-backend/src/routes/index.ts                     # 推荐路由传递完整 CandidateInput 给新引擎
gaokao-backend/src/data/mockData.ts                    # 新增 InMemory 模式的 admission_scores / university_plans / city_university_map mock
gaokao-backend/scripts/importAll.ts                    # 新增 5 个导入脚本入口
gaokao-backend/package.json                            # 新增 npm run import:* scripts

# === 新增文件 ===
gaokao-backend/src/services/admissionScoreService.ts   # 录取位次查询服务
gaokao-backend/src/services/universityPlanService.ts   # 招生计划查询服务
gaokao-backend/src/services/cityUniversityService.ts   # 城市-院校映射服务
gaokao-backend/src/lib/nameResolver.ts                 # 院校名 fuzzy match 工具
gaokao-backend/scripts/importAdmissionScores.ts        # 导入录取位次数据
gaokao-backend/scripts/importUniversityPlans.ts        # 导入招生计划数据
gaokao-backend/scripts/importMajors.ts                 # 导入专业详情数据
gaokao-backend/scripts/importCityUniversityMap.ts      # 导入城市-院校映射
gaokao-backend/scripts/importAll.ts                    # 重写聚合脚本

# === 前端修改（P0-7: 推荐结果展示专业） ===
gaokao-app/src/data.ts                                # 扩展 RecommendationItem 类型（新增 city/universityId/provinceCode 字段）
gaokao-app/src/pages.tsx                              # 结果卡片展示专业详情（专业名 + 招生人数 + 学费）
```

---

## 三、Prisma Schema 新增模型

```prisma
model CityUniversityMap {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cityName     String   @map("city_name") @db.VarChar(100)
  universityId String   @map("university_id") @db.Uuid
  provinceCode String   @map("province_code") @db.VarChar(10)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@unique([cityName, universityId])
  @@map("city_university_map")
  @@schema("data")
}
```

迁移命令：
```bash
npx prisma migrate dev --name add_city_university_map
```

---

## 四、核心类型定义变更

### 4.1 CandidateInput 扩展（`src/types/index.ts`）

```typescript
export interface CandidateInput {
  province: string;
  score: number;
  rank?: number;
  subjects?: string[];
  /** 偏好设置：支持城市、院校层次、专业方向 */
  preferences?: {
    collegeLevel?: string;       // '985' | '211' | '双一流' | '不限'
    preferredCities?: string[];  // ['北京', '上海', '广州']
    disciplines?: string[];      // ['计算机', '临床医学']
    selectedMajor?: string;
    careerOrientation?: string;
    subjectType?: string;        // '物理' | '历史' | ...
  };
  weights?: number[];           // [院校%, 地域%, 专业%]
}
```

### 4.2 RecommendationItem 扩展

```typescript
export interface RecommendationItem {
  id: string;
  college: string;           // 院校名称
  major: string;             // 专业名称（P0-3 新增）
  majorGroup: string;        // 专业组要求
  city: string;              // 🆕 所在城市
  provinceCode: string;      // 🆕 所在省份代码
  universityId: string;      // 🆕 数据库中的大学 ID
  majorId: string;           // 🆕 数据库中的专业 ID
  scores: ScoreYear[];       // 历年录取分数
  trend: Trend;
  probability: number;       // 录取概率（来自位次计算）
  purity: number;            // 纯净度（来自 LLM）
  tier: string;              // '冲' | '稳' | '保' | '垫'
  planCount?: number;        // 🆕 招生计划人数
  tuition?: number;          // 🆕 学费
  reason?: string;           // 🆕 LLM 推荐理由
}
```

### 4.3 新增查询 DTO 类型

```typescript
/** 录取位次查询条件 */
export interface AdmissionScoreQuery {
  provinceCode: string;
  year: number;
  batch: string;              // '本科' | '一本' 等
  minRank?: number;
  maxRank?: number;
  subjectType?: string;
}

/** 录取位次查询结果（含 JOIN 信息） */
export interface AdmissionScoreResult {
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
  city?: string;
}
```

---

## 五、新增 Service 类设计

### 5.1 AdmissionScoreService

```typescript
// src/services/admissionScoreService.ts
export class AdmissionScoreService {
  constructor(private readonly repo: IAdmissionScoreRepository) {}

  /**
   * 按位次区间查询录取数据，分冲/稳/保三档
   * @param provinceCode 省份代码
   * @param rank 考生位次
   * @param year 参考年份
   * @param batch 批次
   * @param limit 每档上限
   * @returns { rush, stable, safe } 三档结果
   */
  async queryByRank(
    provinceCode: string,
    rank: number,
    year: number,
    batch: string,
    limit?: number
  ): Promise<{ rush: AdmissionScoreResult[]; stable: AdmissionScoreResult[]; safe: AdmissionScoreResult[] }>;
}
```

**分档规则**：
- **冲（rush）**：`min_rank < user_rank`（院校录取位次高于考生，有一定冲刺空间），rank 差距 ≤ 30%
- **稳（stable）**：`min_rank ≈ user_rank`（±10%），匹配度最高
- **保（safe）**：`min_rank > user_rank`（院校录取位次低于考生），rank 差距 ≤ 50%

### 5.2 UniversityPlanService

```typescript
// src/services/universityPlanService.ts
export class UniversityPlanService {
  constructor(private readonly repo: IUniversityPlanRepository) {}

  /**
   * 按大学+专业+省份查询招生计划
   * @param universityIds 大学 ID 列表
   * @param provinceCode 目标省份
   * @param year 招生年份
   * @param subjects 考生选科（用于科目要求匹配）
   * @returns 招生计划详情列表
   */
  async queryPlans(
    universityIds: string[],
    provinceCode: string,
    year: number,
    subjects?: string[]
  ): Promise<UniversityPlanResult[]>;
}
```

### 5.3 CityUniversityService

```typescript
// src/services/cityUniversityService.ts
export class CityUniversityService {
  constructor(private readonly repo: ICityUniversityRepository) {}

  /**
   * 按城市名查询该城市的大学 ID 集合
   * @param cityNames 城市名列表（如 ['北京', '广州']）
   * @returns 大学 ID 列表
   */
  async getUniversityIdsByCities(cityNames: string[]): Promise<string[]>;

  /**
   * 批量获取大学所在城市
   * @param universityIds 大学 ID 列表
   * @returns Map<universityId, cityName>
   */
  async getCitiesByUniversityIds(universityIds: string[]): Promise<Map<string, string>>;
}
```

---

## 六、推荐引擎流程图（两步法文字描述）

```
┌─────────────────────────────────────────────────────────────────┐
│                    推荐引擎两步法流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 分数→位次换算（已有能力）                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RankService.lookup(score, province, subjectType)          │  │
│  │ → RankInfo { rank: 8536, sameScore: 120, range: [...] }  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 2a: 按位次查 admission_scores 三档                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AdmissionScoreService.queryByRank(provinceCode, rank,     │  │
│  │   year=2025, batch='本科')                                │  │
│  │ → 冲档: avg_rank < user_rank (差距≤30%)                    │  │
│  │ → 稳档: avg_rank ≈ user_rank (±10%)                       │  │
│  │ → 保档: avg_rank > user_rank (差距≤50%)                    │  │
│  │ → 垫档: avg_rank >> user_rank (确保录取)                    │  │
│  │ 返回: { rush: [...], stable: [...], safe: [...],          │  │
│  │         bottom: [...] }                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 2b: 城市过滤（如果有偏好城市）                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ if (preferences.preferredCities?.length > 0)              │  │
│  │   CityUniversityService.getUniversityIdsByCities(cities)  │  │
│  │   → 过滤结果，只保留匹配城市的院校                           │  │
│  │   若过滤后某档不足2条，从原档补足（标记为跨城市）              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 2c: 专业匹配 + 招生计划                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ UniversityPlanService.queryPlans(universityIds,           │  │
│  │   provinceCode, year=2026, subjects)                      │  │
│  │ → JOIN university_plans + majors                          │  │
│  │ → 筛选科目要求匹配的专业                                    │  │
│  │ → 返回 plan_count, tuition, duration 等                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 3: LLM 排序 + 纯净度 + 理由（不再编造数据）                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ LlmService.rankAndEnrich(dbResults, candidateInput)       │  │
│  │ → 输入: 30-50条 DB 筛选结果（含真实位次/分数/专业）         │  │
│  │ → LLM 职责:                                               │  │
│  │   1. 从每档选出最佳 2 条                                    │  │
│  │   2. 打分 purity（0-100，基于专业匹配度、城市偏好、往年趋势） │  │
│  │   3. 生成 reason 推荐理由                                   │  │
│  │ → 输出: 8 条精选推荐                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 4: 返回最终结果                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 8 条 RecommendationItem（冲2 + 稳2 + 保2 + 垫2）          │  │
│  │ 每条含: college, major, city, probability, purity,        │  │
│  │        planCount, tuition, reason, scores[]               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Fallback（LLM 不可用时）:                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 直接从 DB 结果中按位次差排序取 top 8, purity 默认 70        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、数据导入脚本规划

| # | 脚本文件 | 数据源 | 目标表 | 幂等策略 |
|---|---------|--------|--------|---------|
| 1 | `importAdmissionScores.ts` | 985/211/行业特色院校位次速查表 ×3 | `admission_scores` | `DELETE` + `createMany` |
| 2 | `importUniversityPlans.ts` | 30省招生计划 md (2026_招生计划/*.md) | `university_plans` | `DELETE` + `createMany` |
| 3 | `importMajors.ts` | 985×64 + 211 专业招生详情 md | `majors` + `university_plans` | `DELETE` + `createMany` / upsert |
| 4 | `importCityUniversityMap.ts` | 数据源中的城市-大学映射推断 | `city_university_map` | `DELETE` + `createMany` |
| 5 | `importAll.ts`（更新） | 串联上述 4 个 + 原有 3 个 | 全部 | 顺序执行 |

### 7.1 院校名 fuzzy match 处理

新增 `src/lib/nameResolver.ts`，预置通用别名映射表：

```typescript
const UNIVERSITY_ALIAS_MAP: Record<string, string> = {
  '中大': '中山大学',
  '华工': '华南理工大学',
  '华科': '华中科技大学',
  '西交': '西安交通大学',
  '上交': '上海交通大学',
  '复旦': '复旦大学',
  '浙大': '浙江大学',
  '南大': '南京大学',
  '武大': '武汉大学',
  '吉大': '吉林大学',
  '兰大': '兰州大学',
  '厦大': '厦门大学',
  '哈工大': '哈尔滨工业大学',
  '西电': '西安电子科技大学',
  '北邮': '北京邮电大学',
  '央财': '中央财经大学',
  '上财': '上海财经大学',
  '人大': '中国人民大学',
  '中科大': '中国科学技术大学',
  '中南': '中南大学',
  '华电': '华北电力大学',
  '北航': '北京航空航天大学',
  '北理': '北京理工大学',
  '东南': '东南大学',
  '天大': '天津大学',
  '南开': '南开大学',
  '山大': '山东大学',
  '川大': '四川大学',
  '电子科大': '电子科技大学',
  '西工大': '西北工业大学',
  // ... 持续补充
};
```

解析逻辑：先精确匹配 universities 表的 name/code，再查别名映射，最后用 Levenshtein 距离 ≥80% 的 fuzzy match（阈值可调）。

---

## 八、LLM Prompt 修复要点（P0-6）

**核心原则**：LLM 不再编造院校名称、分数、专业——这些数据全部由 DB 查询提供。LLM 仅做：

1. **排序**：从 DB 返回的 30-50 条候选中，根据地域偏好权重、专业匹配度、趋势数据排序，选出最优 8 条
2. **纯净度打分**：评估每条推荐中专业与考生意愿的匹配程度（0-100）
3. **推荐理由**：为每条生成一句话理由（不超过 30 字）

输入 prompt 格式改为：
```
你是高考志愿推荐排序专家。以下是从数据库筛选出的候选院校列表（含真实历年录取位次、招生计划、专业详情），请根据考生偏好排序并选出最终 8 条，返回 JSON。

考生信息：省份={province}，位次={rank}，偏好城市={cities}，偏好专业={majors}，权重={weights}

候选列表（已按位次分档）：
- 冲档：[{college, major, city, avgRank, planCount, ...}]
- 稳档：[...]
- 保档：[...]
- 垫档：[...]

要求：
1. 每档严格选 2 条
2. purity 基于专业匹配度、城市偏好、往年趋势综合打分
3. reason 一句话（≤30字），说明推荐理由
4. 返回 JSON: { "recommendations": [...] }
```

---

## 九、任务列表（5条，按依赖顺序）

### T01：项目基础设施（Schema 变更 + 类型定义 + 配置）

**优先级**：P0  
**依赖**：无

**文件清单**：

| 操作 | 文件路径 | 改动内容 |
|------|---------|---------|
| 修改 | `prisma/schema.prisma` | 新增 `CityUniversityMap` 模型（data schema，含 city_name / university_id / province_code 字段 + unique 约束） |
| 修改 | `src/types/index.ts` | (1) `CandidateInput.preferences` 扩展 preferredCities / collegeLevel / disciplines / subjectType 字段；(2) `RecommendationItem` 新增 city / universityId / majorId / provinceCode / planCount / tuition / reason 字段；(3) 新增 `AdmissionScoreQuery` / `AdmissionScoreResult` / `UniversityPlanResult` DTO 类型 |
| 修改 | `package.json` | 新增 scripts: `"import:admission": "tsx scripts/importAdmissionScores.ts"`, `"import:plans": "tsx scripts/importUniversityPlans.ts"`, `"import:majors": "tsx scripts/importMajors.ts"`, `"import:citymap": "tsx scripts/importCityUniversityMap.ts"`, `"import:all": "tsx scripts/importAll.ts"` |
| 修改 | `.env.example` | 新增注释说明 `USE_DATABASE=true` 时数据导入需要的环境变量 |

---

### T02：数据层（仓库接口 + 双实现 + Mock 数据）

**优先级**：P0  
**依赖**：T01

**文件清单**：

| 操作 | 文件路径 | 改动内容 |
|------|---------|---------|
| 修改 | `src/repositories/interfaces.ts` | 新增 3 个接口：`IAdmissionScoreRepository`（queryByRank 方法）、`IUniversityPlanRepository`（queryPlans 方法）、`ICityUniversityRepository`（getByCities / getCitiesByUniversityIds 方法） |
| 修改 | `src/repositories/prismaRepository.ts` | 新增 3 个 Prisma 实现类：`PrismaAdmissionScoreRepository`（使用 `prisma.$queryRaw` 按位次区间 JOIN universities + majors 查询）、`PrismaUniversityPlanRepository`（JOIN university_plans + majors 按省份+科目查询）、`PrismaCityUniversityRepository`（查 city_university_map 表） |
| 修改 | `src/repositories/inMemoryRepository.ts` | 新增 3 个 InMemory 实现类：`InMemoryAdmissionScoreRepository`、`InMemoryUniversityPlanRepository`、`InMemoryCityUniversityRepository`，数据源来自 `src/data/mockData.ts` 中新增的 mock 数组 |
| 修改 | `src/data/mockData.ts` | 新增 `MOCK_ADMISSION_SCORES`（至少 30 条覆盖广东/北京等省份的冲稳保场景）、`MOCK_UNIVERSITY_PLANS`（至少 20 条含专业+招生人数+学费）、`MOCK_CITY_UNIVERSITY_MAP`（至少 15 条覆盖北京/上海/广州/杭州/南京大学映射） |

---

### T03：Service 层 + 推荐引擎重写

**优先级**：P0  
**依赖**：T02

**文件清单**：

| 操作 | 文件路径 | 改动内容 |
|------|---------|---------|
| 新增 | `src/services/admissionScoreService.ts` | 实现 `queryByRank`：接收 provinceCode / rank / year / batch，调用 IAdmissionScoreRepository 分三档查询，返回 `{ rush, stable, safe, bottom }` |
| 新增 | `src/services/universityPlanService.ts` | 实现 `queryPlans`：按 universityIds + provinceCode + year + subjects 调用 IUniversityPlanRepository，返回含 plan_count / tuition / subject_requirements 的结果 |
| 新增 | `src/services/cityUniversityService.ts` | 实现 `getUniversityIdsByCities` 和 `getCitiesByUniversityIds`，封装 ICityUniversityRepository |
| 重写 | `src/services/recommendationService.ts` | 实现两步法推荐引擎：(1) 注入 AdmissionScoreService / UniversityPlanService / CityUniversityService / RankService / LlmService；(2) `recommend()` 方法依次执行：分数→位次→DB三档查询→城市过滤→专业匹配→LLM排序（or fallback）；(3) USE_LLM=false 时直接用 DB 结果按位次差距排序 |
| 修改 | `src/services/llmService.ts` | 重构 `generateRecommendations` → `rankAndEnrich`：(1) 新 prompt 模板只接收 DB 筛选后的候选列表；(2) LLM 职责改为排序+打分+理由；(3) 保留 `generateRiskItems` 不变；(4) 增加 `USE_LLM=false` 时的 fallback |
| 新增 | `src/lib/nameResolver.ts` | 院校名模糊匹配工具：(1) `UNIVERSITY_ALIAS_MAP` 常量；(2) `resolveUniversityName(name: string): string` 函数（精确匹配→别名映射→Levenshtein fuzzy）；(3) `levenshtein(a, b): number` 工具函数 |

---

### T04：数据导入脚本（5 个新脚本 + 解析器扩展）

**优先级**：P1  
**依赖**：T01（需 Prisma schema 已迁移）

**文件清单**：

| 操作 | 文件路径 | 改动内容 |
|------|---------|---------|
| 新增 | `scripts/importAdmissionScores.ts` | 解析 3 个位次速查表 md：(1) 985 大学各省录取位次速查表；(2) 211 大学各省录取位次速查表；(3) 行业特色院校录取位次速查表。提取省/位次区间/院校/专业/年份数据，幂等写入 `admission_scores` 表 |
| 新增 | `scripts/importUniversityPlans.ts` | 批量解析 `2026_招生计划/` 下 30 个省 md 文件，提取院校+计划人数，**逐省**写入 `university_plans` 表（幂等：先 DELETE 该年的所有数据再批量 INSERT） |
| 新增 | `scripts/importMajors.ts` | 批量解析 `04_专业招生详情/2026/985高校各专业招生人数/*.md`（64 个）+ `211高校各专业招生人数/*.md`，提取专业名称+招生人数+学科类别：(1) 先 upsert majors 表（code 为唯一键）；(2) 再写入 university_plans 表补充专业级招生计划 |
| 新增 | `scripts/importCityUniversityMap.ts` | 从 admission_scores 和 university_plans 的导入过程中，提取大学所在省份/城市信息，结合 universities 表的 province_code 和已知的城市-大学对应关系，批量写入 `city_university_map` 表 |
| 修改 | `scripts/importAll.ts` | 重写聚合脚本：(1) 顺序执行 importBatchLines → importRankSegments → importSubjectCoverage → importAdmissionScores → importUniversityPlans → importMajors → importCityUniversityMap；(2) 每步完成后打印计数；(3) 任一步失败时打印错误并继续（非致命） |
| 修改 | `src/lib/markdownParsers.ts` | 新增 3 个解析函数：(1) `parseAdmissionScoresMarkdown(content)` — 解析位次速查表格式（表头含位次区间/可报学校/代表院校及位次）；(2) `parsePlanSummariesMarkdown(content)` — 解析招生计划汇总表（院校+人数）；(3) `parseMajorDetailsMarkdown(content)` — 解析专业招生详情表（专业名称+招生人数+类别）。每个函数使用与现有解析器一致的 extractTable + normalizer 模式 |

---

### T05：App 组装 + 路由 + 前端适配

**优先级**：P1  
**依赖**：T03

**文件清单**：

| 操作 | 文件路径 | 改动内容 |
|------|---------|---------|
| 修改 | `src/app.ts` | (1) 新增 `admissionScoreRepository` / `universityPlanRepository` / `cityUniversityRepository` 的 DI 选择（USE_DATABASE 分支）；(2) 新增 `AdmissionScoreService` / `UniversityPlanService` / `CityUniversityService` 实例化；(3) 改写 `RecommendationService` 构造：注入上述 3 个新 Service + 现有 `RankService`；(4) 将新 service 传给 `createRouter` |
| 修改 | `src/routes/index.ts` | (1) `RouteServices` 接口新增 `admissionScoreService` / `universityPlanService` / `cityUniversityService`；(2) POST `/api/recommend` 路由从 `CandidateInput` 中提取 `preferences.preferredCities` / `preferences.subjectType` 等字段，传给新的推荐引擎 |
| 修改 | `src/data/mockData.ts` | 验证 T02 中新增的 mock 数据在 InMemory 模式下可用，确保 USE_DATABASE=false 时推荐流程正常走通 |
| 修改 | `gaokao-app/src/data.ts` | `RecommendationItem` 接口新增 `city?` / `universityId?` / `majorId?` / `provinceCode?` / `planCount?` / `tuition?` / `reason?` 可选字段 |
| 修改 | `gaokao-app/src/pages.tsx` | `ResultsPage` 组件：在推荐卡片中展示 (1) 城市标签（如 🏙️ 北京）；(2) 招生计划人数（如 📊 招 45 人）；(3) 学费（如 💰 ¥6,000/年）；(4) LLM 推荐理由。保持现有 tier/probability/purity 展示不变 |
| 修改 | `prisma/seed.ts` | 新增 CityUniversityMap 表的 seed 数据（从 PROVINCE_CODE_MAP 和已知大学-城市对应关系生成） |

---

## 十、依赖包列表

**无新增依赖**。当前 `package.json` 中的 `@prisma/client`、`express`、`dotenv`、`cors` 已充分覆盖所有需求。

---

## 十一、共享约定/注意事项

1. **API 响应格式**：所有接口统一 `{ code: number, data: T, message: string }`。
2. **Import 脚本幂等策略**：每个脚本先 `DELETE` 目标表所有记录（或 DELETE WHERE year = 2026），再 `createMany`。不使用 `TRUNCATE`（Prisma 不原生支持多 schema 的 TRUNCATE CASCADE）。
3. **USE_DATABASE 兼容**：每个 Repository 接口必须同时提供 InMemory 和 Prisma 实现。InMemory 实现的 mock 数据必须真实反映 2025-2026 年广东省数据（至少确保 Results 页面在 `USE_DATABASE=false` 时能展示含城市、专业、招生人数的推荐卡片）。
4. **LLM Fallback**：`USE_LLM=false` 或 LLM 调用失败时，推荐引擎直接从 DB 筛选结果中按位次差距排序，取冲档 2 + 稳档 2 + 保档 2 + 垫档 2，purity 默认 70，reason 默认为「基于历年录取位次自动推荐」。
5. **院校名一致性**：所有导入脚本必须在写入前调用 `nameResolver.resolveUniversityName()` 将 md 中的简称/别名映射到 universities 表的标准名称。映射失败时打印 warning 并跳过该条记录。
6. **省市代码**：统一使用 `src/constants/provinceCodes.ts` 中的 `PROVINCE_CODE_MAP`，city_university_map 中的 city_name 使用标准中文城市名（如「北京市」「广州市」）。
7. **数据库 schema**：新增表全部放在 `data` schema 下，与现有 universities/majors/admission_scores/university_plans 保持一致。

---

## 十二、待明确事项（≤3个）

1. **城市-大学映射数据源缺失**：目前数据源中没有独立的「城市-大学」映射表。CityUniversityMap 的数据需要从 universities 表的 `province_code` + 已知知识推导（如「中山大学」→「广州市」）。是否接受基于已知知识的人工补充？或在导入脚本中硬编码一份名校→城市映射？

2. **2025年录取位次数据的年份**：位次速查表标注为「2025年」数据，但 admission_scores 表有 `year` 字段。推荐引擎的 Step 2a 应查询哪个年份？建议默认查 year=2025（最新可用的实际录取数据），如果 admission_scores 中 year=2025 无数据则 fallback 到最新可用年份。

3. **专业匹配的选科过滤策略**：Step 2c 中 university_plans 的 subject_requirements 字段与考生 subjects 的匹配逻辑——是 strict match（考生选科必须完全覆盖专业要求）还是 partial match（至少一门匹配即可）？建议默认 strict match，因为高校招生对选科要求通常为「必须全部满足」。
