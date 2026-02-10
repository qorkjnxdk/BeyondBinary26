import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to avoid issues with missing env vars
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

interface JournalResponseInput {
  content: string;
  sentiment: number | null;
}

interface JournalResponse {
  sentiment_score: number; // 0-99 score
  message: string;
  suggestions: string[] | null;
}

// Unified prompt template that returns JSON with sentiment score
const JOURNAL_ANALYSIS_PROMPT = (content: string) => `
You are a supportive companion for postpartum mothers. Analyze the journal entry and provide:
1. A sentiment score (0-99)
2. A warm, supportive response

Sentiment scoring guide:
- 0-29: Strong negative emotions (hopelessness, despair, feeling like a failure, severe overwhelm, self-criticism, exhaustion, crying, isolation)
- 30-69: Neutral or mixed emotions (matter-of-fact, ups and downs, mild tiredness, balanced, routine descriptions)
- 70-99: Positive emotions (joy, gratitude, accomplishment, hope, connection, pride, love, happiness)

Response guidelines based on score:

IF SCORE 0-29 (Negative):
- Validate feelings warmly (2-3 sentences)
- Say "other mothers feel this way too"
- Provide 2-3 gentle, actionable suggestions like:
  * "Step outside for fresh air, even just for 2 minutes"
  * "Drink water and take three deep breaths"
  * "Write down one small thing that went okay today"
  * "Rest for 10 minutes if you can"
  * "Call or text someone you trust"
- NO clinical terms, NO "you should"
- Use warm, non-prescriptive language ("you might try", "perhaps")

IF SCORE 30-69 (Neutral):
- Acknowledge the mixed or calm state (2 sentences)
- Gentle encouragement
- Include normalization ("this is common in motherhood")
- NO suggestions needed

IF SCORE 70-99 (Positive):
- Affirm positive feelings (2 sentences)
- Celebrate without being over-the-top
- Include "other mothers would be glad to hear this"
- NO suggestions needed

Return response in this EXACT JSON format:
{
  "score": <number 0-99>,
  "message": "<supportive response text>",
  "suggestions": [<array of 2-3 suggestion strings>] OR null
}

Rules:
- Keep message under 150 words
- Be warm and human, like a supportive friend
- Include "other mothers" normalization in EVERY response
- suggestions should be null if score >= 30
- NO medical/clinical language
- Return ONLY valid JSON, no other text

Journal entry: "${content}"
`.trim();

// Parse the Gemini JSON response
function parseGeminiResponse(text: string): JournalResponse {
  try {
    // Clean up the response text - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText);

    // Validate the response structure
    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 99) {
      throw new Error('Invalid score in response');
    }

    if (typeof parsed.message !== 'string' || !parsed.message.trim()) {
      throw new Error('Invalid message in response');
    }

    return {
      sentiment_score: parsed.score,
      message: parsed.message,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : null,
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw response:', text);

    // Fallback to neutral score with supportive message
    return {
      sentiment_score: 50,
      message: "Thank you for sharing. We're here with you.",
      suggestions: null,
    };
  }
}

// Generate supportive response with sentiment score based on journal entry
export async function generateJournalResponse(
  input: JournalResponseInput
): Promise<JournalResponse> {
  const { content } = input;

  // Use unified prompt that analyzes sentiment and generates response
  const prompt = JOURNAL_ANALYSIS_PROMPT(content);

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    // Set timeout for API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      clearTimeout(timeout);
      return parseGeminiResponse(text);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Error generating journal reflection:', error);

    // Graceful fallback with neutral score
    return {
      sentiment_score: 50,
      message: "Thank you for sharing. We're here with you.",
      suggestions: null,
    };
  }
}

// Fallback response if API fails
export function getFallbackResponse(): JournalResponse {
  return {
    sentiment_score: 50, // Neutral default
    message: "Thank you for sharing. We're here with you.",
    suggestions: null,
  };
}
