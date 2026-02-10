import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import db from '@/lib/db';

// Debug endpoint to check users and their prompts
export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    
    // Get all users with their most recent prompts from invites
    const usersWithInvitePrompts = db.prepare(`
      SELECT 
        u.user_id,
        u.email,
        u.real_name,
        i.prompt_text as invite_prompt,
        i.status as invite_status,
        i.created_at as invite_created_at,
        i.expires_at as invite_expires_at
      FROM users u
      LEFT JOIN (
        SELECT 
          sender_id as user_id,
          prompt_text,
          status,
          created_at,
          expires_at,
          ROW_NUMBER() OVER (PARTITION BY sender_id ORDER BY created_at DESC) as rn
        FROM invites
        WHERE status = 'pending'
      ) i ON u.user_id = i.user_id AND i.rn = 1
      WHERE u.account_status = 'active'
      ORDER BY u.created_at DESC
    `).all() as any[];

    // Get all users with their most recent prompts from chat sessions
    const usersWithChatPrompts = db.prepare(`
      SELECT 
        u.user_id,
        cs.prompt_text as chat_prompt,
        cs.started_at as chat_started_at,
        cs.is_active as chat_is_active
      FROM users u
      LEFT JOIN (
        SELECT 
          user_a_id as user_id,
          prompt_text,
          started_at,
          is_active,
          ROW_NUMBER() OVER (PARTITION BY user_a_id ORDER BY started_at DESC) as rn
        FROM chat_sessions
        WHERE prompt_text IS NOT NULL AND prompt_text != ''
        UNION ALL
        SELECT 
          user_b_id as user_id,
          prompt_text,
          started_at,
          is_active,
          ROW_NUMBER() OVER (PARTITION BY user_b_id ORDER BY started_at DESC) as rn
        FROM chat_sessions
        WHERE prompt_text IS NOT NULL AND prompt_text != ''
      ) cs ON u.user_id = cs.user_id AND cs.rn = 1
      WHERE u.account_status = 'active'
    `).all() as any[];

    // Combine the data
    const userMap = new Map();
    
    usersWithInvitePrompts.forEach((user: any) => {
      userMap.set(user.user_id, {
        userId: user.user_id,
        email: user.email,
        realName: user.real_name,
        invitePrompt: user.invite_prompt,
        inviteStatus: user.invite_status,
        inviteCreatedAt: user.invite_created_at ? new Date(user.invite_created_at).toISOString() : null,
        inviteExpiresAt: user.invite_expires_at ? new Date(user.invite_expires_at).toISOString() : null,
      });
    });

    usersWithChatPrompts.forEach((user: any) => {
      const existing = userMap.get(user.user_id) || {
        userId: user.user_id,
        email: null,
        realName: null,
      };
      userMap.set(user.user_id, {
        ...existing,
        chatPrompt: user.chat_prompt,
        chatStartedAt: user.chat_started_at ? new Date(user.chat_started_at).toISOString() : null,
        chatIsActive: user.chat_is_active,
      });
    });

    // Get all pending invites
    const allPendingInvites = db.prepare(`
      SELECT 
        i.invite_id,
        i.sender_id,
        i.receiver_id,
        i.prompt_text,
        i.status,
        i.created_at,
        i.expires_at,
        u1.email as sender_email,
        u2.email as receiver_email
      FROM invites i
      LEFT JOIN users u1 ON i.sender_id = u1.user_id
      LEFT JOIN users u2 ON i.receiver_id = u2.user_id
      WHERE i.status = 'pending'
      ORDER BY i.created_at DESC
    `).all() as any[];

    return NextResponse.json({
      users: Array.from(userMap.values()),
      pendingInvites: allPendingInvites.map((invite: any) => ({
        inviteId: invite.invite_id,
        senderId: invite.sender_id,
        senderEmail: invite.sender_email,
        receiverId: invite.receiver_id,
        receiverEmail: invite.receiver_email,
        promptText: invite.prompt_text,
        status: invite.status,
        createdAt: new Date(invite.created_at).toISOString(),
        expiresAt: new Date(invite.expires_at).toISOString(),
        isExpired: invite.expires_at <= Date.now(),
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/debug/prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

