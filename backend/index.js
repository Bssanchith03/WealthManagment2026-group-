const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Auth Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, isSignUp, initialCash } = req.body;
  
  if (!email) return res.status(400).json({ error: 'Email required' });

  let [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  let user;
  
  if (users.length === 0) {
    if (!isSignUp) return res.status(404).json({ error: 'Account not found. Please sign up.' });
    
    const startingCash = initialCash ? parseFloat(initialCash) : 0;
    const [result] = await pool.query(
      'INSERT INTO users (email, name, liquid_cash) VALUES (?, ?, ?)',
      [email, email.split('@')[0], startingCash]
    );
    user = { id: result.insertId, email, name: email.split('@')[0], liquid_cash: startingCash };
  } else {
    if (isSignUp) return res.status(400).json({ error: 'Account already exists.' });
    user = users[0];
  }
  
  res.json({ token: 'placeholder_token', user });
});

// Portfolio Details
app.get('/api/portfolio/:userId', async (req, res) => {
  const { userId } = req.params;
  const [users] = await pool.query('SELECT liquid_cash FROM users WHERE id = ?', [userId]);
  const [holdings] = await pool.query('SELECT symbol, shares, average_price FROM holdings WHERE user_id = ?', [userId]);
  const [watchlist] = await pool.query('SELECT symbol FROM watchlists WHERE user_id = ?', [userId]);

  if (!users.length) return res.status(404).json({ error: 'User not found' });

  // In a real app we'd calculate live portfolio value by querying the python service here,
  // but for now we'll just return the counts and the frontend can fetch live prices.
  res.json({
    liquid_cash: users[0].liquid_cash,
    holdings,
    watchlist: watchlist.map(w => w.symbol)
  });
});

// Action Endpoints
app.post('/api/watchlist', async (req, res) => {
  const { userId, symbol, action } = req.body; // action: 'add' or 'remove'
  if (action === 'add') {
    await pool.query('INSERT IGNORE INTO watchlists (user_id, symbol) VALUES (?, ?)', [userId, symbol]);
  } else {
    await pool.query('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [userId, symbol]);
  }
  res.json({ success: true });
});

// Add invest placeholder logic
app.post('/api/invest', async (req, res) => {
  const { userId, symbol, type, shares, price } = req.body; // type: BUY, SELL
  const totalCost = shares * price;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [user] = await connection.query('SELECT liquid_cash FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!user.length) throw new Error("User not found");
    let currentCash = parseFloat(user[0].liquid_cash);

    if (type === 'BUY') {
      if (currentCash < totalCost) throw new Error("Insufficient funds");
      await connection.query('UPDATE users SET liquid_cash = liquid_cash - ? WHERE id = ?', [totalCost, userId]);
      
      const [existingHolding] = await connection.query('SELECT shares, average_price FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      if (existingHolding.length > 0) {
        let oldShares = parseFloat(existingHolding[0].shares);
        let oldPrice = parseFloat(existingHolding[0].average_price);
        let newShares = oldShares + shares;
        let newAvgPrice = ((oldShares * oldPrice) + (shares * price)) / newShares;
        await connection.query('UPDATE holdings SET shares = ?, average_price = ? WHERE user_id = ? AND symbol = ?', [newShares, newAvgPrice, userId, symbol]);
      } else {
        await connection.query('INSERT INTO holdings (user_id, symbol, shares, average_price) VALUES (?, ?, ?, ?)', [userId, symbol, shares, price]);
      }
    } else {
       // SELL logic omitted for brevity as it's just inverse
    }

    await connection.query('INSERT INTO transactions (user_id, symbol, type, shares, price) VALUES (?, ?, ?, ?, ?)', [userId, symbol, type, shares, price]);

    await connection.commit();
    res.json({ success: true, message: 'Trade successful' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 5001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
