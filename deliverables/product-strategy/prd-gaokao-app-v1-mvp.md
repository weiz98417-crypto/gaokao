# 高考志愿填报APP - 考生成绩/意向采集与智能推荐引擎 PRD

**版本**：V1.0 (MVP 阶段)
**日期**：2026-06-27
**类型**：PRD / 功能规格书
**参与成员**：析客（需求分析师）、瑞思（用户研究员）、竞析（竞品分析师）、数析（数据分析师）

---

## 📌 TL;DR（执行摘要）

本PRD定义高考志愿填报APP MVP阶段的核心模块——"考生成绩/意向采集与智能推荐引擎"。产品通过**分步式Wizard+对话式双入口**实现无痛信息采集，以**位次直查法为核心的4梯度推荐引擎**生成冲稳保垫方案，并首创**定量权重滑块机制**让用户自主调节院校/地域/专业优先级。MVP覆盖Top 10高考省份完整本地化，解决88%家长/考生志愿填报缺乏自信的核心痛点，目标实现推荐方案采纳率≥30%、付费转化率≥3-5%。

---

## 🎯 核心结论卡片

| 项目 | 内容 |
|------|------|
| 推荐方案 | 分步式Wizard采集 → 权重矩阵 → 位次直查+权重加权4梯度推荐 → 志愿风险诊断 |
| 优先级 | P0（核心引擎，无此模块产品无法运转） |
| 预期影响 | 成绩采集完成率≥85%、意向采集完成率≥60%、推荐方案查看率≥75%、推荐采纳率≥30%、付费转化率≥3-5% |
| 资源需求 | 后端算法工程师2人、前端工程师2人、数据工程师1人、产品1人；预估6-8周开发周期 |
| 风险等级 | 中高（省份差异化复杂度高、位次数据时效性要求严、选科组合校验覆盖量大） |

---

## 1. 产品目标（3个清晰、正交的目标）

### 目标1：信息采集零摩擦
让考生/家长在**3分钟内**完成核心信息输入（省份+选科+总分），系统自动补全位次与可选信息，成绩采集完成率≥85%。

### 目标2：推荐透明可控
每个推荐方案附带**数据溯源+推荐依据说明**，用户可通过权重滑块实时调节推荐倾向，推荐方案查看率≥75%，推荐方案采纳率≥30%。

### 目标3：边缘场景兜底
对压线分、高分密集区、分数断层、新增专业首次招生、选科不匹配等异常场景均有**专门的降级提示和替代方案**，不遗漏任何用户群体。

---

## 2. 用户故事（5个核心场景）

### US-1：深夜焦虑家长
**As** 焦虑操控型家长（中高分段500-600分），**I want** 输入孩子分数后立刻看到可报院校范围和录取概率区间，**So that** 我不再每晚焦虑刷信息，获得确定感。

> 来源：瑞思洞察#5——"家长焦虑的核心是缺确定感"，场景#1"深夜焦虑刷信息→需要信息降噪+焦虑熔断"

### US-2：小白考生一键生成
**As** 迷茫被动型考生（中等分段450-550分），**I want** 只输入省份和分数就能一键生成完整的冲稳保垫方案，**So that** 我不需要做任何复杂决策就能获得可落地的志愿表。

> 来源：瑞思洞察#2——"长表单是流失第一杀手"，洞察#4——"'不确定'是常态而非异常"

### US-3：理性策略型精准比对
**As** 理性策略型家长考生组合（高分段600+分），**I want** 每个推荐方案附带位次对比数据、3年录取趋势线和专业组纯净度指标，**So that** 我可以交叉验证、精准决策而非盲从推荐。

> 来源：瑞思洞察#5——"推荐附带数据溯源+推荐依据"，场景#3"高分段精准比对"

### US-4：县城家庭首次接触新高考
**As** 三线及以下城市家庭（中等偏下350-480分），**I want** 系统自动检测我的选科组合是否合规并可视化展示本省投档规则，**So that** 我不会因为不懂新高考规则而填错志愿。

> 来源：瑞思洞察#7——"省份差异化是最大复杂度来源"，场景#4"县城家长首次接触新高考"

### US-5：家长考生意见分歧
**As** 就业导向型考生与地域偏好型家长，**I want** 通过权重滑块分别设定"专业优先"和"地域优先"两套方案并对比，**So that** 我们能找到双方都能接受的妥协方案。

> 来源：瑞思洞察#3——"权重调节交互必须可视化"，场景#5"家长考生意见分歧"

---

## 3. 用户研究洞察（来自瑞思）

### 5类核心用户画像

| 编号 | 画像名称 | 分数段 | 特征关键词 | 核心需求 | 设计响应 |
|------|----------|--------|------------|----------|----------|
| P1 | 焦虑操控型家长 | 500-600 | 信息驱动、极度焦虑、决策主导 | 确定感、数据溯源、可验证 | 推荐依据展示、3年趋势线、概率区间 |
| P2 | 迷茫被动型考生 | 450-550 | 回避决策、偏好一键 | 极简输入、免思考 | 3项起步、一键生成、智能默认值 |
| P3 | 理性策略型组合 | 600+ | 数据驱动、交叉验证 | 透明度、控制感 | 数据溯源、权重调节、多方案对比 |
| P4 | 三线以下城市家庭 | 350-480 | 信息弱势、从众 | 规则可视化、防错 | 选科合规检测、投档规则可视化、预警 |
| P5 | 就业/考研导向型 | 480-580 | 前景导向、专业优先 | 专业深度、就业链路 | 专业详情+就业数据、权重滑块专业优先 |

### 8条关键洞察及PRD响应

| # | 洞察 | PRD响应措施 | 落地章节 |
|---|------|------------|----------|
| 1 | 长表单是流失第一杀手 | 3项起步+渐进补充，Wizard分5步，每步≤5个字段 | §7.4 |
| 2 | 数据输入容错是信任基础 | 数据确认卡片、位次自动反查、异常值温和提示而非硬拦截 | §7.1 |
| 3 | 权重调节必须可视化 | 拖拽滑块+实时推荐预览、三角形权重可视化图 | §7.2 |
| 4 | "不确定"是常态 | 零偏好输入模式、所有意向字段支持"帮我选"智能默认 | §7.2/§7.4 |
| 5 | 确定感=数据溯源 | 每个推荐附带：位次对比、3年录取线、招生计划变动、推荐依据文字说明 | §7.3 |
| 6 | 算法趋同是系统性风险 | 推荐加入"分散度"因子+冷门优质替代推荐（≥2个） | §7.3 |
| 7 | 省份差异化=最大复杂度 | MVP覆盖Top10省完整本地化、自动适配投档规则 | §7.3 |
| 8 | 用户需要"被理解"而非"被推荐" | 对话式+表单式双入口，推荐前展示"我理解你的情况"摘要 | §7.4 |

---

## 4. 竞品对比（来自竞析）

### 10款竞品关键特性对比

| 竞品 | 核心定位 | 意向采集方式 | 推荐算法 | 权重调节 | 异常处理 | 数据覆盖 | 定价 |
|------|----------|------------|----------|----------|----------|----------|------|
| 夸克高考 | 免费+大模型标杆 | 定性选项 | 大模型+数据 | ❌无 | ❌弱 | 29省 | 免费 |
| 掌上高考 | 官方数据权威 | 定性选项 | 位次法 | ❌无 | ❌弱 | 全国 | 免费+付费 |
| 高考直通车 | 备考+志愿一体化 | 定性选项 | 位次法 | ❌无 | ❌弱 | 全国 | 免费+付费 |
| 完美志愿 | 就业数据差异化 | 定性选项 | 位次+就业 | ❌无 | ❌弱 | 全国 | 付费 |
| 优志愿 | 专业组纯净度独创 | 定性选项 | 位次法 | ❌无 | ❌弱 | 全国 | 付费 |
| 蝶变志愿 | 同分去向+防撞车 | 定性选项 | 位次+同分 | ❌无 | ❌弱 | 全国 | 付费 |
| 百度AI助考 | 搜索入口+AI | 对话式 | 大模型 | ❌无 | ❌弱 | 部分 | 免费 |
| 阳光志愿 | 教育部官方 | 定性选项 | 基础匹配 | ❌无 | ❌弱 | 全国 | 免费 |
| 志愿无忧 | 线下+线上 | 顾问式 | 人工+数据 | ❌无 | ❌弱 | 部分 | 高付费 |
| 靠谱AI | AI对话式 | 对话式 | 大模型 | ❌无 | ❌弱 | 部分 | 免费+付费 |

### 3大差异化机会（我们的首创点）

| # | 差异化点 | 现状（竞品做法） | 我们的方案 | PRD章节 |
|---|----------|-----------------|-----------|---------|
| 1 | 定量权重调节 | 所有竞品均为定性选项，无数值化权重 | 权重滑块（院校/地域/专业三角权重），拖拽调节+实时推荐变化 | §7.2 |
| 2 | 边缘分数+异常场景专门处理 | 所有竞品缺乏专门处理 | 压线分降级提示、分数断层识别、新增专业标记、选科不匹配预警 | §7.3 |
| 3 | 分步式+对话式双入口 | 竞品均为单一表单或单一对话 | Wizard分步式为主入口+AI对话式为辅入口，共享同一数据模型 | §7.4 |

### 竞品最佳实践借鉴

| 来源 | 借鉴点 | 我们的实现方式 |
|------|--------|---------------|
| 夸克 | 输入分数自动匹配位次 | 总分+省份→自动反查一分一段表→位次自动填入 |
| 夸克 | 多志愿表管理+导出 | MVP暂不支持，列入V2停车场 |
| 优志愿 | 专业组纯净度指标 | 推荐结果中展示专业组纯净度评分（0-100） |
| 蝶变志愿 | 同分去向 | 推荐结果中展示"同分段考生去向分布"摘要 |
| 蝶变志愿 | 防撞车检测 | 志愿风险诊断模块（§7.3） |
| 阳光志愿 | 毕业去向+职业发展 | MVP仅展示就业率摘要，完整职业发展链路列入V2 |

### 竞品常见问题——我们必须避免

| ❌ 竞品问题 | ✅ 我们的对策 |
|------------|-------------|
| 位次要求用户手动输入 | 系统根据总分+省份自动反查一分一段表 |
| 一开始就要求填太多偏好 | 渐进式采集：3项起步→逐步补充→权重调节 |
| 录取概率只有一个数字 | 提供概率区间（如"35%-55%"），而非"45%" |
| 缺乏志愿风险诊断 | 必须设计志愿风险诊断功能（撞车检测+梯度检查） |

---

## 5. 数据依据（来自数析）

### 市场规模与渗透率

