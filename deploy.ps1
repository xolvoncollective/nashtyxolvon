# deploy.ps1
# Script untuk deploy Supabase Edge Functions ke project mzucfndifneytbesirkx

Write-Host "=== NASHTY OS SUPABASE DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Pastikan Anda sudah login ke Supabase CLI."
Write-Host "Jika belum, proses ini akan meminta Anda untuk login terlebih dahulu." -ForegroundColor Yellow

# Check if logged in (this might prompt login)
Write-Host "`n[1/3] Login ke Supabase (jika diperlukan)..."
npx supabase login

Write-Host "`n[2/3] Menghubungkan ke project mzucfndifneytbesirkx..."
npx supabase link --project-ref mzucfndifneytbesirkx

Write-Host "`n[3/3] Mendeploy Edge Functions..."
Write-Host "Deploying auth-login..."
npx supabase functions deploy auth-login --no-verify-jwt

Write-Host "Deploying dashboard-api..."
npx supabase functions deploy dashboard-api --no-verify-jwt

Write-Host "Deploying orders-api..."
npx supabase functions deploy orders-api --no-verify-jwt

Write-Host "Deploying reports-api..."
npx supabase functions deploy reports-api --no-verify-jwt

Write-Host "`n=== DEPLOYMENT SELESAI ===" -ForegroundColor Green
Write-Host "Semua fungsi berhasil di-deploy ke cloud. Aplikasi Anda sekarang sepenuhnya serverless!" -ForegroundColor Green
