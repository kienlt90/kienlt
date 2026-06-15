@echo off
title F1 Dashboard Runner
echo ===================================================
echo   F1 Dashboard Auto Runner by Antigravity
echo ===================================================
echo.

cd /d "%~dp0f1-dash\dashboard"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Create .env if it does not exist
if not exist .env (
    echo [INFO] Creating .env...
    echo NEXT_PUBLIC_LIVE_URL=http://localhost:4000>.env
    echo API_URL=http://localhost:4001>>.env
)

:: Check if node_modules exists
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies (npm install)...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

echo [INFO] Starting Next.js Dev Server...
echo [INFO] Dashboard will be accessible at http://localhost:3000
call npm.cmd run dev

pause
