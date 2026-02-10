import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { updateBabyJourneySettings, getBabyJourneyData } from '@/lib/babyJourney';
import { getIO } from '@/lib/socketServer';

export async function PUT(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();

    const { baby_birth_date, baby_name, notifications_enabled, milestone_tracking_enabled } = body;

    // Validate birth date if provided
    if (baby_birth_date !== undefined && baby_birth_date !== null && baby_birth_date !== '') {
      const date = new Date(baby_birth_date);
      if (isNaN(date.getTime())) {
        return NextResponse.json({
          error: 'Invalid birth date format. Use YYYY-MM-DD.'
        }, { status: 400 });
      }

      // Check if date is not in the future
      if (date.getTime() > Date.now()) {
        return NextResponse.json({
          error: 'Birth date cannot be in the future'
        }, { status: 400 });
      }
    }

    const success = updateBabyJourneySettings(userId, {
      baby_birth_date,
      baby_name,
      notifications_enabled,
      milestone_tracking_enabled,
    });

    if (!success) {
      return NextResponse.json({
        error: 'No settings updated'
      }, { status: 400 });
    }

    // Get updated journey data
    const journeyData = getBabyJourneyData(userId);

    // Emit socket event if stage changed (useful for real-time updates)
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('baby_journey_updated', journeyData);
    }

    return NextResponse.json({
      success: true,
      journey: journeyData
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
