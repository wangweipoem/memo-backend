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

// 路由
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));