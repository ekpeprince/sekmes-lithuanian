import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';

// High-speed in-memory audio cache (v3)
const audioCache = new Map<string, ArrayBuffer>();

// Preprocess Lithuanian text to apply natural human conversational prosody and pitch inflection
function formatForNaturalFlow(text: string): string {
  // 1. Remove markdown, fill blanks (___), and extra spaces
  let clean = text.replace(/[_#*]/g, '').replace(/\s+/g, ' ').trim();
  // Remove parenthetical English hints e.g. "Labas (Hello)" -> "Labas"
  clean = clean.replace(/\([^)]*\)/g, '').trim();

  const lower = clean.toLowerCase();

  // Core polite expressions: lively exclamation ensures warm, cheerful conversational intonation matching natural speech
  if (lower === 'ačiū' || lower === 'aciu') {
    return 'Ačiū!';
  }
  if (lower === 'prašom' || lower === 'prasom') {
    return 'Prašom.';
  }
  if (lower === 'atsiprašau' || lower === 'atsiprasau') {
    return 'Atsiprašau.';
  }

  // Questions: Ar tu esi..., Kaip sekasi..., Kur yra..., Kiek kainuoja...
  const isQuestion =
    lower.startsWith('kaip ') ||
    lower.startsWith('ar ') ||
    lower.startsWith('kur ') ||
    lower.startsWith('kas ') ||
    lower.startsWith('kiek ') ||
    lower.startsWith('kodėl ') ||
    lower.startsWith('kada ');

  // Lively greetings & warm expressions
  const isLivelyGreeting =
    lower.includes('labas') ||
    lower.includes('viso gero') ||
    lower.includes('iki pasimatymo') ||
    lower.includes('sveiki') ||
    lower.includes('ačiū') ||
    lower.includes('aciu');

  if (isQuestion) {
    if (!clean.endsWith('?')) {
      clean = clean.replace(/[.!]*$/, '') + '?';
    }
  } else if (isLivelyGreeting) {
    if (!/[.!?]$/.test(clean)) {
      clean += '!';
    }
  } else if (!/[.!?]$/.test(clean)) {
    clean += '.';
  }

  return clean;
}

// Generate human-like studio quality Lithuanian speech using Microsoft's native Neural voices
async function generateNaturalLithuanianAudio(
  text: string,
  voiceName: string = 'lt-LT-OnaNeural',
  speed: 'normal' | 'slow' = 'normal'
): Promise<ArrayBuffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { voiceLocale: 'lt-LT' });

  // Natural flow prosody settings:
  // Normal: -4% rate gives breathing space for natural vowel transitions and diphthongs
  // Slow: -22% rate for clear enunciated practice mode
  const rate = speed === 'slow' ? '-22%' : '-4%';
  const pitch = voiceName === 'lt-LT-OnaNeural' ? '+1Hz' : '+0Hz';

  const { audioStream } = tts.toStream(text, {
    rate,
    pitch,
  });

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      resolve(arrayBuf);
    });
    audioStream.on('error', (err: unknown) => reject(err));
  });
}

// Fallback to Google Lithuanian stream if Microsoft network is unreachable
async function generateFallbackAudio(cleanText: string): Promise<ArrayBuffer> {
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=lt&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
  const response = await fetch(googleTtsUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://translate.google.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Google fallback failed: ${response.status}`);
  }

  return await response.arrayBuffer();
}

// Sliding window IP rate limiter (protects server from rapid scraping / DoS)
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);

  // Periodically clean stale IPs
  if (ipRequestHistory.size > 2000) {
    for (const [key, list] of ipRequestHistory.entries()) {
      if (list.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(key);
      }
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Client IP rate check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    return new NextResponse('Rate limit exceeded. Please wait a moment before playing more audio.', { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const gender = searchParams.get('gender') || 'female';
  const speed = (searchParams.get('speed') === 'slow' ? 'slow' : 'normal') as 'normal' | 'slow';

  if (!text || text.trim().length === 0) {
    return new NextResponse('Missing text parameter', { status: 400 });
  }

  // Format text for fluid, natural Lithuanian prosody
  const formattedText = formatForNaturalFlow(text.slice(0, 200));
  const voice = gender === 'male' ? 'lt-LT-LeonasNeural' : 'lt-LT-OnaNeural';
  const cacheKey = `v4:${voice}:${speed}:${formattedText.toLowerCase()}`;

  // Return cached audio if present
  if (audioCache.has(cacheKey)) {
    const cachedBuffer = audioCache.get(cacheKey)!;
    return new NextResponse(cachedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  try {
    // 1. Primary: Studio-quality native Lithuanian Neural voice with natural flow prosody
    const arrayBuffer = await generateNaturalLithuanianAudio(formattedText, voice, speed);

    if (audioCache.size < 1000) {
      audioCache.set(cacheKey, arrayBuffer);
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (primaryError) {
    console.warn('Primary natural TTS failed, attempting fallback:', primaryError);

    try {
      // 2. Secondary fallback
      const fallbackBuffer = await generateFallbackAudio(formattedText);

      if (audioCache.size < 1000) {
        audioCache.set(cacheKey, fallbackBuffer);
      }

      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (fallbackError) {
      console.error('All Lithuanian audio generation failed:', fallbackError);
      return new NextResponse('Error generating audio', { status: 500 });
    }
  }
}
