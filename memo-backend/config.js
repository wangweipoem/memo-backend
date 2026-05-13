require('dotenv').config();
const mysql = require('mysql2');

function getConfig() {
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (url) {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parsed.port || 3306,
            user: parsed.username,
            password: parsed.password,
            database: parsed.pathname.slice(1),
            waitForConnections: true,
            connectionLimit: 10,
        };
    }
    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
}

const pool = mysql.createPool(getConfig());

// 自动建表
pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB`).catch(err => console.error('Create users table:', err.message));

pool.query(`CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB`).catch(err => console.error('Create notes table:', err.message));

module.exports = pool;
