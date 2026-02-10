import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createInvite, getPendingInvites, acceptInvite, declineInvite, cancelAllInvites } from '@/lib/invites';
import { createChatSession } from '@/lib/chat';
import { getIO } from '@/lib/socketServer';
import { z } from 'zod';

const inviteSchema = z.object({
  receiverId: z.string().uuid(),
  promptText: z.string().max(280),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = inviteSchema.parse(body);

    // Check if user is penalized
    const { isUserPenalized } = await import('@/lib/auth');
    if (isUserPenalized(userId)) {
      return NextResponse.json(
        { error: 'You cannot chat for 24 hours due to early exit violation' },
        { status: 403 }
      );
    }

    // Check if user already has an active session
    const { getActiveSession } = await import('@/lib/chat');
    if (getActiveSession(userId)) {
      return NextResponse.json(
        { error: 'You already have an active chat session' },
        { status: 400 }
      );
    }

    const invite = createInvite(userId, validated.receiverId, validated.promptText);

    // Emit socket event to receiver
    const io = getIO();
    if (io) {
      const { getUserById } = await import('@/lib/auth');
      const { generateStableAlias } = await import('@/lib/matching');
      const sender = getUserById(userId);

      if (sender) {
        io.to(`user:${validated.receiverId}`).emit('invite-received', {
          ...invite,
          otherUser: {
            userId: sender.user_id,
            randomName: generateStableAlias(validated.receiverId, sender.user_id),
          },
        });
      }
    }

    return NextResponse.json({ invite });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const type = request.nextUrl.searchParams.get('type') as 'sent' | 'received' || 'received';

    // Expire old invites first
    const { expireOldInvites } = await import('@/lib/invites');
    expireOldInvites();

    const invites = getPendingInvites(userId, type);

    // Enrich with sender/receiver info
    const { getUserById } = await import('@/lib/auth');
    const { getVisibleProfileData, generateStableAlias } = await import('@/lib/matching');
    
    const enrichedInvites = invites.map((invite) => {
      const otherUserId = type === 'sent' ? invite.receiver_id : invite.sender_id;
      const otherUser = getUserById(otherUserId);
      if (!otherUser) return null;

      const visibleData = getVisibleProfileData(userId, otherUserId, 'anonymous');
      
      return {
        ...invite,
        otherUser: {
          userId: otherUser.user_id,
          randomName: generateStableAlias(userId, otherUser.user_id),
          visibleProfile: visibleData,
        },
      };
    }).filter((inv): inv is NonNullable<typeof inv> => inv !== null);

    return NextResponse.json({
      invites: enrichedInvites,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in GET /api/invites:', error);
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
    const { inviteId, action } = body;

    if (!inviteId || !action) {
      return NextResponse.json(
        { error: 'Missing inviteId or action' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // First check if the invite exists and belongs to this user
      const { getPendingInvites } = await import('@/lib/invites');
      const receivedInvites = getPendingInvites(userId, 'received');
      const invite = receivedInvites.find(inv => inv.invite_id === inviteId);
      
      if (!invite) {
        return NextResponse.json(
          { error: 'Invite not found, expired, or already processed' },
          { status: 400 }
        );
      }

      // Verify the invite receiver is the current user
      if (invite.receiver_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized to accept this invite' },
          { status: 403 }
        );
      }

      // Validate invite data
      if (!invite.sender_id || !invite.receiver_id) {
        console.error('Invalid invite data:', invite);
        return NextResponse.json(
          { error: 'Invalid invite data' },
          { status: 400 }
        );
      }

      // Check if user already has an active session
      const { getActiveSession } = await import('@/lib/chat');
      const userActiveSession = getActiveSession(userId);
      const senderActiveSession = getActiveSession(invite.sender_id);
      
      if (userActiveSession || senderActiveSession) {
        return NextResponse.json(
          { error: 'One or both users already have an active chat session' },
          { status: 400 }
        );
      }

      // Accept the invite (this will cancel other invites)
      // Use the invite data we already have, but still call acceptInvite to update the database
      const acceptedInvite = acceptInvite(inviteId);
      if (!acceptedInvite) {
        // The invite might have been processed between our check and now
        // Re-check to see if it was already accepted (race condition)
        const { getPendingInvites: recheckInvites } = await import('@/lib/invites');
        const recheck = recheckInvites(userId, 'received').find(inv => inv.invite_id === inviteId);
        if (!recheck) {
          // Check if there's already an active session (maybe another request accepted it)
          const newUserSession = getActiveSession(userId);
          const newSenderSession = getActiveSession(invite.sender_id);
          if (newUserSession || newSenderSession) {
            return NextResponse.json(
              { error: 'This invite was already accepted by another request' },
              { status: 409 }
            );
          }
        }
        return NextResponse.json(
          { error: 'Failed to accept invite. It may have expired or already been processed.' },
          { status: 400 }
        );
      }

      // Verify both users exist before creating session
      const { getUserById } = await import('@/lib/auth');
      const sender = getUserById(invite.sender_id);
      const receiver = getUserById(invite.receiver_id);
      
      if (!sender || !receiver) {
        console.error('User not found:', { sender: !!sender, receiver: !!receiver, senderId: invite.sender_id, receiverId: invite.receiver_id });
        return NextResponse.json(
          { error: 'One or both users not found' },
          { status: 404 }
        );
      }

      // Create chat session
      try {
        const session = createChatSession(
          invite.sender_id,
          invite.receiver_id,
          'anonymous',
          invite.prompt_text
        );

        // Clear current prompts for both users since they're now in a chat
        const { updateCurrentPrompt } = await import('@/lib/auth');
        updateCurrentPrompt(invite.sender_id, null);
        updateCurrentPrompt(invite.receiver_id, null);

        // Get random names for the session
        const { getRandomName, getOtherUserId } = await import('@/lib/chat');
        const otherUserId = getOtherUserId(session, userId);
        const myRandomName = getRandomName(session, userId);
        const otherRandomName = getRandomName(session, otherUserId);

        // Emit socket event to sender (invite was accepted)
        const io = getIO();
        if (io) {
          io.to(`user:${invite.sender_id}`).emit('invite-accepted', {
            inviteId: invite.invite_id,
            session: {
              ...session,
              otherUserId: userId,
              myRandomName: getRandomName(session, invite.sender_id),
              otherRandomName: getRandomName(session, userId),
            },
          });
        }

        return NextResponse.json({
          session: {
            ...session,
            otherUserId,
            myRandomName,
            otherRandomName,
          }
        });
      } catch (sessionError: any) {
        console.error('Error creating chat session:', sessionError);
        console.error('Session creation details:', {
          senderId: invite.sender_id,
          receiverId: invite.receiver_id,
          promptText: invite.prompt_text,
          error: sessionError.message,
          stack: sessionError.stack
        });
        return NextResponse.json(
          { error: 'Failed to create chat session', details: sessionError.message },
          { status: 500 }
        );
      }
    } else if (action === 'decline') {
      // Verify the invite belongs to this user
      const { getPendingInvites } = await import('@/lib/invites');
      const receivedInvites = getPendingInvites(userId, 'received');
      const invite = receivedInvites.find(inv => inv.invite_id === inviteId);
      
      if (!invite || invite.receiver_id !== userId) {
        return NextResponse.json(
          { error: 'Invite not found or unauthorized' },
          { status: 400 }
        );
      }

      declineInvite(inviteId);

      // Emit socket event to sender (invite was declined)
      const io = getIO();
      if (io) {
        io.to(`user:${invite.sender_id}`).emit('invite-declined', {
          inviteId: invite.invite_id,
        });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'cancel-all') {
      cancelAllInvites(userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/invites:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for database constraint errors
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { error: 'Database constraint error: One or both users may not exist', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
}

