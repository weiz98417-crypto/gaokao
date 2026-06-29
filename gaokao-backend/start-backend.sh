#!/usr/bin/env bash
set -euo pipefail

# 一键启动脚本：先启动本地 PostgreSQL，再启动后端服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_DIR="$SCRIPT_DIR/.postgres/pgsql"
PG_CTL="$PG_DIR/bin/pg_ctl.exe"
PGDATA="C:/gaokao-pgdata"
PG_LOG="$SCRIPT_DIR/.postgres/pg.log"

if [[ ! -f "$PG_CTL" ]]; then
  echo "[错误] 找不到 PostgreSQL 控制程序: $PG_CTL"
  echo "请先运行 ./init-postgres.sh 初始化 PostgreSQL。"
  exit 1
fi

if [[ ! -d "$PGDATA" ]]; then
  echo "[错误] 找不到 PostgreSQL 数据目录: $PGDATA"
  echo "请先运行 ./init-postgres.sh 初始化 PostgreSQL。"
  exit 1
fi

echo "[1/3] 检查 PostgreSQL 状态..."
if "$PG_CTL" -D "$PGDATA" status >/dev/null 2>&1; then
  echo "PostgreSQL 已在运行。"
else
  echo "[2/3] 启动 PostgreSQL..."
  "$PG_CTL" -D "$PGDATA" -l "$PG_LOG" start
  echo "等待 PostgreSQL 就绪..."
  sleep 2
fi

echo "[3/3] 启动后端服务（USE_DATABASE=true）..."
cd "$SCRIPT_DIR"
npm run dev
