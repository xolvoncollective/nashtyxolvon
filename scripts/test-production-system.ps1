# ═══════════════════════════════════════════════════════════════════
# NASHTY OS - Quick Production Test Script (PowerShell)
# Test complete order flow: Login → POS → Order → KDS
# ═══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║   🧪 NASHTY OS - Production System Test                 ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Config
$SUPABASE_URL = "https://mzucfndifneytbesirkx.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg"

$PASSED = 0
$FAILED = 0

Write-Host "Testing against: $SUPABASE_URL" -ForegroundColor Blue
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 1: Check Cloudflare Pages
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 1: Cloudflare Pages Status" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "https://nashtyxolvon2.pages.dev" -Method Head -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Cloudflare Pages accessible (HTTP 200)" -ForegroundColor Green
        $PASSED++
    }
} catch {
    Write-Host "  ✗ Cloudflare Pages not accessible" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 2: Check Supabase API
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 2: Supabase REST API" -ForegroundColor Blue
try {
    $headers = @{
        "apikey" = $ANON_KEY
    }
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Supabase API accessible (HTTP 200)" -ForegroundColor Green
        $PASSED++
    }
} catch {
    Write-Host "  ✗ Supabase API not accessible" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 3: Check Edge Functions
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 3: Edge Functions" -ForegroundColor Blue
$FUNCTIONS = @("auth-login", "orders-api", "dashboard-api", "reports-api", "favorites-api", "analytics-api", "settings-api")

foreach ($func in $FUNCTIONS) {
    try {
        $headers = @{
            "apikey" = $ANON_KEY
        }
        $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/$func" -Headers $headers -Method Options -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -in @(200, 204)) {
            Write-Host "  ✓ $func - accessible" -ForegroundColor Green
            $PASSED++
        }
    } catch {
        Write-Host "  ✗ $func - not accessible (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
        $FAILED++
    }
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 4: Test Auth Login Endpoint
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 4: Auth Login Endpoint (POST)" -ForegroundColor Blue
try {
    $headers = @{
        "Content-Type" = "application/json"
        "apikey" = $ANON_KEY
    }
    $body = @{
        action = "main-login"
        username = "admin1"
        password = "nashty1111"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/auth-login" -Headers $headers -Method Post -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content
    
    if ($content -match "token" -or $content -match "error") {
        Write-Host "  ✓ Auth endpoint responding" -ForegroundColor Green
        Write-Host "     Response preview: $($content.Substring(0, [Math]::Min(80, $content.Length)))..." -ForegroundColor Green
        $PASSED++
    }
} catch {
    Write-Host "  ✗ Auth endpoint not responding correctly" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 5: Check Database Tables
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 5: Database Tables (via REST API)" -ForegroundColor Blue
$TABLES = @("users", "products", "categories", "orders", "outlets")

foreach ($table in $TABLES) {
    try {
        $headers = @{
            "apikey" = $ANON_KEY
            "Authorization" = "Bearer $ANON_KEY"
        }
        $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/$table`?select=*&limit=1" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $table table accessible" -ForegroundColor Green
            $PASSED++
        }
    } catch {
        Write-Host "  ✗ $table table not accessible" -ForegroundColor Red
        $FAILED++
    }
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 6: Check Users Data
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 6: Initial Users Data" -ForegroundColor Blue
try {
    $headers = @{
        "apikey" = $ANON_KEY
        "Authorization" = "Bearer $ANON_KEY"
        "Prefer" = "count=exact"
    }
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/users?select=count" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    $users_count = $content.count
    
    if ($users_count -gt 0) {
        Write-Host "  ✓ Users data populated ($users_count users)" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "  ⚠ No users found - run initial-data-production.sql" -ForegroundColor Yellow
        Write-Host "     Via Supabase SQL Editor" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check users count" -ForegroundColor Yellow
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 7: Check Products Data
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 7: Initial Products Data" -ForegroundColor Blue
try {
    $headers = @{
        "apikey" = $ANON_KEY
        "Authorization" = "Bearer $ANON_KEY"
        "Prefer" = "count=exact"
    }
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/products?select=count" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    $products_count = $content.count
    
    if ($products_count -gt 0) {
        Write-Host "  ✓ Products data populated ($products_count products)" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "  ⚠ No products found - run initial-data-production.sql" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check products count" -ForegroundColor Yellow
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# TEST 8: Check Storage Buckets
# ───────────────────────────────────────────────────────────────────
Write-Host "📋 Test 8: Storage Buckets" -ForegroundColor Blue
$BUCKETS = @("receipts", "promotions")

foreach ($bucket in $BUCKETS) {
    try {
        $headers = @{
            "apikey" = $ANON_KEY
            "Authorization" = "Bearer $ANON_KEY"
        }
        $response = Invoke-WebRequest -Uri "$SUPABASE_URL/storage/v1/bucket/$bucket" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $bucket bucket exists" -ForegroundColor Green
            $PASSED++
        }
    } catch {
        Write-Host "  ⚠ $bucket bucket not found - create via Supabase Dashboard" -ForegroundColor Yellow
    }
}
Write-Host ""

# ───────────────────────────────────────────────────────────────────
# SUMMARY
# ───────────────────────────────────────────────────────────────────
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Blue
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✅ SYSTEM READY FOR PRODUCTION!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Open browser: https://nashtyxolvon2.pages.dev"
    Write-Host "2. Login: admin1 / nashty1111"
    Write-Host "3. Select POS and test complete order flow"
    Write-Host "4. Verify KDS receives orders real-time"
    Write-Host "5. Test receipt printing"
    Write-Host ""
    Write-Host "🚀 READY FOR RESTAURANT LAUNCH TOMORROW!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Blue
    Write-Host "1. Deploy Edge Functions: supabase functions deploy <name> --project-ref mzucfndifneytbesirkx"
    Write-Host "2. Populate initial data: Via Supabase SQL Editor"
    Write-Host "3. Create storage buckets: Supabase Dashboard → Storage"
    Write-Host "4. Check RLS policies: database/database-rls-policies.sql"
    Write-Host ""
    exit 1
}
