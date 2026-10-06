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
    color: '#3b82f6',
    examples: {
      masculine: { base: 'brolis, Tomas', changed: 'brolis, Tomas', rule: 'Ends in -as, -is, -ys, -us' },
      feminine: { base: 'sesė, Lina', changed: 'sesė, Lina', rule: 'Ends in -a, -ė' },
      sampleSentence: 'Tomas yra studentas, o Ieva yra dėstytoja.',
      translation: 'Tomas is a student, and Ieva is a lecturer.'
    }
  },
  {
    name: 'Genitive',
    lithuanianName: 'Kilmininkas',
    abbreviation: 'K.',
    question: 'Ko? (Of whom? Of what? From where?)',
    purpose: 'Origin after "iš" (from), proximity after "prie" (near), possession, negation (nėra), and quantity.',
    color: '#10b981',
    examples: {
      masculine: { base: 'Vilnius, Hamburgas', changed: 'iš Vilniaus, iš Hamburgo', rule: '-as -> -o, -ius -> -iaus' },
      feminine: { base: 'Lietuva, Vokietija', changed: 'iš Lietuvos, iš Vokietijos', rule: '-a -> -os, -ė -> -ės' },
      sampleSentence: 'Aš esu iš Lietuvos, o bankas yra prie pašto.',
      translation: 'I am from Lithuania, and the bank is near the post office.'
    }
  },
  {
    name: 'Dative',
    lithuanianName: 'Naudininkas',
    abbreviation: 'N.',
    question: 'Kam? (To/for whom?)',
    purpose: 'Indirect objects, giving/helping, and expressing liking ("patinka man / tau").',
    color: '#8b5cf6',
    examples: {
      masculine: { base: 'draugas (friend)', changed: 'draugui', rule: '-as -> -ui, -is -> -iui' },
      feminine: { base: 'mama (mother)', changed: 'mamai', rule: '-a -> -ai, -ė -> -ei' },
      sampleSentence: 'Ačiū tau ir dėstytojui už pagalbą.',
      translation: 'Thank you to you and to the lecturer for help.'
    }
  },
  {
    name: 'Accusative',
    lithuanianName: 'Galininkas',
    abbreviation: 'G.',
    question: 'Ką? (Whom? What? / When?)',
    purpose: 'Direct object, destinations with "į" and "pas", and time expressions (days, hours: pirmadienį, penktą valandą).',
    color: '#f59e0b',
    examples: {
      masculine: { base: 'universitetas, Paulius', changed: 'į universitetą, pas Paulių', rule: '-as -> -ą, -us -> -ų' },
      feminine: { base: 'kavinė, diena', changed: 'į kavinę, visą dieną', rule: '-a -> -ą, -ė -> -ę' },
      sampleSentence: 'Penktadienį mes einame į teatrą ir pas draugą.',
      translation: 'On Friday we go to the theater and to a friend\'s place.'
    }
  },
  {
    name: 'Instrumental',
    lithuanianName: 'Įnagininkas',
    abbreviation: 'Įn.',
    question: 'Kuo? Su kuo? (With what/whom? By means of what?)',
    purpose: 'Accompaniment with "su" (with), means of transport/payment ("mokėti kortele").',
    color: '#ec4899',
    examples: {
      masculine: { base: 'pienas, draugas', changed: 'su pienu, su draugu', rule: '-as -> -u, -is -> -iu' },
      feminine: { base: 'kortelė, kava', changed: 'mokėti kortele, su kava', rule: '-a -> -a, -ė -> -e' },
      sampleSentence: 'Norėčiau kavos su pienu ir mokėti kortele.',
      translation: 'I would like coffee with milk and to pay by card.'
    }
  },
  {
    name: 'Locative',
    lithuanianName: 'Vietininkas',
    abbreviation: 'Vt.',
    question: 'Kur? Kame? (Where? In what?)',
    purpose: 'Location in a city, country, building, room or street.',
    color: '#06b6d4',
    examples: {
      masculine: { base: 'Kaunas, Vilnius, viešbutis', changed: 'Kaune, Vilniuje, viešbutyje', rule: '-as -> -e, -us -> -uje, -is -> -yje' },
      feminine: { base: 'Lietuva, aikštė', changed: 'Lietuvoje, Katedros aikštėje', rule: '-a -> -oje, -ė -> -ėje' },
      sampleSentence: 'Aš gyvenu Vilniuje, o bendrabutis yra centre.',
      translation: 'I live in Vilnius, and the dormitory is in the city center.'
    }
  },
  {
    name: 'Vocative',
    lithuanianName: 'Šauksmininkas',
    abbreviation: 'Š.',
    question: 'Kreipimasis! (Direct address!)',
    purpose: 'Calling or greeting someone directly by name or title.',
    color: '#e11d48',
    examples: {
      masculine: { base: 'Tomas, Paulius, ponas', changed: 'Tomai!, Pauliau!, pone!', rule: '-as -> -ai, -us -> -au, ponas -> pone' },
      feminine: { base: 'Eglė, Emilija', changed: 'Egle!, Emilija!', rule: '-ė -> -e, -a -> -a' },
      sampleSentence: 'Laba diena, pone Jonai! Sveikas, Pauliau!',
      translation: 'Good day, Mr. Jonas! Hello, Paulius!'
    }
  }
];

