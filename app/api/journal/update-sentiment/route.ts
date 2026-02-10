import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { updateEntrySentiment } from '@/lib/journal';

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { entry_id, sentiment_score } = body;

    if (!entry_id || typeof entry_id !== 'string') {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    if (typeof sentiment_score !== 'number' || sentiment_score < 0 || sentiment_score > 99) {
      return NextResponse.json({ error: 'Invalid sentiment score' }, { status: 400 });
    }

    const success = updateEntrySentiment(entry_id, userId, sentiment_score);

    if (!success) {
      return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error updating sentiment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
