# start-local.ps1
# NASHTY OS - Advanced Local Development Starter
# Version: 3.0.0
# Date: 2026-06-14
#
# USAGE:
#   powershell -ExecutionPolicy Bypass -File .\start-local.ps1
#
# TESTING ERROR SCENARIOS:
#   1. No Node.js: Rename node.exe temporarily to test
#   2. Port in use: Run script twice to test port conflict handling
#   3. No backend directory: Run from wrong directory
#   4. Build failure: Introduce TypeScript error in src/index.ts
#   5. No database: Delete data/nashtypos.db to test seeding
#   6. Health check timeout: Kill server after step 7 to test
#
# REQUIREMENTS VALIDATED:
#   - Requirement 1: Reliable Local Development Environment (all 10 criteria)
#   - Requirement 20: Script Error Recovery and User Guidance (all 7 criteria)
#   - Requirement 11.7: Health endpoint polling before browser opens

# Color and formatting helpers
function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "   ✅ $Message" -ForegroundColor Green
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "   ❌ $Message" -ForegroundColor Red
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "   ⚠️  $Message" -ForegroundColor Yellow
}

# Main script execution
Write-Host "`n=================================================="
Write-Host "   NASHTY OS - Local Development Mode"
Write-Host "   Port: 3099"
Write-Host "==================================================`n"

# [Step 1/9] Check Node.js installation
Write-Step "[1/9] Checking Node.js installation..."
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    
    # Extract major version (e.g., v18.x.x -> 18)
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($majorVersion -lt 18) {
        Write-Error-Message "ERROR: Node.js version $nodeVersion is too old. Please install Node.js v18 or higher."
        Write-Host "`nDownload from: https://nodejs.org/`n"
        exit 1
    }
    
    Write-Success "Node.js $nodeVersion detected"
}
catch {
    Write-Error-Message "ERROR: Node.js not installed. Please install Node.js v18 or higher."
    Write-Host "`nDownload from: https://nodejs.org/`n"
    exit 1
}

# [Step 2/9] Kill existing process on port 3099
Write-Step "[2/9] Checking port 3099 availability..."
try {
    $connection = Get-NetTCPConnection -LocalPort 3099 -ErrorAction SilentlyContinue
    
    if ($connection) {
        $processId = $connection.OwningProcess
        Write-Warning-Message "Port 3099 is in use by PID $processId. Terminating process..."
        
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Success "Process $processId terminated"
        
        # Wait 2 seconds to ensure port is freed
        Start-Sleep -Seconds 2
        
        # Verify port is actually free
        $stillInUse = Get-NetTCPConnection -LocalPort 3099 -ErrorAction SilentlyContinue
        if ($stillInUse) {
            Write-Error-Message "ERROR: Port 3099 could not be freed. Please manually kill PID $processId"
            Write-Host "`nUse: Stop-Process -Id $processId -Force`n"
            exit 1
        }
        
        Write-Success "Port 3099 is now available"
    }
    else {
        Write-Success "Port 3099 is available"
    }
}
catch {
    Write-Warning-Message "Could not check port status. Continuing anyway..."
}

# [Step 3/9] Navigate to backend directory
Write-Step "[3/9] Navigating to backend directory..."
$backendPath = Join-Path $PSScriptRoot "backoffice\backend"

if (-not (Test-Path $backendPath)) {
    Write-Error-Message "ERROR: backend directory not found. Please run from project root."
    Write-Host "`nExpected path: $backendPath`n"
    exit 1
}

Push-Location $backendPath
Write-Success "In backend directory: $backendPath"

# [Step 4/9] Install dependencies
Write-Step "[4/9] Checking dependencies..."
if (-not (Test-Path "node_modules")) {
    Write-Warning-Message "Dependencies not installed. Running npm install..."
    
    $installOutput = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "ERROR: Dependency installation failed!"
        Write-Host "`nNPM Error Output:"
        Write-Host $installOutput -ForegroundColor Red
        Write-Host "`nTry running: npm install --verbose`n"
        Pop-Location
        exit 1
    }
    
    Write-Success "Dependencies installed successfully"
}
else {
    Write-Success "Dependencies already installed"
}

# [Step 5/9] Build TypeScript
Write-Step "[5/9] Building TypeScript..."
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "ERROR: TypeScript compilation failed!"
    Write-Host "`nBuild Error Output:"
    Write-Host $buildOutput -ForegroundColor Red
    Write-Host "`nPlease fix the TypeScript errors above and try again.`n"
    Pop-Location
    exit 1
}
Write-Success "TypeScript compiled successfully"

# [Step 6/9] Initialize database
Write-Step "[6/9] Checking database..."
$dbPath = Join-Path $PSScriptRoot "data\nashtypos.db"

