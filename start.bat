@echo off
cd /d %~dp0
title 舒尔特方格 · 账号存档服务

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
if %errorlevel%==0 (
  echo  服务已在运行，直接打开页面
) else (
  echo  正在启动服务...
  start "" /min cmd /c "cd /d %~dp0backend && node server.js"
  timeout /t 2 /nobreak >nul
)

start http://localhost:3000
exit
