#!/usr/bin/env bash
# Vercel Install Command override.
# 解决私有 submodule (dataInMySite) 克隆失败：
#   - Vercel 默认的 `${USER}:${TOKEN}@github.com` 格式已被 GitHub 禁用
#   - 正确格式是 `x-access-token:${PAT}@github.com`
#   - 同时确认 $GITHUB_TOKEN 确实被注入（避免把 SESSION_SECRET 错当 token 用）

set -euo pipefail

echo "[1/3] 检测 GITHUB_TOKEN..."
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: 环境变量 GITHUB_TOKEN 未注入。请在 Vercel 项目后台 → Environment Variables 配置。" >&2
  exit 1
fi
# 校验 token 前缀（避免 SESSION_SECRET / ADMIN_PASSWORD_HASH 误用）
case "$GITHUB_TOKEN" in
  github_pat_*|ghp_*|gho_*|ghs_*|ghr_*|ghu_*) ;;
  *)
    echo "ERROR: GITHUB_TOKEN 前缀不合法（期望值 github_pat_ / ghp_ 等）。请确认 Vercel 后台配置的值是 GitHub 个人访问令牌，而不是 SESSION_SECRET 或其他密钥。" >&2
    echo "实际前 8 位: ${GITHUB_TOKEN:0:8}..." >&2
    exit 1
    ;;
esac
echo "  OK (prefix: ${GITHUB_TOKEN:0:8}...)"

echo "[2/3] 配置 submodule 认证 (insteadOf: x-access-token)..."
# 注意：认证部分用 user:token 格式，用户名必须是 `x-access-token`
git config --global "url.https://x-access-token:${GITHUB_TOKEN}@github.com/.insteadOf" "https://github.com/"
git config --global "url.https://x-access-token:${GITHUB_TOKEN}@github.com/.insteadOf" "git@github.com:"
echo "  OK"

echo "[3/3] git submodule update --init --recursive && npm ci..."
git submodule update --init --recursive
npm ci
echo "  DONE"
