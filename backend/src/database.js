const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'transactions.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    institution TEXT NOT NULL,
    account_type TEXT NOT NULL,
    account_id INTEGER,
    transaction_id TEXT,
    pending INTEGER DEFAULT 0,
    original_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES connected_accounts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS connected_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT,
    institution_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    account_type TEXT,
    account_subtype TEXT,
    mask TEXT,
    cursor TEXT,
    last_sync DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📁',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categorization_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_transactions_institution ON transactions(institution);
  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique ON transactions(transaction_id, account_id);
  CREATE INDEX IF NOT EXISTS idx_connected_accounts_item_id ON connected_accounts(item_id);
`);

const defaultCategories = [
  { name: 'Groceries', color: '#10b981', icon: '🛒' },
  { name: 'Dining', color: '#f59e0b', icon: '🍽️' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
  { name: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
  { name: 'Bills & Utilities', color: '#ef4444', icon: '💡' },
  { name: 'Healthcare', color: '#06b6d4', icon: '🏥' },
  { name: 'Travel', color: '#14b8a6', icon: '✈️' },
  { name: 'Income', color: '#22c55e', icon: '💰' },
  { name: 'Other', color: '#6b7280', icon: '📌' }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)
`);

defaultCategories.forEach(cat => {
  insertCategory.run(cat.name, cat.color, cat.icon);
});

const defaultRules = [
  { pattern: 'whole foods|trader joe|safeway|kroger|publix|wegmans|costco|walmart grocery', category: 'Groceries' },
  { pattern: 'restaurant|cafe|starbucks|mcdonald|chipotle|subway|pizza|domino', category: 'Dining' },
  { pattern: 'uber|lyft|gas|shell|chevron|exxon|mobil|parking|transit', category: 'Transportation' },
  { pattern: 'amazon|target|best buy|walmart|ebay|etsy', category: 'Shopping' },
  { pattern: 'netflix|spotify|hulu|disney|movie|theater|concert', category: 'Entertainment' },
  { pattern: 'electric|water|gas bill|internet|phone|cable|insurance', category: 'Bills & Utilities' },
  { pattern: 'pharmacy|cvs|walgreens|hospital|doctor|medical|dental', category: 'Healthcare' },
  { pattern: 'airline|hotel|airbnb|booking|travel|expedia', category: 'Travel' },
  { pattern: 'payroll|salary|deposit|income|paycheck', category: 'Income' }
];

const insertRule = db.prepare(`
  INSERT OR IGNORE INTO categorization_rules (pattern, category, priority) VALUES (?, ?, ?)
`);

defaultRules.forEach((rule, index) => {
  insertRule.run(rule.pattern, rule.category, index);
});

module.exports = db;
