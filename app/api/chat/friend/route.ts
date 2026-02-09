import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createChatSession } from '@/lib/chat';
import { areFriends } from '@/lib/friends';
import { z } from 'zod';

const friendChatSchema = z.object({
  friendId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = friendChatSchema.parse(body);

    // Check if they're friends
    if (!areFriends(userId, validated.friendId)) {
      return NextResponse.json(
        { error: 'Not friends' },
        { status: 403 }
      );
    }

    // Create friend chat session
    const session = createChatSession(userId, validated.friendId, 'friend');

    return NextResponse.json({ session });
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

