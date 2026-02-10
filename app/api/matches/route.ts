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

    // Store the current prompt so it's visible to others even before sending invites
    const { updateCurrentPrompt } = await import('@/lib/auth');
    updateCurrentPrompt(userId, validated.prompt);
    console.log('[API] Updated current prompt for user:', userId);

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

