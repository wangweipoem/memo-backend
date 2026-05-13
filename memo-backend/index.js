require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();

// CORS — 允许 GitHub Pages 和本地开发
const allowedOrigins = [
    'https://wangweipoem.github.io',
    'https://memo-backend-production-8f82.up.railway.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
];
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
    },
}));

app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '多人备忘录 API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            auth: {
                register: 'POST /auth/register',
                login: 'POST /auth/login',
            },
            notes: {
                list: 'GET /notes',
                create: 'POST /notes',
                update: 'PUT /notes/:id',
                delete: 'DELETE /notes/:id',
            },
        },
    });
});

// 路由
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
