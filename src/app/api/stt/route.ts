import { NextResponse } from 'next/server';
import speech from '@google-cloud/speech';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Cloud Speech client when service account credentials exist
function getGoogleSpeechClient() {
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (clientEmail && privateKey) {
    return new speech.SpeechClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      projectId: projectId || undefined,
    });
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Empty audio file' }, { status: 400 });
    }

    const mimeType = audioFile.type || 'audio/webm';
    const speechClient = getGoogleSpeechClient();

    // 1. PRIMARY: Google Cloud Speech-to-Text API
    if (speechClient) {
      try {
        let encoding: 'WEBM_OPUS' | 'LINEAR16' | 'OGG_OPUS' | 'MP3' = 'WEBM_OPUS';
        if (mimeType.includes('wav')) {
          encoding = 'LINEAR16';
        } else if (mimeType.includes('ogg')) {
          encoding = 'OGG_OPUS';
        } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
          encoding = 'MP3';
        }

        const audio = {
          content: buffer.toString('base64'),
        };

        const config = {
          encoding,
          languageCode: 'lt-LT', // Target language: Lithuanian
          enableAutomaticPunctuation: true,
          model: 'default', // Captures full conversational sentences across natural pauses
          ...(encoding === 'LINEAR16' ? { sampleRateHertz: 16000 } : {}),
        };

        const [response] = await speechClient.recognize({ audio, config });
        const transcription =
          response.results
            ?.map((result) => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ')
            .trim() || '';

        return NextResponse.json({
          transcript: transcription,
          provider: 'google-cloud-stt',
        });
      } catch (gError) {
        console.warn('Google Cloud STT call failed, attempting fallback:', gError instanceof Error ? gError.message : gError);
        // Fall through to Gemini AI fallback
      }
    }

    // 2. FALLBACK: Google Gemini AI Multimodal Audio (when service account key is not yet configured)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const cleanMime = mimeType.split(';')[0] || 'audio/webm';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: cleanMime,
                },
              },
              {
                text: 'Transcribe this Lithuanian speech verbatim from start to finish. Capture the entire sentence spoken across any pauses. Output ONLY the recognized Lithuanian text, with no commentary, quotation marks, or explanations.',
              },
            ],
          },
        ],
      });

      const transcription = response.text?.trim().replace(/^["']|["']$/g, '') || '';

      return NextResponse.json({
        transcript: transcription,
        provider: 'google-gemini-stt',
      });
    }

    return NextResponse.json(
      { error: 'No Google Cloud STT credentials or GEMINI_API_KEY configured' },
      { status: 500 }
    );
  } catch (error) {
    console.error('STT Processing Error:', error);
    return NextResponse.json(
      { error: 'Speech recognition failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
