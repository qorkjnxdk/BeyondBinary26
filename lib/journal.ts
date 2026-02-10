import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntry {
  entry_id: string;
  user_id: string;
  content: string;
  sentiment: number | null;
  created_at: number;
}

// Enhanced sentiment analysis with postpartum-aware vocabulary
const POSITIVE_WORDS: Record<string, number> = {
  // Strong positive (weight: 2)
  'wonderful': 2, 'amazing': 2, 'excellent': 2, 'fantastic': 2, 'love': 2, 'loving': 2,
  'joyful': 2, 'thrilled': 2, 'blessed': 2, 'incredible': 2, 'beautiful': 2,
  // Moderate positive (weight: 1)
  'grateful': 1, 'thankful': 1, 'good': 1, 'better': 1, 'hopeful': 1, 'calm': 1,
  'supported': 1, 'happy': 1, 'peaceful': 1, 'comfortable': 1, 'confident': 1,
  'strong': 1, 'capable': 1, 'progress': 1, 'improving': 1, 'proud': 1, 'relief': 1,
  'enjoying': 1, 'bonding': 1, 'smile': 1, 'laughing': 1, 'connected': 1,
};

const NEGATIVE_WORDS: Record<string, number> = {
  // Strong negative (weight: -2)
  'terrible': -2, 'horrible': -2, 'awful': -2, 'miserable': -2, 'hopeless': -2,
  'despairing': -2, 'unbearable': -2, 'devastating': -2, 'nightmare': -2,
  // Moderate negative (weight: -1)
  'tired': -1, 'overwhelmed': -1, 'anxious': -1, 'sad': -1, 'lonely': -1,
  'exhausted': -1, 'worried': -1, 'scared': -1, 'afraid': -1, 'struggling': -1,
  'difficult': -1, 'hard': -1, 'crying': -1, 'upset': -1, 'frustrated': -1,
  'confused': -1, 'lost': -1, 'helpless': -1, 'guilty': -1, 'inadequate': -1,
  'isolated': -1, 'depressed': -1, 'stress': -1, 'stressful': -1, 'pain': -1,
  'painful': -1, 'sleepless': -1, 'insomnia': -1,
};

// Words that intensify the next sentiment word
const INTENSIFIERS = ['very', 'really', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally', 'so'];

// Negation words that flip sentiment
const NEGATIONS = ['not', 'no', 'never', 'neither', 'nobody', 'nothing', "don't", "didn't", "doesn't", "won't", "can't", "couldn't"];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// Improved sentiment analysis (kept for fallback, but now using AI score)
function computeSentiment(content: string): number {
  const tokens = tokenize(content);
  let score = 0;
  let isNegated = false;
  let isIntensified = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for negation
    if (NEGATIONS.includes(token)) {
      isNegated = true;
      continue;
    }

    // Check for intensifier
    if (INTENSIFIERS.includes(token)) {
      isIntensified = true;
      continue;
    }

    // Check for sentiment words
    let wordScore = 0;
    if (token in POSITIVE_WORDS) {
      wordScore = POSITIVE_WORDS[token];
    } else if (token in NEGATIVE_WORDS) {
      wordScore = NEGATIVE_WORDS[token];
    }

    // Apply modifiers
    if (wordScore !== 0) {
      if (isNegated) {
        wordScore = -wordScore; // Flip sentiment
      }
      if (isIntensified) {
        wordScore *= 1.5; // Amplify
      }
      score += wordScore;

      // Reset modifiers after applying
      isNegated = false;
      isIntensified = false;
    }
  }

  // Normalize score to a reasonable range (-10 to +10)
  return Math.max(-10, Math.min(10, score));
}

export function createJournalEntry(userId: string, content: string): JournalEntry {
  const entryId = uuidv4();
  const now = Date.now();
  // Don't compute sentiment here - will be updated by AI

  db.prepare(
    `INSERT INTO journal_entries (entry_id, user_id, content, sentiment, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(entryId, userId, content, null, now);

  return {
    entry_id: entryId,
    user_id: userId,
    content,
    sentiment: null,
    created_at: now
  };
}

export function getJournalEntries(userId: string, limit: number = 20): JournalEntry[] {
  const rows = db.prepare(
    `SELECT * FROM journal_entries
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  ).all(userId, limit) as any[];

  return rows.map(row => ({
    entry_id: row.entry_id,
    user_id: row.user_id,
    content: row.content,
    sentiment: row.sentiment,
    created_at: row.created_at,
  }));
}

export function updateJournalEntry(entryId: string, userId: string, content: string): JournalEntry | null {
  // Don't compute sentiment here - will be updated by AI
  const result = db.prepare(
    `UPDATE journal_entries
     SET content = ?, sentiment = ?
     WHERE entry_id = ? AND user_id = ?`
  ).run(content, null, entryId, userId);

  if (result.changes === 0) {
    return null;
  }

  const row = db.prepare(
    `SELECT * FROM journal_entries WHERE entry_id = ?`
  ).get(entryId) as any;

  return {
    entry_id: row.entry_id,
    user_id: row.user_id,
    content: row.content,
    sentiment: row.sentiment,
    created_at: row.created_at,
  };
}

// New function to update sentiment score after AI generation
export function updateEntrySentiment(entryId: string, userId: string, sentiment: number): boolean {
  const result = db.prepare(
    `UPDATE journal_entries
     SET sentiment = ?
     WHERE entry_id = ? AND user_id = ?`
  ).run(sentiment, entryId, userId);

  return result.changes > 0;
}

export function deleteJournalEntry(entryId: string, userId: string): boolean {
  const result = db.prepare(
    `DELETE FROM journal_entries
     WHERE entry_id = ? AND user_id = ?`
  ).run(entryId, userId);

  return result.changes > 0;
}
