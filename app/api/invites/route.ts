import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createInvite, getPendingInvites, acceptInvite, declineInvite, cancelAllInvites } from '@/lib/invites';
import { createChatSession } from '@/lib/chat';
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

    const invites = getPendingInvites(userId, type);

    // Enrich with sender/receiver info
    const { getUserById } = await import('@/lib/auth');
    const { getVisibleProfileData } = await import('@/lib/matching');
    
    const enrichedInvites = invites.map((invite) => {
      const otherUserId = type === 'sent' ? invite.receiver_id : invite.sender_id;
      const otherUser = getUserById(otherUserId);
      if (!otherUser) return null;

      const visibleData = getVisibleProfileData(userId, otherUserId, 'anonymous');
      
      return {
        ...invite,
        otherUser: {
          userId: otherUser.user_id,
          visibleProfile: visibleData,
        },
      };
    }).filter(Boolean);

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
    const { inviteId, action } = body;

    if (action === 'accept') {
      const invite = acceptInvite(inviteId);
      if (!invite) {
        return NextResponse.json(
          { error: 'Invite not found or already processed' },
          { status: 400 }
        );
      }

      // Check if user already has an active session
      const { getActiveSession } = await import('@/lib/chat');
      if (getActiveSession(userId) || getActiveSession(invite.sender_id)) {
        return NextResponse.json(
          { error: 'One or both users already have an active chat session' },
          { status: 400 }
        );
      }

      // Create chat session
      const session = createChatSession(
        invite.sender_id,
        invite.receiver_id,
        'anonymous',
        invite.prompt_text
      );

      return NextResponse.json({ session });
    } else if (action === 'decline') {
      declineInvite(inviteId);
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

