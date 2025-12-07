const express = require('express');
const tellerClient = require('../tellerClient');
const db = require('../database');
const crypto = require('crypto');

const router = express.Router();

// Note: Teller Connect is now handled client-side via TellerConnect.setup()
// The enrollment flow happens in the browser, and we just receive the access token

// Exchange enrollment for access token and save accounts
router.post('/save_enrollment', async (req, res) => {
  try {
    const { access_token, enrollment_id } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Get accounts using the access token
    const accountsResponse = await tellerClient.get('/accounts', {
      auth: {
        username: access_token,
        password: ''
      }
    });

    const accounts = accountsResponse.data;

    const insertStmt = db.prepare(`
      INSERT INTO connected_accounts (
        access_token, enrollment_id, institution_name,
        account_id, account_name, account_type, account_subtype, mask
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const accountIds = [];
    for (const account of accounts) {
      const result = insertStmt.run(
        access_token,
        enrollment_id || null,
        account.institution?.name || 'Unknown',
        account.id,
        account.name,
        account.type,
        account.subtype,
        account.last_four
      );
      accountIds.push(result.lastInsertRowid);
    }

    res.json({
      success: true,
      accounts: accounts.map((acc, idx) => ({
        id: accountIds[idx],
        name: acc.name,
        type: acc.type,
        mask: acc.last_four,
        institution: acc.institution?.name
      })),
    });
  } catch (error) {
    console.error('Error saving enrollment:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to save enrollment',
      details: error.response?.data || error.message
    });
  }
});

// Get connected accounts
router.get('/accounts', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, institution_name, account_name, account_type, account_subtype, mask, last_sync, is_active
      FROM connected_accounts
      WHERE is_active = 1
      ORDER BY created_at DESC
    `);
    const accounts = stmt.all();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Sync transactions for a specific account
router.post('/sync/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const accountStmt = db.prepare('SELECT * FROM connected_accounts WHERE id = ? AND is_active = 1');
    const account = accountStmt.get(accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Fetch transactions from Teller
    const transactionsResponse = await tellerClient.get(`/accounts/${account.account_id}/transactions`, {
      auth: {
        username: account.access_token,
        password: ''
      },
      params: {
        count: 500 // Get last 500 transactions
      }
    });

    const transactions = transactionsResponse.data;
    const categorizer = require('../categorizer');

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO transactions (
        date, description, amount, category, institution, account_type,
        account_id, transaction_id, hash, original_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let addedCount = 0;
    for (const transaction of transactions) {
      // Create hash for duplicate detection
      const hash = crypto
        .createHash('md5')
        .update(`${transaction.date}-${transaction.description}-${transaction.amount}-${account.account_id}`)
        .digest('hex');

      // Use async categorization with AI fallback
      const category = await categorizer.categorize(transaction.description, parseFloat(transaction.amount));

      try {
        insertStmt.run(
          transaction.date,
          transaction.description,
          parseFloat(transaction.amount),
          category,
          account.institution_name,
          account.account_type,
          accountId,
          transaction.id,
          hash,
          JSON.stringify(transaction)
        );
        addedCount++;
      } catch (error) {
        // Skip duplicates (hash collision)
        if (!error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }

    // Update last sync time
    const updateStmt = db.prepare('UPDATE connected_accounts SET last_sync = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(accountId);

    res.json({
      success: true,
      added: addedCount,
      total: transactions.length,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to sync transactions',
      details: error.response?.data || error.message
    });
  }
});

// Sync all accounts
router.post('/sync_all', async (req, res) => {
  try {
    const accountsStmt = db.prepare('SELECT id FROM connected_accounts WHERE is_active = 1');
    const accounts = accountsStmt.all();

    const results = [];
    for (const account of accounts) {
      try {
        const axios = require('axios');
        const syncResponse = await axios.post(`http://localhost:${process.env.PORT || 3001}/api/teller/sync/${account.id}`);
        results.push({
          accountId: account.id,
          success: true,
          ...syncResponse.data,
        });
      } catch (error) {
        results.push({
          accountId: account.id,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error syncing all accounts:', error);
    res.status(500).json({ error: 'Failed to sync accounts' });
  }
});

// Disconnect account
router.delete('/account/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;

    const stmt = db.prepare('UPDATE connected_accounts SET is_active = 0 WHERE id = ?');
    const result = stmt.run(accountId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ success: true, message: 'Account disconnected' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

module.exports = router;