| 指标 | 数值 | 来源/说明 |
|------|------|----------|
| 2025年高考人数 | ~1335万 | 教育部公开数据 |
| 本科录取率 | ~40% | 全国平均 |
| 家长/考生缺乏自信比例 | 88% | 艾瑞咨询调研 |
| 2025年付费市场规模 | 10.9亿元 | 艾瑞咨询 |
| 2027年付费市场规模（预测） | 12.2亿元 | 艾瑞咨询预测 |
| APP使用渗透率 | 30-40% | 行业估算 |
| AI工具渗透率 | >25%（快速攀升） | 2025年趋势 |
| 家长决策占比 | 70-80% | 行业调研 |
| 考生决策占比 | 20-30% | 行业调研 |

### 省份差异化数据（MVP覆盖Top 10省）

| 省份 | 高考模式 | 投档模式 | 志愿数量 | 2024年考生数(万) | MVP优先级 |
|------|----------|----------|----------|-----------------|-----------|
| 广东 | 3+1+2（2021批） | 院校专业组平行 | 45 | ~73 | ★★★ |
| 河南 | 3+1+2（2025批） | 院校专业组平行 | 48 | ~136 | ★★★ |
| 山东 | 3+3 | 专业+院校平行 | 96 | ~82 | ★★★ |
| 江苏 | 3+1+2（2021批） | 院校专业组平行 | 40 | ~47 | ★★★ |
| 四川 | 3+1+2（2025批） | 院校专业组平行 | 45 | ~83 | ★★☆ |
| 河北 | 3+1+2（2021批） | 院校专业组平行 | 96 | ~75 | ★★☆ |
| 湖南 | 3+1+2（2021批） | 院校专业组平行 | 45 | ~69 | ★★☆ |
| 安徽 | 3+1+2（2024批） | 院校专业组平行 | 45 | ~64 | ★★☆ |
| 湖北 | 3+1+2（2021批） | 院校专业组平行 | 45 | ~50 | ★☆☆ |
| 浙江 | 3+3 | 专业+院校平行 | 80 | ~40 | ★☆☆ |

> 注：Top10省覆盖考生约619万，占全国46%+。MVP阶段其余省份提供基础功能（成绩输入+简单推荐），完整本地化列入V2。

### 算法关键数据

| 参数 | 数值 | 说明 |
|------|------|------|
| 往年数据覆盖年限 | ≥3年（2023-2025），推荐5年 | 位次匹配基础数据 |
| 位次匹配精度 | ≤±5% | 核心精度要求 |
| 分数浮动容忍度 | ±10分 | 线差法辅助校验范围 |
| 招生计划年变动率 | ~2-3% | 需在推荐中体现变动影响 |
| 专业年调整率 | ~2% | 新增/撤销专业需标记 |
| 一分一段表时效 | 出分日24h内入库 | 数据工程硬性要求 |
| 录取概率区间精度 | ±10% | 如"35%-55%"而非"45%" |

### MVP核心指标目标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| 成绩采集完成率 | ≥85% | 完成Step1-3的用户/进入采集流程的用户 |
| 意向采集完成率 | ≥60% | 完成Step4-5的用户/完成成绩采集的用户 |
| 推荐方案查看率 | ≥75% | 查看推荐结果页的用户/完成意向采集的用户 |
| 推荐方案采纳率 | ≥30% | 导出/保存≥1个方案的用户/查看推荐的用户 |
| 付费转化率 | ≥3-5% | 付费用户/查看推荐的用户 |

---

## 6. 需求池（P0/P1/P2优先级）

| 编号 | 需求 | 优先级 | 验收标准 | 估算工作量 |
|------|------|--------|----------|-----------|
| R-01 | 省份选择+高考模式自动适配 | P0 | 选择省份后自动展示该省高考模式、投档规则、志愿数量；覆盖Top10省 | 1.5周 |
| R-02 | 选科组合输入+非法组合拦截 | P0 | 所有非法组合被拦截并提示原因；3+3/3+1+2/传统文理全覆盖 | 1周 |
| R-03 | 总分输入+位次自动反查 | P0 | 输入总分+省份后自动反查一分一段表填入位次；位次匹配精度≤±5% | 1.5周 |
| R-04 | 一分一段表数据入库 | P0 | 31省2023-2025年一分一段表完整入库；出分日24h内新数据入库 | 2周 |
| R-05 | 特殊身份/加分项采集 | P1 | 支持三大专项、强基、艺术体育、少数民族加分等选项；不影响核心流程 | 0.5周 |
| R-06 | 院校偏好采集 | P1 | 支持院校层次筛选、公办/民办偏好、最低层次控制 | 0.5周 |
| R-07 | 地域偏好采集 | P1 | 支持期望/排斥城市省份选择、经济圈偏好 | 0.5周 |
| R-08 | 专业偏好采集 | P1 | 支持学科大类选择、具体专业、"绝对不读"黑名单 | 0.5周 |
| R-09 | 权重滑块交互 | P0 | 院校/地域/专业三角权重可视化拖拽；实时推荐预览；零偏好模式 | 1.5周 |
| R-10 | 位次直查法推荐引擎 | P0 | 基于位次直查法的4梯度推荐（冲稳保垫）；3年数据加权；录取概率区间 | 2周 |
| R-11 | 意向权重融入推荐排序 | P0 | 权重参数融入推荐排序算法；用户调节权重后推荐实时更新 | 1周 |
| R-12 | 推荐结果页（数据溯源） | P0 | 每个推荐展示：位次对比、3年趋势、概率区间、专业组纯净度、推荐依据 | 1.5周 |
| R-13 | 专业组纯净度指标 | P0 | 每个专业组展示纯净度评分（0-100）及组成专业列表 | 0.5周 |
| R-14 | 分散度因子+冷门替代 | P1 | 推荐结果中≥2个冷门优质替代方案；分散度评分展示 | 0.5周 |
| R-15 | 压线分降级提示 | P0 | 识别压线分场景并提示降级策略 | 0.5周 |
| R-16 | 分数断层识别与处理 | P0 | 一分一段表中检测分数断层并标记 | 0.5周 |
| R-17 | 新增专业无历史分数标记 | P0 | 新增/无历史分数专业标记"首次招生"并提供风险提示 | 0.5周 |
| R-18 | 选科不匹配专业预警 | P0 | 选科组合与专业要求不匹配时红色预警 | 0.5周 |
| R-19 | 志愿风险诊断 | P1 | 撞车检测+梯度合理性检查+风险评级 | 1周 |
| R-20 | Wizard分步流程 | P0 | 5步Wizard流程；每步≤5字段；步骤间跳转自由；数据自动补全 | 1.5周 |
| R-21 | 数据确认卡片 | P0 | Step3完成后弹出数据确认卡片；位次/分数可视化 | 0.5周 |
| R-22 | 对话式辅入口 | P1 | AI对话式信息采集通道；共享Wizard数据模型 | 1.5周 |
| R-23 | "帮我选"智能默认值 | P1 | 所有意向字段支持一键填充智能默认值 | 0.5周 |
| R-24 | 同分去向分布 | P1 | 推荐结果中展示同分段考生去向分布摘要 | 0.5周 |
| R-25 | 投档规则可视化 | P1 | 根据省份展示投档规则说明图 | 0.5周 |
| R-26 | 多志愿表管理+导出 | P2 | 支持创建多个志愿方案+多格式导出 | V2停车场 |
| R-27 | 毕业去向+职业发展链路 | P2 | 完整的就业率+职业发展数据链路 | V2停车场 |
| R-28 | 单科成绩采集 | P2 | 各科成绩详情录入（用于更精准匹配） | V2停车场 |

---

## 7. 详细功能需求

### 7.1 考生成绩与基本面采集（精准定位）

#### 7.1.1 省份选择

| 属性 | 值 |
|------|-----|
| 字段名 | `province` |
| 数据类型 | Enum（31省级行政区代码） |
| 必填/可选 | **必填** |
| 输入方式 | 下拉选择列表，按考生数降序排列，Top10省置顶并标注★ |
| 默认值 | 无（用户必须主动选择） |
| 校验规则 | 1. 必须选择一个有效省份代码；2. 选择后系统自动锁定该省高考模式 |
| 自动联动 | 选择省份后，系统自动：①确定高考模式（3+3/3+1+2/传统）；②确定投档模式；③确定志愿数量上限；④加载该省一分一段表数据 |
| 异常处理 | 无异常场景（省份列表为枚举值） |

**省份选择后的自动适配逻辑**：

```
provinceSelected(provinceCode) →
  IF province IN {上海, 浙江, 北京, 天津, 山东, 海南} →
    mode = "3+3"
    filingMode = IF province IN {浙江, 山东} → "专业+院校平行" ELSE → "院校专业组平行"
  ELSE IF province IN {新疆, 西藏} →
    mode = "传统文理"
    filingMode = "传统院校平行志愿"
  ELSE →
    mode = "3+1+2"
    filingMode = "院校专业组平行志愿"
  
  volunteerCount = provinceConfig[provinceCode].maxVolunteers
  loadProvinceRankTable(provinceCode, years=[2023, 2024, 2025])
```

#### 7.1.2 选科组合

| 属性 | 值 |
|------|-----|
| 字段名 | `subject_combination` |
| 数据类型 | Object（模式不同结构不同） |
| 必填/可选 | **必填** |
| 输入方式 | 根据省份高考模式动态渲染不同UI |
| 默认值 | 无 |
| 校验规则 | 详见下方选科非法组合拦截规则 |
| 自动联动 | 选科确定后，系统自动筛选可报考专业范围 |

**三种模式的输入UI与数据结构**：

**模式A：传统文理（新疆/西藏）**
- UI：单选按钮，"文科"或"理科"
- 数据结构：`{ mode: "traditional", category: "arts" | "science" }`

**模式B：3+3（6省）**
- UI：3个选择器——必选3科（语数外默认锁定不可选），自选3科从6/7门中选择
- 自选科目池：物理、化学、生物、政治、历史、地理（浙江省额外含技术）
- 数据结构：`{ mode: "3+3", required: ["语文","数学","外语"], elective: [string, string, string] }`

**模式C：3+1+2（23省）**
- UI：3步选择——①语数外默认锁定；②首选1科（物理/历史）；③再选2科（化学/生物/政治/地理）
- 数据结构：`{ mode: "3+1+2", required: ["语文","数学","外语"], primary: "物理" | "历史", secondary: [string, string] }`

#### 🔒 选科非法组合拦截校验规则

**3+3模式非法组合**（6省通用，浙江省额外规则见注释）：

| 编号 | 非法组合 | 拦截提示语 | 说明 |
|------|----------|-----------|------|
| 3+3-1 | 重复选择同一科目 | "同一科目不可重复选择" | 防止选如[物理,物理,化学] |
| 3+3-2 | 自选科目不足3门 | "请选择3门自选科目" | 必须恰好3门 |
| 3+3-3 | 自选科目超过3门 | "最多选择3门自选科目" | 不可选4门及以上 |

