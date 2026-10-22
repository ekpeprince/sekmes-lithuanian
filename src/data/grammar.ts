export interface NounCase {
  name: string;
  lithuanianName: string;
  abbreviation: string;
  question: string;
  purpose: string;
  color: string;
  stressRule?: string;
  phoneticHint?: string;
  sampleSyllables?: string;
  sampleStressTip?: string;
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
    stressRule: 'Nominative singular nouns in -as, -ė, -a typically keep stress on the root or penultimate syllable.',
    phoneticHint: '/TO-mas EE-ra stoo-DEN-tas, o YEH-va EE-ra dace-tee-TO-ya/',
    sampleSyllables: 'TO-mas Y-ra stu-DEN-tas, o IE-va Y-ra dės-ty-TO-ja.',
    sampleStressTip: 'Initial stress on "TO-mas" and "IE-va". Penultimate stress on "stu-DEN-tas" and "dės-ty-TO-ja".',
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
    stressRule: 'After "iš" (from) and "prie" (near), genitive forms frequently carry mobile stress to the case ending or root.',
    phoneticHint: '/ash eh-SOO ish lyeh-too-VOS, o BAN-kas EE-ra pryeh PASH-to/',
    sampleSyllables: 'AŠ e-SU iš lie-tu-VOS, o BAN-kas Y-ra prie PAŠ-to.',
    sampleStressTip: 'Stress shifts to the ending in "lie-tu-VOS" (genitive of Lietuvà). Root stress in "BAN-kas" and "PAŠ-to".',
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
    stressRule: 'Dative singular masculine "-ui/-iui" and feminine "-ai/-ei" denote recipient or indirect beneficiary.',
    phoneticHint: '/AH-choo TOW eer dace-tee-TO-yoo-ee oozh pah-GAHL-bah/',
    sampleSyllables: 'A-čiū TAU ir dės-ty-TO-jui už pa-GAL-bą.',
    sampleStressTip: 'Falling tone on "Á-čiū". Dative ending "-ui" in "dės-ty-TO-jui" is unaccented, keeping stress on root "-to-".',
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
    stressRule: 'The accusative endings -ą, -ę, -į, -ų represent historical nasals pronounced as pure long vowels /aː, eː, iː, uː/.',
    phoneticHint: '/penk-tah-DYEH-nee mes AY-nah-meh ee teh-AHT-rah eer pahs DROW-gah/',
    sampleSyllables: 'penk-ta-DIE-nį mes EI-na-me į te-AT-rą ir pas DRAU-gą.',
    sampleStressTip: 'Notice the nasal vowels ą, į are pronounced long, NOT nasal. Accent falls on "DIE-nį", "EI-na-me", "te-AT-rą".',
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
    stressRule: 'Instrumental with "su" (with) or payment indicates tool/instrument; short "-u", "-e" endings are quick.',
    phoneticHint: '/noh-RAY-chyow kah-VOS soo PYEH-noo eer moh-KAY-tee kor-TEH-leh/',
    sampleSyllables: 'no-RĖ-čiau ka-VOS su PIE-nu ir mo-KĖ-ti kor-TE-le.',
    sampleStressTip: 'Diphthong "-ie-" in "PIE-nu" takes the acute stress. "kor-TE-le" stresses the penultimate syllable "-te-".',
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
    stressRule: 'Location in a place ("Kur?"): endings -e, -yje, -oje, -ėje, -uje indicate inside a city, country, or building.',
    phoneticHint: '/ash gee-veh-NOO VEEL-nyoo-yeh, o ben-drah-BOO-tees EE-ra tsen-TREH/',
    sampleSyllables: 'AŠ gy-ve-NU vil-NIU-je, o ben-dra-BU-tis Y-ra cen-TRE.',
    sampleStressTip: 'Locative "-e" in "cen-TRÈ" is stressed. Locative "-yje" / "-uje" in "vil-NIU-je" keeps stress on the root.',
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
    stressRule: 'Direct address: masculine -as becomes -ai, -ius becomes -iau, title ponas becomes pone.',
    phoneticHint: '/lah-BAH dyeh-NAH, POH-neh YOH-nye! SVAY-kahs, POW-lyow/',
    sampleSyllables: 'la-BA die-NA, PO-ne JO-nai! SVEI-kas, PAU-liau!',
    sampleStressTip: 'Direct address: both words in "la-BÀ die-NÀ" take final stress. Names in vocative: "JO-nai" (-ai) and "PAU-liau" (-iau).',
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
  { ending: '-as', example: 'Tomas → Tomai!', rule: 'Pakeičiama į -ai', syllables: 'TO-mas → TO-mai!', stressTip: 'Stress remains on the first root syllable.' },
  { ending: '-is', example: 'Igoris → Igori!', rule: 'Pakeičiama į -i', syllables: 'I-go-ris → I-go-ri!', stressTip: 'Final -s is dropped; stress remains on root I-.' },
  { ending: '-ys', example: 'Balys → Baly!', rule: 'Pakeičiama į -y', syllables: 'ba-LYS → ba-LY!', stressTip: 'Final long -y receives end stress with rising pitch.' },
  { ending: '-us', example: 'Paulius → Pauliau!', rule: 'Pakeičiama į -au', syllables: 'PAU-lius → PAU-liau!', stressTip: 'Diphthong -iau replaces -ius; root retains accent.' },
  { ending: '-a', example: 'Emilija → Emilija!', rule: 'Lieka nepakitusi (-a)', syllables: 'e-MI-li-ja → e-MI-li-ja!', stressTip: 'Form remains unchanged; keep natural penultimate stress.' },
  { ending: '-ė', example: 'Eglė → Egle!', rule: 'Pakeičiama į -e', syllables: 'EG-lė → EG-le!', stressTip: 'Long -ė shortens to regular open short -e in address.' },
  { ending: 'Ponas', example: 'Ponas → Pone Jonai!', rule: 'Mandagus kreipinys: pone', syllables: 'PO-nas → PO-ne JO-nai!', stressTip: 'Irregular polite vocative: ponas becomes pone.' },
];

