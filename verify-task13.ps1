# Quick Verification Script for Task 13
# This script verifies that the POS and KDS are accessible

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Task 13 Checkpoint - Pre-Test Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "[1/4] Checking if backend server is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3099/api/health" -Method Get -ErrorAction Stop
    if ($health.status -eq "healthy") {
        Write-Host "  ✓ Backend is healthy (v$($health.version))" -ForegroundColor Green
        Write-Host "    Uptime: $([math]::Round($health.uptime/60, 2)) minutes" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Backend is unhealthy" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Cannot connect to backend at http://localhost:3099" -ForegroundColor Red
    Write-Host "    Please run: .\start-local.ps1" -ForegroundColor Yellow
    exit 1
}

# Check POS endpoint
Write-Host ""
Write-Host "[2/4] Checking POS frontend..." -ForegroundColor Yellow
try {
    $posResponse = Invoke-WebRequest -Uri "http://localhost:3099/pos" -Method Get -ErrorAction Stop
    if ($posResponse.StatusCode -eq 200) {
        Write-Host "  ✓ POS is accessible at http://localhost:3099/pos" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ POS frontend not accessible" -ForegroundColor Red
    exit 1
}

# Check KDS endpoint
Write-Host ""
Write-Host "[3/4] Checking KDS frontend..." -ForegroundColor Yellow
try {
    $kdsResponse = Invoke-WebRequest -Uri "http://localhost:3099/kds" -Method Get -ErrorAction Stop
    if ($kdsResponse.StatusCode -eq 200) {
        Write-Host "  ✓ KDS is accessible at http://localhost:3099/kds" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ KDS frontend not accessible" -ForegroundColor Red
    exit 1
}

# Check API endpoints
Write-Host ""
Write-Host "[4/4] Verifying critical API endpoints..." -ForegroundColor Yellow

# Test GET /api/orders/kitchen/queue (KDS polling endpoint)
try {
    $queueResponse = Invoke-RestMethod -Uri "http://localhost:3099/api/orders/kitchen/queue?tenantId=demo-tenant&outletId=demo-outlet" -Method Get -ErrorAction Stop
    if ($queueResponse.success) {
        Write-Host "  ✓ KDS polling endpoint working" -ForegroundColor Green
        Write-Host "    Current queue: $($queueResponse.total) orders" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ KDS polling endpoint failed" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ All systems operational!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to begin Task 13 testing:" -ForegroundColor Cyan
Write-Host "  1. Open POS: http://localhost:3099/pos" -ForegroundColor White
Write-Host "  2. Open KDS: http://localhost:3099/kds" -ForegroundColor White
Write-Host ""
Write-Host "Follow the test guide: TASK_13_CHECKPOINT_TEST_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

# Offer to open browsers
$openBrowsers = Read-Host "Open POS and KDS in browser now? (Y/N)"
if ($openBrowsers -eq 'Y' -or $openBrowsers -eq 'y') {
    Write-Host ""
    Write-Host "Opening browsers..." -ForegroundColor Cyan
    Start-Process "http://localhost:3099/pos"
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:3099/kds"
    Write-Host "  ✓ Browsers opened" -ForegroundColor Green
}

Write-Host ""
