require('dotenv').config();
const mysql = require('mysql2');

function getConfig() {
    // 支持 Railway 的环境变量名 + 通用 DATABASE_URL
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (url) {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port) || 3306,
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.slice(1),
            waitForConnections: true,
            connectionLimit: 10,
        };
    }
    // 本地 .env 或 Railway 独立变量
    return {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'memo_app',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
}

const config = getConfig();
console.log('DB Config:', { host: config.host, port: config.port, user: config.user, database: config.database });
let pool;
try {
    pool = mysql.createPool(config);
    console.log('Database pool created');
} catch (err) {
    console.error('Failed to create pool:', err.message);
    process.exit(1);
}

// 自动建表
async function migrate() {
    const p = pool.promise();
    try { await p.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`); console.log('Users table ready'); } catch (err) { console.error('Create users:', err.message); }
    try { await p.query(`CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`); console.log('Notes table ready'); } catch (err) { console.error('Create notes:', err.message); }
}
migrate();

module.exports = pool;