> 注：3+3模式下所有组合均为合法（20种组合），无学科间互斥限制。浙江省含"技术"科目，共7选3=35种组合。

**3+1+2模式非法组合**（23省通用）：

| 编号 | 非法组合 | 拦截提示语 | 说明 |
|------|----------|-----------|------|
| 3+1+2-1 | 首选未选择（物理/历史都没选） | "请选择首选科目：物理或历史" | 首选必须1门 |
| 3+1+2-2 | 首选同时选了物理和历史 | "首选科目只能选1门：物理或历史" | 物理和历史互斥 |
| 3+1+2-3 | 再选科目不足2门 | "请选择2门再选科目" | 必须恰好2门 |
| 3+1+2-4 | 再选科目超过2门 | "最多选择2门再选科目" | 不可选3门及以上 |
| 3+1+2-5 | 再选科目重复同一门 | "同一科目不可重复选择" | 防止选如[化学,化学] |
| 3+1+2-6 | 再选科目包含首选科目 | "再选科目不可与首选科目重复" | 如首选物理，再选不可再选物理 |

> 注：3+1+2模式下，首选物理有4种再选组合（化生/化政/化地/生政/生地/政地=6种），首选历史同样6种，共12种合法组合。所有12种组合均无互斥限制。

**校验执行逻辑**：

```javascript
function validateSubjectCombination(subjectCombo, provinceMode) {
  const errors = [];
  
  if (provinceMode === "traditional") {
    if (!subjectCombo.category || !["arts", "science"].includes(subjectCombo.category)) {
      errors.push({ code: "TRAD-01", msg: "请选择文科或理科" });
    }
    return errors;
  }
  
  if (provinceMode === "3+3") {
    const elective = subjectCombo.elective || [];
    // 重复检查
    if (new Set(elective).size !== elective.length) {
      errors.push({ code: "3+3-1", msg: "同一科目不可重复选择" });
    }
    // 数量检查
    if (elective.length < 3) errors.push({ code: "3+3-2", msg: "请选择3门自选科目" });
    if (elective.length > 3) errors.push({ code: "3+3-3", msg: "最多选择3门自选科目" });
    // 有效科目检查
    const validPool = getProvinceElectivePool(provinceCode); // 6门或7门(浙江)
    elective.forEach(s => {
      if (!validPool.includes(s)) errors.push({ code: "3+3-04", msg: `${s}不是本省可选科目` });
    });
    return errors;
  }
  
  if (provinceMode === "3+1+2") {
    const primary = subjectCombo.primary;
    const secondary = subjectCombo.secondary || [];
    // 首选检查
    if (!primary) errors.push({ code: "3+1+2-1", msg: "请选择首选科目：物理或历史" });
    if (primary === "both") errors.push({ code: "3+1+2-2", msg: "首选科目只能选1门" });
    // 再选数量
    if (secondary.length < 2) errors.push({ code: "3+1+2-3", msg: "请选择2门再选科目" });
    if (secondary.length > 2) errors.push({ code: "3+1+2-4", msg: "最多选择2门再选科目" });
    // 再选重复
    if (new Set(secondary).size !== secondary.length) errors.push({ code: "3+1+2-5", msg: "同一科目不可重复选择" });
    // 再选与首选冲突
    if (secondary.includes(primary)) errors.push({ code: "3+1+2-6", msg: "再选科目不可与首选科目重复" });
    // 有效科目检查
    const validSecondary = ["化学", "生物", "政治", "地理"];
    secondary.forEach(s => {
      if (!validSecondary.includes(s)) errors.push({ code: "3+1+2-07", msg: `${s}不是再选可选科目` });
    });
    return errors;
  }
}
```

**选科与专业可报范围的联动**：

选择科目组合后，系统自动查询该组合下可报考的专业范围。专业选科要求分为5种类型：
- **必选1科**：必须包含指定科目（如"必选物理"→首选物理才可报）
- **必选2科**：必须同时包含2门指定科目（如"必选物理+化学"）
- **必选3科**：3+3模式下必须包含3门指定科目
- **选1即可**：包含任意1门指定科目即可（如"物理或化学或生物"）
- **不限**：任何选科组合均可报考

系统在推荐引擎中自动过滤：选科组合不满足专业要求的专业组，**不出现在推荐列表中**，并以红色预警标签标注在专业详情页。

#### 7.1.3 具体分数与省排名

**7.1.3.1 总分**

| 属性 | 值 |
|------|-----|
| 字段名 | `total_score` |
| 数据类型 | Integer |
| 必填/可选 | **必填** |
| 输入方式 | 数字输入框，右侧标注满分值（根据省份高考模式动态显示：750/660等） |
| 默认值 | 无 |
| 校验规则 | ①数值范围：0 ≤ total_score ≤ provinceMaxScore；②必须为整数；③不可为空 |
| 异常处理 | ①超出满分值→提示"分数不可超过满分[X]分"并拒绝提交；②低于0→提示"分数不可为负数"；③非整数→自动取整并提示"分数已取整为[X]"；④明显异常值（如<200分或接近满分）→弹出确认卡片"请确认您的分数为[X]分，此分数较为特殊" |

**各省满分配置**：

| 模式 | 满分 | 适用省份 |
|------|------|----------|
| 传统文理 | 750 | 新疆、西藏 |
| 3+1+2 | 750 | 23省 |
| 3+3 | 660 | 上海（语数外各150+3门各70） |
| 3+3 | 750 | 浙江、北京、天津、山东、海南 |

**7.1.3.2 省位次（系统自动反查）**

| 属性 | 值 |
|------|-----|
| 字段名 | `province_rank` |
| 数据类型 | Integer |
| 必填/可选 | **必填，但由系统自动填充** |
| 输入方式 | 用户输入总分+选择省份后，系统自动反查一分一段表填入位次；展示为只读字段，附注"根据您的[X]分在[Y]省，您的位次为[Z]" |
| 默认值 | 系统计算值 |
| 校验规则 | ①位次必须为正整数；②位次不可超过该省当年考生总数 |
| 自动反查逻辑 | 见下方"位次自动反查算法" |
| 异常处理 | ①一分一段表中无该分数（分数断层）→取相邻分数的位次区间并标注"此分数区间存在断层"；②数据未入库→提示"该省[年份]一分一段表暂未入库，请手动输入位次"并开放手动输入框 |

**位次自动反查算法**：

```python
def lookup_province_rank(province_code, year, total_score):
    """
    根据总分+省份反查一分一段表获取位次
    返回：ProvinceRankResult(rank, rank_range, is_gap, gap_info)
    """
    rank_table = load_rank_table(province_code, year)
    
    # 精确匹配
    exact_match = rank_table.filter(total_score == total_score)
    if exact_match.exists():
        rank = exact_match.cumulative_count  # 累计人数即位次
        # 同分人数
        same_score_count = exact_match.score_count
        return ProvinceRankResult(
            rank=rank,
            rank_range=(rank - same_score_count + 1, rank),  # 同分位次区间
            is_gap=False,
            gap_info=None
        )
    
    # 分数断层处理
    nearest_lower = rank_table.filter(total_score < total_score).max("total_score")
    nearest_upper = rank_table.filter(total_score > total_score).min("total_score")
    
    lower_rank = rank_table.filter(total_score == nearest_lower).cumulative_count
    upper_rank = rank_table.filter(total_score == nearest_upper).cumulative_count
    
    return ProvinceRankResult(
        rank=None,  # 无法精确确定
        rank_range=(upper_rank + 1, lower_rank),  # 理论位次区间
        is_gap=True,
        gap_info=f"一分一段表中{nearest_upper}分至{nearest_lower}分之间存在断层，您的{total_score}分理论位次区间为{upper_rank+1}至{lower_rank}"
    )
```

**7.1.3.3 同分人数**

| 属性 | 值 |
|------|-----|
| 字段名 | `same_score_count` |
| 数据类型 | Integer |
| 必填/可选 | **系统自动计算** |
| 输入方式 | 只读展示，附注"同分共有[N]人，您在此分数段的位次区间为[X]-[Y]" |
| 默认值 | 系统计算值 |
| 校验规则 | 必须为正整数 |
| 异常处理 | 数据未入库时标注"暂无数据" |

**7.1.3.4 单科成绩（V2停车场，MVP不实现）**

| 属性 | 值 |
|------|-----|
| 字段名 | `subject_scores` |
| 数据类型 | Object |
| 必填/可选 | 可选（V2阶段） |
| 说明 | MVP阶段不采集单科成绩。列入V2停车场，用于更精准的专业匹配和选科验证 |

#### 7.1.4 特殊身份/加分项

| 字段名 | 数据类型 | 必填/可选 | 输入方式 | 校验规则 | 异常处理 |
|--------|----------|----------|----------|----------|----------|
| `special_plan` | Enum[] | 可选 | 多选复选框，选项：国家专项/地方专项/高校专项/强基计划/综合评价/保送生/艺术类/体育类/高水平艺术团/高水平运动队 | 每个选项需满足该省份是否开放该计划（如高校专项仅部分省份有） | 选择了省份不支持的计划→灰化该选项并提示"本省未实施该计划" |
| `bonus_points` | Integer | 可选 | 数字输入框，右侧标注"加分" | ①加分值范围0-20；②加分不可为负数；③加分类型需与特殊身份对应 | 加分值超过20→提示"加分通常不超过20分，请确认"；加分与特殊身份不匹配→提示"请先选择对应的加分资格类型" |
| `bonus_type` | Enum | 条件必填（当bonus_points>0时必填） | 下拉选择：少数民族/烈士子女/边疆/军人子女/其他 | 必须与bonus_points联动 | bonus_points>0但bonus_type为空→提示"请选择加分类型" |
| `ethnic_minority` | Boolean | 可选 | 开关按钮"是否少数民族考生" | 无特殊校验 | 开启后自动在bonus_type中推荐"少数民族"选项 |

**特殊身份对推荐的影响逻辑**：

```python
def adjust_for_special_plans(user_profile, recommendation_list):
    """
    根据特殊身份调整推荐列表
    """
    adjustments = []
    
    # 三大专项计划：仅在符合条件的院校专业中展示专项计划名额
    if "国家专项" in user_profile.special_plan:
        adjustments.append("筛选含国家专项计划的院校专业组，标注专项名额")
    if "地方专项" in user_profile.special_plan:
        adjustments.append("筛选含地方专项计划的院校专业组，标注专项名额")
    if "高校专项" in user_profile.special_plan:
        adjustments.append("筛选含高校专项计划的院校专业组，标注专项名额")
    
    # 强基计划：单独展示强基计划入口
    if "强基计划" in user_profile.special_plan:
        adjustments.append("在推荐页顶部展示强基计划专项推荐卡片")
    
    # 艺术体育类：切换至艺术体育专用推荐模式
    if "艺术类" in user_profile.special_plan or "体育类" in user_profile.special_plan:
        adjustments.append("切换推荐引擎为艺术体育类模式（文化课+专业课双线匹配）")
    
    # 加分处理：使用加分后总分重新计算位次
    if user_profile.bonus_points > 0:
        adjusted_score = user_profile.total_score + user_profile.bonus_points
        adjusted_rank = lookup_province_rank(user_profile.province, user_profile.year, adjusted_score)
        adjustments.append(f"加分后总分{adjusted_score}分，对应位次{adjusted_rank}")
        # 同时标注：哪些院校认可该加分，哪些不认可
    
    return adjustments
```

