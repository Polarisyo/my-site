#!/usr/bin/env bash
# Vercel Install Command override.
# 解决私有 submodule (dataInMySite) 克隆失败：
#   - 认证 token 从 Vercel 环境变量 AUTOUPDATE_TOKEN 读取（非 GITHUB_TOKEN）
#   - 用户名用 GitHub 账号名 Polarisyo（已验证有效）
#   - 前缀校验防止把 SESSION_SECRET 等其他密钥误当 token 使用

set -euo pipefail

echo "[1/3] 检测 AUTOUPDATE_TOKEN..."
if [ -z "${AUTOUPDATE_TOKEN:-}" ]; then
  echo "ERROR: 环境变量 AUTOUPDATE_TOKEN 未注入。请在 Vercel 项目后台 → Environment Variables 配置。" >&2
  exit 1
fi
# 校验 token 前缀（避免 SESSION_SECRET / ADMIN_PASSWORD_HASH 误用）
case "$AUTOUPDATE_TOKEN" in
  github_pat_*|ghp_*|gho_*|ghs_*|ghr_*|ghu_*) ;;
  *)
    echo "ERROR: AUTOUPDATE_TOKEN 前缀不合法（期望 github_pat_ / ghp_ 等）。请确认 Vercel 后台配置的值是 GitHub 个人访问令牌，而不是其他密钥。" >&2
    echo "实际前 8 位: ${AUTOUPDATE_TOKEN:0:8}..." >&2
    exit 1
    ;;
esac
echo "  OK (prefix: ${AUTOUPDATE_TOKEN:0:8}...)"

echo "[2/3] 配置 submodule 认证 (insteadOf: Polarisyo:<AUTOUPDATE_TOKEN>)..."
# 用户名用 GitHub 账号名（已验证有效），token 从 AUTOUPDATE_TOKEN 读取
git config --global "url.https://Polarisyo:${AUTOUPDATE_TOKEN}@github.com/.insteadOf" "https://github.com/"
git config --global "url.https://Polarisyo:${AUTOUPDATE_TOKEN}@github.com/.insteadOf" "git@github.com:"
echo "  OK"

echo "[3/3] git submodule update --init --recursive && npm ci..."
git submodule update --init --recursive
npm ci
echo "  DONE"
