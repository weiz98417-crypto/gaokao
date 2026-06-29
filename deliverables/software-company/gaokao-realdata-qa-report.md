# 高考志愿填报 APP 真实数据接入改造 — QA 测试报告

## 测试概览

| 项目 | 结果 |
|------|------|
| 测试执行人 | QA 工程师（严过关） |
| 测试日期 | 2026-06-29 |
| 后端目录 | `D:\填报\gaokao-backend` |
| 前端目录 | `D:\填报\gaokao-app` |
| 数据目录 | `C:\Users\Administrator\Desktop\高考志愿填报数据库\` |
| 后端服务 | `http://localhost:3000`（数据库模式） |
| 前端服务 | `http://localhost:5173` / `http://localhost:4173`（preview） |
| **IS_PASS** | **FAIL** |
| **智能路由判定** | **Engineer（前端源码 Bug）** |

---

## 一、测试用例与执行结果

### 1. 数据导入验证

**测试目标**：确认 PostgreSQL 中 `data.province_batch_lines`、`data.province_rank_segments`、`data.subject_coverages` 的数据来自桌面 markdown 源文件。

| 检查项 | 预期 | 实际 | 结果 |
|--------|------|------|------|
| `data.province_batch_lines` 条数 | > 0 | **114** | PASS |
| `data.province_rank_segments` 条数 | > 0 | **172** | PASS |
| `data.subject_coverages` 条数 | > 0 | **11** | PASS |
| 批次线数据来源 | `2026年全国各省高考分数线汇总.md` | `2026年全国各省高考分数线汇总.md` | PASS |
| 位次表数据来源 | `2026年全国一分一段表关键数据汇总.md` / `2026年全国各省分数线与位次对照表.md` | 同上 | PASS |
| 覆盖率数据来源 | `2026年985高校专业选科要求对照表.md` | `2026年985高校专业选科要求对照表` | PASS |
| 广东物理本科线 | 425 | 425 | PASS |
| 广东物理特控线 | 539 | 539 | PASS |
| 河南物理本科线 | 419 | 419 | PASS |
| 四川物理本科线 | 435 | 435 | PASS |

**结论**：数据表已按预期从桌面 markdown 文件导入，字段 `source` 可追溯至源文件。

---

### 2. 后端 API 验证（数据库模式）

#### 2.1 广东 / 物理

| API | URL | 实际返回 | 结果 |
|-----|-----|----------|------|
| 批次线 | `/api/batch-lines?province=广东&subjectType=物理` | 本科线 425、特控线 539 | PASS |
| 位次 | `/api/rank-lookup?score=585&province=广东&subjectType=物理` | rank 46934、sameScore 1262、confidence `exact` | PASS |
| 覆盖率 | `/api/subject-coverage?province=广东&subjects=物理,化学,生物` | coveragePct 0.90（90%） | PASS |

#### 2.2 非广东省份

| 省份 | 科目类 | API | 实际返回 | 结果 |
|------|--------|-----|----------|------|
| 河南 | 物理 | 批次线 | 本科线 419、特控线 513 | PASS |
| 河南 | 物理 | 位次（585） | rank 43583、confidence `exact` | PASS |
| 四川 | 物理 | 批次线 | 本科线 435、特控线 519 | PASS |
| 四川 | 物理 | 位次（585） | rank 37000、confidence `exact` | PASS |
| 河北 | 物理 | 批次线 | 本科线 443、特控线 510 | PASS |
| 河北 | 物理 | 位次（585） | rank 43165、confidence `exact` | PASS |
| 湖南 | 物理 | 批次线 | 本科线 400、特控线 481 | PASS |
| 湖南 | 物理 | 位次（585） | rank 26639、confidence `exact` | PASS |

**结论**：后端 API 返回真实数据，非 mock 硬编码。

---

### 3. 前端展示验证

| 步骤 | 检查项 | 预期 | 实际 | 结果 |
|------|--------|------|------|------|
| Step1 | 选科后显示真实覆盖率 | 显示服务端覆盖率（非 87% 硬编码） | **Coverage 区域一直显示"正在计算覆盖率..."，API 已 200 返回但不渲染** | **FAIL** |
| Step2 | 输入分数后显示真实位次 + 置信度 | 显示服务端位次、同分、区间、置信度 | 显示 46,934 名、1,262 同分、区间 46,935-48,196、置信度"精确" | PASS |
| Step3 | 显示真实本科线/特控线 | 显示服务端批次线（非 530 硬编码） | **批次线区域一直显示"正在查询批次线..."，API 已 200 返回但不渲染** | **FAIL** |