// 2 Skyrius: Šauksmininko taisyklės
export const VOCATIVE_RULES = [
  { ending: '-as', example: 'Tomas → Tomai!', rule: 'Pakeičiama į -ai' },
  { ending: '-is', example: 'Igoris → Igori!', rule: 'Pakeičiama į -i' },
  { ending: '-ys', example: 'Balys → Baly!', rule: 'Pakeičiama į -y' },
  { ending: '-us', example: 'Paulius → Pauliau!', rule: 'Pakeičiama į -au' },
  { ending: '-a', example: 'Emilija → Emilija!', rule: 'Lieka nepakitusi (-a)' },
  { ending: '-ė', example: 'Eglė → Egle!', rule: 'Pakeičiama į -e' },
  { ending: 'Ponas', example: 'Ponas → Pone Jonai!', rule: 'Mandagus kreipinys: pone' },
];

// 3 Skyrius: Vietininko taisyklės (Kur?)
export const LOCATIVE_RULES = [
  { ending: '-as', example: 'Kaunas → Kaune', rule: 'Pakeičiama į -e' },
  { ending: '-is / -ys', example: 'Antakalnis → Antakalnyje; Panevėžys → Panevėžyje', rule: 'Pakeičiama į -yje' },
  { ending: '-a', example: 'Lietuva → Lietuvoje; Palanga → Palangoje', rule: 'Pakeičiama į -oje' },
  { ending: '-ė', example: 'aikštė → aikštėje; kavinė → kavinėje', rule: 'Pakeičiama į -ėje' },
  { ending: '-us', example: 'Vilnius → Vilniuje; turgus → turguje', rule: 'Pakeičiama į -uje' },
  { ending: 'Daugiskaita -ai', example: 'Trakai → Trakuose; Šiauliai → Šiauliuose', rule: 'Pakeičiama į -uose' },
  { ending: 'Daugiskaita -ės', example: 'Santariškės → Santariškėse', rule: 'Pakeičiama į -ėse' },
];

// Prielinksniai pagal skyrius
export const PREPOSITION_RULES = [
  {
    preposition: 'iš + Kilmininkas',
    chapter: '2 skyrius',
    purpose: 'Kilmė (iš kur esate?)',
    examples: ['iš Vokietijos', 'iš Hamburgo', 'iš Latvijos', 'iš Rygos', 'iš Vilniaus', 'iš Monako'],
  },
  {
    preposition: 'prie + Kilmininkas',
    chapter: '3 skyrius',
    purpose: 'Vieta šalia ko nors (near)',
    examples: ['prie banko', 'prie pašto', 'prie stoties', 'prie kavinės', 'prie universiteto'],
  },
  {
    preposition: 'į + Galininkas',
    chapter: '4 skyrius',
    purpose: 'Kryptis į vietą/pastatą (into/to)',
    examples: ['į universitetą', 'į teatrą', 'į kavinę', 'į Vilnių', 'į parką'],
  },
  {
    preposition: 'pas + Galininkas',
    chapter: '4 skyrius',
    purpose: 'Kryptis pas asmenį (to a person)',
    examples: ['pas draugą', 'pas Paulių', 'pas Tomą', 'pas gydytoją', 'pas dėstytoją'],
  },
];