---

### 7.2 目标喜好与权重矩阵（意向唤醒）

#### 7.2.1 院校偏好

| 字段名 | 数据类型 | 必填/可选 | 输入方式 | 校验规则 | 异常处理 |
|--------|----------|----------|----------|----------|----------|
| `min_college_level` | Enum | 可选（默认"不限"） | 单选按钮组：985/211/双一流/公办一本/公办二本/民办/不限 | 必须为合法层级枚举值 | 用户分数达不到所选最低层级→提示"以您当前的分数，[X]层级院校录取概率较低，建议放宽至[Y]" |
| `college_type_pref` | Enum[] | 可选 | 多选标签：综合类/理工类/师范类/医药类/财经类/政法类/农林类/军事类/艺术类 | 无数量限制 | 无特殊异常 |
| `public_private_pref` | Enum | 可选（默认"公办优先"） | 单选：公办优先/民办可接受/仅公办/仅民办/不限 | 无特殊校验 | 选择"仅民办"→提示"民办院校学费普遍较高，请注意费用预算" |

#### 7.2.2 地域偏好

| 字段名 | 数据类型 | 必填/可选 | 输入方式 | 校验规则 | 异常处理 |
|--------|----------|----------|----------|----------|----------|
| `preferred_cities` | String[] | 可选 | 多选标签（预置热门城市：北京/上海/广州/深圳/南京/武汉/成都/杭州/西安/长沙/天津/重庆），支持自定义输入 | 最多选择5个城市 | 选择5个以上→提示"地域偏好最多5个，过多会缩小推荐范围" |
| `excluded_cities` | String[] | 可选 | 多选标签（预置常见排斥城市），支持自定义输入 | 最多选择5个城市；不可与preferred_cities重叠 | 与preferred重叠→自动移除重叠项并提示"该城市已在期望列表中，已为您移除冲突" |
| `economic_circle_pref` | Enum | 可选 | 单选：长三角/珠三角/京津冀/成渝/中部/东北/不限 | 无特殊校验 | 选择经济圈后自动补充该圈内主要城市到preferred_cities建议列表 |
| `distance_pref` | Enum | 可选 | 单选：就近优先/省内优先/全国不限/远距离亦可 | 无特殊校验 | 选择"就近优先"→自动推荐省内院校权重提升 |

#### 7.2.3 专业偏好

| 字段名 | 数据类型 | 必填/可选 | 输入方式 | 校验规则 | 异常处理 |
|--------|----------|----------|----------|----------|----------|
| `preferred_disciplines` | Enum[] | 可选 | 多选标签（教育部14个学科大类：哲学/经济学/法学/教育学/文学/历史学/理学/工学/农学/医学/管理学/艺术学/军事学/交叉学科），支持展开到具体专业 | 最多选择3个学科大类；展开专业最多10个 | 超过3个大类→提示"专业偏好过多会弱化权重效果，建议聚焦3个以内"；选择学科与选科不匹配→黄色预警"您的选科组合可报考[X]类专业的比例为[Y]%" |
| `preferred_majors` | String[] | 可选 | 搜索框+推荐列表（基于preferred_disciplines展开） | 最多选择5个具体专业；必须属于已选学科大类 | 超过5个→提示"具体专业最多5个，请精选" |
| `excluded_majors` | String[] | 可选（"绝对不读"黑名单） | 搜索框+快捷标签（常见排斥专业：数学类/物理类/化学类/临床医学/法学/会计/土木/机械…） | 最多选择10个；不可与preferred_majors重叠 | 与preferred重叠→自动移除并提示"该专业已在期望列表中"；黑名单专业在推荐中**完全排除**，不可被任何推荐呈现 |
| `career_orientation` | Enum | 可选 | 单选：就业优先/考研优先/出国优先/兴趣优先/不限 | 无特殊校验 | 选择"考研优先"→推荐中提升考研率高的专业权重；选择"就业优先"→提升就业率/薪资数据展示权重 |

#### 7.2.4 核心诉求权重调节（产品首创点）

**这是本产品与所有竞品的核心差异化——定量权重调节机制。**

| 字段名 | 数据类型 | 必填/可选 | 输入方式 | 校验规则 | 异常处理 |
|--------|----------|----------|----------|----------|----------|
| `weight_college` | Float | 条件必填（进入权重调节步骤时必填） | 拖拽滑块（0-100），三角形可视化图中"院校"顶点 | ①总和必须=100（与weight_region+weight_major联动）；②单项最低0，最高100 | 单项=100→提示"此权重下推荐将完全偏重[X]，其他因素几乎不影响结果，请确认"；三项均为0→不可能（总和=100约束） |
| `weight_region` | Float | 条件必填 | 拖拽滑块（0-100），三角形可视化图中"地域"顶点 | 同上 | 同上 |
| `weight_major` | Float | 条件必填 | 拖拽滑块（0-100），三角形可视化图中"专业"顶点 | 同上 | 同上 |

**权重约束规则**：
- `weight_college + weight_region + weight_major = 100`
- 当用户拖拽一个滑块时，另外两个滑块**按原有比例自动调整**以维持总和=100
- 例外：当另外两个滑块均为0时，拖拽滑块调整后，剩余值平均分配给另外两个

**权重调节交互方案（UI详细描述）**：

**主交互：三角形权重可视化图**

```
       院校 (weight_college)
          /\
         /  \
        / ●  \       ← 用户拖拽圆点●改变重心位置
       /      \
      /________\
  地域          专业
(weight_region) (weight_major)
```

- 三角形三个顶点分别标注"院校"、"地域"、"专业"
- 三角形内部有一个可拖拽的圆点●，代表当前权重重心
- 拖拽圆点向某个顶点靠近→该维度权重增大，其他两个按比例减小
- 三角形下方同时展示3个独立滑块，数值与三角形联动
- 滑块拖拽时三角形圆点同步移动，三角形拖拽时滑块数值同步更新

**实时推荐预览**：

- 权重调节区域下方展示"推荐预览卡片"：3个典型推荐院校专业组缩略卡片
- 每次权重变化时，预览卡片**实时更新**（延迟≤500ms）
- 预览卡片展示：院校名+专业组名+录取概率区间+匹配度标签
- 匹配度标签根据权重分布生成：
  - 院校权重>60% → 标签"院校优先型"
  - 专业权重>60% → 标签"专业优先型"
  - 地域权重>60% → 标签"地域优先型"
  - 无单项>60% → 标签"均衡型"

**零偏好模式（"不确定"路径）**：

- 权重调节步骤顶部有"我不确定，帮我选"按钮
- 点击后系统根据用户画像自动推荐权重：
  - 高分段（600+）→默认院校40%/专业30%/地域30%（院校优先）
  - 中分段（450-600）→默认专业40%/院校30%/地域30%（专业优先）
  - 低分段（350-450）→默认地域40%/院校30%/专业30%（就近务实）
  - 有career_orientation时：
    - 就业优先→专业权重+15%
    - 考研优先→院校权重+15%
    - 出国优先→院校权重+10%+地域权重+5%
- 自动填充后展示推荐预览，用户仍可手动微调

**权重进入推荐排序的算法**：详见§7.3.2

---

### 7.3 智能推荐引擎

#### 7.3.1 分流规则（省份投档规则适配）

**推荐引擎必须根据省份投档模式生成不同结构的推荐结果**：

| 投档模式 | 适用省份 | 推荐结果结构 | 说明 |
|----------|----------|------------|------|
| 院校专业组平行志愿 | 大多数3+1+2省份+部分3+3省份 | 推荐结果为"院校专业组"列表，每组内含多个专业 | 每个志愿单元=1个院校专业组 |
| 专业+院校平行志愿 | 浙江/山东/辽宁/重庆/贵州/青海 | 推荐结果为"专业+院校"列表，每个志愿=1个具体专业+1个具体院校 | 每个志愿单元=1条专业-院校对 |
| 传统院校平行志愿 | 新疆/西藏 | 推荐结果为"院校"列表，每个志愿=1个院校（入学后分专业） | 每个志愿单元=1个院校 |

**分流执行逻辑**：

```python
def get_recommendation_structure(province_code):
    filing_mode = province_config[province_code].filing_mode
    
    if filing_mode == "院校专业组平行":
        return {
            "unit_type": "college_subject_group",
            "fields_per_unit": ["college_name", "group_code", "group_name", "majors_in_group", "group_purity_score"],
            "max_volunteers": province_config[province_code].max_volunteers
        }
    elif filing_mode == "专业+院校平行":
        return {
            "unit_type": "major_college_pair",
            "fields_per_unit": ["major_name", "college_name", "college_level"],
            "max_volunteers": province_config[province_code].max_volunteers
        }
    elif filing_mode == "传统院校平行":
        return {
            "unit_type": "college",
            "fields_per_unit": ["college_name", "college_level", "available_majors_count"],
            "max_volunteers": province_config[province_code].max_volunteers
        }
```

#### 7.3.2 匹配逻辑（核心推荐算法）

**推荐引擎流程图**：

```
输入数据 ──→ Step1: 位次定位 ──→ Step2: 可报范围筛选 ──→ Step3: 录取概率计算 ──→ Step4: 权重加权排序 ──→ Step5: 4梯度分配 ──→ Step6: 分散度注入 ──→ 输出推荐结果
```

**Step1：位次定位**

```python
def step1_rank_positioning(user_profile):
    """
    确定用户的位次定位，为后续匹配提供基准
    """
    # 使用加分后总分（如有加分）
    effective_score = user_profile.total_score + user_profile.bonus_points
    effective_rank = lookup_province_rank(user_profile.province, user_profile.year, effective_score)
    
    # 位次区间（考虑同分人数）
    rank_range = (effective_rank - same_score_count + 1, effective_rank)
    
    return {
        "effective_score": effective_score,
        "effective_rank": effective_rank,
        "rank_range": rank_range,
        "same_score_count": same_score_count
    }
```

**Step2：可报范围筛选**

