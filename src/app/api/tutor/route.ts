import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorRequest {
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

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1',
    });

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

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Aistė'}: ${m.content}`)
      .join('\n');

    const prompt = transcript.trim()
      ? `Conversation history:\n${transcript}\n\nRespond directly as Aistė to the user's latest statement in structured JSON.`
      : `Start the conversation warmly as Aistė in structured JSON.`;

    const MODEL_NAME = 'gemini-2.5-flash';

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error(`No response received from Gemini model ${MODEL_NAME}.`);
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
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

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

      // Log available models on failure to inspect the catalog
      try {
        const modelList = await ai.models.list();
        console.log("[AVAILABLE_MODELS]:", modelList);
      } catch (e) {
        console.error("[MODEL_LIST_FAILED]:", e);
      }

      const errorMessage = error instanceof Error ? error.message : String(error || 'Nežinoma klaida');

      return NextResponse.json(
        {
          error: errorMessage,
          reply: `Atsiprašau, įvyko klaida: ${errorMessage}`,
          translation: `Connection error: ${errorMessage}`,
          suggestions: ['Bandykime dar kartą'],
          replyLithuanian: `Atsiprašau, įvyko klaida: ${errorMessage}`,
          replyEnglish: `Connection error: ${errorMessage}`,
          suggestedReplies: [{ lt: 'Bandykime dar kartą', en: 'Try again' }],
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[TUTOR_API_ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : String(error || 'Nežinoma klaida');
    return NextResponse.json(
      {
        error: 'Internal server error: ' + errorMessage,
        reply: `Atsiprašau, įvyko klaida: ${errorMessage}`,
        translation: `Internal error: ${errorMessage}`,
        suggestions: ['Bandykime dar kartą'],
        replyLithuanian: `Atsiprašau, įvyko klaida: ${errorMessage}`,
        replyEnglish: `Internal error: ${errorMessage}`,
        suggestedReplies: [{ lt: 'Bandykime dar kartą', en: 'Try again' }],
      },
      { status: 500 }
    );
  }
}
