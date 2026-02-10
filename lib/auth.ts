import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  user_id: string;
  email: string;
  real_name: string;
  gender: string;
  age?: number;
  marital_status?: string;
  employment?: string;
  hobbies?: string[];
  location?: string;
  has_baby?: string;
  postpartum_stage?: string;
  career_field?: string;
  privacy_settings?: Record<string, string>;
  account_status: string;
  penalty_end_date?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function getUserById(userId: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId) as any;
  if (!user) return null;

  return {
    ...user,
    hobbies: user.hobbies ? JSON.parse(user.hobbies) : [],
    privacy_settings: user.privacy_settings ? JSON.parse(user.privacy_settings) : {},
  };
}

export function getUserByEmail(email: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return null;

  return {
    ...user,
    hobbies: user.hobbies ? JSON.parse(user.hobbies) : [],
    privacy_settings: user.privacy_settings ? JSON.parse(user.privacy_settings) : {},
  };
}

export function createUser(data: {
  singpassNric: string;
  email: string;
  passwordHash: string;
  realName: string;
  gender: string;
}): string {
  const userId = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO users (user_id, singpass_nric, email, password_hash, real_name, gender, created_at, account_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(userId, data.singpassNric, data.email, data.passwordHash, data.realName, data.gender, now);

  return userId;
}

export function updateUserProfile(userId: string, updates: Partial<User>): void {
  const allowedFields = ['age', 'marital_status', 'employment', 'hobbies', 'location', 'has_baby', 'postpartum_stage', 'career_field', 'privacy_settings'];
  const updatesToApply: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      if (key === 'hobbies' || key === 'privacy_settings') {
        updatesToApply[key] = JSON.stringify(value);
      } else {
        updatesToApply[key] = value;
      }
    }
  }

  if (Object.keys(updatesToApply).length === 0) return;

  const setClause = Object.keys(updatesToApply).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updatesToApply);
  values.push(userId);

  db.prepare(`UPDATE users SET ${setClause} WHERE user_id = ?`).run(...values);
}

export function updateLastActive(userId: string): void {
  db.prepare('UPDATE users SET last_active = ? WHERE user_id = ?').run(Date.now(), userId);
  
  // Also update online_users
  const existing = db.prepare('SELECT user_id FROM online_users WHERE user_id = ?').get(userId) as any;
  if (existing) {
    db.prepare('UPDATE online_users SET last_ping = ? WHERE user_id = ?').run(Date.now(), userId);
  } else {
    db.prepare('INSERT INTO online_users (user_id, last_ping) VALUES (?, ?)').run(userId, Date.now());
  }
}

// Update user's current active prompt (shown to others when they're looking for matches)
export function updateCurrentPrompt(userId: string, prompt: string | null): void {
  db.prepare('UPDATE users SET current_prompt = ? WHERE user_id = ?').run(prompt, userId);
}

export function getOnlineUsers(excludeUserId?: string): User[] {
  // Extended to 30 minutes for testing - users who have been active in last 30 minutes
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  let query = `
    SELECT u.* FROM users u
    INNER JOIN online_users ou ON u.user_id = ou.user_id
    WHERE ou.last_ping > ? AND u.account_status = 'active'
  `;
  const params: any[] = [thirtyMinutesAgo];

  if (excludeUserId) {
    query += ' AND u.user_id != ?';
    params.push(excludeUserId);
  }

  const users = db.prepare(query).all(...params) as any[];
  return users.map(user => ({
    ...user,
    hobbies: user.hobbies ? JSON.parse(user.hobbies) : [],
    privacy_settings: user.privacy_settings ? JSON.parse(user.privacy_settings) : {},
  }));
}

export function isUserPenalized(userId: string): boolean {
  const user = getUserById(userId);
  if (!user || !user.penalty_end_date) return false;
  return Date.now() < user.penalty_end_date;
}

export function applyPenalty(userId: string, hours: number): void {
  const endDate = Date.now() + (hours * 60 * 60 * 1000);
  db.prepare('UPDATE users SET penalty_end_date = ? WHERE user_id = ?').run(endDate, userId);
}

