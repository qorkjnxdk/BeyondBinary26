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
  message: string;
  suggestions: string[] | null;
}

// Prompt templates for different sentiment categories
const NEGATIVE_PROMPT_TEMPLATE = (content: string) => `
A postpartum mother wrote: "${content}"

Write a brief, warm response (2-3 sentences max). Be natural and supportive, not formal. Acknowledge how she feels, remind her other mothers feel this way too. Use simple language.

Then give 2-3 tiny, doable things (under 5 min each). Use "you might" or "try", never "you should".

Format:
MESSAGE: [2-3 sentences]
SUGGESTIONS:
- [something small]
- [something small]
- [something small]
`.trim();

const POSITIVE_PROMPT_TEMPLATE = (content: string) => `
A postpartum mother wrote: "${content}"

Write a brief response (2 sentences max). Be warm but not over-the-top. Acknowledge her good moment and mention other mothers would be glad to hear this too.

Format:
MESSAGE: [2 sentences]

NO suggestions needed.
`.trim();

const NEUTRAL_PROMPT_TEMPLATE = (content: string) => `
A postpartum mother wrote: "${content}"

Write a brief response (2 sentences max). Acknowledge her experience, mention it's common. Keep it simple and warm.

Format:
MESSAGE: [2 sentences]

NO suggestions needed.
`.trim();

// Parse the Gemini response
function parseGeminiResponse(text: string): JournalResponse {
  const lines = text.split('\n').filter(line => line.trim());

  let message = '';
  const suggestions: string[] = [];
  let inSuggestions = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('MESSAGE:')) {
      message = trimmed.replace('MESSAGE:', '').trim();
    } else if (trimmed === 'SUGGESTIONS:') {
      inSuggestions = true;
    } else if (inSuggestions && trimmed.startsWith('-')) {
      suggestions.push(trimmed.substring(1).trim());
    } else if (!inSuggestions && !trimmed.startsWith('MESSAGE:')) {
      // Add to message if it's not a label
      if (message) {
        message += ' ' + trimmed;
      } else {
        message = trimmed;
      }
    }
  }

  return {
    message: message || text, // Fallback to full text if parsing fails
    suggestions: suggestions.length > 0 ? suggestions : null,
  };
}

// Generate supportive response based on journal entry
export async function generateJournalResponse(
  input: JournalResponseInput
): Promise<JournalResponse> {
  const { content, sentiment } = input;

  // Determine which prompt to use based on sentiment
  let prompt: string;
  if (sentiment === null || sentiment === 0) {
    prompt = NEUTRAL_PROMPT_TEMPLATE(content);
  } else if (sentiment < 0) {
    prompt = NEGATIVE_PROMPT_TEMPLATE(content);
  } else {
    prompt = POSITIVE_PROMPT_TEMPLATE(content);
  }

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return parseGeminiResponse(text);
  } catch (error) {
    console.error('Error generating journal reflection:', error);

    // Graceful fallback
    return {
      message: "Thank you for sharing. We're here with you.",
      suggestions: null,
    };
  }
}

// Fallback response if API fails
export function getFallbackResponse(): JournalResponse {
  return {
    message: "Thank you for sharing. We're here with you.",
    suggestions: null,
  };
}
