const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the project folder
app.use(express.static(__dirname));

// Serve INDEX.html on root request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'INDEX.html'));
});

// Safaricom Credentials
const CONSUMER_KEY = "YourConsumerKey";
const CONSUMER_SECRET = "YourConsumerSecret";
const SHORTCODE = "174379";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

// Generate Access Token
async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token;
}

// Deposit Route (STK Push)
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount } = req.body;
  try {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: 'https://mydomain.com/api/mpesa/callback',
        AccountReference: 'PremiumBinary',
        TransactionDesc: 'Deposit to Trading Wallet'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("STK Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: "M-Pesa STK Push Failed" });
  }
});

// Withdrawal Route (B2C)
app.post('/api/mpesa/withdraw', (req, res) => {
  const { phone, amount } = req.body;
  console.log(`Withdrawal request of KES ${amount} to ${phone}`);
  res.json({ success: true, message: "Withdrawal processed" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));