# 多人备忘录 — 完整项目文档

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [技术栈](#3-技术栈)
4. [项目结构](#4-项目结构)
5. [数据库设计](#5-数据库设计)
6. [API 接口文档](#6-api-接口文档)
7. [前端页面说明](#7-前端页面说明)
8. [后端代码说明](#8-后端代码说明)
9. [部署方案](#9-部署方案)
10. [开发与调试](#10-开发与调试)

---

## 1. 项目概述

一个支持多用户的在线备忘录（Notes）应用。用户可以注册账号、登录后创建/编辑/删除自己的备忘录，数据彼此隔离，互不可见。

**线上地址：** `https://wangweipoem.github.io/memo-backend/`

## 2. 系统架构

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│  GitHub Pages (静态前端)     │────▶│  Railway (后端 API)          │
│                             │     │                              │
│  index.html                 │     │  Express.js 服务              │
│  app.js                     │     │  JWT 身份认证                 │
│  style.css                  │     │  RESTful API                 │
│                             │     │                              │
└─────────────────────────────┘     └──────────┬───────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────────────────┐
                                    │  Railway MySQL (数据库)       │
                                    │                              │
                                    │  users 表                    │
                                    │  notes 表                    │
                                    └──────────────────────────────┘
```

**三部分协作流程：**

1. 用户浏览器加载 GitHub Pages 上的前端页面
2. 前端 JavaScript 通过 AJAX 请求调用 Railway 上的后端 API
3. 后端处理业务逻辑后读写 Railway 的 MySQL 数据库

**为什么这样设计？** GitHub Pages 只能托管静态文件（HTML/CSS/JS），不能运行 Node.js 或 MySQL。因此前端和后端必须分离部署。

## 3. 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | 原生 HTML + CSS + JavaScript | 无框架依赖，零构建步骤 |
| 后端 | Node.js + Express 5.x | 轻量级 Web 框架 |
| 数据库 | MySQL 8.x | 关系型数据库 |
| 认证 | JWT (JSON Web Token) | 无状态身份认证 |
| 密码 | bcrypt (10 rounds) | 密码哈希存储 |
| 前端托管 | GitHub Pages | 免费静态站点托管 |
| 后端托管 | Railway | Node.js + MySQL 一体化托管 |

## 4. 项目结构

```
memo-backend/
├── .gitignore                 # 忽略 node_modules 和 .env
├── render.yaml                # Render 部署配置（备用）
├── frontend/                  # 前端源码
│   ├── index.html             # 页面结构
│   ├── app.js                 # 前端逻辑
│   └── style.css              # 样式
├── docs/                      # GitHub Pages 部署目录（与 frontend 同步）
│   ├── index.html
│   ├── app.js
│   └── style.css
└── memo-backend/              # 后端代码
    ├── package.json           # 依赖配置
    ├── index.js               # Express 入口 + 中间件配置
    ├── config.js              # MySQL 连接池 + 自动建表
    ├── schema.sql             # 建表 SQL（手动执行用）
    ├── .env.example           # 环境变量模板
    ├── .env                   # 本地环境变量（不提交）
    ├── middleware/
    │   └── auth.js            # JWT 认证中间件
    └── routes/
        ├── auth.js            # 注册/登录路由
        └── notes.js           # 备忘录 CRUD 路由
```

## 5. 数据库设计

### users 表

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 用户 ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 邮箱（用作登录名） |
| password | VARCHAR(255) | NOT NULL | bcrypt 哈希后的密码 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 注册时间 |

### notes 表

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 备忘录 ID |
| user_id | INT | NOT NULL, FOREIGN KEY→users(id) | 所属用户 |
| title | VARCHAR(255) | NOT NULL | 标题 |
| content | TEXT | - | 内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 最后更新时间 |

**关键设计点：**
- `user_id` 外键关联实现数据隔离：每个用户只能看到自己的备忘录
- `ON DELETE CASCADE`：删除用户时自动清除其所有备忘录
- `updated_at` 自动更新：每次修改备忘录时自动记录时间

其中 `user_id` 是核心 — 每个备忘录通过这个字段关联到创建者。API 查询时加 `WHERE user_id = ?` 条件，确保用户 A 永远看不到用户 B 的备忘录。

## 6. API 接口文档

### 6.1 认证接口

#### POST /auth/register — 注册

```
POST https://memo-backend-production-8f82.up.railway.app/auth/register
Content-Type: application/json

{ "email": "user@example.com", "password": "123456" }
```
```json
// 成功 201
{ "message": "User registered successfully" }
// 失败 500
{ "message": "Registration failed", "error": "..." }
```

#### POST /auth/login — 登录

```
POST /auth/login
{ "email": "user@example.com", "password": "123456" }
```
```json
// 成功 200
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
// 失败 401
{ "message": "Invalid email or password" }
```

JWT 令牌有效期为 1 小时，包含 `{ id, email }` 载荷。

### 6.2 备忘录接口

所有接口需要 Authorization 头：`Authorization: Bearer <token>`

#### GET /notes — 获取列表

```
GET /notes
Authorization: Bearer eyJ...
```
```json
// 成功 200
[
  {
    "id": 1,
    "user_id": 1,
    "title": "购物清单",
    "content": "牛奶、面包",
    "created_at": "2026-05-13T08:00:00.000Z",
    "updated_at": "2026-05-13T08:30:00.000Z"
  }
]
```

按 `updated_at` 降序排列，最新的在前。

#### POST /notes — 新建

```
POST /notes
{ "title": "新备忘录", "content": "内容..." }
```
```json
// 成功 201
{ "id": 2, "title": "新备忘录", "content": "内容..." }
```

#### PUT /notes/:id — 更新

```
PUT /notes/2
{ "title": "修改后标题", "content": "修改后内容" }
```
```json
// 成功 200
{ "message": "Note updated" }
// 失败 404
{ "message": "Note not found" }
```

只能修改自己的备忘录。

#### DELETE /notes/:id — 删除

```
DELETE /notes/2
```
```json
// 成功 200
{ "message": "Note deleted" }
// 失败 404
{ "message": "Note not found" }
```

只能删除自己的备忘录。

## 7. 前端页面说明

前端是单页面应用（SPA），通过 CSS 控制两个视图的显隐切换。

### 状态切换流程

```
页面加载
    │
    ▼
检查 localStorage 是否有 token？
    │
    ├── 无 token → 显示登录/注册页
    │       │
    │       ├── 登录表单 → POST /auth/login → 保存 token → 刷新
    │       └── 注册表单 → POST /auth/register → 切换到登录
    │
    └── 有 token → 显示备忘录主页
            │
            ├── 顶部栏 → 邮箱显示 + 退出按钮
            ├── 左侧卡片 → 新建/编辑表单
            │       ├── 编辑模式 → 填入现有数据，提交时发 PUT
            │       └── 新建模式 → 提交时发 POST
            └── 右侧卡片 → 备忘录列表
                    ├── 每条 → 标题 + 内容 + 更新时间 + 编辑/删除按钮
                    └── 空列表 → 提示文字
```

### 关键设计

**1. Token 管理：** JWT 存储在 `localStorage`，每次 API 请求通过 `Authorization: Bearer` 头发送。前端通过解码 token 的 payload（Base64）显示用户邮箱。

**2. XSS 防护：** `escapeHtml()` 函数转义所有用户输入的 `< > & " '` 字符，防止注入攻击。

**3. 编辑模式复用：** 新建和编辑共用同一个表单。编辑时设置 `editingId` 变量，提交时据此判断发 POST 还是 PUT。

### 样式说明

- 使用 CSS 变量统一管理颜色和间距
- 双栏布局：屏幕宽 ≥ 700px 时并排显示（新建 + 列表），窄屏时堆叠
- 响应式设计：手机和桌面都可用

## 8. 后端代码说明

### 入口文件 index.js

负责组装 Express 应用：配置 CORS → 挂载中间件 → 注册路由 → 启动监听。

**CORS 白名单：**
```js
'https://wangweipoem.github.io',  // GitHub Pages
'http://localhost:3000',           // 本地开发
```

只有白名单中的来源才能跨域访问 API。

### 数据库连接 config.js

启动时自动完成两件事：
1. **创建连接池** — 支持 `DATABASE_URL`（Railway）和独立变量（本地 .env）两种配置方式
2. **自动建表** — 使用 `CREATE TABLE IF NOT EXISTS`，如果表不存在则自动创建

连接池限制 10 个并发连接，适合小型应用。

### JWT 认证中间件 middleware/auth.js

每个需要认证的请求到达时：
1. 从 `Authorization` 头提取 Bearer token
2. 用 `JWT_SECRET` 验证签名和有效期
3. 如果有效，解码出 `{ id, email }` 放到 `req.user` 上
4. 后续路由通过 `req.user.id` 识别当前用户

### 路由逻辑

**auth.js — 注册与登录**
- 注册：bcrypt 哈希密码 → INSERT 到 users 表
- 登录：查 users 表 → bcrypt 比对密码 → 生成 JWT

**notes.js — 备忘录 CRUD**
- 所有操作都带 `WHERE user_id = req.user.id` 条件，保证数据隔离
- 更新和删除额外检查 `affectedRows`，为 0 时返回 404

## 9. 部署方案

### 当前部署

| 组件 | 平台 | 地址 |
|------|------|------|
| 前端 | GitHub Pages | https://wangweipoem.github.io/memo-backend/ |
| 后端 | Railway | https://memo-backend-production-8f82.up.railway.app |
| 数据库 | Railway MySQL | 内网连接，不暴露公网 |

### GitHub Pages 配置

仓库 Settings → Pages → Source: `Deploy from a branch` → Branch: `main` + Folder: `/docs`

前端文件放在 `docs/` 目录下，每次 push 到 main 分支后 GitHub Pages 自动更新。

### Railway 配置

Railway 自动检测 Node.js 项目并部署。关键配置：

- **Build:** `npm install`（自动识别 package.json）
- **Start:** `npm start`（自动识别 start 脚本）
- **MySQL:** 在项目中添加 MySQL 服务，Railway 自动注入 `DATABASE_URL` 环境变量

`config.js` 中的 `getConfig()` 函数自动适配 Railway 的 `DATABASE_URL` 格式：

```js
// Railway 提供: DATABASE_URL=mysql://user:pass@host:port/db
// config.js 解析 URL → 提取 host/user/password/database → 创建连接池
```

### 本地开发步骤

```bash
# 1. 克隆项目
git clone https://github.com/wangweipoem/memo-backend.git
cd memo-backend/memo-backend

# 2. 安装依赖
npm install

# 3. 配置环境变量（复制 .env.example 为 .env，填入真实值）
cp .env.example .env

# 4. 创建数据库（或直接用自动建表功能）
# 确保 MySQL 运行中，数据库 memo_app 已创建

# 5. 启动后端
npm start
# 输出: Server running on port 3000

# 6. 打开前端
# 浏览器打开 ../frontend/index.html 即可
```

## 10. 开发与调试

### 测试 API

```bash
# 健康检查
curl https://memo-backend-production-8f82.up.railway.app/health

# 注册
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 登录（保存返回的 token）
TOKEN="eyJ..."

# 新建备忘录
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"标题","content":"内容"}'

# 获取列表
curl http://localhost:3000/notes -H "Authorization: Bearer $TOKEN"

# 更新
curl -X PUT http://localhost:3000/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"新标题","content":"新内容"}'

# 删除
curl -X DELETE http://localhost:3000/notes/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 环境变量说明

| 变量 | 说明 | 本地默认值 |
|------|------|-----------|
| DB_HOST | MySQL 主机 | localhost |
| DB_USER | MySQL 用户名 | root |
| DB_PASSWORD | MySQL 密码 | 123456 |
| DB_NAME | 数据库名 | memo_app |
| DB_PORT | MySQL 端口 | 3306 |
| DB_SSL | 是否启用 SSL | false |
| JWT_SECRET | JWT 签名密钥 | your_jwt_secret_key |
| PORT | 后端端口 | 3000 |

Railway 环境下会自动使用 `DATABASE_URL`，无需手动设置上述数据库变量。

### 常见问题

**Q: 前端打开后看不到自己的备忘录？**
A: 不同账号的数据完全隔离，检查是否用同一个邮箱登录。

**Q: 注册时提示 "Registration failed"？**
A: 通常是邮箱已被注册，换一个邮箱试试。

**Q: 本地开发时前端连不上后端？**
A: 确认后端已启动（`npm start`），且 `frontend/app.js` 的 `API_URL` 是 `http://localhost:3000`。

**Q: 部署后前端打不开？**
A: 等待 GitHub Pages 构建完成（通常 1-2 分钟），检查仓库 Settings → Pages 是否已启用。