// 4 Skyrius: Laiko reiškimas
export const TIME_EXPRESSION_RULES = [
  {
    category: 'Savaitės dienos (Kada? Galininkas)',
    examples: ['pirmadienį (on Monday)', 'antradienį (on Tuesday)', 'trečiadienį (on Wednesday)', 'penktadienį (on Friday)', 'savaitgalį (on the weekend)'],
  },
  {
    category: 'Paros metas (Kada? Galininkas)',
    examples: ['rytą (in the morning)', 'dieną (during the day)', 'vakarą (in the evening)', 'naktį (at night)'],
  },
  {
    category: 'Valandos (Kelintą valandą? Galininkas)',
    examples: ['pirmą valandą (at 1:00)', 'antrą valandą (at 2:00)', 'penktą valandą (at 5:00)', 'šeštą valandą (at 6:00)'],
  },
  {
    category: 'Pusvalandžiai (pusė + Kilmininkas)',
    examples: ['pusę aštuntos (7:30)', 'pusę dešimtos (9:30)', 'pusę šešių (5:30)'],
  },
];

// Veiksmažodžių asmenavimas (Esamasis laikas)
export const VERB_CONJUGATIONS = {
  buti: {
    title: 'būti (to be)',
    present: [
      { pronoun: 'Aš', form: 'esu', negative: 'nesu', english: 'I am / am not' },
      { pronoun: 'Tu', form: 'esi', negative: 'nesi', english: 'You are / are not' },
      { pronoun: 'Jis / Ji', form: 'yra', negative: 'nėra', english: 'He/She is / is not' },
      { pronoun: 'Mes', form: 'esame', negative: 'nesame', english: 'We are / are not' },
      { pronoun: 'Jūs', form: 'esate', negative: 'nesate', english: 'You are / are not' },
      { pronoun: 'Jie / Jos', form: 'yra', negative: 'nėra', english: 'They are / are not' },
    ],
  },
  kalbeti: {
    title: 'kalbėti (to speak, -a tipas)',
    present: [
      { pronoun: 'Aš', form: 'kalbu', negative: 'nekalbu', english: 'I speak' },
      { pronoun: 'Tu', form: 'kalbi', negative: 'nekalbi', english: 'You speak' },
      { pronoun: 'Jis / Ji', form: 'kalba', negative: 'nekalba', english: 'He/She speaks' },
      { pronoun: 'Mes', form: 'kalbame', negative: 'nekalbame', english: 'We speak' },
      { pronoun: 'Jūs', form: 'kalbate', negative: 'nekalbate', english: 'You speak' },
      { pronoun: 'Jie / Jos', form: 'kalba', negative: 'nekalba', english: 'They speak' },
    ],
  },
  gyventi: {
    title: 'gyventi (to live, -a tipas)',
    present: [
      { pronoun: 'Aš', form: 'gyvenu', negative: 'negyvenu', english: 'I live' },
      { pronoun: 'Tu', form: 'gyveni', negative: 'negyveni', english: 'You live' },
      { pronoun: 'Jis / Ji', form: 'gyvena', negative: 'negyvena', english: 'He/She lives' },
      { pronoun: 'Mes', form: 'gyvename', negative: 'negyvename', english: 'We live' },
      { pronoun: 'Jūs', form: 'gyvenate', negative: 'negyvenate', english: 'You live' },
      { pronoun: 'Jie / Jos', form: 'gyvena', negative: 'negyvena', english: 'They live' },
    ],
  },
};

export const BUTI_CONJUGATION = {
  present: VERB_CONJUGATIONS.buti.present.map(p => ({ pronoun: p.pronoun, form: p.form, english: p.english })),
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
  ],
};

