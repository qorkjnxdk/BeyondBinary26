import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import db from '@/lib/db';

// Debug endpoint to check users and their online status
export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Get all users
    const allUsers = db.prepare(`
      SELECT 
        u.user_id,
        u.email,
        u.real_name,
        u.age,
        u.location,
        u.account_status,
        u.last_active,
        ou.last_ping as online_last_ping,
        CASE 
          WHEN ou.last_ping > ? THEN 'online'
          WHEN u.last_active > ? THEN 'recently_active'
          ELSE 'offline'
        END as status
      FROM users u
      LEFT JOIN online_users ou ON u.user_id = ou.user_id
      ORDER BY u.created_at DESC
    `).all(Date.now() - 30 * 60 * 1000, Date.now() - 60 * 60 * 1000) as any[];

    // Get online users count
    const onlineCount = db.prepare(`
      SELECT COUNT(*) as count FROM online_users 
      WHERE last_ping > ?
    `).get(Date.now() - 30 * 60 * 1000) as { count: number };

    // Get total users count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    return NextResponse.json({
      totalUsers: totalCount.count,
      onlineUsers: onlineCount.count,
      users: allUsers.map(user => ({
        userId: user.user_id,
        email: user.email,
        realName: user.real_name,
        age: user.age,
        location: user.location,
        accountStatus: user.account_status,
        lastActive: user.last_active ? new Date(user.last_active).toISOString() : null,
        onlineLastPing: user.online_last_ping ? new Date(user.online_last_ping).toISOString() : null,
        status: user.status,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/debug/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

