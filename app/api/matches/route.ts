import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { findMatches, getVisibleProfileData, getRecentPrompts } from '@/lib/matching';
import { cancelAllInvites } from '@/lib/invites';
import { z } from 'zod';

const matchSchema = z.object({
  prompt: z.string().min(1).max(280),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = matchSchema.parse(body);

    // Check if user is penalized
    const { isUserPenalized } = await import('@/lib/auth');
    if (isUserPenalized(userId)) {
      return NextResponse.json(
        { error: 'You cannot chat for 24 hours due to early exit violation' },
        { status: 403 }
      );
    }

    // Clear all previous pending invites when submitting a new prompt
    cancelAllInvites(userId);
    console.log('[API] Cleared all previous pending invites for user:', userId);

    // Store the current prompt and set matching status
    const { updateCurrentPrompt, setMatchingStatus } = await import('@/lib/auth');
    updateCurrentPrompt(userId, validated.prompt);
    setMatchingStatus(userId, validated.prompt);
    console.log('[API] Updated current prompt and set matching status for user:', userId);

    // Find matches
    console.log('[API] Finding matches for user:', userId, 'with prompt:', validated.prompt);
    const matches = findMatches(userId, validated.prompt);
    console.log('[API] Found matches:', matches.length);
    console.log('[API] Match user IDs:', matches.map(m => m.user.user_id));

    // Format matches with visible profile data and recent prompt
    const formattedMatches = matches.map(match => {
      const visibleData = getVisibleProfileData(userId, match.user.user_id, 'anonymous');
      const recentPrompts = getRecentPrompts(match.user.user_id, 1);
      const otherUserPrompt = recentPrompts.length > 0 ? recentPrompts[0] : null;
      
      return {
        userId: match.user.user_id,
        randomName: match.randomName,
        similarityScore: match.similarityScore,
        visibleProfile: visibleData,
        otherUserPrompt: otherUserPrompt, // Include the other user's prompt
      };
    });

    console.log('Formatted matches:', formattedMatches.length);
    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
    });
  } catch (error: any) {
    console.error('Error in POST /api/matches:', error);
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
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current matches for auto-refresh
export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Get user's current prompt from online_users
    const db = (await import('@/lib/db')).default;
    const onlineUser = db.prepare('SELECT matching_prompt FROM online_users WHERE user_id = ?').get(userId) as any;
    
    if (!onlineUser || !onlineUser.matching_prompt) {
      return NextResponse.json({ matches: [], count: 0 });
    }

    const currentPrompt = onlineUser.matching_prompt;
    
    // Find matches
    const matches = findMatches(userId, currentPrompt);
    
    // Format matches
    const formattedMatches = matches.map(match => {
      const visibleData = getVisibleProfileData(userId, match.user.user_id, 'anonymous');
      const recentPrompts = getRecentPrompts(match.user.user_id, 1);
      const otherUserPrompt = recentPrompts.length > 0 ? recentPrompts[0] : null;
      
      return {
        userId: match.user.user_id,
        randomName: match.randomName,
        similarityScore: match.similarityScore,
        visibleProfile: visibleData,
        otherUserPrompt: otherUserPrompt,
      };
    });

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
      prompt: currentPrompt,
    });
  } catch (error: any) {
    console.error('Error in GET /api/matches:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint to clear matching status (leave matching mode)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Clear matching status and cancel all pending invites
    const { clearMatchingStatus } = await import('@/lib/auth');
    clearMatchingStatus(userId);
    cancelAllInvites(userId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/matches:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

