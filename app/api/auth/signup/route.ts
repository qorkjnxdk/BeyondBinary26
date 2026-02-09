import { NextRequest, NextResponse } from 'next/server';
import { createUser, hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  singpassNric: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include uppercase, lowercase, and number'),
  realName: z.string().min(1),
  gender: z.enum(['F', 'M']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Validate gender - only allow females
    if (validated.gender !== 'F') {
      return NextResponse.json(
        { error: 'Only women are allowed on this platform' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const { getUserByEmail } = await import('@/lib/auth');
    if (getUserByEmail(validated.email)) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const userId = createUser({
      singpassNric: validated.singpassNric,
      email: validated.email,
      passwordHash,
      realName: validated.realName,
      gender: validated.gender,
    });

    // Generate token
    const token = generateToken(userId);

    return NextResponse.json({
      success: true,
      token,
      userId,
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

