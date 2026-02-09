import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getFriends, deleteFriendship, createFriendship } from '@/lib/friends';
import { getUserById } from '@/lib/auth';
import { getVisibleProfileData } from '@/lib/matching';

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const friends = getFriends(userId);

    // Enrich with user data
    const enrichedFriends = friends.map((f: { user_id: string; created_at: number }) => {
      const friend = getUserById(f.user_id);
      if (!friend) return null;

      const visibleData = getVisibleProfileData(userId, f.user_id, 'friend');
      
      return {
        userId: friend.user_id,
        realName: friend.real_name,
        visibleProfile: visibleData,
        lastActive: friend.last_active,
        createdAt: f.created_at,
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    return NextResponse.json({ friends: enrichedFriends });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const { searchParams } = request.nextUrl;
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      );
    }

    deleteFriendship(userId, friendId);

    // Delete chat history
    const db = (await import('@/lib/db')).default;
    
    // Find all sessions between these users
    const sessions = db.prepare(`
      SELECT session_id FROM chat_sessions
      WHERE ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))
      AND session_type = 'friend'
    `).all(userId, friendId, friendId, userId) as Array<{ session_id: string }>;

    for (const session of sessions) {
      db.prepare('UPDATE messages SET is_deleted = 1 WHERE session_id = ?').run(session.session_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

