const express = require('express');
const db = require('../config');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 获取备忘录
router.get('/', authenticate, (req, res) => {
    db.query('SELECT * FROM notes WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to retrieve notes' });
        }
        res.json(results);
    });
});

// 新建备忘录
router.post('/', authenticate, (req, res) => {
    const { title, content } = req.body;
    db.query('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', [req.user.id, title, content], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to add note' });
        }
        res.status(201).json({ message: 'Note added successfully' });
    });
});

module.exports = router;