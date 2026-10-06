export interface NounCase {
  name: string;
  lithuanianName: string;
  abbreviation: string;
  question: string;
  purpose: string;
  color: string;
  examples: {
    masculine: { base: string; changed: string; rule: string };
    feminine: { base: string; changed: string; rule: string };
    sampleSentence: string;
    translation: string;
  };
}

export const NOUN_CASES: NounCase[] = [
  {
    name: 'Nominative',
    lithuanianName: 'Vardininkas',
    abbreviation: 'V.',
    question: 'Kas? (Who? What?)',
    purpose: 'The dictionary subject of a sentence doing the action.',
    color: '#3b82f6', // blue
    examples: {
      masculine: { base: 'brolis (brother)', changed: 'brolis', rule: 'Ends in -as, -is, -ys' },
      feminine: { base: 'sesuo / sesė (sister)', changed: 'sesė', rule: 'Ends in -a, -ė' },
      sampleSentence: 'Tomas yra studentas.',
      translation: 'Tomas is a student.'
    }
  },
  {
    name: 'Genitive',
    lithuanianName: 'Kilmininkas',
    abbreviation: 'K.',
    question: 'Ko? (Of whom? Of what? From where?)',
    purpose: 'Possession ("of"), origin after "iš" (from), negation ("neturiu..."), and quantity ("daug...").',
    color: '#10b981', // emerald
    examples: {
      masculine: { base: 'Kaunas, Vilnius', changed: 'iš Kauno, iš Vilniaus', rule: '-as -> -o, -ius -> -iaus' },
      feminine: { base: 'Lietuva, kava', changed: 'iš Lietuvos, puodelis kavos', rule: '-a -> -os, -ė -> -ės' },
      sampleSentence: 'Aš esu iš Lietuvos.',
      translation: 'I am from Lithuania.'
    }
  },
  {
    name: 'Dative',
    lithuanianName: 'Naudininkas',
    abbreviation: 'N.',
    question: 'Kam? (To whom? For whom?)',
    purpose: 'Indirect objects and giving/helping someone ("duoti draugui").',
    color: '#8b5cf6', // purple
    examples: {
      masculine: { base: 'draugas (friend)', changed: 'draugui', rule: '-as -> -ui, -is -> -iui' },
      feminine: { base: 'mama (mother)', changed: 'mamai', rule: '-a -> -ai, -ė -> -ei' },
      sampleSentence: 'Aš sakau ačiū mamai.',
      translation: 'I say thank you to mom.'
    }
  },
  {
    name: 'Accusative',
    lithuanianName: 'Galininkas',
    abbreviation: 'G.',
    question: 'Ką? (Whom? What?)',
    purpose: 'The direct object receiving an action (ordering food, seeing, buying, loving). Look for nasal vowel endings (-ą, -į, -ę, -ų)!',
    color: '#f59e0b', // amber
    examples: {
      masculine: { base: 'sumuštinis, draugas', changed: 'sumuštinį, draugą', rule: '-as -> -ą, -is -> -į' },
      feminine: { base: 'kava, arbata', changed: 'kavą, arbatą', rule: '-a -> -ą, -ė -> -ę' },
      sampleSentence: 'Prašau vieną kavą ir sumuštinį.',
      translation: 'One coffee and a sandwich, please.'
    }
  },
  {
    name: 'Instrumental',
    lithuanianName: 'Įnagininkas',
    abbreviation: 'Įn.',
    question: 'Kuo? (With whom? By means of what?)',
    purpose: 'Instruments, methods of travel, and companionship with "su" (with).',
    color: '#ec4899', // pink
    examples: {
      masculine: { base: 'cukrus (sugar)', changed: 'su cukrumi', rule: '-as -> -u, -us -> -umi' },
      feminine: { base: 'citrina (lemon)', changed: 'su citrina', rule: '-a -> -a, -ė -> -e' },
      sampleSentence: 'Arbata su citrina ir cukrumi.',
      translation: 'Tea with lemon and sugar.'
    }
  },
  {
    name: 'Locative',
    lithuanianName: 'Vietininkas',
    abbreviation: 'Vt.',
    question: 'Kur? Kame? (Where? In what?)',
    purpose: 'Location inside a city, room, building, or country. Notice endings -e, -oje, -ėje, -iuje.',
    color: '#06b6d4', // cyan
    examples: {
      masculine: { base: 'Kaunas, Vilnius, viešbutis', changed: 'Kaune, Vilniuje, viešbutyje', rule: '-as -> -e, -ius -> -iuje, -is -> -yje' },
      feminine: { base: 'Klaipėda, kavinė', changed: 'Klaipėdoje, kavinėje', rule: '-a -> -oje, -ė -> -ėje' },
      sampleSentence: 'Mes dabar gyvename Vilniuje.',
      translation: 'We are currently living in Vilnius.'
    }
  },
  {
    name: 'Vocative',
    lithuanianName: 'Šauksmininkas',
    abbreviation: 'Š.',
    question: 'Šauksmas! (Hey you! Addressing someone)',
    purpose: 'Directly calling or hailing someone by name or title in speech.',
    color: '#ef4444', // red
    examples: {
      masculine: { base: 'Tomas, Jonas, brolis', changed: 'Tomai!, Jonai!, broli!', rule: '-as -> -ai!, -is -> -i!' },
      feminine: { base: 'Lina, sesė', changed: 'Lina!, sese!', rule: '-a -> -a!, -ė -> -e!' },
      sampleSentence: 'Labas rytas, Tomai!',
      translation: 'Good morning, Tomas!'
    }
  }
];

