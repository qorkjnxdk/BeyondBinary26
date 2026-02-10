import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { DEFAULT_HABITS, getTodayHabits, logHabit, HabitType } from '@/lib/habits';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const logs = getTodayHabits(userId);

    const summary = DEFAULT_HABITS.map(habit => ({
      id: habit.id,
      label: habit.label,
      completed: logs.some(log => log.habit_type === habit.id),
    }));

    return NextResponse.json({ habits: summary, logs });
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
    const { habitType } = body as { habitType: HabitType };

    if (!habitType) {
      return NextResponse.json({ error: 'habitType is required' }, { status: 400 });
    }

    const log = logHabit(userId, habitType);
    return NextResponse.json({ log });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
