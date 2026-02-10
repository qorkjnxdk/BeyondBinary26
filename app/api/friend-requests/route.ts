import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { sendFriendRequest, getPendingFriendRequests, acceptFriendRequest, declineFriendRequest } from '@/lib/friendRequests';
import { createFriendship, areFriends } from '@/lib/friends';
import { getUserById } from '@/lib/auth';
import { getIO } from '@/lib/socketServer';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { receiverId, sessionId } = body;

    console.log('[API] Friend request POST:', { userId, receiverId, sessionId });

    if (!receiverId) {
      console.error('[API] Missing receiverId');
      return NextResponse.json(
        { error: 'receiverId is required' },
        { status: 400 }
      );
    }

    // Check if already friends
    if (areFriends(userId, receiverId)) {
      console.log('[API] Users are already friends');
      return NextResponse.json(
        { error: 'You are already friends with this user' },
        { status: 400 }
      );
    }

    // Send friend request
    console.log('[API] Sending friend request...');
    const friendRequest = sendFriendRequest(userId, receiverId, sessionId);
    console.log('[API] Friend request created:', friendRequest.request_id);

    // Real-time notify receiver if online (including if they are in a chat)
    try {
      const io = getIO();
      const sender = getUserById(userId);
      if (io && sender) {
        io.to(`user:${receiverId}`).emit('friend-request-received', {
          requestId: friendRequest.request_id,
          senderId: sender.user_id,
          senderName: sender.real_name,
          sessionId: sessionId || null,
        });
      }
    } catch (e) {
      console.error('[API] Error emitting friend-request-received socket event:', e);
    }

    return NextResponse.json({ 
      success: true,
      friendRequest 
    });
  } catch (error: any) {
    console.error('[API] Error in POST /api/friend-requests:', error);
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const type = request.nextUrl.searchParams.get('type') as 'sent' | 'received' || 'received';

    const requests = getPendingFriendRequests(userId, type);

    // Enrich with user data
    const enrichedRequests = requests.map((req) => {
      const otherUserId = type === 'sent' ? req.receiver_id : req.sender_id;
      const otherUser = getUserById(otherUserId);
      if (!otherUser) return null;

      return {
        ...req,
        otherUser: {
          userId: otherUser.user_id,
          realName: otherUser.real_name,
        },
      };
    }).filter((req): req is NonNullable<typeof req> => req !== null);

    return NextResponse.json({ requests: enrichedRequests });
  } catch (error: any) {
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

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    // Get the request
    const requests = getPendingFriendRequests(userId, 'received');
    const friendRequest = requests.find(req => req.request_id === requestId);

    if (!friendRequest || friendRequest.receiver_id !== userId) {
      return NextResponse.json(
        { error: 'Friend request not found or unauthorized' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      const accepted = acceptFriendRequest(requestId);
      if (!accepted) {
        return NextResponse.json(
          { error: 'Failed to accept friend request' },
          { status: 500 }
        );
      }

      // Create friendship
      if (!areFriends(friendRequest.sender_id, friendRequest.receiver_id)) {
        createFriendship(friendRequest.sender_id, friendRequest.receiver_id, friendRequest.session_id || undefined);
      }

      // If there's a session_id, mark it as became_friends and preserve messages
      if (friendRequest.session_id) {
        db.prepare(`
          UPDATE chat_sessions
          SET became_friends = 1, session_type = 'friend'
          WHERE session_id = ?
        `).run(friendRequest.session_id);
        
        // Ensure messages are not deleted (they should already be preserved, but just in case)
        db.prepare('UPDATE messages SET is_deleted = 0 WHERE session_id = ?').run(friendRequest.session_id);
      }

      return NextResponse.json({ success: true, message: 'Friend request accepted' });
    } else if (action === 'decline') {
      declineFriendRequest(requestId);
      return NextResponse.json({ success: true, message: 'Friend request declined' });
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
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

