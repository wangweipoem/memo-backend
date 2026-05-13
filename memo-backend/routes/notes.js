const express = require('express');
const db = require('../config');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 获取备忘录
router.get('/', authenticate, (req, res) => {
    db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to retrieve notes' });
        }
        res.json(results);
    });
});

// 新建备忘录
router.post('/', authenticate, (req, res) => {
    const { title, content } = req.body;
    db.query('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', [req.user.id, title, content], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to add note' });
        }
        res.status(201).json({ id: result.insertId, title, content });
    });
});

// 更新备忘录
router.put('/:id', authenticate, (req, res) => {
    const { title, content } = req.body;
    db.query(
        'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
        [title, content, req.params.id, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed to update note' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found' });
            res.json({ message: 'Note updated' });
        }
    );
});

// 删除备忘录
router.delete('/:id', authenticate, (req, res) => {
    db.query(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed to delete note' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found' });
            res.json({ message: 'Note deleted' });
        }
    );
});

module.exports = router;
