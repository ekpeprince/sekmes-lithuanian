import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorRequest {
  scenario: 'cafe' | 'market' | 'directions' | 'free' | 'custom';
  messages?: Message[];
  userText?: string;
  customTopic?: string;
  customRole?: string;
  isInitial?: boolean;
  learnerMemory?: string;
}

import { FREE_CHAT_SCENARIO } from '@/data/scenarios';

const SCENARIO_CONTEXTS = {
  'free-chat': {
    title: `${FREE_CHAT_SCENARIO.name} (${FREE_CHAT_SCENARIO.lithuanianName})`,
    role: FREE_CHAT_SCENARIO.promptSystem,
    initialGreeting: FREE_CHAT_SCENARIO.greeting,
    initialGreetingEn: FREE_CHAT_SCENARIO.greetingEn,
    initialTip: FREE_CHAT_SCENARIO.tip || 'Practice natural Lithuanian conversation.',
    starterSuggestions: FREE_CHAT_SCENARIO.initialSuggestions,
  },
  cafe: {
    title: 'Vilniaus Senamiesčio Kavinė',
    role: 'You are a warm, friendly barista at an artisanal café in Vilnius Old Town. Help the student order coffee, tea, šakotis, or traditional pastries in simple, encouraging Lithuanian.',
    initialGreeting: 'Laba diena! Sveiki atvykę į mūsų kavinę. Ką šiandien norėtumėte užsisakyti?',
    initialGreetingEn: 'Good day! Welcome to our café. What would you like to order today?',
    initialTip: '„Ką norėtumėte užsisakyti?“ means "What would you like to order?". You can answer with „Norėčiau...“ (I would like...).',
    starterSuggestions: [
      { lt: 'Norėčiau juodos kavos ir šakočio, prašom.', en: 'I would like black coffee and šakotis, please.' },
      { lt: 'Kavos su pienu ir vandens, prašau.', en: 'Coffee with milk and water, please.' },
      { lt: 'Kiek kainuoja kapučinas?', en: 'How much does a cappuccino cost?' },
    ],
  },
  market: {
    title: 'Halės Turgus Vilniuje',
    role: 'You are a lively, polite vendor at Halės Turgus (Vilnius historic market). You sell fresh berries, Lithuanian honey, and homemade farmer cheese (lietuviškas varškės sūris).',
    initialGreeting: 'Laba diena! Žiūrėkite, kokios šviežios uogos ir kaimiškas sūris! Kuo galiu padėti?',
    initialGreetingEn: 'Good day! Look at these fresh berries and farmer cheese! How can I help you?',
    initialTip: '„Kuo galiu padėti?“ means "How can I help?". When asking prices, say „Kiek kainuoja...?“ (How much does ... cost?).',
    starterSuggestions: [
      { lt: 'Kiek kainuoja braškės?', en: 'How much do strawberries cost?' },
      { lt: 'Norėčiau vieno kilogramo šilauogių.', en: 'I would like one kilogram of blueberries.' },
      { lt: 'Ar galima paragauti šio sūrio?', en: 'May I taste this cheese?' },
    ],
  },
  directions: {
    title: 'Klausiant kelio Vilniuje',
    role: 'You are a helpful local resident walking along Gedimino prospektas in Vilnius. Help the visitor navigate towards Gediminas Tower, Cathedral Square, or Bernardine Garden.',
    initialGreeting: 'Laba diena! Ar jūs pasiklydote? Kur norite nueiti?',
    initialGreetingEn: 'Good day! Are you lost? Where do you want to go?',
    initialTip: '„Kur norite nueiti?“ means "Where do you want to go?". Common directions are: „tiesiai“ (straight), „į kairę“ (left), „į dešinę“ (right).',
    starterSuggestions: [
      { lt: 'Atsiprašau, kur yra Katedros aikštė?', en: 'Excuse me, where is Cathedral Square?' },
      { lt: 'Kaip nueiti iki Gedimino pilies?', en: 'How do I walk to Gediminas Castle?' },
      { lt: 'Ar čia toli nuo stoties?', en: 'Is it far from the station here?' },
    ],
  },
  free: {
    title: 'Draugiškas pokalbis su Rūta',
    role: 'You are Rūta, a friendly native Lithuanian tutor. You love chatting about hobbies, weather, and helping foreigners learn beautiful Lithuanian with kind encouragement.',
    initialGreeting: 'Labas! Labai malonu su tavimi pabendrauti. Kaip šiandien sekasi mokytis lietuvių kalbos?',
    initialGreetingEn: 'Hello! Very nice to chat with you. How is learning Lithuanian going today?',
    initialTip: 'You can reply with „Puikiai!“ (Great!), „Gerai“ (Good), or „Šiaip sau“ (So-so).',
    starterSuggestions: [
      { lt: 'Labas! Sekasi labai gerai, ačiū!', en: 'Hello! Going very well, thank you!' },
      { lt: 'Lietuvių kalba labai graži, bet nelengva!', en: 'Lithuanian is very beautiful, but not easy!' },
      { lt: 'Aš esu studentas ir gyvenu Vilniuje.', en: 'I am a student and I live in Vilnius.' },
    ],
  },
};

