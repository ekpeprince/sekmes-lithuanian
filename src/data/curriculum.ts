import { Unit, Lesson } from '@/types/lesson';

export const UNITS: Unit[] = [
  {
    id: 'unit-1',
    number: 1,
    title: 'Foundations & Introductions',
    subtitle: 'Pradžia ir Pasisveikinimai',
    description: 'Master core greetings, polite words, the verb "būti" (to be), and introducing where you come from.',
    color: '#059669', // Emerald / Green Duolingo vibe
    accentColor: '#10b981',
    lessons: [
      {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Greetings & Polite Words',
        description: 'Learn everyday greetings, polite expressions, and farewells in Lithuanian.',
        xpReward: 20,
        order: 1,
        exercises: [
          {
            id: 'u1-l1-e1',
            type: 'multiple_choice',
            prompt: 'How do you say "Good morning" in Lithuanian?',
            audioText: 'Labas rytas',
            options: ['Labas rytas', 'Laba diena', 'Labas vakaras', 'Ačiū'],
            correctAnswer: 'Labas rytas',
            explanation: '"Labas rytas" literally translates to "Good morning" (rytas = morning).'
          },
          {
            id: 'u1-l1-e2',
            type: 'match_pairs',
            prompt: 'Match the Lithuanian polite phrases with their English meanings:',
            audioText: 'Ačiū ir prašom',
            pairs: [
              { id: 'p1', lithuanian: 'Ačiū', english: 'Thank you' },
              { id: 'p2', lithuanian: 'Prašom', english: 'You are welcome / Please' },
              { id: 'p3', lithuanian: 'Atsiprašau', english: 'Excuse me / Sorry' },
              { id: 'p4', lithuanian: 'Iki pasimatymo', english: 'See you later / Goodbye' }
            ],
            explanation: '"Ačiū" is the universal word for thanks, while "Prašom" is used both for "please" and "you\'re welcome".'
          },
          {
            id: 'u1-l1-e3',
            type: 'word_bank_order',
            prompt: 'Assemble the sentence: "Good afternoon, thank you!"',
            audioText: 'Laba diena, ačiū!',
            words: ['diena', 'Laba', 'ačiū', 'Labas', 'rytas'],
            correctSequence: ['Laba', 'diena', 'ačiū'],
            explanation: '"Laba diena" means "Good afternoon / Good day". "Laba" is feminine agreeing with "diena" (day).'
          },
          {
            id: 'u1-l1-e4',
            type: 'multiple_choice',
            prompt: 'What does "Labas vakaras" mean?',
            audioText: 'Labas vakaras',
            options: ['Good evening', 'Good morning', 'Good night', 'Hello friend'],
            correctAnswer: 'Good evening',
            explanation: '"Vakaras" means evening, so "Labas vakaras" is "Good evening".'
          },
          {
            id: 'u1-l1-e5',
            type: 'dialogue_fill',
            prompt: 'Complete the friendly farewell conversation:',
            audioText: 'Iki pasimatymo! Viso gero!',
            dialogue: [
              { speaker: 'Eglė', text: 'Ačiū už pagalbą! Iki pasimatymo!' },
              { speaker: 'Lukas', text: 'Prašom! ___ gero!', isBlank: true, blankPrefix: '', blankSuffix: 'gero!' }
            ],
            options: ['Viso', 'Labas', 'Ačiū', 'Rytas'],
            correctAnswer: 'Viso',
            explanation: '"Viso gero" is a common polite way to say goodbye (all the best).'
          }
        ]
      },
      {
        id: 'lesson-2',
        unitId: 'unit-1',
        title: 'Identity & The Verb "būti"',
        description: 'Conjugate the essential verb "būti" (to be) in present tense and state who you are.',
        xpReward: 25,
        order: 2,
        exercises: [
          {
            id: 'u1-l2-e1',
            type: 'fill_in_the_blank',
            prompt: 'Fill in the blank with the correct form of "būti":',
            audioText: 'Aš esu studentas',
            sentenceWithBlank: 'Aš ___ studentas.',
            options: ['esu', 'esi', 'yra', 'esame'],
            correctAnswer: 'esu',
            explanation: 'The 1st person singular ("aš" = I) uses "esu": Aš esu (I am).'
          },
          {
            id: 'u1-l2-e2',
            type: 'match_pairs',
            prompt: 'Match each pronoun with its present tense conjugation of "būti":',
            audioText: 'Aš esu, tu esi, mes esame, jūs esate',
            pairs: [
              { id: 'p1', lithuanian: 'Aš', english: 'esu (I am)' },
              { id: 'p2', lithuanian: 'Tu', english: 'esi (You are - sing.)' },
              { id: 'p3', lithuanian: 'Jis / Ji', english: 'yra (He / She is)' },
              { id: 'p4', lithuanian: 'Mes', english: 'esame (We are)' }
            ],
            explanation: 'Notice how Lithuanian verbs change their endings systematically with personal pronouns.'
          },
          {
            id: 'u1-l2-e3',
            type: 'word_bank_order',
            prompt: 'Form the sentence: "You are very kind (polite/plural)"',
            audioText: 'Jūs esate labai malonus',
            words: ['esate', 'Jūs', 'labai', 'esu', 'malonus'],
            correctSequence: ['Jūs', 'esate', 'labai', 'malonus'],
            explanation: '"Jūs esate" is used for plural "you" or when addressing someone with polite respect.'
          },
          {
            id: 'u1-l2-e4',
            type: 'multiple_choice',
            prompt: 'Select the correct sentence for "She is a doctor":',
            audioText: 'Ji yra gydytoja',
            options: ['Ji yra gydytoja', 'Ji esu gydytoja', 'Ji esi gydytoja', 'Ji esame gydytoja'],
            correctAnswer: 'Ji yra gydytoja',
            explanation: '3rd person (jis/ji) takes "yra" for both singular and plural.'
          },
          {
            id: 'u1-l2-e5',
            type: 'dialogue_fill',
            prompt: 'Complete the introductions dialog:',
            audioText: 'Ar tu esi studentas? Taip, aš esu studentas.',
            dialogue: [
              { speaker: 'Mantas', text: 'Labas! Ar tu ___ mokytojas?' },
              { speaker: 'Rūta', text: 'Ne, aš esu studentė!' }
            ],
            options: ['esi', 'esu', 'yra', 'esate'],
            correctAnswer: 'esi',
            explanation: 'With "tu" (informal you), the correct verb form is always "esi".'
          }
        ]
      },
      {
        id: 'lesson-3',
        unitId: 'unit-1',
        title: 'Origins & Cities (Genitive with "iš")',
        description: 'Express where you come from using the preposition "iš" + Genitive case (Kilmininkas).',
        xpReward: 25,
        order: 3,
        exercises: [
          {
            id: 'u1-l3-e1',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct form to say "I am from Vilnius":',
            audioText: 'Aš esu iš Vilniaus',
            sentenceWithBlank: 'Aš esu iš ___.',
            options: ['Vilniaus', 'Vilnius', 'Vilniuje', 'Vilnių'],
            correctAnswer: 'Vilniaus',
            explanation: 'The preposition "iš" (from) always requires the Genitive case: Vilnius -> Vilniaus.'
          },
          {
            id: 'u1-l3-e2',
            type: 'word_bank_order',
            prompt: 'Construct the sentence: "I am from Kaunas"',
            audioText: 'Aš esu iš Kauno',
            words: ['esu', 'iš', 'Aš', 'Kauno', 'Kaunas', 'Vilniaus'],
            correctSequence: ['Aš', 'esu', 'iš', 'Kauno'],
            explanation: 'Kaunas ends in "-as", which in the Genitive case becomes "-o": Kaunas -> Kauno.'
          },
          {
            id: 'u1-l3-e3',
            type: 'match_pairs',
            prompt: 'Match country/city names with their "iš" (from) forms:',
            audioText: 'Iš Lietuvos, iš Kauno, iš Klaipėdos',
            pairs: [
              { id: 'p1', lithuanian: 'Lietuva (Lithuania)', english: 'iš Lietuvos' },
              { id: 'p2', lithuanian: 'Kaunas', english: 'iš Kauno' },
              { id: 'p3', lithuanian: 'Klaipėda', english: 'iš Klaipėdos' },
              { id: 'p4', lithuanian: 'Vilnius', english: 'iš Vilniaus' }
            ],
            explanation: 'Feminine names in "-a" take "-os" (Lietuva -> Lietuvos, Klaipėda -> Klaipėdos).'
          },
          {
            id: 'u1-l3-e4',
            type: 'multiple_choice',
            prompt: 'How do you ask someone "Where are you from?" in Lithuanian?',
            audioText: 'Iš kur tu esi?',
            options: ['Iš kur tu esi?', 'Kur tu gyveni?', 'Kas tu esi?', 'Kaip sekasi?'],
            correctAnswer: 'Iš kur tu esi?',
            explanation: '"Iš kur" means "From where", making "Iš kur tu esi?" the direct question.'
          },
          {
            id: 'u1-l3-e5',
            type: 'dialogue_fill',
            prompt: 'Complete the conversational origin exchange:',
            audioText: 'Iš kur tu esi? Aš esu iš Kauno.',
            dialogue: [
              { speaker: 'Tomas', text: 'Labas! Iš kur tu esi?' },
              { speaker: 'Gabrielė', text: 'Labas, Tomai! Aš esu iš ___.' }
            ],
            options: ['Lietuvos', 'Lietuva', 'Lietuvoje', 'Lietuvą'],
            correctAnswer: 'Lietuvos',
            explanation: 'After "iš", the country "Lietuva" declines into the Genitive case "Lietuvos".'
          }
        ]
      },
      {
        id: 'lesson-4',
        unitId: 'unit-1',
        title: 'Addressing People (Šauksmininkas)',
        description: 'Call out names properly using the Lithuanian Vocative case (Šauksmininkas).',
        xpReward: 30,
        order: 4,
        exercises: [
          {
            id: 'u1-l4-e1',
            type: 'multiple_choice',
            prompt: 'How do you call a person named "Tomas" directly?',
            audioText: 'Tomai!',
            options: ['Tomai!', 'Tomas!', 'Tomo!', 'Tomui!'],
            correctAnswer: 'Tomai!',
            explanation: 'Masculine names ending in "-as" change to "-ai!" in the Vocative case (Tomas -> Tomai!).'
          },
          {
            id: 'u1-l4-e2',
            type: 'fill_in_the_blank',
            prompt: 'Address Jonas politely:',
            audioText: 'Labas rytas, Jonai!',
            sentenceWithBlank: 'Labas rytas, ___!',
            options: ['Jonai', 'Jonas', 'Jono', 'Jonui'],
            correctAnswer: 'Jonai',
            explanation: 'Just like Tomas, "Jonas" becomes "Jonai!" when calling or addressing him.'
          },
          {
            id: 'u1-l4-e3',
            type: 'match_pairs',
            prompt: 'Match standard names with their Vocative (direct calling) forms:',
            audioText: 'Vardai ir šauksmininkas',
            pairs: [
              { id: 'p1', lithuanian: 'Lukas (-as)', english: 'Lukai!' },
              { id: 'p2', lithuanian: 'Rytis (-ys)', english: 'Ryti!' },
              { id: 'p3', lithuanian: 'Kęstutis (-is)', english: 'Kęstuti!' },
              { id: 'p4', lithuanian: 'Lina (-a)', english: 'Lina!' }
            ],
            explanation: 'Names in -as become -ai; names in -is/-ys lose the -s; feminine names in -a usually stay the same!'
          },
          {
            id: 'u1-l4-e4',
            type: 'word_bank_order',
            prompt: 'Assemble: "Hello, Tomas! How are you?"',
            audioText: 'Labas, Tomai! Kaip sekasi?',
            words: ['Tomai', 'sekasi', 'Labas', 'Kaip', 'Tomas'],
            correctSequence: ['Labas', 'Tomai', 'Kaip', 'sekasi'],
            explanation: '"Kaip sekasi?" means "How are you doing?" and "Tomai!" is the vocative address.'
          },
          {
            id: 'u1-l4-e5',
            type: 'dialogue_fill',
            prompt: 'Respond to a greeting with proper vocative address:',
            audioText: 'Sveika, Lina! Kaip sekasi?',
            dialogue: [
              { speaker: 'Dominykas', text: 'Labas, Lina! Kaip gyveni?' },
              { speaker: 'Lina', text: 'Ačiū, puikiai! O tu, ___?' }
            ],
            options: ['Dominykai', 'Dominykas', 'Dominyko', 'Dominyką'],
            correctAnswer: 'Dominykai',
            explanation: 'Lina addresses Dominykas using the vocative ending "-ai": Dominykai!'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-2',
    number: 2,
    title: 'Daily Life & Navigation',
    subtitle: 'Kavinėje ir Mieste',
    description: 'Order food and drinks (Accusative / Galininkas) and navigate locations (Locative / Vietininkas).',
    color: '#2563eb', // Royal Blue
    accentColor: '#3b82f6',
    lessons: [
      {
        id: 'lesson-5',
        unitId: 'unit-2',
        title: 'Ordering at a Café (Galininkas)',
        description: 'Order food and drinks using the Accusative case for direct objects.',
        xpReward: 30,
        order: 5,
        exercises: [
          {
            id: 'u2-l5-e1',
            type: 'fill_in_the_blank',
            prompt: 'Order coffee politely ("One coffee, please"):',
            audioText: 'Prašau vieną kavą',
            sentenceWithBlank: 'Prašau vieną ___.',
            options: ['kavą', 'kava', 'kavoje', 'kavos'],
            correctAnswer: 'kavą',
            explanation: '"Kava" (coffee) takes the nasal vowel ending "-ą" in the Accusative case (direct object): kavą.'
          },
          {
            id: 'u2-l5-e2',
            type: 'match_pairs',
            prompt: 'Match drinks with their ordering forms (Accusative case):',
            audioText: 'Kava, arbata, sultys, vanduo',
            pairs: [
              { id: 'p1', lithuanian: 'Kava', english: 'Prašau kavą (Coffee)' },
              { id: 'p2', lithuanian: 'Arbata', english: 'Prašau arbatą (Tea)' },
              { id: 'p3', lithuanian: 'Pienas', english: 'Prašau pieną (Milk)' },
              { id: 'p4', lithuanian: 'Sumuštinis', english: 'Prašau sumuštinį (Sandwich)' }
            ],
            explanation: 'Nouns ending in -a take -ą, while masculine nouns in -is take -į in the accusative case.'
          },
          {
            id: 'u2-l5-e3',
            type: 'word_bank_order',
            prompt: 'Assemble the phrase: "I would like tea with lemon, please"',
            audioText: 'Norėčiau arbatos su citrina, prašau',
            words: ['arbatos', 'Norėčiau', 'citrina', 'prašau', 'su', 'kavą'],
            correctSequence: ['Norėčiau', 'arbatos', 'su', 'citrina', 'prašau'],
            explanation: '"Norėčiau" (I would like) takes genitive "arbatos", followed by preposition "su" (with).'
          },
          {
            id: 'u2-l5-e4',
            type: 'multiple_choice',
            prompt: 'How do you ask for the bill in a café?',
            audioText: 'Sąskaitą, prašau',
            options: ['Sąskaitą, prašau', 'Kiek kainuoja kava?', 'Ar turite meniu?', 'Labas rytas'],
            correctAnswer: 'Sąskaitą, prašau',
            explanation: '"Sąskaita" (bill/check) in the accusative case is "Sąskaitą, prašau" (The check, please).'
          }
        ]
      },
      {
        id: 'lesson-6',
        unitId: 'unit-2',
        title: 'Where Is It? (Locative / Vietininkas)',
        description: 'Describe locations and where people live or are staying using the "-e / -yje" endings.',
        xpReward: 35,
        order: 6,
        exercises: [
          {
            id: 'u2-l6-e1',
            type: 'fill_in_the_blank',
            prompt: 'Say "I live in Vilnius":',
            audioText: 'Aš gyvenu Vilniuje',
            sentenceWithBlank: 'Aš gyvenu ___.',
            options: ['Vilniuje', 'Vilnius', 'Vilniaus', 'Vilnių'],
            correctAnswer: 'Vilniuje',
            explanation: 'Words ending in "-ius" decline to "-iuje" in the Locative case: Vilnius -> Vilniuje.'
          },
          {
            id: 'u2-l6-e2',
            type: 'match_pairs',
            prompt: 'Match location questions with answers:',
            audioText: 'Kur tu gyveni? Kur yra kavinė?',
            pairs: [
              { id: 'p1', lithuanian: 'Kaunas (in Kaunas)', english: 'Kaune' },
              { id: 'p2', lithuanian: 'Klaipėda (in Klaipėda)', english: 'Klaipėdoje' },
              { id: 'p3', lithuanian: 'Viešbutis (in the hotel)', english: 'Viešbutyje' },
              { id: 'p4', lithuanian: 'Kavinė (in the cafe)', english: 'Kavinėje' }
            ],
            explanation: 'Locative case answers "Kur?" (Where?). -as becomes -e, -a becomes -oje, -ė becomes -ėje.'
          },
          {
            id: 'u2-l6-e3',
            type: 'word_bank_order',
            prompt: 'Translate: "We are at the hotel right now"',
            audioText: 'Mes esame viešbutyje dabar',
            words: ['esame', 'viešbutyje', 'Mes', 'dabar', 'esu', 'Kaune'],
            correctSequence: ['Mes', 'esame', 'viešbutyje', 'dabar'],
            explanation: '"Mes esame" (we are) + "viešbutyje" (in the hotel) + "dabar" (now).'
          },
          {
            id: 'u2-l6-e4',
            type: 'dialogue_fill',
            prompt: 'Complete the directions exchange:',
            audioText: 'Kur yra kavinė? Kavinė yra centre.',
            dialogue: [
              { speaker: 'Turistas', text: 'Atsiprašau, kur yra kavinė?' },
              { speaker: 'Vilnietis', text: 'Kavinė yra senamiesčio ___.' }
            ],
            options: ['centre', 'centras', 'centro', 'centrą'],
            correctAnswer: 'centre',
            explanation: 'Centras -> centre in the Locative case (in the center).'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-3',

    number: 3,
    title: 'Numbers, Shopping & Café',
    subtitle: 'Skaičiai, Parduotuvė ir Kavinė',
    description: 'Count numbers 1–100, ask "Kiek kainuoja?", order pastries and coffee, and pay cash or card.',
    color: '#d97706',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'lesson-7',
        unitId: 'unit-3',
        title: 'Numbers & Prices',
        description: 'Learn numbers 1 to 20, tens up to 100, and asking how much things cost in Euros.',
        xpReward: 25,
        order: 1,
        exercises: [
          {
            id: 'u3-l7-e1',
            type: 'multiple_choice',
            prompt: 'How do you ask "How much does it cost?" in Lithuanian?',
            audioText: 'Kiek tai kainuoja?',
            options: ['Kiek tai kainuoja?', 'Kur tai yra?', 'Kas čia yra?', 'Kada atsidaro?'],
            correctAnswer: 'Kiek tai kainuoja?',
            explanation: '"Kiek" means how much/many, and "kainuoja" is 3rd person of verb kainuoti (to cost).'
          },
          {
            id: 'u3-l7-e2',
            type: 'audio_dictation',
            prompt: 'Listen and write/tap the phrase you hear:',
            targetSentence: 'Tai kainuoja penkis eurus',
            audioText: 'Tai kainuoja penkis eurus',
            words: ['kainuoja', 'Tai', 'penkis', 'eurus', 'dešimt', 'yra'],
            correctSequence: ['Tai', 'kainuoja', 'penkis', 'eurus'],
            translationHint: 'It costs five euros (accusative plural: penkis eurus)'
          },
          {
            id: 'u3-l7-e3',
            type: 'speaking_pronounce',
            prompt: 'Pronounce the phrase aloud clearly:',
            targetPhrase: 'Kiek kainuoja kava?',
            phoneticHint: 'Kyehk kai-nuo-ya kah-vah',
            translation: 'How much does coffee cost?',
            acceptableVariations: ['kiek kainuoja kava', 'kiek kainoja kava']
          },
          {
            id: 'u3-l7-e4',
            type: 'match_pairs',
            prompt: 'Match numbers with their Lithuanian words:',
            audioText: 'Vienas, du, trys, keturi, penki',
            pairs: [
              { id: 'num-1', lithuanian: 'Vienas', english: 'One (1)' },
              { id: 'num-2', lithuanian: 'Du', english: 'Two (2)' },
              { id: 'num-5', lithuanian: 'Penki', english: 'Five (5)' },
              { id: 'num-10', lithuanian: 'Dešimt', english: 'Ten (10)' }
            ],
            explanation: 'Cardinal numbers in Lithuanian have gender agreement (vienas vyras / viena moteris, du / dvi).'
          },
          {
            id: 'u3-l7-e5',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the shopkeeper speaking:',
            audioDialogue: 'Kava kainuoja du eurus, o arbata – vieną eurą.',
            question: 'How much does tea cost according to the audio?',
            options: ['One euro (1€)', 'Two euros (2€)', 'Three euros (3€)', 'Free'],
            correctAnswer: 'One euro (1€)',
            explanation: '"arbata – vieną eurą" means tea is 1 euro.'
          }
        ]
      },
      {
        id: 'lesson-8',
        unitId: 'unit-3',
        title: 'At the Vilnius Café',
        description: 'Order espresso, traditional tea, curd cake (varškės pyragas), and ask for the bill.',
        xpReward: 25,
        order: 2,
        exercises: [
          {
            id: 'u3-l8-e1',
            type: 'dialogue_fill',
            prompt: 'Complete the barista dialogue:',
            audioText: 'Laba diena! Norėčiau kavos su pienu, prašom.',
            dialogue: [
              { speaker: 'Barista (Ona)', avatar: '👩‍💼', text: 'Laba diena! Ko norėtumėte?' },
              {
                speaker: 'You (Klientas)',
                avatar: '🙋‍♂️',
                text: '',
                isBlank: true,
                blankPrefix: 'Norėčiau ',
                blankSuffix: ', prašom.'
              }
            ],
            options: ['kavos su pienu', 'kava su pienas', 'kavai pienas', 'kavoje pieno'],
            correctAnswer: 'kavos su pienu',
            explanation: '"Norėčiau" requires Genitive: kava -> kavos! "Su" requires Instrumental: pienas -> pienu.'
          },
          {
            id: 'u3-l8-e2',
            type: 'audio_dictation',
            prompt: 'Listen to the customer asking for the bill:',
            targetSentence: 'Ar galiu gauti sąskaitą?',
            audioText: 'Ar galiu gauti sąskaitą?',
            words: ['Ar', 'galiu', 'gauti', 'sąskaitą', 'prašom', 'arbatą'],
            correctSequence: ['Ar', 'galiu', 'gauti', 'sąskaitą'],
            translationHint: 'May I get the bill? (sąskaita in Accusative: sąskaitą)'
          },
          {
            id: 'u3-l8-e3',
            type: 'speaking_pronounce',
            prompt: 'Politely say this order to the barista:',
            targetPhrase: 'Prašom vieną kavą ir pyragą',
            phoneticHint: 'Prah-shohm vyeh-nah kah-vah eer pee-rah-gah',
            translation: 'One coffee and cake, please',
            acceptableVariations: ['prašom vieną kavą ir pyragą', 'prasom viena kava ir pyraga']
          },
          {
            id: 'u3-l8-e4',
            type: 'multiple_choice',
            prompt: 'How do you say "Can I pay by card?" in Lithuanian?',
            audioText: 'Ar galima mokėti kortele?',
            options: [
              'Ar galima mokėti kortele?',
              'Ar turi kortelę?',
              'Kur yra bankomatas?',
              'Kiek kainuoja kortelė?'
            ],
            correctAnswer: 'Ar galima mokėti kortele?',
            explanation: '"Ar galima" = Is it possible?, "mokėti" = to pay, "kortele" = by card (Instrumental).'
          }
        ]
      },
      {
        id: 'lesson-9',
        unitId: 'unit-3',
        title: 'At the Farmers Market',
        description: 'Buy fresh apples, Lithuanian honey (medus), bread, and navigate the market counter.',
        xpReward: 25,
        order: 3,
        exercises: [
          {
            id: 'u3-l9-e1',
            type: 'match_pairs',
            prompt: 'Match grocery items with their Lithuanian words:',
            audioText: 'Duona, pienas, obuoliai, medus',
            pairs: [
              { id: 'g1', lithuanian: 'Duona', english: 'Bread (Rye bread)' },
              { id: 'g2', lithuanian: 'Obuoliai', english: 'Apples' },
              { id: 'g3', lithuanian: 'Medus', english: 'Honey' },
              { id: 'g4', lithuanian: 'Sūris', english: 'Cheese' }
            ],
            explanation: 'Black rye bread (juoda ruginė duona) and curd cheese (varškės sūris) are national staples.'
          },
          {
            id: 'u3-l9-e2',
            type: 'word_bank_order',
            prompt: 'Assemble: "Please give me one kilogram of apples"',
            audioText: 'Prašom vieną kilogramą obuolių',
            words: ['Prašom', 'kilogramą', 'vieną', 'obuolių', 'duoną', 'eina'],
            correctSequence: ['Prašom', 'vieną', 'kilogramą', 'obuolių'],
            explanation: 'Quantities take Genitive plural: "obuolių" (of apples).'
          },
          {
            id: 'u3-l9-e3',
            type: 'speaking_pronounce',
            prompt: 'Ask the vendor for fresh honey:',
            targetPhrase: 'Ar šis medus yra šviežias?',
            phoneticHint: 'Ahr shees meh-doos ee-rah shvyeh-zhyahs',
            translation: 'Is this honey fresh?',
            acceptableVariations: ['ar šis medus yra šviežias', 'ar sis medus yra sviezias']
          },
          {
            id: 'u3-l9-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the market merchant:',
            audioDialogue: 'Viskas kartu kainuoja septynis eurus.',
            question: 'How much is everything together?',
            options: ['Seven euros (7€)', 'Six euros (6€)', 'Eight euros (8€)', 'Ten euros (10€)'],
            correctAnswer: 'Seven euros (7€)',
            explanation: '"septynis eurus" = 7 euros.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-4',
    number: 4,
    title: 'Travel, City & Directions',
    subtitle: 'Kelionės, Vilnius ir Kryptys',
    description: 'Ask for directions in Vilnius, take trolleybuses, find Gediminas Castle, and check into hotels.',
    color: '#6366f1',
    accentColor: '#8b5cf6',
    lessons: [
      {
        id: 'lesson-10',
        unitId: 'unit-4',
        title: 'Directions in Vilnius',
        description: 'Ask where landmarks are, and understand straight (tiesiai), right (į dešinę), left (į kairę).',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u4-l10-e1',
            type: 'multiple_choice',
            prompt: 'How do you ask "Where is Gediminas Castle?" in Lithuanian?',
            audioText: 'Atsiprašau, kur yra Gedimino pilis?',
            options: [
              'Atsiprašau, kur yra Gedimino pilis?',
              'Kas yra Gedimino pilis?',
              'Kaip važiuoja pilis?',
              'Kur važiuoja Gediminas?'
            ],
            correctAnswer: 'Atsiprašau, kur yra Gedimino pilis?',
            explanation: 'Gediminas becomes "Gedimino" (Genitive possessive: castle of Gediminas).'
          },
          {
            id: 'u4-l10-e2',
            type: 'match_pairs',
            prompt: 'Match direction commands with English:',
            audioText: 'Tiesiai, į kairę, į dešinę, čia pat',
            pairs: [
              { id: 'dir-1', lithuanian: 'Tiesiai', english: 'Straight ahead' },
              { id: 'dir-2', lithuanian: 'Į kairę', english: 'To the left' },
              { id: 'dir-3', lithuanian: 'Į dešinę', english: 'To the right' },
              { id: 'dir-4', lithuanian: 'Netoli / Čia pat', english: 'Nearby / Right here' }
            ],
            explanation: 'Preposition "į" (into/to) takes the Accusative case: kairė -> kairę, dešinė -> dešinę.'
          },
          {
            id: 'u4-l10-e3',
            type: 'audio_dictation',
            prompt: 'Listen to the pedestrian give directions:',
            targetSentence: 'Eikite tiesiai ir po to į dešinę',
            audioText: 'Eikite tiesiai ir po to į dešinę',
            words: ['tiesiai', 'Eikite', 'ir', 'į', 'dešinę', 'po', 'to', 'kairę'],
            correctSequence: ['Eikite', 'tiesiai', 'ir', 'po', 'to', 'į', 'dešinę'],
            translationHint: 'Walk straight ahead and then to the right'
          },
          {
            id: 'u4-l10-e4',
            type: 'speaking_pronounce',
            prompt: 'Ask someone politely on the street:',
            targetPhrase: 'Atsiprašau, ar stotis yra toli?',
            phoneticHint: 'Ah-tsih-prah-show, ahr stoh-tees ee-rah toh-lee',
            translation: 'Excuse me, is the train/bus station far?',
            acceptableVariations: ['atsiprašau ar stotis yra toli', 'atsiprasau ar stotis yra toli']
          }
        ]
      },
      {
        id: 'lesson-11',
        unitId: 'unit-4',
        title: 'Public Transport & Tickets',
        description: 'Ride Vilnius buses, trolleybuses, buy tickets (bilietas), and locate the correct bus stop.',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u4-l11-e1',
            type: 'multiple_choice',
            prompt: 'What does "Stotelė" mean in Lithuanian?',
            audioText: 'Autobuso stotelė',
            options: ['Bus stop / Station stop', 'Ticket booth', 'Airport', 'Taxi driver'],
            correctAnswer: 'Bus stop / Station stop',
            explanation: '"Stotelė" is a stop (e.g. Autobusų stotelė). A major train/bus station is "stotis".'
          },
          {
            id: 'u4-l11-e2',
            type: 'dialogue_fill',
            prompt: 'Complete the bus ticket purchase dialogue:',
            audioText: 'Laba diena! Vieną vienkartinį bilietą, prašau.',
            dialogue: [
              { speaker: 'Keleivis (Passenger)', avatar: '🧑', text: 'Laba diena!' },
              {
                speaker: 'Keleivis (Passenger)',
                avatar: '🧑',
                text: '',
                isBlank: true,
                blankPrefix: 'Vieną ',
                blankSuffix: ', prašau.'
              },
              { speaker: 'Vairuotojas (Driver)', avatar: '🚌', text: 'Prašom, vienas euras.' }
            ],
            options: ['bilietą', 'bilietas', 'bilietui', 'biliete'],
            correctAnswer: 'bilietą',
            explanation: 'Accusative singular for masculine noun "bilietas" is "bilietą" (answers Ką?).'
          },
          {
            id: 'u4-l11-e3',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the automated transit announcement:',
            audioDialogue: 'Kitas sustojimas – Katedros aikštė.',
            question: 'What is the next stop announced on the speaker?',
            options: [
              'Cathedral Square (Katedros aikštė)',
              'Train Station (Geležinkelio stotis)',
              'Airport (Oro uostas)',
              'Old Town (Senamiestis)'
            ],
            correctAnswer: 'Cathedral Square (Katedros aikštė)',
            explanation: '"Kitas sustojimas" = Next stop, "Katedros aikštė" = Cathedral Square.'
          },
          {
            id: 'u4-l11-e4',
            type: 'speaking_pronounce',
            prompt: 'Say this to confirm the route:',
            targetPhrase: 'Ar šis autobusas važiuoja į centrą?',
            phoneticHint: 'Ahr shees ow-toh-boo-sahs vah-zhyuo-yah ee tsehn-trah',
            translation: 'Does this bus go to the city center?',
            acceptableVariations: [
              'ar šis autobusas važiuoja į centrą',
              'ar sis autobusas vaziuoja i centra'
            ]
          }
        ]
      },
      {
        id: 'lesson-12',
        unitId: 'unit-4',
        title: 'Hotel & Vilnius Old Town',
        description: 'Check in, ask for your key (raktas), WiFi password, and explore the cobblestone Senamiestis.',
        xpReward: 35,
        order: 3,
        exercises: [
          {
            id: 'u4-l12-e1',
            type: 'dialogue_fill',
            prompt: 'Check in at the hotel reception:',
            audioText: 'Laba diena! Turiu rezervaciją pavarde Kazlauskas.',
            dialogue: [
              { speaker: 'Administratorė', avatar: '🏨', text: 'Sveiki atvykę į Vilnių! Kuo galiu padėti?' },
              {
                speaker: 'Svečias (Guest)',
                avatar: '🧳',
                text: '',
                isBlank: true,
                blankPrefix: 'Laba diena! Turiu ',
                blankSuffix: '.'
              }
            ],
            options: ['rezervaciją', 'rezervacija', 'rezervacijoje', 'rezervacijos'],
            correctAnswer: 'rezervaciją',
            explanation: 'The verb "turėti" (to have) requires the Accusative case: rezervacija -> rezervaciją.'
          },
          {
            id: 'u4-l12-e2',
            type: 'audio_dictation',
            prompt: 'Listen to the receptionist give you the room keys:',
            targetSentence: 'Čia yra jūsų kambario raktas',
            audioText: 'Čia yra jūsų kambario raktas',
            words: ['yra', 'Čia', 'jūsų', 'kambario', 'raktas', 'bilietas', 'stalas'],
            correctSequence: ['Čia', 'yra', 'jūsų', 'kambario', 'raktas'],
            translationHint: 'Here is your room key (kambario raktas)'
          },
          {
            id: 'u4-l12-e3',
            type: 'speaking_pronounce',
            prompt: 'Ask for the wireless internet password:',
            targetPhrase: 'Koks yra belaidžio interneto slaptažodis?',
            phoneticHint: 'Kohks ee-rah beh-ly-jyo een-ter-neh-toh slahp-tah-zhoh-dees',
            translation: 'What is the Wi-Fi password?',
            acceptableVariations: [
              'koks yra belaidžio interneto slaptažodis',
              'koks yra belaPathio interneto slaptazodis',
              'koks yra belaidzio interneto slaptazodis'
            ]
          },
          {
            id: 'u4-l12-e4',
            type: 'match_pairs',
            prompt: 'Match hotel and city amenities:',
            audioText: 'Raktas, liftas, pusryčiai, senamiestis',
            pairs: [
              { id: 'h1', lithuanian: 'Raktas', english: 'Room key' },
              { id: 'h2', lithuanian: 'Pusryčiai', english: 'Breakfast' },
              { id: 'h3', lithuanian: 'Liftas', english: 'Elevator' },
              { id: 'h4', lithuanian: 'Senamiestis', english: 'Old Town (Vilnius)' }
            ],
            explanation: 'Vilnius Old Town (Senamiestis) is a UNESCO World Heritage site known for Baroque architecture.'
          }
        ]
      }
    ]
  }
];


export function getLessonById(lessonId: string): Lesson | undefined {
  for (const unit of UNITS) {
    const found = unit.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return undefined;
}

export function getAllLessons(): Lesson[] {
  return UNITS.flatMap(unit => unit.lessons);
}

export function getNextLessonId(currentLessonId: string): string | null {
  const all = getAllLessons();
  const idx = all.findIndex(l => l.id === currentLessonId);
  if (idx >= 0 && idx < all.length - 1) {
    return all[idx + 1].id;
  }
  return null;
}
