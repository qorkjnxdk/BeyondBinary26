import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getBabyJourneyData, getAllStageContent } from '@/lib/babyJourney';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);

    const journeyData = getBabyJourneyData(userId);
    const allStages = getAllStageContent();

    return NextResponse.json({
      journey: journeyData,
      all_stages: allStages
    });
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
