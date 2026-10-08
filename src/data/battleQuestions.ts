// Question Bank for Friend Battles (Lietuvių Kalbos Dvikovos)
// Every question and option includes authentic Lithuanian text AND English subtitles

export interface BattleOption {
  lt: string;
  en: string;
}

export interface BattleQuestion {
  id: string;
  category: string;
  prompt: string;
  englishSubtitle: string;
  subPrompt?: string;
  audioText: string;
  options: BattleOption[];
  correctAnswer: string; // matches option.lt
  explanation: string;
}

export const BATTLE_QUESTIONS: BattleQuestion[] = [
  // --- Greetings & Basics ---
  {
    id: 'bq-1',
    category: 'Pasisveikinimai • Greetings',
    prompt: 'Kaip mandagiai pasisveikinti dieną?',
    englishSubtitle: 'How do you say "Good day / Good afternoon" politely?',
    audioText: 'Laba diena',
    options: [
      { lt: 'Laba diena', en: 'Good day / Good afternoon' },
      { lt: 'Labas rytas', en: 'Good morning' },
      { lt: 'Labas vakaras', en: 'Good evening' },
      { lt: 'Labanakt', en: 'Good night' },
    ],
    correctAnswer: 'Laba diena',
    explanation: '„Laba diena“ is the universal polite greeting used during daytime throughout Lithuania.',
  },
  {
    id: 'bq-2',
    category: 'Pasisveikinimai • Greetings',
    prompt: 'Ką reiškia „Ačiū labai!“?',
    englishSubtitle: 'What does "Ačiū labai!" mean?',
    audioText: 'Ačiū labai',
    options: [
      { lt: 'Ačiū labai', en: 'Thank you very much' },
      { lt: 'Prašom', en: 'Please / You are welcome' },
      { lt: 'Atsiprašau', en: 'Excuse me / Sorry' },
      { lt: 'Viso gero', en: 'Goodbye / All the best' },
    ],
    correctAnswer: 'Ačiū labai',
    explanation: '„Ačiū“ means "Thank you", and „labai“ means "very / very much".',
  },
  {
    id: 'bq-3',
    category: 'Pasisveikinimai • Greetings',
    prompt: 'Kuris žodis reiškia „Prašau / Nėra už ką“?',
    englishSubtitle: 'Which word means "Please" or "You are welcome"?',
    audioText: 'Prašom',
    options: [
      { lt: 'Prašom', en: 'Please / You are welcome' },
      { lt: 'Atsiprašau', en: 'Excuse me / Sorry' },
      { lt: 'Taip', en: 'Yes' },
      { lt: 'Ne', en: 'No' },
    ],
    correctAnswer: 'Prašom',
    explanation: '„Prašom“ serves as both "Please" when requesting and "You are welcome" when responding to thanks.',
  },
  {
    id: 'bq-4',
    category: 'Pasisveikinimai • Greetings',
    prompt: 'Kaip pasakyti „Atsiprašau“?',
    englishSubtitle: 'How do you say "Excuse me / Sorry"?',
    audioText: 'Atsiprašau',
    options: [
      { lt: 'Atsiprašau', en: 'Excuse me / Sorry' },
      { lt: 'Iki pasimatymo', en: 'See you later / Goodbye' },
      { lt: 'Viso gero', en: 'All the best / Goodbye' },
      { lt: 'Labas', en: 'Hello / Hi' },
    ],
    correctAnswer: 'Atsiprašau',
    explanation: '„Atsiprašau“ is the essential polite word for apologizing or getting someone\'s attention.',
  },
  {
    id: 'bq-5',
    category: 'Pasisveikinimai • Greetings',
    prompt: 'Koks yra trumpas, draugiškas atsisveikinimas?',
    englishSubtitle: 'What is the informal farewell "See you / Bye"?',
    audioText: 'Iki!',
    options: [
      { lt: 'Iki!', en: 'Bye / See you!' },
      { lt: 'Labas!', en: 'Hello / Hi!' },
      { lt: 'Sveiki!', en: 'Greetings / Hello!' },
      { lt: 'Prašau!', en: 'Please!' },
    ],
    correctAnswer: 'Iki!',
    explanation: '„Iki!“ is the short, warm way to say "Bye!" (short for „Iki pasimatymo“ - until we meet again).',
  },

  // --- Food & Drinks ---
  {
    id: 'bq-6',
    category: 'Maistas ir Kavinė • Food & Café',
    prompt: 'Ką reiškia „Norėčiau kavos su pienu“?',
    englishSubtitle: 'What does "Norėčiau kavos su pienu" mean?',
    audioText: 'Norėčiau kavos su pienu',
    options: [
      { lt: 'Kava su pienu', en: 'Coffee with milk' },
      { lt: 'Arbata su citrina', en: 'Tea with lemon' },
      { lt: 'Šalta kava', en: 'Iced coffee' },
      { lt: 'Vanduo su ledu', en: 'Water with ice' },
    ],
    correctAnswer: 'Kava su pienu',
    explanation: '„Norėčiau“ = I would like, „kavos“ = of coffee, „su pienu“ = with milk.',
  },
  {
    id: 'bq-7',
    category: 'Maistas ir Kavinė • Food & Café',
    prompt: 'Kuri yra garsi šalta rožinė lietuviška sriuba?',
    englishSubtitle: 'Which is Lithuania\'s famous cold pink beet soup?',
    audioText: 'Šaltibarščiai',
    options: [
      { lt: 'Šaltibarščiai', en: 'Cold pink beet soup with kefir' },
      { lt: 'Cepelinai', en: 'Potato dumplings with meat' },
      { lt: 'Šakotis', en: 'Traditional tree spit-cake' },
      { lt: 'Kibinai', en: 'Traditional Karaite pastries' },
    ],
    correctAnswer: 'Šaltibarščiai',
    explanation: '„Šaltibarščiai“ is the famous cold pink beet kefir soup, Lithuania\'s national culinary treasure!',
  },
  {
    id: 'bq-8',
    category: 'Maistas ir Kavinė • Food & Café',
    prompt: 'Kaip paklausti „Kiek tai kainuoja?“?',
    englishSubtitle: 'How do you ask "How much does this cost?" in Lithuanian?',
    audioText: 'Kiek kainuoja?',
    options: [
      { lt: 'Kiek kainuoja?', en: 'How much does it cost?' },
      { lt: 'Kur yra?', en: 'Where is it?' },
      { lt: 'Kas čia?', en: 'What is here / who is this?' },
      { lt: 'Kada atidarote?', en: 'When do you open?' },
    ],
    correctAnswer: 'Kiek kainuoja?',
    explanation: '„Kiek“ (how much) + „kainuoja“ (does it cost). Essential for shops and markets.',
  },
  {
    id: 'bq-9',
    category: 'Maistas ir Kavinė • Food & Café',
    prompt: 'Kuris žodis lietuviškai reiškia „Bread“?',
    englishSubtitle: 'What is the Lithuanian word for "Bread"?',
    audioText: 'Duona',
    options: [
      { lt: 'Duona', en: 'Bread (rye/wheat)' },
      { lt: 'Sūris', en: 'Cheese' },
      { lt: 'Pienas', en: 'Milk' },
      { lt: 'Mėsa', en: 'Meat' },
    ],
    correctAnswer: 'Duona',
    explanation: '„Duona“ is bread. Lithuania is famous for dark sourdough rye bread („juoda duona“).',
  },
  {
    id: 'bq-10',
    category: 'Maistas ir Kavinė • Food & Café',
    prompt: 'Ką sakyti norint sumokėti restorane?',
    englishSubtitle: 'What do you say to ask for the bill at a restaurant?',
    audioText: 'Sąskaitą, prašau',
    options: [
      { lt: 'Sąskaitą, prašau', en: 'The bill, please' },
      { lt: 'Meniu, prašau', en: 'The menu, please' },
      { lt: 'Vandens, prašau', en: 'Water, please' },
      { lt: 'Staliuką dviem', en: 'A table for two' },
    ],
    correctAnswer: 'Sąskaitą, prašau',
    explanation: '„Sąskaita“ is bill / check. In the accusative case: „Sąskaitą, prašau“.',
  },

  // --- City & Directions ---
  {
    id: 'bq-11',
    category: 'Miestas ir Kelias • City & Navigation',
    prompt: 'Kaip pasakyti „Tiesiai į priekį“?',
    englishSubtitle: 'How do you say "Straight ahead" when giving directions?',
    audioText: 'Tiesiai',
    options: [
      { lt: 'Tiesiai', en: 'Straight ahead' },
      { lt: 'Į kairę', en: 'To the left' },
      { lt: 'Į dešinę', en: 'To the right' },
      { lt: 'Atgal', en: 'Backwards / Back' },
    ],
    correctAnswer: 'Tiesiai',
    explanation: '„Tiesiai“ means straight ahead. „Į kairę“ is left, „į dešinę“ is right.',
  },
  {
    id: 'bq-12',
    category: 'Miestas ir Kelias • City & Navigation',
    prompt: 'Kaip paklausti „Kur yra vaistinė?“?',
    englishSubtitle: 'How do you ask "Where is the pharmacy?"?',
    audioText: 'Kur yra vaistinė?',
    options: [
      { lt: 'Kur yra vaistinė?', en: 'Where is the pharmacy?' },
      { lt: 'Kur yra stotis?', en: 'Where is the station?' },
      { lt: 'Kada dirba vaistinė?', en: 'When is the pharmacy open?' },
      { lt: 'Kas yra vaistinė?', en: 'What is a pharmacy?' },
    ],
    correctAnswer: 'Kur yra vaistinė?',
    explanation: '„Kur yra...?“ is the standard Lithuanian question pattern for "Where is...?"',
  },
  {
    id: 'bq-13',
    category: 'Miestas ir Kelias • City & Navigation',
    prompt: 'Kokia yra Lietuvos sostinė?',
    englishSubtitle: 'What is the capital city of Lithuania?',
    audioText: 'Vilnius',
    options: [
      { lt: 'Vilnius', en: 'Vilnius (Capital of Lithuania)' },
      { lt: 'Kaunas', en: 'Kaunas (Second largest city)' },
      { lt: 'Klaipėda', en: 'Klaipėda (Port city on Baltic Sea)' },
      { lt: 'Šiauliai', en: 'Šiauliai (City of the Sun)' },
    ],
    correctAnswer: 'Vilnius',
    explanation: 'Vilnius is the historic capital and largest city of Lithuania, founded by Grand Duke Gediminas.',
  },
  {
    id: 'bq-14',
    category: 'Miestas ir Kelias • City & Navigation',
    prompt: 'Ką reiškia „Geležinkelio stotis“?',
    englishSubtitle: 'What does "Geležinkelio stotis" mean in English?',
    audioText: 'Geležinkelio stotis',
    options: [
      { lt: 'Geležinkelio stotis', en: 'Railway station' },
      { lt: 'Autobusų stotelė', en: 'Bus stop' },
      { lt: 'Vilniaus oro uostas', en: 'Vilnius airport' },
      { lt: 'Miesto rotušė', en: 'Town hall' },
    ],
    correctAnswer: 'Geležinkelio stotis',
    explanation: '„Geležinkelis“ = railway (iron road), „stotis“ = station.',
  },
  {
    id: 'bq-15',
    category: 'Miestas ir Kelias • City & Navigation',
    prompt: 'Kaip pasakyti „Pasukite į kairę“?',
    englishSubtitle: 'How do you say "Turn to the left"?',
    audioText: 'Į kairę',
    options: [
      { lt: 'Į kairę', en: 'To the left' },
      { lt: 'Į dešinę', en: 'To the right' },
      { lt: 'Tiesiai', en: 'Straight' },
      { lt: 'Netoli', en: 'Nearby / Not far' },
    ],
    correctAnswer: 'Į kairę',
    explanation: '„Į kairę“ means to the left (preposition „į“ + Accusative „kairę“).',
  },

  // --- Core Verbs & Grammar ---
  {
    id: 'bq-16',
    category: 'Veiksmažodžiai • Verbs & Grammar',
    prompt: 'Kaip pasakyti „Aš esu“ (I am)?',
    englishSubtitle: 'How do you say "I am" in Lithuanian?',
    audioText: 'Aš esu',
    options: [
      { lt: 'Aš esu', en: 'I am' },
      { lt: 'Tu esi', en: 'You are (singular)' },
      { lt: 'Jis yra', en: 'He is' },
      { lt: 'Mes esame', en: 'We are' },
    ],
    correctAnswer: 'Aš esu',
    explanation: 'The verb „būti“ (to be) conjugates as: Aš esu (I am), Tu esi (You are), Jis/Ji yra (He/She is).',
  },
  {
    id: 'bq-17',
    category: 'Veiksmažodžiai • Verbs & Grammar',
    prompt: 'Kokia yra neigiama forma „Aš nesu“?',
    englishSubtitle: 'What is the negative form "I am not"?',
    audioText: 'Aš nesu',
    options: [
      { lt: 'Aš nesu', en: 'I am not' },
      { lt: 'Aš nebūti', en: 'I not to be (infinitive)' },
      { lt: 'Aš ne', en: 'I not' },
      { lt: 'Aš neturiu', en: 'I do not have' },
    ],
    correctAnswer: 'Aš nesu',
    explanation: '„Aš nesu“ means "I am not" (prefix ne- attached directly to verb: ne + esu = nesu).',
  },
  {
    id: 'bq-18',
    category: 'Veiksmažodžiai • Verbs & Grammar',
    prompt: 'Kaip pasakyti „Aš kalbu lietuviškai“?',
    englishSubtitle: 'How do you say "I speak Lithuanian"?',
    audioText: 'Aš kalbu lietuviškai',
    options: [
      { lt: 'Aš kalbu lietuviškai', en: 'I speak Lithuanian' },
      { lt: 'Aš esu lietuviškai', en: 'I am in Lithuanian' },
      { lt: 'Aš gyvenu Lietuvoje', en: 'I live in Lithuania' },
      { lt: 'Aš suprantu angliškai', en: 'I understand English' },
    ],
    correctAnswer: 'Aš kalbu lietuviškai',
    explanation: '„Aš kalbu“ (I speak) + „lietuviškai“ (in Lithuanian adverb).',
  },
  {
    id: 'bq-19',
    category: 'Veiksmažodžiai • Verbs & Grammar',
    prompt: 'Ką reiškia „Aš nesuprantu“?',
    englishSubtitle: 'What does "Aš nesuprantu" mean in English?',
    audioText: 'Aš nesuprantu',
    options: [
      { lt: 'Aš nesuprantu', en: 'I do not understand' },
      { lt: 'Aš nekalbu', en: 'I do not speak' },
      { lt: 'Aš nežinau', en: 'I do not know' },
      { lt: 'Aš nenoriu', en: 'I do not want' },
    ],
    correctAnswer: 'Aš nesuprantu',
    explanation: 'From verb „suprasti“ (to understand): „Aš nesuprantu“ = I do not understand.',
  },
  {
    id: 'bq-20',
    category: 'Veiksmažodžiai • Verbs & Grammar',
    prompt: 'Kuris žodis tinka: „Mes _____ Vilniuje“?',
    englishSubtitle: 'Which verb correctly completes: "We live in Vilnius"?',
    audioText: 'Mes gyvename Vilniuje',
    options: [
      { lt: 'gyvename', en: 'we live (ending -ame)' },
      { lt: 'gyvena', en: 'he/she/they live' },
      { lt: 'gyvenu', en: 'I live (ending -u)' },
      { lt: 'gyvenate', en: 'you live (plural -ate)' },
    ],
    correctAnswer: 'gyvename',
    explanation: 'For „Mes“ (we), 1st person plural takes the ending -ame: „Mes gyvename“.',
  },

  // --- Numbers & Time ---
  {
    id: 'bq-21',
    category: 'Skaičiai • Numbers',
    prompt: 'Kaip lietuviškai skaičiuoti „1, 2, 3“?',
    englishSubtitle: 'What is the Lithuanian for numbers "1, 2, 3"?',
    audioText: 'Vienas, du, trys',
    options: [
      { lt: 'Vienas, du, trys', en: 'One, two, three (1, 2, 3)' },
      { lt: 'Keturi, penki, šeši', en: 'Four, five, six (4, 5, 6)' },
      { lt: 'Septyni, aštuoni, devyni', en: 'Seven, eight, nine (7, 8, 9)' },
      { lt: 'Dešimt, dvidešimt, trisdešimt', en: 'Ten, twenty, thirty (10, 20, 30)' },
    ],
    correctAnswer: 'Vienas, du, trys',
    explanation: '„Vienas“ = 1, „du“ = 2, „trys“ = 3.',
  },
  {
    id: 'bq-22',
    category: 'Skaičiai • Numbers',
    prompt: 'Kuris skaičius yra „Penki“?',
    englishSubtitle: 'Which number is "Penki" in Lithuanian?',
    audioText: 'Penki',
    options: [
      { lt: '5', en: 'Five (penki)' },
      { lt: '4', en: 'Four (keturi)' },
      { lt: '6', en: 'Six (šeši)' },
      { lt: '10', en: 'Ten (dešimt)' },
    ],
    correctAnswer: '5',
    explanation: '„Penki“ is the number 5 in masculine form (penkios is feminine).',
  },
  {
    id: 'bq-23',
    category: 'Skaičiai • Numbers',
    prompt: 'Kaip lietuviškai pasakyti skaičių „10“?',
    englishSubtitle: 'How do you say the number "10" in Lithuanian?',
    audioText: 'Dešimt',
    options: [
      { lt: 'Dešimt', en: 'Ten (10)' },
      { lt: 'Devyni', en: 'Nine (9)' },
      { lt: 'Aštuoni', en: 'Eight (8)' },
      { lt: 'Šimtas', en: 'One hundred (100)' },
    ],
    correctAnswer: 'Dešimt',
    explanation: '„Dešimt“ = 10, „Devyni“ = 9, „Aštuoni“ = 8, „Šimtas“ = 100.',
  },
  {
    id: 'bq-24',
    category: 'Skaičiai • Numbers',
    prompt: 'Ką reiškia „Kiek dabar valandų?“?',
    englishSubtitle: 'What does "Kiek dabar valandų?" mean in English?',
    audioText: 'Kiek dabar valandų?',
    options: [
      { lt: 'Kiek dabar valandų?', en: 'What time is it now?' },
      { lt: 'Kokia šiandien diena?', en: 'What day is today?' },
      { lt: 'Kiek tau metų?', en: 'How old are you?' },
      { lt: 'Kada važiuoja autobusas?', en: 'When does the bus leave?' },
    ],
    correctAnswer: 'Kiek dabar valandų?',
    explanation: '„Kiek dabar valandų?“ literally means "How many hours now? / What time is it?".',
  },
  {
    id: 'bq-25',
    category: 'Skaičiai • Numbers',
    prompt: 'Kuri diena yra „Šiandien“?',
    englishSubtitle: 'What day is "Šiandien"?',
    audioText: 'Šiandien',
    options: [
      { lt: 'Šiandien', en: 'Today' },
      { lt: 'Rytoj', en: 'Tomorrow' },
      { lt: 'Vakar', en: 'Yesterday' },
      { lt: 'Visada', en: 'Always' },
    ],
    correctAnswer: 'Šiandien',
    explanation: '„Šiandien“ = today, „rytoj“ = tomorrow, „vakar“ = yesterday.',
  },

  // --- Everyday Situations & Culture ---
  {
    id: 'bq-26',
    category: 'Kultūra ir Gyvenimas • Culture & Daily Life',
    prompt: 'Ką lietuviai sako keldami tostą („Cheers!“)?',
    englishSubtitle: 'What do Lithuanians say when toasting with drinks ("Cheers!")?',
    audioText: 'Į sveikatą!',
    options: [
      { lt: 'Į sveikatą!', en: 'To your health! (Cheers!)' },
      { lt: 'Gero apetito!', en: 'Bon appétit / Enjoy your meal!' },
      { lt: 'Labas rytas!', en: 'Good morning!' },
      { lt: 'Sveiki atvykę!', en: 'Welcome!' },
    ],
    correctAnswer: 'Į sveikatą!',
    explanation: '„Į sveikatą!“ literally means "To your health!" and is the universal Lithuanian toast.',
  },
  {
    id: 'bq-27',
    category: 'Kultūra ir Gyvenimas • Culture & Daily Life',
    prompt: 'Ką reiškia „Gero apetito!“?',
    englishSubtitle: 'What does "Gero apetito!" mean?',
    audioText: 'Gero apetito!',
    options: [
      { lt: 'Gero apetito!', en: 'Bon appétit / Enjoy your meal!' },
      { lt: 'Į sveikatą!', en: 'Cheers / To your health!' },
      { lt: 'Sėkmės!', en: 'Good luck / Wishing success!' },
      { lt: 'Geros dienos!', en: 'Have a nice day!' },
    ],
    correctAnswer: 'Gero apetito!',
    explanation: '„Gero apetito!“ is wished before meals ("Good appetite! / Enjoy your meal!").',
  },
  {
    id: 'bq-28',
    category: 'Kultūra ir Gyvenimas • Culture & Daily Life',
    prompt: 'Kuris žodis reiškia „Friend“ (draugas)?',
    englishSubtitle: 'What is the Lithuanian word for "Friend"?',
    audioText: 'Draugas',
    options: [
      { lt: 'Draugas', en: 'Friend (male)' },
      { lt: 'Brolis', en: 'Brother' },
      { lt: 'Kaimynas', en: 'Neighbor' },
      { lt: 'Mokytojas', en: 'Teacher' },
    ],
    correctAnswer: 'Draugas',
    explanation: '„Draugas“ = male friend, „draugė“ = female friend.',
  },
  {
    id: 'bq-29',
    category: 'Kultūra ir Gyvenimas • Culture & Daily Life',
    prompt: 'Ką reiškia mūsų programėlės vardas „Sėkmės!“?',
    englishSubtitle: 'What does our app name "Sėkmės!" mean in English?',
    audioText: 'Sėkmės!',
    options: [
      { lt: 'Sėkmės!', en: 'Good luck / Success!' },
      { lt: 'Sveiki!', en: 'Hello / Welcome!' },
      { lt: 'Ačiū!', en: 'Thank you!' },
      { lt: 'Viso gero!', en: 'All the best / Goodbye!' },
    ],
    correctAnswer: 'Sėkmės!',
    explanation: '„Sėkmės!“ comes from „sėkmė“ (success/fortune) and means "Good luck! / Wishing you success!".',
  },
  {
    id: 'bq-30',
    category: 'Kultūra ir Gyvenimas • Culture & Daily Life',
    prompt: 'Ką reiškia raminanti frazė „Viskas gerai“?',
    englishSubtitle: 'What does the reassuring phrase "Viskas gerai" mean?',
    audioText: 'Viskas gerai',
    options: [
      { lt: 'Viskas gerai', en: 'Everything is fine / All good' },
      { lt: 'Niekas negerai', en: 'Nothing is good' },
      { lt: 'Dar ne', en: 'Not yet' },
      { lt: 'Atsiprašau', en: 'Excuse me' },
    ],
    correctAnswer: 'Viskas gerai',
    explanation: '„Viskas gerai“ = Everything is fine / All is well.',
  },
];

// Helper to get 5 randomized questions for a battle round
export function getRandomBattleQuestions(count: number = 5): BattleQuestion[] {
  const shuffled = [...BATTLE_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