// Autentiškas žodynas ir frazės iš 1–4 skyrių
export const COMMON_PHRASES = [
  { lt: 'Labas rytas!', en: 'Good morning!', note: '1 skyrius: Pasisveikinimas' },
  { lt: 'Laba diena!', en: 'Good afternoon / Hello!', note: '1 skyrius: Dienos pasisveikinimas' },
  { lt: 'Labas vakaras!', en: 'Good evening!', note: '1 skyrius: Vakaro pasisveikinimas' },
  { lt: 'Atsiprašau! – Nieko tokio!', en: 'Excuse me! – Never mind / That\'s okay!', note: '1 skyrius: Atsiprašymas' },
  { lt: 'Ačiū. – Prašom / Nėra už ką.', en: 'Thank you. – You are welcome / Not at all.', note: '1 skyrius: Padėka' },
  { lt: 'Koks tavo vardas? – Mano vardas yra...', en: 'What is your name? – My name is...', note: '1 skyrius: Susipažinimas' },
  { lt: 'Labai malonu! – Man taip pat labai malonu.', en: 'Nice to meet you! – Nice to meet you too.', note: '1 skyrius: Susipažinimas' },
  { lt: 'Kaip sekasi? – Ačiū, puikiai!', en: 'How are you? – Thanks, excellent!', note: '2 skyrius: Savijauta' },
  { lt: 'Iš kur jūs esate? – Aš esu iš Lietuvos.', en: 'Where are you from? – I am from Lithuania.', note: '2 skyrius: Kilmė (iš + K.)' },
  { lt: 'Čia mano draugas Paulius.', en: 'This is my friend Paulius.', note: '2 skyrius: Supažindinimas' },
  { lt: 'Ar tu kalbi lietuviškai? – Truputį kalbu.', en: 'Do you speak Lithuanian? – A little bit.', note: '2 skyrius: Kalbos (-iškai)' },
  { lt: 'Prašom pakartoti ir kalbėti lėčiau!', en: 'Please repeat and speak slower!', note: '2 skyrius: Prašymai' },
  { lt: 'Kur tu gyveni? – Aš gyvenu Vilniuje, centre.', en: 'Where do you live? – In Vilnius, city center.', note: '3 skyrius: Vietininkas' },
  { lt: 'Bankas yra prie pašto.', en: 'The bank is near the post office.', note: '3 skyrius: Vieta (prie + K.)' },
  { lt: 'Koks tavo adresas ir telefono numeris?', en: 'What is your address and phone number?', note: '3 skyrius: Adresas' },
  { lt: 'Kada susitinkame? – Pirmadienį, penktą valandą.', en: 'When do we meet? – On Monday at 5:00.', note: '4 skyrius: Laikas (Galininkas)' },
  { lt: 'Susitinkame pusę aštuntos kavinėje.', en: 'We meet at 7:30 in the cafe.', note: '4 skyrius: Pusvalandžiai (pusė + K.)' },
  { lt: 'Kviečiu į svečius! – Būtinai ateisiu!', en: 'I invite you over! – I will definitely come!', note: '4 skyrius: Kvietimas į svečius' },
  { lt: 'Gero savaitgalio! – Ačiū, ir tau!', en: 'Have a good weekend! – Thanks, you too!', note: '4 skyrius: Palinkėjimas' },
];

export interface GrammarExerciseItem {
  id: string;
  category: 'cases' | 'vocative' | 'prepositions' | 'locative' | 'verbs' | 'time';
  categoryLabel: string;
  sentence: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  fullSentence: string;
  translation: string;
  ruleExplanation: string;
  audioText: string;
}

