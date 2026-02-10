import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface Invite {
  invite_id: string;
  sender_id: string;
  receiver_id: string;
  prompt_text: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  created_at: number;
  expires_at: number;
}

// Create an invite
export function createInvite(senderId: string, receiverId: string, promptText: string): Invite {
  const inviteId = uuidv4();
  const now = Date.now();
  const expiresAt = now + 2 * 60 * 1000; // 2 minutes

  db.prepare(`
    INSERT INTO invites (invite_id, sender_id, receiver_id, prompt_text, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `).run(inviteId, senderId, receiverId, promptText, now, expiresAt);

  return {
    invite_id: inviteId,
    sender_id: senderId,
    receiver_id: receiverId,
    prompt_text: promptText,
    status: 'pending',
    created_at: now,
    expires_at: expiresAt,
  };
}

// Get pending invites for a user
export function getPendingInvites(userId: string, type: 'sent' | 'received'): Invite[] {
  const column = type === 'sent' ? 'sender_id' : 'receiver_id';
  const invites = db.prepare(`
    SELECT * FROM invites
    WHERE ${column} = ? AND status = 'pending' AND expires_at > ?
    ORDER BY created_at DESC
  `).all(userId, Date.now()) as any[];

  return invites.map((inv: any) => ({
    ...inv,
    status: inv.status as Invite['status'],
  }));
}

// Accept an invite
export function acceptInvite(inviteId: string): Invite | null {
  const invite = db.prepare('SELECT * FROM invites WHERE invite_id = ?').get(inviteId) as any;
  if (!invite) return null;
  
  // Check if invite is still pending and not expired
  if (invite.status !== 'pending') return null;
  if (invite.expires_at <= Date.now()) {
    // Auto-expire it
    db.prepare('UPDATE invites SET status = ? WHERE invite_id = ?').run('expired', inviteId);
    return null;
  }

  // Cancel all other pending invites for both users
  db.prepare(`
    UPDATE invites
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND (sender_id = ? OR receiver_id = ? OR sender_id = ? OR receiver_id = ?)
    AND invite_id != ?
  `).run(invite.sender_id, invite.sender_id, invite.receiver_id, invite.receiver_id, inviteId);

  // Mark this invite as accepted
  db.prepare('UPDATE invites SET status = ? WHERE invite_id = ?').run('accepted', inviteId);

  return {
    ...invite,
    status: 'accepted',
  };
}

// Decline an invite
export function declineInvite(inviteId: string): void {
  db.prepare('UPDATE invites SET status = ? WHERE invite_id = ?').run('declined', inviteId);
}

// Cancel all pending invites for a user
export function cancelAllInvites(userId: string): void {
  db.prepare(`
    UPDATE invites
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND (sender_id = ? OR receiver_id = ?)
  `).run(userId, userId);
  
  // Also clear the current prompt when cancelling all invites (user is starting fresh)
  // Note: We don't clear it here because the matches API will set a new one
  // This is just for reference - the matches API handles prompt updates
}

// Expire old invites (should be called periodically)
export function expireOldInvites(): void {
  db.prepare(`
    UPDATE invites
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at <= ?
  `).run(Date.now());
}

