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
        subExplanation: 'Master essential everyday Lithuanian greetings, polite apologies, and farewells based on the time of day and etiquette.',
        detailedExplanation: '• "Labas rytas" (Good morning) is used until noon.\n• "Laba diena" (Good afternoon / Good day) is the standard polite daytime greeting.\n• "Labas vakaras" (Good evening) is used after dark.\n• When someone says "Atsiprašau!" (Sorry / Excuse me), respond politely with "Nieko tokio!" (It\'s okay!), "Nieko!", or "Prašom!".\n• "Nėra už ką" means "Don\'t mention it / You\'re welcome" (literally: "there is nothing for what [to thank]").\n• Farewells: "Iki pasimatymo!" (See you / Goodbye), "Viso gero!" (All the best), "Iki rytojaus!" (See you tomorrow).',
        xpReward: 20,
        order: 1,
        exercises: [
          {
            id: 'u1-l1-e1',
            type: 'multiple_choice',
            prompt: 'How do you politely respond when someone says "Atsiprašau!" (Excuse me / Sorry)?',
            subPrompt: 'English tip: Look for polite reassurances meaning "never mind" or "it\'s fine".',
            audioText: 'Atsiprašau! – Nieko tokio!',
            options: ['Nieko tokio! / Nieko!', 'Labas vakaras!', 'Viso gero!', 'Ačiū'],
            correctAnswer: 'Nieko tokio! / Nieko!',
            explanation: 'When someone apologizes with "Atsiprašau!" (Excuse me / Sorry), polite responses include "Nieko tokio!" (Never mind / It\'s okay!), "Nieko!" or "Prašom!".'
          },
          {
            id: 'u1-l1-e2',
            type: 'match_pairs',
            prompt: 'Match the Lithuanian greetings and farewells with their English meanings:',
            subPrompt: 'English tip: Match standard morning, farewell, and polite courtesy phrases.',
            audioText: 'Labas rytas, nėra už ką, iki pasimatymo, iki rytojaus',
            pairs: [
              { id: 'p1', lithuanian: 'Labas rytas!', english: 'Good morning!' },
              { id: 'p2', lithuanian: 'Nėra už ką.', english: 'Not at all / Don\'t mention it.' },
              { id: 'p3', lithuanian: 'Iki pasimatymo!', english: 'See you later / Goodbye!' },
              { id: 'p4', lithuanian: 'Iki rytojaus!', english: 'See you tomorrow!' }
            ],
            explanation: '"Labas rytas" = Good morning, "Nėra už ką" = Don\'t mention it (lit. nothing to thank for), "Iki pasimatymo" = Until we meet, "Iki rytojaus" = See you tomorrow.'
          },
          {
            id: 'u1-l1-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the farewell phrase in Lithuanian:',
            subPrompt: 'English meaning: "Goodbye and see you tomorrow"',
            targetSentence: 'Viso gero ir iki rytojaus',
            audioText: 'Viso gero ir iki rytojaus',
            words: ['gero', 'Viso', 'iki', 'ir', 'rytojaus', 'Labas'],
            correctSequence: ['Viso', 'gero', 'ir', 'iki', 'rytojaus'],
            translationHint: 'Goodbye and see you tomorrow',
            explanation: '"Viso gero" is a polite farewell meaning "All the best / Goodbye", and "iki rytojaus" means "until tomorrow" (from "rytojus" = tomorrow). Together: "Viso gero ir iki rytojaus" (Goodbye and see you tomorrow).'
          },
          {
            id: 'u1-l1-e4',
            type: 'speaking_pronounce',
            prompt: 'Pronounce this polite greeting aloud clearly:',
            subPrompt: 'English translation: "Good afternoon, thank you very much!"',
            targetPhrase: 'Laba diena, ačiū labai!',
            phoneticHint: 'Lah-bah dyeh-nah, ah-chyoo lah-by',
            translation: 'Good afternoon, thank you very much!',
            acceptableVariations: ['laba diena ačiū labai', 'laba diena aciu labai'],
            explanation: '"Laba diena" is the polite daytime greeting ("Good day / Good afternoon"), and "ačiū labai" means "thank you very much" ("labai" = very/greatly).'
          }
        ]
      },
      {
        id: 'lesson-2',
        unitId: 'unit-1',
        title: 'Introductions & Verb "būti" • Susipažinimas',
        description: 'Practice introducing yourself, asking names, and conjugating "būti / nebūti" (to be).',
        subExplanation: 'Learn to introduce yourself, ask someone\'s name formally or informally, and conjugate the core verb "būti" (to be) and its negative forms.',
        detailedExplanation: '• Present tense of "būti" (to be):\n  - Aš esu (I am) / Aš nesu (I am not)\n  - Tu esi (You are sg.) / Tu nesi (You are not)\n  - Jis / Ji yra (He/She is) / nėra (is not)\n  - Mes esame (We are) / Mes nesame (We are not)\n  - Jūs esate (You are pl./formal) / Jūs nesate (You are not)\n• Asking names: "Koks jūsų vardas?" (What is your first name? — "vardas" is masculine, so "koks") vs. "Kokia jūsų pavardė?" (What is your surname? — "pavardė" is feminine, so "kokia").\n• Responding politely: "Labai malonu" (Very nice to meet you) or "Man taip pat labai malonu" (Nice to meet you too).',
        xpReward: 25,
        order: 2,
        exercises: [
          {
            id: 'u1-l2-e1',
            type: 'dialogue_fill',
            prompt: 'Complete the introduction dialogue between Rasa and Jonas:',
            subPrompt: 'English tip: 1st person singular "Aš" (I) requires the matching form of "to be".',
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
            explanation: '1st person singular "Aš" (I) takes the present verb form "esu" (I am): "Aš esu Jonas" (I am Jonas).'
          },
          {
            id: 'u1-l2-e2',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct negative verb form for "I am not a lecturer":',
            subPrompt: 'English tip: In Lithuanian, negative verbs prefix "ne-" directly to the verb stem.',
            audioText: 'Ne, aš nesu dėstytojas. Aš esu studentas.',
            sentenceWithBlank: 'Ne, aš ___ dėstytojas. Aš esu studentas.',
            options: ['nesu', 'nesi', 'nėra', 'nesame'],
            correctAnswer: 'nesu',
            explanation: 'The negative form of "aš esu" (I am) is "aš nesu" (I am not): "Ne, aš nesu dėstytojas" (No, I am not a lecturer).'
          },
          {
            id: 'u1-l2-e3',
            type: 'word_bank_order',
            prompt: 'Assemble the formal question: "What is your surname?"',
            subPrompt: 'English tip: "Pavardė" is a feminine noun, requiring the feminine question word "Kokia".',
            audioText: 'Kokia jūsų pavardė?',
            words: ['pavardė', 'Kokia', 'jūsų', 'vardas', 'kas'],
            correctSequence: ['Kokia', 'jūsų', 'pavardė'],
            explanation: '"Pavardė" (surname) is feminine, so it uses "Kokia" ("Kokia jūsų pavardė?"). For masculine "vardas" (first name), you would use "Koks" ("Koks jūsų vardas?").'
          },
          {
            id: 'u1-l2-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the receptionist and student dialogue:',
            subPrompt: 'English tip: Listen for the combination of first name (vardas) and surname (pavardė).',
            audioDialogue: 'Administratorė: Kokia jūsų pavardė? Studentas: Mano pavardė Belovas. Koks jūsų vardas? Olegas.',
            question: 'What is the student\'s full name according to the audio?',
            options: ['Olegas Belovas', 'Petras Švažas', 'Andrius Belovas', 'Jonas Povilas'],
            correctAnswer: 'Olegas Belovas',
            explanation: 'The student states his surname as Belovas ("Mano pavardė Belovas") and his first name as Olegas ("Olegas"), making his full name Olegas Belovas.'
          },
          {
            id: 'u1-l2-e5',
            type: 'speaking_pronounce',
            prompt: 'Pronounce the polite response aloud:',
            subPrompt: 'English translation: "Nice to meet you too!"',
            targetPhrase: 'Man taip pat labai malonu!',
            phoneticHint: 'Mahn teyp paht lah-by mah-loh-nuo',
            translation: 'Nice to meet you too!',
            acceptableVariations: ['man taip pat labai malonu', 'man taip pat malonu'],
            explanation: '"Man taip pat labai malonu!" means "Nice to meet you too!" ("Man" = to me, "taip pat" = also/too, "labai malonu" = very pleasant).'
          }
        ]
      },
      {
        id: 'lesson-3',
        unitId: 'unit-1',
        title: 'Countries & Nationalities • Šalys ir tautybės',
        description: 'Learn countries and male/female demonyms (Lietuva, Anglija, Vokietija, Ukraina).',
        subExplanation: 'Explore countries and national demonyms, recognizing masculine (-as, -is) vs. feminine (-ė) endings and lowercase spelling conventions.',
        detailedExplanation: '• In Lithuanian, country names are capitalized (Lietuva, Vokietija, Prancūzija, Ispanija, Anglija, Ukraina).\n• Demonyms (nationalities) are written in LOWERCASE in Lithuanian (unlike English!):\n  - Masculine: typically ends in -as or -is (lietuvis, vokietis, prancūzas, ispanas, anglas, ukrainietis).\n  - Feminine: always ends in -ė (lietuvė, vokietė, prancūzė, ispanė, anglė, ukrainietė).\n• Origin with "iš" (from) triggers the Genitive case: "iš Lietuvos" (from Lithuania), "iš Ukrainos" (from Ukraine).',
        xpReward: 25,
        order: 3,
        exercises: [
          {
            id: 'u1-l3-e1',
            type: 'match_pairs',
            prompt: 'Match each country with its Lithuanian male demonym:',
            subPrompt: 'English tip: Note the endings -is and -as for male nationalities.',
            audioText: 'Lietuva, Vokietija, Anglija, Prancūzija',
            pairs: [
              { id: 'c1', lithuanian: 'Lietuva (Lithuania)', english: 'lietuvis (Lithuanian man)' },
              { id: 'c2', lithuanian: 'Vokietija (Germany)', english: 'vokietis (German man)' },
              { id: 'c3', lithuanian: 'Anglija (England)', english: 'anglas (Englishman)' },
              { id: 'c4', lithuanian: 'Prancūzija (France)', english: 'prancūzas (Frenchman)' }
            ],
            explanation: 'Male demonyms typically end in -as or -is (Lietuva -> lietuvis, Vokietija -> vokietis, Anglija -> anglas, Prancūzija -> prancūzas).'
          },
          {
            id: 'u1-l3-e2',
            type: 'fill_in_the_blank',
            prompt: 'Lina is from Lithuania. She is a...',
            subPrompt: 'English tip: Lina is female, requiring the feminine nationality ending -ė.',
            audioText: 'Lina yra lietuvė',
            sentenceWithBlank: 'Lina yra ___.',
            options: ['lietuvė', 'lietuvis', 'lietuva', 'lietuviškai'],
            correctAnswer: 'lietuvė',
            explanation: 'Female demonyms end in -ė (Lina yra lietuvė). The male counterpart is "lietuvis", while "Lietuva" is the country itself.'
          },
          {
            id: 'u1-l3-e3',
            type: 'multiple_choice',
            prompt: 'What is a male person from Spain (Ispanija) called in Lithuanian?',
            subPrompt: 'English tip: Spanish man demonym with masculine ending.',
            audioText: 'Ispanas',
            options: ['ispanas', 'ispanė', 'ispanija', 'ispaniškai'],
            correctAnswer: 'ispanas',
            explanation: 'Spain is "Ispanija". A male Spaniard is "ispanas", while a female Spaniard is "ispanė". Languages end in -iškai ("ispaniškai").'
          },
          {
            id: 'u1-l3-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence:',
            subPrompt: 'English translation: "Ana is a student from Ukraine"',
            targetSentence: 'Ana yra studentė iš Ukrainos',
            audioText: 'Ana yra studentė iš Ukrainos',
            words: ['Ana', 'studentė', 'yra', 'iš', 'Ukrainos', 'Lietuvos'],
            correctSequence: ['Ana', 'yra', 'studentė', 'iš', 'Ukrainos'],
            translationHint: 'Ana is a student from Ukraine (iš + Genitive: Ukrainos)',
            explanation: '"Ana yra studentė" (Ana is a female student) + "iš Ukrainos" (from Ukraine). The preposition "iš" (from) requires the Genitive case, changing "Ukraina" (-a) into "Ukrainos" (-os).'
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
        subExplanation: 'Learn to ask and answer "Kaip sekasi?" (How are you?), introduce a friend ("Čia mano draugas"), and use essential classroom requests.',
        detailedExplanation: '• Inquiring about wellbeing: "Kaip sekasi?" (How are things going? / How are you?):\n  - "Puikiai!" (Great! / Perfectly!)\n  - "Labai gerai" (Very good) / "Gerai" (Good)\n  - "Šiaip sau" (So-so / Okayish)\n  - "Blogai" (Badly)\n• Introducing someone: "Čia mano draugas Paulius" (This is my friend Paulius - masc.) / "Čia mano draugė Lina" (This is my friend Lina - fem.).\n• Polite requests: "Prašom pakartoti!" (Please repeat!), "Prašom kalbėti lėčiau!" (Please speak slower!), "Ar aišku?" (Is it clear?).',
        xpReward: 25,
        order: 1,
        exercises: [
          {
            id: 'u2-l4-e1',
            type: 'multiple_choice',
            prompt: 'What does "Šiaip sau" mean in response to "Kaip sekasi?" (How are you)?',
            subPrompt: 'English tip: It describes an average, neutral day (neither great nor awful).',
            audioText: 'Kaip sekasi? – Šiaip sau.',
            options: ['So-so (neither good nor bad)', 'Excellent / Great', 'Very bad', 'Good morning'],
            correctAnswer: 'So-so (neither good nor bad)',
            explanation: '"Šiaip sau" expresses a neutral, so-so feeling — neither particularly good nor bad.'
          },
          {
            id: 'u2-l4-e2',
            type: 'dialogue_fill',
            prompt: 'Complete the friend introduction dialogue:',
            subPrompt: 'English tip: Use the dictionary/subject (Nominative) case when stating a name.',
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
            explanation: 'When introducing yourself or stating who you are ("Aš..."), always use the Nominative case (Vardininkas): "Aš Edvardas".'
          },
          {
            id: 'u2-l4-e3',
            type: 'match_pairs',
            prompt: 'Match the classroom requests and expressions:',
            subPrompt: 'English tip: Essential survival phrases for asking a speaker to slow down or clarify.',
            audioText: 'Prašom pakartoti, prašom kalbėti lėčiau, ar aišku?',
            pairs: [
              { id: 'req1', lithuanian: 'Prašom pakartoti!', english: 'Please repeat!' },
              { id: 'req2', lithuanian: 'Prašom kalbėti lėčiau!', english: 'Please speak slower!' },
              { id: 'req3', lithuanian: 'Ar aišku?', english: 'Is it clear / understood?' },
              { id: 'req4', lithuanian: 'Taip, aišku.', english: 'Yes, it is clear.' }
            ],
            explanation: '"Prašom pakartoti!" = Please repeat!, "Prašom kalbėti lėčiau!" = Please speak slower!, "Ar aišku?" = Is it clear?, "Taip, aišku." = Yes, it is clear.'
          },
          {
            id: 'u2-l4-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the polite request:',
            subPrompt: 'English translation: "Please repeat and speak slower"',
            targetSentence: 'Prašom pakartoti ir kalbėti lėčiau',
            audioText: 'Prašom pakartoti ir kalbėti lėčiau',
            words: ['pakartoti', 'Prašom', 'ir', 'kalbėti', 'lėčiau', 'aišku'],
            correctSequence: ['Prašom', 'pakartoti', 'ir', 'kalbėti', 'lėčiau'],
            translationHint: 'Please repeat and speak slower',
            explanation: '"Prašom" (Please) + "pakartoti" (to repeat) + "ir" (and) + "kalbėti lėčiau" (to speak slower, from "lėtai" = slow). This is an essential request when practicing with native speakers.'
          }
        ]
      },
      {
        id: 'lesson-5',
        unitId: 'unit-2',
        title: 'Where are you from? • iš + Kilmininkas',
        description: 'Express your city and country of origin using the Genitive case after "iš" (from).',
        subExplanation: 'Express geographical origin using the preposition "iš" (from), which strictly requires the Genitive case (Kilmininkas).',
        detailedExplanation: '• The preposition "iš" (from) always demands the Genitive case (Kilmininkas - question "Ko? / Iš kur?"):\n  - Masculine nouns ending in -as -> -o (Kaunas -> iš Kauno, Monakas -> iš Monako)\n  - Masculine nouns ending in -ius -> -iaus (Vilnius -> iš Vilniaus)\n  - Masculine nouns ending in -ys / -is -> -io (Panevėžys -> iš Panevėžio)\n  - Feminine nouns ending in -a -> -os (Lietuva -> iš Lietuvos, Ryga -> iš Rygos)\n  - Feminine nouns ending in -ė -> -ės (Čilė -> iš Čilės, Klaipėda -> iš Klaipėdos)\n• Question: "Iš kur tu esi?" (Where are you from? informal) or "Iš kur jūs esate?" (formal/plural).',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u2-l5-e1',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct Genitive ending after "iš" for Vokietija (Germany):',
            subPrompt: 'English tip: Feminine country names in -a change to -os after "iš".',
            audioText: 'Aš esu iš Vokietijos, iš Hamburgo',
            sentenceWithBlank: 'Aš esu iš ___, iš Hamburgo.',
            options: ['Vokietijos', 'Vokietija', 'Vokietijoje', 'Vokietijai'],
            correctAnswer: 'Vokietijos',
            explanation: 'The preposition "iš" (from) always requires the Genitive case: "Vokietija" (-a) becomes "iš Vokietijos" (-os).'
          },
          {
            id: 'u2-l5-e2',
            type: 'multiple_choice',
            prompt: 'What is the correct form of "Vilnius" after "iš" (from Vilnius)?',
            subPrompt: 'English tip: Proper nouns in -ius take the -iaus ending in the Genitive.',
            audioText: 'Aš esu iš Vilniaus',
            options: ['iš Vilniaus', 'iš Vilniuje', 'iš Vilnių', 'iš Vilniui'],
            correctAnswer: 'iš Vilniaus',
            explanation: 'Masculine nouns ending in "-ius" change to "-iaus" in the Genitive case: "Vilnius" -> "iš Vilniaus".'
          },
          {
            id: 'u2-l5-e3',
            type: 'match_pairs',
            prompt: 'Match cities and countries to their Genitive forms after "iš":',
            subPrompt: 'English tip: Pay close attention to the vowel ending transformations (-as -> -o, -ė -> -ės, etc.).',
            audioText: 'Iš Monako, iš Čilės, iš Rygos, iš Panevėžio',
            pairs: [
              { id: 'g1', lithuanian: 'Monakas', english: 'iš Monako (-as -> -o)' },
              { id: 'g2', lithuanian: 'Čilė', english: 'iš Čilės (-ė -> -ės)' },
              { id: 'g3', lithuanian: 'Ryga', english: 'iš Rygos (-a -> -os)' },
              { id: 'g4', lithuanian: 'Panevėžys', english: 'iš Panevėžio (-ys -> -io)' }
            ],
            explanation: 'Genitive case ending rules after "iš": -as becomes -o (Monakas -> iš Monako), -ė becomes -ės (Čilė -> iš Čilės), -a becomes -os (Ryga -> iš Rygos), -ys becomes -io (Panevėžys -> iš Panevėžio).'
          },
          {
            id: 'u2-l5-e4',
            type: 'speaking_pronounce',
            prompt: 'Ask someone where they are from:',
            subPrompt: 'English translation: "Where are you from?" (formal or plural)',
            targetPhrase: 'Iš kur jūs esate?',
            phoneticHint: 'Eesh koor yoos eh-sah-teh',
            translation: 'Where are you from? (formal / plural)',
            acceptableVariations: ['iš kur jūs esate', 'is kur jus esate'],
            explanation: '"Iš kur" (From where) + "jūs esate" (are you formal/plural)? To answer, say "Aš esu iš..." followed by your country/city in the Genitive case (e.g. "iš Lietuvos").'
          }
        ]
      },
      {
        id: 'lesson-6',
        unitId: 'unit-2',
        title: 'Languages & Vocative Case • Kalbos ir Šauksmininkas',
        description: 'Conjugate "kalbėti" (to speak), language adverbs (-iškai), and address people (Tomai!, pone Jonai!).',
        subExplanation: 'Conjugate the verb "kalbėti" (to speak), form language adverbs in "-iškai", and address people respectfully or warmly using the Vocative case (Šauksmininkas).',
        detailedExplanation: '• Talking about languages: use the adverb ending in "-iškai" after "kalbėti" (to speak):\n  - lietuviškai (Lithuanian), angliškai (English), vokiškai (German), prancūziškai (French), ispaniškai (Spanish).\n  - Present tense of "kalbėti": aš kalbu, tu kalbi, jis/ji kalba, mes kalbame, jūs kalbate.\n• Vocative Case (Šauksmininkas) — used exclusively to call, address, or greet someone:\n  - Masculine -as -> -ai! (Tomas -> Tomai!, Jonas -> Jonai!)\n  - Masculine -us -> -au! (Paulius -> Pauliau!, Andrius -> Andriau!)\n  - Feminine -ė -> -e! (Eglė -> Egle!, Rasa -> Rasa!)\n  - Titles: "Ponas Jonas" -> "Pone Jonai!" (Mr. Jonas! / Sir!).',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u2-l6-e1',
            type: 'multiple_choice',
            prompt: 'How do you call/address a friend named Tomas in the Vocative case (Šauksmininkas)?',
            subPrompt: 'English tip: Masculine names ending in -as change to -ai when calling someone.',
            audioText: 'Tomai, ar tu kalbi lietuviškai?',
            options: ['Tomai!', 'Tomas!', 'Tomui!', 'Tome!'],
            correctAnswer: 'Tomai!',
            explanation: 'Masculine names ending in "-as" change to "-ai" in the Vocative case (Tomas -> Tomai!, Jonas -> Jonai!).'
          },
          {
            id: 'u2-l6-e2',
            type: 'fill_in_the_blank',
            prompt: 'Address Paulius directly: "Labas, ___!"',
            subPrompt: 'English tip: Masculine names ending in -us change to -au in the Vocative.',
            audioText: 'Labas, Pauliau!',
            sentenceWithBlank: 'Labas, ___!',
            options: ['Pauliau', 'Paulius', 'Pauliui', 'Paulie'],
            correctAnswer: 'Pauliau',
            explanation: 'Names ending in "-us" change to "-au" in the Vocative case: "Paulius" -> "Labas, Pauliau!" (Hello, Paulius!).'
          },
          {
            id: 'u2-l6-e3',
            type: 'match_pairs',
            prompt: 'Match names to their direct address (Vocative) forms:',
            subPrompt: 'English tip: Note the special polite form for "Ponas" (Mr./Sir).',
            audioText: 'Tomai, Pauliau, Egle, pone Jonai',
            pairs: [
              { id: 'v1', lithuanian: 'Tomas (-as)', english: 'Tomai!' },
              { id: 'v2', lithuanian: 'Paulius (-us)', english: 'Pauliau!' },
              { id: 'v3', lithuanian: 'Eglė (-ė)', english: 'Egle!' },
              { id: 'v4', lithuanian: 'Ponas Jonas (Mr. Jonas)', english: 'Pone Jonai!' }
            ],
            explanation: 'Vocative patterns: Tomas (-as) -> Tomai!, Paulius (-us) -> Pauliau!, Eglė (-ė) -> Egle!, Ponas Jonas -> Pone Jonai! ("Ponas" has the irregular vocative "pone").'
          },
          {
            id: 'u2-l6-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the question about languages:',
            subPrompt: 'English translation: "Do you speak Lithuanian and English?"',
            targetSentence: 'Ar tu kalbi lietuviškai ir angliškai',
            audioText: 'Ar tu kalbi lietuviškai ir angliškai',
            words: ['kalbi', 'Ar', 'tu', 'lietuviškai', 'angliškai', 'ir', 'vokiškai'],
            correctSequence: ['Ar', 'tu', 'kalbi', 'lietuviškai', 'ir', 'angliškai'],
            translationHint: 'Do you speak Lithuanian and English?',
            explanation: '"Ar" begins yes/no questions. "Tu kalbi" is the 2nd person singular present of "kalbėti". Languages in "-iškai" describe the manner of speaking: "lietuviškai" (Lithuanian) and "angliškai" (English).'
          },
          {
            id: 'u2-l6-e5',
            type: 'speaking_pronounce',
            prompt: 'Say this phrase aloud in Lithuanian:',
            subPrompt: 'English translation: "Yes, I speak a little bit of Lithuanian"',
            targetPhrase: 'Taip, aš truputį kalbu lietuviškai',
            phoneticHint: 'Teyp, ash troo-poo-tee kahl-boo lyeh-too-vish-key',
            translation: 'Yes, I speak a little bit of Lithuanian',
            acceptableVariations: ['taip aš truputį kalbu lietuviškai', 'taip as truputi kalbu lietuviskai'],
            explanation: '"Taip" (Yes) + "aš truputį kalbu" (I speak a little bit) + "lietuviškai" (Lithuanian). "Truputį" is a very useful adverb meaning "a little bit".'
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
        subExplanation: 'Master the Locative case (Vietininkas - answering "Kur?" / Where?) to say which city, neighborhood, or building you live or study in.',
        detailedExplanation: '• Locative case (Vietininkas - question "Kur?" / Where?):\n  - Feminine -a -> -oje (Lietuva -> Lietuvoje, Palanga -> Palangoje)\n  - Feminine -ė -> -ėje (aikštė -> aikštėje, kavinė -> kavinėje)\n  - Masculine -as -> -e (Kaunas -> Kaune, centras -> centre)\n  - Masculine -is / -ys -> -yje (bendrabutis -> bendrabutyje, kambarys -> kambaryje)\n  - Masculine -ius -> -iuje (Vilnius -> Vilniuje)\n  - Plural place names: -ai -> -uose (Trakai -> Trakuose, Šiauliai -> Šiauliuose)\n• Key verbs: "gyventi" (to live: aš gyvenu, tu gyveni...), "studijuoti" (to study: aš studijuoju...), "dirbti" (to work: aš dirbu...).',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u3-l7-e1',
            type: 'fill_in_the_blank',
            prompt: 'Say "I live in Vilnius" using the Locative case of Vilnius:',
            subPrompt: 'English tip: Nouns ending in -ius take the -iuje ending in the Locative.',
            audioText: 'Aš gyvenu Vilniuje',
            sentenceWithBlank: 'Aš gyvenu ___.',
            options: ['Vilniuje', 'Vilnius', 'Vilniaus', 'Vilnių'],
            correctAnswer: 'Vilniuje',
            explanation: 'Nouns ending in "-ius" change to "-iuje" in the Locative case (Kur? - Where?): "Vilnius" -> "Aš gyvenu Vilniuje" (I live in Vilnius).'
          },
          {
            id: 'u3-l7-e2',
            type: 'multiple_choice',
            prompt: 'What is the Locative form of "Kaunas" for "We live in Kaunas"?',
            subPrompt: 'English tip: Masculine city names ending in -as take -e in the Locative.',
            audioText: 'Mes gyvename Kaune',
            options: ['Kaune', 'Kaunas', 'Kauno', 'Kaunui'],
            correctAnswer: 'Kaune',
            explanation: 'Masculine nouns ending in "-as" change to "-e" in the Locative case: "Kaunas" -> "Mes gyvename Kaune" (We live in Kaunas).'
          },
          {
            id: 'u3-l7-e3',
            type: 'match_pairs',
            prompt: 'Match location nouns to their Locative forms:',
            subPrompt: 'English tip: Notice the vowel harmony in -oje, -ėje, -yje, and plural -uose.',
            audioText: 'Lietuvoje, Trakuose, bendrabutyje, aikštėje',
            pairs: [
              { id: 'loc1', lithuanian: 'Lietuva (-a)', english: 'Lietuvoje (-oje)' },
              { id: 'loc2', lithuanian: 'aikštė (-ė)', english: 'aikštėje (-ėje)' },
              { id: 'loc3', lithuanian: 'bendrabutis (-is)', english: 'bendrabutyje (-yje)' },
              { id: 'loc4', lithuanian: 'Trakai (plural)', english: 'Trakuose (-uose)' }
            ],
            explanation: 'Locative endings: -a -> -oje (Lietuvoje), -ė -> -ėje (aikštėje), -is -> -yje (bendrabutyje), plural -ai -> -uose (Trakuose).'
          },
          {
            id: 'u3-l7-e4',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence:',
            subPrompt: 'English translation: "I live and work in Vilnius, in the center"',
            targetSentence: 'Aš gyvenu ir dirbu Vilniuje centre',
            audioText: 'Aš gyvenu ir dirbu Vilniuje centre',
            words: ['Vilniuje', 'Aš', 'dirbu', 'ir', 'centre', 'gyvenu', 'Kaune'],
            correctSequence: ['Aš', 'gyvenu', 'ir', 'dirbu', 'Vilniuje', 'centre'],
            translationHint: 'I live and work in Vilnius, in the center',
            explanation: '"Aš gyvenu ir dirbu" (I live and work) + "Vilniuje" (in Vilnius, Locative of Vilnius) + "centre" (in the center, Locative of centras). Both locations take the Locative case.'
          },
          {
            id: 'u3-l7-e5',
            type: 'speaking_pronounce',
            prompt: 'Ask your partner where they live and study:',
            subPrompt: 'English translation: "Where do you live and study?"',
            targetPhrase: 'Kur tu gyveni ir studijuoji?',
            phoneticHint: 'Koor too gyee-veh-nee eer stoo-dee-yuo-yee',
            translation: 'Where do you live and study?',
            acceptableVariations: ['kur tu gyveni ir studijuoji'],
            explanation: '"Kur" (Where) + "tu gyveni" (you live, from gyventi) + "ir" (and) + "studijuoji" (you study, from studijuoti). Both 2nd person singular present verbs end in "-i".'
          }
        ]
      },
      {
        id: 'lesson-8',
        unitId: 'unit-3',
        title: 'City Buildings & "prie + Kilmininkas" • Miesto pastatai',
        description: 'Describe buildings near each other (prie banko, prie pašto, prie stoties).',
        subExplanation: 'Learn essential city building vocabulary and navigate spatial relationships using the preposition "prie" (near/by) + Genitive case.',
        detailedExplanation: '• Core city landmarks:\n  - bankas (bank), paštas (post office), teatras (theater), universitetas (university)\n  - kavinė (cafe), vaistinė (pharmacy), ligoninė (hospital), knygynas (bookstore), stotis (station)\n• Preposition "prie" (near / next to / by) always triggers the Genitive case (Kilmininkas):\n  - prie pašto (near the post office, paštas -> pašto)\n  - prie banko (near the bank, bankas -> banko)\n  - prie kavinės (near the cafe, kavinė -> kavinės)\n  - prie stoties (near the station, stotis -> stoties)\n• Adverbs of distance: "arti" (close / nearby) vs. "toli" (far away).',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u3-l8-e1',
            type: 'dialogue_fill',
            prompt: 'Complete the direction dialogue: "The bank is near the post office (paštas)":',
            subPrompt: 'English tip: "prie" triggers the Genitive case ending -o for masculine nouns in -as.',
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
            explanation: 'The preposition "prie" (near/by) strictly requires the Genitive case: "paštas" (-as) changes to "prie pašto" (-o).'
          },
          {
            id: 'u3-l8-e2',
            type: 'match_pairs',
            prompt: 'Match city buildings with their English translations:',
            subPrompt: 'English tip: Common urban landmarks and public institutions.',
            audioText: 'Vaistinė, knygynas, stotis, ligoninė',
            pairs: [
              { id: 'b1', lithuanian: 'Vaistinė', english: 'Pharmacy' },
              { id: 'b2', lithuanian: 'Ligoninė', english: 'Hospital' },
              { id: 'b3', lithuanian: 'Knygynas', english: 'Bookstore' },
              { id: 'b4', lithuanian: 'Stotis', english: 'Station (bus/train)' }
            ],
            explanation: '"Vaistinė" = Pharmacy, "Ligoninė" = Hospital, "Knygynas" = Bookstore, "Stotis" = Station (bus or train station).'
          },
          {
            id: 'u3-l8-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the sentence about the cafe:',
            subPrompt: 'English translation: "The cafe is near, next to the station"',
            targetSentence: 'Kavinė yra arti prie stoties',
            audioText: 'Kavinė yra arti prie stoties',
            words: ['Kavinė', 'arti', 'yra', 'prie', 'stoties', 'toli'],
            correctSequence: ['Kavinė', 'yra', 'arti', 'prie', 'stoties'],
            translationHint: 'The cafe is near, next to the station',
            explanation: '"Kavinė yra arti" (The cafe is near) + "prie stoties" (next to the station). "Stotis" is a feminine noun in "-is" that changes to "-ies" in the Genitive case after "prie".'
          },
          {
            id: 'u3-l8-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the resident\'s answer:',
            subPrompt: 'English tip: Listen for the distance adverb and landmark.',
            audioDialogue: 'Universitetas yra toli, prie didelio parko.',
            question: 'Where is the university according to the audio?',
            options: ['Far away, near the park', 'Close by, near the bank', 'In the center, near the post office', 'At the station'],
            correctAnswer: 'Far away, near the park',
            explanation: 'The resident says: "Universitetas yra toli, prie didelio parko" (The university is far away, near the big park). "Toli" = far, "prie parko" = near the park.'
          }
        ]
      },
      {
        id: 'lesson-9',
        unitId: 'unit-3',
        title: 'Address, Phone & Numbers (0–300) • Adresas ir skaičiai',
        description: 'Read addresses (Parko g. 4-10), give phone numbers, and master numbers up to 300.',
        subExplanation: 'Count confidently up to 300, ask for contact information, and understand how street and apartment numbers are spoken aloud in Lithuania.',
        detailedExplanation: '• Lithuanian numbers:\n  - 0–9: nulis, vienas, du, trys, keturi, penki, šeši, septyni, aštuoni, devyni\n  - 10–90: dešimt, dvidešimt, trisdešimt, keturiasdešimt, penkiasdešimt...\n  - Hundreds: 100 = šimtas, 200 = du šimtai, 300 = trys šimtai\n• Address format:\n  - Street name + "gatvė" (e.g. Parko gatvė, Gedimino prospektas).\n  - A hyphenated house-apartment number like "4-10" is spoken as two distinct numbers: "keturi, dešimt" (house 4, apartment 10).\n• Asking for contacts:\n  - "Koks tavo adresas?" (What is your address?)\n  - "Koks yra jūsų telefono numeris?" (What is your telephone number?).',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u3-l9-e1',
            type: 'multiple_choice',
            prompt: 'How is an address number like "Parko gatvė 4-10" spoken aloud in Lithuanian?',
            subPrompt: 'English tip: In Lithuanian addresses, the house number and apartment number are spoken separately.',
            audioText: 'Parko gatvė keturi, dešimt',
            options: [
              'Parko gatvė keturi, dešimt',
              'Parko gatvė keturiolika',
              'Parko gatvė keturiasdešimt',
              'Parko gatvė nulis, keturi'
            ],
            correctAnswer: 'Parko gatvė keturi, dešimt',
            explanation: 'In Lithuanian addresses, the hyphen between building and apartment is read as two separate numbers: building number, then apartment number ("keturi, dešimt").'
          },
          {
            id: 'u3-l9-e2',
            type: 'match_pairs',
            prompt: 'Match numbers with their Lithuanian words:',
            subPrompt: 'English tip: Tens end in -dešimt and hundreds use šimtas / šimtai.',
            audioText: 'Dešimt, dvidešimt, šimtas, du šimtai',
            pairs: [
              { id: 'num1', lithuanian: '10', english: 'Dešimt' },
              { id: 'num2', lithuanian: '20', english: 'Dvidešimt' },
              { id: 'num3', lithuanian: '100', english: 'Šimtas' },
              { id: 'num4', lithuanian: '200', english: 'Du šimtai' }
            ],
            explanation: '10 = Dešimt, 20 = Dvidešimt, 100 = Šimtas, 200 = Du šimtai. 300 is "trys šimtai".'
          },
          {
            id: 'u3-l9-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the address sentence:',
            subPrompt: 'English translation: "My address is Gediminas Avenue 10"',
            targetSentence: 'Mano adresas yra Gedimino prospektas dešimt',
            audioText: 'Mano adresas yra Gedimino prospektas dešimt',
            words: ['adresas', 'Mano', 'yra', 'Gedimino', 'prospektas', 'dešimt', 'penki'],
            correctSequence: ['Mano', 'adresas', 'yra', 'Gedimino', 'prospektas', 'dešimt'],
            translationHint: 'My address is Gediminas Avenue 10',
            explanation: '"Mano adresas yra" (My address is) + "Gedimino prospektas" (Gediminas Avenue, named after Grand Duke Gediminas) + "dešimt" (ten). Together: "Mano adresas yra Gedimino prospektas dešimt".'
          },
          {
            id: 'u3-l9-e4',
            type: 'speaking_pronounce',
            prompt: 'Ask politely for someone\'s phone number:',
            subPrompt: 'English translation: "What is your telephone number?" (polite / formal)',
            targetPhrase: 'Koks yra jūsų telefono numeris?',
            phoneticHint: 'Kohks ee-rah yoo-soo teh-leh-foh-noh noo-meh-rees',
            translation: 'What is your telephone number?',
            acceptableVariations: ['koks yra jūsų telefono numeris', 'koks yra jusu telefono numeris'],
            explanation: '"Koks yra jūsų telefono numeris?" means "What is your phone number?". "Numeris" is masculine, so it takes the masculine question word "koks" (not "kokia").'
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
        subExplanation: 'Learn the days of the week and express "When?" (Kada?) using the Accusative case (pirmadienį, penktadienį, savaitgalį).',
        detailedExplanation: '• Days of the week in Lithuanian are named after ordinal numbers + "diena" (day):\n  - Pirmadienis (Monday - 1st day)\n  - Antradienis (Tuesday - 2nd day)\n  - Trečiadienis (Wednesday - 3rd day)\n  - Ketvirtadienis (Thursday - 4th day)\n  - Penktadienis (Friday - 5th day)\n  - Šeštadienis (Saturday - 6th day)\n  - Sekmadienis (Sunday - 7th day, from sekti = to follow)\n  - Savaitgalis (Weekend)\n• Expressing "ON what day?" (answering "Kada?" / When?):\n  - Use the Accusative singular ending: nouns in "-is" take "-į":\n  - pirmadienį (on Monday), penktadienį (on Friday), savaitgalį (on the weekend).\n• Common phrases: "Kada susitinkame?" (When do we meet?), "Gero savaitgalio!" (Have a good weekend! - Genitive of wish).',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u4-l10-e1',
            type: 'multiple_choice',
            prompt: 'Which form answers "Kada susitinkame?" (When do we meet?) for Friday (penktadienis)?',
            subPrompt: 'English tip: Answering "When?" (Kada?) requires the Accusative case ending -į.',
            audioText: 'Susitinkame penktadienį',
            options: ['penktadienį', 'penktadienis', 'penktadienio', 'penktadieniui'],
            correctAnswer: 'penktadienį',
            explanation: 'When answering "When?" (Kada?), days of the week take the Accusative case with the ending "-į": "penktadienis" -> "penktadienį" (on Friday).'
          },
          {
            id: 'u4-l10-e2',
            type: 'match_pairs',
            prompt: 'Match days of the week with their English meanings:',
            subPrompt: 'English tip: Day names are formed from numbers (pirmas = 1st, trečias = 3rd, penktas = 5th).',
            audioText: 'Pirmadienis, trečiadienis, penktadienis, sekmadienis',
            pairs: [
              { id: 'd1', lithuanian: 'Pirmadienis', english: 'Monday (1st day)' },
              { id: 'd2', lithuanian: 'Trečiadienis', english: 'Wednesday (3rd day)' },
              { id: 'd3', lithuanian: 'Penktadienis', english: 'Friday (5th day)' },
              { id: 'd4', lithuanian: 'Sekmadienis', english: 'Sunday (7th day)' }
            ],
            explanation: 'Pirmadienis = Monday (1st day), Trečiadienis = Wednesday (3rd day), Penktadienis = Friday (5th day), Sekmadienis = Sunday (7th day).'
          },
          {
            id: 'u4-l10-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the weekend farewell:',
            subPrompt: 'English translation: "Have a good weekend and see you Monday!"',
            targetSentence: 'Gero savaitgalio ir iki pirmadienio',
            audioText: 'Gero savaitgalio ir iki pirmadienio',
            words: ['savaitgalio', 'Gero', 'iki', 'ir', 'pirmadienio', 'rytojaus'],
            correctSequence: ['Gero', 'savaitgalio', 'ir', 'iki', 'pirmadienio'],
            translationHint: 'Have a good weekend and see you Monday!',
            explanation: '"Gero savaitgalio!" is a wishing expression taking the Genitive ("Have a good weekend!"), followed by "ir iki pirmadienio" (and see you Monday; "iki" also takes the Genitive).'
          },
          {
            id: 'u4-l10-e4',
            type: 'speaking_pronounce',
            prompt: 'Pronounce the meeting arrangement clearly:',
            subPrompt: 'English translation: "When do we meet? We meet tomorrow."',
            targetPhrase: 'Kada susitinkame? Susitinkame rytoj.',
            phoneticHint: 'Kah-dah soo-see-tihn-kah-meh? Soo-see-tihn-kah-meh ree-toy.',
            translation: 'When do we meet? We meet tomorrow.',
            acceptableVariations: ['kada susitinkame susitinkame rytoj'],
            explanation: '"Kada susitinkame?" (When do we meet?) + "Susitinkame rytoj" (We meet tomorrow). "Rytoj" is an adverb meaning "tomorrow".'
          }
        ]
      },
      {
        id: 'lesson-11',
        unitId: 'unit-4',
        title: 'Telling Time & Half-Hours • Valandos ir pusvalandžiai',
        description: 'Hours in the Accusative (šeštą valandą) and half-hours (pusė aštuntos = 7:30, pusė dešimtos = 9:30).',
        subExplanation: 'Master telling the exact hour in the Accusative ("šeštą valandą") and the unique Lithuanian system for half-hours ("pusė + upcoming hour in Genitive").',
        detailedExplanation: '• Exact time:\n  - Stating time: "Dabar yra šešta valanda" (It is 6 o\'clock now - Nominative).\n  - Answering "Kelintą valandą?" (At what time?):\n    Use the Accusative case: "penktą valandą" (at 5:00), "šeštą valandą" (at 6:00).\n• Half-Hours ("pusė") — CRITICAL RULE:\n  - Unlike English "half past seven", Lithuanian looks forward to the NEXT hour!\n  - "pusė aštuntos" = 7:30 (literally: half of the 8th hour).\n  - "pusė dešimtos" = 9:30 (half of the 10th hour).\n  - "pusė šeštos" = 5:30 (half of the 6th hour).\n• "Lygiai" means "exactly / sharp" (e.g. "lygiai šeštą valandą" = at exactly 6 o\'clock).',
        xpReward: 35,
        order: 2,
        exercises: [
          {
            id: 'u4-l11-e1',
            type: 'multiple_choice',
            prompt: 'What time is expressed by the Lithuanian phrase "pusę aštuntos"?',
            subPrompt: 'English tip: Lithuanian half-hours refer to half of the NEXT upcoming hour.',
            audioText: 'Susitinkame pusę aštuntos',
            options: ['7:30 (half to eight)', '8:30', '7:00', '8:00'],
            correctAnswer: '7:30 (half to eight)',
            explanation: 'In Lithuanian, half-hours use "pusė + upcoming ordinal hour in Genitive": "pusė aštuntos" literally means "half of the 8th hour", which corresponds to 7:30 in English!'
          },
          {
            id: 'u4-l11-e2',
            type: 'dialogue_fill',
            prompt: 'Answer the time question: "We meet at 6 o\'clock (šešta valanda)":',
            subPrompt: 'English tip: Answering "Kelintą valandą?" (At what time?) requires the Accusative -ą.',
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
            explanation: 'When answering "Kelintą valandą?" (At what hour?), the hour is in the Accusative case: "šešta" -> "šeštą valandą" (at 6 o\'clock).'
          },
          {
            id: 'u4-l11-e3',
            type: 'audio_dictation',
            prompt: 'Listen and assemble the meeting time:',
            subPrompt: 'English translation: "We meet in the cafe at 9:30 (half to ten)"',
            targetSentence: 'Susitinkame kavinėje pusę dešimtos',
            audioText: 'Susitinkame kavinėje pusę dešimtos',
            words: ['kavinėje', 'Susitinkame', 'pusę', 'dešimtos', 'penktą', 'stotyje'],
            correctSequence: ['Susitinkame', 'kavinėje', 'pusę', 'dešimtos'],
            translationHint: 'We meet in the cafe at 9:30 (half to ten)',
            explanation: '"Susitinkame kavinėje" (We meet in the cafe, Locative) + "pusę dešimtos" (at 9:30, half of the 10th hour). Remember that "pusė dešimtos" means 9:30!'
          },
          {
            id: 'u4-l11-e4',
            type: 'listening_multiple_choice',
            prompt: 'Listen to the meeting announcement:',
            subPrompt: 'English tip: Listen for the hour stated in the announcement.',
            audioDialogue: 'Atsiprašau, aš skubu. Mūsų susitikimas yra penktą valandą.',
            question: 'What time is the meeting according to the speaker?',
            options: ['At 5:00 (penktą valandą)', 'At 6:00 (šeštą valandą)', 'At 4:00 (ketvirtą valandą)', 'At 4:30 (pusę penkių)'],
            correctAnswer: 'At 5:00 (penktą valandą)',
            explanation: 'The speaker states: "Atsiprašau, aš skubu. Mūsų susitikimas yra penktą valandą" (Excuse me, I am in a hurry. Our meeting is at 5 o\'clock).'
          }
        ]
      },
      {
        id: 'lesson-12',
        unitId: 'unit-4',
        title: 'Where are we going? • į vs pas + Galininkas',
        description: 'Distinguish between "į" (going to places: į teatrą) vs "pas" (going to people: pas Paulių).',
        subExplanation: 'Distinguish between destinations: use "į" when going to places, cities, and buildings, and "pas" when visiting people, doctors, or friends (both with Accusative).',
        detailedExplanation: '• Both "į" and "pas" indicate movement towards a destination and require the Accusative case (Galininkas - question "Kur? / Į ką? / Pas ką?"):\n• Use "į + Accusative" for PLACES, BUILDINGS, CITIES, and EVENTS:\n  - į teatrą (to the theater), į kavinę (to the cafe), į universitetą (to the university), į Vilnių (to Vilnius).\n• Use "pas + Accusative" for PEOPLE, FRIENDS, SPECIALISTS, and HOMES:\n  - pas draugą (to a friend / to friend\'s place), pas Paulių (to Paulius\'s), pas gydytoją (to the doctor), pas mane (to my place / to me).\n• Idiomatic phrase: "eiti į svečius" (to go visiting / to go as a guest), "kviesti į svečius" (to invite someone over).',
        xpReward: 35,
        order: 3,
        exercises: [
          {
            id: 'u4-l12-e1',
            type: 'fill_in_the_blank',
            prompt: 'Choose the correct preposition for traveling to a place: "Šiandien mes einame ___ teatrą."',
            subPrompt: 'English tip: Use "į" for physical locations, venues, or buildings.',
            audioText: 'Šiandien mes einame į teatrą',
            sentenceWithBlank: 'Šiandien mes einame ___ teatrą.',
            options: ['į', 'pas', 'prie', 'iš'],
            correctAnswer: 'į',
            explanation: 'When traveling to a building, institution, or place, use "į + Accusative" (į teatrą, į kavinę, į universitetą).'
          },
          {
            id: 'u4-l12-e2',
            type: 'multiple_choice',
            prompt: 'Which sentence correctly expresses going to a person\'s home / visiting someone?',
            subPrompt: 'English tip: Visiting a person requires "pas", not "į".',
            audioText: 'Rytoj mes einame pas draugą Paulių',
            options: [
              'Rytoj mes einame pas Paulių.',
              'Rytoj mes einame į Paulių.',
              'Rytoj mes einame prie Pauliaus.',
              'Rytoj mes einame iš Pauliaus.'
            ],
            correctAnswer: 'Rytoj mes einame pas Paulių.',
            explanation: 'When visiting a person or specialist, use "pas + Accusative" ("Rytoj mes einame pas Paulių"). Saying "į Paulių" would incorrectly imply entering inside a person!'
          },
          {
            id: 'u4-l12-e3',
            type: 'dialogue_fill',
            prompt: 'Accept the invitation to visit: "I will definitely come!":',
            subPrompt: 'English tip: Future 1st person singular form of "ateiti" (to come).',
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
            explanation: '"Būtinai ateisiu!" means "I will definitely come!" ("būtinai" = definitely/certainly; "ateisiu" is the future 1st person singular of ateiti).'
          },
          {
            id: 'u4-l12-e4',
            type: 'match_pairs',
            prompt: 'Match prepositions "į" and "pas" with their usage:',
            subPrompt: 'English tip: Match the preposition to whether the destination is a place or a human.',
            audioText: 'Į kavinę, pas gydytoją, į Vilnių, pas Tomą',
            pairs: [
              { id: 'prep1', lithuanian: 'į (to a place)', english: 'į kavinę / į universitetą' },
              { id: 'prep2', lithuanian: 'pas (to a person)', english: 'pas draugą / pas Tomą' },
              { id: 'prep3', lithuanian: 'į (to a city)', english: 'į Vilnių / į Kauną' },
              { id: 'prep4', lithuanian: 'pas (to a specialist)', english: 'pas gydytoją / pas dėstytoją' }
            ],
            explanation: 'The golden rule: "į" is used for places and cities (į kavinę, į Vilnių), while "pas" is used for people and professionals (pas draugą, pas gydytoją). Both take the Accusative case.'
          },
          {
            id: 'u4-l12-e5',
            type: 'speaking_pronounce',
            prompt: 'Say this invitation aloud in Lithuanian:',
            subPrompt: 'English translation: "I invite you over this weekend!"',
            targetPhrase: 'Kviečiu į svečius šį savaitgalį!',
            phoneticHint: 'Kvyeh-chyoo ee sveh-chyoos shee sah-veyt-gah-lee',
            translation: 'I invite you over this weekend!',
            acceptableVariations: ['kviečiu į svečius šį savaitgalį', 'kvieciu i svecius si savaitgali'],
            explanation: '"Kviečiu" (I invite, from kviesti) + "į svečius" (over / as guests) + "šį savaitgalį" (this weekend, Accusative of time). "Kviesti į svečius" is the classic Lithuanian way to invite someone to your home.'
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
