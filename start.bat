@echo off
chcp 65001 >nul
title 启动人体数字孪生（肺部）临床与双超算交互系统

echo ==============================================================================
echo  正在启动 人体数字孪生（肺部）临床与双超算交互系统
echo ==============================================================================

:: 1. 检查并读取 .env 配置
if exist "%~dp0.env" (
    echo [OK] 已检测到根目录 .env 配置文件
) else (
    echo [提示] 未找到根目录 .env，使用系统默认连接参数
)

:: 2. 启动 Python Flask 后端服务 (端口 5000)
echo [1/2] 正在启动 Python 后端推流引擎 (http://localhost:5000)...
start "DigitalTwin-Backend-5000" cmd /k "cd /d %~dp0backend && python app.py"

:: 3. 启动 Vite 前端服务 (端口 3000)
echo [2/2] 正在启动 React 3D 前端工作台 (http://localhost:3000)...
start "DigitalTwin-Frontend-3000" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ==============================================================================
echo  系统启动指令已全部成功下发！
echo  电脑端访问地址:   http://localhost:3000
echo  后端 API 与流服务: http://localhost:5000/api
echo ==============================================================================
echo.

:: 4. 调用二维码脚本在终端打印手机扫码二维码
if exist "%~dp0show_qr.py" (
    python "%~dp0show_qr.py"
) else (
    echo [提示] 手机端打开方式：确保手机与电脑在同一 Wi-Fi，访问电脑局域网 IP:3000
)

pause
