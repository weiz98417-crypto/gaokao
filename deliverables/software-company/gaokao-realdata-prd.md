# 高考志愿填报APP · 真实数据替代 Mock 增量 PRD

## 1. 项目信息

| 项目 | 内容 |
|------|------|
| Language | 中文 |
| Programming Language | 后端：Node.js + Express + TypeScript + Prisma + PostgreSQL<br>前端：Vite + React + MUI + Tailwind CSS |
| Project Name | gaokao-realdata |
| 原始需求 | 用用户桌面 `C:\Users\Administrator\Desktop\高考志愿填报数据库\` 中的真实高考数据，替代当前前后端的 mock 数据，使 Step1~Step3 的核心数据可用。 |
| 权威数据源约定 | 分数线以 `01_各省分数线/2026/2026年全国各省高考分数线汇总.md` 为准；位次以 `02_各省位次表/2026/` 下两份文件综合为准；选科覆盖率以 `04_专业招生详情/2026/2026年985高校专业选科要求对照表.md` 为准。 |

## 2. 产品定义

### 2.1 Product Goals

1. **Step1 专业覆盖率真实化**：根据考生选择的省份、首选科目、再选科目，从真实选科要求数据中计算可报专业百分比，替代前端硬编码的 87%。
2. **Step2 位次查询真实化**：接入各省真实关键段位位次数据，通过插值算法估算任意分数对应位次，替代后端仅 15 个分数点的稀疏 mock。
3. **Step3 批次线真实化**：根据考生选择的省份与科目类，动态展示 2026 年真实本科线、特控线（或一本线/二本线），替代前端硬编码的 530 分一本线。

### 2.2 User Stories

1. 作为广东物理类考生，我输入选科「物理+化学+生物」后，能立即看到基于真实 985/重点专业选科要求计算出的可报考专业覆盖率，而不是固定的 87%。
2. 作为河南历史类考生，我输入 520 分后，系统能根据河南 2026 年历史类关键段位数据，通过插值估算出我的全省位次，而不是返回离散的 mock 位次。
3. 作为四川物理类考生，我在确认页能看到「本科线 435 分 / 特控线 519 分」，而不是统一的「一本线 530 分」。
4. 作为广东考生，我在推荐院校详情页能看到该院校 2026 年在广东省的招生计划总人数，帮助判断录取概率。
5. 作为新疆考生，我选择的传统高考模式能正确展示「文科/理科 一本线、二本线」，而非新高考的「本科线、特控线」。

## 3. 技术规范

### 3.1 Requirements Pool

#### P0 — Must Have（不完成则系统不可用）

| ID | 需求 | 验收标准 | 涉及端 |
|----|------|----------|--------|
| P0-1 | 新增「省份批次线」数据模型与 API | 数据库可存储 31 省 2026 年各科目类的本科线、特控线（或一本/二本线）；提供 `GET /api/batch-lines?province=xx&subjectType=物理` 返回真实分数线；缺失省份按同模式省份规则补全。 | 后端 + DB |
| P0-2 | Step3 确认页展示真实批次线 | 确认页「批次线」字段从硬编码「一本线 530分」改为调用 P0-1 API 动态显示，如「物理类 本科线 425 / 特控线 539」；新疆、西藏显示对应文理/AB 类一本二本。 | 前端 |
| P0-3 | 新增「关键段位位次」数据模型 | 数据库可存储各省物理/历史（或文理）的关键段位（如 600+、特控线、本科线、总考生数）及对应累计位次；为插值算法提供输入。 | 后端 + DB |
| P0-4 | 位次查询支持按科目类插值 | `GET /api/rank-lookup` 增加 `subjectType` 参数；后端使用省份 + 科目类关键段位进行线性/对数插值，返回 `rank`、`sameScore`、`range`；缺失省份使用同模式省份均值比例估算。 | 后端 |
| P0-5 | Step2 前端传入科目类并展示真实位次 | Step2 调用位次 API 时传入首选科目（物理/历史/综合改革/文科/理科）；分数输入后展示基于真实数据的位次估算结果；同时移除前端硬编码的 530 分一本线差值文案。 | 前端 |
| P0-6 | 新增「选科组合覆盖率」数据模型与 API | 数据库可存储各省/全国模式下 12 种选科组合的可报专业覆盖率；提供 `GET /api/subject-coverage?province=xx&subjects=物理,化学,生物` 返回百分比。 | 后端 + DB |
| P0-7 | Step1 覆盖率从真实数据计算 | 前端 Step1 选择完科目后，调用 P0-6 API 展示真实覆盖率，替代硬编码 87%；后端不可用时给出基于全国平均的兜底值。 | 前端 |
| P0-8 | 数据清洗与导入脚本 | 提供可复用的脚本/迁移，将桌面 markdown 数据解析并写入 PostgreSQL；支持幂等执行（清空旧数据后重新导入）。 | 后端 + DB |
| P0-9 | 数据缺失补全规则落地 | 对未采集完整一分一段表的省份，使用同高考模式省份的「位次/考生数」比例进行估算；对无选科覆盖率的省份，使用全国 985 选科要求表作为默认。 | 后端 |

#### P1 — Should Have（提升可用性）

| ID | 需求 | 验收标准 | 涉及端 |
|----|------|----------|--------|
| P1-1 | 院校在目标省份招生计划展示 | 在推荐结果列表或详情页展示院校 2026 年在考生省份的招生计划总人数；数据来自 `03_大学招生计划/2026_招生计划/<省份>_2026招生计划.md`。 | 后端 + 前端 |
| P1-2 | 位次查询结果标注置信度 | 当目标省份有完整关键段位数据时返回「精确估算」，使用同模式省份补全时返回「按同模式省份估算」，让考生知道数据来源。 | 后端 + 前端 |
| P1-3 | 选科覆盖率细分到院校层次 | 在覆盖率tooltip中说明「基于 985/重点专业选科要求计算，覆盖约 X 个专业类」，避免用户误以为覆盖全国所有本科专业。 | 前端 |
| P1-4 | 缓存热门查询 | 对 `/api/rank-lookup`、`/api/batch-lines`、`/api/subject-coverage` 等只读接口在内存或数据库层做短期缓存，减少重复计算。 | 后端 |

#### P2 — Nice to Have

| ID | 需求 | 验收标准 | 涉及端 |
|----|------|----------|--------|
| P2-1 | 同分人数估算 | 当前关键段位数据只有累计人数，无每分同分人数；P2 可基于相邻段位差值估算 `sameScore`，提升位次区间精度。 | 后端 |
| P2-2 | 历史 2025 位次对照 | 提供 2026 位次 ↔ 2025 等效分换算，用于推荐志愿的风险判断（本次推荐算法不替换，仅作为展示）。 | 后端 + 前端 |
| P2-3 | 推荐详情展示专业招生人数 | 对 985/211 高校，展示目标省份各专业招生人数，数据来自 `04_专业招生详情/2026/985高校各专业招生人数/`。 | 后端 + 前端 |

### 3.2 UI / 数据变更点

#### 前端页面变更

| 页面 | 当前状态 | 变更后 | 关联需求 |
|------|----------|--------|----------|
| Step1Province | 完成选科后固定显示「约 87% 的专业可报考」 | 调用 `/api/subject-coverage` 显示真实百分比，如「约 73% 的专业可报考」；增加数据来源说明 tooltip | P0-6, P0-7, P1-3 |
| Step2Score | 输入分数后调用 `/api/rank-lookup?score=xx&province=xx`；下方硬编码显示「超过一本线 X 分」 | API 增加 `subjectType` 参数；移除「超过一本线」文案，改为展示科目类真实批次线卡片或tooltip | P0-4, P0-5 |
| Step3Confirm | 批次线字段固定为「一本线 530分」 | 调用 `/api/batch-lines` 动态显示真实批次线，格式根据考试模式变化 | P0-1, P0-2 |
| RecommendationCard / Detail | 不展示招生计划 | 展示「2026 年在 <省份> 招生 <N> 人」 | P1-1 |

#### 后端数据模型建议（Prisma schema 扩展）

```prisma
// data schema
model ProvinceBatchLine {
  id           String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String @map("province_code") @db.VarChar(10)
  year         Int
  subjectType  String @map("subject_type") @db.VarChar(20) // 物理/历史/综合改革/文科/理科/A类/B类
  batch        String @db.VarChar(20) // 本科/特控/一本/二本/一段/二段
  score        Int
  source       String? @db.VarChar(200)
  @@unique([provinceCode, year, subjectType, batch])
  @@map("province_batch_lines")
  @@schema("data")
}

