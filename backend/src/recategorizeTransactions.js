#!/usr/bin/env node
/**
 * Script to recategorize all existing transactions with updated rules
 */

const db = require('./database');
const categorizer = require('./categorizer');

console.log('Recategorizing all transactions...\n');

// Reload rules from database
categorizer.rules = categorizer.loadRules();
console.log(`✓ Loaded ${categorizer.rules.length} categorization rules`);

// Get all transactions
const getStmt = db.prepare('SELECT id, description, category FROM transactions');
const transactions = getStmt.all();

console.log(`✓ Found ${transactions.length} transactions to recategorize\n`);

if (transactions.length === 0) {
  console.log('No transactions to recategorize. Exiting.');
  process.exit(0);
}

// Track category changes
const categoryChanges = {};
let updatedCount = 0;

// Update each transaction's category
const updateStmt = db.prepare('UPDATE transactions SET category = ? WHERE id = ?');

transactions.forEach(transaction => {
  const oldCategory = transaction.category;
  const newCategory = categorizer.categorize(transaction.description);

  if (oldCategory !== newCategory) {
    const key = `${oldCategory} → ${newCategory}`;
    categoryChanges[key] = (categoryChanges[key] || 0) + 1;
    updatedCount++;
  }

  updateStmt.run(newCategory, transaction.id);
});

console.log('Recategorization complete!\n');
console.log(`Total transactions: ${transactions.length}`);
console.log(`Updated: ${updatedCount}`);
console.log(`Unchanged: ${transactions.length - updatedCount}\n`);

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
