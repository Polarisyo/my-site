# bump-content.ps1
# 在内容仓库(src/content)提交并推送后，运行此脚本更新主仓库的 submodule 指针并推送。
#
# 用法：
#   .\scripts\bump-content.ps1
#   .\scripts\bump-content.ps1 -Message "chore: bump content (新笔记)"
#
# 若遇到执行策略限制，可用：
#   powershell -ExecutionPolicy Bypass -File .\scripts\bump-content.ps1

param(
  [string]$Message = "chore: bump content submodule"
)

$ErrorActionPreference = "Stop"

# 切到项目根目录（脚本位于 scripts/ 下）
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> git add src/content" -ForegroundColor Cyan
git add src/content
if ($LASTEXITCODE -ne 0) { Write-Error "git add 失败"; exit 1 }

# 没有指针变化就跳过提交，避免 "nothing to commit" 报错
$staged = git diff --cached --name-only -- src/content
if (-not $staged) {
  Write-Host "src/content 指针无变化。请确认已在内容仓库内提交并 push（git -C src/content commit & push）。" -ForegroundColor Yellow
  exit 0
}

Write-Host "==> git commit -m `"$Message`"" -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Error "git commit 失败"; exit 1 }

Write-Host "==> git push my-site master" -ForegroundColor Cyan
git push my-site master
if ($LASTEXITCODE -ne 0) { Write-Error "git push 失败"; exit 1 }

Write-Host "✓ 内容 submodule 指针已更新并推送。" -ForegroundColor Green
