import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getStageContent } from '@/lib/babyJourney';

export async function GET(
  request: NextRequest,
  { params }: { params: { stageNumber: string } }
) {
  try {
    const { userId } = requireAuth(request);

    const stageNumber = parseInt(params.stageNumber, 10);

    if (isNaN(stageNumber) || stageNumber < 0 || stageNumber > 5) {
      return NextResponse.json({
        error: 'Invalid stage number. Must be 0-5.'
      }, { status: 400 });
    }

    const stageContent = getStageContent(stageNumber);

    if (!stageContent) {
      return NextResponse.json({
        error: 'Stage content not found'
      }, { status: 404 });
    }

    return NextResponse.json({ stage: stageContent });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
