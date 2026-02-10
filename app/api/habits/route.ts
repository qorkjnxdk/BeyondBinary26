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
      // Completed if the summed value for this habit today is > 0
      completed:
        logs
          .filter(log => log.habit_type === habit.id)
          .reduce((sum, log) => sum + (log.value || 0), 0) > 0,
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

    // Determine current state for this habit today
    const logs = getTodayHabits(userId).filter(log => log.habit_type === habitType);
    const currentTotal = logs.reduce((sum, log) => sum + (log.value || 0), 0);

    // Toggle: if currently completed (>0), log a -1 (untick); otherwise +1 (tick)
    const delta = currentTotal > 0 ? -1 : 1;
    const log = logHabit(userId, habitType, delta);

    return NextResponse.json({ log, completed: currentTotal + delta > 0 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
