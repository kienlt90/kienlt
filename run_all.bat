@echo off
title Telegram Bot Runner
echo ===================================================
echo   Khoi dong Telegram Bot
echo ===================================================
echo.

:: 1. Dong cac tien trinh cu de tranh xung dot port va phien lam viec
echo [INFO] Dang tat cac tien trinh cu de tranh xung dot...
wmic process where "commandline like '%%telegram_bot.py%%'" call terminate >nul 2>&1

:: 2. Mo Telegram Bot
echo [INFO] Dang mo Telegram Bot...
cd /d "c:\Users\kienlt.bdg\Downloads\kienlt90"
start "" python telegram_bot.py

echo [SUCCESS] Telegram Bot da duoc khoi dong!
timeout /t 3 >nul
exit
