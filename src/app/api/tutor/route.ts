import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorRequest {
  message?: string;
  history?: ChatHistoryItem[];
  messages?: Message[];
  scenario?: string;
  customTopic?: string;
  customRole?: string;
}

// Sliding-window IP rate limiter to protect against bot abuse and API quota drain
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const ipRequestHistory = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  // 1. IP Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait a minute before sending more messages.',
        reply: 'Per daug užklausų. Prašome palaukti minutėlę!',
        translation: 'Too many requests. Please wait a minute!',
        suggestions: ['Palauksiu šiek tiek.'],
      },
      { status: 429 }
    );
  }

  try {
    const body: TutorRequest = await req.json();
    const scenario = body.scenario || 'free-chat';
    const messages: Message[] = Array.isArray(body.messages) ? body.messages : [];

    // Check GEMINI_API_KEY environment variable
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('[TUTOR_API_ERROR]: GEMINI_API_KEY is not configured in environment variables.');
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY in your .env.local file or Vercel project settings.',
          reply: 'Atsiprašau, API raktas nėra sukonfigūruotas. Prašome nustatyti GEMINI_API_KEY.',
          translation: 'Sorry, the API key is not configured. Please set GEMINI_API_KEY in .env.local or Vercel.',
          suggestions: ['Bandykime dar kartą'],
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const scenarioInstruction =
      scenario === 'cafe'
        ? 'Setting: A cozy cafe in Vilnius Old Town. You are a friendly barista.'
        : scenario === 'market'
        ? 'Setting: Halės Turgus in Vilnius. You are a market vendor selling fresh berries and cheese.'
        : scenario === 'directions'
        ? 'Setting: Vilnius city center along Gedimino prospektas. You are helping a visitor find their way.'
        : scenario === 'custom' && body.customTopic
        ? `Setting: Custom roleplay. Topic: "${body.customTopic}". Role: "${body.customRole || 'Partner'}".`
        : 'Setting: Open, friendly conversation in Lithuanian.';

    const systemInstruction = `You are Aistė, a warm, native Lithuanian language tutor and conversational partner.
${scenarioInstruction}

1. Always understand the user's intent, whether they type in Lithuanian, English, or broken grammar.
2. Respond directly to what the user said (e.g., if they ask 'Can you teach me how to speak Lithuania?', respond directly with encouragement and your first simple phrase: 'Taip, su malonumu! (Yes, with pleasure!)').
3. Reply in natural, clear Lithuanian suited to an A1-A2 beginner.
4. Always provide an accurate English translation of your reply.
5. Provide 2 short, contextually relevant Lithuanian reply suggestions the user could tap next.

Output structured JSON matching this schema:
{
  "reply": "Lithuanian response",
  "translation": "English translation",
  "suggestions": ["Option 1", "Option 2"]
}
Do NOT output markdown code blocks. Output pure JSON only.`;

    // Normalize incoming history and latest message
    let incomingMessage = (body.message || '').trim();
    let history: ChatHistoryItem[] = Array.isArray(body.history) ? body.history : [];

    // Fallback if legacy messages array was passed
    if (!incomingMessage && Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      if (lastMsg.role === 'user') {
        incomingMessage = lastMsg.content;
        history = body.messages.slice(0, -1).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.content,
        }));
      } else {
        incomingMessage = 'Start the conversation warmly as Aistė in structured JSON.';
      }
    }

    if (!incomingMessage) {
      incomingMessage = 'Start the conversation warmly as Aistė in structured JSON.';
    }

    // Convert incoming history into Gemini's contents format, capped to the last 8 messages for optimal token efficiency
    const formattedHistory = (history || []).slice(-8).map((item: ChatHistoryItem) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text }],
    }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: incomingMessage }] },
    ];

    const CANDIDATES = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    const MODEL_NAME = 'gemini-3.6-flash';
    let lastError: unknown = null;

    try {
      let responseText: string | null = null;

      for (const modelName of CANDIDATES) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });

          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          console.warn(`[Tutor API] Model ${modelName} attempt failed:`, err);
          lastError = err;
        }
      }

      if (!responseText) {
        throw lastError || new Error(`No response received from candidate Gemini models (${CANDIDATES.join(', ')}).`);
      }

      // Defensive JSON response parsing to handle optional markdown code fences
      let parsed: { reply?: string; translation?: string; suggestions?: string[] } = {};
      try {
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn('[Tutor API] Direct JSON parse failed, attempting regex recovery:', parseErr);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (nestedErr) {
            console.error('[Tutor API] Fallback JSON parse failed:', nestedErr);
          }
        }
      }

      const reply = parsed.reply || responseText.replace(/```[a-z]*\n?/gi, '').trim();
      const translation = parsed.translation || '';
      const suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions
        : ['Taip!', 'Ačiū!'];

      return NextResponse.json({
        reply,
        translation,
        suggestions,
        // Backward compatibility mappings
        replyLithuanian: reply,
        replyEnglish: translation,
        suggestedReplies: suggestions.map((s: string) => ({
          lt: s,
          en: '',
        })),
      });
    } catch (error) {
      console.error("[TUTOR_API_ERROR]:", error);

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Failed to generate response from Gemini AI.',
          reply: 'Atsiprašau, įvyko ryšio klaida. Bandykime dar kartą!',
          translation: 'Sorry, a connection error occurred. Let us try once more!',
          suggestions: ['Bandykime dar kartą', 'Labas!'],
          replyLithuanian: 'Atsiprašau, įvyko ryšio klaida. Bandykime dar kartą!',
          replyEnglish: 'Sorry, a connection error occurred. Let us try once more!',
          suggestedReplies: [
            { lt: 'Bandykime dar kartą', en: 'Try again' },
            { lt: 'Labas!', en: 'Hello!' },
          ],
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[TUTOR_API_ERROR]:", error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        reply: 'Atsiprašau, įvyko ryšio klaida. Bandykime dar kartą!',
        translation: 'Sorry, a connection error occurred. Let us try once more!',
        suggestions: ['Bandykime dar kartą', 'Labas!'],
        replyLithuanian: 'Atsiprašau, įvyko ryšio klaida. Bandykime dar kartą!',
        replyEnglish: 'Sorry, a connection error occurred. Let us try once more!',
        suggestedReplies: [
          { lt: 'Bandykime dar kartą', en: 'Try again' },
          { lt: 'Labas!', en: 'Hello!' },
        ],
      },
      { status: 500 }
    );
  }
}
