# 高招智选推荐引擎增量PRD v2.0

> **文档类型**: 简单PRD（增量迭代）
> **语言**: 中文
> **技术栈**: Vite + React + MUI + Tailwind CSS (前端) / Node.js + Express + TypeScript + Prisma + PostgreSQL (后端)
> **创建日期**: 2026-06-29
> **版本**: v2.0-incremental

---

## 1. 项目信息

| 字段 | 值 |
|------|-----|
| 项目名 | `gaokao-fullrec` |
| 原始需求 | 修复推荐引擎三大致命问题：地域偏好被无视、分数与院校不匹配、结果无专业 |
| 关联分支 | 基于已有 gaokao-backend + gaokao-app，增量改造 |

---

## 2. 产品定义

### 2.1 产品目标

1. **数据驱动推荐（替代LLM凭空生成）**：推荐结果必须基于真实录取位次/招生计划数据，LLM仅负责排序和说明
2. **地域精准匹配**：用户选择的城市偏好必须100%映射到当地招生的院校，不能出现"选了北京却只推广东学校"
3. **专业级颗粒度**：每条推荐结果必须包含「院校 + 专业 + 往年录取位次/分数 + 招生计划人数」

### 2.2 用户故事

| ID | 故事 |
|----|------|
| US-1 | As a 广东物理类584分考生，我输入分数和选科后，系统应基于真实位次(≈47000名)推荐冲/稳/保三档院校，不再出现"冲刺中山大学(需要8536名)"这种不切实际的建议 |
| US-2 | As a 考生，我在Step4选择了意向城市（北京、广州、杭州），推荐结果应只显示在这些城市有招生的院校，而不是仅限一个省份 |
| US-3 | As a 考生，我在Step4选择了专业方向偏好，推荐结果应显示具体专业名称（如"计算机类"、"临床医学"），而非仅显示学校名 |
| US-4 | As a 考生，我想看到每条推荐附带往年最低分、最低位次和招生人数，帮助我评估录取概率 |
| US-5 | As a 少数民族考生，我希望系统能自动考虑加分政策（P1） |

---

## 3. 数据模型概要

### 3.1 现有表（已创建，需确认数据填充状态）

```sql
-- [data] schema 下已定义，需导入数据
admission_scores:    university_id, major_id, province_code, year, batch, min_score, avg_score, max_score, min_rank, avg_rank, max_rank, plan_count
university_plans:    university_id, major_id, province_code, year, batch, plan_count, tuition, duration, subject_requirements
universities:        id, code, name, province_code, level, type, tags, is211, is985, is_double_first
majors:              id, code, name, category, subject_requirements, duration, degree
```

### 3.2 新增表：`city_university_map`（schema: data）

```sql
-- 城市-院校映射表：解决"地域偏好被无视"问题
CREATE TABLE data.city_university_map (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name     VARCHAR(50)  NOT NULL,          -- 城市名（北京、广州、杭州...）
  university_id UUID NOT NULL REFERENCES data.universities(id),
  province_code VARCHAR(10) NOT NULL,            -- 所在省份代码，用于交叉校验
  UNIQUE(city_name, university_id)
);
```

**数据来源**：从桌面数据中提取。985/211院校的所在地已知（如北大→北京、浙大→杭州），同时还需要"异地校区"映射（如哈工大深圳→深圳、中大珠海→珠海）。初始导入约 300-500 条映射。

### 3.3 需新增的 TypeScript 类型

