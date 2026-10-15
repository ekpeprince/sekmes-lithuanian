export interface ScenarioDefinition {
  id: string;
  name: string;
  lithuanianName: string;
  icon: string;
  promptSystem: string;
  greeting: string;
  greetingEn: string;
  tip?: string;
  initialSuggestions: Array<{ lt: string; en: string }>;
}

export const FREE_CHAT_SCENARIO: ScenarioDefinition = {
  id: 'free-chat',
  name: 'Free Conversation',
  lithuanianName: 'Laisvas Pokalbis',
  icon: '✨',
  promptSystem: `You are Aistė, an authentic, supportive Lithuanian native tutor and peer. 
- Respond primarily in clear, natural Lithuanian adapted to the user's level.
- If the user writes in English, reply in Lithuanian with a brief English note if helpful.
- If the user makes a clear grammatical or case error, gently provide the friendly correction in a small parenthetical note, then continue the conversation conversationally.`,
  greeting: 'Labas! Aš esu Aistė. Apie ką norėtum pasikalbėti šiandien?',
  greetingEn: "Hi! I'm Aistė. What would you like to talk about today?",
  tip: 'Feel free to speak about any topic! Aistė adapts to your level and gently corrects mistakes.',
  initialSuggestions: [
    { lt: 'Kaip sekasi?', en: 'How are you?' },
    { lt: 'Papasakok apie Lietuvą 🇱🇹', en: 'Tell me about Lithuania' },
    { lt: 'Išmokyk mane naują žodį', en: 'Teach me a new word' },
  ],
};

export const SCENARIO_DEFINITIONS: Record<string, ScenarioDefinition> = {
  'free-chat': FREE_CHAT_SCENARIO,
};
