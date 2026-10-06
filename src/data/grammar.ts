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