// 3 Skyrius: Vietininko taisyklės (Kur?)
export const LOCATIVE_RULES = [
  { ending: '-as', example: 'Kaunas → Kaune', rule: 'Pakeičiama į -e', syllables: 'KAU-nas → KAU-ne', stressTip: 'Stress remains on root KAU-.' },
  { ending: '-is / -ys', example: 'Antakalnis → Antakalnyje; Panevėžys → Panevėžyje', rule: 'Pakeičiama į -yje', syllables: 'an-ta-KAL-nis → an-ta-KAL-ny-je; pa-ne-vė-ŽYS → pa-ne-vė-ŽY-je', stressTip: 'Stress shifts directly onto long -Y- in -yje.' },
  { ending: '-a', example: 'Lietuva → Lietuvoje; Palanga → Palangoje', rule: 'Pakeičiama į -oje', syllables: 'lie-tu-VA → lie-tu-VO-je; pa-lan-GA → pa-lan-GO-je', stressTip: 'Stress moves onto the long -O- in suffix -oje.' },
  { ending: '-ė', example: 'aikštė → aikštėje; kavinė → kavinėje', rule: 'Pakeičiama į -ėje', syllables: 'AIKŠ-tė → AIKŠ-tė-je; ka-vi-NĖ → ka-vi-NĖ-je', stressTip: 'In words with mobile stress (kavinė), accent lands on -Ė- in -ėje.' },
  { ending: '-us', example: 'Vilnius → Vilniuje; turgus → turguje', rule: 'Pakeičiama į -uje', syllables: 'VIL-nius → VIL-niu-je; TUR-gus → TUR-gu-je', stressTip: 'Masculine -us nouns preserve root stress in the locative.' },
  { ending: 'Daugiskaita -ai', example: 'Trakai → Trakuose; Šiauliai → Šiauliuose', rule: 'Pakeičiama į -uose', syllables: 'tra-KAI → tra-KUO-se; šiau-LIAI → šiau-LIUO-se', stressTip: 'Plural locative takes -uose with diphthong -UO- carrying stress.' },
  { ending: 'Daugiskaita -ės', example: 'Santariškės → Santariškėse', rule: 'Pakeičiama į -ėse', syllables: 'san-ta-RIŠ-kės → san-ta-RIŠ-kė-se', stressTip: 'Root accent is preserved before suffix -ėse.' },
];

