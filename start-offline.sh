#!/bin/bash
echo "正在启动多人备忘录（离线模式）..."
cd "$(dirname "$0")/memo-backend"
node index.js &
sleep 2
echo "后端已启动: http://localhost:3000"
echo "正在打开前端页面..."
open "$(dirname "$0")/frontend/index.html" 2>/dev/null || xdg-open "$(dirname "$0")/frontend/index.html" 2>/dev/null
echo "按 Ctrl+C 停止后端"
wait
