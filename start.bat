@echo off
cd /d %~dp0
title 舒尔特方格

if not exist "node_modules" (
  echo  首次使用，正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo  依赖安装失败，请检查 Node 环境
    pause
    exit /b 1
  )
)

if not exist "frontend\dist\index.html" (
  echo  前端尚未构建，正在构建...
  call npm run build
  if errorlevel 1 (
    echo  前端构建失败，请重新执行 npm run build
    pause
    exit /b 1
  )
)

echo  检查服务是否已在运行...
netstat -ano | findstr "0.0.0.0:3000" | findstr "LISTENING" >nul
if %errorlevel%==0 goto :open

echo  正在后台启动服务（无窗口，关闭任何窗口均不影响）...
powershell -NoProfile -Command "Start-Process node -ArgumentList 'server.js' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden"

:waitopen
timeout /t 2 /nobreak >nul

:open
start http://localhost:3000
exit
