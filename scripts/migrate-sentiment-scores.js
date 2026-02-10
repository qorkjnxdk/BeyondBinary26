const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new Database(dbPath);

console.log('Starting migration: Converting sentiment scores to 0-99 range...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Get all journal entries with sentiment scores
  const entries = db.prepare(
    'SELECT entry_id, sentiment FROM journal_entries WHERE sentiment IS NOT NULL'
  ).all();

  console.log(`Found ${entries.length} entries with sentiment scores`);

  // Convert each entry
  let converted = 0;
  for (const entry of entries) {
    const oldScore = entry.sentiment;
    let newScore;

    // If score is already in 0-99 range, keep it
    if (oldScore >= 0 && oldScore <= 99) {
      newScore = oldScore;
    }
    // If score is in -10 to 10 range, convert it
    else if (oldScore >= -10 && oldScore <= 10) {
      // Convert -10 to 10 scale to 0 to 99 scale
      // Formula: (value + 10) / 20 * 99
      newScore = Math.round(((oldScore + 10) / 20) * 99);
      converted++;
    }
    // If score is in -1 to 1 range, convert it
    else if (oldScore >= -1 && oldScore <= 1) {
      // Convert -1 to 1 scale to 0 to 99 scale
      // Formula: (value + 1) / 2 * 99
      newScore = Math.round(((oldScore + 1) / 2) * 99);
      converted++;
    }
    // Default to neutral if out of range
    else {
      newScore = 50;
      converted++;
    }

    // Update the entry
    db.prepare(
      'UPDATE journal_entries SET sentiment = ? WHERE entry_id = ?'
    ).run(newScore, entry.entry_id);
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log(`✅ Migration successful!`);
  console.log(`   Total entries: ${entries.length}`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Already in range: ${entries.length - converted}`);
} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
