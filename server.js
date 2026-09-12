const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files (like INDEX.html, CSS, JS) from the main project folder
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Handle the main homepage route explicitly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'INDEX.html'));
});

// Endpoint for M-Pesa deposit requests
app.post('/api/deposit', (req, res) => {
  const { amount, phone } = req.body;
  console.log(`Received deposit request: KES ${amount} for ${phone}`);
  
  // Return success response to front-end prompt
  res.status(200).json({ status: 'success', message: 'M-Pesa prompt initiated' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});