// Sliding-window IP rate limiter to protect against bot abuse and API quota drain
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // max 20 requests per minute per IP
const ipRequestHistory = new Map<string, number[]>();

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

  if (ipRequestHistory.size > 2000) {
    for (const [key, list] of ipRequestHistory.entries()) {
      if (list.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(key);
      }
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  // 1. IP Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        replyLithuanian: 'Per daug užklausų. Prašome palaukti minutėlę!',
        replyEnglish: 'Too many requests. Please wait a minute before sending more messages!',
        grammarTip: '„Palaukti“ means "to wait" (Infinitive form).',
        suggestedReplies: [
          { lt: 'Palauksiu šiek tiek.', en: 'I will wait a little bit.' }
        ],
      },
      { status: 429 }
    );
  }

  try {
    const body: TutorRequest = await req.json();

    // 2. Strict Input Sanitization & Payload Caps
    const rawScenario = body.scenario || 'free-chat';
    const scenario = ['free-chat', 'cafe', 'market', 'directions', 'free', 'custom'].includes(rawScenario)
      ? rawScenario
      : 'free-chat';

    const userText = (body.userText || '').slice(0, 300).trim();
    const customTopic = (body.customTopic || '').slice(0, 100).trim();
    const customRole = (body.customRole || 'Draugas (Friend)').slice(0, 100).trim();
    const learnerMemory = (body.learnerMemory || '').slice(0, 500).trim();
    const isInitial = Boolean(body.isInitial);

    // Limit conversation history to the last 8 turns, capped to 300 chars each
    const messages: Message[] = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-8)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').slice(0, 300),
      }));

    const isCustom = scenario === 'custom';
    const effectiveTitle = isCustom
      ? `Tinkinta tema: ${customTopic || 'Laisva tema'}`
      : (SCENARIO_CONTEXTS[scenario] || SCENARIO_CONTEXTS.cafe).title;

    const effectiveRole = isCustom
      ? `You are playing the role of: ${customRole || 'a friendly native Lithuanian'}. The topic or situation is: "${customTopic || 'Daily conversation in Lithuania'}". Help the student practice realistic, encouraging Lithuanian for this specific situation.`
      : (SCENARIO_CONTEXTS[scenario] || SCENARIO_CONTEXTS.cafe).role;

    // Check if Gemini API key exists
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Deduplicate: If the last message in messages matches userText, separate prior turns from the new turn
    const priorMessages =
      messages.length > 0 && messages[messages.length - 1].content.trim() === userText.trim()
        ? messages.slice(0, -1)
        : messages;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const memorySection = learnerMemory
          ? `\n\n--- LEARNER MEMORY & CONTEXT ---\n${learnerMemory}\n---------------------------------`
          : '';

        const systemPrompt = `You are Aistė, an authentic, supportive Lithuanian native tutor and peer living in Vilnius. You genuinely care about this student and converse naturally like a real person.
Scenario Title: ${effectiveTitle}
Scenario Instructions: ${effectiveRole}${memorySection}

Guidelines:
1. Converse primarily in clear, natural A1/A2 level Lithuanian (simple, friendly sentences).
2. Direct Personal Engagement: If the student speaks about themselves (their identity, their country, e.g. "Aš esu iš Nigerijos", their feelings, or hobbies), directly and warmly acknowledge what they said in Lithuanian! (e.g. "Labai malonu! Nigerija – nuostabi ir didelė šalis!"). Never ignore what they said or change the subject abruptly.
3. If the student writes in English, reply in Lithuanian with a brief English note or translation.
4. If the student makes a clear grammatical or case error, gently provide the friendly correction in a small parenthetical note, then continue the conversation conversationally.
5. Keep your spoken Lithuanian reply brief (1 to 3 conversational sentences).
6. Dynamic Suggestions: For "suggestedReplies", generate 2-3 dynamic, contextual follow-up replies that make sense for the student to say next in this specific conversation. NEVER return static starters.
7. Respond in strict JSON format with the following keys:
{
  "replyLithuanian": "your spoken Lithuanian reply",
  "replyEnglish": "accurate English translation of your reply",
  "grammarTip": "a short 1-sentence tip explaining a grammar rule, word ending, or case used in this exchange",
  "suggestedReplies": [
    { "lt": "Contextual Lithuanian reply 1", "en": "English meaning" },
    { "lt": "Contextual Lithuanian reply 2", "en": "English meaning" }
  ],
  "extractedFact": "a concise new fact learned about the student from their last message (e.g. 'From Nigeria', 'Lives in Vilnius', 'Prefers tea over coffee') or null if nothing new learned",
  "extractedName": "student's first name if they introduced themselves or said their name, or null"
}
Do NOT output markdown code blocks. Output pure JSON only.`;

        let promptContent = '';
        if (isInitial) {
          promptContent = `Task: Start the conversation with an opening welcoming line in Lithuanian matching the situation ("${effectiveTitle}"). If you know the student's name or history from the memory above, greet them warmly and reference it! Provide a helpful grammar/cultural tip and 3 suggested starter replies the student could say in Lithuanian.`;
        } else {
          const conversationHistory = priorMessages
            .map((m) => `${m.role === 'user' ? 'Student' : 'Aistė (Tutor)'}: ${m.content}`)
            .join('\n');
          promptContent = `Conversation History:\n${conversationHistory}\n\nCurrent Student Input: "${userText}"\n\nAistė (respond directly to what the student just said, engaging with their statements, questions, or country of origin in warm Lithuanian):`;
        }

        const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        let lastError: unknown = null;

        for (const modelName of candidateModels) {
          try {
            console.log(`[Tutor API] Invoking Gemini model: ${modelName}`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: promptContent,
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            });

            const rawText = response.text?.trim() || '';
            let cleanedJson = rawText;
            if (cleanedJson.startsWith('```')) {
              cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            }
            const parsed = JSON.parse(cleanedJson);
            console.log(`[Tutor API] Model ${modelName} completed successfully`);
            return NextResponse.json(parsed);
          } catch (modelErr) {
            console.warn(`[Tutor API] Model ${modelName} failed:`, modelErr);
            lastError = modelErr;
          }
        }
        console.error('[Tutor API] All Gemini candidate models failed:', lastError);
      } catch (geminiError) {
        console.error('[Tutor API] Gemini API call failed, falling back to dialogue engine:', geminiError);
      }
    } else {
      console.warn('[Tutor API] No GEMINI_API_KEY found in process.env. Using adaptive contextual dialogue engine.');
    }

    // Fallback dialogue engine (works offline without API key or when API is unreachable)
    if (isCustom && isInitial) {
      const topicLower = customTopic.toLowerCase();
      if (topicLower.includes('nuom') || topicLower.includes('but') || topicLower.includes('apartment') || topicLower.includes('rent')) {
        return NextResponse.json({
          replyLithuanian: 'Laba diena! Džiaugiuosi, kad domitės buto nuoma Vilniuje. Kada norėtumėte ateiti apžiūrėti buto?',
          replyEnglish: 'Good day! Glad you are interested in renting an apartment in Vilnius. When would you like to come see the apartment?',
          grammarTip: '„Buto nuoma“ uses the Genitive case of „butas“ (apartment) with „nuoma“ (rent).',
          suggestedReplies: [
            { lt: 'Norėčiau apžiūrėti rytoj vakare, jei galima.', en: 'I would like to view it tomorrow evening, if possible.' },
            { lt: 'Kiek kainuoja komunaliniai mokesčiai?', en: 'How much are the utility bills?' },
            { lt: 'Ar bute leidžiami gyvūnai?', en: 'Are pets allowed in the apartment?' },
          ],
        });
      } else if (topicLower.includes('gydytoj') || topicLower.includes('daktar') || topicLower.includes('doctor') || topicLower.includes('hospital')) {
        return NextResponse.json({
          replyLithuanian: 'Laba diena! Kuo skundžiatės? Papasakokite, kas jums skauda ir kada prasidėjo simptomai.',
          replyEnglish: 'Good day! What are your symptoms? Tell me what hurts and when the symptoms began.',
          grammarTip: '„Kuo skundžiatės?“ is the standard doctor inquiry: "What is troubling you / What hurts?".',
          suggestedReplies: [
            { lt: 'Man labai skauda galvą ir gerklę.', en: 'My head and throat hurt very much.' },
            { lt: 'Turiu temperatūros nuo vakar dienos.', en: 'I have a fever since yesterday.' },
            { lt: 'Ar man reikia recepto vaistams?', en: 'Do I need a prescription for medicine?' },
          ],
        });
      } else if (topicLower.includes('darb') || topicLower.includes('pokalb') || topicLower.includes('interview') || topicLower.includes('job')) {
        return NextResponse.json({
          replyLithuanian: 'Laba diena! Sveiki atvykę į darbo pokalbį. Prašom papasakokite trumpai apie save ir savo patirtį.',
          replyEnglish: 'Good day! Welcome to the job interview. Please tell us briefly about yourself and your experience.',
          grammarTip: '„Apie save“ means "about yourself" (preposition „apie“ + Accusative).',
          suggestedReplies: [
            { lt: 'Aš turiu trejų metų darbo patirtį šioje srityje.', en: 'I have 3 years of work experience in this field.' },
            { lt: 'Moku anglų kalbą ir mokausi lietuvių kalbos.', en: 'I speak English and I am learning Lithuanian.' },
            { lt: 'Esu labai motyvuotas ir atsakingas darbuotojas.', en: 'I am a very motivated and responsible worker.' },
          ],
        });
      } else if (topicLower.includes('oro uost') || topicLower.includes('skryd') || topicLower.includes('airport') || topicLower.includes('flight')) {
        return NextResponse.json({
          replyLithuanian: 'Laba diena! Prašom parodyti jūsų pasą ir įlaipinimo bilietą. Ar turite registruoto bagažo?',
          replyEnglish: 'Good day! Please show your passport and boarding pass. Do you have checked luggage?',
          grammarTip: '„Įlaipinimo bilietas“ means boarding pass (from įlaipinti - to board).',
          suggestedReplies: [
            { lt: 'Štai mano pasas ir bilietas.', en: 'Here is my passport and ticket.' },
            { lt: 'Turiu tik vieną rankinį bagažą.', en: 'I only have one piece of hand luggage.' },
            { lt: 'Iš kurių vartų vyksta įlaipinimas?', en: 'Which gate is boarding from?' },
          ],
        });
      } else {
        return NextResponse.json({
          replyLithuanian: `Laba diena! Malonu susitikti. Šiandien mūsų tema: ${customTopic || 'Laisvas pokalbis'}. Kuo galėčiau jums padėti?`,
          replyEnglish: `Good day! Nice to meet you. Today our topic is: ${customTopic || 'Free conversation'}. How may I help you?`,
          grammarTip: 'Polite greetings always start with „Laba diena!“ or „Sveiki!“.',
          suggestedReplies: [
            { lt: 'Labas! Norėčiau apie tai pasikalbėti plačiau.', en: 'Hello! I would like to talk about this in more detail.' },
            { lt: 'Aš stengiuosi kalbėti kuo daugiau lietuviškai.', en: 'I try to speak as much Lithuanian as possible.' },
            { lt: 'Prašom pataisyti mane, jei padarysiu klaidą.', en: 'Please correct me if I make a mistake.' },
          ],
        });
      }
    }

    const normalizedInput = userText.toLowerCase().trim();
    let replyLithuanian = '';
    let replyEnglish = '';
    let grammarTip = '';
    let suggestedReplies = [
      { lt: 'Ačiū labai!', en: 'Thank you very much!' },
      { lt: 'Prašom papasakoti daugiau.', en: 'Please tell me more.' },
    ];
    let extractedFact: string | null = null;
    let extractedName: string | null = null;

    if (isCustom) {
      replyLithuanian = 'Supratau! Jūs labai gerai ir aiškiai pasakėte. Kaip norėtumėte tęsti mūsų pokalbį šia tema?';
      replyEnglish = 'Understood! You expressed that very well and clearly. How would you like to continue our conversation on this topic?';
      grammarTip = '„Labai gerai ir aiškiai“ (very well and clearly) uses comparative adverbs with -ai endings.';
      suggestedReplies = [
        { lt: 'Ką jūs patartumėte šioje situacijoje?', en: 'What would you advise in this situation?' },
        { lt: 'Ar galite paaiškinti šį žodį?', en: 'Can you explain this word?' },
      ];
    } else if (scenario === 'cafe') {
      if (normalizedInput.includes('norėčiau') || normalizedInput.includes('kavos') || normalizedInput.includes('arbata')) {
        replyLithuanian = 'Puikus pasirinkimas! Ar norėsite kavos su cukrumi ar be? Ir ar norėsite gabalėlio pyrago?';
        replyEnglish = 'Great choice! Would you like coffee with sugar or without? And would you like a slice of cake?';
        grammarTip = '„Su cukrumi“ (with sugar - Instrumental case) vs. „Be cukraus“ (without sugar - Genitive case).';
        suggestedReplies = [
          { lt: 'Be cukraus, prašom. Ir pyrago, ačiū!', en: 'Without sugar, please. And cake, thank you!' },
          { lt: 'Kiek iš viso kainuoja?', en: 'How much does it cost in total?' },
        ];
      } else if (normalizedInput.includes('sąskait') || normalizedInput.includes('mokėti') || normalizedInput.includes('kainuoja')) {
        replyLithuanian = 'Iš viso bus keturi eurai ir penkiasdešimt centų. Mokėsite kortele ar grynaisiais?';
        replyEnglish = 'In total it will be 4 euros and 50 cents. Will you pay by card or cash?';
        grammarTip = '„Kortele“ (by card - Instrumental case) and „grynaisiais“ (in cash).';
        suggestedReplies = [
          { lt: 'Mokėsiu kortele, prašau.', en: 'I will pay by card, please.' },
          { lt: 'Grynaisiais. Štai pinigai!', en: 'With cash. Here is the money!' },
        ];
      } else if (normalizedInput.includes('ačiū') || normalizedInput.includes('viso gero') || normalizedInput.includes('iki')) {
        replyLithuanian = 'Prašom! Buvo labai malonu. Geros dienos ir iki pasimatymo!';
        replyEnglish = 'You are welcome! It was very pleasant. Have a good day and see you later!';
        grammarTip = '„Geros dienos“ is in the Genitive case, used universally when wishing something good to someone.';
        suggestedReplies = [
          { lt: 'Ačiū, geros dienos ir jums!', en: 'Thank you, have a good day too!' },
          { lt: 'Iki pasimatymo!', en: 'See you later!' },
        ];
      } else {
        replyLithuanian = 'Supratau! Tuoj paruošiu jūsų užsakymą. Ar reikės ko nors dar?';
        replyEnglish = 'Understood! I will prepare your order right away. Will you need anything else?';
        grammarTip = '„Reikės“ is the future tense of the impersonal verb „reikia“ (need/is necessary).';
        suggestedReplies = [
          { lt: 'Ne, ačiū, viskas gerai.', en: 'No, thank you, that is all.' },
          { lt: 'Taip pat stiklinę vandens, prašau.', en: 'Also a glass of water, please.' },
        ];
      }
    } else if (scenario === 'market') {
      if (normalizedInput.includes('kiek') || normalizedInput.includes('kainuoja')) {
        replyLithuanian = 'Šios šviežios braškės kainuoja keturis eurus už kilogramą. Labai saldžios, šįryt nuskintos!';
        replyEnglish = 'These fresh strawberries cost four euros per kilogram. Very sweet, picked this morning!';
        grammarTip = 'Numbers 2-9 take the Accusative plural when specifying price with the verb kainuoti: „keturis eurus“.';
        suggestedReplies = [
          { lt: 'Paimsiu vieną kilogramą, prašau.', en: 'I will take one kilogram, please.' },
          { lt: 'Ar turite šviežio medaus?', en: 'Do you have fresh honey?' },
        ];
      } else {
        replyLithuanian = 'Prašom paragauti! Mūsų produktai yra tiesiai iš Lietuvos kaimo ūkių.';
        replyEnglish = 'Please have a taste! Our products are straight from Lithuanian countryside farms.';
        grammarTip = '„Iš ūkių“ uses preposition „iš“ (from) requiring Genitive plural (-ų).';
        suggestedReplies = [
          { lt: 'Labai skanu! Paimsiu šitą.', en: 'Very delicious! I will take this one.' },
          { lt: 'Ačiū už pagalbą!', en: 'Thank you for your help!' },
        ];
      }
    } else if (scenario === 'directions') {
      if (normalizedInput.includes('katedr') || normalizedInput.includes('pil') || normalizedInput.includes('kur yra')) {
        replyLithuanian = 'Eikite tiesiai Gedimino prospektu apie penkias minutes, ir pamatysite didelę Katedros aikštę kairėje pusėje.';
        replyEnglish = 'Walk straight along Gediminas Avenue for about five minutes, and you will see the large Cathedral Square on the left side.';
        grammarTip = 'Imperative „Eikite“ (Walk! / Go! - formal/plural), „tiesiai“ (straight), „kairėje pusėje“ (on the left side).';
        suggestedReplies = [
          { lt: 'Ačiū labai! O kur yra Gedimino pilis?', en: 'Thank you very much! And where is Gediminas Castle?' },
          { lt: 'Ar tai toli pėsčiomis?', en: 'Is it far on foot?' },
        ];
      } else {
        replyLithuanian = 'Tai visai netoli! Pasukite į dešinę ties šviesoforu ir eikite tiesiai.';
        replyEnglish = 'It is not far at all! Turn right at the traffic lights and go straight.';
        grammarTip = '„Į dešinę“ (to the right) vs. „į kairę“ (to the left) use preposition „į“ + Accusative.';
        suggestedReplies = [
          { lt: 'Supratau, ačiū už pagalbą!', en: 'Understood, thank you for the help!' },
          { lt: 'Geros dienos!', en: 'Have a nice day!' },
        ];
      }
    } else {
      // Free talk / Free chat (Adaptive contextual handler)
      if (
        normalizedInput.includes('about my self') ||
        normalizedInput.includes('about myself') ||
        normalizedInput.includes('about me') ||
        normalizedInput.includes('apie save') ||
        normalizedInput.includes('papasakot apie save') ||
        normalizedInput.includes('noriu papasakot')
      ) {
        replyLithuanian = 'Su didžiausiu džiaugsmu! Labai noriu daugiau sužinoti apie tave. Papasakok, iš kur esi kilęs ir ką veiki gyvenime?';
        replyEnglish = 'With the greatest pleasure! I really want to know more about you. Tell me, where are you from and what do you do in life?';
        grammarTip = '„Apie tave“ (about you) uses the preposition „apie“ with the Accusative pronoun „tave“.';
        suggestedReplies = [
          { lt: 'Aš esu iš Nigerijos 🇳🇬', en: 'I am from Nigeria' },
          { lt: 'Esu studentas ir gyvenu čia.', en: 'I am a student and live here.' },
          { lt: 'Mokausi ir dirbu.', en: 'I study and work.' },
        ];
        extractedFact = 'Wants to talk about themselves';
      } else if (
        normalizedInput.includes('nigerij') ||
        normalizedInput.includes('nigeria')
      ) {
        replyLithuanian = 'Labai malonu! Nigerija yra nuostabi, didelė ir labai turtingos kultūros šalis. Kiek laiko jau mokaisi lietuvių kalbos?';
        replyEnglish = 'Very nice to meet you! Nigeria is a wonderful, large country with a very rich culture. How long have you been learning Lithuanian?';
        grammarTip = 'Preposition „iš“ (from) always requires the Genitive case: „iš Nigerijos“ (from Nigeria).';
        suggestedReplies = [
          { lt: 'Mokausi jau kelis mėnesius.', en: 'I have been learning for several months.' },
          { lt: 'Pradėjau mokytis visai neseniai.', en: 'I started learning quite recently.' },
          { lt: 'Lietuvių kalba man labai patinka!', en: 'I like the Lithuanian language very much!' },
        ];
        extractedFact = 'Kilęs iš Nigerijos (From Nigeria)';
      } else if (
        normalizedInput.includes('esu iš') ||
        normalizedInput.includes('esu is') ||
        normalizedInput.includes('gimiau') ||
        normalizedInput.includes('kilęs') ||
        normalizedInput.includes('kiles') ||
        normalizedInput.includes('šalis')
      ) {
        replyLithuanian = 'Nuostabu susipažinti! Labai džiaugiuosi, kad mokaisi lietuviškai. Kas paskatino tave pradėti mokytis mūsų kalbos?';
        replyEnglish = 'Wonderful to meet you! I am very glad that you are learning Lithuanian. What inspired you to start learning our language?';
        grammarTip = '„Mūsų kalbos“ (our language) uses the Genitive case after the verb „mokytis“ (to learn).';
        suggestedReplies = [
          { lt: 'Gyvenu Lietuvoje ir noriu kalbėti laisvai.', en: 'I live in Lithuania and want to speak fluently.' },
          { lt: 'Mane domina lietuvių kultūra ir istorija.', en: 'I am interested in Lithuanian culture and history.' },
        ];
      } else if (
        normalizedInput.includes('mano vardas') ||
        (normalizedInput.startsWith('esu ') && !normalizedInput.includes('iš')) ||
        normalizedInput.includes('my name is')
      ) {
        const words = userText.split(/\s+/);
        const nameCandidate = words[words.length - 1]?.replace(/[^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ]/g, '');
        extractedName = nameCandidate || null;
        replyLithuanian = `Labai malonu susipažinti${nameCandidate ? `, ${nameCandidate}` : ''}! Esu Aistė. Kaip šiandien sekasi tavo lietuvių kalbos pamoka?`;
        replyEnglish = `Very nice to meet you${nameCandidate ? `, ${nameCandidate}` : ''}! I am Aistė. How is your Lithuanian language practice going today?`;
        grammarTip = 'Direct address uses the Vocative case (Šauksmininkas), e.g., Jonas -> Jonai!';
        suggestedReplies = [
          { lt: 'Sekasi puikiai, ačiū!', en: 'Going great, thank you!' },
          { lt: 'Mokausi naujų žodžių.', en: 'I am learning new words.' },
        ];
      } else if (
        normalizedInput.includes('dirbu') ||
        normalizedInput.includes('darbas') ||
        normalizedInput.includes('studentas') ||
        normalizedInput.includes('universitet')
      ) {
        replyLithuanian = 'Tai labai įdomu! Ar savo kasdieniame darbe ar studijose jau tenka pasakyti kelis žodžius lietuviškai?';
        replyEnglish = 'That is very interesting! In your daily work or studies, do you already get to say a few words in Lithuanian?';
        grammarTip = '„Darbe ar studijose“ is in the Locative case (Vietininkas), answering "where?".';
        suggestedReplies = [
          { lt: 'Taip, visada pasisveikinu lietuviškai!', en: 'Yes, I always greet in Lithuanian!' },
          { lt: 'Dar nedrąsu, bet bandau.', en: 'Still a bit shy, but I am trying.' },
        ];
      } else if (normalizedInput.includes('lietuv') || normalizedInput.includes('papasakok')) {
        replyLithuanian = 'Lietuva yra nuostabi šalis prie Baltijos jūros! Turime žalius miškus, gražius ežerus ir seną, dainingą kalbą. Ar esi buvęs Lietuvoje?';
        replyEnglish = 'Lithuania is a wonderful country by the Baltic Sea! We have green forests, beautiful lakes, and an ancient, melodic language. Have you been to Lithuania?';
        grammarTip = '„Prie Baltijos jūros“ uses preposition „prie“ (by/near) with Genitive case.';
        suggestedReplies = [
          { lt: 'Taip, buvau Vilniuje ir man labai patiko!', en: 'Yes, I was in Vilnius and liked it a lot!' },
          { lt: 'Dar nebuvau, bet labai noriu atvykti!', en: 'Not yet, but I really want to visit!' },
        ];
      } else if (normalizedInput.includes('žod') || normalizedInput.includes('išmokyk') || normalizedInput.includes('nauj')) {
        replyLithuanian = 'Štai puikus lietuviškas žodis: „Akimirka“! Tai reiškia trumpą momentą, akies mirktelėjimą (a blink of an eye / a moment). Gražus žodis, tiesa?';
        replyEnglish = 'Here is a great Lithuanian word: „Akimirka“! It means a short moment, literally "the blinking of an eye". A beautiful word, right?';
        grammarTip = '„Akimirka“ comes from „akis“ (eye) + „mirktelėti“ (to blink).';
        suggestedReplies = [
          { lt: 'Labai gražus žodis!', en: 'Very beautiful word!' },
          { lt: 'Kaip ištarti šį žodį?', en: 'How to pronounce this word?' },
        ];
      } else if (normalizedInput.includes('kaip sekasi') || normalizedInput.includes('labas') || normalizedInput.includes('sveik')) {
        replyLithuanian = 'Labas! Man sekasi puikiai, ačiū! Šiandien Vilniuje nuostabi diena. O kaip sekasi tau?';
        replyEnglish = 'Hello! I am doing great, thank you! It is a wonderful day in Vilnius today. And how are you doing?';
        grammarTip = '„Kaip sekasi?“ is the standard friendly inquiry: "How is it going?".';
        suggestedReplies = [
          { lt: 'Man sekasi labai gerai, ačiū!', en: 'I am doing very well, thank you!' },
          { lt: 'Noriu pasikalbėti apie save.', en: 'I want to talk about myself.' },
        ];
      } else {
        replyLithuanian = 'Labai įdomu! Džiaugiuosi mūsų pokalbiu. Papasakok daugiau – ką labiausiai mėgsti veikti laisvalaikiu?';
        replyEnglish = 'Very interesting! I am glad to chat with you. Tell me more – what do you like to do most in your free time?';
        grammarTip = '„Laisvalaikiu“ (in one\'s free time) is in the Instrumental case (Įnagininkas).';
        suggestedReplies = [
          { lt: 'Laisvalaikiu mėgstu klausytis muzikos.', en: 'In my free time I like listening to music.' },
          { lt: 'Mėgstu keliauti ir atrasti naujas vietas.', en: 'I like traveling and discovering new places.' },
        ];
      }
    }

    return NextResponse.json({
      replyLithuanian,
      replyEnglish,
      grammarTip,
      suggestedReplies,
      extractedFact,
      extractedName,
    });
  } catch (error) {
    console.error('Error in tutor route:', error);
    return NextResponse.json(
      {
        replyLithuanian: 'Atsiprašau, įvyko maža klaida. Bandykime dar kartą!',
        replyEnglish: 'Sorry, a small error occurred. Let us try once more!',
        grammarTip: '„Atsiprašau“ is the universal Lithuanian word for "Excuse me" or "Sorry".',
        suggestedReplies: [
          { lt: 'Viskas gerai, tęskime!', en: 'Everything is fine, let us continue!' }
        ],
      },
      { status: 200 }
    );
  }
}
