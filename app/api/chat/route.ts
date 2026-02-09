import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getActiveSession, getChatSession, endChatSession, markMinimumTimeMet, getMessages, getOtherUserId, getRandomName, createChatSession } from '@/lib/chat';
import { createFriendship, areFriends } from '@/lib/friends';
import { applyPenalty } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const friendId = request.nextUrl.searchParams.get('friendId');

    let session;
    if (friendId) {
      // Check if they're friends
      const { areFriends } = await import('@/lib/friends');
      if (!areFriends(userId, friendId)) {
        return NextResponse.json(
          { error: 'Not friends' },
          { status: 403 }
        );
      }

      // Find or create friend chat session
      const existingSession = db.prepare(`
        SELECT * FROM chat_sessions
        WHERE ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))
        AND session_type = 'friend' AND is_active = 1
        ORDER BY started_at DESC
        LIMIT 1
      `).get(userId, friendId, friendId, userId) as any;

      if (existingSession) {
        session = {
          ...existingSession,
          minimum_time_met: !!existingSession.minimum_time_met,
          is_active: !!existingSession.is_active,
          became_friends: !!existingSession.became_friends,
        };
      } else {
        // Create new friend chat session
        session = createChatSession(userId, friendId, 'friend');
      }
    } else if (sessionId) {
      session = getChatSession(sessionId);
      if (!session || (session.user_a_id !== userId && session.user_b_id !== userId)) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    } else {
      session = getActiveSession(userId);
    }

    if (!session) {
      return NextResponse.json({ session: null });
    }

    const messages = getMessages(session.session_id);
    const otherUserId = getOtherUserId(session, userId);
    const randomName = getRandomName(session, userId);
    const otherRandomName = getRandomName(session, otherUserId);

    return NextResponse.json({
      session: {
        ...session,
        otherUserId,
        myRandomName: randomName,
        otherRandomName,
      },
      messages,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { sessionId, action, data } = body;

    const session = getChatSession(sessionId);
    if (!session || (session.user_a_id !== userId && session.user_b_id !== userId)) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (action === 'end') {
      const becameFriends = data?.becameFriends === true;
      endChatSession(sessionId, becameFriends);
      
      if (becameFriends) {
        const otherUserId = getOtherUserId(session, userId);
        if (!areFriends(userId, otherUserId)) {
          createFriendship(userId, otherUserId, sessionId);
        }
      }

      return NextResponse.json({ success: true });
    } else if (action === 'mark-minimum-time') {
      markMinimumTimeMet(sessionId);
      return NextResponse.json({ success: true });
    } else if (action === 'early-exit-request') {
      const elapsed = Date.now() - session.started_at;
      const tenMinutes = 10 * 60 * 1000;

      if (elapsed < tenMinutes) {
        // Request early exit - return info for other user to approve
        const otherUserId = getOtherUserId(session, userId);
        return NextResponse.json({
          requiresApproval: true,
          otherUserId,
        });
      } else {
        // Can leave freely
        endChatSession(sessionId, false);
        return NextResponse.json({ success: true });
      }
    } else if (action === 'early-exit-approval') {
      const { approved } = data;
      const otherUserId = getOtherUserId(session, userId);

      if (!approved) {
        // Apply penalty to requester
        applyPenalty(otherUserId, 24);
        return NextResponse.json({
          success: true,
          penaltyApplied: true,
        });
      } else {
        // End chat with no penalty
        endChatSession(sessionId, false);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

