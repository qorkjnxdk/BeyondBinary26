import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getUserById, updateUserProfile } from '@/lib/auth';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  age: z.number().min(18).max(100).optional(),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'In a Relationship', "It's Complicated"]).optional(),
  employment: z.enum(['Employed Full-time', 'Employed Part-time', 'Self-employed', 'Unemployed', 'Student', 'Retired', 'Homemaker']).optional(),
  hobbies: z.array(z.string().max(30)).max(10).optional(),
  location: z.string().regex(/^(0[1-9]|1[0-9]|2[0-8])$/).optional(),
  has_baby: z.enum(['Yes', 'No', 'Expecting']).optional(),
  career_field: z.string().max(50).optional(),
  privacy_settings: z.record(z.enum(['anonymous_can_see', 'match_can_see', 'no_one_can_see'])).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const user = getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
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

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);
    const body = await request.json();
    const validated = profileUpdateSchema.parse(body);

    updateUserProfile(userId, validated);

    const user = getUserById(userId);
    return NextResponse.json({ user });
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

