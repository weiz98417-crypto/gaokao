#!/bin/bash
# ============================================
# 高考志愿填报APP — 一键云部署脚本
# 用法: bash deploy.sh [服务器IP] [用户名]
# 示例: bash deploy.sh 123.456.789.0 root
# ============================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_IP="${1:-}"
SERVER_USER="${2:-root}"
APP_DIR="/opt/gaokao"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  高考志愿填报APP — 云部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# --------------------------------------------------
# Step 1: 本地构建
# --------------------------------------------------
echo -e "\n${YELLOW}[1/5] 本地构建...${NC}"

echo "  → 构建后端..."
cd gaokao-backend
npm run build
cd ..

echo "  → 构建前端..."
cd gaokao-app
npm run build
cd ..

echo -e "${GREEN}  ✅ 构建完成${NC}"

# --------------------------------------------------
# Step 2: 检查环境变量
# --------------------------------------------------
echo -e "\n${YELLOW}[2/5] 检查环境变量...${NC}"

if [ ! -f .env.prod ]; then
    echo -e "${RED}  ❌ 未找到 .env.prod 文件！${NC}"
    echo "  请从模板创建: cp .env.prod.template .env.prod"
    echo "  然后编辑填入真实值: vim .env.prod"
    exit 1
fi

# 检查必要变量
source .env.prod
REQUIRED_VARS=("DB_PASSWORD" "JWT_SECRET" "BREVO_API_KEY")
MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
    VAL="${!VAR:-}"
    if [ -z "$VAL" ] || [[ "$VAL" == *"修改"* ]] || [[ "$VAL" == *"你的"* ]]; then
        echo -e "${RED}  ❌ ${VAR} 未配置或仍是默认值${NC}"
        MISSING=1
    fi
done

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}  请修改 .env.prod 后再运行${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ 环境变量检查通过${NC}"

# --------------------------------------------------
# Step 3: 上传到服务器
# --------------------------------------------------
if [ -n "$SERVER_IP" ]; then
    echo -e "\n${YELLOW}[3/5] 上传到服务器 ${SERVER_IP}...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${APP_DIR}"
    
    scp -r gaokao-app/dist \
           gaokao-backend/Dockerfile \
           gaokao-backend/package.json \
           gaokao-backend/package-lock.json \
           gaokao-backend/tsconfig.json \
           gaokao-backend/src \
           gaokao-backend/prisma \
           docker-compose.prod.yml \
           nginx.conf \
           .env.prod \
           ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
    
    echo -e "${GREEN}  ✅ 文件上传完成${NC}"
else
    echo -e "\n${YELLOW}[3/5] 跳过上传（未指定服务器IP）${NC}"
    echo "  用法: bash deploy.sh <服务器IP> [用户名]"
fi

# --------------------------------------------------
# Step 4: 服务器端部署
# --------------------------------------------------
if [ -n "$SERVER_IP" ]; then
    echo -e "\n${YELLOW}[4/5] 服务器端部署...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR} && \
        docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build"
    
    echo -e "${GREEN}  ✅ 容器启动完成${NC}"
else
    echo -e "\n${YELLOW}[4/5] 跳过服务器部署${NC}"
fi

# --------------------------------------------------
# Step 5: 验证
# --------------------------------------------------
if [ -n "$SERVER_IP" ]; then
    echo -e "\n${YELLOW}[5/5] 验证部署...${NC}"
    
    sleep 10  # 等待服务启动
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}/health" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}  ✅ 服务正常响应${NC}"
        echo -e "\n${GREEN}========================================${NC}"
        echo -e "${GREEN}  🎉 部署成功！${NC}"
        echo -e "${GREEN}  访问地址: http://${SERVER_IP}${NC}"
        echo -e "${GREEN}========================================${NC}"
    else
        echo -e "${RED}  ⚠️ 健康检查失败 (HTTP ${HTTP_CODE})${NC}"
        echo "  请检查服务器日志: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${APP_DIR} && docker compose -f docker-compose.prod.yml logs'"
    fi
else
    echo -e "\n${YELLOW}[5/5] 跳过验证${NC}"
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  本地构建完成！${NC}"
    echo -e "${GREEN}  请购买服务器后运行: bash deploy.sh <服务器IP>${NC}"
    echo -e "${GREEN}========================================${NC}"
fi