```typescript
// 扩展 CandidateInput，明确城市和选科偏好
export interface CandidateInput {
  province: string;
  score: number;
  rank?: number;
  subjects?: string[];          // ["物理", "化学", "生物"]
  subjectType?: string;          // "物理类" | "历史类" | ...
  cities?: string[];             // 新增：意向城市 ["北京", "广州", "杭州"]
  majorPreferences?: string[];   // 新增：专业方向 ["工学", "医学"] 或具体专业名
  minorityBonus?: number;        // P1: 少数民族加分
  weights?: number[];            // [院校权重, 地域权重, 专业权重]
  preferences?: Record<string, unknown>;  // 其他自由偏好
}

// 推荐结果增强
export interface RecommendationItem {
  id: string;
  college: string;               // 院校名
  major: string;                 // 专业名（必须！）
  majorGroup: string;            // 专业组（如"213组 物理+化学"）
  scores: ScoreYear[];           // 近3年最低分 [{year:2023, score:628}, ...]
  minRank?: number;              // 新增：最新最低位次
  planCount?: number;            // 新增：招生计划人数
  trend: Trend;
  probability: number;
  purity: number;
  tier: string;                  // "冲" | "稳" | "保"
  city: string;                  // 新增：院校所在城市
}
```

### 3.4 数据缺口分析

| 数据维度 | 现状 | 缺口 | 补全方案 |
|---------|------|------|---------|
| 985录取位次 | 桌面有 11省 × 985位次表 | 缺少20省数据 | 从桌面数据已覆盖11省（粤/豫/川/鲁/冀/苏/浙/鄂/湘/皖/赣），剩余20省暂时使用近似映射或标注"数据不全" |
| 211录取位次 | 桌面有 211位次速查表 | 同上 | 同上 |
| 招生计划 | 桌面有 30省完整计划 | ✅ 完整 | 直接导入 university_plans |
| 专业详情 | 桌面有 985×64所 + 211×N所 | 双非院校专业缺失 | P0期只导入985/211专业详情；双非标注"暂无专业数据" |
| 城市-院校映射 | 无 | 需新建 | 从985/211院校所在地手动构建 + 异地校区映射 |
| 专业选科要求 | 已导入 subject_coverages | 缺少专业级选科映射 | 桌面有"2026年985高校专业选科要求对照表"，但当前只汇总了覆盖率，需补充专业-选科匹配 |

---

## 4. 推荐算法流程（核心架构变更）

### 4.1 新流程：数据库查询 → LLM排序两步法

```
POST /api/recommend
    │
    ├─ Step 1: 位次换算
    │   ├─ 已有 rank? → 直接使用
    │   └─ 无 rank? → 查 province_rank_segments 表，分数→位次
    │
    ├─ Step 2: 数据库初筛（核心！替代LLM凭空生成）
    │   ├─ 2a. 查 admission_scores WHERE province_code=? AND year=2025
    │   │       按 min_rank 计算：
    │   │       冲: min_rank <= 用户位次 × 1.3  AND min_rank > 用户位次
    │   │       稳: min_rank <= 用户位次 × 0.85 AND min_rank > 用户位次 × 0.5
    │   │       保: min_rank <= 用户位次 × 0.5
    │   │       → 每档取 top N 条（按位次与用户位次的差距排序）
    │   │
    │   ├─ 2b. 城市过滤（修复"地域被无视"）
    │   │       IF cities[] 非空:
    │   │         JOIN city_university_map WHERE city_name IN (cities[])
    │   │       → 只保留城市匹配的院校
    │   │
    │   └─ 2c. 专业匹配（修复"结果无专业"）
    │           JOIN university_plans up ON up.university_id = ads.university_id
    │           JOIN majors m ON m.id = up.major_id
    │           WHERE:
    │             - 选科要求匹配（up.subject_requirements ⊆ subjects[]）
    │             - 专业方向匹配（IF majorPreferences[] 非空，m.category IN majorPreferences）
    │           → 每个院校取最多3个匹配专业
    │
    ├─ Step 3: LLM 个性化（仅排序+说明，不生成数据）
    │   ├─ 输入：Step2筛选后的结构化结果列表（含院校/专业/位次/分数/城市/招生人数）
    │   ├─ 输入：用户全部偏好（选科、城市、专业方向、少数民族、权重）
    │   ├─ LLM任务：
    │   │   1. 按冲/稳/保分档排序
    │   │   2. 结合用户权重（院校/地域/专业）微调顺序
    │   │   3. 为每条推荐生成20字以内的理由说明
    │   │   4. 计算 probability 和 purity
    │   └─ 输出：排序+标注后的推荐列表（JSON）
    │
    └─ Step 4: 返回结果
        └─ 8条推荐（冲2/稳3/保3），每条含 {院校, 专业, 城市, 位次, 分数, 招生人数, 理由}
```

