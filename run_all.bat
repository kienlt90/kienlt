@echo off
title Chrome Debugger and Telegram Bot Runner
echo ===================================================
echo   Khoi dong Chrome Debugger va Telegram Bot
echo ===================================================

:: 1. Dong cac tien trinh cu de tranh xung dot port va phien lam viec
echo [INFO] Dang tat cac tien trinh cu de tranh xung dot...
taskkill /F /IM chrome.exe >nul 2>&1
:: Tim va tat cac python dang chay telegram_bot.py bang wmic/powershell
wmic process where "commandline like '%%telegram_bot.py%%'" call terminate >nul 2>&1

:: 2. Mo Chrome voi Remote Debugging Port 9222
echo [INFO] Dang mo Chrome o port 9222 va truy cap dashboard...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\kienlt.bdg\ChromeDebug" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding "https://cds.hcmict.io/#/work/current_work_dashboard"

:: Cho 3 giay de Chrome khoi dong xong
timeout /t 3 >nul

:: 3. Mo Telegram Bot
echo [INFO] Dang mo Telegram Bot...
cd /d "c:\Users\kienlt.bdg\Downloads\kienlt90"
start "" python telegram_bot.py

echo [SUCCESS] Chrome Debugger va Telegram Bot da duoc khoi dong!
timeout /t 3 >nul
exit
