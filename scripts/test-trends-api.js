const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new Database(dbPath);

console.log('Testing trends query...\n');

// Get the first user
const user = db.prepare('SELECT user_id FROM users LIMIT 1').get();

if (!user) {
  console.error('No users found');
  process.exit(1);
}

console.log(`User ID: ${user.user_id}\n`);

// Calculate date range (7 days)
const daysAgo = 7;
const startDate = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);

console.log(`Start date: ${new Date(startDate).toLocaleString()}`);
console.log(`Current date: ${new Date().toLocaleString()}\n`);

// Run the same query as the API
const entries = db.prepare(`
  SELECT
    entry_id,
    sentiment,
    created_at,
    date(created_at/1000, 'unixepoch') as date,
    substr(content, 1, 40) as content_preview
  FROM journal_entries
  WHERE user_id = ?
    AND created_at >= ?
    AND sentiment IS NOT NULL
  ORDER BY created_at ASC
`).all(user.user_id, startDate);

console.log(`Found ${entries.length} entries:\n`);

entries.forEach((entry, index) => {
  console.log(`${index + 1}. Date: ${entry.date}`);
  console.log(`   Sentiment: ${entry.sentiment}`);
  console.log(`   Preview: ${entry.content_preview}...`);
  console.log('');
});

if (entries.length > 0) {
  const average = Math.round(
    entries.reduce((sum, e) => sum + e.sentiment, 0) / entries.length
  );
  console.log(`Average sentiment: ${average}`);
}

db.close();
