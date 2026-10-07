'use client';

import React, { useState, useMemo } from 'react';
import { GRAMMAR_EXERCISES } from '@/data/grammar';
import { AudioSpeaker } from './AudioSpeaker';
import { sounds } from '@/lib/audio';
import {
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  BookOpen,
  Shuffle,
} from 'lucide-react';

interface GrammarExerciseRunnerProps {
  initialCategory?: 'all' | 'cases' | 'vocative' | 'prepositions' | 'locative' | 'verbs' | 'time';
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics • Visos temos', icon: '🎯' },
  { id: 'cases', label: '7 Linksniai • Noun Cases', icon: '📘' },
  { id: 'vocative', label: 'Šauksmininkas • Vocative', icon: '🗣️' },
  { id: 'prepositions', label: 'į vs pas • Prepositions', icon: '📍' },
  { id: 'locative', label: 'Vietininkas • Locative (Kur?)', icon: '🗺️' },
  { id: 'verbs', label: 'Veiksmažodžiai • Verbs', icon: '⚡' },
  { id: 'time', label: 'Laikas • Time Expressions', icon: '⏰' },
] as const;

export const GrammarExerciseRunner: React.FC<GrammarExerciseRunnerProps> = ({
  initialCategory = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [shuffleOrder, setShuffleOrder] = useState<number[] | null>(null);

  // Filter exercises by category
  const baseExercises = useMemo(() => {
    if (selectedCategory === 'all') return GRAMMAR_EXERCISES;
    return GRAMMAR_EXERCISES.filter((ex) => ex.category === selectedCategory);
  }, [selectedCategory]);

  const filteredExercises = useMemo(() => {
    if (!shuffleOrder) return baseExercises;
    return shuffleOrder.map((idx) => baseExercises[idx]).filter(Boolean);
  }, [baseExercises, shuffleOrder]);

  // Clamp current index
  const safeIndex = Math.min(currentIndex, Math.max(0, filteredExercises.length - 1));
  const currentExercise = filteredExercises[safeIndex];

  const isCorrect = isChecked && selectedOption === currentExercise?.correctAnswer;

  const handleSelectOption = (opt: string) => {
    if (isChecked) return;
    sounds.playClick();
    setSelectedOption(opt);
  };

  const handleCheck = () => {
    if (!selectedOption || isChecked || !currentExercise) return;

    const correct = selectedOption === currentExercise.correctAnswer;
    setIsChecked(true);
    setTotalAnswered((prev) => prev + 1);

    if (correct) {
      sounds.playSuccess();
      setStreak((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
    } else {
      sounds.playError();
      setStreak(0);
    }
  };

  const handleNext = () => {
    sounds.playClick();
    setIsChecked(false);
    setSelectedOption(null);
    if (currentIndex + 1 < filteredExercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back or cycle
    }
  };

  const handleCategoryChange = (catId: string) => {
    sounds.playClick();
    setSelectedCategory(catId);
    setShuffleOrder(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
  };

  const handleShuffle = () => {
    sounds.playClick();
    const indices = Array.from({ length: baseExercises.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffleOrder(indices);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
  };

  if (!currentExercise) {
    return (
      <div className="rounded-3xl bg-white border-2 border-slate-200 p-8 text-center">
        <p className="text-slate-500 font-bold">No exercises found for this category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
        <div className="flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Exercise {safeIndex + 1} of {filteredExercises.length}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Streak: {streak}</span>
          </div>
          {totalAnswered > 0 && (
            <span className="hidden sm:inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Accuracy: {Math.round((correctCount / totalAnswered) * 100)}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          title="Shuffle Questions"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Main Exercise Card */}
      <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Category & Audio Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              {currentExercise.categoryLabel}
            </span>
          </div>

          <AudioSpeaker text={currentExercise.audioText} size="md" as="button" />
        </div>

        {/* Prompt Instruction */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Instruction:
          </h3>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {currentExercise.prompt}
          </p>
        </div>

        {/* Sentence Display with Blank Highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-2 border-emerald-200/90 p-5 sm:p-6 text-center">
          <div className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed tracking-wide">
            {currentExercise.sentence.split('_____').map((part, idx, arr) => (
              <React.Fragment key={idx}>
                <span>{part}</span>
                {idx < arr.length - 1 && (
                  <span
                    className={`inline-block min-w-[120px] px-3 py-1 mx-2 rounded-xl border-2 font-mono text-lg transition-all ${
                      isChecked
                        ? isCorrect
                          ? 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-sm'
                          : 'bg-rose-500 text-white border-rose-600 font-extrabold shadow-sm line-through'
                        : selectedOption
                        ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                        : 'bg-white text-slate-400 border-dashed border-emerald-300'
                    }`}
                  >
                    {selectedOption || '_______'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="mt-3 text-xs sm:text-sm font-semibold text-emerald-900/70 italic">
            Translation: &quot;{currentExercise.translation}&quot;
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentExercise.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isOptionCorrect = option === currentExercise.correctAnswer;

            let buttonStyles =
              'bg-slate-50 border-2 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300';

            if (isChecked) {
              if (isOptionCorrect) {
                buttonStyles =
                  'bg-emerald-100 border-2 border-emerald-500 text-emerald-900 font-black shadow-xs';
              } else if (isSelected && !isCorrect) {
                buttonStyles =
                  'bg-rose-100 border-2 border-rose-400 text-rose-900 line-through';
              } else {
                buttonStyles = 'bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              buttonStyles =
                'bg-sky-50 border-2 border-sky-500 text-sky-900 font-extrabold shadow-xs scale-[1.01]';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isChecked}
                onClick={() => handleSelectOption(option)}
                className={`py-4 px-5 rounded-2xl text-left font-bold text-base transition-all flex items-center justify-between ${buttonStyles}`}
              >
                <span>{option}</span>
                {isChecked && isOptionCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                {isChecked && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Post-Check Rule Deep Dive Explanation */}
        {isChecked && (
          <div
            className={`rounded-2xl p-5 border-2 animate-pop ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                )}
                <h4 className="text-base sm:text-lg font-black">
                  {isCorrect ? 'Nuostabu! Teisingai! (Excellent!)' : 'Neteisingai (Incorrect)'}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500">Listen:</span>
                <AudioSpeaker text={currentExercise.fullSentence} size="sm" as="button" />
              </div>
            </div>

            {!isCorrect && (
              <p className="text-sm font-semibold mb-2">
                Correct answer was:{' '}
                <strong className="underline font-black text-rose-900">
                  {currentExercise.correctAnswer}
                </strong>{' '}
                → <em>&quot;{currentExercise.fullSentence}&quot;</em>
              </p>
            )}

            {/* In-depth Grammar Rule Explanation */}
            <div className="mt-3 pt-3 border-t border-black/10 text-xs sm:text-sm font-medium leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span>Grammar Rule Explanation:</span>
              </div>
              <p className="text-slate-800">{currentExercise.ruleExplanation}</p>
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-medium">
            {!isChecked
              ? 'Select an option to test your understanding'
              : 'Review the grammar rule and move to the next drill'}
          </div>

          <div className="w-full sm:w-auto">
            {!isChecked ? (
              <button
                type="button"
                disabled={!selectedOption}
                onClick={handleCheck}
                className="btn-3d btn-green-3d w-full sm:w-52 py-3.5 text-center font-black tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <span>CHECK ANSWER</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="btn-3d btn-blue-3d w-full sm:w-52 py-3.5 text-center font-black tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <span>NEXT DRILL</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
