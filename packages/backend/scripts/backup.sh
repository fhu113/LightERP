#!/bin/bash

# 数据库自动备份脚本
# 每6小时执行一次

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========== $(date) 开始数据库备份 =========="

# 使用 tsx 运行 TypeScript 备份脚本
npx tsx scripts/backup.ts backup

echo "========== $(date) 备份完成 =========="
