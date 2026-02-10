import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Sample journal entries with varied sentiment
const journalEntries = [
  {
    content: "Today was really hard. The baby barely slept last night and I feel completely exhausted. I'm trying my best but sometimes I wonder if I'm doing anything right. Everything feels overwhelming.",
    sentiment: 25,
    daysAgo: 10
  },
  {
    content: "Had a better day today. Managed to get outside for a short walk and it felt so good to get some fresh air. The baby seemed calmer too. Small victories.",
    sentiment: 65,
    daysAgo: 9
  },
  {
    content: "I'm so tired I can barely think straight. Crying a lot today. Feel like I'm not connecting with the baby the way I should. Is this normal? I feel so alone.",
    sentiment: 20,
    daysAgo: 8
  },
  {
    content: "Today was actually pretty good! Got decent sleep last night and the baby was smiling at me this morning. Those little moments make everything worth it. Feeling grateful.",
    sentiment: 78,
    daysAgo: 7
  },
  {
    content: "Struggling again. Haven't eaten a proper meal all day. Just so overwhelmed with everything. My partner is trying to help but I still feel like I'm drowning.",
    sentiment: 28,
    daysAgo: 6
  },
  {
    content: "Better today. Had a friend visit and it helped to talk to someone who understands. Ate a full meal and even rested a bit while she held the baby. Need to remember to ask for help more.",
    sentiment: 68,
    daysAgo: 5
  },
  {
    content: "Rough night but trying to stay positive. Baby was fussy but we made it through. Had a moment where we were both crying together. This is so much harder than I expected.",
    sentiment: 42,
    daysAgo: 4
  },
  {
    content: "Today I felt like myself for the first time in weeks. Got to take a shower, ate breakfast, and even put on real clothes. The baby slept for 3 hours straight! Feeling hopeful.",
    sentiment: 75,
    daysAgo: 3
  },
  {
    content: "Not a great day. So anxious about everything - is the baby eating enough? Sleeping enough? Am I doing this right? My mind won't stop racing even when I'm exhausted.",
    sentiment: 32,
    daysAgo: 2
  },
  {
    content: "Feeling okay today. Not amazing but not terrible either. Did some gentle stretches and it helped my back pain. The baby and I are finding our rhythm slowly. Taking it one day at a time.",
    sentiment: 58,
    daysAgo: 1
  }
];

async function generateJournalEntries(userId: string) {
  console.log(`Generating 10 journal entries for user: ${userId}`);

  const now = Date.now();
  let created = 0;

  for (const entry of journalEntries) {
    const entryId = uuidv4();

    // Calculate timestamp for past days
    const daysInMs = entry.daysAgo * 24 * 60 * 60 * 1000;
    const timestamp = now - daysInMs;

    try {
      db.prepare(
        `INSERT INTO journal_entries (entry_id, user_id, content, sentiment, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(entryId, userId, entry.content, entry.sentiment, timestamp);

      created++;
      console.log(`✓ Created entry ${created}/10 (${entry.daysAgo} days ago, sentiment: ${entry.sentiment})`);
    } catch (error) {
      console.error(`✗ Failed to create entry:`, error);
    }
  }

  console.log(`\n✓ Successfully created ${created} journal entries!`);
}

// Get user ID from command line or use a default
const userId = process.argv[2];

if (!userId) {
  console.error('Error: Please provide a user ID');
  console.log('Usage: npm run generate-journal-entries <user-id>');
  console.log('\nTo find your user ID:');
  console.log('1. Check the database: users table');
  console.log('2. Or check localStorage in browser dev tools for "token" and decode the JWT');
  process.exit(1);
}

generateJournalEntries(userId)
  .then(() => {
    console.log('\n✓ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error);
    process.exit(1);
  });
