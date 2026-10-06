import { Unit, Lesson } from '@/types/lesson';

export const UNITS: Unit[] = [
  // 1 SKYRIUS: KOKS JŪSŲ VARDAS?
  {
    id: 'unit-1',
    number: 1,
    title: '1 skyrius: Koks jūsų vardas?',
    subtitle: 'Pasisveikinimai, susipažinimas ir šalys',
    description: 'Pasisveikinti, atsisveikinti, padėkoti ir atsiprašyti. Veiksmažodis būti / nebūti ir šalys su gyventojais.',
    color: '#059669',
    accentColor: '#10b981',
    lessons: [
      {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Pasisveikinimai ir mandagumo frazės',
        description: 'Labas rytas, Laba diena, Atsiprašau! – Nieko tokio!, Ačiū. – Prašom / Nėra už ką.',
        xpReward: 20,
        order: 1,
        exercises: [
          {
            id: 'u1-l1-e1',
            type: 'multiple_choice',
            prompt: 'Ką atsakyti, kai kitas žmogus sako „Atsiprašau!“?',
            audioText: 'Atsiprašau! – Nieko tokio!',
            options: ['Nieko tokio! / Nieko!', 'Labas vakaras!', 'Viso gero!', 'Ačiū'],
            correctAnswer: 'Nieko tokio! / Nieko!',
            explanation: 'Į atsiprašymą lietuviškai mandagiai atsakoma: „Nieko tokio!“, „Nieko!“ arba „Prašom!“.'
          },
          {
            id: 'u1-l1-e2',
            type: 'match_pairs',
            prompt: 'Sujunkite mandagumo ir atsisveikinimo frazes:',
            audioText: 'Ačiū, prašom, iki pasimatymo, iki rytojaus',
            pairs: [
              { id: 'p1', lithuanian: 'Labas rytas!', english: 'Good morning!' },
              { id: 'p2', lithuanian: 'Nėra už ką.', english: 'Not at all / Don\'t mention it.' },
              { id: 'p3', lithuanian: 'Iki pasimatymo!', english: 'See you later / Goodbye!' },
              { id: 'p4', lithuanian: 'Iki rytojaus!', english: 'See you tomorrow!' }
            ],
            explanation: '„Nėra už ką“ yra populiarus atsakymas į „Ačiū“ (panašiai kaip „Prašom“).'
          },
          {
            id: 'u1-l1-e3',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite atsisveikinimo frazę:',
            targetSentence: 'Viso gero ir iki rytojaus',
            audioText: 'Viso gero ir iki rytojaus',
            words: ['gero', 'Viso', 'iki', 'ir', 'rytojaus', 'Labas'],
            correctSequence: ['Viso', 'gero', 'ir', 'iki', 'rytojaus'],
            translationHint: 'Goodbye and see you tomorrow'
          },
          {
            id: 'u1-l1-e4',
            type: 'speaking_pronounce',
            prompt: 'Aiškiai ištarkite mandagią dienos frazę:',
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
        title: 'Susipažinimas ir veiksmažodis „būti / nebūti“',
        description: 'Mano vardas yra..., Kokia jūsų pavardė?, esu/esi/yra, studentas vs dėstytojas.',
        xpReward: 25,
        order: 2,
        exercises: [
          {
            id: 'u1-l2-e1',
            type: 'dialogue_fill',
            prompt: 'Užbaikite Rasos ir Jono susipažinimo pokalbį:',
            audioText: 'Labas rytas. Mano vardas yra Rasa. Labai malonu! Aš esu Jonas.',
            dialogue: [
              { speaker: 'Rasa', avatar: '👩', text: 'Labas rytas. Mano vardas yra Rasa.' },
              {
                speaker: 'Jonas',
                avatar: '👨',
                text: '',
                isBlank: true,
                blankPrefix: 'Labai malonu! Aš ',
                blankSuffix: ' Jonas.'
              },
              { speaker: 'Rasa', avatar: '👩', text: 'Man taip pat labai malonu!' }
            ],
            options: ['esu', 'esi', 'yra', 'esame'],
            correctAnswer: 'esu',
            explanation: '1-asis asmuo (Aš) reikalauja formos „esu“ (Aš esu Jonas).'
          },
          {
            id: 'u1-l2-e2',
            type: 'fill_in_the_blank',
            prompt: 'Pasirinkite teisingą neiginį:',
            audioText: 'Ne, aš nesu dėstytojas. Aš esu studentas.',
            sentenceWithBlank: 'Ne, aš ___ dėstytojas. Aš esu studentas.',
            options: ['nesu', 'nesi', 'nėra', 'nesame'],
            correctAnswer: 'nesu',
            explanation: 'Neiginys nuo „aš esu“ yra „aš nesu“.'
          },
          {
            id: 'u1-l2-e3',
            type: 'word_bank_order',
            prompt: 'Sudėkite klausimą: „Kokia jūsų pavardė?“',
            audioText: 'Kokia jūsų pavardė?',
            words: ['pavardė', 'Kokia', 'jūsų', 'vardas', 'kas'],
            correctSequence: ['Kokia', 'jūsų', 'pavardė'],
            explanation: 'Klausiant moteriškos giminės daiktavardžio „pavardė“ vartojamas įvardis „Kokia“.'
          },
          {
            id: 'u1-l2-e4',
            type: 'listening_multiple_choice',
            prompt: 'Pasiklausykite administratorės ir studento pokalbio:',
            audioDialogue: 'Administratorė: Kokia jūsų pavardė? Studentas: Mano pavardė Belovas. Koks jūsų vardas? Olegas.',
            question: 'Koks yra studento vardas ir pavardė pagal garso įrašą?',
            options: ['Olegas Belovas', 'Petras Švažas', 'Andrius Belovas', 'Jonas Povilas'],
            correctAnswer: 'Olegas Belovas',
            explanation: 'Studentas pasako: „Mano pavardė Belovas, vardas Olegas“.'
          },
          {
            id: 'u1-l2-e5',
            type: 'speaking_pronounce',
            prompt: 'Ištarkite mandagų susipažinimo atsakymą:',
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
        title: 'Šalys, tautybės ir gyventojai',
        description: 'Lietuva (lietuvis/lietuvė), Anglija (anglas), Vokietija (vokietis), Ukraina, Prancūzija.',
        xpReward: 25,
        order: 3,
        exercises: [
          {
            id: 'u1-l3-e1',
            type: 'match_pairs',
            prompt: 'Sujunkite šalis su jų gyventojais (vyrais):',
            audioText: 'Lietuva, Vokietija, Anglija, Prancūzija',
            pairs: [
              { id: 'c1', lithuanian: 'Lietuva', english: 'lietuvis' },
              { id: 'c2', lithuanian: 'Vokietija', english: 'vokietis' },
              { id: 'c3', lithuanian: 'Anglija', english: 'anglas' },
              { id: 'c4', lithuanian: 'Prancūzija', english: 'prancūzas' }
            ],
            explanation: 'Vyriškosios giminės tautybių galūnės dažniausiai yra -as arba -is.'
          },
          {
            id: 'u1-l3-e2',
            type: 'fill_in_the_blank',
            prompt: 'Lina gyvena Lietuvoje. Ji yra...',
            audioText: 'Lina yra lietuvė',
            sentenceWithBlank: 'Lina yra ___.',
            options: ['lietuvė', 'lietuvis', 'lietuva', 'lietuviškai'],
            correctAnswer: 'lietuvė',
            explanation: 'Moteriškosios giminės tautybės galūnė: lietuvė, anglė, vokietė, prancūzė.'
          },
          {
            id: 'u1-l3-e3',
            type: 'multiple_choice',
            prompt: 'Kaip vadinamas gyventojas iš Ispanijos (vyras)?',
            audioText: 'Ispanas',
            options: ['ispanas', 'ispanė', 'ispanija', 'ispaniškai'],
            correctAnswer: 'ispanas',
            explanation: 'Ispanija -> ispanas (vyras), ispanė (moteris).'
          },
          {
            id: 'u1-l3-e4',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite sakinį:',
            targetSentence: 'Ana yra studentė iš Ukrainos',
            audioText: 'Ana yra studentė iš Ukrainos',
            words: ['Ana', 'studentė', 'yra', 'iš', 'Ukrainos', 'Lietuvos'],
            correctSequence: ['Ana', 'yra', 'studentė', 'iš', 'Ukrainos'],
            translationHint: 'Ana is a student from Ukraine'
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
    subtitle: 'Savijauta, kilmė, kalbos ir šauksmininkas',
    description: 'Paklausti „Kaip sekasi?“, pasakyti iš kur esate (iš + Kilmininkas), kalbos su -iškai ir šauksmininkas (Tomai!).',
    color: '#0284c7',
    accentColor: '#38bdf8',
    lessons: [
      {
        id: 'lesson-4',
        unitId: 'unit-2',
        title: 'Kaip sekasi? ir Supažindinimas',
        description: 'Ačiū, gerai / puikiai / šiaip sau / blogai. Čia mano draugas Paulius / draugė Alicija.',
        xpReward: 25,
        order: 1,
        exercises: [
          {
            id: 'u2-l4-e1',
            type: 'multiple_choice',
            prompt: 'Ką reiškia atsakymas „Šiaip sau“ į klausimą „Kaip sekasi?“?',
            audioText: 'Kaip sekasi? – Šiaip sau.',
            options: ['So-so (neither good nor bad)', 'Excellent / Great', 'Very bad', 'Good morning'],
            correctAnswer: 'So-so (neither good nor bad)',
            explanation: '„Šiaip sau“ reiškia vidutinišką savijautą (so-so).'
          },
          {
            id: 'u2-l4-e2',
            type: 'dialogue_fill',
            prompt: 'Supažindinkite savo draugą:',
            audioText: 'Čia mano draugas Paulius. Malonu, aš Edvardas.',
            dialogue: [
              { speaker: 'Jūs', avatar: '🙋‍♂️', text: 'Čia mano draugas Paulius.' },
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
            explanation: 'Prisistatant sakoma Vardininko forma: „Aš Edvardas“.'
          },
          {
            id: 'u2-l4-e3',
            type: 'match_pairs',
            prompt: 'Sujunkite prašymus ir atsakymus:',
            audioText: 'Prašom pakartoti, prašom kalbėti lėčiau, ar aišku?',
            pairs: [
              { id: 'req1', lithuanian: 'Prašom pakartoti!', english: 'Please repeat!' },
              { id: 'req2', lithuanian: 'Prašom kalbėti lėčiau!', english: 'Please speak slower!' },
              { id: 'req3', lithuanian: 'Ar aišku?', english: 'Is it clear?' },
              { id: 'req4', lithuanian: 'Taip, aišku.', english: 'Yes, it is clear.' }
            ],
            explanation: 'Šios frazės yra būtinos pradedant kalbėti lietuviškai.'
          },
          {
            id: 'u2-l4-e4',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite prašymą:',
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
        title: 'Iš kur jūs esate? (iš + Kilmininkas)',
        description: 'Kilmė: iš Vokietijos, iš Hamburgo, iš Vilniaus, iš Latvijos, iš Rygos.',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u2-l5-e1',
            type: 'fill_in_the_blank',
            prompt: 'Parašykite teisingą galūnę po prielinksnio „iš“ (Vokietija):',
            audioText: 'Aš esu iš Vokietijos, iš Hamburgo',
            sentenceWithBlank: 'Aš esu iš ___, iš Hamburgo.',
            options: ['Vokietijos', 'Vokietija', 'Vokietijoje', 'Vokietijai'],
            correctAnswer: 'Vokietijos',
            explanation: 'Prielinksnis „iš“ reikalauja Kilmininko linksnio: Vokietija -> iš Vokietijos (-a -> -os).'
          },
          {
            id: 'u2-l5-e2',
            type: 'multiple_choice',
            prompt: 'Kokia yra žodžio „Vilnius“ forma po prielinksnio „iš“?',
            audioText: 'Aš esu iš Vilniaus',
            options: ['iš Vilniaus', 'iš Vilniuje', 'iš Vilnių', 'iš Vilniui'],
            correctAnswer: 'iš Vilniaus',
            explanation: 'Vyriškosios giminės galūnė -ius Kilmininke tampa -iaus: Vilnius -> iš Vilniaus.'
          },
          {
            id: 'u2-l5-e3',
            type: 'match_pairs',
            prompt: 'Sujunkite šalis ir miestus su jų Kilmininko formomis:',
            audioText: 'Iš Monako, iš Čilės, iš Rygos, iš Panevėžio',
            pairs: [
              { id: 'g1', lithuanian: 'Monakas', english: 'iš Monako (-as -> -o)' },
              { id: 'g2', lithuanian: 'Čilė', english: 'iš Čilės (-ė -> -ės)' },
              { id: 'g3', lithuanian: 'Ryga', english: 'iš Rygos (-a -> -os)' },
              { id: 'g4', lithuanian: 'Panevėžys', english: 'iš Panevėžio (-ys -> -io)' }
            ],
            explanation: 'Taisyklė: -as -> -o, -ė -> -ės, -a -> -os, -ys/-is -> -io.'
          },
          {
            id: 'u2-l5-e4',
            type: 'speaking_pronounce',
            prompt: 'Pasiteiraukite kito asmens kilmės:',
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
        title: 'Kalbos su -iškai ir Šauksmininkas (Vocative)',
        description: 'Veiksmažodis kalbėti, kalbos su -iškai, kreipiniai: Tomai!, Pauliau!, pone Jonai!',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u2-l6-e1',
            type: 'multiple_choice',
            prompt: 'Kaip kreiptis į draugą vardu Tomas (Šauksmininkas)?',
            audioText: 'Tomai, ar tu kalbi lietuviškai?',
            options: ['Tomai!', 'Tomas!', 'Tomui!', 'Tome!'],
            correctAnswer: 'Tomai!',
            explanation: 'Vyriškosios giminės vardai su galūne -as Šauksmininke įgyja galūnę -ai (Tomas -> Tomai!).'
          },
          {
            id: 'u2-l6-e2',
            type: 'fill_in_the_blank',
            prompt: 'Kreipimasis į Paulių: „Labas, ___!“',
            audioText: 'Labas, Pauliau!',
            sentenceWithBlank: 'Labas, ___!',
            options: ['Pauliau', 'Paulius', 'Pauliui', 'Paulie'],
            correctAnswer: 'Pauliau',
            explanation: 'Vardai su galūne -us Šauksmininke virsta -au: Paulius -> Pauliau!'
          },
          {
            id: 'u2-l6-e3',
            type: 'match_pairs',
            prompt: 'Sujunkite vardus su jų Šauksmininko formomis:',
            audioText: 'Tomai, Baliau, Egle, pone Jonai',
            pairs: [
              { id: 'v1', lithuanian: 'Tomas (-as)', english: 'Tomai!' },
              { id: 'v2', lithuanian: 'Paulius (-us)', english: 'Pauliau!' },
              { id: 'v3', lithuanian: 'Eglė (-ė)', english: 'Egle!' },
              { id: 'v4', lithuanian: 'Ponas Jonas', english: 'Pone Jonai!' }
            ],
            explanation: 'Žodis „ponas“ Šauksmininke turi ypatingą formą: „pone“ (Pone Jonai!).'
          },
          {
            id: 'u2-l6-e4',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite sakinį apie kalbas:',
            targetSentence: 'Ar tu kalbi lietuviškai ir angliškai',
            audioText: 'Ar tu kalbi lietuviškai ir angliškai',
            words: ['kalbi', 'Ar', 'tu', 'lietuviškai', 'angliškai', 'ir', 'vokiškai'],
            correctSequence: ['Ar', 'tu', 'kalbi', 'lietuviškai', 'ir', 'angliškai'],
            translationHint: 'Do you speak Lithuanian and English?'
          },
          {
            id: 'u2-l6-e5',
            type: 'speaking_pronounce',
            prompt: 'Ištarkite atsakymą apie kalbėjimą:',
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
    subtitle: 'Miestas, gyvenamoji vieta, vietininkas ir skaičiai',
    description: 'Pasakyti, kas kur gyvena (Vietininkas: Vilniuje, Kaune), prielinksnis prie + Kilmininkas, adresas ir skaičiai 0–300.',
    color: '#d97706',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'lesson-7',
        unitId: 'unit-3',
        title: 'Kur tu gyveni? (Vienaskaitos Vietininkas)',
        description: 'Vietininkas (Locative – Kur?): Kaune, Vilniuje, centre, bendrabutyje, Lietuvoje, Trakuose.',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u3-l7-e1',
            type: 'fill_in_the_blank',
            prompt: 'Įrašykite žodžio „Vilnius“ Vietininko formą:',
            audioText: 'Aš gyvenu Vilniuje',
            sentenceWithBlank: 'Aš gyvenu ___.',
            options: ['Vilniuje', 'Vilnius', 'Vilniaus', 'Vilnių'],
            correctAnswer: 'Vilniuje',
            explanation: 'Žodžiai su galūne -ius Vietininke virsta -iuje: Vilnius -> Vilniuje.'
          },
          {
            id: 'u3-l7-e2',
            type: 'multiple_choice',
            prompt: 'Kokia yra žodžio „Kaunas“ Vietininko forma (Kur?)?',
            audioText: 'Mes gyvename Kaune',
            options: ['Kaune', 'Kaunas', 'Kauno', 'Kaunui'],
            correctAnswer: 'Kaune',
            explanation: 'Galūnė -as Vietininke keičiama į -e: Kaunas -> Kaune.'
          },
          {
            id: 'u3-l7-e3',
            type: 'match_pairs',
            prompt: 'Sujunkite vietovardžius su jų Vietininko formomis:',
            audioText: 'Lietuvoje, Trakuose, bendrabutyje, aikštėje',
            pairs: [
              { id: 'loc1', lithuanian: 'Lietuva (-a)', english: 'Lietuvoje (-oje)' },
              { id: 'loc2', lithuanian: 'aikštė (-ė)', english: 'aikštėje (-ėje)' },
              { id: 'loc3', lithuanian: 'bendrabutis (-is)', english: 'bendrabutyje (-yje)' },
              { id: 'loc4', lithuanian: 'Trakai (daugiskaita)', english: 'Trakuose (-uose)' }
            ],
            explanation: 'Daugiskaitiniai vietovardžiai (-ai) Vietininke įgyja galūnę -uose: Trakai -> Trakuose.'
          },
          {
            id: 'u3-l7-e4',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite sakinį:',
            targetSentence: 'Aš gyvenu ir dirbu Vilniuje centre',
            audioText: 'Aš gyvenu ir dirbu Vilniuje centre',
            words: ['Vilniuje', 'Aš', 'dirbu', 'ir', 'centre', 'gyvenu', 'Kaune'],
            correctSequence: ['Aš', 'gyvenu', 'ir', 'dirbu', 'Vilniuje', 'centre'],
            translationHint: 'I live and work in Vilnius, in the center'
          },
          {
            id: 'u3-l7-e5',
            type: 'speaking_pronounce',
            prompt: 'Paklauskite pašnekovo, kur jis gyvena:',
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
        title: 'Miesto pastatai ir prielinksnis „prie + Kilmininkas“',
        description: 'Bankas prie pašto, kavinė prie stoties, ligoninė, vaistinė, knygynas, biblioteka.',
        xpReward: 30,
        order: 2,
        exercises: [
          {
            id: 'u3-l8-e1',
            type: 'dialogue_fill',
            prompt: 'Paklauskite kelio iki banko:',
            audioText: 'Atsiprašau, kur yra bankas? Bankas yra prie pašto.',
            dialogue: [
              { speaker: 'Praeivis', avatar: '🚶', text: 'Atsiprašau, kur yra bankas?' },
              {
                speaker: 'Vilnietis',
                avatar: '🙋',
                text: '',
                isBlank: true,
                blankPrefix: 'Bankas yra prie ',
                blankSuffix: '.'
              }
            ],
            options: ['pašto', 'paštas', 'pašte', 'paštui'],
            correctAnswer: 'pašto',
            explanation: 'Prielinksnis „prie“ (near) reikalauja Kilmininko linksnio: paštas -> prie pašto.'
          },
          {
            id: 'u3-l8-e2',
            type: 'match_pairs',
            prompt: 'Sujunkite miesto įstaigas su jų reikšmėmis:',
            audioText: 'Vaistinė, knygynas, stotis, ligoninė',
            pairs: [
              { id: 'b1', lithuanian: 'Vaistinė', english: 'Pharmacy' },
              { id: 'b2', lithuanian: 'Ligoninė', english: 'Hospital' },
              { id: 'b3', lithuanian: 'Knygynas', english: 'Bookstore' },
              { id: 'b4', lithuanian: 'Stotis', english: 'Station (bus/train)' }
            ],
            explanation: 'Miesto žodynas pagal 3 skyrių.'
          },
          {
            id: 'u3-l8-e3',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite sakinį apie kavinę:',
            targetSentence: 'Kavinė yra arti prie stoties',
            audioText: 'Kavinė yra arti prie stoties',
            words: ['Kavinė', 'arti', 'yra', 'prie', 'stoties', 'toli'],
            correctSequence: ['Kavinė', 'yra', 'arti', 'prie', 'stoties'],
            translationHint: 'The cafe is near, next to the station'
          },
          {
            id: 'u3-l8-e4',
            type: 'listening_multiple_choice',
            prompt: 'Pasiklausykite vilniečio atsakymo:',
            audioDialogue: 'Universitetas yra toli, prie didelio parko.',
            question: 'Kur yra universitetas pagal įrašą?',
            options: ['Toli, prie parko', 'Arti, prie banko', 'Centre, prie pašto', 'Stotyje'],
            correctAnswer: 'Toli, prie parko',
            explanation: 'Vilnietis pasako: „Universitetas yra toli, prie didelio parko“.'
          }
        ]
      },
      {
        id: 'lesson-9',
        unitId: 'unit-3',
        title: 'Adresas, telefono numeris ir skaičiai (0–300)',
        description: 'Parko gatvė 4-10, telefono numeris 867741216, skaičiai: 0, 10, 20, 100, 200, 300.',
        xpReward: 30,
        order: 3,
        exercises: [
          {
            id: 'u3-l9-e1',
            type: 'multiple_choice',
            prompt: 'Kaip lietuviškai perskaityti adreso numerį „Parko gatvė 4-10“?',
            audioText: 'Parko gatvė keturi, dešimt',
            options: [
              'Parko gatvė keturi, dešimt',
              'Parko gatvė keturiolika',
              'Parko gatvė keturiasdešimt',
              'Parko gatvė nulis, keturi'
            ],
            correctAnswer: 'Parko gatvė keturi, dešimt',
            explanation: 'Adresuose brūkšnelis tarp namo ir buto skaitomas: namo numeris, buto numeris (keturi, dešimt).'
          },
          {
            id: 'u3-l9-e2',
            type: 'match_pairs',
            prompt: 'Sujunkite skaičius su žodžiais:',
            audioText: 'Dešimt, dvidešimt, penkiasdešimt, šimtas',
            pairs: [
              { id: 'num1', lithuanian: '10', english: 'Dešimt' },
              { id: 'num2', lithuanian: '20', english: 'Dvidešimt' },
              { id: 'num3', lithuanian: '100', english: 'Šimtas' },
              { id: 'num4', lithuanian: '200', english: 'Du šimtai' }
            ],
            explanation: 'Skaičiai: 100 – šimtas, 200 – du šimtai, 300 – trys šimtai.'
          },
          {
            id: 'u3-l9-e3',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite ir sudėkite adreso sakinį:',
            targetSentence: 'Mano adresas yra Gedimino prospektas dešimt',
            audioText: 'Mano adresas yra Gedimino prospektas dešimt',
            words: ['adresas', 'Mano', 'yra', 'Gedimino', 'prospektas', 'dešimt', 'penki'],
            correctSequence: ['Mano', 'adresas', 'yra', 'Gedimino', 'prospektas', 'dešimt'],
            translationHint: 'My address is Gediminas Avenue 10'
          },
          {
            id: 'u3-l9-e4',
            type: 'speaking_pronounce',
            prompt: 'Pasiteiraukite pašnekovo telefono numerio:',
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
    subtitle: 'Susitikimai, laikas, savaitės dienos ir kryptys',
    description: 'Prielinksniai į ir pas + Galininkas, laiko reiškimas galininku (pirmadienį, penktą valandą), pusvalandžiai (pusė aštuntos).',
    color: '#6366f1',
    accentColor: '#8b5cf6',
    lessons: [
      {
        id: 'lesson-10',
        unitId: 'unit-4',
        title: 'Kada susitinkame? (Savaitės dienos ir laikas)',
        description: 'Dienos galininku: pirmadienį, antradienį, penktadienį; rytą, vakarą; Gero savaitgalio!',
        xpReward: 30,
        order: 1,
        exercises: [
          {
            id: 'u4-l10-e1',
            type: 'multiple_choice',
            prompt: 'Kokia forma atsakoma į klausimą „Kada susitinkame?“ (penktadienis)?',
            audioText: 'Susitinkame penktadienį',
            options: ['penktadienį', 'penktadienis', 'penktadienio', 'penktadieniui'],
            correctAnswer: 'penktadienį',
            explanation: 'Savaitės diena, atsakant į klausimą „Kada?“, reiškiama Galininko linksniu (-į).'
          },
          {
            id: 'u4-l10-e2',
            type: 'match_pairs',
            prompt: 'Sujunkite savaitės dienas su jų reikšmėmis:',
            audioText: 'Pirmadienis, trečiadienis, penktadienis, sekmadienis',
            pairs: [
              { id: 'd1', lithuanian: 'Pirmadienis', english: 'Monday' },
              { id: 'd2', lithuanian: 'Trečiadienis', english: 'Wednesday' },
              { id: 'd3', lithuanian: 'Penktadienis', english: 'Friday' },
              { id: 'd4', lithuanian: 'Sekmadienis', english: 'Sunday' }
            ],
            explanation: 'Dienų pavadinimai sudaryti pagal skaitvardžius: pirmas -> pirmadienis, antras -> antradienis...'
          },
          {
            id: 'u4-l10-e3',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite savaitgalio palinkėjimo:',
            targetSentence: 'Gero savaitgalio ir iki pirmadienio',
            audioText: 'Gero savaitgalio ir iki pirmadienio',
            words: ['savaitgalio', 'Gero', 'iki', 'ir', 'pirmadienio', 'rytojaus'],
            correctSequence: ['Gero', 'savaitgalio', 'ir', 'iki', 'pirmadienio'],
            translationHint: 'Have a good weekend and see you Monday!'
          },
          {
            id: 'u4-l10-e4',
            type: 'speaking_pronounce',
            prompt: 'Ištarkite susitarimo frazę:',
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
        title: 'Kelintą valandą? ir Pusvalandžiai',
        description: 'Valandos galininku (penktą valandą), pusė + Kilmininkas (pusę aštuntos = 7:30, pusę dešimtos = 9:30).',
        xpReward: 35,
        order: 2,
        exercises: [
          {
            id: 'u4-l11-e1',
            type: 'multiple_choice',
            prompt: 'Kiek valandų reiškia lietuviškas laiko pasakymas „pusę aštuntos“?',
            audioText: 'Susitinkame pusę aštuntos',
            options: ['7:30 (half past seven / pusė aštuntos)', '8:30', '7:00', '8:00'],
            correctAnswer: '7:30 (half past seven / pusė aštuntos)',
            explanation: 'Lietuviškai pusvalandžiai reiškiami konstrukcija „pusė + ateinančios valandos Kilmininkas“: pusė aštuntos = 7:30.'
          },
          {
            id: 'u4-l11-e2',
            type: 'dialogue_fill',
            prompt: 'Atsakykite į klausimą apie laiką:',
            audioText: 'Kelintą valandą susitinkame? Susitinkame šeštą valandą.',
            dialogue: [
              { speaker: 'Tomas', avatar: '🙋‍♂️', text: 'Kelintą valandą susitinkame?' },
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
            explanation: 'Atsakant „kelintą valandą?“ vartojamas Galininkas: šeštą valandą (at 6 o\'clock).'
          },
          {
            id: 'u4-l11-e3',
            type: 'audio_dictation',
            prompt: 'Pasiklausykite susitarimo laiko:',
            targetSentence: 'Susitinkame kavinėje pusę dešimtos',
            audioText: 'Susitinkame kavinėje pusę dešimtos',
            words: ['kavinėje', 'Susitinkame', 'pusę', 'dešimtos', 'penktą', 'stotyje'],
            correctSequence: ['Susitinkame', 'kavinėje', 'pusę', 'dešimtos'],
            translationHint: 'We meet in the cafe at 9:30'
          },
          {
            id: 'u4-l11-e4',
            type: 'listening_multiple_choice',
            prompt: 'Pasiklausykite pranešimo apie susitikimą:',
            audioDialogue: 'Atsiprašau, aš skubu. Mūsų susitikimas yra penktą valandą.',
            question: 'Kelintą valandą vyksta susitikimas?',
            options: ['Penktą valandą (5:00)', 'Šeštą valandą (6:00)', 'Ketvirtą valandą (4:00)', 'Pusę penkių (4:30)'],
            correctAnswer: 'Penktą valandą (5:00)',
            explanation: 'Pašnekovas pasako: „Mūsų susitikimas yra penktą valandą“.'
          }
        ]
      },
      {
        id: 'lesson-12',
        unitId: 'unit-4',
        title: 'Kur einame? (Prielinksniai į ir pas + Galininkas)',
        description: 'į (į vietą/pastatą: į universitetą, į teatrą) vs pas (pas asmenį: pas draugą, pas Paulių, pas gydytoją).',
        xpReward: 35,
        order: 3,
        exercises: [
          {
            id: 'u4-l12-e1',
            type: 'fill_in_the_blank',
            prompt: 'Pasirinkite teisingą prielinksnį (vieta ar asmuo?): „Einame ___ teatrą.“',
            audioText: 'Šiandien mes einame į teatrą',
            sentenceWithBlank: 'Šiandien mes einame ___ teatrą.',
            options: ['į', 'pas', 'prie', 'iš'],
            correctAnswer: 'į',
            explanation: 'Keliaujant į pastatą ar vietą vartojamas prielinksnis „į“ (į teatrą, į universitetą).'
          },
          {
            id: 'u4-l12-e2',
            type: 'multiple_choice',
            prompt: 'Kuris sakinys teisingas keliaujant pas žmogų (pas asmenį)?',
            audioText: 'Rytoj mes einame pas draugą Paulių',
            options: [
              'Rytoj mes einame pas Paulių.',
              'Rytoj mes einame į Paulių.',
              'Rytoj mes einame prie Pauliaus.',
              'Rytoj mes einame iš Pauliaus.'
            ],
            correctAnswer: 'Rytoj mes einame pas Paulių.',
            explanation: 'Keliaujant pas asmenį ar specialistą vartojamas prielinksnis „pas + Galininkas“: pas Paulių, pas gydytoją.'
          },
          {
            id: 'u4-l12-e3',
            type: 'dialogue_fill',
            prompt: 'Kvietimas į svečius:',
            audioText: 'Kviečiu į svečius! Ačiū! Būtinai ateisiu!',
            dialogue: [
              { speaker: 'Draugas', avatar: '🙋‍♂️', text: 'Kviečiu į svečius!' },
              {
                speaker: 'Jūs',
                avatar: '🙋',
                text: '',
                isBlank: true,
                blankPrefix: 'Ačiū! Būtinai ',
                blankSuffix: '!'
              }
            ],
            options: ['ateisiu', 'einu', 'buvau', 'kalbu'],
            correctAnswer: 'ateisiu',
            explanation: 'Mandagus atsakymas: „Ačiū! Būtinai ateisiu!“ (I will definitely come!).'
          },
          {
            id: 'u4-l12-e4',
            type: 'match_pairs',
            prompt: 'Sujunkite prielinksnius į ir pas su tinkamais žodžiais:',
            audioText: 'Į kavinę, pas gydytoją, į Vilnių, pas Tomą',
            pairs: [
              { id: 'prep1', lithuanian: 'į (į vietą)', english: 'į kavinę / į universitetą' },
              { id: 'prep2', lithuanian: 'pas (pas asmenį)', english: 'pas draugą / pas Tomą' },
              { id: 'prep3', lithuanian: 'į (į miestą)', english: 'į Vilnių / į Kauną' },
              { id: 'prep4', lithuanian: 'pas (pas specialistą)', english: 'pas gydytoją / pas dėstytoją' }
            ],
            explanation: 'Pagrindinė 4 skyriaus taisyklė: į + vieta, pas + asmuo (abu reikalauja Galininko).'
          },
          {
            id: 'u4-l12-e5',
            type: 'speaking_pronounce',
            prompt: 'Pakvieskite draugus į svečius:',
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
