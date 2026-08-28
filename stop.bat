@echo off
cd /d %~dp0
title 舒尔特方格 - 停止服务

for /f "tokens=5" %%a in ('netstat -ano ^| findstr "0.0.0.0:3000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>nul

echo  服务已停止
timeout /t 1 /nobreak >nul
exit
