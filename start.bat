@echo off
chcp 65001 >nul
cd /d %~dp0
title 舒尔特方格 · 账号存档服务

echo  检查服务是否已在运行...
netstat -ano | findstr "0.0.0.0:3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo  服务已在运行，直接打开页面
) else (
  echo  正在启动服务...
  start "" /min node server.js
  timeout /t 1 /nobreak >nul
)

start http://localhost:3000
exit