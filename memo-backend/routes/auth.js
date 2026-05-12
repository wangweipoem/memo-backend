const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Registration failed', error: err });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// 用户登录
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

module.exports = router;