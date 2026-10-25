@echo off
title femsyc - Women's Health Companion
echo ========================================================
echo   🌸 Starting femsyc - Women's Health Companion...
echo ========================================================
set "PATH=%LOCALAPPDATA%\nodejs;%PATH%"

cd /d "%~dp0"
node server.js
pause
