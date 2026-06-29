# 前后端数据解耦清单

## 分类原则

- **静态配置**：不随用户输入变化，前端本地渲染/UI 用，存于 `gaokao-app/src/config/*.json`
- **动态数据**：会根据考生成绩、偏好、省份等变化，由后端 API 返回，存于 `gaokao-backend/src/data/json/*.json`

## 数据项分类

| 原数据项 | 分类 | 前端/后端 | JSON 路径 | API 路径 | 说明 |
|----------|------|-----------|-----------|----------|------|
| `PROVINCES` | 静态配置 | 前端 | `gaokao-app/src/config/provinces.json` | - | 省份基础信息，前端表单/选择器用 |
| `PROVINCES` | 动态数据 | 后端 | `gaokao-backend/src/data/json/provinces.json` | `GET /api/provinces` | 后端返回给前端 |
| `PRIMARY_SUBJECTS` | 静态配置 | 前端 | `gaokao-app/src/config/subjects.json` | - | 首选科目选项 |
| `SECONDARY_SUBJECTS` | 静态配置 | 前端 | `gaokao-app/src/config/subjects.json` | - | 再选科目选项 |
| `COLLEGE_LEVELS` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 院校层次选项 |
| `CITIES` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 意向城市列表 |
| `DISTANCE_PREFS` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 距离偏好选项 |
| `DISCIPLINES` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 学科门类选项 |
| `CAREER_ORIENTATIONS` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 职业倾向选项 |
| `POPULAR_MAJORS` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 热门专业搜索提示 |
| `SPECIAL_IDENTITIES` | 静态配置 | 前端 | `gaokao-app/src/config/options.json` | - | 特殊身份选项 |
| `RANK_LOOKUP` | 静态配置（兜底） | 前端 | `gaokao-app/src/config/rankLookups.json` | - | 后端不可用时前端兜底 |
| `RANK_LOOKUP` | 动态数据 | 后端 | `gaokao-backend/src/data/json/rankLookups.json` | `GET /api/rank-lookup` | 位次查询结果 |
| `MOCK_RECOMMENDATIONS` | 动态数据 | 后端 | `gaokao-backend/src/data/json/recommendations.json` | `GET/POST /api/recommend` | 推荐志愿列表 |
| `RISK_DATA` | 动态数据 | 后端 | `gaokao-backend/src/data/json/riskChecks.json` | `GET /api/risk` | 风险诊断结果 |

## 文件变更

### 前端

- 新增：
  - `gaokao-app/src/config/provinces.json`
  - `gaokao-app/src/config/subjects.json`
  - `gaokao-app/src/config/options.json`
  - `gaokao-app/src/config/rankLookups.json`
  - `gaokao-app/src/config/index.ts`
- 修改：
  - `gaokao-app/src/data.ts` — 删除常量，仅保留类型定义
  - `gaokao-app/src/hooks.ts` — 从 config 读取省份和位次兜底
  - `gaokao-app/src/pages.tsx` — 从 config 导入静态配置

### 后端

- 新增：
  - `gaokao-backend/src/data/json/provinces.json`
  - `gaokao-backend/src/data/json/recommendations.json`
  - `gaokao-backend/src/data/json/riskChecks.json`
  - `gaokao-backend/src/data/json/rankLookups.json`
  - `gaokao-backend/src/data/jsonLoader.ts`
- 修改：
  - `gaokao-backend/src/data/mockData.ts` — 从 JSON 文件加载数据

## 验证结果

- 前端 `npm run build` ✅
- 后端 `npm run typecheck` ✅
- 后端 API `/api/provinces`、`/api/recommend`、`/api/risk`、`/api/rank-lookup` 数据返回正常 ✅
- 前端 `/results`、`/risk` 页面通过 Vite 代理从后端加载动态数据并渲染 ✅
