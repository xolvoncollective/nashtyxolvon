@echo off
REM =====================================================================
REM Deploy All Supabase Edge Functions
REM Pure Supabase Architecture (No Railway)
REM =====================================================================

echo.
echo ========================================
echo   Deploying Edge Functions to Supabase
echo ========================================
echo.

REM Check if npx is available
where npx >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npx not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/7] Deploying auth-login function...
npx supabase functions deploy auth-login --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] auth-login deployment failed
    pause
    exit /b 1
)

echo.
echo [2/7] Deploying orders-api function...
npx supabase functions deploy orders-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] orders-api deployment failed
    pause
    exit /b 1
)

echo.
echo [3/7] Deploying dashboard-api function...
npx supabase functions deploy dashboard-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] dashboard-api deployment failed
    pause
    exit /b 1
)

echo.
echo [4/7] Deploying reports-api function...
npx supabase functions deploy reports-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] reports-api deployment failed
    pause
    exit /b 1
)

echo.
echo [5/7] Deploying favorites-api function...
npx supabase functions deploy favorites-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] favorites-api deployment failed
    pause
    exit /b 1
)

echo.
echo [6/7] Deploying analytics-api function...
npx supabase functions deploy analytics-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] analytics-api deployment failed
    pause
    exit /b 1
)

echo.
echo [7/7] Deploying settings-api function...
npx supabase functions deploy settings-api --project-ref mzucfndifneytbesirkx
if %errorlevel% neq 0 (
    echo [ERROR] settings-api deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ All Edge Functions Deployed!
echo ========================================
echo.
echo   Total Functions: 7
echo   - auth-login
echo   - orders-api
echo   - dashboard-api
echo   - reports-api
echo   - favorites-api
echo   - analytics-api
echo   - settings-api
echo.
echo   Backend URL: https://mzucfndifneytbesirkx.supabase.co/functions/v1
echo.

pause