export const GRAMMAR_EXERCISES: GrammarExerciseItem[] = [
  // 1. NOUN CASES (LINKSNIAI)
  {
    id: 'ge-case-1',
    category: 'cases',
    categoryLabel: '7 Linksniai • Noun Cases',
    sentence: 'Aš esu iš _____ (Lietuva).',
    prompt: 'Select the correct Genitive (Kilmininkas) form indicating origin after "iš":',
    options: ['Lietuvos', 'Lietuvą', 'Lietuvoje', 'Lietuvai'],
    correctAnswer: 'Lietuvos',
    fullSentence: 'Aš esu iš Lietuvos.',
    translation: 'I am from Lithuania.',
    ruleExplanation: 'The preposition "iš" (from) always takes the Genitive case (Kilmininkas). Feminine singular nouns ending in -a change to -os (Lietuva -> Lietuvos).',
    audioText: 'Aš esu iš Lietuvos',
  },
  {
    id: 'ge-case-2',
    category: 'cases',
    categoryLabel: '7 Linksniai • Noun Cases',
    sentence: 'Pusryčiams aš visada geriu juodą _____ (kava).',
    prompt: 'Choose the Accusative (Galininkas) case for the direct object of "geriu":',
    options: ['kavą', 'kavos', 'kavoje', 'kavai'],
    correctAnswer: 'kavą',
    fullSentence: 'Pusryčiams aš visada geriu juodą kavą.',
    translation: 'For breakfast I always drink black coffee.',
    ruleExplanation: 'Direct objects of positive transitive verbs take the Accusative (Galininkas: Ką geriu?). Feminine nouns ending in -a take nasal -ą (kava -> kavą).',
    audioText: 'Pusryčiams aš visada geriu juodą kavą',
  },
  {
    id: 'ge-case-3',
    category: 'cases',
    categoryLabel: '7 Linksniai • Noun Cases',
    sentence: 'Šiandien universitete nėra _____ (Jonas).',
    prompt: 'Select the Genitive (Kilmininkas) form required by negation "nėra":',
    options: ['Jono', 'Joną', 'Jonui', 'Jone'],
    correctAnswer: 'Jono',
    fullSentence: 'Šiandien universitete nėra Jono.',
    translation: 'Today Jonas is not at the university.',
    ruleExplanation: 'The negative existential verb "nėra" (there is no / is absent) strictly requires the Genitive case (Ko nėra?). Masculine nouns in -as become -o (Jonas -> Jono).',
    audioText: 'Šiandien universitete nėra Jono',
  },
  {
    id: 'ge-case-4',
    category: 'cases',
    categoryLabel: '7 Linksniai • Noun Cases',
    sentence: 'Į Vilnių mes keliaujame greituoju _____ (traukinys).',
    prompt: 'Choose the Instrumental (Įnagininkas) case expressing means of travel (Kuo?):',
    options: ['traukiniu', 'traukinį', 'traukinyje', 'traukinio'],
    correctAnswer: 'traukiniu',
    fullSentence: 'Į Vilnių mes keliaujame greituoju traukiniu.',
    translation: 'We travel to Vilnius by fast train.',
    ruleExplanation: 'Instrument of transport answers "Kuo keliaujame?" and takes the Instrumental case (Įnagininkas). Masculine nouns ending in -ys take -iu (traukinys -> traukiniu).',
    audioText: 'Į Vilnių mes keliaujame greituoju traukiniu',
  },

  // 2. VOCATIVE (ŠAUKSMININKAS)
  {
    id: 'ge-voc-1',
    category: 'vocative',
    categoryLabel: 'Šauksmininkas • Vocative Case',
    sentence: 'Labas rytas, _____ (Tomas)! Kaip sekasi?',
    prompt: 'Choose the correct Vocative ending when directly greeting Tomas (-as):',
    options: ['Tomai', 'Tomui', 'Tomą', 'Tome'],
    correctAnswer: 'Tomai',
    fullSentence: 'Labas rytas, Tomai! Kaip sekasi?',
    translation: 'Good morning, Tomas! How are you doing?',
    ruleExplanation: 'Masculine first names ending in -as change their ending to -ai in the Vocative case when addressing someone (Tomas -> Tomai!, Jonas -> Jonai!).',
    audioText: 'Labas rytas, Tomai! Kaip sekasi?',
  },
  {
    id: 'ge-voc-2',
    category: 'vocative',
    categoryLabel: 'Šauksmininkas • Vocative Case',
    sentence: 'Sveikas, _____ (Paulius)! Ar seniai lauki?',
    prompt: 'Select the correct Vocative form for masculine names ending in -ius:',
    options: ['Pauliau', 'Pauliai', 'Pauliui', 'Paulį'],
    correctAnswer: 'Pauliau',
    fullSentence: 'Sveikas, Pauliau! Ar seniai lauki?',
    translation: 'Hello, Paulius! Have you been waiting long?',
    ruleExplanation: 'Masculine names ending in -ius take -iau in the Vocative case (Paulius -> Pauliau!, Andrius -> Andriau!, Julius -> Juliau!).',
    audioText: 'Sveikas, Pauliau! Ar seniai lauki?',
  },
  {
    id: 'ge-voc-3',
    category: 'vocative',
    categoryLabel: 'Šauksmininkas • Vocative Case',
    sentence: 'Laba diena, gerbiamas _____ (dėstytojas)!',
    prompt: 'Select the respectful Vocative form for the title "dėstytojas":',
    options: ['dėstytojau', 'dėstytojai', 'dėstytojui', 'dėstytoją'],
    correctAnswer: 'dėstytojau',
    fullSentence: 'Laba diena, gerbiamas dėstytojau!',
    translation: 'Good afternoon, esteemed lecturer!',
    ruleExplanation: 'Common nouns with multiple syllables ending in -as frequently take -au in addressing for polite harmony (dėstytojas -> gerbiamas dėstytojau!).',
    audioText: 'Laba diena, gerbiamas dėstytojau!',
  },
  {
    id: 'ge-voc-4',
    category: 'vocative',
    categoryLabel: 'Šauksmininkas • Vocative Case',
    sentence: 'Ačiū labai, miela _____ (Lina)!',
    prompt: 'How is a feminine name ending in -a addressed in the Vocative?',
    options: ['Lina', 'Linai', 'Liną', 'Lino'],
    correctAnswer: 'Lina',
    fullSentence: 'Ačiū labai, miela Lina!',
    translation: 'Thank you very much, dear Lina!',
    ruleExplanation: 'Feminine names and nouns ending in -a keep the identical -a form in the Vocative (Lina -> Lina!, mama -> mama!, Rasa -> Rasa!).',
    audioText: 'Ačiū labai, miela Lina!',
  },

  // 3. PREPOSITIONS (Į vs PAS)
  {
    id: 'ge-prep-1',
    category: 'prepositions',
    categoryLabel: 'Prielinksniai • Prepositions (į vs pas)',
    sentence: 'Šį vakarą mes visi einame _____ teatrą.',
    prompt: 'Choose between "į" (places/buildings) and "pas" (people):',
    options: ['į', 'pas', 'prie', 'iš'],
    correctAnswer: 'į',
    fullSentence: 'Šį vakarą mes visi einame į teatrą.',
    translation: 'This evening we are all going to the theater.',
    ruleExplanation: 'Chapter 4 Golden Rule: "į + Accusative" is used when moving towards a place, building, or city (į teatrą, į universitetą, į Vilnių).',
    audioText: 'Šį vakarą mes visi einame į teatrą',
  },
  {
    id: 'ge-prep-2',
    category: 'prepositions',
    categoryLabel: 'Prielinksniai • Prepositions (į vs pas)',
    sentence: 'Rytoj 10 valandą aš turiu vizitą _____ gydytoją.',
    prompt: 'Select the preposition used when visiting an individual or specialist:',
    options: ['pas', 'į', 'su', 'po'],
    correctAnswer: 'pas',
    fullSentence: 'Rytoj 10 valandą aš turiu vizitą pas gydytoją.',
    translation: 'Tomorrow at 10 o\'clock I have an appointment with the doctor.',
    ruleExplanation: 'When directing motion towards a person, friend, or professional specialist, use "pas + Accusative" (pas gydytoją, pas draugą, pas Tomą).',
    audioText: 'Rytoj 10 valandą aš turiu vizitą pas gydytoją',
  },
  {
    id: 'ge-prep-3',
    category: 'prepositions',
    categoryLabel: 'Prielinksniai • Prepositions (į vs pas)',
    sentence: 'Savaitgalį Tomas važiuoja į svečius _____ savo tėvus.',
    prompt: 'Visiting persons (tėvus = parents): which preposition is correct?',
    options: ['pas', 'į', 'iš', 'prie'],
    correctAnswer: 'pas',
    fullSentence: 'Savaitgalį Tomas važiuoja į svečius pas savo tėvus.',
    translation: 'On the weekend Tomas travels to visit his parents.',
    ruleExplanation: '"Pas" denotes visiting people or staying at someone\'s place. Since "tėvai" (parents) are people, "pas tėvus" is the required structure.',
    audioText: 'Savaitgalį Tomas važiuoja į svečius pas savo tėvus',
  },
  {
    id: 'ge-prep-4',
    category: 'prepositions',
    categoryLabel: 'Prielinksniai • Prepositions (į vs pas)',
    sentence: 'Kviečiu tave _____ svečius šį šeštadienį!',
    prompt: 'Complete the authentic idiomatic invitation phrase:',
    options: ['į', 'pas', 'prie', 'su'],
    correctAnswer: 'į',
    fullSentence: 'Kviečiu tave į svečius šį šeštadienį!',
    translation: 'I invite you over to visit this Saturday!',
    ruleExplanation: 'The fixed authentic invitation phrase in Chapter 4 is "kviesti į svečius" (literally "to invite into guests / over for a visit").',
    audioText: 'Kviečiu tave į svečius šį šeštadienį!',
  },

  // 4. LOCATIVE (VIETININKAS - KUR?)
  {
    id: 'ge-loc-1',
    category: 'locative',
    categoryLabel: 'Vietininkas • Locative Case (Kur?)',
    sentence: 'Aš gyvenu ir dirbu _____ (Vilnius).',
    prompt: 'Select the Locative form for city "Vilnius" answering "Kur gyveni?":',
    options: ['Vilniuje', 'Vilnių', 'Vilniaus', 'Vilniui'],
    correctAnswer: 'Vilniuje',
    fullSentence: 'Aš gyvenu ir dirbu Vilniuje.',
    translation: 'I live and work in Vilnius.',
    ruleExplanation: 'Masculine proper nouns ending in -ius take -iuje in the Locative case (Vilnius -> Vilniuje, Šiauliai -> Šiauliuose).',
    audioText: 'Aš gyvenu ir dirbu Vilniuje',
  },
  {
    id: 'ge-loc-2',
    category: 'locative',
    categoryLabel: 'Vietininkas • Locative Case (Kur?)',
    sentence: 'Lietuvių kalbos paskaita vyksta _____ (universitetas).',
    prompt: 'Choose the Locative form for "universitetas" (-as ending):',
    options: ['universitete', 'universitetą', 'universiteto', 'universitetui'],
    correctAnswer: 'universitete',
    fullSentence: 'Lietuvių kalbos paskaita vyksta universitete.',
    translation: 'The Lithuanian language lecture takes place at the university.',
    ruleExplanation: 'Masculine nouns ending in -as change their suffix to -e in the Locative case (universitetas -> universitete, teatras -> teatre).',
    audioText: 'Lietuvių kalbos paskaita vyksta universitete',
  },
  {
    id: 'ge-loc-3',
    category: 'locative',
    categoryLabel: 'Vietininkas • Locative Case (Kur?)',
    sentence: 'Draugai susitinka jaukioje senamiesčio _____ (kavinė).',
    prompt: 'Select the Locative ending for feminine nouns ending in -ė:',
    options: ['kavinėje', 'kavinę', 'kavinės', 'kavinei'],
    correctAnswer: 'kavinėje',
    fullSentence: 'Draugai susitinka jaukioje senamiesčio kavinėje.',
    translation: 'Friends meet in a cozy Old Town cafe.',
    ruleExplanation: 'Feminine nouns ending in -ė take -ėje in the Locative case (kavinė -> kavinėje, aikštė -> aikštėje).',
    audioText: 'Draugai susitinka jaukioje senamiesčio kavinėje',
  },
  {
    id: 'ge-loc-4',
    category: 'locative',
    categoryLabel: 'Vietininkas • Locative Case (Kur?)',
    sentence: 'Mano šeima gyvena gražioje _____ (Lietuva).',
    prompt: 'Choose the Locative form for feminine country ending in -a:',
    options: ['Lietuvoje', 'Lietuvą', 'Lietuvos', 'Lietuvai'],
    correctAnswer: 'Lietuvoje',
    fullSentence: 'Mano šeima gyvena gražioje Lietuvoje.',
    translation: 'My family lives in beautiful Lithuania.',
    ruleExplanation: 'Feminine nouns ending in -a take -oje in the Locative case (Lietuva -> Lietuvoje, Klaipėda -> Klaipėdoje, mokykla -> mokykloje).',
    audioText: 'Mano šeima gyvena gražioje Lietuvoje',
  },

  // 5. VERBS (VEIKSMAŽODŽIAI)
  {
    id: 'ge-verb-1',
    category: 'verbs',
    categoryLabel: 'Veiksmažodžiai • Verb Conjugation',
    sentence: 'Mes _____ (būti) studentai iš Ukrainos.',
    prompt: 'Select the 1st person plural (mes) present form of "būti":',
    options: ['esame', 'esate', 'yra', 'esu'],
    correctAnswer: 'esame',
    fullSentence: 'Mes esame studentai iš Ukrainos.',
    translation: 'We are students from Ukraine.',
    ruleExplanation: 'Present tense conjugation of "būti": Aš esu, tu esi, jis/ji yra, mes esame, jūs esate, jie/jos yra.',
    audioText: 'Mes esame studentai iš Ukrainos',
  },
  {
    id: 'ge-verb-2',
    category: 'verbs',
    categoryLabel: 'Veiksmažodžiai • Verb Conjugation',
    sentence: 'Ar tu laisvai _____ (kalbėti) angliškai?',
    prompt: 'Choose the 2nd person singular (tu) present form of "kalbėti":',
    options: ['kalbi', 'kalbu', 'kalba', 'kalbame'],
    correctAnswer: 'kalbi',
    fullSentence: 'Ar tu laisvai kalbi angliškai?',
    translation: 'Do you speak English fluently?',
    ruleExplanation: '2nd conjugation (-ėti -> -i): aš kalbu, tu kalbi, jis/ji kalba, mes kalbame, jūs kalbate, jie/jos kalba.',
    audioText: 'Ar tu laisvai kalbi angliškai?',
  },
  {
    id: 'ge-verb-3',
    category: 'verbs',
    categoryLabel: 'Veiksmažodžiai • Verb Conjugation',
    sentence: 'Aš _____ (nebūti) gydytojas, aš esu programuotojas.',
    prompt: 'Select the 1st person singular (aš) negative present form of "nebūti":',
    options: ['nesu', 'nesi', 'nėra', 'nesame'],
    correctAnswer: 'nesu',
    fullSentence: 'Aš nesu gydytojas, aš esu programuotojas.',
    translation: 'I am not a doctor, I am a software programmer.',
    ruleExplanation: 'Negative present tense of "būti": Aš nesu, tu nesi, jis/ji nėra, mes nesame, jūs nesate, jie/jos nėra.',
    audioText: 'Aš nesu gydytojas, aš esu programuotojas',
  },
  {
    id: 'ge-verb-4',
    category: 'verbs',
    categoryLabel: 'Veiksmažodžiai • Verb Conjugation',
    sentence: 'Kur jūs šiuo metu _____ (gyventi)?',
    prompt: 'Choose the polite / plural 2nd person (jūs) form of "gyventi":',
    options: ['gyvenate', 'gyveni', 'gyvenu', 'gyvena'],
    correctAnswer: 'gyvenate',
    fullSentence: 'Kur jūs šiuo metu gyvenate?',
    translation: 'Where do you currently live?',
    ruleExplanation: '1st conjugation (-ti -> -a): aš gyvenu, tu gyveni, jis/ji gyvena, mes gyvename, jūs gyvenate, jie/jos gyvena.',
    audioText: 'Kur jūs šiuo metu gyvenate?',
  },

  // 6. TIME EXPRESSIONS (LAIKAS & PUSVALANDŽIAI)
  {
    id: 'ge-time-1',
    category: 'time',
    categoryLabel: 'Laikas • Time Expressions',
    sentence: 'Kelintą valandą susitinkame? Susitinkame _____ (6:00).',
    prompt: 'Select the Accusative time expression answering "Kelintą valandą?":',
    options: ['šeštą valandą', 'šešta valanda', 'šeštos valandos', 'šeštoje valandoje'],
    correctAnswer: 'šeštą valandą',
    fullSentence: 'Susitinkame šeštą valandą.',
    translation: 'We meet at 6 o\'clock.',
    ruleExplanation: 'When answering "Kelintą valandą?" (At what time/hour?), the ordinal number and the word "valanda" are always in the Accusative: šeštą valandą.',
    audioText: 'Susitinkame šeštą valandą',
  },
  {
    id: 'ge-time-2',
    category: 'time',
    categoryLabel: 'Laikas • Time Expressions',
    sentence: 'Paskaita bibliotekoje prasideda pusę _____ (7:30).',
    prompt: 'Complete the Lithuanian half-hour expression for 7:30 (half of the 8th hour):',
    options: ['aštuntos', 'aštuntą', 'septintos', 'septintą'],
    correctAnswer: 'aštuntos',
    fullSentence: 'Paskaita bibliotekoje prasideda pusę aštuntos.',
    translation: 'The lecture in the library starts at 7:30.',
    ruleExplanation: 'In Lithuanian, half-hours use "pusė + upcoming hour in Genitive". 7:30 is "half of the 8th hour", hence "pusė aštuntos" (Genitive of aštunta).',
    audioText: 'Paskaita bibliotekoje prasideda pusę aštuntos',
  },
  {
    id: 'ge-time-3',
    category: 'time',
    categoryLabel: 'Laikas • Time Expressions',
    sentence: 'Kada tavo gimtadienis? Mano gimtadienis yra _____ (pirmadienis).',
    prompt: 'Select the time case used for days of the week answering "Kada?":',
    options: ['pirmadienį', 'pirmadienis', 'pirmadienio', 'pirmadienyje'],
    correctAnswer: 'pirmadienį',
    fullSentence: 'Mano gimtadienis yra pirmadienį.',
    translation: 'My birthday is on Monday.',
    ruleExplanation: 'Days of the week answering "Kada?" (When?) take the Accusative case without prepositions: pirmadienį, antradienį, penktadienį, šeštadienį.',
    audioText: 'Mano gimtadienis yra pirmadienį',
  },
];

