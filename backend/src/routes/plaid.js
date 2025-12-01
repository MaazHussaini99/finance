const express = require('express');
const plaidClient = require('../plaidClient');
const db = require('../database');
const { CountryCode, Products } = require('plaid');

const router = express.Router();

router.post('/create_link_token', async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: 'user-1',
      },
      client_name: 'Transaction Categorizer',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

router.post('/exchange_public_token', async (req, res) => {
  try {
    const { public_token } = req.body;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    const institution = accountsResponse.data.item.institution_id;

    let institutionName = 'Unknown';
    try {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institution,
        country_codes: [CountryCode.Us],
      });
      institutionName = institutionResponse.data.institution.name;
    } catch (error) {
      console.error('Error fetching institution name:', error);
    }

    const insertStmt = db.prepare(`
      INSERT INTO connected_accounts (
        item_id, access_token, institution_id, institution_name,
        account_id, account_name, account_type, account_subtype, mask
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const accountIds = [];
    for (const account of accounts) {
      const result = insertStmt.run(
        itemId,
        accessToken,
        institution,
        institutionName,
        account.account_id,
        account.name,
        account.type,
        account.subtype,
        account.mask
      );
      accountIds.push(result.lastInsertRowid);
    }

    res.json({
      success: true,
      accounts: accounts.map((acc, idx) => ({
        id: accountIds[idx],
        name: acc.name,
        type: acc.type,
        mask: acc.mask,
      })),
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

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

router.post('/sync/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const accountStmt = db.prepare('SELECT * FROM connected_accounts WHERE id = ? AND is_active = 1');
    const account = accountStmt.get(accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const request = {
      access_token: account.access_token,
    };

    if (account.cursor) {
      request.cursor = account.cursor;
    } else {
      const today = new Date();
      const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      request.start_date = twoYearsAgo.toISOString().split('T')[0];
      request.end_date = today.toISOString().split('T')[0];
    }

    const response = await plaidClient.transactionsSync(request);

    const added = response.data.added;
    const modified = response.data.modified;
    const removed = response.data.removed;
    const nextCursor = response.data.next_cursor;

    const categorizer = require('../categorizer');

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO transactions (
        date, description, amount, category, institution, account_type,
        account_id, transaction_id, pending, original_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deleteStmt = db.prepare('DELETE FROM transactions WHERE transaction_id = ? AND account_id = ?');

    let addedCount = 0;
    for (const transaction of added) {
      if (transaction.account_id !== account.account_id) continue;

      const category = categorizer.categorize(transaction.name);
      insertStmt.run(
        transaction.date,
        transaction.name,
        transaction.amount,
        category,
        account.institution_name,
        account.account_type,
        accountId,
        transaction.transaction_id,
        transaction.pending ? 1 : 0,
        JSON.stringify(transaction)
      );
      addedCount++;
    }

    let modifiedCount = 0;
    for (const transaction of modified) {
      if (transaction.account_id !== account.account_id) continue;

      const category = categorizer.categorize(transaction.name);
      insertStmt.run(
        transaction.date,
        transaction.name,
        transaction.amount,
        category,
        account.institution_name,
        account.account_type,
        accountId,
        transaction.transaction_id,
        transaction.pending ? 1 : 0,
        JSON.stringify(transaction)
      );
      modifiedCount++;
    }

    for (const transaction of removed) {
      deleteStmt.run(transaction.transaction_id, accountId);
    }

    const updateStmt = db.prepare('UPDATE connected_accounts SET cursor = ?, last_sync = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(nextCursor, accountId);

    res.json({
      success: true,
      added: addedCount,
      modified: modifiedCount,
      removed: removed.length,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error: 'Failed to sync transactions', details: error.message });
  }
});

router.post('/sync_all', async (req, res) => {
  try {
    const accountsStmt = db.prepare('SELECT id FROM connected_accounts WHERE is_active = 1');
    const accounts = accountsStmt.all();

    const results = [];
    for (const account of accounts) {
      try {
        const axios = require('axios');
        const syncResponse = await axios.post(`http://localhost:${process.env.PORT || 3001}/api/plaid/sync/${account.id}`);
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
