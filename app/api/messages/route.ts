import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { addMessage, getChatSession } from '@/lib/chat';
import { getIO } from '@/lib/socketServer';
import { z } from 'zod';

const messageSchema = z.object({
  sessionId: z.string().uuid(),
  messageText: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = messageSchema.parse(body);

    const session = getChatSession(validated.sessionId);
    if (!session || (session.user_a_id !== userId && session.user_b_id !== userId)) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    const message = addMessage(validated.sessionId, userId, validated.messageText);

    const io = getIO();
    if (io) {
      io.to(validated.sessionId).emit('new-message', message);
    }

    return NextResponse.json({ message });
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

