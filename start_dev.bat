@echo off
chcp 65001 >nul
title Image Cropping Tool - Development Server

echo ====================================================
echo   图片梯形裁剪校正工具 - 开发环境启动
echo ====================================================
echo.

echo [1/3] 检查依赖...
echo.

rem 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装或不在 PATH 中
    echo 请先安装 Python 3.8 或更高版本
    pause
    exit /b 1
)

rem 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装或不在 PATH 中
    echo 请先安装 Node.js 16 或更高版本
    pause
    exit /b 1
)

echo ✅ Python 和 Node.js 已安装
echo.

echo [2/3] 启动后端 API 服务...
echo.
echo 正在启动 FastAPI 服务 (端口: 8000)...
start "API Server" cmd /k "python main.py"

rem 等待 API 启动
timeout /t 3 /nobreak >nul

echo [3/3] 启动前端开发服务器...
echo.
echo 正在启动 React 开发服务器 (端口: 5173)...

cd frontend
if not exist node_modules (
    echo 正在安装前端依赖...
    npm install
)

start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ====================================================
echo   🚀 开发环境启动完成!
echo ====================================================
echo.
echo 📱 前端应用:     http://localhost:5173
echo 🔧 API 文档:     http://localhost:8000/docs
echo 📚 备用文档:     http://localhost:8000/redoc
echo.
echo 💡 提示:
echo    - 修改后端代码会自动重载
echo    - 修改前端代码会自动热更新
echo    - 按 Ctrl+C 停止对应的服务
echo.

timeout /t 5 /nobreak >nul
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo 按任意键关闭此窗口...
pause >nul
