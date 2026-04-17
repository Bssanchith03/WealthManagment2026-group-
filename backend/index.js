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
  const { userId, symbol, type, shares, price, accountId } = req.body; 
  const totalCost = shares * price;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify and Update Bank Account balance
    const [account] = await connection.query('SELECT balance FROM bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE', [accountId, userId]);
    if (!account.length) throw new Error("Bank account not found");

    if (type === 'BUY') {
      if (parseFloat(account[0].balance) < totalCost) throw new Error("Insufficient funds in selected account");
      await connection.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [totalCost, accountId]);
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
      // SELL logic
      await connection.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [totalCost, accountId]);
      await connection.query('UPDATE users SET liquid_cash = liquid_cash + ? WHERE id = ?', [totalCost, userId]);
      
      const [existingHolding] = await connection.query('SELECT shares FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      if (!existingHolding.length || parseFloat(existingHolding[0].shares) < shares) throw new Error("Insufficient shares to sell");

      let newShares = parseFloat(existingHolding[0].shares) - shares;
      if (newShares === 0) {
        await connection.query('DELETE FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      } else {
        await connection.query('UPDATE holdings SET shares = ? WHERE user_id = ? AND symbol = ?', [newShares, userId, symbol]);
      }
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

// Subscriptions Endpoints
app.get('/api/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [subs] = await pool.query('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
    res.json(subs);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const { userId, serviceName, cost } = req.body;
    console.log(`Adding sub: ${serviceName} for user ${userId}`);
    await pool.query('INSERT INTO subscriptions (user_id, service_name, monthly_cost) VALUES (?, ?, ?)', [userId, serviceName, cost]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding subscription:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Bills Endpoints
app.get('/api/bills/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [bills] = await pool.query('SELECT * FROM bills WHERE user_id = ?', [userId]);
    res.json(bills);
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { userId, type, company, packageName, price, frequency } = req.body;
    await pool.query(
      'INSERT INTO bills (user_id, type, company, package_name, price, frequency) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, company, packageName, price, frequency]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding bill:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting bill:', err);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Bank Accounts Endpoints
app.get('/api/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [accounts] = await pool.query('SELECT * FROM bank_accounts WHERE user_id = ?', [userId]);
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  const { userId, bankName, phoneNumber, initialBalance } = req.body;
  try {
    await pool.query(
      'INSERT INTO bank_accounts (user_id, bank_name, phone_number, balance) VALUES (?, ?, ?, ?)',
      [userId, bankName, phoneNumber, initialBalance || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.post('/api/accounts/transfer', async (req, res) => {
  const { userId, fromAccountId, toAccountId, amount } = req.body;
  const transferAmount = parseFloat(amount);

  if (!transferAmount || transferAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer amount' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check and lock source account
    const [fromAccount] = await connection.query(
      'SELECT balance FROM bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [fromAccountId, userId]
    );

    if (!fromAccount.length) throw new Error('Source account not found');
    if (parseFloat(fromAccount[0].balance) < transferAmount) {
      throw new Error('Insufficient funds in source account');
    }

    // 2. Lock destination account
    const [toAccount] = await connection.query(
      'SELECT id FROM bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [toAccountId, userId]
    );
    if (!toAccount.length) throw new Error('Destination account not found');

    // 3. Perform transfer
    await connection.query(
      'UPDATE bank_accounts SET balance = balance - ? WHERE id = ?',
      [transferAmount, fromAccountId]
    );
    await connection.query(
      'UPDATE bank_accounts SET balance = balance + ? WHERE id = ?',
      [transferAmount, toAccountId]
    );

    // Note: total users.liquid_cash doesn't change since money stays in the network

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Transfer error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Fixed Deposits Endpoints
app.get('/api/fixed-deposits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [fds] = await pool.query('SELECT * FROM fixed_deposits WHERE user_id = ?', [userId]);
    res.json(fds);
  } catch (err) {
    console.error('Error fetching FDs:', err);
    res.status(500).json({ error: 'Failed to fetch FDs' });
  }
});

app.post('/api/fixed-deposits', async (req, res) => {
  const { userId, bankName, amount, rate, duration, accountId } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [account] = await connection.query('SELECT balance FROM bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE', [accountId, userId]);
    if (!account.length) throw new Error("Bank account not found");
    if (parseFloat(account[0].balance) < parseFloat(amount)) throw new Error("Insufficient funds in selected account");

    await connection.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
    await connection.query('UPDATE users SET liquid_cash = liquid_cash - ? WHERE id = ?', [amount, userId]);
    
    await connection.query(
      'INSERT INTO fixed_deposits (user_id, bank_name, principal_amount, interest_rate, duration_months) VALUES (?, ?, ?, ?, ?)',
      [userId, bankName, amount, rate, duration]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Loan Endpoints
app.get('/api/loans/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [loans] = await pool.query('SELECT * FROM loans WHERE user_id = ?', [userId]);
    res.json(loans);
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

app.post('/api/loans', async (req, res) => {
  const { userId, type, bankName, amount, rate, duration, addCash, accountId } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Create the loan record
    await connection.query(
      'INSERT INTO loans (user_id, type, bank_name, principal_amount, remaining_balance, interest_rate, duration_months) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, type, bankName, amount, amount, rate, duration]
    );

    // 2. If addCash is true, add the loan amount to selected bank account
    if (addCash) {
       await connection.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
       await connection.query('UPDATE users SET liquid_cash = liquid_cash + ? WHERE id = ?', [amount, userId]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating loan:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.post('/api/loans/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { userId, amount, paymentType, accountId } = req.body; // paymentType: 'Regular' or 'Extra'
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check account balance
    const [account] = await connection.query('SELECT balance FROM bank_accounts WHERE id = ? AND user_id = ? FOR UPDATE', [accountId, userId]);
    if (!account.length) throw new Error("Bank account not found");
    if (parseFloat(account[0].balance) < parseFloat(amount)) throw new Error("Insufficient funds in selected account");

    // 2. Deduct from account and master balance
    await connection.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
    await connection.query('UPDATE users SET liquid_cash = liquid_cash - ? WHERE id = ?', [amount, userId]);

    // 3. Update loan balance
    await connection.query('UPDATE loans SET remaining_balance = remaining_balance - ? WHERE id = ?', [amount, id]);

    // 4. Record payment
    await connection.query(
      'INSERT INTO loan_payments (loan_id, amount, payment_type) VALUES (?, ?, ?)',
      [id, amount, paymentType]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing loan payment:', error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 5001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
