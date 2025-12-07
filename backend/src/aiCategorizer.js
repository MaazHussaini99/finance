const OpenAI = require('openai');
const db = require('./database');

class AICategorizer {
  constructor() {
    this.openai = null;
    this.enabled = false;
    this.initializeOpenAI();

    // Available categories
    this.categories = [
      'Groceries',
      'Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Income',
      'Other'
    ];
  }

  initializeOpenAI() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.enabled = true;
      console.log('✓ AI Categorization enabled (OpenAI)');
    } else {
      console.log('ℹ AI Categorization disabled (set OPENAI_API_KEY to enable)');
    }
  }

  /**
   * Categorize a transaction using AI
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount (negative for expenses)
   * @returns {Promise<string>} - Category name
   */
  async categorize(description, amount = null) {
    if (!this.enabled) {
      return null;
    }

    try {
      // Check cache first to save API costs
      const cached = this.getCachedCategory(description);
      if (cached) {
        return cached;
      }

      const amountInfo = amount !== null ? ` (Amount: $${Math.abs(amount).toFixed(2)})` : '';

      const prompt = `Categorize this transaction into ONE of these categories: ${this.categories.join(', ')}.

Transaction: "${description}"${amountInfo}

Rules:
- If it's income/deposit/paycheck/refund, return "Income"
- Be specific: restaurants are "Dining", grocery stores are "Groceries"
- Gas stations and rideshare are "Transportation"
- Streaming services and gyms are "Entertainment"
- Utilities, rent, insurance are "Bills & Utilities"
- If uncertain, return "Other"

Return ONLY the category name, nothing else.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'system',
            content: 'You are a financial transaction categorizer. You categorize transactions accurately and concisely.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistent results
        max_tokens: 20
      });

      let category = completion.choices[0].message.content.trim();

      // Validate the category
      if (!this.categories.includes(category)) {
        console.warn(`AI returned invalid category "${category}" for "${description}", using "Other"`);
        category = 'Other';
      }

      // Cache the result
      this.cacheCategory(description, category);

      return category;
    } catch (error) {
      console.error('AI categorization error:', error.message);
      return null;
    }
  }

  /**
   * Batch categorize multiple transactions
   * @param {Array} transactions - Array of {description, amount}
   * @returns {Promise<Array>} - Array of categories
   */
  async categorizeBatch(transactions) {
    if (!this.enabled) {
      return transactions.map(() => null);
    }

    // Process in parallel but limit concurrency to avoid rate limits
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(t => this.categorize(t.description, t.amount))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get cached category for a description
   */
  getCachedCategory(description) {
    try {
      const stmt = db.prepare('SELECT category FROM ai_category_cache WHERE description = ?');
      const result = stmt.get(description.toLowerCase());
      return result ? result.category : null;
    } catch (error) {
      // Cache table might not exist yet
      return null;
    }
  }

  /**
   * Cache a category result to reduce API calls
   */
  cacheCategory(description, category) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ai_category_cache (description, category, last_used)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      stmt.run(description.toLowerCase(), category);
    } catch (error) {
      // Silently fail if cache table doesn't exist
      console.error('Failed to cache category:', error.message);
    }
  }

  /**
   * Learn from user corrections
   * When a user manually changes a category, we can learn from it
   */
  learnFromCorrection(description, correctCategory) {
    if (!this.categories.includes(correctCategory)) {
      return;
    }

    // Update cache with the correct category
    this.cacheCategory(description, correctCategory);
  }

  /**
   * Clear old cache entries (older than 90 days)
   */
  clearOldCache() {
    try {
      const stmt = db.prepare(`
        DELETE FROM ai_category_cache
        WHERE last_used < datetime('now', '-90 days')
      `);
      const result = stmt.run();
      console.log(`Cleared ${result.changes} old cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error.message);
    }
  }
}

module.exports = new AICategorizer();
