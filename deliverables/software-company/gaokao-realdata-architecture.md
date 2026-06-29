# 高考志愿填报APP · 真实数据接入增量架构设计

## 1. 实现方案概述

- **数据层先行**：在 `prisma/schema.prisma` 的 `data` schema 下新增 `ProvinceBatchLine`、`ProvinceRankSegment`、`SubjectCoverage` 三个模型，承载 2026 年真实分数线、关键段位位次与选科覆盖率。
- **Repository 扩展**：沿用既有接口风格，新增 `IBatchLineRepository`、`IRankSegmentRepository`、`ISubjectCoverageRepository`，分别提供 Prisma 与内存双实现，保证 `USE_DATABASE=false` 仍可联调。
- **服务层升级**：`RankService.lookup` 增加 `subjectType`，基于关键段位线性插值；缺失省份按同高考模式省份的考生数比例估算并标注 `confidence: 'estimated'`。新增 `BatchLineService` 与 `SubjectCoverageService` 处理业务规则与兜底。
- **数据导入脚本化**：`scripts/` 下提供幂等导入脚本，先清空目标表再写入，便于反复校准。
- **前端联动**：Step1 调用覆盖率接口，Step2 传入 `subjectType` 查询位次，Step3 调用批次线接口，分别替换硬编码的 87%、530 分一本线与稀疏 mock 位次。

## 2. 框架/技术选型

沿用现有栈，无新增运行时依赖：Node.js + Express + TypeScript + tsx + Prisma 5 + PostgreSQL；前端 Vite + React + MUI + Tailwind + Zustand。脚本通过 `npx tsx` 运行。

## 3. 文件列表

后端新增/修改：

- `prisma/schema.prisma`、迁移 SQL
- `src/types/index.ts`、`src/repositories/interfaces.ts`
- `src/repositories/prismaRepository.ts`、`src/repositories/inMemoryRepository.ts`
- `src/services/batchLineService.ts`、`src/services/subjectCoverageService.ts`、`src/services/rankService.ts`
- `src/routes/index.ts`、`src/app.ts`
- `src/lib/markdownParsers.ts`
- `scripts/importBatchLines.ts`、`scripts/importRankSegments.ts`、`scripts/importSubjectCoverage.ts`、`scripts/importAll.ts`

前端新增/修改：

- `gaokao-app/src/api/gaokaoApi.ts`
- `gaokao-app/src/pages.tsx`（Step1/Step2/Step3）
- `gaokao-app/src/store.ts`（可选缓存批次线、覆盖率）

## 4. Prisma Schema 扩展

```prisma
model ProvinceBatchLine {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String  @map("province_code") @db.VarChar(10)
  year         Int
  subjectType  String  @map("subject_type") @db.VarChar(20)
  batch        String  @db.VarChar(20)
  score        Int
  source       String? @db.VarChar(200)
  @@unique([provinceCode, year, subjectType, batch])
  @@map("province_batch_lines")
  @@schema("data")
}

model ProvinceRankSegment {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String  @map("province_code") @db.VarChar(10)
  year         Int
  subjectType  String  @map("subject_type") @db.VarChar(20)
  score        Int
  rank         Int
  totalCount   Int?    @map("total_count")
  source       String? @db.VarChar(200)
  @@map("province_rank_segments")
  @@schema("data")
}

model SubjectCoverage {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provinceCode String?  @map("province_code") @db.VarChar(10)
  year         Int
  subjects     String[]
  coveragePct  Float    @map("coverage_pct")
  totalMajors  Int      @map("total_majors")
  source       String?  @db.VarChar(200)
  @@unique([provinceCode, year, subjects])
  @@map("subject_coverages")
  @@schema("data")
}
```

## 5. 核心类型定义

```typescript
export interface BatchLine {
  batch: string;    // 本科/特控/一本/二本
  score: number;
  label: string;
}
export interface BatchLinesResult {
  province: string;
  subjectType: string;
  lines: BatchLine[];
}
export interface RankInfo {
  rank: number;
  sameScore: number;
  range: [number, number];
  confidence: 'exact' | 'estimated';
}
export interface SubjectCoverageResult {
  coveragePct: number;  // 0~1
  totalMajors: number;
  source: string;
}
```

Repository 接口新增：

```typescript
export interface IBatchLineRepository {
  getLines(provinceCode: string, subjectType: string): Promise<BatchLinesResult>;
}
export interface IRankSegmentRepository {
  getSegments(provinceCode: string, subjectType: string): Promise<ProvinceRankSegment[]>;
  getReferenceByMode(mode: string, subjectType: string): Promise<ProvinceRankSegment[] | null>;
}
export interface ISubjectCoverageRepository {
  getCoverage(provinceCode: string | null, subjects: string[]): Promise<SubjectCoverageResult>;
}
```

