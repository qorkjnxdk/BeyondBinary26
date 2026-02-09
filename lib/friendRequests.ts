import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  session_id?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: number;
}

// Send a friend request
export function sendFriendRequest(senderId: string, receiverId: string, sessionId?: string): FriendRequest {
  const requestId = uuidv4();
  const now = Date.now();

  // Check if request already exists
  const existing = db.prepare(`
    SELECT request_id FROM friend_requests
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    AND status = 'pending'
    LIMIT 1
  `).get(senderId, receiverId, receiverId, senderId) as any;

  if (existing) {
    // Return existing request
    return db.prepare('SELECT * FROM friend_requests WHERE request_id = ?').get(existing.request_id) as FriendRequest;
  }

  db.prepare(`
    INSERT INTO friend_requests (request_id, sender_id, receiver_id, session_id, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(requestId, senderId, receiverId, sessionId || null, now);

  return {
    request_id: requestId,
    sender_id: senderId,
    receiver_id: receiverId,
    session_id: sessionId,
    status: 'pending',
    created_at: now,
  };
}

// Get pending friend requests for a user
export function getPendingFriendRequests(userId: string, type: 'sent' | 'received'): FriendRequest[] {
  const column = type === 'sent' ? 'sender_id' : 'receiver_id';
  const requests = db.prepare(`
    SELECT * FROM friend_requests
    WHERE ${column} = ? AND status = 'pending'
    ORDER BY created_at DESC
  `).all(userId) as any[];

  return requests.map((req: any) => ({
    ...req,
    status: req.status as FriendRequest['status'],
  }));
}

// Accept a friend request
export function acceptFriendRequest(requestId: string): FriendRequest | null {
  const request = db.prepare('SELECT * FROM friend_requests WHERE request_id = ?').get(requestId) as any;
  if (!request || request.status !== 'pending') return null;

  // Mark as accepted
  db.prepare('UPDATE friend_requests SET status = ? WHERE request_id = ?').run('accepted', requestId);

  return {
    ...request,
    status: 'accepted',
  };
}

// Decline a friend request
export function declineFriendRequest(requestId: string): void {
  db.prepare('UPDATE friend_requests SET status = ? WHERE request_id = ?').run('declined', requestId);
}

