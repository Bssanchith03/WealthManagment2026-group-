const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'investflow',
  });

  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);
    
    const [users] = await pool.query('SELECT id, email FROM users');
    console.log('Users:', users);
    
    const [subs] = await pool.query('SELECT * FROM subscriptions');
    console.log('Subscriptions:', subs);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

check();
