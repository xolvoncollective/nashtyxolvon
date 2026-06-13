@echo off
REM ============================================================
REM   NASHTY OS - Local Development Starter
REM   Automatically starts backend and opens browser
REM ============================================================

echo.
echo ==========================================================
echo    NASHTY OS - Local Development Mode
echo    Port: 3099
echo ==========================================================
echo.

REM [1/6] Advanced Port Cleaner for 3099
echo [1/6] Checking port availability...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3099.*LISTENING"') do (
    echo    ⚠️  Port 3099 is already in use by PID %%a. Killing process...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo    ✅ Port 3099 is available

REM [2/6] Navigate to backend directory
echo [2/6] Navigating to backend directory...
cd backoffice\backend
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Error: backend directory not found!
    pause
    exit /b 1
)
echo    ✅ In backend directory

REM [3/6] Install dependencies if needed
if not exist node_modules (
    echo [3/6] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ Error installing dependencies!
        pause
        exit /b 1
    )
) else (
    echo [3/6] Dependencies already installed
)

REM [4/6] Build TypeScript
echo [4/6] Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Error building project!
    pause
    exit /b 1
)

REM [5/6] Setup Database
echo [5/6] Checking database...
if not exist "..\..\data\nashtypos.db" (
    echo    ⚠️  Database not found. Running seed script...
    call npm run db:seed
) else (
    echo    ✅ Database ready
)

REM [6/6] Start server
echo [6/6] Starting backend server...
echo.
echo ==========================================================
echo    Backend server starting on port 3099...
echo.
echo    Access Points:
echo    • Main Login:  http://localhost:3099/
echo    • POS:         http://localhost:3099/pos/frontend/
echo    • KDS:         http://localhost:3099/kds/frontend/
echo    • Backoffice:  http://localhost:3099/backoffice/
echo.
echo    Press Ctrl+C to stop the server
echo ==========================================================
echo.

REM Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3099/"

REM Start server in dev mode with environment variable
set PORT=3099
call npm run dev

REM If server stops, go back to root
cd ..\..
echo.
echo Server stopped.
pause
