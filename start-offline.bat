@echo off
echo 正在启动多人备忘录（离线模式）...

cd /d "%~dp0memo-backend"
start /min cmd /c "node index.js"

timeout /t 3 /nobreak >nul
echo.
echo 后端已启动: http://localhost:3000
echo 正在打开前端页面...
start "" "%~dp0frontend\index.html"
echo.
echo 关闭此窗口不会停止后端。要停止后端请打开任务管理器关闭 node.exe
pause
