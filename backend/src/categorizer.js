const db = require('./database');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

class TransactionCategorizer {
  constructor() {
    this.rules = this.loadRules();
  }

  loadRules() {
    const stmt = db.prepare('SELECT pattern, category, priority FROM categorization_rules ORDER BY priority DESC');
    return stmt.all();
  }

  categorize(description) {
    const lowerDesc = description.toLowerCase();

    for (const rule of this.rules) {
      const patterns = rule.pattern.split('|');
      for (const pattern of patterns) {
        if (lowerDesc.includes(pattern.trim())) {
          return rule.category;
        }
      }
    }

    return 'Other';
  }

  categorizeBatch(transactions) {
    return transactions.map(transaction => ({
      ...transaction,
      category: this.categorize(transaction.description)
    }));
  }

  addRule(pattern, category, priority = 0) {
    const stmt = db.prepare('INSERT INTO categorization_rules (pattern, category, priority) VALUES (?, ?, ?)');
    return stmt.run(pattern, category, priority);
  }

  updateRule(id, pattern, category, priority) {
    const stmt = db.prepare('UPDATE categorization_rules SET pattern = ?, category = ?, priority = ? WHERE id = ?');
    return stmt.run(pattern, category, priority, id);
  }

  deleteRule(id) {
    const stmt = db.prepare('DELETE FROM categorization_rules WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = new TransactionCategorizer();
