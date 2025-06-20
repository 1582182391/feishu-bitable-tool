# 飞书多维表格管理工具 v2.0

一个功能完整的飞书多维表格管理工具，支持AI生成内容、批量数据导入、实时对话等功能。

## ✨ 主要功能

### 🏗️ 表格管理
- **一键创建表格**：同时创建多维表格应用和表格，使用相同名称
- **创建多维表格**：创建新的飞书多维表格应用
- **添加一张表**：在现有应用中添加新的数据表
- **全部表格**：查看和管理所有创建过的表格，支持快速连接

### 📊 数据操作
- **添加表记录**：向表格中添加新的数据记录
- **删除表记录**：删除表格中的指定记录
- **导出多维表格**：将表格数据导出为JSON文件
- **JSON文件导入**：从本地JSON文件批量导入数据

### 🤖 AI功能
- **AI生成内容**：使用AI根据提示词自动生成内容填充表格
- **AI实时对话**：集成DeepSeek Chat API的聊天功能
- **搜索功能**：AI生成JSON数据并提供下载
- **搜索+写入**：一站式流程，从想法到表格一步完成

### ✏️ 编辑功能
- **修改字段**：修改表格字段的名称和属性
- **修改表格名称**：修改表格的名称

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```env
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
PORT=3001
```

### 启动服务

#### 方式一：使用一键启动脚本
```bash
# 双击运行（macOS）
./重启服务.command

# 或者在终端中运行
chmod +x 重启服务.command
./重启服务.command
```

#### 方式二：手动启动
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务（新终端窗口）
cd frontend
npm start
```

### 访问应用
- 前端界面：http://localhost:3000
- 后端API：http://localhost:3001

## 📋 功能详解

### 🔍 搜索+写入功能
完整的5步流程：
1. **AI生成数据**：根据搜索内容生成结构化JSON数据
2. **创建应用**：自动创建飞书多维表格应用
3. **创建表格**：创建包含4个字段的数据表格
4. **批量导入**：分批导入生成的数据，避免API限流
5. **生成链接**：提供可直接访问的飞书表格链接

### 🤖 AI集成
- **模型**：DeepSeek Chat (deepseek-v3)
- **API**：支持OpenAI兼容格式
- **功能**：内容生成、实时对话、数据结构化

### 📁 数据格式
标准的4字段表格结构：
- **序号**：数据编号
- **文本1**：主要内容/名称
- **文本2**：描述信息
- **文本3**：备注/补充信息

## 🛠️ 技术栈

### 前端
- React 18
- TypeScript
- Ant Design 5.x
- Axios

### 后端
- Node.js
- Express
- 飞书开放平台SDK
- Joi（数据验证）

## 📖 使用说明

### 创建表格
1. 选择"一键创建表格"功能
2. 输入表格名称
3. 系统自动创建应用和表格

### AI生成内容
1. 在添加记录时点击"AI生成"
2. 输入描述性提示词
3. 选择是否直接提交到表格

### 批量导入
1. 准备JSON文件（包含序号、文本1、文本2、文本3字段）
2. 使用"JSON文件导入"功能
3. 选择文件并确认导入

### 搜索+写入
1. 点击"搜索+写入"菜单
2. 输入搜索内容（如"手机产品"）
3. 等待5个步骤完成
4. 获得包含数据的飞书表格链接

## 📁 项目结构

```
feishu-latest/
├── frontend/          # React前端应用
├── backend/           # Node.js后端API
├── v1.0-original/     # 原始v1.0版本文件（已保留）
├── 搜索生成的JSON文件/ # AI生成的示例数据
├── *.md              # 功能说明文档
├── *.json            # 测试数据文件
└── 重启服务.command   # 一键启动脚本
```

## 📝 更新日志

### v2.0 (2025-06-10) - 完整重构版本
- ✅ **架构升级**：从单文件脚本升级为前后端分离的Web应用
- ✅ **新增功能**：搜索+写入一站式功能
- ✅ **AI集成**：DeepSeek Chat API实时对话功能
- ✅ **批量操作**：JSON文件导入流程优化
- ✅ **用户体验**：现代化Web界面，实时步骤反馈
- ✅ **开发体验**：一键启动脚本，完善的错误处理

### v1.0 (2025-06-04) - 原始版本 
- ✅ **基础功能**：飞书表格的基本CRUD操作
- ✅ **API集成**：直接调用飞书开放平台API
- ✅ **脚本工具**：命令行方式的数据导入导出
- 📁 **文件保留**：原始文件已保存在 `v1.0-original/` 目录中

> **注意**：v1.0和v2.0是完全不同的实现方式。v1.0是简单的Node.js脚本集合，v2.0是完整的Web应用。两个版本的文件都已保留，可以根据需要选择使用。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请通过GitHub Issues联系。 