import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createJournalEntry, getJournalEntries } from '@/lib/journal';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const entries = getJournalEntries(userId, 50);
    return NextResponse.json({ entries });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const entry = createJournalEntry(userId, content.trim());
    return NextResponse.json({ entry });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