**截图证据**：
- `step1-coverage-fresh.png`：Step1 完成选科后，Coverage 卡在"正在计算覆盖率..."
- `step2-rank.png`：Step2 正确显示真实位次与置信度
- `step3-batchlines.png`：Step3 批次线卡在"正在查询批次线..."
- `step1-memory-mode.png`：内存模式下前端不崩溃，但同样卡在加载中

---

### 4. 内存模式验证（`USE_DATABASE=false`）

| 检查项 | 预期 | 实际 | 结果 |
|--------|------|------|------|
| 后端以 `USE_DATABASE=false` 启动 | 成功 | 成功运行于 `localhost:3001` | PASS |
| `/api/batch-lines` 仍有返回 | 返回 mock/快照 | 返回本科线 425、特控线 539 | PASS |
| `/api/rank-lookup` 仍有返回 | 返回 mock/快照 | 返回 rank 50738 | PASS |
| `/api/subject-coverage` 仍有返回 | 返回 mock/快照 | 返回 coveragePct 0.94 | PASS |
| 前端不崩溃 | 页面正常 | 页面正常，但同样存在 Step1/Step3 加载卡死 Bug | PARTIAL |

**结论**：内存模式 API 正常返回，前端不会崩溃；但前端加载状态 Bug 在内存模式下同样存在。

---

### 5. 类型检查

| 项目 | 命令 | 结果 |
|------|------|------|
| 后端 | `npm run typecheck` | **PASS** |
| 前端 | `npm run build` | **PASS** |

---

## 二、发现的问题

### Bug 1：Step1 / Step3 API 加载状态卡死（源码 Bug）

- **严重级别**：高
- **影响**：Step1 覆盖率、Step3 批次线无法正常展示，用户无法看到真实数据
- **复现步骤**：
  1. 打开 `/step1`
  2. 选择首选科目 + 两门再选科目
  3. Coverage 区域持续显示"正在计算覆盖率..."
  4. 进入 Step3，批次线区域持续显示"正在查询批次线..."
- **根因分析**：
  - `gaokao-app/src/pages.tsx` 中 Step1 与 Step3 的 `useEffect` 均使用 `cancelled` 标记控制竞态：
    ```tsx
    .finally(() => {
      if (!cancelled) {
        setCoverageLoading(false);   // Step1
        // setBatchLinesLoading(false); // Step3
      }
    });
    ```
  - `useEffect` 的依赖数组包含 `cachedSubjectCoverage` / `cachedBatchLines`。
  - API 成功后调用 `setCachedSubjectCoverage(data)`，导致 effect 重新执行；React 先执行上一次 effect 的 cleanup（`cancelled = true`），再执行新 effect。
  - 新 effect 因缓存已存在而 `return` 提前退出，不会重置 loading；而旧 effect 的 `.finally` 因 `cancelled === true` 也不会重置 loading。
  - 结果：`coverageLoading` / `batchLinesLoading` 永远为 `true`。
- **修复建议**（任选其一）：
  1. **推荐**：在 `.finally` 中无条件重置 loading，仅对数据设置使用 `cancelled` 判断：
     ```tsx
     .finally(() => {
       setCoverageLoading(false); // 或 setBatchLinesLoading(false)
     });
     ```
  2. 在 effect 的 cleanup 函数中主动重置 loading：
     ```tsx
     return () => {
       cancelled = true;
       setCoverageLoading(false);
     };
     ```
  3. 将 `cachedSubjectCoverage` / `cachedBatchLines` 从依赖数组中移除，避免 API 成功后触发 effect 重跑。
- **涉及文件**：
  - `gaokao-app/src/pages.tsx`（Step1 `Step1Province` 组件，约第 272-305 行）
  - `gaokao-app/src/pages.tsx`（Step3 `Step3Confirm` 组件，约第 596-629 行）

### Bug 2：Step2 "超过一本线" 文案仍使用硬编码 530（源码 Bug）

