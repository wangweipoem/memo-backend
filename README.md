# 多人备忘录后端服务

一个基于 Node.js + Express + MySQL 的多人备忘录系统后端 API。

## 功能特性

- 👤 用户注册和登录（JWT 认证）
- 📝 创建、查询、更新、删除备忘录
- 🔐 基于 JWT 的身份验证
- 🗄️ MySQL 数据库存储

## 技术栈

- **Node.js** - 运行时环境
- **Express** - Web 框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密

## 快速开始

### 前置要求

- Node.js (推荐 v14+)
- MySQL 数据库

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repository-url>
cd memo-backend/memo-backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的数据库信息和其他设置：
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=memo_app
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. **创建数据库**

在 MySQL 中创建数据库：
```sql
CREATE DATABASE memo_app;
```

5. **启动服务**

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务将在 `http://localhost:3000` 运行。

## API 接口

### 认证接口

#### 注册用户
```
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 用户登录
```
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### 备忘录接口

所有备忘录接口需要在 Header 中携带 JWT Token：
```
Authorization: Bearer <your_token>
```

#### 创建备忘录
```
POST /notes
Content-Type: application/json

{
  "title": "我的备忘录",
  "content": "这是备忘录内容"
}
```

#### 获取所有备忘录
```
GET /notes
```

#### 获取单个备忘录
```
GET /notes/:id
```

#### 更新备忘录
```
PUT /notes/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

#### 删除备忘录
```
DELETE /notes/:id
```

## 项目结构

```
memo-backend/
├── middleware/
│   └── auth.js          # JWT 认证中间件
├── routes/
│   ├── auth.js          # 认证路由
│   └── notes.js         # 备忘录路由
├── config.js            # 数据库配置
├── index.js             # 应用入口
├── package.json         # 项目依赖
├── .env.example         # 环境变量示例
└── .gitignore           # Git 忽略文件
```

## 注意事项

⚠️ **重要安全提示：**

1. **不要将 `.env` 文件提交到 Git** - 包含敏感信息（数据库密码、JWT 密钥等）
2. **修改 JWT_SECRET** - 使用强随机字符串作为 JWT 密钥
3. **生产环境** - 建议使用更安全的数据库连接池配置
4. **HTTPS** - 生产环境应启用 HTTPS

## 部署建议

### 云平台部署

- **Vercel/Heroku/Railway** - 需要配置环境变量
- **阿里云/腾讯云** - 云服务器部署
- **Docker** - 容器化部署

### 环境变量配置

在生产环境中，通过平台的环境变量配置功能设置：
- `DB_HOST` - 数据库主机地址
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `JWT_SECRET` - JWT 密钥（使用强随机字符串）
- `PORT` - 服务端口

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！
