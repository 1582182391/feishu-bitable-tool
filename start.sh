#!/bin/bash

echo "🚀 启动飞书多维表格Web工具 v2.0"
echo "=================================="

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $node_version"
else
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 项目目录: $SCRIPT_DIR"

# 启动后端服务
echo ""
echo "🔧 启动后端服务..."
cd "$SCRIPT_DIR/backend"
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
sleep 3

# 启动前端服务
echo ""
echo "🎨 启动前端服务..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🚀 启动前端服务 (端口: 3000)..."
npm start &
FRONTEND_PID=$!
echo "前端进程ID: $FRONTEND_PID"

echo ""
echo "✅ 服务启动完成！"
echo "=================================="
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo "=================================="
echo ""
echo "💡 使用说明:"
echo "1. 打开浏览器访问 http://localhost:3000"
echo "2. 在表格配置区域输入App Token和Table ID"
echo "3. 点击'连接表格'按钮获取字段信息"
echo "4. 在数据输入区域填写数据并提交"
echo ""
echo "🛑 停止服务: 按 Ctrl+C"
echo ""

# 创建停止脚本
cat > "$SCRIPT_DIR/stop.sh" << 'EOF'
#!/bin/bash
echo "🛑 停止飞书多维表格Web工具服务..."

# 查找并停止相关进程
pkill -f "npm run dev"
pkill -f "npm start"
pkill -f "node src/app.js"
pkill -f "react-scripts start"

echo "✅ 服务已停止"
EOF

chmod +x "$SCRIPT_DIR/stop.sh"

# 等待用户中断
wait 