### 4.2 关键规则

| 规则 | 说明 |
|------|------|
| **冲/稳/保分档** | 冲：用户位次 × 0.77~1.0；稳：用户位次 × 0.5~0.85；保：用户位次 × 0.25~0.5。上述比例可调 |
| **招生计划校验** | 如果某院校在某省的 `university_plans` 中无记录，则该院校不出现在该省推荐中 |
| **专业数量控制** | DB初筛后每档取最多15个院校×3个专业 = 45条；LLM从中精选8条 |
| **兜底机制** | 若 DB 初筛结果 < 8条，用位次范围放宽20%再查一次；仍不足则 fill 相近位次院校 |
| **LLM兜底** | LLM调用失败 → 直接按位次差距排序返回DB结果，不调用LLM |

### 4.3 LLM Prompt 改造要点

当前 prompt（llmService.ts）需改为：

1. **不再要求LLM生成院校/专业名称** — 这些由数据库提供
2. **输入变成结构化数据** — 每个候选项含 `{college, major, minRank, minScore, city, planCount}`
3. **LLM任务缩小为**：排序 + purity计算 + 理由生成
4. **新增传入字段**：`cities`, `majorPreferences`, `minorityBonus`, `subjectType`

---

## 5. 需求池

### P0 — 必须实现（阻塞上线）

| ID | 需求 | 实现要点 | 验收标准 |
|----|------|---------|---------|
| P0-1 | **录取位次数据入库** | 解析桌面 985/211/行业特色 录取位次markdown表→写入 `admission_scores`；需先确保 `universities` 和 `majors` 表有对应记录 | `SELECT COUNT(*)` > 500条；覆盖至少11省×3类院校 |
| P0-2 | **招生计划数据入库** | 解析桌面30省招生计划md→写入 `university_plans` | 覆盖30省，总记录数 > 3000 |
| P0-3 | **专业详情数据入库** | 解析985/211各专业招生人数md→写入 `university_plans`（关联university_id + major_id） | 985×64所含专业全部入库；211覆盖至少70% |
| P0-4 | **城市-院校映射新建** | 创建 `city_university_map` 表 + 导入数据；985/211按所在地+异地校区映射 | 20个前端可选城市均有对应院校，映射覆盖率100% |
| P0-5 | **重写推荐引擎** | 改造 `RecommendationService.recommend()`，实现4.1两步法；新建 `AdmissionScoreService` / `UniversityPlanService` / `CityUniversityService` | 584分广东考生推荐不出现中山大学（需要8536名）；推荐含专业名 |
| P0-6 | **修复LLM Prompt** | 重写 `buildRecommendationPrompt()`：传入结构化候选项 + 全部偏好；LLM只排序+说明 | Prompt中明确"不要编造院校/专业名称，只排序已有候选项" |
| P0-7 | **前端推荐结果展示专业** | 推荐卡片新增显示：专业名、城市、最低位次、最低分数；`RecommendationItem` 类型扩展 | 每个推荐卡片显示 ≥4项信息（院校+专业+位次+分数） |

### P1 — 应该实现（增强体验）

| ID | 需求 | 实现要点 |
|----|------|---------|
| P1-1 | 冲/稳/保三档标签 | 前端推荐列表按 tier 分组，颜色区分（红/橙/绿），每档显示档位说明 |
| P1-2 | 结果显示招生计划人数 | 推荐卡片追加 `planCount`，格式"2026年招生X人" |
| P1-3 | 少数民族加分 | `CandidateInput.minorityBonus` 字段，在 Step1 位次换算时加到分数上再查位次 |
| P1-4 | LLM理由生成 | 每条推荐带一句理由，如"位次接近，计算机专业实力强" |

