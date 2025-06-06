#!/bin/bash
echo "🛑 停止飞书多维表格Web工具服务..."

# 查找并停止相关进程
pkill -f "npm run dev"
pkill -f "npm start"
pkill -f "node src/app.js"
pkill -f "react-scripts start"

echo "✅ 服务已停止"
