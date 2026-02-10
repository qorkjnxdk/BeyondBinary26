import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { generateJournalResponse, getFallbackResponse } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    requireAuth(request);

    const body = await request.json();
    const { content, sentiment } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Validate sentiment
    if (sentiment !== null && (typeof sentiment !== 'number' || sentiment < -10 || sentiment > 10)) {
      return NextResponse.json({ error: 'Invalid sentiment value' }, { status: 400 });
    }

    // Generate response with retry logic (1 retry max)
    let response;
    try {
      response = await generateJournalResponse({ content, sentiment });
    } catch (error) {
      console.error('First attempt failed, retrying...', error);
      try {
        response = await generateJournalResponse({ content, sentiment });
      } catch (retryError) {
        console.error('Retry failed, using fallback', retryError);
        response = getFallbackResponse();
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error in generate-response:', error);

    // Return fallback response on any error
    return NextResponse.json(getFallbackResponse());
  }
}
