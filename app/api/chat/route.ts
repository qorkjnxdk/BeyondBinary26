import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getActiveSession, getChatSession, endChatSession, markMinimumTimeMet, getMessages, getOtherUserId, getRandomName, createChatSession } from '@/lib/chat';
import { createFriendship, areFriends } from '@/lib/friends';
import { applyPenalty } from '@/lib/auth';
import { getIO } from '@/lib/socketServer';
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
    
    // Check for early exit request and mutual requests
    const sessionData = db.prepare('SELECT early_exit_requested_by, continue_requested_by, friend_requested_by FROM chat_sessions WHERE session_id = ?').get(session.session_id) as any;
    const earlyExitRequestedBy = sessionData?.early_exit_requested_by || null;
    const hasEarlyExitRequest = earlyExitRequestedBy && earlyExitRequestedBy !== userId;
    const continueRequestedBy = sessionData?.continue_requested_by || null;
    const friendRequestedBy = sessionData?.friend_requested_by || null;

    // If this is a friend chat or became friends, get real names
    const isFriendChat = session.session_type === 'friend' || session.became_friends;
    let otherUser = null;
    if (isFriendChat) {
      const { getUserById } = await import('@/lib/auth');
      otherUser = getUserById(otherUserId);
    }

    return NextResponse.json({
      session: {
        ...session,
        otherUserId,
        myRandomName: randomName,
        otherRandomName,
        earlyExitRequestedBy: hasEarlyExitRequest ? earlyExitRequestedBy : null,
        continueRequestedBy: continueRequestedBy,
        friendRequestedBy: friendRequestedBy,
      },
      messages,
      otherUser: otherUser ? { real_name: otherUser.real_name } : null,
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
        // Send friend request instead of directly creating friendship
        const { sendFriendRequest } = await import('@/lib/friendRequests');
        if (!areFriends(userId, otherUserId)) {
          sendFriendRequest(userId, otherUserId, sessionId);
        }
      }

      const io = getIO();
      if (io) {
        io.to(sessionId).emit('session-update', {
          type: 'session-ended',
          sessionId,
          endedBy: userId,
          becameFriends,
        });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'mark-minimum-time') {
      markMinimumTimeMet(sessionId);

      const io = getIO();
      if (io) {
        io.to(sessionId).emit('session-update', {
          type: 'minimum-time-met',
          sessionId,
        });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'continue-request') {
      // User wants to continue chatting
      const otherUserId = getOtherUserId(session, userId);
      
      // Check current state before updating
      const currentState = db.prepare('SELECT continue_requested_by FROM chat_sessions WHERE session_id = ?').get(sessionId) as any;
      const currentRequester = currentState?.continue_requested_by;
      
      if (currentRequester === otherUserId) {
        // Other user already requested - both want to continue
        db.prepare('UPDATE chat_sessions SET continue_requested_by = NULL WHERE session_id = ?').run(sessionId);
        markMinimumTimeMet(sessionId);
        return NextResponse.json({ success: true, mutual: true });
      } else {
        // Set this user as requester
        db.prepare('UPDATE chat_sessions SET continue_requested_by = ? WHERE session_id = ?').run(userId, sessionId);
        return NextResponse.json({ success: true, waiting: true });
      }
    } else if (action === 'friend-request') {
      // User wants to send friend request
      const otherUserId = getOtherUserId(session, userId);
      db.prepare('UPDATE chat_sessions SET friend_requested_by = ? WHERE session_id = ?').run(userId, sessionId);
      
      // Send friend request
      const { sendFriendRequest } = await import('@/lib/friendRequests');
      sendFriendRequest(userId, otherUserId, sessionId);
      
      return NextResponse.json({ success: true });
    } else if (action === 'early-exit-request') {
      const elapsed = Date.now() - session.started_at;
      const thirtySeconds = 30 * 1000; // Changed to 30 seconds for testing

      if (elapsed < thirtySeconds) {
        // Store early exit request in database
        db.prepare('UPDATE chat_sessions SET early_exit_requested_by = ? WHERE session_id = ?').run(userId, sessionId);

        const io = getIO();
        if (io) {
          io.to(sessionId).emit('session-update', {
            type: 'early-exit-requested',
            sessionId,
            requestedBy: userId,
          });
        }

        return NextResponse.json({
          requiresApproval: true,
        });
      } else {
        // Can leave freely
        endChatSession(sessionId, false);
        return NextResponse.json({ success: true });
      }
    } else if (action === 'early-exit-approval') {
      const { approved } = data;
      const otherUserId = getOtherUserId(session, userId);

      // Clear the early exit request
      db.prepare('UPDATE chat_sessions SET early_exit_requested_by = NULL WHERE session_id = ?').run(sessionId);

      const io = getIO();

      if (!approved) {
        // Apply penalty to requester
        applyPenalty(otherUserId, 24);

        if (io) {
          io.to(sessionId).emit('session-update', {
            type: 'early-exit-denied',
            sessionId,
            deniedBy: userId,
            penaltyApplied: true,
          });
        }

        return NextResponse.json({
          success: true,
          penaltyApplied: true,
        });
      } else {
        // End chat with no penalty
        endChatSession(sessionId, false);

        if (io) {
          io.to(sessionId).emit('session-update', {
            type: 'session-ended',
            sessionId,
            earlyExitApproved: true,
          });
        }

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