// Prielinksniai pagal skyrius
export const PREPOSITION_RULES = [
  {
    preposition: 'iš + Kilmininkas',
    chapter: '2 skyrius',
    purpose: 'Kilmė (iš kur esate?) • Origin (Where from?)',
    examples: ['iš Vokietijos', 'iš Hamburgo', 'iš Latvijos', 'iš Rygos', 'iš Vilniaus', 'iš Monako'],
    syllableExamples: ['iš vo-kie-TI-jos', 'iš ham-BUR-go', 'iš LAT-vi-jos', 'iš RY-gos', 'iš VIL-niaus', 'iš mo-NA-ko'],
    stressTip: 'Preposition "iš" is an unstressed proclitic; main accent lands firmly on the country/city name.',
  },
  {
    preposition: 'prie + Kilmininkas',
    chapter: '3 skyrius',
    purpose: 'Vieta šalia ko nors • Proximity (Near / by)',
    examples: ['prie banko', 'prie pašto', 'prie stoties', 'prie kavinės', 'prie universiteto'],
    syllableExamples: ['prie BAN-ko', 'prie PAŠ-to', 'prie sto-TIES', 'prie ka-vi-NĖS', 'prie uni-ver-si-TE-to'],
    stressTip: 'Notice "sto-TIES" and "ka-vi-NĖS" take final syllable stress in the genitive.',
  },
  {
    preposition: 'į + Galininkas',
    chapter: '4 skyrius',
    purpose: 'Kryptis į vietą/pastatą • Direction (Into/to a place)',
    examples: ['į universitetą', 'į teatrą', 'į kavinę', 'į Vilnių', 'į parką'],
    syllableExamples: ['į uni-ver-si-TE-tą', 'į te-AT-rą', 'į ka-VI-nę', 'į VIL-nių', 'į PAR-ką'],
    stressTip: 'Destination nouns end in nasal long vowels: -ą, -ę, -į. Accent remains on root or stem.',
  },
  {
    preposition: 'pas + Galininkas',
    chapter: '4 skyrius',
    purpose: 'Kryptis pas asmenį • Direction (To a person)',
    examples: ['pas draugą', 'pas Paulių', 'pas Tomą', 'pas gydytoją', 'pas dėstytoją'],
    syllableExamples: ['pas DRAU-gą', 'pas PAU-lių', 'pas TO-mą', 'pas GY-dy-to-ją', 'pas dės-ty-TO-ją'],
    stressTip: 'Use "pas" strictly for humans and animates (never for buildings or cities!).',
  },
];

// 4 Skyrius: Laiko reiškimas
export const TIME_EXPRESSION_RULES = [
  {
    category: 'Savaitės dienos (Kada? Galininkas)',
    examples: ['pirmadienį (on Monday)', 'antradienį (on Tuesday)', 'trečiadienį (on Wednesday)', 'penktadienį (on Friday)', 'savaitgalį (on the weekend)'],
    syllableExamples: ['pir-ma-DIE-nį', 'an-tra-DIE-nį', 'tre-čia-DIE-nį', 'penk-ta-DIE-nį', 'sa-vait-GA-lį'],
    stressTip: 'Compound weekdays always accent the stem "-DIE-nį" with long -ie- diphthong and final long -į.',
  },
  {
    category: 'Paros metas (Kada? Galininkas)',
    examples: ['rytą (in the morning)', 'dieną (during the day)', 'vakarą (in the evening)', 'naktį (at night)'],
    syllableExamples: ['RY-tą', 'DIE-ną', 'VA-ka-rą', 'NAK-tį'],
    stressTip: 'Accusative singular expresses time when: "rytą" has long initial [RÝ-], "naktį" has acute [NÁK-].',
  },
  {
    category: 'Valandos (Kelintą valandą? Galininkas)',
    examples: ['pirmą valandą (at 1:00)', 'antrą valandą (at 2:00)', 'penktą valandą (at 5:00)', 'šeštą valandą (at 6:00)'],
    syllableExamples: ['PIR-mą va-lan-DĄ', 'AN-trą va-lan-DĄ', 'PENK-tą va-lan-DĄ', 'ŠEŠ-tą va-lan-DĄ'],
    stressTip: 'Ordinal numbers take initial stress (PIR-mą, AN-trą), while "va-lan-DĄ" stresses final -DĄ.',
  },
  {
    category: 'Pusvalandžiai (pusė + Kilmininkas)',
    examples: ['pusę aštuntos (7:30)', 'pusę dešimtos (9:30)', 'pusę šešių (5:30)'],
    syllableExamples: ['PU-sę aš-TUN-tos', 'PU-sę de-ŠIM-tos', 'PU-sę še-ŠIŲ'],
    stressTip: 'Literally "half of the eighth hour" (7:30). "PU-sę" takes accusative of quantity, followed by genitive ordinal.',
  },
];

