#!/bin/bash

# 飞书搜索+写入工具启动脚本（精简版）
# 只包含搜索+写入功能

echo "🚀 启动飞书搜索+写入工具（精简版）"
echo "=================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "node.*backend.*app.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

# 清理端口
echo "🧹 清理端口..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 检查后端依赖
echo "📦 检查后端依赖..."
if [ ! -d "backend/node_modules" ]; then
    echo "📥 安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查前端依赖
echo "📦 检查前端依赖..."
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端健康状态
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功 (http://localhost:3001)"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ 后端服务启动失败，请检查日志: backend.log"
        exit 1
    fi
    echo "⏳ 等待后端服务... ($i/10)"
    sleep 2
done

# 启动前端服务
echo "🎨 启动前端服务..."
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 5

# 检查前端服务
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 前端服务启动成功 (http://localhost:3000)"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ 前端服务启动失败，请检查日志: frontend.log"
        exit 1
    fi
    echo "⏳ 等待前端服务... ($i/15)"
    sleep 2
done

echo ""
echo "🎉 飞书搜索+写入工具启动完成！"
echo "=================================="
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo "📋 功能: 搜索+写入（从想法到表格的完整流程）"
echo ""
echo "💡 使用说明:"
echo "1. 在浏览器中打开 http://localhost:3000"
echo "2. 输入任何内容（如：手机产品、员工信息等）"
echo "3. 点击'开始搜索+写入'按钮"
echo "4. 等待5个步骤完成"
echo "5. 获得飞书表格链接"
echo ""
echo "📝 日志文件:"
echo "- 后端日志: backend.log"
echo "- 前端日志: frontend.log"
echo ""

# 自动打开浏览器
if command -v open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    sleep 2
    open http://localhost:3000
fi

echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; pkill -f "node.*backend.*app.js"; pkill -f "react-scripts start"; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done 