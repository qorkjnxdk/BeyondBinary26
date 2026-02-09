import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createBlock, getBlocks, removeBlock } from '@/lib/blocks';
import { deleteFriendship } from '@/lib/friends';
import { getActiveSession, endChatSession } from '@/lib/chat';
import { z } from 'zod';

const blockSchema = z.object({
  blockedId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = blockSchema.parse(body);

    // Check if they're friends - unfriend them
    const { areFriends } = await import('@/lib/friends');
    if (areFriends(userId, validated.blockedId)) {
      deleteFriendship(userId, validated.blockedId);
    }

    // Check if they have an active chat - end it
    const session = getActiveSession(userId);
    if (session) {
      const { getOtherUserId } = await import('@/lib/chat');
      const otherUserId = getOtherUserId(session, userId);
      if (otherUserId === validated.blockedId) {
        endChatSession(session.session_id, false);
      }
    }

    const block = createBlock(userId, validated.blockedId);

    return NextResponse.json({ block });
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
    const blocks = getBlocks(userId);
    return NextResponse.json({ blocks });
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

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const { searchParams } = request.nextUrl;
    const blockedId = searchParams.get('blockedId');

    if (!blockedId) {
      return NextResponse.json(
        { error: 'blockedId is required' },
        { status: 400 }
      );
    }

    removeBlock(userId, blockedId);
    return NextResponse.json({ success: true });
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

