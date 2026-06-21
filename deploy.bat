@echo off
REM =============================================
REM POS Enhancement - Quick Deploy Script (Windows)
REM =============================================

echo.
echo ========================================
echo  POS Enhancement Deployment
echo ========================================
echo.

REM Step 1: Backend Setup
echo [Step 1] Backend Setup
echo Installing backend dependencies...
cd backoffice\backend

if not exist "package.json" (
    echo [ERROR] package.json not found
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Environment Setup
echo [Step 2] Environment Configuration
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo [WARNING] Please edit .env with your Supabase credentials
    echo   SUPABASE_URL=your-url
    echo   SUPABASE_SERVICE_KEY=your-key
    echo.
    pause
) else (
    echo [OK] .env file already exists
)
echo.

REM Step 3: Database Migration
echo [Step 3] Database Migration
echo Migration SQL location: backoffice\backend\migrations\add_favorites_and_settings.sql
echo.
echo Please run this SQL in Supabase SQL Editor:
echo 1. Go to Supabase Dashboard ^> SQL Editor
echo 2. Copy contents of migrations\add_favorites_and_settings.sql
echo 3. Execute the SQL
echo.
pause

REM Step 4: Verify Frontend
echo.
echo [Step 4] Frontend Verification
if not exist "..\..\pos\frontend\index.html" (
    echo [ERROR] Frontend index.html not found
    exit /b 1
)

findstr /C:"keyboard-shortcuts.js" ..\..\pos\frontend\index.html >nul
if %ERRORLEVEL% EQU 0 (
    findstr /C:"receipt-generator.js" ..\..\pos\frontend\index.html >nul
    if %ERRORLEVEL% EQU 0 (
        findstr /C:"customer-display-manager.js" ..\..\pos\frontend\index.html >nul
        if %ERRORLEVEL% EQU 0 (
            echo [OK] All enhancement scripts are integrated
        )
    )
) else (
    echo [ERROR] Some enhancement scripts are missing
    exit /b 1
)
echo.

REM Step 5: Start Server
echo [Step 5] Starting Server
echo Server will start on http://localhost:3000
echo.
echo Available endpoints:
echo   POST   /api/favorites
echo   GET    /api/favorites?userId=X
echo   DELETE /api/favorites/:productId
echo   PUT    /api/favorites/reorder
echo   GET    /api/analytics/top-products
echo   GET    /api/outlets/:id/receipt-settings
echo   PUT    /api/outlets/:id/receipt-settings
echo   GET    /api/outlets/:id/display-settings
echo   PUT    /api/outlets/:id/display-settings
echo.
echo [OK] Deployment complete!
echo.
echo Starting server...
call npm start
