const express = require('express');
const multer = require('multer');
const db = require('../database');
const categorizer = require('../categorizer');
const csvParser = require('../parsers/csvParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', (req, res) => {
  try {
    const { startDate, endDate, category, institution } = req.query;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (institution) {
      query += ' AND institution = ?';
      params.push(institution);
    }

    query += ' ORDER BY date DESC';

    const stmt = db.prepare(query);
    const transactions = stmt.all(...params);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM transactions
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const stmt = db.prepare(query);
    const stats = stmt.all(...params);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/monthly', (req, res) => {
  try {
    const query = `
      SELECT
        strftime('%Y-%m', date) as month,
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      GROUP BY month, category
      ORDER BY month DESC, total DESC
    `;

    const stmt = db.prepare(query);
    const monthlyData = stmt.all();

    const grouped = monthlyData.reduce((acc, row) => {
      if (!acc[row.month]) {
        acc[row.month] = [];
      }
      acc[row.month].push({
        category: row.category,
        total: row.total,
        count: row.count
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const institution = req.body.institution || null;

    const transactions = csvParser.parse(csvContent, institution);
    const categorizedTransactions = categorizer.categorizeBatch(transactions);

    const insertStmt = db.prepare(`
      INSERT INTO transactions (date, description, amount, category, institution, account_type, original_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((transactions) => {
      for (const t of transactions) {
        insertStmt.run(t.date, t.description, t.amount, t.category, t.institution, t.account_type, t.original_data);
      }
    });

    insertMany(categorizedTransactions);

    res.json({
      success: true,
      count: categorizedTransactions.length,
      message: `Successfully imported ${categorizedTransactions.length} transactions`
    });
  } catch (error) {
    console.error('Error uploading transactions:', error);
    res.status(500).json({ error: 'Failed to upload transactions', details: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, date } = req.body;

    const updates = [];
    const params = [];

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const query = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction updated' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
