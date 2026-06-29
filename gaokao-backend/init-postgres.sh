#!/usr/bin/env bash
set -euo pipefail

# 一键初始化脚本：首次 PostgreSQL 数据目录初始化

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_DIR="$SCRIPT_DIR/.postgres/pgsql"
INITDB="$PG_DIR/bin/initdb.exe"
CREATEDB="$PG_DIR/bin/createdb.exe"
PG_CTL="$PG_DIR/bin/pg_ctl.exe"
PGDATA="C:/gaokao-pgdata"

if [[ ! -f "$INITDB" ]]; then
  echo "[错误] 找不到 initdb: $INITDB"
  echo "请确认 PostgreSQL 二进制已解压到 .postgres/pgsql 目录。"
  echo "如果尚未下载，可手动从以下地址下载并解压："
  echo "  https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip"
  exit 1
fi

if [[ -d "$PGDATA" ]]; then
  echo "[警告] 数据目录已存在: $PGDATA"
  read -r -p "是否删除并重新初始化？(y/N) " OVERWRITE
  if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
    rm -rf "$PGDATA"
  else
    echo "已取消初始化。"
    exit 0
  fi
fi

echo "[1/2] 初始化 PostgreSQL 数据目录..."
"$INITDB" -U gaokao -A trust --locale=C -E SQL_ASCII -D "$PGDATA"

echo "[2/2] 启动 PostgreSQL 并创建 gaokao 数据库..."
"$PG_CTL" -D "$PGDATA" -l "$SCRIPT_DIR/.postgres/pg.log" start
sleep 2
"$CREATEDB" -U gaokao gaokao

echo ""
echo "初始化完成。现在可以运行 ./start-backend.sh 启动后端服务。"
