import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken, updateLastActive } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const user = getUserByEmail(validated.email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.account_status === 'banned') {
      return NextResponse.json(
        { error: 'Account has been banned' },
        { status: 403 }
      );
    }

    if (user.account_status === 'suspended') {
      return NextResponse.json(
        { error: 'Account is suspended' },
        { status: 403 }
      );
    }

    // Get password hash from database
    const db = (await import('@/lib/db')).default;
    const userRecord = db.prepare('SELECT password_hash FROM users WHERE user_id = ?').get(user.user_id) as { password_hash: string };

    // Verify password
    const isValid = await verifyPassword(validated.password, userRecord.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last active
    updateLastActive(user.user_id);

    // Generate token
    const token = generateToken(user.user_id);

    return NextResponse.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        realName: user.real_name,
      },
    });
  } catch (error) {
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

