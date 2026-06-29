# 高考志愿填报APP — 云部署完整指南

> 最后更新：2026-06-29 | 版本：v1.0

---

## 一、项目结构

```
填报/
├── gaokao-app/          # React 前端（Vite 6 + TypeScript + TailwindCSS）
│   ├── dist/            # 构建产物（已就绪 ✅）
│   └── ...
├── gaokao-backend/      # Node.js 后端（Express 4 + TypeScript + Prisma 5）
│   ├── dist/            # 编译产物（已就绪 ✅）
│   ├── Dockerfile       # 后端容器镜像
│   └── ...
├── docker-compose.prod.yml  # 生产环境编排
├── nginx.conf               # Nginx 反向代理配置
└── .env.prod.template       # 环境变量模板
```

---

## 二、三种部署方案

### 方案 A：腾讯云 Lighthouse + 内置 Docker（推荐 ⭐）

**适用场景**：10万 DAU 以内，预算可控，运维简单

| 组件 | 腾讯云产品 | 规格建议 | 月费 |
|------|-----------|---------|------|
| 计算 | **Lighthouse 轻量应用服务器** | 4核8G，180GB SSD，10Mbps | ¥112/月 |
| 数据库 | 同上服务器运行 PostgreSQL（Docker） | 复用服务器 | ¥0 |
| CDN | **EdgeOne** 或 **CDN** | 静态加速 | ¥0-30/月 |
| **合计** | | | **¥112-142/月** |

**部署步骤：**
```bash
# 1. 购买 Lighthouse 实例（选择「应用镜像 → Docker CE」或「系统镜像 → Ubuntu 22.04」）
# 2. SSH 登录服务器，安装 Docker Compose（如未预装）
# 3. 上传项目文件到服务器
scp -r gaokao-app/dist gaokao-backend docker-compose.prod.yml nginx.conf .env.prod user@your-server:/opt/gaokao/

# 4. 配置环境变量
cp .env.prod.template .env.prod
vim .env.prod  # 填入真实值

# 5. 一键启动
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# 6. 访问 http://your-server-ip 验证
```

### 方案 B：腾讯云 CVM + 云数据库（高可用）

**适用场景**：流量大，需要弹性扩展，有运维团队

| 组件 | 腾讯云产品 | 规格建议 | 月费 |
|------|-----------|---------|------|
| 计算 | **CVM 云服务器** | S5.4XLARGE32（16核32G）×2 | ¥2,260/月 |
| 负载均衡 | **CLB** | 公网 | ¥0.02/小时 |
| 数据库 | **TencentDB for PostgreSQL** | 4核8G，200GB | ¥560/月 |
| CDN | **EdgeOne** | 静态加速 | ¥50/月 |
| DNS | **DNSPod** | 免费版 | ¥0 |
| SSL | **SSL 证书** | 免费 DV 证书 | ¥0 |
| **合计** | | | **¥2,870-4,000/月** |

### 方案 C：Serverless（弹性伸缩）

**适用场景**：流量波动大，按需付费

| 组件 | 腾讯云产品 | 月费 |
|------|-----------|------|
| 前端 | **EdgeOne Pages** 或 **COS + CDN** | ¥0-30/月 |
| 后端 | **CloudBase CloudRun**（容器）| 按量付费 |
| 数据库 | **CloudBase 云数据库**（PostgreSQL）| ¥3,000/月起 |
| 域名 | **DNSPod** | ¥0 |

---

## 三、Docker 快速部署（通用）

适用于任何支持 Docker 的云服务器（腾讯云、阿里云、AWS 等）。

### 前置条件
- Docker 24+
- Docker Compose v2
- 至少 2核4G 服务器

### 部署命令

```bash
# 1. 进入项目目录
cd /opt/gaokao

# 2. 复制环境变量模板并填写
cp .env.prod.template .env.prod
# 编辑 .env.prod 填入真实密钥（JWT_SECRET、数据库密码、Brevo API Key、DeepSeek API Key）

# 3. 构建并启动所有服务
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# 4. 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 5. 验证服务
curl http://localhost/api/health
```

### 常用运维命令
```bash
# 重启单个服务
docker compose -f docker-compose.prod.yml restart backend

# 查看数据库
docker exec -it gaokao-postgres psql -U gaokao -d gaokao

# 备份数据库
docker exec gaokao-postgres pg_dump -U gaokao gaokao > backup.sql

# 更新代码后重新部署
git pull
docker compose -f docker-compose.prod.yml up -d --build

# 数据库迁移
docker exec gaokao-backend npx prisma migrate deploy
```

---

## 四、环境变量清单

| 变量 | 说明 | 必须 |
|------|------|------|
| `DB_USER` | 数据库用户名 | ✅ |
| `DB_PASSWORD` | 数据库密码（强密码！） | ✅ |
| `DB_NAME` | 数据库名 | ✅ |
| `JWT_SECRET` | JWT 签名密钥（至少32位随机字符串） | ✅ |
| `JWT_EXPIRES_IN` | JWT 过期时间 | ✅ |
| `BREVO_API_KEY` | Brevo 邮件 API Key | ✅ |
| `BREVO_FROM_EMAIL` | 发件邮箱 | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 可选 |
| `USE_LLM` | 是否启用 AI 推荐 | 可选 |
| `CORS_ORIGINS` | 允许的前端域名 | ✅ |
| `LOGIN_MAX_ATTEMPTS` | 登录最大尝试次数 | 可选 |
| `LOGIN_LOCK_MINUTES` | 登录锁定时长 | 可选 |

---

## 五、数据初始化

部署完成后需要导入种子数据：

```bash
# 进入后端容器
docker exec -it gaokao-backend sh

# 运行数据导入脚本
npx tsx scripts/importAll.ts
```

---

## 六、安全清单

- [ ] 修改 `.env.prod` 中所有默认密码和密钥
- [ ] 配置 HTTPS（免费 SSL 证书 + 启用 nginx 443 配置）
- [ ] 数据库端口不对外暴露（docker-compose 中已限制 127.0.0.1）
- [ ] 配置防火墙规则（仅开放 80/443/22 端口）
- [ ] 开启腾讯云安全组
- [ ] 定期备份数据库（建议每天自动备份）
- [ ] 设置日志轮转（防止磁盘占满）

---

## 七、已处理的问题

| 问题 | 状态 |
|------|------|
| TypeScript 编译错误（未使用变量） | ✅ 已修复 |
| 后端 Dockerfile 多阶段构建 | ✅ 已创建 |
| Nginx SPA 路由配置 | ✅ 已创建 |
| Docker Compose 生产编排 | ✅ 已创建 |
| 环境变量模板 | ✅ 已创建 |
| .dockerignore | ✅ 已创建 |
| 前端 CloudStudio 预览 | ✅ 已部署 |
| 健康检查端点 | ✅ 已有 |

---

## 八、当前在线预览

- **前端预览**：https://88a1b87f63f04deaa5d6688875d43e18.app.codebuddy.work
- 注意：此预览仅有前端 UI，API 需要部署后端服务后才能正常使用

---

## 九、下一步操作建议

1. **选择部署方案**（推荐方案 A：Lighthouse）
2. **购买服务器** → [腾讯云 Lighthouse](https://cloud.tencent.com/product/lighthouse)
3. **配置域名 + DNS** → 将域名解析到服务器 IP
4. **申请 SSL 证书** → 免费 DV 证书（自动续期）
5. **`.env.prod` 配置** → 填入真实的 API Key 和密钥
6. **运行部署命令** → `docker compose up -d --build`
7. **导入数据** → 运行 importAll 脚本
8. **验证** → 访问 https://your-domain.com
