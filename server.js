// const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')());==========================================
// YOUR M-PESA ACCOUNT CONFIGURATION
// ==========================================
const ADMIN_MPESA_NUMBER = "254703677923"; // Replace with your exact phone number or Till/Paybill number

// Endpoint for receiving deposits
app.post('/api/deposit', (req, res) => {
  const { amount, phone } = req.body;
  
  console.log(`[DEPOSIT INITIATED] Trader Phone: ${phone} | Amount: KES ${amount} -> Destination: ${ADMIN_MPESA_NUMBER}`);
  
  res.status(200).json({ 
    status: 'success', 
    message: `STK Push sent to ${phone}. Funds will be transferred to account: ${ADMIN_MPESA_NUMBER}` 
  });
});

// Endpoint for receiving withdrawal requests from traders
app.post('/api/withdraw', (req, res) => {
  const { amount, phone } = req.body;
  
  console.log(`[WITHDRAWAL REQUESTED] Trader Phone: ${phone} | Amount: KES ${amount}`);
  
  res.status(200).json({ 
    status: 'success', 
    message: `Withdrawal request of KES ${amount} submitted successfully.` 
  });
});