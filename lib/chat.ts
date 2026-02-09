import db from './db';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomName } from './matching';

export interface ChatSession {
  session_id: string;
  user_a_id: string;
  user_b_id: string;
  user_a_random_name: string;
  user_b_random_name: string;
  session_type: 'anonymous' | 'friend';
  prompt_text?: string;
  started_at: number;
  ended_at?: number;
  minimum_time_met: boolean;
  is_active: boolean;
  became_friends: boolean;
}

export interface Message {
  message_id: string;
  session_id: string;
  sender_id: string;
  message_text: string;
  sent_at: number;
  is_deleted: boolean;
}

// Create a new chat session
export function createChatSession(
  userAId: string,
  userBId: string,
  sessionType: 'anonymous' | 'friend',
  promptText?: string
): ChatSession {
  const sessionId = uuidv4();
  const now = Date.now();
  const userARandomName = generateRandomName();
  const userBRandomName = generateRandomName();

  db.prepare(`
    INSERT INTO chat_sessions (
      session_id, user_a_id, user_b_id, user_a_random_name, user_b_random_name,
      session_type, prompt_text, started_at, minimum_time_met, is_active, became_friends
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0)
  `).run(sessionId, userAId, userBId, userARandomName, userBRandomName, sessionType, promptText || null, now);

  return {
    session_id: sessionId,
    user_a_id: userAId,
    user_b_id: userBId,
    user_a_random_name: userARandomName,
    user_b_random_name: userBRandomName,
    session_type: sessionType,
    prompt_text: promptText,
    started_at: now,
    minimum_time_met: false,
    is_active: true,
    became_friends: false,
  };
}

// Get chat session by ID
export function getChatSession(sessionId: string): ChatSession | null {
  const session = db.prepare('SELECT * FROM chat_sessions WHERE session_id = ?').get(sessionId) as any;
  if (!session) return null;

  return {
    ...session,
    minimum_time_met: !!session.minimum_time_met,
    is_active: !!session.is_active,
    became_friends: !!session.became_friends,
  };
}

// Get active session for a user
export function getActiveSession(userId: string): ChatSession | null {
  const session = db.prepare(`
    SELECT * FROM chat_sessions
    WHERE (user_a_id = ? OR user_b_id = ?) AND is_active = 1
    ORDER BY started_at DESC
    LIMIT 1
  `).get(userId, userId) as any;

  if (!session) return null;

  return {
    ...session,
    minimum_time_met: !!session.minimum_time_met,
    is_active: !!session.is_active,
    became_friends: !!session.became_friends,
  };
}

// End a chat session
export function endChatSession(sessionId: string, becameFriends: boolean = false): void {
  const now = Date.now();
  db.prepare(`
    UPDATE chat_sessions
    SET ended_at = ?, is_active = 0, became_friends = ?
    WHERE session_id = ?
  `).run(now, becameFriends ? 1 : 0, sessionId);

  // If not becoming friends, delete messages
  if (!becameFriends) {
    db.prepare('UPDATE messages SET is_deleted = 1 WHERE session_id = ?').run(sessionId);
  }
}

// Mark minimum time as met
export function markMinimumTimeMet(sessionId: string): void {
  db.prepare('UPDATE chat_sessions SET minimum_time_met = 1 WHERE session_id = ?').run(sessionId);
}

// Add a message
export function addMessage(sessionId: string, senderId: string, messageText: string): Message {
  const messageId = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO messages (message_id, session_id, sender_id, message_text, sent_at, is_deleted)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(messageId, sessionId, senderId, messageText, now);

  return {
    message_id: messageId,
    session_id: sessionId,
    sender_id: senderId,
    message_text: messageText,
    sent_at: now,
    is_deleted: false,
  };
}

// Get messages for a session
export function getMessages(sessionId: string): Message[] {
  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ? AND is_deleted = 0
    ORDER BY sent_at ASC
  `).all(sessionId) as any[];

  return messages.map(m => ({
    ...m,
    is_deleted: !!m.is_deleted,
  }));
}

// Get other user in a session
export function getOtherUserId(session: ChatSession, userId: string): string {
  return session.user_a_id === userId ? session.user_b_id : session.user_a_id;
}

// Get random name for user in session
export function getRandomName(session: ChatSession, userId: string): string {
  return session.user_a_id === userId ? session.user_a_random_name : session.user_b_random_name;
}

