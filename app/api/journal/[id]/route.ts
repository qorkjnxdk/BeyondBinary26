import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { updateJournalEntry, deleteJournalEntry } from '@/lib/journal';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const entry = updateJournalEntry(params.id, userId, content.trim());

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = requireAuth(request);
    const success = deleteJournalEntry(params.id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
