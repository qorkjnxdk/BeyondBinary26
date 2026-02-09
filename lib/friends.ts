import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface Friendship {
  friendship_id: string;
  user_a_id: string;
  user_b_id: string;
  origin_session_id?: string;
  created_at: number;
}

// Create a friendship
export function createFriendship(userAId: string, userBId: string, originSessionId?: string): Friendship {
  const friendshipId = uuidv4();
  const now = Date.now();

  // Ensure user_a_id < user_b_id for consistency
  const [userA, userB] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  db.prepare(`
    INSERT INTO friendships (friendship_id, user_a_id, user_b_id, origin_session_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(friendshipId, userA, userB, originSessionId || null, now);

  return {
    friendship_id: friendshipId,
    user_a_id: userA,
    user_b_id: userB,
    origin_session_id: originSessionId,
    created_at: now,
  };
}

// Check if two users are friends
export function areFriends(userAId: string, userBId: string): boolean {
  const [userA, userB] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  const friendship = db.prepare(`
    SELECT friendship_id FROM friendships
    WHERE user_a_id = ? AND user_b_id = ?
    LIMIT 1
  `).get(userA, userB);

  return !!friendship;
}

// Get all friends for a user
export function getFriends(userId: string): Array<{ user_id: string; created_at: number }> {
  const friendships = db.prepare(`
    SELECT user_a_id, user_b_id, created_at FROM friendships
    WHERE user_a_id = ? OR user_b_id = ?
    ORDER BY created_at DESC
  `).all(userId, userId) as Array<{ user_a_id: string; user_b_id: string; created_at: number }>;

  return friendships.map((f: { user_a_id: string; user_b_id: string; created_at: number }) => ({
    user_id: f.user_a_id === userId ? f.user_b_id : f.user_a_id,
    created_at: f.created_at,
  }));
}

// Delete a friendship
export function deleteFriendship(userAId: string, userBId: string): void {
  const [userA, userB] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  db.prepare('DELETE FROM friendships WHERE user_a_id = ? AND user_b_id = ?').run(userA, userB);
}

