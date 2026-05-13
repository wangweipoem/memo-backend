const express = require('express');
const db = require('../config');

const router = express.Router();

// 密码验证中间件 — 检查 Authorization 请求头或 password 查询参数
const requireAdminPassword = (req, res, next) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return res.status(500).json({ message: 'Admin password not configured' });
    }

    const authHeader = req.headers['authorization'];
    const queryPassword = req.query.password;

    const provided = authHeader || queryPassword;

    if (!provided || provided !== adminPassword) {
        return res.status(401).json({ message: 'Unauthorized: invalid or missing admin password' });
    }

    next();
};

// 所有 /admin/* 路由均需通过密码验证
router.use(requireAdminPassword);

// 获取所有用户（不含密码）
router.get('/users', (req, res) => {
    db.query('SELECT id, email, created_at FROM users ORDER BY id ASC', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to retrieve users', error: err.message });
        }
        res.json({ total: results.length, users: results });
    });
});

// 获取所有备忘录
router.get('/notes', (req, res) => {
    db.query(
        `SELECT n.id, n.user_id, u.email AS user_email, n.title, n.content, n.created_at, n.updated_at
         FROM notes n
         JOIN users u ON u.id = n.user_id
         ORDER BY n.updated_at DESC`,
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to retrieve notes', error: err.message });
            }
            res.json({ total: results.length, notes: results });
        }
    );
});

// 获取特定用户的备忘录
router.get('/users/:id/notes', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT id, email, created_at FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to retrieve user', error: err.message });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResults[0];
        db.query(
            'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
            [userId],
            (err, noteResults) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to retrieve notes', error: err.message });
                }
                res.json({
                    user,
                    total: noteResults.length,
                    notes: noteResults,
                });
            }
        );
    });
});

module.exports = router;
