#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 飞书多维表格Web工具 - 一键重启"
echo "=================================="
echo "📁 项目目录: $SCRIPT_DIR"

# 第一步：停止所有相关进程
echo ""
echo "🛑 第一步：停止现有服务..."
pkill -f "npm run dev" 2>/dev/null && echo "✅ 已停止后端开发服务"
pkill -f "npm start" 2>/dev/null && echo "✅ 已停止前端服务"
pkill -f "node src/app.js" 2>/dev/null && echo "✅ 已停止Node.js应用"
pkill -f "react-scripts start" 2>/dev/null && echo "✅ 已停止React开发服务器"

# 第二步：强制清理端口
echo ""
echo "🧹 第二步：清理端口占用..."

# 清理3000端口
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    echo "发现端口3000被占用，正在清理..."
    kill -9 $PORT_3000 2>/dev/null
    echo "✅ 端口3000已清理"
else
    echo "✅ 端口3000未被占用"
fi

# 清理3001端口
PORT_3001=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PORT_3001" ]; then
    echo "发现端口3001被占用，正在清理..."
    kill -9 $PORT_3001 2>/dev/null
    echo "✅ 端口3001已清理"
else
    echo "✅ 端口3001未被占用"
fi

# 第三步：等待系统稳定
echo ""
echo "⏳ 第三步：等待系统稳定..."
for i in {5..1}; do
    echo "等待 $i 秒..."
    sleep 1
done
echo "✅ 系统已稳定"

# 第四步：检查环境
echo ""
echo "📋 第四步：检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $node_version"
else
    echo "❌ 未找到Node.js，请先安装Node.js"
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 第五步：启动后端服务
echo ""
echo "🔧 第五步：启动后端服务..."
cd "$SCRIPT_DIR/backend"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

echo "🚀 启动后端服务 (端口: 3001)..."
npm run dev &
BACKEND_PID=$!
echo "后端进程ID: $BACKEND_PID"

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 验证后端服务
echo "🔍 验证后端服务..."
for i in {1..10}; do
    BACKEND_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
    if [[ $BACKEND_CHECK == *"ok"* ]]; then
        echo "✅ 后端服务启动成功"
        break
    else
        echo "⏳ 等待后端服务启动... ($i/10)"
        sleep 2
    fi
done

# 第六步：启动前端服务
echo ""
echo "🎨 第六步：启动前端服务..."
cd "$SCRIPT_DIR/frontend"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🚀 启动前端服务 (端口: 3000)..."
npm start &
FRONTEND_PID=$!
echo "前端进程ID: $FRONTEND_PID"

# 第七步：最终验证
echo ""
echo "🔍 第七步：最终验证..."
sleep 8

# 验证端口状态
echo "检查端口状态："
if lsof -i:3001 >/dev/null 2>&1; then
    echo "✅ 端口3001 (后端) - 正常运行"
else
    echo "❌ 端口3001 (后端) - 未运行"
fi

if lsof -i:3000 >/dev/null 2>&1; then
    echo "✅ 端口3000 (前端) - 正常运行"
else
    echo "❌ 端口3000 (前端) - 未运行"
fi

# 验证API接口
echo ""
echo "验证API接口："
API_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
if [[ $API_CHECK == *"ok"* ]]; then
    echo "✅ 后端API - 正常响应"
else
    echo "❌ 后端API - 无响应"
fi

# 完成信息
echo ""
echo "🎉 重启完成！"
echo "=================================="
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo "=================================="
echo ""
echo "💡 使用说明:"
echo "1. 浏览器会自动打开前端页面"
echo "2. 在表格配置区域输入App Token和Table ID"
echo "3. 点击'连接表格'按钮获取字段信息"
echo "4. 选择左侧菜单中的功能进行操作"
echo ""

# 自动打开浏览器
echo "🌐 正在打开浏览器..."
sleep 2
open http://localhost:3000

echo ""
echo "🛑 要停止服务，请关闭此窗口或按 Ctrl+C"
echo ""

# 保存PID到文件
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

# 等待用户中断
echo "⌨️ 服务正在运行中... (关闭窗口或按 Ctrl+C 停止)"

# 设置陷阱来处理退出信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT TERM

# 等待进程
wait 