const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Connect to PostgreSQL using Render's DATABASE_URL environment variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL connection
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatically create the users table if it doesn't already exist
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                demo_balance NUMERIC(12, 2) DEFAULT 10000.00,
                real_balance NUMERIC(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Users table verified/created successfully!");
    } catch (err) {
        console.error("Error creating database table:", err);
    }
}
initDb();

// Explicit route to serve your index.html homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint for Trader Login & Registration
app.post('/api/auth', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userCheck.rows.length > 0) {
            const user = userCheck.rows[0];
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ success: false, message: "Incorrect password." });
            }
            return res.json({ success: true, message: "Login successful!", demoBalance: user.demo_balance, realBalance: user.real_balance });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await pool.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
                [email, hashedPassword]
            );
            return res.json({ success: true, message: "Registration successful!", demoBalance: newUser.rows[0].demo_balance, realBalance: newUser.rows[0].real_balance });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database error during authentication." });
    }
});

// ==========================================
// YOUR M-PESA ACCOUNT CONFIGURATION
// ==========================================
const ADMIN_MPESA_NUMBER = "254703677923"; // Replace with your exact phone number or Till/Paybill

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});