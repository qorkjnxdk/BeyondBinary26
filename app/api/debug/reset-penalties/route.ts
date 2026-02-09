import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import db from '@/lib/db';

// Debug endpoint to reset all penalties
export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Reset all penalties
    const result = db.prepare('UPDATE users SET penalty_end_date = NULL WHERE penalty_end_date IS NOT NULL').run();
    
    return NextResponse.json({ 
      success: true,
      message: `Reset penalties for ${result.changes} users`,
      changes: result.changes
    });
  } catch (error: any) {
    console.error('Error resetting penalties:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

