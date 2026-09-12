const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Securely connect using the Environment Variable we just set
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render Postgres
});

// Create tables automatically if they don't exist
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        balance DECIMAL(12, 2) DEFAULT 1000.00, -- Free $1000 demo balance
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized: Users table ready.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
initDB();

// Registration Endpoint
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Required fields missing.' });

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, balance',
      [email, hashedPassword]
    );

    res.status(201).json({ success: true, message: 'Account created!', user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// --- Dynamic Binary Price Simulation (Backend) ---
let currentPrice = 9365.26;
// Update price every 2 seconds
setInterval(() => {
  currentPrice = +(currentPrice + (Math.random() - 0.5) * 6).toFixed(2);
}, 2000);

// Endpoint to get the current dynamic price
app.get('/api/price', (req, res) => {
  res.json({ price: currentPrice, lastDigit: Math.floor(currentPrice % 10) });
});

app.listen(PORT, () => {
  console.log(`Server running dynamically on port ${PORT}`);
});