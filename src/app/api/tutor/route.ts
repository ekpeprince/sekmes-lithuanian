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
}

const SCENARIO_CONTEXTS = {
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

export async function POST(req: NextRequest) {
  try {
    const body: TutorRequest = await req.json();
    const {
      scenario = 'cafe',
      messages = [],
      userText = '',
      customTopic = '',
      customRole = 'Draugas (Friend)',
      isInitial = false,
    } = body;

    const isCustom = scenario === 'custom';
    const effectiveTitle = isCustom
      ? `Tinkinta tema: ${customTopic || 'Laisva tema'}`
      : (SCENARIO_CONTEXTS[scenario] || SCENARIO_CONTEXTS.cafe).title;

    const effectiveRole = isCustom
      ? `You are playing the role of: ${customRole || 'a friendly native Lithuanian'}. The topic or situation is: "${customTopic || 'Daily conversation in Lithuania'}". Help the student practice realistic, encouraging Lithuanian for this specific situation.`
      : (SCENARIO_CONTEXTS[scenario] || SCENARIO_CONTEXTS.cafe).role;

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `You are an encouraging native Lithuanian language tutor roleplaying in this scenario:
Scenario Title: ${effectiveTitle}
Role & Situation: ${effectiveRole}

Guidelines:
1. Speak in clean, natural A1/A2 level Lithuanian (simple sentences, vocabulary appropriate for learners).
2. Keep your answer brief: 1 to 3 conversational sentences in Lithuanian.
3. Respond in strict JSON format with exactly the following 4 keys:
{
  "replyLithuanian": "your spoken Lithuanian reply",
  "replyEnglish": "accurate English translation of your reply",
  "grammarTip": "a short 1-sentence tip explaining a grammar rule, word ending, or polite phrase used",
  "suggestedReplies": [
    { "lt": "Lithuanian option 1", "en": "English meaning" },
    { "lt": "Lithuanian option 2", "en": "English meaning" }
  ]
}
Do NOT output markdown code blocks. Output pure JSON only.`;

        let prompt = '';
        if (isInitial && isCustom) {
          prompt = `${systemPrompt}\n\nTask: Start the roleplay with an opening welcoming line in Lithuanian matching the situation ("${customTopic}") and your role ("${customRole}"). Also provide a helpful grammar/cultural tip and 3 suggested starter replies the student could say in Lithuanian.`;
        } else {
          const conversationHistory = messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
          prompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\nStudent: ${userText}\nTutor:`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const text = response.text?.trim() || '';
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to dialogue engine:', geminiError);
      }
    }

    // Fallback dialogue engine (works offline without API key)
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
      // Free talk
      if (normalizedInput.includes('labas') || normalizedInput.includes('sveik')) {
        replyLithuanian = 'Labas! Džiaugiuosi tave matydama. Papasakok, iš kur esi ir kodėl mokaisi lietuvių kalbos?';
        replyEnglish = 'Hello! I am glad to see you. Tell me, where are you from and why are you learning Lithuanian?';
        grammarTip = '„Iš kur esi?“ (Where are you from?) uses the Genitive question word „iš kur“.';
        suggestedReplies = [
          { lt: 'Aš esu studentas ir man patinka Lietuva!', en: 'I am a student and I like Lithuania!' },
          { lt: 'Mano draugai gyvena Vilniuje.', en: 'My friends live in Vilnius.' },
        ];
      } else {
        replyLithuanian = 'Puikiai kalbi! Kiekvieną dieną praktikuojantis, kalbėti taps vis lengviau ir natūraliau.';
        replyEnglish = 'You speak wonderfully! Practicing every day, speaking will become easier and more natural.';
        grammarTip = 'Lithuanian adverb „puikiai“ (wonderfully/excellently) ends in -iai.';
        suggestedReplies = [
          { lt: 'Ačiū už padrąsinimą!', en: 'Thank you for the encouragement!' },
          { lt: 'Koks tavo mėgstamiausias lietuviškas žodis?', en: 'What is your favorite Lithuanian word?' },
        ];
      }
    }

    return NextResponse.json({
      replyLithuanian,
      replyEnglish,
      grammarTip,
      suggestedReplies,
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
