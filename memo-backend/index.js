require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();

// 中间件
app.use(bodyParser.json());
app.use(cors());

// 根路径 - 欢迎页面
app.get('/', (req, res) => {
    res.json({
        message: '多人备忘录 API 服务',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /auth/register',
                login: 'POST /auth/login'
            },
            notes: {
                list: 'GET /notes (需要认证)',
                create: 'POST /notes (需要认证)'
            }
        }
    });
});

// 路由
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));