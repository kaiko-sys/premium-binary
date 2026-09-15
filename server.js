const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

app.use(express.json());

// Serve static frontend files from your project folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to PostgreSQL using Render's environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Automatically create the users table on startup if it doesn't exist
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table verified/created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

initDB();

// Endpoint to handle registration and save to PostgreSQL
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at';
    const values = [email, password];
    const result = await pool.query(query, values);
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already registered!' });
    } else {
      res.status(500).json({ error: 'Database error occurred during registration.' });
    }
  }
});

// ==========================================
// YOUR M-PESA ACCOUNT CONFIGURATION
// ==========================================
const ADMIN_MPESA_NUMBER = "254700077823"; // Replace with your exact phone number or Till/Paybill number

// Endpoint for receiving deposits
app.post('/api/deposit', (req, res) => {
    const { amount, phone } = req.body;
    console.log(`[DEPOSIT INITIATED] Trader Phone: ${phone} | Amount: KES ${amount} -> Destination: ${ADMIN_MPESA_NUMBER}`);
    res.status(200).json({
        status: "success",
        message: `STK Push sent to ${phone}. Funds will be transferred to account: ${ADMIN_MPESA_NUMBER}`
    });
});

// Endpoint for receiving withdrawal requests from traders
app.post('/api/withdraw', (req, res) => {
    const { amount, phone } = req.body;
    console.log(`[WITHDRAWAL REQUESTED] Trader Phone: ${phone} | Amount: KES ${amount}`);
    res.status(200).json({
        status: "success",
        message: `Withdrawal request of $${amount} to ${phone} has been queued.`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});