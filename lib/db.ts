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
      postpartum_stage TEXT,
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
      continue_requested_by TEXT,
      friend_requested_by TEXT,
      FOREIGN KEY (user_a_id) REFERENCES users(user_id),
      FOREIGN KEY (user_b_id) REFERENCES users(user_id)
    )
  `);
  
  // Add new columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN early_exit_requested_by TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN continue_requested_by TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN friend_requested_by TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN current_prompt TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN postpartum_stage TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Baby Journey columns
  try {
    db.exec(`ALTER TABLE users ADD COLUMN baby_birth_date TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN baby_name TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN baby_journey_notifications_enabled INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN baby_journey_milestone_tracking_enabled INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists
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

  // Journal entries table (private journalling)
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      entry_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      sentiment INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // Habit logs table (simple habit tracker)
  db.exec(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      log_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      habit_type TEXT NOT NULL,
      value INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // Stage content table (6 stages: 0-5)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stage_content (
      stage INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL,
      age_range TEXT NOT NULL,
      milestones TEXT NOT NULL,
      challenges TEXT NOT NULL,
      look_forward TEXT NOT NULL,
      journal_prompts TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Baby milestones table (optional user tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS baby_milestones (
      milestone_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stage INTEGER NOT NULL,
      milestone_key TEXT NOT NULL,
      milestone_name TEXT NOT NULL,
      achieved INTEGER DEFAULT 0,
      achieved_at INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // Online users tracking (in-memory, but we'll use a table for persistence)
  db.exec(`
    CREATE TABLE IF NOT EXISTS online_users (
      user_id TEXT PRIMARY KEY,
      last_ping INTEGER NOT NULL,
      matching_prompt TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);
  
  // Add matching_prompt column if it doesn't exist
  try {
    db.exec(`ALTER TABLE online_users ADD COLUMN matching_prompt TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

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
    CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_user_created ON habit_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_baby_milestones_user ON baby_milestones(user_id, stage);
    CREATE INDEX IF NOT EXISTS idx_users_baby_birth_date ON users(baby_birth_date);
  `);

  // Seed stage content if empty
  seedStageContent();

  // Automatic cleanup on startup
  try {
    // Remove orphaned online_users (users that don't exist in users table)
    db.exec(`DELETE FROM online_users WHERE user_id NOT IN (SELECT user_id FROM users)`);

    // Remove stale online_users (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    db.prepare('DELETE FROM online_users WHERE last_ping < ?').run(oneHourAgo);
  } catch (e) {
    console.error('Cleanup error:', e);
  }
}

function seedStageContent() {
  const existingStages = db.prepare('SELECT COUNT(*) as count FROM stage_content').get() as any;
  if (existingStages.count > 0) return; // Already seeded

  const stages = [
    {
      stage: 0,
      title: "The Fourth Trimester",
      tagline: "You're both learning to be in the outside world",
      age_range: "0-1 month",
      milestones: JSON.stringify([
        "Sleeps 16-18 hours a day in short bursts",
        "Feeds 8-12 times per day",
        "Reflexes: rooting, sucking, startle, grasping",
        "Vision limited to 8-12 inches (your face during feeding!)",
        "Recognizes mother's voice and smell",
        "Umbilical cord stump falls off (7-21 days)"
      ]),
      challenges: JSON.stringify([
        "Extreme sleep deprivation (no sleep cycles established)",
        "Round-the-clock feeding every 2-3 hours",
        "Postpartum pain (vaginal tearing, C-section recovery, cramping)",
        "Breastfeeding difficulties (latch issues, nipple pain, supply concerns)",
        "Overwhelming responsibility ('Am I doing this right?')",
        "Postpartum bleeding (lochia) and body recovery",
        "Identity shock ('Who am I now?')",
        "Partner adjustment (relationship strain, unequal load)"
      ]),
      look_forward: JSON.stringify([
        "Baby starting to focus on your face",
        "First glimmers of personality emerging",
        "Umbilical cord healing (easier bathing!)",
        "First purposeful hand movements",
        "Learning your baby's unique cues",
        "Small moments of eye contact and connection",
        "Your body beginning to heal"
      ]),
      journal_prompts: JSON.stringify([
        "What surprised you most about this first month?",
        "What small moment made you smile today?",
        "What's one thing you're doing better than you think?",
        "What support do you need right now?"
      ])
    },
    {
      stage: 1,
      title: "Learning to Live in the Outside World",
      tagline: "You're both finding your rhythm",
      age_range: "1-3 months",
      milestones: JSON.stringify([
        "Smiles in response to your smiles (social smiling!)",
        "Raises head and chest during tummy time",
        "Tracks objects with eyes, less eye crossing",
        "Opens and shuts hands, brings hands to mouth",
        "Grips objects in their hands"
      ]),
      challenges: JSON.stringify([
        "6-week sleep regression (growth spurts disrupt sleep)",
        "Cluster feeding especially in evenings (supply building)",
        "Colic peaks (crying 3+ hours/day, usually improves by 3-4 months)",
        "Overstimulation (baby can't self-regulate yet)",
        "Feeling 'touched out' from constant holding/feeding",
        "Postpartum anxiety often peaks around 6-8 weeks"
      ]),
      look_forward: JSON.stringify([
        "First real smile directed at YOU (game-changer!)",
        "More alert, awake periods for interaction",
        "Beginning to self-soothe (hand to mouth)",
        "Longer nighttime sleep stretches (4-6 hours for some)",
        "More predictable feeding rhythms emerging"
      ]),
      journal_prompts: JSON.stringify([
        "When did you first see a real smile?",
        "What's getting easier, even just a little?",
        "What do you miss about your old life?",
        "What unexpected joys have you discovered?"
      ])
    },
    {
      stage: 2,
      title: "Reaching Out and Finding Their Voice",
      tagline: "Your baby is becoming more interactive",
      age_range: "4-6 months",
      milestones: JSON.stringify([
        "Rolls over (front to back, back to front)",
        "Laughs out loud",
        "Reaches for and grabs objects (especially your hair!)",
        "Sits up with support, excellent head control",
        "Brings everything to mouth for exploration",
        "May show interest in solid foods (readiness signs)",
        "Babbles with consonant sounds (ba-ba, da-da)"
      ]),
      challenges: JSON.stringify([
        "4-month sleep regression (major developmental leap disrupts sleep)",
        "Teething begins (drooling, fussiness, hand-chewing)",
        "Separation anxiety starts (can't be put down, clinginess)",
        "Rolling over at night (waking themselves up, SIDS anxiety)",
        "Distracted feeding (too interested in surroundings to eat)",
        "Starting solids stress (when? what? allergies? choking fear?)",
        "Constant grabbing (hair-pulling, face-scratching, glasses-snatching)",
        "Returning to work planning or guilt (for some mothers)"
      ]),
      look_forward: JSON.stringify([
        "Belly laughs that make everything worth it",
        "Grabbing your face during feeds (connection moment)",
        "Sitting supported, freeing your hands slightly",
        "Purposeful reaching and playing with toys",
        "Recognizing familiar faces (grandparents, siblings)",
        "First foods adventure (if starting solids)",
        "More robust sleep patterns emerging (for some)",
        "Baby becoming an interactive little person"
      ]),
      journal_prompts: JSON.stringify([
        "What makes your baby laugh?",
        "How are you feeling about work/childcare decisions?",
        "What part of your pre-baby self are you reclaiming?",
        "What boundaries do you need to set?"
      ])
    },
    {
      stage: 3,
      title: "Baby on the Move",
      tagline: "Mobility changes everything",
      age_range: "7-9 months",
      milestones: JSON.stringify([
        "Begins crawling (scooting, army crawling, or hands-and-knees)",
        "Sits without support",
        "Responds to their name and 'no'",
        "Babbles 'mama' and 'dada' (non-specifically)",
        "Claps, plays patty-cake and peekaboo",
        "Pulls up to standing position",
        "Object permanence develops (knows you exist when hidden)"
      ]),
      challenges: JSON.stringify([
        "Baby-proofing urgency (everything goes in mouth, constant danger patrol)",
        "Exhaustion from chasing a mobile baby",
        "Separation anxiety intensifies (screaming when you leave room)",
        "Interrupted sleep (pulling to stand in crib, getting stuck)",
        "Feeding battles (too busy to eat, throwing food)",
        "Stranger anxiety (won't go to anyone else, socially awkward)",
        "Constant vigilance (choking hazards, climbing, falling)",
        "Back pain from bending over to support cruising baby"
      ]),
      look_forward: JSON.stringify([
        "First crawling (they can GET to you now!)",
        "Peekaboo giggles (understanding games)",
        "Clapping when excited (showing emotions)",
        "Pulling to stand (so proud of themselves!)",
        "Baby exploring the world with curiosity",
        "Responding to their name (connection!)",
        "More independence during play (brief moments!)",
        "Personality shining through clearly"
      ]),
      journal_prompts: JSON.stringify([
        "What's different now that baby is mobile?",
        "How are you handling separation anxiety (yours or theirs)?",
        "What's harder than you expected? Easier?",
        "What support structures have helped most?"
      ])
    },
    {
      stage: 4,
      title: "Becoming a Toddler",
      tagline: "The baby phase is ending",
      age_range: "10-12 months",
      milestones: JSON.stringify([
        "Masters pincer grasp (picks up small objects)",
        "Cruises around furniture",
        "Says 1-3 words (Mama, Dada, ball)",
        "Points at desired objects",
        "Begins pretend play (phone to ear, feeding doll)",
        "May take first independent steps",
        "Understands simple commands ('come here,' 'give me')",
        "Waves bye-bye"
      ]),
      challenges: JSON.stringify([
        "First birthday overwhelm (planning, emotions, milestone grief)",
        "Walking falls and injuries (constant bumps and bruises)",
        "Sleep regression (12-month leap, dropping naps)",
        "Weaning decisions (societal pressure, personal readiness)",
        "Picky eating (food refusal, throwing, mess)",
        "Tantrums begin (limited communication, big emotions)",
        "Toddler-proofing (climbing everything, opening drawers)",
        "Nostalgia for baby phase mixed with exhaustion"
      ]),
      look_forward: JSON.stringify([
        "First words that aren't 'mama' or 'dada'",
        "First steps (if not walking yet - wide range is normal!)",
        "Waving and pointing to communicate",
        "Playing pretend (copying you adorably)",
        "Self-feeding with hands (messier but independent!)",
        "Understanding simple requests (communication breakthrough)",
        "More interactive play and games",
        "First birthday celebration of this incredible year"
      ]),
      journal_prompts: JSON.stringify([
        "How do you feel about your baby turning one?",
        "What's been your proudest moment as a mother?",
        "What surprised you most about this year?",
        "What do you want to remember forever?"
      ])
    },
    {
      stage: 5,
      title: "Your Baby is Now a Toddler",
      tagline: "Welcome to toddlerhood",
      age_range: "12+ months",
      milestones: JSON.stringify([
        "Walking independently",
        "Saying several words",
        "Understanding much more than they can say",
        "Using utensils (messily)",
        "Showing empathy and emotions",
        "Parallel play with other children",
        "Following simple instructions",
        "Exploring with confidence"
      ]),
      challenges: JSON.stringify([
        "Toddler tantrums and big emotions",
        "Boundary-setting and discipline questions",
        "Balancing independence with safety",
        "Identity as 'mom' vs. your own identity",
        "Thinking about (or avoiding thinking about) another baby",
        "Transition from baby to toddler feels bittersweet",
        "Sleep challenges continue for many",
        "Increased comparison to other toddlers (walking, talking milestones)"
      ]),
      look_forward: JSON.stringify([
        "Real conversations (even if one-sided)",
        "Sharing books and activities together",
        "Their personality is fully blooming",
        "More freedom as they become independent",
        "The magic of seeing the world through their eyes",
        "Building special traditions and routines",
        "Watching them make friends and play",
        "The unique bond you've built together"
      ]),
      journal_prompts: JSON.stringify([
        "How has your identity shifted in this first year+?",
        "What do you appreciate about the toddler stage?",
        "What are you ready to let go of from the baby phase?",
        "What do you need for yourself right now?"
      ])
    }
  ];

  const stmt = db.prepare(
    `INSERT INTO stage_content (stage, title, tagline, age_range, milestones, challenges, look_forward, journal_prompts, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stages.forEach(s => {
    stmt.run(s.stage, s.title, s.tagline, s.age_range, s.milestones, s.challenges, s.look_forward, s.journal_prompts, Date.now());
  });
}

// Initialize on import
initDatabase();

export default db;

``