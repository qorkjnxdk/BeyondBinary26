import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/friends/unread - Get unread message counts per friend
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Find all active friend chat sessions
    const sessions = db.prepare(`
      SELECT session_id, user_a_id, user_b_id
      FROM chat_sessions
      WHERE session_type = 'friend'
        AND is_active = 1
        AND (user_a_id = ? OR user_b_id = ?)
    `).all(userId, userId) as any[];

    // For each session, count unread messages (messages from the other user that came after the user last checked)
    // We'll track "last seen" by finding the last message from the current user in each session
    const unreadCounts: Record<string, number> = {};

    for (const session of sessions) {
      const otherUserId = session.user_a_id === userId ? session.user_b_id : session.user_a_id;

      // Get the timestamp of the last message the current user sent in this session
      const lastUserMessage = db.prepare(`
        SELECT sent_at
        FROM messages
        WHERE session_id = ? AND sender_id = ?
        ORDER BY sent_at DESC
        LIMIT 1
      `).get(session.session_id, userId) as any;

      const lastSeenTime = lastUserMessage?.sent_at || 0;

      // Count messages from the other user sent after the last time the current user sent a message
      const unreadCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE session_id = ?
          AND sender_id = ?
          AND sent_at > ?
          AND is_deleted = 0
      `).get(session.session_id, otherUserId, lastSeenTime) as any;

      if (unreadCount.count > 0) {
        unreadCounts[otherUserId] = unreadCount.count;
      }
    }

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

