import { Unit, Lesson } from '@/types/lesson';

export const UNITS: Unit[] = [
  // 1 SKYRIUS: KOKS JŪSŲ VARDAS?
  {
    id: 'unit-1',
    number: 1,
    title: '1 skyrius: Koks jūsų vardas?',
    subtitle: 'What is your name? • Pasisveikinimai ir susipažinimas',
    description: 'Master greetings, polite expressions, introductions, the verb "būti / nebūti" (to be), and countries with nationalities.',
    color: '#059669',
    accentColor: '#10b981',
    lessons: [
      {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Greetings & Polite Words • Pasisveikinimai',
        description: 'Learn everyday greetings, apologies, and polite responses in Lithuanian.',
        xpReward: 20,
        order: 1,
        exercises: [
          {
            id: 'u1-l1-e1',
            type: 'multiple_choice',
            prompt: 'How do you politely respond when someone says "Atsiprašau!" (Excuse me / Sorry)?',
            audioText: 'Atsiprašau! – Nieko tokio!',
            options: ['Nieko tokio! / Nieko!', 'Labas vakaras!', 'Viso gero!', 'Ačiū'],
            correctAnswer: 'Nieko tokio! / Nieko!',
            explanation: 'When someone apologizes with "Atsiprašau!", polite responses include "Nieko tokio!" (Never mind / It\'s okay!), "Nieko!" or "Prašom!".'
          },
          {
            id: 'u1-l1-e2',
            type: 'match_pairs',
            prompt: 'Match the Lithuanian greetings and farewells with their English meanings:',
            audioText: 'Labas rytas, nėra už ką, iki pasimatymo, iki rytojaus',
            pairs: [
              { id: 'p1', lithuanian: 'Labas rytas!', english: 'Good morning!' },
              { id: 'p2', lithuanian: 'Nėra už ką.', english: 'Not at all / Don\'t mention it.' },
              { id: 'p3', lithuanian: 'Iki pasimatymo!', english: 'See you later / Goodbye!' },
              { id: 'p4', lithuanian: 'Iki rytojaus!', english: 'See you tomorrow!' }
            ],
            explanation: '"Nėra už ką" literally means "there is nothing to thank for" (you\'re welcome / don\'t mention it).'
          },
          {
            id: 'u1-l1-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the farewell phrase in Lithuanian:',
            targetSentence: 'Viso gero ir iki rytojaus',
            audioText: 'Viso gero ir iki rytojaus',
            words: ['gero', 'Viso', 'iki', 'ir', 'rytojaus', 'Labas'],
            correctSequence: ['Viso', 'gero', 'ir', 'iki', 'rytojaus'],
            translationHint: 'Goodbye and see you tomorrow'
          },
          {
            id: 'u1-l1-e4',
            type: 'speaking_pronounce',
            prompt: 'Pronounce this polite greeting aloud clearly:',
            targetPhrase: 'Laba diena, ačiū labai!',
            phoneticHint: 'Lah-bah dyeh-nah, ah-chyoo lah-by',
            translation: 'Good afternoon, thank you very much!',
            acceptableVariations: ['laba diena ačiū labai', 'laba diena aciu labai']
          }
        ]
      },
      {
        id: 'lesson-2',
        unitId: 'unit-1',
        title: 'Introductions & Verb "būti" • Susipažinimas',
        description: 'Practice introducing yourself, asking names, and conjugating "būti / nebūti" (to be).',
        xpReward: 25,
        order: 2,
        exercises: [
          {
            id: 'u1-l2-e1',
            type: 'dialogue_fill',
            prompt: 'Complete the introduction dialogue between Rasa and Jonas:',
            audioText: 'Labas rytas. Mano vardas yra Rasa. Labai malonu! Aš esu Jonas.',
            dialogue: [
              { speaker: 'Rasa', avatar: '👩', text: 'Labas rytas. Mano vardas yra Rasa. (Good morning. My name is Rasa.)' },
              {
                speaker: 'Jonas',
                avatar: '👨',
                text: '',
                isBlank: true,
                blankPrefix: 'Labai malonu! Aš ',
                blankSuffix: ' Jonas.'
              },
              { speaker: 'Rasa', avatar: '👩', text: 'Man taip pat labai malonu! (Nice to meet you too!)' }
            ],
            options: ['esu', 'esi', 'yra', 'esame'],
            correctAnswer: 'esu',
            explanation: '1st person singular "Aš" (I) takes the present verb form "esu" (I am): "Aš esu Jonas".'
          },
          {
            id: 'u1-l2-e2',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct negative verb form for "I am not a lecturer":',
            audioText: 'Ne, aš nesu dėstytojas. Aš esu studentas.',
            sentenceWithBlank: 'Ne, aš ___ dėstytojas. Aš esu studentas.',
            options: ['nesu', 'nesi', 'nėra', 'nesame'],
            correctAnswer: 'nesu',
            explanation: 'The negative form of "aš esu" (I am) is "aš nesu" (I am not).'
          },
          {
            id: 'u1-l2-e3',
            type: 'word_bank_order',
            prompt: 'Assemble the formal question: "What is your surname?"',
            audioText: 'Kokia jūsų pavardė?',
            words: ['pavardė', 'Kokia', 'jūsų', 'vardas', 'kas'],
            correctSequence: ['Kokia', 'jūsų', 'pavardė'],
            explanation: '"Pavardė" (surname) is feminine, so it uses "Kokia" (Kokia jūsų pavardė?). "Vardas" (first name) is masculine (Koks jūsų vardas?).'
          },
          {
            id: 'u1-l2-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the receptionist and student dialogue:',
            audioDialogue: 'Administratorė: Kokia jūsų pavardė? Studentas: Mano pavardė Belovas. Koks jūsų vardas? Olegas.',
            question: 'What is the student\'s full name according to the audio?',
            options: ['Olegas Belovas', 'Petras Švažas', 'Andrius Belovas', 'Jonas Povilas'],
            correctAnswer: 'Olegas Belovas',
            explanation: 'The student states: "Mano pavardė Belovas" (surname) and "Olegas" (first name).'
          },
          {
            id: 'u1-l2-e5',
            type: 'speaking_pronounce',
            prompt: 'Pronounce the polite response aloud:',
            targetPhrase: 'Man taip pat labai malonu!',
            phoneticHint: 'Mahn teyp paht lah-by mah-loh-nuo',
            translation: 'Nice to meet you too!',
            acceptableVariations: ['man taip pat labai malonu', 'man taip pat malonu']
          }
        ]
      },
      {
        id: 'lesson-3',
        unitId: 'unit-1',
        title: 'Countries & Nationalities • Šalys ir tautybės',
        description: 'Learn countries and male/female demonyms (Lietuva, Anglija, Vokietija, Ukraina).',
        xpReward: 25,
        order: 3,
        exercises: [
          {
            id: 'u1-l3-e1',
            type: 'match_pairs',
            prompt: 'Match each country with its Lithuanian male demonym:',
            audioText: 'Lietuva, Vokietija, Anglija, Prancūzija',
            pairs: [
              { id: 'c1', lithuanian: 'Lietuva (Lithuania)', english: 'lietuvis (Lithuanian man)' },
              { id: 'c2', lithuanian: 'Vokietija (Germany)', english: 'vokietis (German man)' },
              { id: 'c3', lithuanian: 'Anglija (England)', english: 'anglas (Englishman)' },
              { id: 'c4', lithuanian: 'Prancūzija (France)', english: 'prancūzas (Frenchman)' }
            ],
            explanation: 'Male demonyms typically end in -as or -is (lietuvis, anglas, vokietis, prancūzas).'
          },
          {
            id: 'u1-l3-e2',
            type: 'fill_in_the_blank',
            prompt: 'Lina is from Lithuania. She is a...',
            audioText: 'Lina yra lietuvė',
            sentenceWithBlank: 'Lina yra ___.',
            options: ['lietuvė', 'lietuvis', 'lietuva', 'lietuviškai'],
            correctAnswer: 'lietuvė',
            explanation: 'Female demonyms end in -ė (lietuvė, anglė, vokietė, prancūzė).'
          },
          {
            id: 'u1-l3-e3',
            type: 'multiple_choice',
            prompt: 'What is a male person from Spain (Ispanija) called in Lithuanian?',
            audioText: 'Ispanas',
            options: ['ispanas', 'ispanė', 'ispanija', 'ispaniškai'],
            correctAnswer: 'ispanas',
            explanation: 'Ispanija -> ispanas (male), ispanė (female).'
          },
          {
            id: 'u1-l3-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence:',
            targetSentence: 'Ana yra studentė iš Ukrainos',
            audioText: 'Ana yra studentė iš Ukrainos',
            words: ['Ana', 'studentė', 'yra', 'iš', 'Ukrainos', 'Lietuvos'],
            correctSequence: ['Ana', 'yra', 'studentė', 'iš', 'Ukrainos'],
            translationHint: 'Ana is a student from Ukraine (iš + Genitive: Ukrainos)'
          }
        ]
      }
    ]
  },

  // 2 SKYRIUS: ČIA MANO DRAUGAS
  {
    id: 'unit-2',
    number: 2,
    title: '2 skyrius: Čia mano draugas',
    subtitle: 'Wellbeing, Origin, Languages & Vocative • Savijauta ir kilmė',
    description: 'Ask "Kaip sekasi?", express origin with "iš + Genitive", languages ending in "-iškai", and call friends with the Vocative case (Tomai!).',
    color: '#0284c7',
    accentColor: '#38bdf8',
    lessons: [
      {
        id: 'lesson-4',
        unitId: 'unit-2',
        title: 'How are you? & Introductions • Kaip sekasi?',
        description: 'Express wellbeing (gerai, puikiai, šiaip sau) and introduce friends (Čia mano draugas).',
        xpReward: 25,
        order: 1,
        exercises: [
          {
            id: 'u2-l4-e1',
            type: 'multiple_choice',
            prompt: 'What does "Šiaip sau" mean in response to "Kaip sekasi?" (How are you)?',
            audioText: 'Kaip sekasi? – Šiaip sau.',
            options: ['So-so (neither good nor bad)', 'Excellent / Great', 'Very bad', 'Good morning'],
            correctAnswer: 'So-so (neither good nor bad)',
            explanation: '"Šiaip sau" expresses a neutral, so-so feeling.'
          },
          {
            id: 'u2-l4-e2',
            type: 'dialogue_fill',
            prompt: 'Complete the friend introduction dialogue:',
            audioText: 'Čia mano draugas Paulius. Malonu, aš Edvardas.',
            dialogue: [
              { speaker: 'You (Tu)', avatar: '🙋‍♂️', text: 'Čia mano draugas Paulius. (This is my friend Paulius.)' },
              {
                speaker: 'Edvardas',
                avatar: '👨',
                text: '',
                isBlank: true,
                blankPrefix: 'Malonu. Aš ',
                blankSuffix: '.'
              }
            ],
            options: ['Edvardas', 'Edvardui', 'Edvardo', 'Edvarde'],
            correctAnswer: 'Edvardas',
            explanation: 'When introducing yourself, use the Nominative case (Vardininkas): "Aš Edvardas".'
          },
          {
            id: 'u2-l4-e3',
            type: 'match_pairs',
            prompt: 'Match the classroom requests and expressions:',
            audioText: 'Prašom pakartoti, prašom kalbėti lėčiau, ar aišku?',
            pairs: [
              { id: 'req1', lithuanian: 'Prašom pakartoti!', english: 'Please repeat!' },
              { id: 'req2', lithuanian: 'Prašom kalbėti lėčiau!', english: 'Please speak slower!' },
              { id: 'req3', lithuanian: 'Ar aišku?', english: 'Is it clear / understood?' },
              { id: 'req4', lithuanian: 'Taip, aišku.', english: 'Yes, it is clear.' }
            ],
            explanation: 'Essential survival phrases when learning to speak Lithuanian with native speakers.'
          },
          {
            id: 'u2-l4-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the polite request:',
            targetSentence: 'Prašom pakartoti ir kalbėti lėčiau',
            audioText: 'Prašom pakartoti ir kalbėti lėčiau',
            words: ['pakartoti', 'Prašom', 'ir', 'kalbėti', 'lėčiau', 'aišku'],
            correctSequence: ['Prašom', 'pakartoti', 'ir', 'kalbėti', 'lėčiau'],
            translationHint: 'Please repeat and speak slower'
          }
        ]
      },
      {
        id: 'lesson-5',
        unitId: 'unit-2',
        title: 'Where are you from? • iš + Kilmininkas',
        description: 'Express your city and country of origin using the Genitive case after "iš" (from).',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u2-l5-e1',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct Genitive ending after "iš" for Vokietija (Germany):',
            audioText: 'Aš esu iš Vokietijos, iš Hamburgo',
            sentenceWithBlank: 'Aš esu iš ___, iš Hamburgo.',
            options: ['Vokietijos', 'Vokietija', 'Vokietijoje', 'Vokietijai'],
            correctAnswer: 'Vokietijos',
            explanation: 'The preposition "iš" (from) always requires the Genitive case: Vokietija -> iš Vokietijos (-a -> -os).'
          },
          {
            id: 'u2-l5-e2',
            type: 'multiple_choice',
            prompt: 'What is the correct form of "Vilnius" after "iš" (from Vilnius)?',
            audioText: 'Aš esu iš Vilniaus',
            options: ['iš Vilniaus', 'iš Vilniuje', 'iš Vilnių', 'iš Vilniui'],
            correctAnswer: 'iš Vilniaus',
            explanation: 'Nouns ending in "-ius" change to "-iaus" in the Genitive case: Vilnius -> iš Vilniaus.'
          },
          {
            id: 'u2-l5-e3',
            type: 'match_pairs',
            prompt: 'Match cities and countries to their Genitive forms after "iš":',
            audioText: 'Iš Monako, iš Čilės, iš Rygos, iš Panevėžio',
            pairs: [
              { id: 'g1', lithuanian: 'Monakas', english: 'iš Monako (-as -> -o)' },
              { id: 'g2', lithuanian: 'Čilė', english: 'iš Čilės (-ė -> -ės)' },
              { id: 'g3', lithuanian: 'Ryga', english: 'iš Rygos (-a -> -os)' },
              { id: 'g4', lithuanian: 'Panevėžys', english: 'iš Panevėžio (-ys -> -io)' }
            ],
            explanation: 'Rules for Genitive: -as -> -o, -ė -> -ės, -a -> -os, -ys/-is -> -io.'
          },
          {
            id: 'u2-l5-e4',
            type: 'speaking_pronounce',
            prompt: 'Ask someone where they are from:',
            targetPhrase: 'Iš kur jūs esate?',
            phoneticHint: 'Eesh koor yoos eh-sah-teh',
            translation: 'Where are you from? (formal / plural)',
            acceptableVariations: ['iš kur jūs esate', 'is kur jus esate']
          }
        ]
      },
      {
        id: 'lesson-6',
        unitId: 'unit-2',
        title: 'Languages & Vocative Case • Kalbos ir Šauksmininkas',
        description: 'Conjugate "kalbėti" (to speak), language adverbs (-iškai), and address people (Tomai!, pone Jonai!).',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u2-l6-e1',
            type: 'multiple_choice',
            prompt: 'How do you call/address a friend named Tomas in the Vocative case (Šauksmininkas)?',
            audioText: 'Tomai, ar tu kalbi lietuviškai?',
            options: ['Tomai!', 'Tomas!', 'Tomui!', 'Tome!'],
            correctAnswer: 'Tomai!',
            explanation: 'Masculine names ending in "-as" change to "-ai" in the Vocative case (Tomas -> Tomai!).'
          },
          {
            id: 'u2-l6-e2',
            type: 'fill_in_the_blank',
            prompt: 'Address Paulius directly: "Labas, ___!"',
            audioText: 'Labas, Pauliau!',
            sentenceWithBlank: 'Labas, ___!',
            options: ['Pauliau', 'Paulius', 'Pauliui', 'Paulie'],
            correctAnswer: 'Pauliau',
            explanation: 'Names ending in "-us" change to "-au" in the Vocative: Paulius -> Pauliau!'
          },
          {
            id: 'u2-l6-e3',
            type: 'match_pairs',
            prompt: 'Match names to their direct address (Vocative) forms:',
            audioText: 'Tomai, Pauliau, Egle, pone Jonai',
            pairs: [
              { id: 'v1', lithuanian: 'Tomas (-as)', english: 'Tomai!' },
              { id: 'v2', lithuanian: 'Paulius (-us)', english: 'Pauliau!' },
              { id: 'v3', lithuanian: 'Eglė (-ė)', english: 'Egle!' },
              { id: 'v4', lithuanian: 'Ponas Jonas (Mr. Jonas)', english: 'Pone Jonai!' }
            ],
            explanation: '"Ponas" (Mr.) has the special vocative form "pone" (Laba diena, pone Jonai!).'
          },
          {
            id: 'u2-l6-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the question about languages:',
            targetSentence: 'Ar tu kalbi lietuviškai ir angliškai',
            audioText: 'Ar tu kalbi lietuviškai ir angliškai',
            words: ['kalbi', 'Ar', 'tu', 'lietuviškai', 'angliškai', 'ir', 'vokiškai'],
            correctSequence: ['Ar', 'tu', 'kalbi', 'lietuviškai', 'ir', 'angliškai'],
            translationHint: 'Do you speak Lithuanian and English?'
          },
          {
            id: 'u2-l6-e5',
            type: 'speaking_pronounce',
            prompt: 'Say this phrase aloud in Lithuanian:',
            targetPhrase: 'Taip, aš truputį kalbu lietuviškai',
            phoneticHint: 'Teyp, ash troo-poo-tee kahl-boo lyeh-too-vish-key',
            translation: 'Yes, I speak a little bit of Lithuanian',
            acceptableVariations: ['taip aš truputį kalbu lietuviškai', 'taip as truputi kalbu lietuviskai']
          }
        ]
      }
    ]
  },

  // 3 SKYRIUS: KOKS TAVO ADRESAS?
  {
    id: 'unit-3',
    number: 3,
    title: '3 skyrius: Koks tavo adresas?',
    subtitle: 'City, Living, Locative Case & Numbers • Miestas ir vietininkas',
    description: 'Say where you live in the Locative case (Vilniuje, Kaune), express places near each other with "prie + Genitive", and count 0–300.',
    color: '#d97706',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'lesson-7',
        unitId: 'unit-3',
        title: 'Where do you live? • Vienaskaitos Vietininkas',
        description: 'Locative case (Kur? - Where?): Vilniuje, Kaune, centre, bendrabutyje, Trakuose.',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u3-l7-e1',
            type: 'fill_in_the_blank',
            prompt: 'Say "I live in Vilnius" using the Locative case of Vilnius:',
            audioText: 'Aš gyvenu Vilniuje',
            sentenceWithBlank: 'Aš gyvenu ___.',
            options: ['Vilniuje', 'Vilnius', 'Vilniaus', 'Vilnių'],
            correctAnswer: 'Vilniuje',
            explanation: 'Nouns ending in "-ius" change to "-iuje" in the Locative case (Kur? - Where?): Vilnius -> Vilniuje.'
          },
          {
            id: 'u3-l7-e2',
            type: 'multiple_choice',
            prompt: 'What is the Locative form of "Kaunas" for "We live in Kaunas"?',
            audioText: 'Mes gyvename Kaune',
            options: ['Kaune', 'Kaunas', 'Kauno', 'Kaunui'],
            correctAnswer: 'Kaune',
            explanation: 'Nouns ending in "-as" change to "-e" in the Locative case: Kaunas -> Kaune.'
          },
          {
            id: 'u3-l7-e3',
            type: 'match_pairs',
            prompt: 'Match location nouns to their Locative forms:',
            audioText: 'Lietuvoje, Trakuose, bendrabutyje, aikštėje',
            pairs: [
              { id: 'loc1', lithuanian: 'Lietuva (-a)', english: 'Lietuvoje (-oje)' },
              { id: 'loc2', lithuanian: 'aikštė (-ė)', english: 'aikštėje (-ėje)' },
              { id: 'loc3', lithuanian: 'bendrabutis (-is)', english: 'bendrabutyje (-yje)' },
              { id: 'loc4', lithuanian: 'Trakai (plural)', english: 'Trakuose (-uose)' }
            ],
            explanation: 'Plural town names ending in "-ai" become "-uose" in the Locative: Trakai -> Trakuose.'
          },
          {
            id: 'u3-l7-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence:',
            targetSentence: 'Aš gyvenu ir dirbu Vilniuje centre',
            audioText: 'Aš gyvenu ir dirbu Vilniuje centre',
            words: ['Vilniuje', 'Aš', 'dirbu', 'ir', 'centre', 'gyvenu', 'Kaune'],
            correctSequence: ['Aš', 'gyvenu', 'ir', 'dirbu', 'Vilniuje', 'centre'],
            translationHint: 'I live and work in Vilnius, in the center'
          },
          {
            id: 'u3-l7-e5',
            type: 'speaking_pronounce',
            prompt: 'Ask your partner where they live and study:',
            targetPhrase: 'Kur tu gyveni ir studijuoji?',
            phoneticHint: 'Koor too gyee-veh-nee eer stoo-dee-yuo-yee',
            translation: 'Where do you live and study?',
            acceptableVariations: ['kur tu gyveni ir studijuoji']
          }
        ]
      },
      {
        id: 'lesson-8',
        unitId: 'unit-3',
        title: 'City Buildings & "prie + Kilmininkas" • Miesto pastatai',
        description: 'Describe buildings near each other (prie banko, prie pašto, prie stoties).',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u3-l8-e1',
            type: 'dialogue_fill',
            prompt: 'Complete the direction dialogue: "The bank is near the post office (paštas)":',
            audioText: 'Atsiprašau, kur yra bankas? Bankas yra prie pašto.',
            dialogue: [
              { speaker: 'Passerby', avatar: '🚶', text: 'Atsiprašau, kur yra bankas? (Excuse me, where is the bank?)' },
              {
                speaker: 'Local',
                avatar: '🙋',
                text: '',
                isBlank: true,
                blankPrefix: 'Bankas yra prie ',
                blankSuffix: '.'
              }
            ],
            options: ['pašto', 'paštas', 'pašte', 'paštui'],
            correctAnswer: 'pašto',
            explanation: 'The preposition "prie" (near) requires the Genitive case: paštas -> prie pašto.'
          },
          {
            id: 'u3-l8-e2',
            type: 'match_pairs',
            prompt: 'Match city buildings with their English translations:',
            audioText: 'Vaistinė, knygynas, stotis, ligoninė',
            pairs: [
              { id: 'b1', lithuanian: 'Vaistinė', english: 'Pharmacy' },
              { id: 'b2', lithuanian: 'Ligoninė', english: 'Hospital' },
              { id: 'b3', lithuanian: 'Knygynas', english: 'Bookstore' },
              { id: 'b4', lithuanian: 'Stotis', english: 'Station (bus/train)' }
            ],
            explanation: 'Core city vocabulary from Chapter 3.'
          },
          {
            id: 'u3-l8-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence about the cafe:',
            targetSentence: 'Kavinė yra arti prie stoties',
            audioText: 'Kavinė yra arti prie stoties',
            words: ['Kavinė', 'arti', 'yra', 'prie', 'stoties', 'toli'],
            correctSequence: ['Kavinė', 'yra', 'arti', 'prie', 'stoties'],
            translationHint: 'The cafe is near, next to the station'
          },
          {
            id: 'u3-l8-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the resident\'s answer:',
            audioDialogue: 'Universitetas yra toli, prie didelio parko.',
            question: 'Where is the university according to the audio?',
            options: ['Far away, near the park', 'Close by, near the bank', 'In the center, near the post office', 'At the station'],
            correctAnswer: 'Far away, near the park',
            explanation: 'The resident says: "Universitetas yra toli, prie didelio parko" (Far away, near the big park).'
          }
        ]
      },
      {
        id: 'lesson-9',
        unitId: 'unit-3',
        title: 'Address, Phone & Numbers (0–300) • Adresas ir skaičiai',
        description: 'Read addresses (Parko g. 4-10), give phone numbers, and master numbers up to 300.',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u3-l9-e1',
            type: 'multiple_choice',
            prompt: 'How is an address number like "Parko gatvė 4-10" spoken aloud in Lithuanian?',
            audioText: 'Parko gatvė keturi, dešimt',
            options: [
              'Parko gatvė keturi, dešimt',
              'Parko gatvė keturiolika',
              'Parko gatvė keturiasdešimt',
              'Parko gatvė nulis, keturi'
            ],
            correctAnswer: 'Parko gatvė keturi, dešimt',
            explanation: 'In Lithuanian addresses, the hyphen between building and apartment is read as two distinct numbers: building number, then apartment number (keturi, dešimt).'
          },
          {
            id: 'u3-l9-e2',
            type: 'match_pairs',
            prompt: 'Match numbers with their Lithuanian words:',
            audioText: 'Dešimt, dvidešimt, šimtas, du šimtai',
            pairs: [
              { id: 'num1', lithuanian: '10', english: 'Dešimt' },
              { id: 'num2', lithuanian: '20', english: 'Dvidešimt' },
              { id: 'num3', lithuanian: '100', english: 'Šimtas' },
              { id: 'num4', lithuanian: '200', english: 'Du šimtai' }
            ],
            explanation: 'Hundreds count: 100 – šimtas, 200 – du šimtai, 300 – trys šimtai.'
          },
          {
            id: 'u3-l9-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the address sentence:',
            targetSentence: 'Mano adresas yra Gedimino prospektas dešimt',
            audioText: 'Mano adresas yra Gedimino prospektas dešimt',
            words: ['adresas', 'Mano', 'yra', 'Gedimino', 'prospektas', 'dešimt', 'penki'],
            correctSequence: ['Mano', 'adresas', 'yra', 'Gedimino', 'prospektas', 'dešimt'],
            translationHint: 'My address is Gediminas Avenue 10'
          },
          {
            id: 'u3-l9-e4',
            type: 'speaking_pronounce',
            prompt: 'Ask politely for someone\'s phone number:',
            targetPhrase: 'Koks yra jūsų telefono numeris?',
            phoneticHint: 'Kohks ee-rah yoo-soo teh-leh-foh-noh noo-meh-rees',
            translation: 'What is your telephone number?',
            acceptableVariations: ['koks yra jūsų telefono numeris', 'koks yra jusu telefono numeris']
          }
        ]
      }
    ]
  },

  // 4 SKYRIUS: KADA IR KUR SUSITINKAME?
  {
    id: 'unit-4',
    number: 4,
    title: '4 skyrius: Kada ir kur susitinkame?',
    subtitle: 'Meetings, Time, Days of the Week & Directions • Laikas ir susitikimai',
    description: 'Set meetings using days in the Accusative case, express half-hours ("pusę aštuntos"), and choose between "į" (places) vs "pas" (people).',
    color: '#6366f1',
    accentColor: '#8b5cf6',
    lessons: [
      {
        id: 'lesson-10',
        unitId: 'unit-4',
        title: 'When do we meet? • Savaitės dienos ir laikas',
        description: 'Days of the week in the Accusative case (pirmadienį, penktadienį) and weekend wishes.',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u4-l10-e1',
            type: 'multiple_choice',
            prompt: 'Which form answers "Kada susitinkame?" (When do we meet?) for Friday (penktadienis)?',
            audioText: 'Susitinkame penktadienį',
            options: ['penktadienį', 'penktadienis', 'penktadienio', 'penktadieniui'],
            correctAnswer: 'penktadienį',
            explanation: 'When answering "When?" (Kada?), days of the week are put into the Accusative case with the ending -į (penktadienį = on Friday).'
          },
          {
            id: 'u4-l10-e2',
            type: 'match_pairs',
            prompt: 'Match days of the week with their English meanings:',
            audioText: 'Pirmadienis, trečiadienis, penktadienis, sekmadienis',
            pairs: [
              { id: 'd1', lithuanian: 'Pirmadienis', english: 'Monday (1st day)' },
              { id: 'd2', lithuanian: 'Trečiadienis', english: 'Wednesday (3rd day)' },
              { id: 'd3', lithuanian: 'Penktadienis', english: 'Friday (5th day)' },
              { id: 'd4', lithuanian: 'Sekmadienis', english: 'Sunday (7th day)' }
            ],
            explanation: 'Lithuanian day names are derived from ordinal numbers (pirmas -> pirmadienis, antras -> antradienis...).'
          },
          {
            id: 'u4-l10-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the weekend farewell:',
            targetSentence: 'Gero savaitgalio ir iki pirmadienio',
            audioText: 'Gero savaitgalio ir iki pirmadienio',
            words: ['savaitgalio', 'Gero', 'iki', 'ir', 'pirmadienio', 'rytojaus'],
            correctSequence: ['Gero', 'savaitgalio', 'ir', 'iki', 'pirmadienio'],
            translationHint: 'Have a good weekend and see you Monday!'
          },
          {
            id: 'u4-l10-e4',
            type: 'speaking_pronounce',
            prompt: 'Pronounce the meeting arrangement clearly:',
            targetPhrase: 'Kada susitinkame? Susitinkame rytoj.',
            phoneticHint: 'Kah-dah soo-see-tihn-kah-meh? Soo-see-tihn-kah-meh ree-toy.',
            translation: 'When do we meet? We meet tomorrow.',
            acceptableVariations: ['kada susitinkame susitinkame rytoj']
          }
        ]
      },
      {
        id: 'lesson-11',
        unitId: 'unit-4',
        title: 'Telling Time & Half-Hours • Valandos ir pusvalandžiai',
        description: 'Hours in the Accusative (šeštą valandą) and half-hours (pusė aštuntos = 7:30, pusė dešimtos = 9:30).',
        xpReward: 35,
        order: 2,
        exercises: [
          {
            id: 'u4-l11-e1',
            type: 'multiple_choice',
            prompt: 'What time is expressed by the Lithuanian phrase "pusę aštuntos"?',
            audioText: 'Susitinkame pusę aštuntos',
            options: ['7:30 (half to eight)', '8:30', '7:00', '8:00'],
            correctAnswer: '7:30 (half to eight)',
            explanation: 'In Lithuanian, half-hours use the structure "pusė + upcoming hour in Genitive": "pusė aštuntos" literally means "half of the 8th hour" = 7:30.'
          },
          {
            id: 'u4-l11-e2',
            type: 'dialogue_fill',
            prompt: 'Answer the time question: "We meet at 6 o\'clock (šešta valanda)":',
            audioText: 'Kelintą valandą susitinkame? Susitinkame šeštą valandą.',
            dialogue: [
              { speaker: 'Tomas', avatar: '🙋‍♂️', text: 'Kelintą valandą susitinkame? (At what time do we meet?)' },
              {
                speaker: 'Paulius',
                avatar: '🙋‍♂️',
                text: '',
                isBlank: true,
                blankPrefix: 'Susitinkame ',
                blankSuffix: ' valandą.'
              }
            ],
            options: ['šeštą', 'šešta', 'šeštas', 'šeši'],
            correctAnswer: 'šeštą',
            explanation: 'When answering "Kelintą valandą?" (At what hour?), the hour is in the Accusative: šeštą valandą.'
          },
          {
            id: 'u4-l11-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the meeting time:',
            targetSentence: 'Susitinkame kavinėje pusę dešimtos',
            audioText: 'Susitinkame kavinėje pusę dešimtos',
            words: ['kavinėje', 'Susitinkame', 'pusę', 'dešimtos', 'penktą', 'stotyje'],
            correctSequence: ['Susitinkame', 'kavinėje', 'pusę', 'dešimtos'],
            translationHint: 'We meet in the cafe at 9:30 (half to ten)'
          },
          {
            id: 'u4-l11-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the meeting announcement:',
            audioDialogue: 'Atsiprašau, aš skubu. Mūsų susitikimas yra penktą valandą.',
            question: 'What time is the meeting according to the speaker?',
            options: ['At 5:00 (penktą valandą)', 'At 6:00 (šeštą valandą)', 'At 4:00 (ketvirtą valandą)', 'At 4:30 (pusę penkių)'],
            correctAnswer: 'At 5:00 (penktą valandą)',
            explanation: 'The speaker states: "Mūsų susitikimas yra penktą valandą" (Our meeting is at 5 o\'clock).'
          }
        ]
      },
      {
        id: 'lesson-12',
        unitId: 'unit-4',
        title: 'Where are we going? • į vs pas + Galininkas',
        description: 'Distinguish between "į" (going to places: į teatrą) vs "pas" (going to people: pas Paulių).',
        xpReward: 35,
        order: 3,
        exercises: [
          {
            id: 'u4-l12-e1',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct preposition for traveling to a place: "Šiandien mes einame ___ teatrą."',
            audioText: 'Šiandien mes einame į teatrą',
            sentenceWithBlank: 'Šiandien mes einame ___ teatrą.',
            options: ['į', 'pas', 'prie', 'iš'],
            correctAnswer: 'į',
            explanation: 'When going to a building, institution, or place, use "į + Accusative" (į teatrą, į universitetą).'
          },
          {
            id: 'u4-l12-e2',
            type: 'multiple_choice',
            prompt: 'Which sentence correctly expresses going to a person\'s home / visiting someone?',
            audioText: 'Rytoj mes einame pas draugą Paulių',
            options: [
              'Rytoj mes einame pas Paulių.',
              'Rytoj mes einame į Paulių.',
              'Rytoj mes einame prie Pauliaus.',
              'Rytoj mes einame iš Pauliaus.'
            ],
            correctAnswer: 'Rytoj mes einame pas Paulių.',
            explanation: 'When visiting a person or specialist, use "pas + Accusative" (pas Paulių, pas gydytoją).'
          },
          {
            id: 'u4-l12-e3',
            type: 'dialogue_fill',
            prompt: 'Accept the invitation to visit: "I will definitely come!":',
            audioText: 'Kviečiu į svečius! Ačiū! Būtinai ateisiu!',
            dialogue: [
              { speaker: 'Friend', avatar: '🙋‍♂️', text: 'Kviečiu į svečius! (I invite you over!)' },
              {
                speaker: 'You (Tu)',
                avatar: '🙋',
                text: '',
                isBlank: true,
                blankPrefix: 'Ačiū! Būtinai ',
                blankSuffix: '!'
              }
            ],
            options: ['ateisiu', 'einu', 'buvau', 'kalbu'],
            correctAnswer: 'ateisiu',
            explanation: '"Būtinai ateisiu!" means "I will definitely come!" (future form of ateiti).'
          },
          {
            id: 'u4-l12-e4',
            type: 'match_pairs',
            prompt: 'Match prepositions "į" and "pas" with their usage:',
            audioText: 'Į kavinę, pas gydytoją, į Vilnių, pas Tomą',
            pairs: [
              { id: 'prep1', lithuanian: 'į (to a place)', english: 'į kavinę / į universitetą' },
              { id: 'prep2', lithuanian: 'pas (to a person)', english: 'pas draugą / pas Tomą' },
              { id: 'prep3', lithuanian: 'į (to a city)', english: 'į Vilnių / į Kauną' },
              { id: 'prep4', lithuanian: 'pas (to a specialist)', english: 'pas gydytoją / pas dėstytoją' }
            ],
            explanation: 'Golden rule of Chapter 4: "į" takes places, "pas" takes people (both followed by the Accusative case).'
          },
          {
            id: 'u4-l12-e5',
            type: 'speaking_pronounce',
            prompt: 'Say this invitation aloud in Lithuanian:',
            targetPhrase: 'Kviečiu į svečius šį savaitgalį!',
            phoneticHint: 'Kvyeh-chyoo ee sveh-chyoos shee sah-veyt-gah-lee',
            translation: 'I invite you over this weekend!',
            acceptableVariations: ['kviečiu į svečius šį savaitgalį', 'kvieciu i svecius si savaitgali']
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