### P2 — 锦上添花（后续迭代）

| ID | 需求 |
|----|------|
| P2-1 | 专业对比功能：同时查看多所院校同专业对比 |
| P2-2 | 历史位次趋势图：3年位次折线图 |
| P2-3 | 双非院校专业数据补全 |

---

## 6. UI变更说明

### 6.1 推荐结果卡片（ResultCard）

**现状**：只显示院校名 + tier标签 + probability

**改为**：
```
┌──────────────────────────────────────┐
│ 🔴 冲刺 #1                         │
│ 中山大学 · 广州                      │
│ 计算机类（213组 物理+化学）           │
│ ─────────────────────────────────── │
│ 2025最低: 633分 / 8536名            │
│ 2026招生: 315人（全国）              │
│ 录取概率: 15%  ·  位次差距: 38464名 │
│ 📝 位次差距较大，属于冲刺选项          │
└──────────────────────────────────────┘
```

### 6.2 无结果处理

当某城市筛选后无匹配院校时，前端显示：
> "您选择的[杭州]暂无匹配您分数的院校。建议：调整城市偏好，或查看附近城市（如宁波）"

---

## 7. 数据导入优先级与任务拆分

| 优先级 | 数据 | 源文件 | 目标表 | 预估条数 |
|--------|------|--------|--------|---------|
| 🔴 立即 | 985录取位次(11省) | `2025年全国985大学各省录取位次速查表.md` | `admission_scores` | ~400 |
| 🔴 立即 | 211录取位次(11省) | `2025年全国211大学各省录取位次速查表.md` | `admission_scores` | ~600 |
| 🟡 尽快 | 行业特色院校位次 | `2025年行业特色院校录取位次速查表.md` | `admission_scores` | ~300 |
| 🔴 立即 | 30省招生计划 | `*_2026招生计划.md` (30个文件) | `university_plans` | ~3000 |
| 🔴 立即 | 985各专业招生人数 | `985高校各专业招生人数/*.md` (64个文件) | `university_plans` + `majors` | ~2500 |
| 🟡 尽快 | 211各专业招生人数 | `211高校各专业招生人数/*.md` | `university_plans` + `majors` | ~3000 |

---

## 8. 技术风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Markdown表格解析格式不一致 | 数据导入错误率高 | 编写统一的 md→JSON 解析器，先 dry-run 验证10条再全量导入 |
| 院校名在md和数据库不一致 | JOIN失败 | 建立院校名别名映射（如"中大"="中山大学"），导入前做 fuzzy match |
| 数据覆盖不足省份推荐少 | 用户不满 | 对数据缺失省份显示"数据补充中"标记，回退到LLM但限制冲/稳/保位次规则 |
| LLM prompt改造后仍编造数据 | 质量回退 | 在LLM prompt开头用大写加粗"禁止编造"，且解析结果后交叉校验院校名是否在候选项中 |

---

## 9. 待确认问题

| # | 问题 | 建议方案 | 需要谁确认 |
|---|------|---------|-----------|
| Q1 | 冲/稳/保的位次比例是否合适？（冲0.77-1.0, 稳0.5-0.85, 保0.25-0.5） | 先用该比例跑一批真实用户分数验证 | 架构师/后端 |
| Q2 | 城市映射是否需要支持"周边城市"？（如选北京→是否推荐天津的南开/天大） | P0先精确匹配，P2再加"就近推荐" | 产品/用户 |
| Q3 | 每人推荐8条（冲2稳3保3）还是更多？ | 建议8条，可让用户点"加载更多" | 产品/设计 |
| Q4 | 专业招生人数是"全国"还是"该省"？ | 优先显示该省招生人数（若数据有）；否则fallback全国人数+标注 | 数据 |
| Q5 | 旧版 `admission_scores` 表已有 unique 约束 `[provinceCode, year, universityId, majorId, batch]`，实际导入时是否需要先清空？ | TRUNCATE 后导入，或 UPSERT | 后端 |
