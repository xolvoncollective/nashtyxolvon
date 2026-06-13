@echo off
REM ============================================================
REM   NASHTY OS - Local Development Starter
REM   Automatically starts backend and opens browser
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   NASHTY OS - Local Development Mode                    ║
echo ║   Port: 3099                                            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check if port 3099 is already in use
echo [1/5] Checking port availability...
netstat -ano | findstr ":3099" >nul
if %ERRORLEVEL%==0 (
    echo    ⚠️  Port 3099 is already in use!
    echo    Attempting to stop existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3099"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)
echo    ✅ Port 3099 is available

REM Navigate to backend directory
echo [2/5] Navigating to backend directory...
cd backoffice\backend
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Error: backend directory not found!
    pause
    exit /b 1
)
echo    ✅ In backend directory

REM Install dependencies if needed
if not exist node_modules (
    echo [3/5] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ Error installing dependencies!
        pause
        exit /b 1
    )
) else (
    echo [3/5] Dependencies already installed
)
echo    ✅ Dependencies ready

REM Build TypeScript
echo [4/5] Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Error building project!
    pause
    exit /b 1
)
echo    ✅ Build successful

REM Start server
echo [5/5] Starting backend server...
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   Backend server starting on port 3099...               ║
echo ║                                                          ║
echo ║   Access Points:                                        ║
echo ║   • Main Login:  http://localhost:3099/                 ║
echo ║   • POS:         http://localhost:3099/pos/frontend/    ║
echo ║   • KDS:         http://localhost:3099/kds/frontend/    ║
echo ║   • Backoffice:  http://localhost:3099/backoffice/      ║
echo ║                                                          ║
echo ║   Press Ctrl+C to stop the server                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3099/"

REM Start server (this will block)
call npm start

REM If server stops, go back to root
cd ..\..
echo.
echo Server stopped.
pause
