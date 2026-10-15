import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

async function handleTtsRequest(rawText: string) {
  const text = (rawText || '').trim();
  if (!text) {
    return new Response('Missing text parameter', { status: 400 });
  }

  try {
    // Sanitize punctuation marks that distort Lithuanian lexical stress
    const cleanSpeechText = text.replace(/[!?,.:;"]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanSpeechText) {
      return new Response('Missing text parameter', { status: 400 });
    }

    const encoded = encodeURIComponent(cleanSpeechText.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=lt&client=tw-ob`;

    const audioRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!audioRes.ok) {
      console.error('[TTS_FETCH_FAILED]: status', audioRes.status);
      return new Response('TTS fetch failed', { status: 500 });
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[TTS_ERROR]:', error);
    return new Response('TTS fetch failed', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || '';
  return handleTtsRequest(text);
}

export async function POST(request: NextRequest) {
  let text = '';
  try {
    const body = await request.json();
    text = body.text || '';
  } catch {
    const { searchParams } = new URL(request.url);
    text = searchParams.get('text') || '';
  }
  return handleTtsRequest(text);
}