```python
def step2_filter_eligible(rank_position, user_profile):
    """
    筛选用户可报考的院校专业组范围
    多条件联合过滤
    """
    candidates = load_all_college_subject_groups(user_profile.province, user_profile.year)
    
    # 过滤条件1：选科匹配
    candidates = candidates.filter(
        subject_requirement_satisfied(user_profile.subject_combination, candidates.subject_requirements)
    )
    
    # 过滤条件2：黑名单排除
    candidates = candidates.filter(
        NOT (candidates.majors IN user_profile.excluded_majors)
    )
    
    # 过滤条件3：排斥地域排除
    candidates = candidates.filter(
        NOT (candidates.province_city IN user_profile.excluded_cities)
    )
    
    # 过滤条件4：最低院校层级
    if user_profile.min_college_level != "不限":
        candidates = candidates.filter(
            candidates.college_level >= user_profile.min_college_level
        )
    
    # 过滤条件5：公办/民办偏好
    if user_profile.public_private_pref == "仅公办":
        candidates = candidates.filter(candidates.is_public == True)
    elif user_profile.public_private_pref == "仅民办":
        candidates = candidates.filter(candidates.is_public == False)
    
    return candidates
```

**Step3：录取概率计算（核心算法）**

```python
def step3_calculate_admission_probability(candidates, rank_position, user_profile):
    """
    为每个候选计算录取概率区间
    核心方法：位次直查法 + 线差法校验
    """
    results = []
    
    for candidate in candidates:
        # === 位次直查法（主方法） ===
        # 获取该院校专业组近3-5年在本省的录取位次数据
        historical_ranks = load_admission_rank_history(
            candidate.college_code, candidate.group_code, 
            user_profile.province, years=[2023, 2024, 2025]
        )
        
        # 3年加权位次均值（近2年权重更高）
        # 权重配置：2025年(0.4) + 2024年(0.35) + 2023年(0.25)
        weighted_avg_rank = (
            historical_ranks[2025].min_rank * 0.4 +
            historical_ranks[2024].min_rank * 0.35 +
            historical_ranks[2023].min_rank * 0.25
        )
        
        # 考虑招生计划变动
        plan_change_ratio = get_plan_change_ratio(
            candidate.college_code, candidate.group_code, 
            user_profile.province, 2025 vs 2024
        )
        adjusted_avg_rank = weighted_avg_rank * (1 + plan_change_ratio)
        
        # 位次偏差计算
        rank_diff = rank_position.effective_rank - adjusted_avg_rank
        
        # === 线差法校验（辅助方法） ===
        historical_scores = load_admission_score_history(
            candidate.college_code, candidate.group_code,
            user_profile.province, years=[2023, 2024, 2025]
        )
        weighted_avg_score = (
            historical_scores[2025].min_score * 0.4 +
            historical_scores[2024].min_score * 0.35 +
            historical_scores[2023].min_score * 0.25
        )
        score_diff = rank_position.effective_score - weighted_avg_score
        
        # === 综合概率区间计算 ===
        # 位次法概率
        if rank_diff > 2000:       rank_prob = 0.90
        elif rank_diff > 1000:     rank_prob = 0.80
        elif rank_diff > 500:      rank_prob = 0.65
        elif rank_diff > 200:      rank_prob = 0.50
        elif rank_diff > 0:        rank_prob = 0.40
        elif rank_diff > -200:     rank_prob = 0.30
        elif rank_diff > -500:     rank_prob = 0.20
        elif rank_diff > -1000:    rank_prob = 0.10
        elif rank_diff > -2000:    rank_prob = 0.05
        else:                      rank_prob = 0.02
        
        # 线差法校验修正
        if abs(score_diff) <= 10:  score_correction = 0   # 在容忍度内，无需修正
        elif score_diff > 10:      score_correction = 0.05 # 分数更高，略微上调
        elif score_diff < -10:     score_correction = -0.05 # 分数更低，略微下调
        
        final_prob = rank_prob + score_correction
        
        # 概率区间（±10%波动范围）
        prob_lower = max(0.01, final_prob - 0.10)
        prob_upper = min(0.99, final_prob + 0.10)
        
        results.append({
            "candidate": candidate,
            "prob_range": (prob_lower, prob_upper),
            "rank_diff": rank_diff,
            "score_diff": score_diff,
            "weighted_avg_rank": adjusted_avg_rank,
            "weighted_avg_score": weighted_avg_score,
            "historical_data": historical_ranks
        })
    
    return results
```

**Step4：权重加权排序**

```python
def step4_weight_sorting(probability_results, user_profile):
    """
    将用户意向权重融入推荐排序
    权重影响排序分数，而非录取概率
    """
    W_college = user_profile.weight_college / 100  # 0-1
    W_region = user_profile.weight_region / 100
    W_major = user_profile.weight_major / 100
    
    sorted_results = []
    
    for result in probability_results:
        candidate = result["candidate"]
        prob_avg = (result["prob_range"][0] + result["prob_range"][1]) / 2
        
        # 院校匹配度（0-1）
        college_match = calculate_college_match(candidate, user_profile)
        # 地域匹配度（0-1）
        region_match = calculate_region_match(candidate, user_profile)
        # 专业匹配度（0-1）
        major_match = calculate_major_match(candidate, user_profile)
        
        # 综合排序分数 = 录取概率基础分 + 权重加权匹配度
        sort_score = (
            prob_avg * 0.4 +  # 录取概率占40%基础分
            college_match * W_college * 0.3 +
            region_match * W_region * 0.3 +
            major_match * W_major * 0.3
        )
        # 注：权重加权匹配度总和占60%，但三项权重总和=1，所以实际0.3*1=0.3
        
        result["sort_score"] = sort_score
        result["college_match"] = college_match
        result["region_match"] = region_match
        result["major_match"] = major_match
        sorted_results.append(result)
    
    # 按sort_score降序排列
    sorted_results.sort(key=lambda x: x["sort_score"], reverse=True)
    return sorted_results
```

**匹配度计算子函数**：

```python
def calculate_college_match(candidate, user_profile):
    """院校匹配度"""
    score = 0.5  # 基础分
    if candidate.college_level in user_profile.min_college_level and above:
        score += 0.3
    if candidate.is_985: score += 0.1
    if candidate.is_211: score += 0.05
    if candidate.is_double_first_class: score += 0.05
    return min(1.0, score)

def calculate_region_match(candidate, user_profile):
    """地域匹配度"""
    score = 0.3  # 基础分（不排斥即基础匹配）
    if candidate.city in user_profile.preferred_cities:
        score += 0.4
    if candidate.economic_circle == user_profile.economic_circle_pref:
        score += 0.2
    if user_profile.distance_pref == "就近优先" and candidate.province == user_profile.province:
        score += 0.1
    return min(1.0, score)

def calculate_major_match(candidate, user_profile):
    """专业匹配度"""
    score = 0.3  # 基础分
    # 学科大类匹配
    overlap_disciplines = set(candidate.discipline_categories) & set(user_profile.preferred_disciplines)
    score += len(overlap_disciplines) * 0.15
    # 具体专业匹配
    overlap_majors = set(candidate.majors) & set(user_profile.preferred_majors)
    score += len(overlap_majors) * 0.1
    # 就业/考研导向加分
    if user_profile.career_orientation == "就业优先":
        score += candidate.employment_rate * 0.1
    elif user_profile.career_orientation == "考研优先":
        score += candidate.postgrad_rate * 0.1
    return min(1.0, score)
```

**Step5：4梯度分配（冲稳保垫）**

```python
def step5_gradient_allocation(sorted_results, province_config):
    """
    将排序结果分配到4个梯度
    梯度定义基于录取概率区间
    """
    max_volunteers = province_config.max_volunteers
    
    # 梯度配额（基于志愿总数的比例分配）
    # 冲：15-20% | 稳：35-40% | 保：30-35% | 垫：10-15%
    rush_count = int(max_volunteers * 0.18)
    stable_count = int(max_volunteers * 0.38)
    safe_count = int(max_volunteers * 0.32)
    pad_count = max_volunteers - rush_count - stable_count - safe_count
    
    gradients = {
        "冲": [],   # 录取概率 5%-35%（低概率但有希望）
        "稳": [],   # 录取概率 35%-65%（中等概率，最可能录取）
        "保": [],   # 录取概率 65%-85%（高概率，基本可录取）
        "垫": [],   # 录取概率 85%+（极大概率，兜底）
    }
    
    for result in sorted_results:
        prob_avg = (result["prob_range"][0] + result["prob_range"][1]) / 2
        
        if prob_avg < 0.35:
            if len(gradients["冲"]) < rush_count:
                gradients["冲"].append(result)
        elif prob_avg < 0.65:
            if len(gradients["稳"]) < stable_count:
                gradients["稳"].append(result)
        elif prob_avg < 0.85:
            if len(gradients["保"]) < safe_count:
                gradients["保"].append(result)
        else:
            if len(gradients["垫"]) < pad_count:
                gradients["垫"].append(result)
    
    return gradients
```

**Step6：分散度注入（防趋同风险）**

```python
def step6_diversity_injection(gradients, sorted_results):
    """
    在推荐结果中注入分散度，防止算法趋同导致的系统性风险
    1. 在每个梯度中插入≥1个冷门优质替代
    2. 计算整体分散度评分
    """
    for gradient_name, items in gradients.items():
        # 找到冷门优质替代：录取概率合适但排序分数较低（说明不是"大众选择"）
        cold_alternatives = find_cold_quality_alternatives(
            sorted_results, gradient_name, excluded=items
        )
        
        # 每个梯度插入1-2个冷门替代
        for alt in cold_alternatives[:2]:
            alt["is_cold_alternative"] = True
            alt["cold_reason"] = generate_cold_reason(alt)  # "此院校专业组录取概率与主流选择相当，但报考热度较低，竞争压力更小"
            items.append(alt)
        
        # 分散度评分计算
        # 基于推荐结果的院校地域分布、专业分布、层级分布的熵值
        diversity_score = calculate_diversity_score(items)
        gradients[gradient_name + "_diversity"] = diversity_score
    
    return gradients
```

#### 7.3.3 专业组纯净度指标

```python
def calculate_group_purity_score(college_subject_group):
    """
    专业组纯净度评分（0-100）
    来源：优志愿独创指标，我们借鉴并优化
    
    纯净度 = 专业组内专业与用户偏好专业的一致程度
    
    高纯净度（80-100）：组内大部分专业都是用户想读的
    中纯净度（50-79）：组内约一半专业是用户想读的
    低纯净度（0-49）：组内大部分专业用户不想读，存在被调剂到不想读专业的风险
    """
    majors_in_group = college_subject_group.majors
    preferred = user_profile.preferred_majors + user_profile.preferred_disciplines_expanded
    excluded = user_profile.excluded_majors
    
    preferred_count = len(set(majors_in_group) & set(preferred))
    excluded_count = len(set(majors_in_group) & set(excluded))
    total_count = len(majors_in_group)
    
    if total_count == 0: return 0
    
    # 基础纯净度 = 喜欢的专业占比
    base_purity = preferred_count / total_count * 70
    # 排斥惩罚 = 排斥的专业占比 * 扣分
    exclusion_penalty = excluded_count / total_count * 30
    
    purity_score = max(0, min(100, base_purity + (30 - exclusion_penalty)))
    
    return round(purity_score)
```

