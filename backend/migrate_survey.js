const { pool } = require('./db');

async function checkSchema() {
  try {
    console.log("Checking users table schema...");
    const [rows] = await pool.query("DESCRIBE users");
    console.log("Columns:", rows.map(r => r.Field).join(', '));
    
    if (!rows.find(r => r.Field === 'investment_plan')) {
      console.log("Adding investment_plan column...");
      await pool.query("ALTER TABLE users ADD COLUMN investment_plan JSON DEFAULT NULL AFTER liquid_cash");
      console.log("Column added successfully!");
    } else {
      console.log("Column already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

checkSchema();