// Veiksmažodžių asmenavimas (Esamasis laikas)
export const VERB_CONJUGATIONS = {
  buti: {
    title: 'būti (to be)',
    stressRule: '1st & 2nd person singular take ending stress (e-SÙ, e-SÌ), while 3rd person "yra" takes initial stress (Ý-ra). Negative prefix "ne-" takes stress in "NĖ-ra".',
    present: [
      { pronoun: 'Aš', form: 'esu', negative: 'nesu', syllables: 'e-SU', negativeSyllables: 'ne-SU', english: 'I am / am not' },
      { pronoun: 'Tu', form: 'esi', negative: 'nesi', syllables: 'e-SI', negativeSyllables: 'ne-SI', english: 'You are / are not' },
      { pronoun: 'Jis / Ji', form: 'yra', negative: 'nėra', syllables: 'Y-ra', negativeSyllables: 'NĖ-ra', english: 'He/She is / is not' },
      { pronoun: 'Mes', form: 'esame', negative: 'nesame', syllables: 'e-SA-me', negativeSyllables: 'ne-SA-me', english: 'We are / are not' },
      { pronoun: 'Jūs', form: 'esate', negative: 'nesate', syllables: 'e-SA-te', negativeSyllables: 'ne-SA-te', english: 'You are / are not' },
      { pronoun: 'Jie / Jos', form: 'yra', negative: 'nėra', syllables: 'Y-ra', negativeSyllables: 'NĖ-ra', english: 'They are / are not' },
    ],
  },
  kalbeti: {
    title: 'kalbėti (to speak, -a tipas)',
    stressRule: '1st & 2nd person take final syllable stress (kal-BÙ, kal-BÌ), 3rd person stresses the root (KÀL-ba). Plural forms stress the linking vowel (kal-BÀ-me, kal-BÀ-te).',
    present: [
      { pronoun: 'Aš', form: 'kalbu', negative: 'nekalbu', syllables: 'kal-BU', negativeSyllables: 'ne-kal-BU', english: 'I speak' },
      { pronoun: 'Tu', form: 'kalbi', negative: 'nekalbi', syllables: 'kal-BI', negativeSyllables: 'ne-kal-BI', english: 'You speak' },
      { pronoun: 'Jis / Ji', form: 'kalba', negative: 'nekalba', syllables: 'KAL-ba', negativeSyllables: 'ne-KAL-ba', english: 'He/She speaks' },
      { pronoun: 'Mes', form: 'kalbame', negative: 'nekalbame', syllables: 'kal-BA-me', negativeSyllables: 'ne-kal-BA-me', english: 'We speak' },
      { pronoun: 'Jūs', form: 'kalbate', negative: 'nekalbate', syllables: 'kal-BA-te', negativeSyllables: 'ne-kal-BA-te', english: 'You speak' },
      { pronoun: 'Jie / Jos', form: 'kalba', negative: 'nekalba', syllables: 'KAL-ba', negativeSyllables: 'ne-KAL-ba', english: 'They speak' },
    ],
  },
  gyventi: {
    title: 'gyventi (to live, -a tipas)',
    stressRule: '1st & 2nd person stress the ending (gy-ve-NÙ, gy-ve-NÌ). 3rd person stresses the root vowel -e- (gy-VÈ-na). Plural forms accent -na- (gy-ve-NÀ-me, gy-ve-NÀ-te).',
    present: [
      { pronoun: 'Aš', form: 'gyvenu', negative: 'negyvenu', syllables: 'gy-ve-NU', negativeSyllables: 'ne-gy-ve-NU', english: 'I live' },
      { pronoun: 'Tu', form: 'gyveni', negative: 'negyveni', syllables: 'gy-ve-NI', negativeSyllables: 'ne-gy-ve-NI', english: 'You live' },
      { pronoun: 'Jis / Ji', form: 'gyvena', negative: 'negyvena', syllables: 'gy-VE-na', negativeSyllables: 'ne-gy-VE-na', english: 'He/She lives' },
      { pronoun: 'Mes', form: 'gyvename', negative: 'negyvename', syllables: 'gy-ve-NA-me', negativeSyllables: 'ne-gy-ve-NA-me', english: 'We live' },
      { pronoun: 'Jūs', form: 'gyvenate', negative: 'negyvenate', syllables: 'gy-ve-NA-te', negativeSyllables: 'ne-gy-ve-NA-te', english: 'You live' },
      { pronoun: 'Jie / Jos', form: 'gyvena', negative: 'negyvena', syllables: 'gy-VE-na', negativeSyllables: 'ne-gy-VE-na', english: 'They live' },
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

// Autentiškas žodynas ir frazės iš 1–4 skyrių su skiemenimis ir kirtčiu
export const COMMON_PHRASES = [
  { lt: 'Labas rytas!', en: 'Good morning!', note: '1 skyrius: Pasisveikinimas', syllables: 'LA-bas RY-tas!', phonetic: '/LA-bahs REE-tahs/', stressTip: 'First syllable on both words: LÁ-bas RÝ-tas.' },
  { lt: 'Laba diena!', en: 'Good afternoon / Hello!', note: '1 skyrius: Dienos pasisveikinimas', syllables: 'la-BA die-NA!', phonetic: '/lah-BAH dyeh-NAH/', stressTip: 'Final syllable stress on both words: la-BÀ die-NÀ.' },
  { lt: 'Labas vakaras!', en: 'Good evening!', note: '1 skyrius: Vakaro pasisveikinimas', syllables: 'LA-bas VA-ka-ras!', phonetic: '/LA-bahs VAH-kah-rahs/', stressTip: 'Initial syllable stress on both words: LÁ-bas VÁ-ka-ras.' },
  { lt: 'Atsiprašau! – Nieko tokio!', en: 'Excuse me! – Never mind / That\'s okay!', note: '1 skyrius: Atsiprašymas', syllables: 'a-tsi-pra-ŠAU! – NIE-ko TO-kio!', phonetic: '/ah-tsee-prah-SHOW! – NYEH-ko TOH-kyo/', stressTip: 'Final diphthong -au in a-tsi-pra-ŠAŨ. Root initial on NIE-ko.' },
  { lt: 'Ačiū. – Prašom / Nėra už ką.', en: 'Thank you. – You are welcome / Not at all.', note: '1 skyrius: Padėka', syllables: 'A-čiū. – PRA-šom / NĖ-ra už KĄ.', phonetic: '/AH-choo. – PRAH-shohm / NAY-rah oozh KAH/', stressTip: 'Falling pitch on Á-čiū. Long pure /aː/ in KĄ.' },
  { lt: 'Koks tavo vardas? – Mano vardas yra...', en: 'What is your name? – My name is...', note: '1 skyrius: Susipažinimas', syllables: 'KOKS TA-vo VAR-das? – MA-no VAR-das Y-ra...', phonetic: '/koks TAH-vo VAHR-dahs? – MAH-no VAHR-dahs EE-ra.../', stressTip: 'Root syllables stressed: TÀ-vo, VÀR-das, MÀ-no, Ý-ra.' },
  { lt: 'Labai malonu! – Man taip pat labai malonu.', en: 'Nice to meet you! – Nice to meet you too.', note: '1 skyrius: Susipažinimas', syllables: 'la-BAI ma-LO-nu! – MAN TAIP PAT la-BAI ma-LO-nu.', phonetic: '/lah-BYE mah-LOH-noo! – mahn type paht lah-BYE mah-LOH-noo/', stressTip: 'Final rising stress in la-BAĨ; middle stress in ma-LÓ-nu.' },
  { lt: 'Kaip sekasi? – Ačiū, puikiai!', en: 'How are you? – Thanks, excellent!', note: '2 skyrius: Savijauta', syllables: 'KAIP SE-ka-si? – A-čiū, PUI-kiai!', phonetic: '/kype SEH-kah-see? – AH-choo, PWEE-kye!/', stressTip: 'Root accent in SÈ-ka-si and PUĨ-kiai.' },
  { lt: 'Iš kur jūs esate? – Aš esu iš Lietuvos.', en: 'Where are you from? – I am from Lithuania.', note: '2 skyrius: Kilmė (iš + K.)', syllables: 'IŠ KUR JŪS e-SA-te? – AŠ e-SU iš lie-tu-VOS.', phonetic: '/eesh koor yoos eh-SAH-teh? – ash eh-SOO eesh lyeh-too-VOS/', stressTip: 'Genitive origin shifts accent to ending: lie-tu-VÕS.' },
  { lt: 'Čia mano draugas Paulius.', en: 'This is my friend Paulius.', note: '2 skyrius: Supažindinimas', syllables: 'ČIA MA-no DRAU-gas PAU-lius.', phonetic: '/chya MAH-no DROW-gahs POW-lyoos/', stressTip: 'Root diphthongs accented: DRAŨ-gas, PAŨ-lius.' },
  { lt: 'Ar tu kalbi lietuviškai? – Truputį kalbu.', en: 'Do you speak Lithuanian? – A little bit.', note: '2 skyrius: Kalbos (-iškai)', syllables: 'AR TU kal-BI lie-TU-viš-kai? – TRU-pu-tį kal-BU.', phonetic: '/ahr too kahl-BEE lyeh-TOO-veesh-kye? – TROO-poo-tee kahl-BOO/', stressTip: 'Ending stress in kal-BÌ and kal-BÙ. Adverbs in -iškai stress root: lie-TÙ-viš-kai.' },
  { lt: 'Prašom pakartoti ir kalbėti lėčiau!', en: 'Please repeat and speak slower!', note: '2 skyrius: Prašymai', syllables: 'PRA-šom pa-kar-TO-ti ir kal-BĖ-ti lė-ČIAU!', phonetic: '/PRAH-shohm pah-kahr-TOH-tee eer kahl-BAY-tee lay-CHYOW/', stressTip: 'Infinitive stem accents: pa-kar-TÓ-ti, kal-BÉ-ti. Comparative suffix -čiau in lė-ČIAŨ.' },
  { lt: 'Kur tu gyveni? – Aš gyvenu Vilniuje, centre.', en: 'Where do you live? – In Vilnius, city center.', note: '3 skyrius: Vietininkas', syllables: 'KUR TU gy-ve-NI? – AŠ gy-ve-NU VIL-niu-je, cen-TRE.', phonetic: '/koor too gee-veh-NEE? – ash gee-veh-NOO VEEL-nyoo-yeh, tsen-TREH/', stressTip: 'Locative endings: VIL-niu-je (root accent) vs cen-TRÈ (final accent).' },
  { lt: 'Bankas yra prie pašto.', en: 'The bank is near the post office.', note: '3 skyrius: Vieta (prie + K.)', syllables: 'BAN-kas Y-ra prie PAŠ-to.', phonetic: '/BAHN-kahs EE-ra pryeh PASH-to/', stressTip: 'Clear initial root stress: BÁN-kas, PÁŠ-to.' },
  { lt: 'Koks tavo adresas ir telefono numeris?', en: 'What is your address and phone number?', note: '3 skyrius: Adresas', syllables: 'KOKS TA-vo AD-re-sas ir te-le-FO-no NU-me-ris?', phonetic: '/koks TAH-vo AHD-reh-sahs eer teh-leh-FOH-no NOO-meh-rees/', stressTip: 'Foreign loanwords follow specific stress: te-le-FÒ-no, NÙ-me-ris.' },
  { lt: 'Kada susitinkame? – Pirmadienį, penktą valandą.', en: 'When do we meet? – On Monday at 5:00.', note: '4 skyrius: Laikas (Galininkas)', syllables: 'ka-DA su-si-TIN-ka-me? – pir-ma-DIE-nį, PENK-tą va-lan-DĄ.', phonetic: '/kah-DAH soo-see-TEEN-kah-meh? – peer-mah-DYEH-nee, PENK-tah vah-lahn-DAH/', stressTip: 'Stem stress in pir-ma-DIẼ-nį, end stress in va-lan-DĄ̃.' },
  { lt: 'Susitinkame pusę aštuntos kavinėje.', en: 'We meet at 7:30 in the cafe.', note: '4 skyrius: Pusvalandžiai (pusė + K.)', syllables: 'su-si-TIN-ka-me PU-sę aš-TUN-tos ka-vi-NĖ-je.', phonetic: '/soo-see-TEEN-kah-meh POO-seh ash-TOON-tos kah-vee-NAY-yeh/', stressTip: 'Accusative PÙ-sę followed by genitive ordinal aš-tun-TÕS; locative ka-vi-NĖ-je.' },
  { lt: 'Kviečiu į svečius! – Būtinai ateisiu!', en: 'I invite you over! – I will definitely come!', note: '4 skyrius: Kvietimas į svečius', syllables: 'KVIE-čiu į sve-ČIUS! – bū-ti-NAI a-TEI-siu!', phonetic: '/KVYEH-chyoo ee sveh-CHYOOS! – boo-tee-NYE ah-TAY-syoo/', stressTip: 'End stress in accusative plural sve-ČIÙS. Future verb a-TEĨ-siu.' },
  { lt: 'Gero savaitgalio! – Ačiū, ir tau!', en: 'Have a good weekend! – Thanks, you too!', note: '4 skyrius: Palinkėjimas', syllables: 'ge-RO sa-vait-GA-lio! – A-čiū, ir TAU!', phonetic: '/geh-ROH sah-vyte-GAH-lyoh! – AH-choo, eer TOW/', stressTip: 'Wishes take genitive: ge-RÕ sa-vait-GA-lio. Emphatic TÁU.' },
];

// Lietuvių rašybos, kirčiavimo ir nosinių / varnelių taisyklės (Industry Standard)
export interface DiacriticRule {
  letter: string;
  name: string;
  ipa: string;
  description: string;
  soundHint: string;
  contrastExample: { wrong: string; right: string; note: string };
  sampleWords: { word: string; syllables: string; translation: string }[];
}

export const DIACRITICS_GUIDE: DiacriticRule[] = [
  {
    letter: 'ą, ę, į, ų',
    name: 'Nosinės raidės (Ogonek / Nasal Vowels)',
    ipa: '/aː, eː, iː, uː/',
    description: 'Historical nasal vowels from Proto-Baltic. In modern standard Lithuanian, they are NEVER pronounced through the nose! They denote pure long vowels with double duration.',
    soundHint: 'Pronounce them exactly like long vowels (ą = aa, ę = ee, į = y, ų = ū) without nasal airflow.',
    contrastExample: {
      wrong: 'Pronouncing ą as French nasal "on" / "an"',
      right: 'Pronouncing ą as long pure "aah" (like "father")',
      note: 'Found in Accusative case endings (kavą, kavinę, arbatą) and noun/verb roots (sąskaita, drąsa).',
    },
    sampleWords: [
      { word: 'kavą', syllables: 'ka-VĄ', translation: 'coffee (accusative)' },
      { word: 'kavinę', syllables: 'ka-VI-nę', translation: 'café (accusative)' },
      { word: 'sąskaita', syllables: 'SĄS-kai-ta', translation: 'bill / check' },
      { word: 'pirmadienį', syllables: 'pir-ma-DIE-nį', translation: 'on Monday' },
    ],
  },
  {
    letter: 'č, š, ž',
    name: 'Varnelės (Hushing Sibilants / Caron)',
    ipa: '/tʃ, ʃ, ʒ/',
    description: 'Post-alveolar hushing sounds corresponding to English ch, sh, and measure / leisure "zh". Distinct from sharp dental s, z, c.',
    soundHint: 'č = "ch" in chocolate; š = "sh" in ship; ž = "s" in vision / pleasure.',
    contrastExample: {
      wrong: 'Confusing c [ts] with č [ch], or s with š',
      right: 'c = "ts" (centras); č = "ch" (ačiū, čia)',
      note: 'Critical for respectful vocatives and common pleasantries (ačiū, svečiai, čia).',
    },
    sampleWords: [
      { word: 'ačiū', syllables: 'A-čiū', translation: 'thank you' },
      { word: 'šeštadienis', syllables: 'šeš-TA-die-nis', translation: 'Saturday' },
      { word: 'žodis', syllables: 'ŽO-dis', translation: 'word' },
      { word: 'atsiprašau', syllables: 'a-tsi-pra-ŠAU', translation: 'excuse me' },
    ],
  },
  {
    letter: 'ė, ū, y',
    name: 'Ilgosios balsės (Close Long Vowels)',
    ipa: '/eː, uː, iː/',
    description: 'Long vowels with distinct closed mouth position: "ė" is a closed tense long /eː/, completely distinct from open short "e" /ɛ/ or open long "ę" /æː/. "y" is identical in sound to long "į".',
    soundHint: 'ė = tense French "é" or German "See"; ū & y = hold vowel twice as long as short u & i.',
    contrastExample: {
      wrong: 'Pronouncing ė as open English "eh" / bed',
      right: 'Pronouncing ė as closed tense /eː/ with smiling lips (kavinė, aikštė)',
      note: 'Phonemic minimal pairs: ledas (ice) vs lėdas (slow), kilti (to rise) vs klysti (to err).',
    },
    sampleWords: [
      { word: 'kavinėje', syllables: 'ka-vi-NĖ-je', translation: 'in the cafe' },
      { word: 'būti', syllables: 'BŪ-ti', translation: 'to be' },
      { word: 'Vilniuje', syllables: 'VIL-niu-je', translation: 'in Vilnius' },
      { word: 'dėstytojas', syllables: 'dės-ty-TO-jas', translation: 'lecturer' },
    ],
  },
  {
    letter: 'i (prieš a, o, u)',
    name: 'Minkštumo ženklas (Palatalization Soft Sign)',
    ipa: '/ʲ/ (palatalized consonant)',
    description: 'When the letter "i" appears between a consonant and a back vowel (ia, io, iu, iū, iau), the "i" is NOT pronounced as a separate vowel! It merely softens (palatalizes) the preceding consonant.',
    soundHint: 'Vilnius is pronounced [VIL-n\'us], NOT [Vil-nee-oos]! "Pauliau" is [POW-l\'ow], NOT [Pow-lee-ow].',
    contrastExample: {
      wrong: 'Pronouncing every "i" as a separate syllable in words like "Vilnius" or "Pauliau"',
      right: 'Softening the preceding consonant: [lʲ] in "Vilnius", [lʲ] in "Pauliau", [t͡ʃʲ] in "ačiū"',
      note: 'Crucial for native fluency: foreign speakers often add extra ghost syllables by pronouncing this "i".',
    },
    sampleWords: [
      { word: 'Vilnius', syllables: 'VIL-nius', translation: 'Vilnius [VIL-nʲʊs]' },
      { word: 'Pauliau', syllables: 'PAU-liau', translation: 'Paulius (vocative) [PAU-lʲɛʊ]' },
      { word: 'svečias', syllables: 'SVE-čias', translation: 'guest [SV’E-t͡ʃʲɛs]' },
      { word: 'broliai', syllables: 'BRO-liai', translation: 'brothers [BRO-lʲɛɪ]' },
    ],
  },
];

// Lietuvių kalbos kirčiavimo pagrindai (4 kirčiuotės / 4 Accent Classes)
export const LITHUANIAN_STRESS_CLASSES = [
  {
    classNumber: '1',
    name: '1-oji kirčiuotė (Pastovioji)',
    rule: 'Kirtis visada išlieka ant to paties šaknies skiemens visuose linksniuose (pvz., brólis, bróliui, brólį, brólyje).',
    example: 'brolis, vyras, kėdė',
  },
  {
    classNumber: '2',
    name: '2-oji kirčiuotė (Kairinė kilnojamoji)',
    rule: 'Kirtis šokinėja tarp šaknies ir galūnės, tačiau šaknyje visada turi kairinį kirtį ` (pvz., rãtas, ratè, ratùs).',
    example: 'ratas, medis, ranka',
  },
  {
    classNumber: '3',
    name: '3-ioji kirčiuotė (Dešininė kilnojamoji)',
    rule: 'Kirtis šaknyje turi dešininį kirtį ´ (ilgąjį kirtį), tačiau daugiskaitoje ar linksniuose gali persikelti į galūnę.',
    example: 'galva, vanduo, šalis',
  },
  {
    classNumber: '4',
    name: '4-oji kilnojamoji (Kilnojamoji su riestiniu)',
    rule: 'Kirtis dažniausiai persikelia į galūnę daugumoje linksnių (pvz., dainà, dainõs, dainą̃, dainojè).',
    example: 'daina, žiema, kalba',
  },
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

