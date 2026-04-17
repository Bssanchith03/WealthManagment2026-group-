const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'investflow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create DB if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'investflow'}\`;`);
    await connection.end();

    // Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        liquid_cash DECIMAL(15, 2) DEFAULT 0.00,
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        shares DECIMAL(15, 4) NOT NULL DEFAULT 0,
        average_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS watchlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY user_symbol (user_id, symbol)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        type ENUM('BUY', 'SELL') NOT NULL,
        shares DECIMAL(15, 4) NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        monthly_cost DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fixed_deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        principal_amount DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        duration_months INT NOT NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('Home', 'Car', 'Business', 'Education') NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        principal_amount DECIMAL(15, 2) NOT NULL,
        remaining_balance DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        duration_months INT NOT NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_type ENUM('Regular', 'Extra') DEFAULT 'Regular',
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        company VARCHAR(255) NOT NULL,
        package_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        frequency VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('Database and tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing database: ', err);
  }
}

module.exports = { pool, initDB };
