@echo off
chcp 65001 >nul
title Image Cropping Tool - Production

echo ====================================================
echo   图片梯形裁剪校正工具 - 生产环境
echo ====================================================
echo.

echo [1/2] 构建前端...
cd frontend
if not exist node_modules (
    echo 安装依赖...
    call npm install
)

echo 构建生产版本...
call npm run build

echo.
echo [2/2] 启动 API 服务...
cd ..
echo.
echo 生产环境 API 服务启动在: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo.
echo 前端构建文件位于: frontend/dist/
echo 可以使用任何静态文件服务器托管前端
echo.

python main.py

pause
