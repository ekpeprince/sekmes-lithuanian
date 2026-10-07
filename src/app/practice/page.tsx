'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Heart,
  Trophy,
  Play,
  Zap,
  Layers,
  Target,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { UNITS } from '@/data/curriculum';
import { useGame } from '@/context/GameContext';
import { sounds } from '@/lib/audio';
import { AudioSpeaker } from '@/components/AudioSpeaker';

type PracticeTab = 'speed_drill' | 'flashcards' | 'mistakes_bank' | 'lessons';

// High-frequency curated flashcard pairs across A1 Lithuanian
const VOCABULARY_DECK = [
  { lt: 'Labas rytas', en: 'Good morning', note: 'Greeting (masculine rytas)' },
  { lt: 'Laba diena', en: 'Good afternoon / Good day', note: 'Greeting (feminine diena)' },
  { lt: 'Labas vakaras', en: 'Good evening', note: 'Greeting (vakaras)' },
  { lt: 'Ačiū labai', en: 'Thank you very much', note: 'Polite expression' },
  { lt: 'Prašom', en: 'You are welcome / Please', note: 'Universal polite response' },
  { lt: 'Atsiprašau', en: 'Excuse me / Sorry', note: 'Apology or polite interruption' },
  { lt: 'Iki pasimatymo', en: 'See you later / Goodbye', note: 'Farewell' },
  { lt: 'Kaip sekasi?', en: 'How are you? / How is it going?', note: 'Informal greeting question' },
  { lt: 'Aš esu iš Lietuvos', en: 'I am from Lithuania', note: 'Verb būti + iš + Genitive' },
  { lt: 'Kiek tai kainuoja?', en: 'How much does it cost?', note: 'Asking price' },
  { lt: 'Norėčiau kavos su pienu', en: 'I would like coffee with milk', note: 'Café order with Genitive & Instrumental' },
  { lt: 'Ar galima mokėti kortele?', en: 'Can I pay by card?', note: 'Instrumental: kortele' },
  { lt: 'Kur yra stotelė?', en: 'Where is the bus stop?', note: 'Direction question' },
  { lt: 'Eikite tiesiai ir į dešinę', en: 'Walk straight ahead and to the right', note: 'Directions command' },
  { lt: 'Čia yra jūsų raktas', en: 'Here is your key', note: 'Hotel amenity' },
  { lt: 'Katedros aikštė', en: 'Cathedral Square (Vilnius)', note: 'Famous landmark' },
];

