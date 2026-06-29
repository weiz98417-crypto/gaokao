# ============================================
# 高考志愿填报APP - 后端 Dockerfile
# 多阶段构建：编译 → 运行
# ============================================

# Stage 1: 编译 TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# 安装依赖（含 devDependencies 用于编译）
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码和 Prisma schema
COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN npx tsc

# 清理 devDependencies，只保留生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: 运行
FROM node:22-alpine

RUN apk add --no-cache curl

WORKDIR /app

# 从 builder 复制生产依赖和构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动时先运行 Prisma migrate，再启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
