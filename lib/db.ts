import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database', 'app.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      singpass_nric TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER,
      marital_status TEXT,
      employment TEXT,
      hobbies TEXT, -- JSON array
      location TEXT,
      has_baby TEXT,
      career_field TEXT,
      privacy_settings TEXT, -- JSON object
      created_at INTEGER NOT NULL,
      last_active INTEGER,
      account_status TEXT DEFAULT 'active',
      suspension_end_date INTEGER,
      penalty_end_date INTEGER
    )
  `);

  // Chat sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      user_a_random_name TEXT NOT NULL,
      user_b_random_name TEXT NOT NULL,
      session_type TEXT NOT NULL,
      prompt_text TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      minimum_time_met INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      became_friends INTEGER DEFAULT 0,
      early_exit_requested_by TEXT,
      FOREIGN KEY (user_a_id) REFERENCES users(user_id),
      FOREIGN KEY (user_b_id) REFERENCES users(user_id)
    )
  `);
  
  // Add early_exit_requested_by column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN early_exit_requested_by TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
      FOREIGN KEY (sender_id) REFERENCES users(user_id)
    )
  `);

  // Friend requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      request_id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      session_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES users(user_id),
      FOREIGN KEY (receiver_id) REFERENCES users(user_id),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
    )
  `);

  // Friendships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      friendship_id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      origin_session_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_a_id) REFERENCES users(user_id),
      FOREIGN KEY (user_b_id) REFERENCES users(user_id),
      FOREIGN KEY (origin_session_id) REFERENCES chat_sessions(session_id),
      UNIQUE(user_a_id, user_b_id)
    )
  `);

  // Invites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invites (
      invite_id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES users(user_id),
      FOREIGN KEY (receiver_id) REFERENCES users(user_id)
    )
  `);

  // Blocks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      block_id TEXT PRIMARY KEY,
      blocker_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (blocker_id) REFERENCES users(user_id),
      FOREIGN KEY (blocked_id) REFERENCES users(user_id),
      UNIQUE(blocker_id, blocked_id)
    )
  `);

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      report_id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_id TEXT NOT NULL,
      session_id TEXT,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      moderator_notes TEXT,
      action_taken TEXT,
      FOREIGN KEY (reporter_id) REFERENCES users(user_id),
      FOREIGN KEY (reported_id) REFERENCES users(user_id),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
    )
  `);

  // Online users tracking (in-memory, but we'll use a table for persistence)
  db.exec(`
    CREATE TABLE IF NOT EXISTS online_users (
      user_id TEXT PRIMARY KEY,
      last_ping INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_a_id, user_b_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
    CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
    CREATE INDEX IF NOT EXISTS idx_online_users_ping ON online_users(last_ping);
  `);
}

// Initialize on import
initDatabase();

export default db;