export default function PracticePage() {
  const {
    progress,
    refillHearts,
    resolveMistakeById,
    saveSpeedDrillScoreVal,
  } = useGame();

  const [activeTab, setActiveTab] = useState<PracticeTab>('speed_drill');

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);

  // Speed drill state
  const [drillActive, setDrillActive] = useState(false);
  const [drillTimeLeft, setDrillTimeLeft] = useState(60);
  const [drillScore, setDrillScore] = useState(0);
  const [drillCombo, setDrillCombo] = useState(0);
  const [drillQuestionIndex, setDrillQuestionIndex] = useState(0);
  const [drillFinished, setDrillFinished] = useState(false);

  // Speed drill pool generated from curriculum exercises
  const speedQuestions = useMemo(() => {
    return [
      { q: 'How do you say "Thank you"?', correct: 'Ačiū', options: ['Ačiū', 'Prašom', 'Labas', 'Taip'] },
      { q: 'What does "Laba diena" mean?', correct: 'Good afternoon', options: ['Good afternoon', 'Good night', 'Goodbye', 'Good morning'] },
      { q: '"Kaip sekasi?" translates to:', correct: 'How are you?', options: ['How are you?', 'Where are you?', 'Who is it?', 'What time is it?'] },
      { q: 'Translate "Coffee with milk":', correct: 'Kava su pienu', options: ['Kava su pienu', 'Arbata su cukrumi', 'Vanduo su citrina', 'Sultys'] },
      { q: '"Kiek tai kainuoja?" means:', correct: 'How much does this cost?', options: ['How much does this cost?', 'Where is this place?', 'When does it start?', 'Who made this?'] },
      { q: '"Eikite tiesiai" directs you to:', correct: 'Walk straight ahead', options: ['Walk straight ahead', 'Turn right', 'Turn left', 'Stop here'] },
      { q: 'What is "One euro" in Lithuanian?', correct: 'Vienas euras', options: ['Vienas euras', 'Du eurai', 'Dešimt eurų', 'Nulis eurų'] },
      { q: '"Aš esu studentas" means:', correct: 'I am a student', options: ['I am a student', 'You are a student', 'He is a teacher', 'We are studying'] },
      { q: 'How do you say "Excuse me / Sorry"?', correct: 'Atsiprašau', options: ['Atsiprašau', 'Prašau', 'Sveiki', 'Viso'] },
      { q: 'What does "Stotis" mean?', correct: 'Station (train/bus)', options: ['Station (train/bus)', 'Library', 'Airport', 'Hotel'] },
      { q: '"Į dešinę" means:', correct: 'To the right', options: ['To the right', 'To the left', 'Behind', 'Straight'] },
      { q: 'What is the Lithuanian word for "Bread"?', correct: 'Duona', options: ['Duona', 'Sūris', 'Medus', 'Pienas'] },
    ];
  }, []);

  // Speed drill timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (drillActive && drillTimeLeft > 0) {
      timer = setInterval(() => {
        setDrillTimeLeft((prev) => {
          if (prev <= 1) {
            setDrillActive(false);
            setDrillFinished(true);
            sounds.playLevelComplete();
            saveSpeedDrillScoreVal(drillScore);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [drillActive, drillTimeLeft, drillScore, saveSpeedDrillScoreVal]);

  const startSpeedDrill = () => {
    sounds.playClick();
    setDrillTimeLeft(60);
    setDrillScore(0);
    setDrillCombo(0);
    setDrillQuestionIndex(0);
    setDrillFinished(false);
    setDrillActive(true);
  };

  const handleDrillAnswer = (option: string) => {
    const currentQ = speedQuestions[drillQuestionIndex % speedQuestions.length];
    if (option === currentQ.correct) {
      sounds.playSuccess();
      const comboMultiplier = drillCombo >= 4 ? 2 : drillCombo >= 2 ? 1.5 : 1;
      const points = Math.round(10 * comboMultiplier);
      setDrillScore((prev) => prev + points);
      setDrillCombo((prev) => prev + 1);
    } else {
      sounds.playError();
      setDrillCombo(0);
    }
    setDrillQuestionIndex((prev) => prev + 1);
  };

  const currentFlashcard = VOCABULARY_DECK[cardIndex];

  const handleNextCard = () => {
    sounds.playClick();
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % VOCABULARY_DECK.length);
  };

  const handlePrevCard = () => {
    sounds.playClick();
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + VOCABULARY_DECK.length) % VOCABULARY_DECK.length);
  };

  const markKnown = () => {
    sounds.playSuccess();
    if (!knownCards.includes(cardIndex)) {
      setKnownCards([...knownCards, cardIndex]);
    }
    handleNextCard();
  };

  const mistakes = progress.mistakesBank || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Dumbbell className="h-5 w-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-sky-600">
                Practice Gym • Treniruoklis
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Mastery & Practice Drills
            </h1>
            <p className="mt-1 text-sm text-slate-600 font-medium">
              Sharpen your speed, review flashcards, and clear missed mistakes with zero heart penalty!
            </p>
          </div>

          {/* Quick Hearts Refill Action */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 px-3 font-black text-rose-500">
              <Heart className="h-5 w-5 fill-rose-500" />
              <span>{progress.hearts}/5</span>
            </div>
            <button
              type="button"
              onClick={() => refillHearts()}
              className="btn-3d px-3.5 py-2 rounded-xl bg-rose-500 text-white font-black text-xs uppercase tracking-wider active:scale-95 shadow-xs"
            >
              Refill Hearts
            </button>
          </div>
        </div>

        {/* Practice Mode Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('speed_drill'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
              activeTab === 'speed_drill'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>60s Speed Drill</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('flashcards'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Flashcards ({VOCABULARY_DECK.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('mistakes_bank'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
              activeTab === 'mistakes_bank'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Mistakes Bank</span>
            {mistakes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {mistakes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('lessons'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
              activeTab === 'lessons'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed Lessons</span>
          </button>
        </div>

        {/* TAB 1: 60-SECOND SPEED DRILL */}
        {activeTab === 'speed_drill' && (
          <div className="w-full">
            {!drillActive && !drillFinished && (
              <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 p-8 sm:p-10 text-white shadow-xl text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-inner">
                  <Zap className="w-10 h-10 fill-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                  60-Second Lithuanian Blitz
                </h2>
                <p className="text-white/90 text-sm sm:text-base max-w-lg mb-6 font-medium">
                  Answer as many Lithuanian phrases and vocabulary questions as possible in 60 seconds! Build multipliers and beat your personal record.
                </p>

                {progress.speedDrillHighScore ? (
                  <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-xs font-black text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Personal Record: {progress.speedDrillHighScore} pts</span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={startSpeedDrill}
                  className="btn-3d px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg tracking-wide uppercase shadow-lg border-b-4 border-amber-600 active:scale-95"
                >
                  Start 60s Drill (Pradėti)
                </button>
              </div>
            )}

            {drillActive && (
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-md">
                {/* Timer & Score HUD */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-6 h-6 ${drillTimeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-sky-500'}`} />
                    <span className="text-2xl font-black font-mono text-slate-800">
                      {drillTimeLeft}s
                    </span>
                  </div>

                  {drillCombo >= 2 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black animate-bounce">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{drillCombo}X COMBO!</span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Score</span>
                    <span className="text-2xl font-black text-sky-600">{drillScore} pts</span>
                  </div>
                </div>

                {/* Question */}
                <div className="text-center my-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question #{drillQuestionIndex + 1}</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {speedQuestions[drillQuestionIndex % speedQuestions.length].q}
                  </h3>
                </div>

                {/* 4 Fast Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {speedQuestions[drillQuestionIndex % speedQuestions.length].options.map((opt, i) => (
                    <button
                      key={`speed-opt-${opt}-${i}`}
                      type="button"
                      onClick={() => handleDrillAnswer(opt)}
                      className="btn-3d p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border-2 border-slate-200 hover:border-sky-400 text-slate-800 font-black text-base text-center transition-all active:scale-95"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {drillFinished && (
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-8 text-center shadow-lg animate-pop">
                <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1">Time&apos;s Up! Puikus darbas!</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">
                  You completed the 60-second speed blitz.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                    <span className="text-xs font-bold text-sky-600 uppercase">Final Score</span>
                    <p className="text-3xl font-black text-sky-900">{drillScore}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <span className="text-xs font-bold text-amber-600 uppercase">XP Awarded</span>
                    <p className="text-3xl font-black text-amber-900">+{Math.round(drillScore / 2)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startSpeedDrill}
                  className="btn-3d px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase tracking-wider"
                >
                  Play Again (Iš naujo)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FLASHCARDS DECK */}
        {activeTab === 'flashcards' && (
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">
            {/* Card Progress */}
            <div className="w-full flex items-center justify-between text-xs font-black text-slate-500 mb-4 px-2">
              <span>Card {cardIndex + 1} of {VOCABULARY_DECK.length}</span>
              <span className="text-emerald-600">
                Mastered: {knownCards.length}/{VOCABULARY_DECK.length}
              </span>
            </div>

            {/* 3D Flip Card */}
            <div
              onClick={() => { sounds.playClick(); setIsFlipped(!isFlipped); }}
              className="w-full h-80 rounded-3xl bg-white border-2 border-slate-200 shadow-md cursor-pointer select-none p-8 flex flex-col justify-between items-center text-center transition-all hover:border-sky-300 relative group"
            >
              <div className="w-full flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {isFlipped ? 'English Translation' : 'Lithuanian Phrase'}
                </span>
                <AudioSpeaker text={currentFlashcard.lt} size="sm" as="button" />
              </div>

              {/* Main Content */}
              <div className="my-auto">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {isFlipped ? currentFlashcard.en : currentFlashcard.lt}
                </h3>
                {isFlipped && (
                  <p className="text-xs font-bold text-slate-400 mt-2">
                    💡 {currentFlashcard.note}
                  </p>
                )}
              </div>

              <div className="text-xs font-bold text-slate-400 group-hover:text-sky-500 transition-colors">
                Tap card to flip (Spustelėkite apversti)
              </div>
            </div>

            {/* Card Controls */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={handlePrevCard}
                className="btn-3d px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-sm active:scale-95"
              >
                Atgal (Prev)
              </button>

              <button
                type="button"
                onClick={markKnown}
                className="btn-3d px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-wider active:scale-95 shadow-sm"
              >
                Žinau! (Mastered)
              </button>

              <button
                type="button"
                onClick={handleNextCard}
                className="btn-3d px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-sm active:scale-95"
              >
                Kitas (Next)
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: MISTAKES BANK */}
        {activeTab === 'mistakes_bank' && (
          <div className="w-full">
            {mistakes.length === 0 ? (
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  Klaidų bankas tuščias!
                </h3>
                <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">
                  You have cleared all recorded mistakes. Keep practicing lessons and your missed items will be collected here for review!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-lg font-black text-slate-800">
                    Review & Clear Missed Exercises ({mistakes.length})
                  </h3>
                  <span className="text-xs font-bold text-sky-600">
                    +5 XP for each mistake cleared
                  </span>
                </div>

                {mistakes.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-black text-slate-900 mb-1">
                        {m.exercisePrompt}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {m.userAnswer && (
                          <span className="text-rose-600 font-bold">
                            Tavo atsakymas: <span className="line-through">{m.userAnswer}</span>
                          </span>
                        )}
                        <span className="text-emerald-700 font-black">
                          Teisingas atsakymas: {m.correctAnswer}
                        </span>
                      </div>

                      {m.explanation && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          {m.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.audioText && (
                        <AudioSpeaker text={m.audioText} size="sm" as="button" />
                      )}
                      <button
                        type="button"
                        onClick={() => resolveMistakeById(m.id)}
                        className="btn-3d px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider active:scale-95 shadow-xs"
                      >
                        Pataisyta (+5 XP)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPLETED LESSONS REVIEW */}
        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UNITS.flatMap((unit) => unit.lessons).map((lesson) => {
              const isCompleted = progress.completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-200 bg-white hover:border-emerald-400 shadow-xs'
                      : 'border-slate-200 bg-slate-100/60 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {lesson.unitId.toUpperCase()} • Lesson {lesson.order}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Locked</span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-800">
                      {lesson.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {lesson.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {lesson.exercises.length} Exercises
                    </span>
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="btn-3d flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>Review</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