model ProvinceRankSegment {
  id           String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String @map("province_code") @db.VarChar(10)
  year         Int
  subjectType  String @map("subject_type") @db.VarChar(20)
  score        Int    // 分数段阈值，如 600 表示 600+
  rank         Int    // 累计位次
  totalCount   Int?   @map("total_count") // 该科目类总考生数
  source       String? @db.VarChar(200)
  @@map("province_rank_segments")
  @@schema("data")
}

model SubjectCoverage {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String? @map("province_code") @db.VarChar(10) // null 表示全国默认
  year        Int
  subjects    String[] // 如 ["物理","化学","生物"]
  coveragePct Float   @map("coverage_pct") // 0~1
  totalMajors Int     @map("total_majors")
  source      String? @db.VarChar(200)
  @@unique([provinceCode, year, subjects])
  @@map("subject_coverages")
  @@schema("data")
}

model UniversityProvincePlan {
  id           String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  universityId String @map("university_id") @db.Uuid
  provinceCode String @map("province_code") @db.VarChar(10)
  year         Int
  planCount    Int    @map("plan_count")
  source       String? @db.VarChar(200)
  @@unique([universityId, provinceCode, year])
  @@map("university_province_plans")
  @@schema("data")
}
```

#### API 变更

| 接口 | 变更内容 |
|------|----------|
| `GET /api/rank-lookup` | 新增必选参数 `subjectType`（物理/历史/综合改革/文科/理科）；返回增加 `confidence: 'exact' \| 'estimated'` |
| `GET /api/batch-lines` | 新增接口，参数 `province`、`subjectType`，返回 `{ lines: [{ batch, score, label }] }` |
| `GET /api/subject-coverage` | 新增接口，参数 `province`、`subjects`（逗号分隔），返回 `{ coveragePct, totalMajors, source }` |
| `GET /api/provinces` | 可选扩展：返回增加 `subjectTypes` 字段，说明该省份支持的科目类选项，便于前端渲染 |
| 推荐相关接口 | 保持不变，继续走 LLM/mock 兜底；推荐详情展示新增 `planCount` 字段 |

### 3.3 数据边界说明

| 边界 | 说明 | 处理策略 |
|------|------|----------|
| 位次表不完整 | 仅广东、河北、河南、四川、安徽、天津等少数省份有相对完整的关键段位数据，其余省份待补充。 | 已有关键段位按省份+科目类精确插值；缺失省份使用同高考模式省份的「位次/总考生数」比例估算，并在返回中标注 `confidence: 'estimated'`。 |
| 分数线多源不一致 | 位次对照表中部分省份分数线与主分数线文件存在差异（如河南历史本科线、安徽历史本科线）。 | 统一以 `01_各省分数线/2026/2026年全国各省高考分数线汇总.md` 为准导入；若导入后发现异常，走人工校准流程，不自动覆盖。 |
| 选科覆盖率无全国完整专业库 | 当前仅有 985 高校重点专业选科要求，无法精确计算全国所有本科专业覆盖率。 | 覆盖率计算以 985/重点专业样本为基准，返回时明确标注「基于重点专业样本估算」；全国默认覆盖率采用文件中给出的 12 组合参考值。 |
| 上海/海南特殊满分 | 上海满分 660，海南满分 900（标准分），位次估算需单独处理。 | 上海使用独立关键段位；海南因标准分特性，暂按综合改革统一处理，标注置信度为 estimated，后续补充官方一分一段表后升级。 |
| 西藏 A/B 类、新疆文理一本二本 | 传统高考省份批次线结构与新高考不同。 | `subjectType` 支持 `文科/A类/B类`，`batch` 支持 `一本/二本`；前端根据省份 mode 动态展示对应文案。 |
| 招生计划院校名称不统一 | markdown 中院校名称与现有 `universities` 表名称可能存在差异（如「中山大学」vs「中山大学(珠海校区)」）。 | 导入时做名称归一化（去除校区/分校后缀、统一简繁体），未匹配院校写入待审核表，不阻塞主流程。 |

### 3.4 数据补全规则（算法草案）

1. **位次插值**：对同一省份同一 `subjectType`，将关键段位 `(score, rank)` 按分数降序排列。查询分数 `s`：
   - 若 `s` 高于最高段位，按最高段位同分比例外推；
   - 若 `s` 低于本科线，按本科线以下线性衰减估算；
   - 否则取相邻两段 `(s1, r1)`、`(s2, r2)`，线性插值：`rank = r2 + (r1 - r2) * (s2 - s) / (s2 - s1)`。
   - `range` = `[rank + 1, rank + sameScore]`，`sameScore` 先用相邻段位人数差估算。
2. **缺失省份估算**：找到同 `mode` 且数据最完整的参考省份，按「考生总数比例」缩放：`rank_est = rank_ref * (total_target / total_ref)`。
3. **覆盖率计算**：基于选科要求表中的规则，对 12 种组合分别统计「满足要求的专业数 / 总专业样本数」，存入 `subject_coverages`；查询时直接读取。

## 4. 待确认问题

| 序号 | 问题 | 建议决策人 |
|------|------|-----------|
| Q1 | 专业覆盖率计算范围：是基于 985 重点专业样本，还是同时需要采集全国本科专业库？ | 产品经理 + 用户 |
| Q2 | 位次查询的 `subjectType` 参数命名与枚举值：是否统一为「物理/历史/综合改革/文科/理科/A类/B类」？ | 后端 + 前端 |
| Q3 | 数据导入频率：是否每次 markdown 更新都重新跑导入脚本，还是增量更新？ | 后端 |
| Q4 | 推荐列表中的 `planCount` 展示：展示院校总计划人数，还是按科类（物理/历史）拆分的计划人数？当前部分省份 markdown 仅提供总数。 | 产品经理 |
| Q5 | 是否需要在本次增量中同步更新内存模式（`USE_DATABASE=false`）的 mock 数据，以保证双模式一致？ | 后端 |
| Q6 | 当真实位次/分数线数据缺失严重时，是否允许前端回退到旧 mock 值，还是强制显示「数据暂缺」？ | 产品经理 + 用户 |

---

**输出文件**：`D:\填报\deliverables\software-company\gaokao-realdata-prd.md`