- **严重级别**：中
- **影响**：Step2 显示"超过一本线 55分"，但此处的"一本线"是写死的 530，未使用真实批次线
- **根因分析**：
  - `gaokao-app/src/pages.tsx` 第 463-468 行：
    ```tsx
    const overLine = useMemo(() => {
      const s = Number(score);
      if (!s) return 0;
      const line = 530; // 硬编码
      return Math.max(0, s - line);
    }, [score]);
    ```
- **修复建议**：
  - 在 Step2 调用 `getBatchLines(province, subjectType)` 获取真实特控线/本科线，或复用 Step3 的 `cachedBatchLines` 计算超过分数。
- **涉及文件**：
  - `gaokao-app/src/pages.tsx`（Step2 `Step2Score` 组件，约第 463-468 行）

### 问题 3：覆盖率无省份差异化（设计/数据局限）

- **严重级别**：低
- **说明**：`subject_coverages` 表中所有记录 `province_code` 为 `NULL`，即全国通用覆盖率。不同省份选择相同组合返回相同覆盖率（如广东、北京、河北均为 90%）。
- **建议**：后续可补充各省招生计划的差异化覆盖率数据。

---

## 三、智能路由判定

| 判定项 | 结论 | 说明 |
|--------|------|------|
| 测试代码是否有 Bug | QA | 测试用例与断言正确，无需修复 |
| 源码是否有 Bug | **Engineer** | 前端 `gaokao-app/src/pages.tsx` 存在加载状态卡死 Bug，需由工程师修复 |
| 数据导入是否有问题 | NoOne | 数据表已正确导入并可追溯至 markdown 源文件 |

**最终路由：Engineer**

需要工程师修复以下问题后，QA 可进行第二轮回归验证：
1. 修复 `gaokao-app/src/pages.tsx` 中 Step1 / Step3 的 `useEffect` loading 状态卡死问题。
2. 修复 Step2 "超过一本线" 硬编码 530 的问题。

---

## 四、环境状态

- 后端已恢复为数据库模式：`localhost:3000`，`USE_DATABASE=true`
- 前端 dev 服务器：`localhost:5173`
- 前端 preview 服务器：`localhost:4173`
- 测试截图保存于：`D:\填报\deliverables\software-company\`

---

## 五、结论

- **后端数据层与 API**：通过。真实数据已从桌面 markdown 导入 PostgreSQL，API 返回真实批次线、位次、覆盖率。
- **类型检查**：通过。后端 `npm run typecheck`、前端 `npm run build` 均成功。
- **内存模式**：通过。API 仍有返回，前端不崩溃。
- **前端展示**：**未通过**。Step1 覆盖率、Step3 批次线因 loading 状态 Bug 无法渲染；Step2 位次展示正常。

**IS_PASS = FAIL**，建议修复后回归。

---

## 第二轮回归验证（聚焦版）

执行时间：2026-06-29（验证时）

验证范围：仅针对高考志愿填报 APP 真实数据接入的三个最关键检查点进行端到端验证。

| 检查点 | 操作 | 预期 | 实际 | 结果 |
|--------|------|------|------|------|
| Step1 覆盖率 | 选择 广东 + 物理 + 化学 + 生物 | 页面显示「约 90% 的专业可报考（基于 985/重点专业样本）」，loading 不卡住 | 页面显示「约 90% 的专业可报考（基于 985/重点专业样本）」，覆盖率加载完成后立即渲染 | PASS |
| Step2 位次与分差 | 输入 585 分 | 位次约 46,934 名、置信度「精确」，并显示「超过特控线 46分」 | 位次 46,934 名、同分 1,262、区间 46,935-48,196、置信度「精确」，显示「超过特控线 46分」 | PASS |
| Step3 批次线 | 进入 Step3 | 显示「本科线 425分 / 特控线 539分」，loading 不卡住 | 批次线显示「本科线 425分 / 特控线 539分」，加载完成后立即渲染 | PASS |

### 补充说明
- 验证时后端服务 `http://localhost:3000` 已处于运行状态（数据库模式，真实数据已导入）。
- 前端 dev 服务 `http://localhost:5173` 初始未运行，已重新启动并等待就绪后执行验证。
- 上一版报告中反馈的 Step1/Step3 loading 状态卡死、Step2 硬编码 530 问题已修复，真实数据可正常展示。

**IS_PASS: YES**