#### 7.3.4 异常与边界处理

**7.3.4.1 压线分降级提示策略**

| 场景 | 识别条件 | 降级策略 | UI展示 |
|------|----------|----------|--------|
| 本一线压线 | 总分在本一线±10分范围内 | ①标注"压线风险"；②推荐中增加"一本踩线院校"专项列表；③同时展示"优质二本院校"备选 | 黄色预警卡片"您处于一本线边缘，建议同时准备一本踩线和优质二本方案" |
| 本二线压线 | 总分在本二线±10分范围内 | 同上逻辑，一本→二本踩线+优质专科 | 黄色预警卡片 |
| 专科线压线 | 总分在专科线±10分范围内 | 标注风险+展示保底专科方案 | 黄色预警卡片 |
| 零线以上（无对应批次线） | 总分低于所有批次线 | 标注"当前分数低于所有批次线，请确认是否有加分或特殊计划" | 红色预警卡片 |

**压线分识别算法**：

```python
def detect_edge_score(user_profile, province_batch_lines):
    """
    检测压线分场景
    province_batch_lines: { "一本线": 530, "二本线": 430, "专科线": 180 }
    """
    effective_score = user_profile.total_score + user_profile.bonus_points
    edge_warnings = []
    
    for line_name, line_score in province_batch_lines.items():
        if abs(effective_score - line_score) <= 10:
            edge_warnings.append({
                "type": "edge_score",
                "line_name": line_name,
                "line_score": line_score,
                "user_score": effective_score,
                "distance": effective_score - line_score,
                "severity": "warning" if effective_score >= line_score else "danger",
                "message": f"您处于{line_name}边缘（差{abs(effective_score - line_score)}分），建议同时准备上下两批次方案"
            })
    
    # 低于所有线
    if effective_score < min(province_batch_lines.values()):
        edge_warnings.append({
            "type": "below_all_lines",
            "severity": "critical",
            "message": "当前分数低于所有批次线，请确认是否有加分或特殊计划资格"
        })
    
    return edge_warnings
```

**7.3.4.2 无法匹配降级方案**

```python
def handle_no_match_scenario(user_profile, candidates):
    """
    当用户的所有意向筛选后无候选结果时的降级方案
    逐级放松筛选条件
    """
    if len(candidates) == 0:
        # 降级Level1：去掉排斥地域约束
        candidates_l1 = step2_filter_eligible(rank_position, user_profile, relax=["excluded_cities"])
        if len(candidates_l1) > 0:
            return candidates_l1, "已为您放宽地域约束，展示更多地区院校"
        
        # 降级Level2：去掉院校层级约束
        candidates_l2 = step2_filter_eligible(rank_position, user_profile, relax=["min_college_level", "excluded_cities"])
        if len(candidates_l2) > 0:
            return candidates_l2, "已为您放宽院校层级和地域约束"
        
        # 降级Level3：仅保留选科+黑名单约束（最核心的硬约束）
        candidates_l3 = step2_filter_eligible(rank_position, user_profile, relax=["min_college_level", "excluded_cities", "preferred_cities", "public_private_pref"])
        if len(candidates_l3) > 0:
            return candidates_l3, "已为您保留最基本的选科匹配和黑名单排除，展示所有可能选项"
        
        # 降级Level4：仅保留选科约束（极端情况）
        candidates_l4 = step2_filter_eligible(rank_position, user_profile, relax=["all_soft_filters"])
        if len(candidates_l4) > 0:
            return candidates_l4, "已为您展示所有选科可报的院校专业组"
        
        # 终极：完全无结果（分数过低+选科限制严格）
        return [], "当前分数和选科组合下暂无匹配结果，建议咨询专业顾问"
```

**7.3.4.3 新增专业（无历史分数）推荐逻辑**

| 场景 | 处理策略 | UI标记 |
|------|----------|--------|
| 2025年新增专业（首次招生） | ①标记"首次招生"；②参考同院系相近专业的历史录取数据估算概率；③概率区间放宽±15%（而非±10%）；④附加风险提示 | 🆕标签"首次招生，无历史录取数据，概率为估算值，风险较高" |
| 近2年内新增专业（仅有1年数据） | ①仅有1年数据时权重100%集中在该年；②概率区间放宽±15%；③标注数据年份 | 🆕标签"仅1年录取数据" |
| 撤销专业 | 完全排除，不出现在推荐列表 | 不展示 |

**新增专业概率估算算法**：

```python
def estimate_new_major_probability(candidate, user_profile, rank_position):
    """
    新增专业无历史数据时的概率估算
    参考同院系相近专业
    """
    # 找到同院系相近专业
    sibling_majors = find_sibling_majors(
        candidate.college_code, candidate.group_code,
        candidate.major_category
    )
    
    if sibling_majors:
        # 使用相近专业的历史位次估算
        sibling_ranks = [load_admission_rank_history(m, user_profile.province) for m in sibling_majors]
        estimated_rank = weighted_average(sibling_ranks)
        
        # 概率计算（同Step3逻辑，但区间放宽）
        rank_diff = rank_position.effective_rank - estimated_rank
        prob = calculate_base_probability(rank_diff)
        prob_range = (max(0.01, prob - 0.15), min(0.99, prob + 0.15))  # ±15%
    else:
        # 无相近专业参考→使用院校整体录取位次
        college_avg_rank = load_college_average_rank(candidate.college_code, user_profile.province)
        rank_diff = rank_position.effective_rank - college_avg_rank
        prob = calculate_base_probability(rank_diff)
        prob_range = (max(0.01, prob - 0.20), min(0.99, prob + 0.20))  # ±20%
    
    return {
        "prob_range": prob_range,
        "is_estimated": True,
        "estimation_method": sibling_majors ? "相近专业参考" : "院校整体位次参考",
        "risk_level": "high"
    }
```

**7.3.4.4 分数断层处理策略**

```python
def handle_score_gap(rank_table, user_score):
    """
    一分一段表分数断层的处理
    断层定义：相邻分数之间累计人数跳跃>50人（表示中间有大量同分或数据缺失）
    """
    # 检测断层
    gaps = detect_gaps_in_rank_table(rank_table)
    
    for gap in gaps:
        if user_score in gap.score_range:
            # 用户分数处于断层区间
            return {
                "is_in_gap": True,
                "gap_range": gap,
                "rank_estimate": gap.lower_rank,  # 使用保守估计（较低的位次=更保守）
                "confidence": "low",
                "message": f"一分一段表在{gap.score_range}分区间存在数据断层，位次采用保守估计{gap.lower_rank}，实际位次可能更低",
                "prob_range_expansion": 0.15  # 概率区间额外放宽15%
            }
    
    return { "is_in_gap": False }
```

**7.3.4.5 选科不匹配专业预警机制**

```python
def check_subject_mismatch(user_profile, recommendation_result):
    """
    在推荐结果生成后，对每个推荐项检查选科是否满足专业要求
    不满足的项不进入推荐列表，但在"全部可报专业"浏览页中标注预警
    """
    for item in recommendation_result:
        subject_req = item.candidate.subject_requirements
        
        if not satisfies_subject_requirement(user_profile.subject_combination, subject_req):
            item["subject_mismatch"] = True
            item["mismatch_detail"] = f"该专业要求{subject_req.description}，您的选科组合[{user_profile.subject_combination}]不满足"
            item["mismatch_severity"] = "hard_block" if subject_req.type in ["必选1科", "必选2科", "必选3科"] else "soft_warning"
            
            # hard_block: 完全不可报考，从推荐中移除
            if item["mismatch_severity"] == "hard_block":
                item["removed_from_recommendation"] = True
                item["visible_in_full_list"] = True  # 在完整列表中仍可见，但标注红色预警
            # soft_warning: 降低排序分数但不移除
            else:
                item["sort_score"] *= 0.5  # 大幅降低排序分
                item["warning_label"] = "⚠️ 选科部分不匹配，录取可能受限"
```

#### 7.3.5 志愿风险诊断

**功能描述**：用户完成志愿方案选择后，提供风险诊断报告。

| 诊断项 | 检查逻辑 | 风险等级 | UI展示 |
|--------|----------|----------|--------|
| 梯度合理性 | 检查4梯度数量是否均衡（冲≤20%、稳≥35%、保≥30%、垫≥10%） | 高/中/低 | 梯度分布柱状图+风险标签 |
| 撞车检测 | 检查方案中是否有多个用户选择了同一院校专业组（基于当年报考热度预估） | 高/中/无 | "⚠️ 此院校专业组今年报考热度较高，撞车风险中等" |
| 必填志愿数 | 检查是否填满所有志愿位 | 高（未填满）/无 | "请填满所有志愿位以最大化录取机会" |
| 重复院校 | 检查同一院校是否出现过多专业组 | 中 | "同一院校出现[N]个专业组，建议分散选择" |
| 选科风险复核 | 再次检查所有已选志愿的选科要求 | 高/无 | 红色标注不匹配项 |
| 专业组纯净度均值 | 所有已选专业组纯净度均值 | 低（均值<50）/中/高 | "已选专业组纯净度均值[X]，被调剂到不想读专业的风险为[Y]" |

---

### 7.4 用户体验与动线设计

#### 7.4.1 Wizard分步式交互流程

**总体流程：5步渐进采集 → 推荐结果 → 志愿方案 → 风险诊断**

```
Step1: 省份+选科 (必填，~30秒)
  ↓ 自动适配高考模式
Step2: 总分输入 (必填，~15秒)
  ↓ 自动反查位次
Step3: 数据确认卡片 (必填确认，~10秒)
  ↓ 
Step4: 意向偏好 (可选/渐进，~2-3分钟)
  ↓ 
Step5: 权重调节 (必填/零偏好模式，~1分钟)
  ↓
推荐结果页 (4梯度展示)
  ↓
志愿方案编辑 (拖拽排序/增删)
  ↓
风险诊断报告
```

**每步详细设计**：

**Step1：省份+选科**
- **包含字段**：province（省份）、subject_combination（选科组合）
- **为什么分这步**：省份决定一切后续逻辑（高考模式/投档规则/志愿数量/一分一段表），选科决定可报专业范围，必须最先确定
- **自动补全**：选择省份后→自动渲染对应的选科UI（传统/3+3/3+1+2）、自动展示该省高考模式说明卡片
- **UI布局**：上方省份下拉（Top10省置顶★标记），下方选科选择器（根据模式动态渲染）
- **步骤跳转规则**：省份+选科均填写且校验通过→可进入Step2；可返回修改省份（修改省份将重置选科和后续所有数据）
- **耗时目标**：≤30秒

