import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import {
  getUserMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '@/lib/babyJourney';
import { getIO } from '@/lib/socketServer';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);

    const url = new URL(request.url);
    const stageParam = url.searchParams.get('stage');
    const stage = stageParam ? parseInt(stageParam, 10) : undefined;

    const milestones = getUserMilestones(userId, stage);

    return NextResponse.json({ milestones });
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();

    const { stage, milestone_key, milestone_name } = body;

    if (stage === undefined || !milestone_key || !milestone_name) {
      return NextResponse.json({
        error: 'stage, milestone_key, and milestone_name are required'
      }, { status: 400 });
    }

    if (stage < 0 || stage > 5) {
      return NextResponse.json({
        error: 'stage must be between 0 and 5'
      }, { status: 400 });
    }

    const milestone = createMilestone(userId, stage, milestone_key, milestone_name);

    return NextResponse.json({ milestone });
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

export async function PUT(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();

    const { milestone_id, achieved, notes } = body;

    if (!milestone_id || achieved === undefined) {
      return NextResponse.json({
        error: 'milestone_id and achieved are required'
      }, { status: 400 });
    }

    const success = updateMilestone(milestone_id, userId, achieved, notes);

    if (!success) {
      return NextResponse.json({
        error: 'Milestone not found or not updated'
      }, { status: 404 });
    }

    // Emit celebration event if milestone achieved
    if (achieved) {
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('milestone_achieved', { milestone_id });
      }
    }

    return NextResponse.json({ success: true });
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

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);

    const url = new URL(request.url);
    const milestoneId = url.searchParams.get('milestone_id');

    if (!milestoneId) {
      return NextResponse.json({
        error: 'milestone_id is required'
      }, { status: 400 });
    }

    const success = deleteMilestone(milestoneId, userId);

    if (!success) {
      return NextResponse.json({
        error: 'Milestone not found or not deleted'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true });
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
