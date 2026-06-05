@echo off
REM Supabase Migration Runner for Windows
REM This script pushes all pending migrations to your Supabase project

cls
echo.
echo ================================================================
echo  Bulletin Board - Database Migration Runner
echo ================================================================
echo.

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if errorlevel 1 (
    echo Supabase CLI not found. Installing...
    call npm install -g supabase
)

echo.
echo Navigating to project directory...
cd /d "%~dp0"

echo.
echo ================================================================
echo  Step 1: Linking to Supabase Project
echo ================================================================
echo.
echo Project: wmdowcsxtudwrovdeqnx
echo.
echo You will be prompted to enter your Supabase password
echo (Get it from: https://app.supabase.com Settings ^> API)
echo.

call supabase link --project-ref wmdowcsxtudwrovdeqnx

echo.
echo ================================================================
echo  Step 2: Pushing Migrations to Supabase
echo ================================================================
echo.

call supabase db push

echo.
echo ================================================================
echo  Step 3: Verifying Tables
echo ================================================================
echo.

call supabase db remote show

echo.
echo ================================================================
echo  MIGRATION COMPLETE!
echo ================================================================
echo.
echo Next steps:
echo   1. Create storage bucket: See SETUP_GUIDE.md Step 2
echo   2. Configure RLS policies: See SETUP_GUIDE.md Step 3
echo   3. Test post creation in the app
echo.
pause
