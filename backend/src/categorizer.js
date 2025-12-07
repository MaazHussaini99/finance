const db = require('./database');
const natural = require('natural');
const aiCategorizer = require('./aiCategorizer');

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

class TransactionCategorizer {
  constructor() {
    this.rules = this.loadRules();
    this.useAI = process.env.USE_AI_CATEGORIZATION !== 'false'; // Enabled by default if API key is set
  }

  loadRules() {
    const stmt = db.prepare('SELECT pattern, category, priority FROM categorization_rules ORDER BY priority DESC');
    return stmt.all();
  }

  /**
   * Categorize using rule-based matching
   */
  categorizeWithRules(description) {
    const lowerDesc = description.toLowerCase();

    for (const rule of this.rules) {
      const patterns = rule.pattern.split('|');
      for (const pattern of patterns) {
        if (lowerDesc.includes(pattern.trim())) {
          return rule.category;
        }
      }
    }

    return null; // No match found
  }

  /**
   * Hybrid categorization: Rules first, then AI fallback
   */
  async categorize(description, amount = null) {
    // Try rules first (fast and free)
    const ruleCategory = this.categorizeWithRules(description);
    if (ruleCategory) {
      return ruleCategory;
    }

    // Fallback to AI if enabled and no rule matched
    if (this.useAI && aiCategorizer.enabled) {
      const aiCategory = await aiCategorizer.categorize(description, amount);
      if (aiCategory) {
        return aiCategory;
      }
    }

    // Last resort
    return 'Other';
  }

  /**
   * Synchronous categorize for backwards compatibility
   * Use this when you can't use async/await
   */
  categorizeSync(description) {
    const ruleCategory = this.categorizeWithRules(description);
    return ruleCategory || 'Other';
  }

  /**
   * Batch categorize (async version with AI support)
   */
  async categorizeBatchAsync(transactions) {
    const results = [];
    for (const transaction of transactions) {
      const category = await this.categorize(transaction.description, transaction.amount);
      results.push({
        ...transaction,
        category
      });
    }
    return results;
  }

  /**
   * Synchronous batch categorize (backwards compatibility)
   */
  categorizeBatch(transactions) {
    return transactions.map(transaction => ({
      ...transaction,
      category: this.categorizeSync(transaction.description)
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
