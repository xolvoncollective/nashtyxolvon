@echo off
REM ============================================================================
REM NASHTY OS - SUPABASE EDGE FUNCTIONS DEPLOYMENT
REM ============================================================================
REM Run this to deploy all edge functions to Supabase
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     NASHTY OS - Edge Functions Deployment                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Set Supabase project reference
set PROJECT_REF=mzucfndifneytbesirkx

echo [1/9] Linking to Supabase project...
cd supabase
supabase link --project-ref %PROJECT_REF%
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to link project. Please run: supabase login
    pause
    exit /b 1
)

echo.
echo [2/9] Deploying auth-login function...
supabase functions deploy auth-login --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  auth-login deployment failed
)

echo.
echo [3/9] Deploying petty-cash-api function...
supabase functions deploy petty-cash-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  petty-cash-api deployment failed
)

echo.
echo [4/9] Deploying orders-api function...
supabase functions deploy orders-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  orders-api deployment failed
)

echo.
echo [5/9] Deploying dashboard-api function...
supabase functions deploy dashboard-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  dashboard-api deployment failed
)

echo.
echo [6/9] Deploying analytics-api function...
supabase functions deploy analytics-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  analytics-api deployment failed
)

echo.
echo [7/9] Deploying reports-api function...
supabase functions deploy reports-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  reports-api deployment failed
)

echo.
echo [8/9] Deploying settings-api function...
supabase functions deploy settings-api --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  settings-api deployment failed
)

echo.
echo [9/9] Deploying export-csv function...
supabase functions deploy export-csv --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  export-csv deployment failed
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Deployment complete!
echo ════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo 1. Test edge functions at: https://mzucfndifneytbesirkx.supabase.co/functions/v1/
echo 2. Check logs: supabase functions logs auth-login
echo 3. Test login at: https://nashtyxolvon2.pages.dev
echo.

cd ..
pause