**Step2：总分输入**
- **包含字段**：total_score（总分）、province_rank（位次，自动填入）、same_score_count（同分人数，自动填入）
- **为什么分这步**：总分是推荐引擎的核心输入，位次由系统自动补全减少用户操作
- **自动补全**：输入总分后→系统自动反查一分一段表→自动填入位次和同分人数→右侧展示位次说明"根据您的[X]分在[Y]省，您的位次约为[Z]，同分[N]人"
- **UI布局**：居中大数字输入框（右侧标注满分值），下方自动填入的位次信息（只读灰色文字）
- **步骤跳转规则**：总分填写且校验通过→可进入Step3；位次自动填入失败（数据未入库）→开放手动位次输入框
- **耗时目标**：≤15秒

**Step3：数据确认卡片**
- **包含字段**：无新字段，展示已输入数据的确认摘要
- **为什么分这步**：数据确认是信任建设的关键环节（瑞思洞察#2），防止用户输错分数导致整个推荐偏移
- **自动补全**：无，纯展示确认
- **UI布局**：
  ```
  ┌──────────────────────────────────┐
  │  📋 请确认您的信息                │
  │                                  │
  │  省份：广东省    模式：3+1+2       │
  │  选科：物理+化学+生物             │
  │  总分：585分                      │
  │  位次：约 28,500名               │
  │  同分人数：156人                  │
  │  位次区间：28,345 - 28,500        │
  │                                  │
  │  [✓ 信息无误，继续] [← 有误，返回修改] │
  └──────────────────────────────────┘
  ```
- **步骤跳转规则**：确认→进入Step4；返回修改→回到Step1或Step2
- **特殊处理**：位次为断层区间→卡片中标注"位次为估算区间"；压线分→卡片中附加黄色预警
- **耗时目标**：≤10秒

**Step4：意向偏好（渐进式，可跳过部分）**
- **包含字段**：min_college_level、college_type_pref、public_private_pref、preferred_cities、excluded_cities、economic_circle_pref、distance_pref、preferred_disciplines、preferred_majors、excluded_majors、career_orientation、special_plan、bonus_points、bonus_type
- **为什么分这步**：意向偏好影响推荐排序权重，但非核心必须——允许跳过或部分填写
- **自动补全**：
  - 选择preferred_disciplines后→自动展开该大类下的热门专业供选择
  - 选择economic_circle_pref后→自动推荐该圈内城市到preferred_cities
  - career_orientation选择后→智能推荐默认权重倾向
- **UI布局**：3个子板块横向Tab切换
  - Tab1"院校&地域"：院校层级+类型+公办民办+城市偏好+经济圈
  - Tab2"专业&方向"：学科大类+具体专业+黑名单+就业/考研导向
  - Tab3"特殊身份"：专项计划+加分项
- **步骤跳转规则**：可跳过任意子板块→进入Step5；可部分填写后继续；所有字段均有"不确定/帮我选"选项
- **"不确定"路径**：每个子板块顶部有"跳过此步，让系统帮我选"按钮→点击后该板块所有字段设为"不限"或智能默认值
- **耗时目标**：≤3分钟（完全填写）/ ≤30秒（全部跳过）

**Step5：权重调节**
- **包含字段**：weight_college、weight_region、weight_major
- **为什么分这步**：权重调节是本产品核心差异化，必须在推荐前完成；但提供零偏好模式降低门槛
- **自动补全**：
  - 从Step4的career_orientation自动推断默认权重倾向
  - 零偏好模式→根据分数段自动推荐默认权重
- **UI布局**：
  - 上方三角形权重可视化图（可拖拽圆点）
  - 中间3个独立滑块（数值联动三角形）
  - 下方推荐预览卡片（3个典型推荐，实时更新）
  - 左上角"我不确定，帮我选"按钮→零偏好模式
- **步骤跳转规则**：权重确认→进入推荐结果页；零偏好模式→自动填入默认权重后进入推荐结果页
- **耗时目标**：≤1分钟（零偏好）/ ≤2分钟（手动调节）

**步骤间全局跳转规则**：
- 用户可通过顶部进度条**自由跳转**到任意已完成步骤进行修改
- 修改Step1（省份）→重置Step2-5所有数据
- 修改Step2（总分）→重新计算位次，重置推荐结果
- 修改Step4-5→重新生成推荐结果
- 每步修改后自动重新计算后续依赖数据

#### 7.4.2 渐进式信息采集策略

**核心理念**：3项起步（省份+选科+总分）→ 即可生成基础推荐 → 渐进补充意向 → 推荐精度逐步提升

**实现机制**：

| 采集阶段 | 已有数据 | 可生成的推荐 | 推荐精度 |
|----------|----------|------------|----------|
| 最小输入（Step1-3完成） | 省份+选科+总分+位次 | 基础位次匹配推荐（仅按录取概率排序） | 低（不考虑意向偏好） |
| 补充意向（Step4部分完成） | +部分偏好 | 带偏好加权的推荐 | 中 |
| 完整输入（Step4-5完成） | +完整偏好+权重 | 完整加权+4梯度推荐 | 高 |

**推荐结果页的渐进展示**：
- 未完成Step4时→推荐结果页顶部提示"补充您的偏好可获得更精准推荐"，并展示"一键补充偏好"按钮
- 完成Step4后→提示"调节权重可获得更个性化推荐"
- 完成Step5后→展示完整4梯度推荐结果

#### 7.4.3 对话式辅入口（P1，MVP第二优先级实现）

**功能描述**：除Wizard主入口外，提供AI对话式信息采集辅入口。

**对话流程设计**：

```
AI: "你好！我是高考志愿智能助手。告诉我你的情况，我来帮你推荐最合适的方案。"
AI: "你是哪个省份的考生？"
User: "广东"
AI: "广东是3+1+2新高考模式。你的首选科目是物理还是历史？"
User: "物理"
AI: "再选科目选了哪两门？"
User: "化学和生物"
AI: "好的，你选了物理+化学+生物，这是个很热门的理工科组合，可报考专业范围很广！你的高考总分是多少？"
User: "585"
AI: [自动反查位次] "585分在广东省大约排在28,500名左右。接下来我想了解你的偏好——你更看重院校名气、专业前景，还是想留在特定城市？"
User: "我想读计算机相关专业，最好在广州"
AI: [自动填入偏好+推荐权重] "明白了！专业优先+留在广州。我为你生成了一套方案，冲稳保垫都有——来看看？"
→ 跳转至推荐结果页（数据模型与Wizard完全共享）
```

**数据模型共享规则**：
- 对话式入口采集的所有数据写入同一`user_profile`数据模型
- 用户可随时从对话式跳转到Wizard查看/修改已采集数据
- Wizard中已填入的数据在对话式入口中自动跳过对应问题
- 两种入口生成的推荐结果完全一致（同一推荐引擎）

#### 7.4.4 数据确认卡片详细设计

**触发时机**：Step3（总分+位次确认）

**卡片内容字段**：

| 字段 | 来源 | 展示方式 |
|------|------|----------|
| 省份 | Step1 | 文字"广东省" |
| 高考模式 | 自动适配 | 标签"3+1+2模式" |
| 选科组合 | Step1 | 文字"物理+化学+生物" |
| 总分 | Step2 | 大字体"585分" |
| 满分参考 | 自动适配 | 小字"满分750分" |
| 位次 | 自动反查 | 文字"约28,500名" |
| 同分人数 | 自动反查 | 小字"同分156人" |
| 位次区间 | 自动计算 | 小字"位次区间28,345-28,500" |
| 批次线参考 | 自动加载 | 标注"一本线530分 ↑55分" |
| 压线预警 | 自动检测 | 黄色标签（如适用） |

**交互**：
- "信息无误，继续" → 进入Step4
- "有误，返回修改" → 返回对应步骤

#### 7.4.5 权重调节可视化交互详细设计

**组件1：三角形权重图**

- Canvas/SVG绘制的等边三角形
- 三个顶点标注文字：左下"地域"、右下"专业"、上方"院校"
- 内部一个可拖拽圆点●（半径12px，蓝色）
- 拖拽圆点时：
  - 圆点距某顶点越近→该维度权重越大
  - 圆点位置通过三角形重心坐标映射为3个权重值
  - 三角形顶点旁实时显示权重百分比数字
- 三角形底色根据重心位置渐变（院校偏蓝/地域偏绿/专业偏橙）

**组件2：3个独立滑块**

- 每个维度1个水平滑块（0-100范围）
- 滑块左侧标注维度名，右侧显示当前数值
- 拖拽任一滑块→三角形圆点同步移动
- **联动约束**：拖拽A滑块时，B和C滑块按原有B:C比例自动调整，使A+B+C=100
  - 例：当前院校40/地域30/专业30，拖拽院校到60→地域和专业按1:1比例分摊剩余40→地域20/专业20
  - 特殊：当B和C均为0时，拖拽A→剩余值平均分配给B和C

**组件3：推荐预览卡片**

- 3张缩略卡片横向排列
- 每张卡片内容：院校logo+院校名+专业组名+录取概率区间+匹配度标签
- 权重变化时≤500ms内实时更新预览卡片
- 点击卡片可展开查看详细信息

**组件4：零偏好模式按钮**

- 位于权重调节区左上角
- 按钮"我不确定，帮我选"
- 点击后→系统自动填入智能默认权重→三角形和滑块同步更新→预览卡片同步更新
- 用户仍可在此基础上手动微调

---

## 8. Non-goals（明确不做什么）

| # | 不做什么 | 原因 | 归属 |
|---|----------|------|------|
| NG-1 | 不做备考内容/题库/学习工具 | 非志愿填报核心赛道，与高考直通车等竞品差异化不足 | V2停车场 |
| NG-2 | 不做社交功能/学长学姐问答 | MVP阶段复杂度过高，且内容质量难控 | V2停车场 |
| NG-3 | 不做实时志愿填报模拟系统 | 需对接省级招考院系统，MVP阶段不可能实现 | V2停车场 |
| NG-4 | 不做线下1对1顾问服务 | 运营成本过高，MVP聚焦线上自助 | 不考虑 |
| NG-5 | 不做单科成绩采集 | MVP阶段精度要求足够，单科匹配收益有限 | V2停车场（R-28） |
| NG-6 | 不做多志愿表管理 | 复杂度适中但非MVP核心，夸克有此功能 | V2停车场（R-26） |
| NG-7 | 不做完整的职业发展数据链路 | 数据获取成本高，MVP仅展示就业率摘要 | V2停车场（R-27） |
| NG-8 | 不做艺术体育类专用推荐引擎 | 用户量小、算法差异大，MVP仅提供基础入口 | V2停车场 |
| NG-9 | 不做全31省完整本地化 | MVP覆盖Top10省，其余省提供基础功能 | V2扩展 |
| NG-10 | 不做海外院校/留学推荐 | 超出高考志愿填报范围 | 不考虑 |

---

## 9. 时间线 & 里程碑（来自路径）

