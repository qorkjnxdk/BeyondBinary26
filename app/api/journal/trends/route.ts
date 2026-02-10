import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7days';

    // Calculate date range
    const daysAgo = period === '7days' ? 7 : 30;
    const startDate = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);

    // Query database for entries with sentiment scores
    const entries = db.prepare(`
      SELECT
        entry_id,
        sentiment,
        created_at,
        date(created_at/1000, 'unixepoch') as date
      FROM journal_entries
      WHERE user_id = ?
        AND created_at >= ?
        AND sentiment IS NOT NULL
      ORDER BY created_at ASC
    `).all(userId, startDate) as Array<{
      entry_id: string;
      sentiment: number;
      created_at: number;
      date: string;
    }>;

    // If no entries, return empty data
    if (entries.length === 0) {
      return NextResponse.json({
        period,
        data: [],
        average: null,
        trend: 'stable',
      });
    }

    // Calculate average sentiment
    const average = Math.round(
      entries.reduce((sum, e) => sum + e.sentiment, 0) / entries.length
    );

    // Determine trend (compare first half vs second half)
    let trend = 'stable';
    if (entries.length >= 4) {
      const midpoint = Math.floor(entries.length / 2);
      const firstHalf = entries.slice(0, midpoint);
      const secondHalf = entries.slice(midpoint);

      const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.sentiment, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.sentiment, 0) / secondHalf.length;

      if (secondHalfAvg > firstHalfAvg + 10) {
        trend = 'improving';
      } else if (secondHalfAvg < firstHalfAvg - 10) {
        trend = 'declining';
      }
    }

    return NextResponse.json({
      period,
      data: entries.map(e => ({
        date: e.date,
        sentiment: e.sentiment,
        entry_id: e.entry_id,
      })),
      average,
      trend,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching journal trends:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
