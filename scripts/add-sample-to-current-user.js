const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const db = new Database(dbPath);

console.log('Adding sample data to current user account...\n');

// Get the most recently active user (the one you're using)
const user = db.prepare('SELECT user_id FROM users ORDER BY last_active DESC LIMIT 1').get();

if (!user) {
  console.error('❌ No users found in database.');
  process.exit(1);
}

console.log(`Target user: ${user.user_id}\n`);

// Sample journal entries with varying sentiments
const sampleEntries = [
  // Day 1 (7 days ago) - Mixed emotions
  {
    daysAgo: 7,
    content: "Today was hard. Baby barely slept and I'm so exhausted. But when she finally fell asleep on my chest, it felt special.",
    sentiment: 35
  },

  // Day 2 (6 days ago) - Low sentiment
  {
    daysAgo: 6,
    content: "I feel like I'm failing at everything. Can't keep up with the dishes, the laundry keeps piling up, and I just feel so overwhelmed.",
    sentiment: 18
  },

  // Day 3 (5 days ago) - Slightly better
  {
    daysAgo: 5,
    content: "Got some help from my mom today. She watched the baby while I showered and took a short nap. It helped a lot.",
    sentiment: 52
  },

  // Day 4 (4 days ago) - Neutral to positive
  {
    daysAgo: 4,
    content: "Baby smiled at me for the first time today! I know they say it might just be gas, but it felt real to me. Made my whole day better.",
    sentiment: 72
  },

  // Day 5 (3 days ago) - Good day
  {
    daysAgo: 3,
    content: "Had coffee with another new mom from my prenatal group. So good to talk to someone who gets it. We laughed about all the chaos.",
    sentiment: 78
  },

  // Day 6 (2 days ago) - Dip back down
  {
    daysAgo: 2,
    content: "Rough night. Baby was up every hour. I'm running on two hours of sleep and feeling really emotional about everything today.",
    sentiment: 28
  },

  // Day 7 (yesterday) - Recovery
  {
    daysAgo: 1,
    content: "Better today. Baby had a longer sleep stretch last night. I'm still tired but feel more like myself. Taking it one day at a time.",
    sentiment: 58
  },

  // Day 8 (today morning) - Positive
  {
    daysAgo: 0,
    content: "Feeling grateful today. The sun is out, baby is content, and I managed to make myself a proper meal. Small wins but they matter.",
    sentiment: 82
  }
];

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  let added = 0;
  const now = Date.now();

  for (const entry of sampleEntries) {
    const entryId = uuidv4();
    // Offset by a few hours so they don't conflict with existing entries
    const createdAt = now - (entry.daysAgo * 24 * 60 * 60 * 1000) - (6 * 60 * 60 * 1000);

    db.prepare(
      `INSERT INTO journal_entries (entry_id, user_id, content, sentiment, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(entryId, user.user_id, entry.content, entry.sentiment, createdAt);

    added++;

    const date = new Date(createdAt);
    console.log(`  ✓ Added entry from ${date.toLocaleDateString()} (sentiment: ${entry.sentiment})`);
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log(`\n✅ Successfully added ${added} sample entries to your account!`);
  console.log('\n🔄 Refresh your journal page to see the updated trends!');

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Failed to add sample data:', error);
  process.exit(1);
} finally {
  db.close();
}
