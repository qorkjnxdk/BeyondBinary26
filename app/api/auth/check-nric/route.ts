import { NextRequest, NextResponse } from 'next/server';
import { getUserByNric } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const nric = request.nextUrl.searchParams.get('nric');

  if (!nric) {
    return NextResponse.json({ error: 'NRIC is required' }, { status: 400 });
  }

  const exists = !!getUserByNric(nric);
  return NextResponse.json({ exists });
}
