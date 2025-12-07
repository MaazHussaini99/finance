#!/usr/bin/env node
/**
 * Script to recategorize all existing transactions with updated rules and AI
 */

const db = require('./database');
const categorizer = require('./categorizer');
const aiCategorizer = require('./aiCategorizer');

async function main() {
  console.log('Recategorizing all transactions with AI-enhanced categorization...\n');

  // Reload rules from database
  categorizer.rules = categorizer.loadRules();
  console.log(`✓ Loaded ${categorizer.rules.length} categorization rules`);

  if (aiCategorizer.enabled) {
    console.log('✓ AI categorization enabled (OpenAI GPT-4o-mini)');
  } else {
    console.log('ℹ AI categorization disabled (set OPENAI_API_KEY to enable)');
  }

  // Get all transactions
  const getStmt = db.prepare('SELECT id, description, amount, category FROM transactions');
  const transactions = getStmt.all();

  console.log(`✓ Found ${transactions.length} transactions to recategorize\n`);

  if (transactions.length === 0) {
    console.log('No transactions to recategorize. Exiting.');
    process.exit(0);
  }

  // Track category changes
  const categoryChanges = {};
  let updatedCount = 0;
  let aiUsedCount = 0;

  // Update each transaction's category
  const updateStmt = db.prepare('UPDATE transactions SET category = ? WHERE id = ?');

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const oldCategory = transaction.category;

    // Try rule-based first
    let newCategory = categorizer.categorizeWithRules(transaction.description);

    // If no rule matched, try AI
    if (!newCategory && aiCategorizer.enabled) {
      newCategory = await aiCategorizer.categorize(transaction.description, transaction.amount);
      if (newCategory) {
        aiUsedCount++;
      }
    }

    // Fallback to Other
    if (!newCategory) {
      newCategory = 'Other';
    }

    if (oldCategory !== newCategory) {
      const key = `${oldCategory} → ${newCategory}`;
      categoryChanges[key] = (categoryChanges[key] || 0) + 1;
      updatedCount++;
    }

    updateStmt.run(newCategory, transaction.id);

    // Show progress every 10 transactions
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\rProcessed ${i + 1}/${transactions.length} transactions...`);
    }
  }

  console.log('\n\nRecategorization complete!\n');
  console.log(`Total transactions: ${transactions.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Unchanged: ${transactions.length - updatedCount}`);
  if (aiUsedCount > 0) {
    console.log(`AI categorized: ${aiUsedCount} transactions\n`);
  } else {
    console.log('');
  }

  if (Object.keys(categoryChanges).length > 0) {
    console.log('Category changes:');
    Object.entries(categoryChanges)
      .sort((a, b) => b[1] - a[1])
      .forEach(([change, count]) => {
        console.log(`  ${change}: ${count} transactions`);
      });
  } else {
    console.log('No category changes needed.');
  }

  console.log('\n✓ All transactions have been recategorized!');
  console.log('Restart your backend server to see the updated categorizations.');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