export const BUTI_CONJUGATION = {
  verb: 'Būti',
  meaning: 'To Be',
  present: [
    { pronoun: 'Aš', form: 'esu', english: 'I am' },
    { pronoun: 'Tu', form: 'esi', english: 'You are (informal)' },
    { pronoun: 'Jis / Ji', form: 'yra', english: 'He / She is' },
    { pronoun: 'Mes', form: 'esame', english: 'We are' },
    { pronoun: 'Jūs', form: 'esate', english: 'You are (polite / plural)' },
    { pronoun: 'Jie / Jos', form: 'yra', english: 'They are' },
  ],
  past: [
    { pronoun: 'Aš', form: 'buvau', english: 'I was' },
    { pronoun: 'Tu', form: 'buvai', english: 'You were' },
    { pronoun: 'Jis / Ji', form: 'buvo', english: 'He / She was' },
    { pronoun: 'Mes', form: 'buvome', english: 'We were' },
    { pronoun: 'Jūs', form: 'buvote', english: 'You were' },
    { pronoun: 'Jie / Jos', form: 'buvo', english: 'They were' },
  ],
  future: [
    { pronoun: 'Aš', form: 'būsiu', english: 'I will be' },
    { pronoun: 'Tu', form: 'būsi', english: 'You will be' },
    { pronoun: 'Jis / Ji', form: 'bus', english: 'He / She will be' },
    { pronoun: 'Mes', form: 'būsime', english: 'We will be' },
    { pronoun: 'Jūs', form: 'būsite', english: 'You will be' },
    { pronoun: 'Jie / Jos', form: 'bus', english: 'They will be' },
  ]
};

export const COMMON_PHRASES = [
  { lt: 'Labas rytas', en: 'Good morning', note: 'Used until ~11:00 AM' },
  { lt: 'Laba diena', en: 'Good afternoon / Hello', note: 'Standard daytime greeting' },
  { lt: 'Labas vakaras', en: 'Good evening', note: 'Used after sunset' },
  { lt: 'Ačiū labai', en: 'Thank you very much', note: 'Polite gratitude' },
  { lt: 'Prašom', en: 'Please / You\'re welcome', note: 'Double meaning like German "bitte"' },
  { lt: 'Atsiprašau', en: 'Excuse me / I am sorry', note: 'Used for bumping or asking attention' },
  { lt: 'Iki pasimatymo', en: 'Until we see each other / Bye', note: 'Formal farewell' },
  { lt: 'Iki!', en: 'See ya! / Bye!', note: 'Casual farewell between friends' },
  { lt: 'Kaip sekasi?', en: 'How are things going?', note: 'Casual check-in' },
  { lt: 'Puikiai / Gerai', en: 'Great / Good', note: 'Common response to "Kaip sekasi?"' },
  { lt: 'Taip / Ne', en: 'Yes / No', note: 'Basic answers' },
  { lt: 'Aš nesuprantu', en: 'I do not understand', note: 'Lifesaver for travelers' },
  { lt: 'Ar kalbate angliškai?', en: 'Do you speak English?', note: 'Helpful question' },
];