### 9.1 核心开发阶段（10周，2026.7.14 — 2026.9.22）

| 里程碑 | 起止日期 | 周数 | 核心交付物 | 验收标准 | 负责人 | 前置依赖 | 风险等级 |
|--------|----------|------|-----------|---------|--------|---------|---------|
| **M1-数据基础** | 7.14-7.27 | W1-W2 | 31省一分一段表入库+院校专业组数据+选科要求数据+批次线数据+数据API | 数据完整率≥95%；位次反查API≤200ms；出分日24h入库流程可演示 | 数据工程(主)+后端1(辅) | 无（但Q-1数据采购决策必须M1前完成） | 🔴高 |
| **M2-采集引擎** | 7.28-8.17 | W3-W5 | Wizard Step1-5完整交互+选科拦截+位次反查+数据确认卡片+省份适配 | Top10省Step1-3全流程可走通；非法组合100%拦截；位次反查成功率≥95% | 前端1+2(主)+后端1(辅) | M1 | 🟡中 |
| **M3-推荐引擎** | 8.04-8.31 | W4-W7 | 位次直查法+线差法校验+权重加权排序+4梯度分配+异常处理+概率区间 | 位次匹配精度≤±5%；概率区间±10%；4梯度配比达标；异常场景各有降级方案 | 后端1+2(主) | M1+M2 | 🔴高 |
| **M4-推荐展示** | 8.18-9.07 | W6-W8 | 推荐结果页+数据溯源+纯净度+分散度+权重调节交互+风险诊断 | 每个推荐展示5项溯源数据；权重调节≤500ms预览更新；风险诊断6项检查 | 前端1+2(主)+后端2(辅) | M3 | 🟡中 |
| **M5-对话式入口** | 9.01-9.14 | W8-W9.5 | AI对话式信息采集+NLP解析+数据模型共享 | 对话流程可完成完整采集；数据与Wizard共享；跳转推荐结果正常 | 后端1(主)+前端1(辅) | M2+M3 | 🟢低（P1可降级） |
| **M6-联调测试** | 9.15-9.22 | W9.5-W10 | 全流程联调+Top10省本地化测试+异常场景全覆盖+性能压测 | Top10省全流程零阻断；15项P0验收通过；异常覆盖率100%；并发100响应≤3s | 全员 | M1-M5 | 🟡中 |

> **并行压缩说明**：M3在W4即与M2并行启动（算法用Mock数据先行开发），M4在W6与M3尾部并行，总周期从串行12.5周压缩至10周。

### 9.2 长周期测试与运营准备（2026.10 — 2027.5）

| 阶段 | 月份 | 核心工作 |
|------|------|---------|
| T1-深度测试 | 2026.10-12 | Top10省逐省走查+边缘分数专项+选科×专业交叉验证+多机型适配 |
| T2-数据验证 | 2027.1-3 | 2026真实数据入库验证+招生计划更新+覆盖率达标确认+出分日入库演练（3次） |
| T3-软启动 | 2027.4-5 | ≥200用户邀请测试+核心指标基线采集+付费试运行+出分日压力测试 |

### 9.3 出分日里程碑（2027.6）

| 里程碑 | 日期 | 核心工作 | 验收标准 |
|--------|------|---------|---------|
| M7-出分日就绪 | 2027.6.20 | 系统最终检查+入库SOP演练+客服培训+应急预案 | 健康检查全绿；入库演练≤24h |
| M8-出分日上线 | 2027.6.23-25 | 各省一分一段表实时入库+系统监控+容量保障 | Top10省入库≤24h；零宕机；响应≤3s |

### 9.4 关键依赖关系

```
M1 ──→ M2 ──┬──→ M3 ──→ M4
             │         └─→ M5
             └──────────→ M6

阻塞级外部依赖：Q-1(数据采购)→M1, Q-4(Top10排序)→M1+M2
非阻塞外部依赖：Q-3(AI模型)→M5(可降级), Q-2/Q-5/Q-6-8→开发中迭代
```

### 9.5 人力配置矩阵

| 角色 | M1 | M2 | M3 | M4 | M5 | M6 |
|------|----|----|----|----|----|----|
| 数据工程 | **主力** | 辅助 | 辅助 | 辅助 | — | 全员 |
| 后端算法1 | 辅助 | **主力** | **主力** | 辅助 | **主力** | 全员 |
| 后端算法2 | — | — | **主力** | 辅助 | 辅助 | 全员 |
| 前端1 | 骨架 | **主力** | — | **主力** | **主力** | 全员 |
| 前端2 | 骨架 | **主力** | — | **主力** | 辅助 | 全员 |
| 产品 | 验收 | 验收 | 验收 | 验收 | 验收 | **主力** |

> 人力峰值6人（W3-W8），低谷4-5人（W1-W2, W8-W10）。

### 9.6 关键风险与缓解

| # | 风险 | 影响 | 缓解 |
|---|------|------|------|
| R-1 | Q-1数据采购决策阻塞M1 | 🔴阻塞 | PRD交付后1周内决策会议；备选：公开数据+手动补充先行启动 |
| R-2 | Top10省本地化超预期 | 🔴高 | 先适配★★★3省（广东/河南/山东），其余分批；某省未完成则降级基础模式 |
| R-3 | 推荐算法精度不达标 | 🔴高 | M3日检机制；引入5年数据或增加线差权重；兜底：概率区间放宽±15%标注"估算" |
| R-4 | 出分日24h入库失败 | 🔴高 | T2阶段3次真实数据演练；半自动入库工具；降级：开放手动位次输入 |
| R-5 | 权重滑块移动端体验差 | 🟡中 | M2原型测试；降级：纯3滑块模式（三角形仅展示不可拖拽） |
| R-6 | 并行开发API契约不一致 | 🟡中 | M1锁定API契约V1.0；每周Review；API Mock确保前后端独立可测 |
| R-7 | AI模型选型延迟阻塞M5 | 🟢低 | M5可降级至V1.1；备选：固定话术树替代AI对话 |

### 9.7 MVP后迭代节奏

| 版本 | 时间窗 | 核心内容 |
|------|--------|---------|
| V1.1 | 2027.6.25-7.10（出分后2周） | 生产Bug修复+M5对话式补齐（如降级）+数据精度微调 |
| V1.5 | 2027.7.1-7.31（填报期） | P1功能补齐（风险诊断升级/分散度/同分去向/投档可视化）+付费模块基础版 |
| V2 | 2028.3-5（次年高考前） | 全31省本地化+P2停车场（多志愿表/职业发展/单科采集）+8人扩展团队 |

---

## 10. 待确认问题

| # | 问题 | 影响范围 | 决策方 | 优先级 |
|---|------|----------|--------|--------|
| Q-1 | 一分一段表数据来源——自建爬虫还是采购第三方数据？ | M1数据基础 | 产品负责人+数据工程 | 紧急 |
| Q-2 | 院校专业组数据更新频率——实时还是年度批量？ | 推荐引擎准确性 | 产品负责人 | 高 |
| Q-3 | 对话式入口使用的AI模型——自建还是接入第三方大模型？ | M5对话式入口 | 技术负责人 | 中 |
| Q-4 | Top10省的优先级排序是否需要根据实际用户分布调整？ | MVP覆盖范围 | 产品负责人+市场 | 高 |
| Q-5 | 加分项在不同院校的认可规则数据如何获取？ | Step2加分处理 | 数据工程 | 中 |
| Q-6 | 专业组纯净度评分的阈值（高/中/低分界线）是否需要用户测试验证？ | 推荐结果展示 | UX设计+用户研究 | 中 |
| Q-7 | 权重滑块的联动约束算法（B:C比例保持 vs 平均分配）是否需要A/B测试？ | Step5交互 | UX设计 | 低 |
| Q-8 | 压线分的±10分阈值是否需要根据省份一分一段表密度动态调整？ | 异常处理 | 数据工程+算法 | 中 |

---

## ✅ 行动清单

| # | 行动 | 负责方 | 时间窗 |
|---|------|--------|--------|
| A-1 | 确认一分一段表数据采购方案 | 产品负责人+数据工程 | M1启动前 |
| A-2 | 确认Top10省优先级排序 | 产品负责人+市场 | M1启动前 |
| A-3 | 完成选科非法组合全量校验规则评审 | 析客+开发团队 | M2启动前 |
| A-4 | 权重调节交互原型评审 | UX设计+析客+开发 | M2启动前 |
| A-5 | 推荐引擎算法评审（位次直查+线差+权重加权） | 析客+算法工程师 | M3启动前 |
| A-6 | 异常场景测试用例编写 | 析客+QA | M6启动前 |
| A-7 | 对话式入口AI模型选型 | 技术负责人 | M5启动前 |
| A-8 | 路径补充完整时间线 | 路径（路线图规划师） | ✅ 已完成 |

---

## ⚠️ 待确认 / 假设 / Non-goals

### 假设列表

| # | 假设 | 验证方式 | 风险 |
|---|------|----------|------|
| H-1 | 一分一段表数据可在出分日24h内入库 | M1阶段实测入库速度 | 高——若延迟>24h将影响核心体验 |
| H-2 | 院校专业组选科要求数据覆盖≥95%的专业 | M1阶段数据覆盖率检测 | 高——若覆盖率不足将导致推荐遗漏 |
| H-3 | 位次直查法±5%精度可满足用户信任需求 | M6阶段用户测试 | 中——若用户不信任需增加更多溯源数据 |
| H-4 | 权重滑块交互在移动端可流畅操作 | M2阶段原型测试 | 中——移动端三角形拖拽可能不够流畅 |
| H-5 | Top10省的本地化规则差异可在3周内全部适配 | M2-M4阶段实测 | 高——省份差异复杂度可能超预期 |

### Non-goals补充

- 本PRD仅覆盖"考生成绩/意向采集与智能推荐引擎"模块，不涉及：APP整体架构、账号体系、付费模块、社区模块、备考模块
- V2功能均列入"停车场"，不在当前开发范围，但需求池中已标注编号便于后续规划

---

## 📚 数据来源 & 成员产出索引

| 成员 | 角色 | 核心产出 | 本PRD引用章节 |
|------|------|----------|--------------|
| 析客 | 需求分析师 | 本PRD文档 | 全文 |
| 瑞思 | 用户研究员 | 5类用户画像+8条洞察+5个关键场景 | §3, §2, §7.4 |
| 竞析 | 竞品分析师 | 10款竞品对比+3大差异化机会+最佳实践+常见问题 | §4 |
| 数析 | 数据分析师 | 市场规模+省份差异化+算法关键数据+MVP指标 | §5, §7.3 |
| 路径 | 路线图规划师 | 完整时间线+里程碑规划+人力配置+风险缓解+迭代节奏 | §9 |

---

> 本报告由产品战略团队 AI 协作生成，重要决策请由产品负责人审定。
