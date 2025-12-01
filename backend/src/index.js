require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./database');
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const plaidRouter = require('./routes/plaid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/plaid', plaidRouter);

cron.schedule('0 */6 * * *', async () => {
  console.log('Running automatic transaction sync...');
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/plaid/sync_all`);
    console.log('Automatic sync completed');
  } catch (error) {
    console.error('Automatic sync failed:', error.message);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Transaction Categorizer API is running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