## 6. 程序调用流程

### 6.1 批次线查询

`GET /api/batch-lines?province=广东&subjectType=物理` → 路由校验 → `BatchLineService.getLines` → `PrismaBatchLineRepository` 按 provinceCode + year + subjectType 查询；无数据时按同 `examMode` 省份补全 → 返回 `{ code, data, message }`。

### 6.2 位次查询（扩展）

`GET /api/rank-lookup?score=585&province=广东&subjectType=物理` → 路由校验 → `RankService.lookup` → 查询 `ProvinceRankSegment` 关键段位并按 score 降序 → 相邻两段线性插值：`rank = r2 + (r1 - r2) * (s2 - s) / (s2 - s1)`；无本省数据时按同 mode 参考省的考生总数比例缩放，标记 `confidence: 'estimated'` → 返回 `RankInfo`。

### 6.3 覆盖率查询

`GET /api/subject-coverage?province=广东&subjects=物理,化学,生物` → 路由解析 subjects → `SubjectCoverageService.getCoverage` → 先按省份查，无则取全国默认 → 前端展示「约 X% 的专业可报考（基于 985/重点专业样本）」。

### 6.4 数据导入

`scripts/importAll.ts` 顺序调用三个导入脚本；每个脚本先 `TRUNCATE` 目标表，再解析 markdown 并 `createMany`，输出统计与异常行。

## 7. 任务列表（按实现顺序）

| ID | 任务 | 关键文件 | 依赖 |
|----|------|----------|------|
| T01 | **Schema 扩展与迁移** | `prisma/schema.prisma`、迁移 SQL | — |
| T02 | **核心类型与 Repository 接口扩展** | `src/types/index.ts`、`src/repositories/interfaces.ts` | T01 |
| T03 | **新增 Prisma Repository 实现** | `src/repositories/prismaRepository.ts` | T02 |
| T04 | **新增内存 Repository 实现与 mock 数据** | `src/repositories/inMemoryRepository.ts`、`src/data/mockData.ts` | T02 |
| T05 | **新增/扩展 Service 层** | `src/services/batchLineService.ts`、`subjectCoverageService.ts`、`rankService.ts` | T03、T04 |
| T06 | **新增 markdown 解析工具** | `src/lib/markdownParsers.ts` | — |
| T07 | **开发数据导入脚本** | `scripts/import*.ts` | T01、T06 |
| T08 | **扩展后端路由与参数校验** | `src/routes/index.ts` | T05 |
| T09 | **更新依赖注入** | `src/app.ts` | T03、T04、T05、T08 |
| T10 | **前端 API 层扩展** | `gaokao-app/src/api/gaokaoApi.ts` | T08 |
| T11 | **Step1 接入真实覆盖率** | `gaokao-app/src/pages.tsx` | T10 |
| T12 | **Step2 传入 subjectType 并展示置信度** | `gaokao-app/src/pages.tsx` | T10 |
| T13 | **Step3 接入真实批次线** | `gaokao-app/src/pages.tsx` | T10 |
| T14 | **联调测试与数据验证** | 全链路、脚本、前后端 | T07、T09、T11~T13 |

## 8. 依赖包列表

无新增运行时依赖，复用现有 `@prisma/client` 与 `tsx`。若 markdown 解析复杂，可选引入 `marked` 或 `markdown-it`。

## 9. 共享知识/约定

- 接口统一返回 `{ code, data, message }`。
- 入参使用省份中文名，Repository 内部转成 `provinceCode`。
- `subjectType` 枚举：`物理 / 历史 / 综合改革 / 文科 / 理科 / A类 / B类`。
- 批次线文案：新高考显示「本科线/特控线」；传统高考显示「一本线/二本线」；西藏显示「A类/B类 一本/二本」。
- 覆盖率口径基于 985/重点专业样本，`source` 字段明确说明。
- 数据补全优先级：本省 > 同 mode 省份比例估算 > 全国默认；缺失时 `confidence = estimated`。
- 导入脚本先 `TRUNCATE` 再写入，保证幂等。
- 内存 mock 数据与真实数据分布尽量对齐，确保双模式 UI 行为一致。

## 10. 待明确事项

1. 覆盖率计算范围：是否仅基于 985/重点专业样本，还是需要补充全国本科专业库？
2. 内存模式策略：`USE_DATABASE=false` 时新 API 返回简化 mock，还是同步一份真实数据快照到 `mockData.ts`？
3. 位次/分数线缺失严重时：前端回退旧 mock 值，还是强制显示「数据暂缺」？
