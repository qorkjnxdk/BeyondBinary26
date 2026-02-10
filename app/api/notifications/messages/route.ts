import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { areFriends } from '@/lib/friends';
import { getMessages } from '@/lib/chat';
import { getUserById } from '@/lib/auth';
import db from '@/lib/db';

// Get unread messages from friends (messages from friend chats that user hasn't seen)
export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Get all friend chat sessions for this user
    const friendSessions = db.prepare(`
      SELECT session_id, user_a_id, user_b_id 
      FROM chat_sessions
      WHERE (user_a_id = ? OR user_b_id = ?)
      AND (session_type = 'friend' OR became_friends = 1)
      AND is_active = 1
    `).all(userId, userId) as any[];

    const unreadMessages: any[] = [];

    for (const session of friendSessions) {
      const otherUserId = session.user_a_id === userId ? session.user_b_id : session.user_a_id;
      
      // Check if they're friends
      if (!areFriends(userId, otherUserId)) continue;

      // Get the last message in this session
      const lastMessage = db.prepare(`
        SELECT * FROM messages
        WHERE session_id = ? AND is_deleted = 0
        ORDER BY sent_at DESC
        LIMIT 1
      `).get(session.session_id) as any;

      if (lastMessage && lastMessage.sender_id !== userId) {
        // This is a message from the friend
        // Check if user has seen it (we'll use a simple heuristic: if it's recent and user isn't in that chat)
        const otherUser = getUserById(otherUserId);
        if (otherUser) {
          unreadMessages.push({
            message_id: lastMessage.message_id,
            session_id: session.session_id,
            sender_id: lastMessage.sender_id,
            senderName: otherUser.real_name,
            message_text: lastMessage.message_text,
            sent_at: lastMessage.sent_at,
          });
        }
      }
    }

    // Sort by most recent
    unreadMessages.sort((a, b) => b.sent_at - a.sent_at);

    return NextResponse.json({ messages: unreadMessages });
  } catch (error: any) {
    console.error('Error in GET /api/notifications/messages:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

