import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createReport } from '@/lib/reports';
import { z } from 'zod';

const reportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(['Harassment', 'Inappropriate Content', 'Spam', 'Impersonation', 'Other']),
  description: z.string().max(500).optional(),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = reportSchema.parse(body);

    const report = createReport(
      userId,
      validated.reportedId,
      validated.reason,
      validated.description,
      validated.sessionId
    );

    return NextResponse.json({ report });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

