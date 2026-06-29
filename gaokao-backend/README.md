# gaokao-backend

高考志愿填报 APP 后端服务。

## 技术栈

- Node.js 18+
- Express 4
- TypeScript 5
- tsx（开发热重载）
- Prisma 5
- PostgreSQL 16

## 快速启动（推荐）

如果你已经按下方步骤初始化过 PostgreSQL，直接**双击** `start-backend.bat` 即可：

- 双击后会弹出一个 **CMD 窗口**（不是 PowerShell 窗口）运行后端服务。
- 脚本会自动检查并启动 PostgreSQL，然后启动后端。
- 服务启动后，窗口会保持打开并显示 `npm run dev` 的日志。
- 需要停止时，可以：
  - **双击 `stop-backend.bat`** 一键停止后端和 PostgreSQL
  - 或直接在 CMD 窗口中按 `Ctrl + C`，然后关闭窗口

也可以在终端运行：

```bash
# Windows CMD / PowerShell
start-backend.bat

# Git Bash / WSL
./start-backend.sh
```

脚本会自动：
1. 检查本地 PostgreSQL 是否运行，没运行则启动
2. 检查端口 3000 是否被占用，被占用会提示并暂停
3. 启动后端服务（读取 `.env` 中的 `USE_DATABASE` 配置）

## 手动启动

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化 PostgreSQL（首次执行）

如果还没有 PostgreSQL 数据目录，运行初始化脚本：

```bash
# Windows CMD / PowerShell
init-postgres.bat

# Git Bash / WSL
./init-postgres.sh
```

脚本会：
- 在 `C:\gaokao-pgdata` 初始化数据目录
- 启动 PostgreSQL
- 创建 `gaokao` 数据库

> 说明：Windows 中文路径下 PostgreSQL UTF8 初始化会报错，因此数据目录固定放在 `C:\gaokao-pgdata`。

如果无法运行脚本，可手动执行：

```powershell
chcp 65001
& ".postgres\pgsql\bin\initdb.exe" -U gaokao -A trust --locale=C -E SQL_ASCII -D C:\gaokao-pgdata
& ".postgres\pgsql\bin\pg_ctl.exe" -D C:\gaokao-pgdata -l .postgres\pg.log start
& ".postgres\pgsql\bin\createdb.exe" -U gaokao gaokao
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

内存模式（默认）：

```env
USE_DATABASE=false
```

数据库模式：

```env
USE_DATABASE=true
DATABASE_URL="postgresql://gaokao@localhost:5432/gaokao?schema=public"
```

### 4. 数据库迁移与种子数据（数据库模式）

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务默认运行在 http://localhost:3000。

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3000` | 后端服务端口 |
| `CORS_ORIGINS` | `http://localhost:5173` | 允许跨域的前端地址，多个用逗号分隔 |
| `USE_DATABASE` | `false` | `true` 使用 PostgreSQL，`false` 使用内存 Mock |
| `DATABASE_URL` | - | PostgreSQL 连接字符串 |
| `NODE_ENV` | `development` | 运行环境 |

## API 列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/provinces` | 省份列表 |
| GET | `/api/rank-lookup?score={score}&province={province}` | 位次查询 |
| GET | `/api/recommend` | 返回推荐列表 |
| POST | `/api/recommend` | 接收考生信息，返回推荐志愿列表 |
| POST | `/api/recommend/mock` | 显式 Mock 推荐接口 |
| GET | `/api/risk` | 风险诊断数据 |

## 项目结构

```
gaokao-backend
├── prisma
│   ├── schema.prisma          # Prisma 数据模型
│   ├── seed.ts                # 种子数据脚本
│   └── migrations/            # 数据库迁移
├── src
│   ├── data
│   │   └── mockData.ts        # 内存 Mock 数据
│   ├── repositories
│   │   ├── interfaces.ts      # 仓库接口
│   │   ├── inMemoryRepository.ts # 内存实现
│   │   └── prismaRepository.ts   # PostgreSQL/Prisma 实现
│   ├── routes
│   │   └── index.ts           # API 路由
│   ├── services
│   │   ├── recommendationService.ts
│   │   ├── provinceService.ts
│   │   ├── rankService.ts
│   │   └── riskService.ts
│   ├── types
│   │   └── index.ts           # 共享类型
│   ├── app.ts                 # Express 应用工厂
│   └── index.ts               # 服务入口
├── start-backend.bat          # Windows 一键启动脚本（双击运行）
├── stop-backend.bat           # Windows 一键停止脚本
├── start-backend.sh           # Git Bash 一键启动脚本
├── init-postgres.bat          # Windows PostgreSQL 初始化脚本
├── init-postgres.sh           # Git Bash PostgreSQL 初始化脚本
├── package.json
├── tsconfig.json
├── .env.example
├── docker-compose.yml         # Docker 方式启动 PostgreSQL（备选）
└── README.md
```

## 脚本说明

- `.bat` 脚本双击后会打开 CMD 窗口运行。
- 为避免 Windows 中文路径/编码导致的批处理解析错误，`.bat` 脚本使用英文输出。
- 如果需要中文提示，可以手动编辑 `.bat` 文件，并确保保存为 **GBK/ANSI 编码 + CRLF 行尾**。

## PostgreSQL 管理命令

```bash
# 启动
".postgres\pgsql\bin\pg_ctl.exe" -D C:\gaokao-pgdata -l .postgres\pg.log start

# 停止
".postgres\pgsql\bin\pg_ctl.exe" -D C:\gaokao-pgdata stop

# 状态
".postgres\pgsql\bin\pg_ctl.exe" -D C:\gaokao-pgdata status
```

## 后续扩展点

- 在 `RecommendationService` 中加入缓存、位次直查、线差校验与加权排序。
- 接入 Redis 缓存推荐结果与热数据。
- 增加 JWT 鉴权与请求限流。
