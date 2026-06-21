# ====================================================================
# NASHTY OS - Quick Deployment Script (PowerShell)
# Deploys to Cloudflare Pages via GitHub
# ====================================================================

Write-Host "🚀 NASHTY OS - Quick Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
  Write-Host "📝 Changes detected. Committing..." -ForegroundColor Yellow
  git add .
  git commit -m "fix: api-client v3.1, tests, deployment config, storage buckets SQL"
  Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
  Write-Host "✓ No changes to commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Pushed successfully" -ForegroundColor Green
  Write-Host ""
  Write-Host "⏳ Cloudflare Pages will auto-deploy in 2-3 minutes" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "📊 Monitor deployment:" -ForegroundColor White
  Write-Host "   https://dash.cloudflare.com/pages" -ForegroundColor Gray
  Write-Host ""
  Write-Host "🌐 Once deployed, test at:" -ForegroundColor White
  Write-Host "   https://nashtyxolvon2.pages.dev" -ForegroundColor Gray
  Write-Host "   https://nashtyxolvon2.pages.dev/test-login-flow.html" -ForegroundColor Gray
  Write-Host ""
  Write-Host "✅ Deployment initiated!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "1. Wait 2-3 minutes for deployment" -ForegroundColor White
  Write-Host "2. Open https://nashtyxolvon2.pages.dev" -ForegroundColor White
  Write-Host "3. Run tests at /test-login-flow.html" -ForegroundColor White
  Write-Host "4. Create storage buckets: Run supabase/CREATE_STORAGE_BUCKETS.sql" -ForegroundColor White
} else {
  Write-Host "❌ Push failed. Check your git configuration." -ForegroundColor Red
  exit 1
}
