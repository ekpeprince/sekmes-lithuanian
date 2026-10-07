'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { X, Heart, AlertCircle, RefreshCw, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { getLessonById, getNextLessonId } from '@/data/curriculum';
import { useGame } from '@/context/GameContext';
import { MultipleChoice } from '@/components/exercises/MultipleChoice';
import { WordBankOrder } from '@/components/exercises/WordBankOrder';
import { FillInTheBlank } from '@/components/exercises/FillInTheBlank';
import { MatchPairs } from '@/components/exercises/MatchPairs';
import { DialogueFill } from '@/components/exercises/DialogueFill';
import { AudioDictation } from '@/components/exercises/AudioDictation';
import { ListeningMultipleChoice } from '@/components/exercises/ListeningMultipleChoice';
import { SpeakingPronounce } from '@/components/exercises/SpeakingPronounce';
import { LessonFeedbackBar } from '@/components/LessonFeedbackBar';
import { LessonCompleteModal } from '@/components/LessonCompleteModal';
import { sounds } from '@/lib/audio';


interface LessonPageProps {
  params: Promise<{ lessonId: string }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = use(params);
  const lesson = getLessonById(resolvedParams.lessonId);
  const router = useRouter();

  const { progress, loseHeart, refillHearts, finishLesson, addMistake } = useGame();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [typedDictation, setTypedDictation] = useState('');
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [speakingPassed, setSpeakingPassed] = useState(false);
  const [matchPairsCompleted, setMatchPairsCompleted] = useState(false);

  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showOutOfHeartsModal, setShowOutOfHeartsModal] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [mistakesCount, setMistakesCount] = useState(0);

  if (!lesson) {
    notFound();
  }

  const currentExercise = lesson.exercises[currentIndex];
  const progressPercent = ((currentIndex) / lesson.exercises.length) * 100;
  const nextLessonId = getNextLessonId(lesson.id);

  // Check if answer is provided and can be checked
  const canCheck = (() => {
    if (isChecked) return false;
    switch (currentExercise.type) {
      case 'multiple_choice':
      case 'fill_in_the_blank':
      case 'dialogue_fill':
      case 'listening_multiple_choice':
        return selectedAnswer !== null && selectedAnswer.trim() !== '';
      case 'word_bank_order':
        return assembledWords.length > 0;
      case 'audio_dictation':
        return assembledWords.length > 0 || typedDictation.trim().length > 0;
      case 'speaking_pronounce':
        return speakingText !== null;
      case 'match_pairs':
        return matchPairsCompleted;
      default:
        return false;
    }
  })();

  const getCorrectAnswerString = (): string => {
    switch (currentExercise.type) {
      case 'multiple_choice':
      case 'fill_in_the_blank':
      case 'dialogue_fill':
      case 'listening_multiple_choice':
        return currentExercise.correctAnswer;
      case 'word_bank_order':
        return currentExercise.correctSequence.join(' ');
      case 'audio_dictation':
        return currentExercise.targetSentence;
      case 'speaking_pronounce':
        return currentExercise.targetPhrase;
      case 'match_pairs':
        return 'All pairs matched!';
      default:
        return '';
    }
  };

  const handleCheck = () => {
    let correct = false;

    switch (currentExercise.type) {
      case 'multiple_choice':
      case 'fill_in_the_blank':
      case 'dialogue_fill':
      case 'listening_multiple_choice':
        correct = selectedAnswer === currentExercise.correctAnswer;
        break;
      case 'word_bank_order':
        correct =
          assembledWords.join(' ').trim().toLowerCase() ===
          currentExercise.correctSequence.join(' ').trim().toLowerCase();
        break;
      case 'audio_dictation': {
        const assembled = assembledWords.join(' ').trim().toLowerCase().replace(/[.,!?;:]/g, '');
        const typed = typedDictation.trim().toLowerCase().replace(/[.,!?;:]/g, '');
        const target = currentExercise.targetSentence.trim().toLowerCase().replace(/[.,!?;:]/g, '');
        correct = assembled === target || typed === target;
        break;
      }
      case 'speaking_pronounce':
        correct = speakingPassed;
        break;
      case 'match_pairs':
        correct = matchPairsCompleted;
        break;
    }

    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      sounds.playSuccess();
    } else {
      sounds.playError();
      setMistakesCount(prev => prev + 1);

      // Record mistake into user's Mistakes Bank
      addMistake({
        id: `${lesson.id}-${currentExercise.id}`,
        exercisePrompt: currentExercise.prompt,
        correctAnswer: getCorrectAnswerString(),
        userAnswer: selectedAnswer || assembledWords.join(' ') || typedDictation || speakingText || undefined,
        explanation: currentExercise.explanation,
        audioText:
          currentExercise.audioText ||
          ('targetSentence' in currentExercise ? (currentExercise as { targetSentence: string }).targetSentence : undefined) ||
          ('targetPhrase' in currentExercise ? (currentExercise as { targetPhrase: string }).targetPhrase : undefined),
      });

      const hasHearts = loseHeart();
      if (!hasHearts) {
        setShowOutOfHeartsModal(true);
      }
    }
  };

  const handleContinue = () => {
    sounds.playClick();
    if (currentIndex + 1 < lesson.exercises.length) {
      setCurrentIndex(prev => prev + 1);
      // Reset state for next exercise
      setSelectedAnswer(null);
      setAssembledWords([]);
      setTypedDictation('');
      setSpeakingText(null);
      setSpeakingPassed(false);
      setMatchPairsCompleted(false);
      setIsChecked(false);
      setIsCorrect(null);
    } else {
      // Finished all exercises!
      finishLesson(lesson.id, lesson.xpReward);
      setIsLessonFinished(true);
    }
  };


  // Called when match pairs has an error
  const handleMatchPairsMistake = () => {
    setMistakesCount(prev => prev + 1);
    const hasHearts = loseHeart();
    if (!hasHearts) {
      setShowOutOfHeartsModal(true);
    }
  };

  const accuracy = Math.max(
    0,
    Math.round(((lesson.exercises.length) / (lesson.exercises.length + mistakesCount)) * 100)
  );

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-white flex flex-col overflow-hidden select-none">
      {/* Top Header Bar (Unified compact top bar: Exit, Progress, Guide, Hearts) */}
      <header className="shrink-0 z-30 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Exit lesson"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
          </button>

          {/* Progress Bar */}
          <div className="h-3 sm:h-3.5 flex-1 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Guide Button */}
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 font-bold text-xs px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition shadow-2xs"
              title="Lesson Grammar Guide"
            >
              <Lightbulb className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="hidden xs:inline sm:inline">Guide</span>
            </button>

            {/* Hearts Display */}
            <div className="flex items-center gap-1 font-black text-rose-500 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-xl text-xs sm:text-sm">
              <Heart className="h-4 w-4 fill-rose-500" />
              <span>{progress.hearts}</span>
            </div>
          </div>
        </div>
      </header>

      {/* English Study Guide Modal Overlay */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-emerald-200 text-left">
            <div className="flex items-start justify-between gap-4 mb-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block mb-0.5">
                  💡 Lesson Study Guide • Paaiškinimas
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {lesson.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
                aria-label="Close guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {lesson.subExplanation && (
                <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {lesson.subExplanation}
                </p>
              )}

              {lesson.detailedExplanation && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs sm:text-sm text-slate-800 space-y-2 whitespace-pre-line leading-relaxed font-normal">
                  {lesson.detailedExplanation}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="btn-3d w-full mt-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Continue Lesson
            </button>
          </div>
        </div>
      )}

      {/* Main Exercise Area (Centered & Viewport-fitted without page scroll) */}
      <main className="flex-1 min-h-0 w-full max-w-xl mx-auto px-4 py-2 sm:py-4 flex flex-col justify-center overflow-y-auto pb-24 sm:pb-28">
        {currentExercise.type === 'multiple_choice' && (
          <MultipleChoice
            exercise={currentExercise}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'word_bank_order' && (
          <WordBankOrder
            exercise={currentExercise}
            assembledWords={assembledWords}
            onChange={setAssembledWords}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'fill_in_the_blank' && (
          <FillInTheBlank
            exercise={currentExercise}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'match_pairs' && (
          <MatchPairs
            exercise={currentExercise}
            onAllMatched={() => {
              setMatchPairsCompleted(true);
              setIsChecked(true);
              setIsCorrect(true);
            }}
            onMistake={handleMatchPairsMistake}
            isChecked={isChecked}
          />
        )}

        {currentExercise.type === 'dialogue_fill' && (
          <DialogueFill
            exercise={currentExercise}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'audio_dictation' && (
          <AudioDictation
            exercise={currentExercise}
            assembledWords={assembledWords}
            onChange={setAssembledWords}
            typedAnswer={typedDictation}
            onTypedChange={setTypedDictation}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'listening_multiple_choice' && (
          <ListeningMultipleChoice
            exercise={currentExercise}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}

        {currentExercise.type === 'speaking_pronounce' && (
          <SpeakingPronounce
            exercise={currentExercise}
            spokenText={speakingText}
            onSpoken={(text, isPassing) => {
              setSpeakingText(text);
              setSpeakingPassed(isPassing);
            }}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        )}
      </main>


      {/* Bottom Fixed Action Bar */}
      <LessonFeedbackBar
        isChecked={isChecked}
        isCorrect={isCorrect}
        correctAnswer={getCorrectAnswerString()}
        explanation={currentExercise.explanation}
        canCheck={canCheck}
        onCheck={handleCheck}
        onContinue={handleContinue}
      />

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center border-2 border-slate-100">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Quit lesson?
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              All progress in this lesson will be lost if you leave now. Are you sure?
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="btn-3d btn-green-3d w-full py-3 text-center"
              >
                KEEP LEARNING
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="rounded-2xl border-2 border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50"
              >
                END SESSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Hearts Modal */}
      {showOutOfHeartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center border-4 border-rose-300">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
              <Heart className="h-10 w-10 fill-rose-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Out of Hearts!
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              You need hearts to keep answering drills. Refill your hearts now for free to continue this lesson!
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  refillHearts();
                  setShowOutOfHeartsModal(false);
                }}
                className="btn-3d btn-green-3d w-full py-3.5 text-center flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                REFILL 5 HEARTS & CONTINUE
              </button>
              <Link
                href="/"
                className="rounded-2xl border-2 border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50 block"
              >
                RETURN HOME
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Complete Modal */}
      {isLessonFinished && (
        <LessonCompleteModal
          xpEarned={lesson.xpReward}
          heartsRemaining={progress.hearts}
          accuracy={accuracy}
          streak={progress.streak}
          nextLessonId={nextLessonId}
        />
      )}
    </div>
  );
}
