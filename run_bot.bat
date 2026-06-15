@echo off
title Telegram Bot Runner
echo ===================================================
echo   Telegram Bot Local Runner by Antigravity
echo ===================================================
echo.

:: Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

:: Check if PyTelegramBotAPI is installed, if not install it
python -c "import telebot" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing required library pyTelegramBotAPI...
    pip install pyTelegramBotAPI
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pyTelegramBotAPI!
        pause
        exit /b 1
    )
)

echo [INFO] Starting Telegram Bot locally...
python telegram_bot.py
pause
