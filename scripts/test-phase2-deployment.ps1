# Phase 2 Deployment - Automated Tests
# Quick validation script for syntax and basic checks

Write-Host "🚀 Phase 2 Deployment - Automated Validation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Test 1: Syntax Validation
Write-Host "📝 Test 1: JavaScript Syntax Validation" -ForegroundColor Yellow
Write-Host "   Checking api-client.js..." -NoNewline
try {
    $result = node --check api-client.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        $ErrorCount++
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $ErrorCount++
}

# Test 2: File Existence
Write-Host ""
Write-Host "📂 Test 2: Required Files Exist" -ForegroundColor Yellow

$requiredFiles = @(
    "api-client.js",
    "kds/frontend/index.html",
    "backoffice/frontend/js/nav.js",
    "docs/ORDER_STATUS_ARCHITECTURE.md",
    "docs/SETTINGS_ARCHITECTURE.md"
)

foreach ($file in $requiredFiles) {
    Write-Host "   Checking $file..." -NoNewline
    if (Test-Path $file) {
        Write-Host " ✅ EXISTS" -ForegroundColor Green
    } else {
        Write-Host " ❌ MISSING" -ForegroundColor Red
        $ErrorCount++
    }
}

# Test 3: Backup Exists
Write-Host ""
Write-Host "💾 Test 3: Backup Files" -ForegroundColor Yellow
Write-Host "   Checking api.js.backup-phase2..." -NoNewline
if (Test-Path "kds/frontend/js/api.js.backup-phase2") {
    Write-Host " ✅ EXISTS" -ForegroundColor Green
} else {
    Write-Host " ⚠️  MISSING (rollback not possible)" -ForegroundColor Yellow
    $WarningCount++
}

# Test 4: Deleted Files
Write-Host ""
Write-Host "🗑️  Test 4: Old Files Removed" -ForegroundColor Yellow
Write-Host "   Checking kds/frontend/js/api.js deleted..." -NoNewline
if (!(Test-Path "kds/frontend/js/api.js")) {
    Write-Host " ✅ DELETED" -ForegroundColor Green
} else {
    Write-Host " ⚠️  STILL EXISTS (duplicate not removed)" -ForegroundColor Yellow
    $WarningCount++
}

# Test 5: Git Status
Write-Host ""
Write-Host "📦 Test 5: Git Status" -ForegroundColor Yellow
Write-Host "   Checking for uncommitted changes..." -NoNewline
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host " ⚠️  UNCOMMITTED CHANGES" -ForegroundColor Yellow
    Write-Host "   Files:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    $WarningCount++
} else {
    Write-Host " ✅ CLEAN" -ForegroundColor Green
}

# Test 6: Recent Commits
Write-Host ""
Write-Host "📝 Test 6: Recent Commits" -ForegroundColor Yellow
Write-Host "   Last 3 commits:" -ForegroundColor Gray
git log --oneline -3 | ForEach-Object {
    Write-Host "   $_" -ForegroundColor Gray
}

# Test 7: Script References
Write-Host ""
Write-Host "🔗 Test 7: KDS Script Reference" -ForegroundColor Yellow
Write-Host "   Checking kds/frontend/index.html..." -NoNewline
$kdsHtml = Get-Content "kds/frontend/index.html" -Raw
if ($kdsHtml -match '../../api-client\.js') {
    Write-Host " ✅ CORRECT (uses root api-client.js)" -ForegroundColor Green
} else {
    Write-Host " ❌ INCORRECT (script reference not updated)" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""
Write-Host "   Checking for old api.js reference..." -NoNewline
if ($kdsHtml -match 'js/api\.js') {
    Write-Host " ❌ FOUND (old reference still present)" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host " ✅ CLEAN (no old reference)" -ForegroundColor Green
}

# Test 8: API Methods Present
Write-Host ""
Write-Host "🔧 Test 8: API Methods Present" -ForegroundColor Yellow
$apiClient = Get-Content "api-client.js" -Raw

$requiredMethods = @(
    "API\.kds\s*=",
    "getKDSQueue",
    "updateKitchenStatus",
    "session\.save",
    "session\.load",
    "session\.clear",
    "session\.isValid"
)

foreach ($method in $requiredMethods) {
    Write-Host "   Checking $method..." -NoNewline
    if ($apiClient -match $method) {
        Write-Host " ✅ FOUND" -ForegroundColor Green
    } else {
        Write-Host " ❌ MISSING" -ForegroundColor Red
        $ErrorCount++
    }
}

# Test 9: Documentation Complete
Write-Host ""
Write-Host "📚 Test 9: Documentation" -ForegroundColor Yellow

$docs = @(
    @{File="ARCHITECTURE_STABILIZATION_COMPLETE.md"; MinLines=300},
    @{File="PHASE1_VERIFICATION_REPORT.md"; MinLines=200},
    @{File="docs/ORDER_STATUS_ARCHITECTURE.md"; MinLines=200},
    @{File="docs/SETTINGS_ARCHITECTURE.md"; MinLines=50}
)

foreach ($doc in $docs) {
    Write-Host "   Checking $($doc.File)..." -NoNewline
    if (Test-Path $doc.File) {
        $lineCount = (Get-Content $doc.File).Count
        if ($lineCount -ge $doc.MinLines) {
            Write-Host " ✅ OK ($lineCount lines)" -ForegroundColor Green
        } else {
            Write-Host " ⚠️  SHORT ($lineCount lines, expected $($doc.MinLines)+)" -ForegroundColor Yellow
            $WarningCount++
        }
    } else {
        Write-Host " ❌ MISSING" -ForegroundColor Red
        $ErrorCount++
    }
}

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status: READY FOR MANUAL TESTING" -ForegroundColor Green
    Write-Host "Next: Run manual tests in DEPLOYMENT_CHECKLIST_PHASE2.md" -ForegroundColor Gray
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  WARNINGS: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Status: PROCEED WITH CAUTION" -ForegroundColor Yellow
    Write-Host "Review warnings above before deployment" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ ERRORS: $ErrorCount" -ForegroundColor Red
    Write-Host "⚠️  WARNINGS: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Status: NOT READY FOR DEPLOYMENT" -ForegroundColor Red
    Write-Host "Fix errors above before proceeding" -ForegroundColor Gray
    exit 1
}