if (-not (Test-Path $dbPath)) {
    Write-Warning-Message "Database not found. Initializing database..."
    
    $seedOutput = npm run db:seed 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "ERROR: Database seeding failed!"
        Write-Host "`nSeed Error Output:"
        Write-Host $seedOutput -ForegroundColor Red
        Write-Host "`nTry manually deleting the database and running: npm run db:seed`n"
        Pop-Location
        exit 1
    }
    
    Write-Success "Database initialized and seeded"
}
else {
    Write-Success "Database already exists"
}

# [Step 7/9] Start server
Write-Step "[7/9] Starting development server..."
$env:PORT = "3099"
$env:NODE_ENV = "development"

# Start server as background job
$job = Start-Job -ScriptBlock {
    param($BackendPath)
    Set-Location $BackendPath
    $env:PORT = "3099"
    $env:NODE_ENV = "development"
    npm run dev
} -ArgumentList $backendPath

Write-Success "Server process started (Job ID: $($job.Id))"
Write-Success "NODE_ENV=development (Auth bypass enabled)"
Write-Host "   Waiting for server to initialize..."

# [Step 8/9] Health check polling
Write-Step "[8/9] Performing health check..."
$maxAttempts = 15
$attempt = 0
$healthCheckPassed = $false
$healthUrl = "http://localhost:3099/api/health"

while ($attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 1
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthCheckPassed = $true
            Write-Success "Health check passed (attempt $attempt/$maxAttempts)"
            break
        }
    }
    catch {
        # Suppress errors during polling
        Write-Host "." -NoNewline
    }
}

if (-not $healthCheckPassed) {
    Write-Host ""
    Write-Error-Message "ERROR: Server started but health check failed after $maxAttempts attempts."
    Write-Host "Possible issues:"
    Write-Host "  - Server may still be starting (wait longer and try accessing manually)"
    Write-Host "  - Database connection issues"
    Write-Host "  - Port conflict despite checks"
    Write-Host "`nCheck server logs for details. Server is still running in background."
    Write-Host "Try accessing: http://localhost:3099/api/health`n"
    
    # Show recent job output
    Write-Host "Recent server output:"
    Receive-Job -Job $job | Select-Object -Last 20
    
    Pop-Location
    exit 1
}

# [Step 9/9] Open browser
Write-Step "[9/9] Opening browser..."
Start-Process "http://localhost:3099/"
Write-Success "Browser opened to http://localhost:3099/"

# Success message
Write-Host "`n=================================================="
Write-Host "   ✅ SUCCESS: Server running on port 3099"
Write-Host "=================================================="
Write-Host ""
Write-Host "🌐 Access Points:"
Write-Host "  • Main Login:   http://localhost:3099/"
Write-Host "  • POS:          http://localhost:3099/pos"
Write-Host "  • KDS:          http://localhost:3099/kds"
Write-Host "  • Backoffice:   http://localhost:3099/backoffice"
Write-Host "  • API Health:   http://localhost:3099/api/health"
Write-Host ""
Write-Host "🔧 Development Mode Features:"
Write-Host "  • AUTH BYPASSED - All API routes accessible without token"
Write-Host "  • Rate limiting DISABLED"
Write-Host "  • CORS accepts all origins"
Write-Host "  • Detailed error messages with stack traces"
Write-Host "  • DEBUG logging enabled"
Write-Host ""
Write-Host "📊 Server Info:"
Write-Host "  • Background Job ID: $($job.Id)"
Write-Host "  • Environment: development"
Write-Host "  • Database: SQLite (./data/nashtypos.db)"
Write-Host ""
Write-Host "💡 Useful Commands:"
Write-Host "  • View logs:    Receive-Job -Id $($job.Id) -Keep"
Write-Host "  • Stop server:  Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)"
Write-Host "  • Restart:      .\start-local.ps1"
Write-Host ""
Write-Host "Press Ctrl+C to exit this script (server will continue running)"
Write-Host "==================================================`n"

# Keep script alive and show live output
Pop-Location

Write-Host "Live server output (Ctrl+C to exit monitoring):`n"
try {
    while ($true) {
        $output = Receive-Job -Job $job
        if ($output) {
            Write-Host $output
        }
        Start-Sleep -Milliseconds 500
        
        # Check if job is still running
        if ($job.State -eq "Completed" -or $job.State -eq "Failed") {
            Write-Host "`nServer has stopped."
            $finalOutput = Receive-Job -Job $job
            if ($finalOutput) {
                Write-Host $finalOutput
            }
            Remove-Job -Job $job
            break
        }
    }
}
finally {
    # Cleanup
    if ($job -and ($job.State -eq "Running")) {
        Write-Host "`nStopping server..."
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Host "Server stopped."
    }
}
