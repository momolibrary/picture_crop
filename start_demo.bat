@echo off
chcp 65001 >nul
title 图片处理工具 - 进度条演示

echo ========================================
echo 图片梯形裁剪校正工具 - 进度条功能演示
echo ========================================
echo.

echo 正在启动服务...
echo.

echo [1/2] 启动后端 API 服务...
start "后端API" cmd /k "cd /d "%~dp0" && python main.py"

echo 等待后端服务启动... (3秒)
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端开发服务...
start "前端DEV" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo 🎉 服务启动完成！
echo ========================================
echo.
echo 📝 使用说明:
echo   • 后端API: http://localhost:8000
echo   • 前端界面: http://localhost:5173
echo   • API文档: http://localhost:8000/docs
echo.
echo 🎯 进度条演示:
echo   1. 打开前端界面 (http://localhost:5173)
echo   2. 上传一些图片文件
echo   3. 在图片列表标题区域查看进度条
echo   4. 使用开发工具面板测试进度演示
echo   5. 或在浏览器控制台使用 window.progressDemo
echo.
echo 📚 详细文档:
echo   • PROGRESS_BAR_GUIDE.md - 功能详细说明
echo   • PROGRESS_DEMO_GUIDE.md - 演示操作指南
echo.
echo 按任意键关闭此窗口...
pause >nul
