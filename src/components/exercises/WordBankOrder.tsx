'use client';

import React from 'react';
import { WordBankExercise } from '@/types/lesson';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { sounds } from '@/lib/audio';

interface WordBankOrderProps {
  exercise: WordBankExercise;
  assembledWords: string[];
  onChange: (words: string[]) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const WordBankOrder: React.FC<WordBankOrderProps> = ({
  exercise,
  assembledWords,
  onChange,
  isChecked,
  isCorrect,
}) => {
  // Determine available words pool:
  // Each instance of a word in exercise.words can only be used once.
  // We calculate remaining words accurately even with duplicates.
  const getRemainingWords = () => {
    const counts = new Map<string, number>();
    exercise.words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
    assembledWords.forEach(w => counts.set(w, (counts.get(w) || 0) - 1));

    const remaining: { word: string; index: number }[] = [];
    exercise.words.forEach((w, idx) => {
      const remainingCount = counts.get(w) || 0;
      if (remainingCount > 0) {
        remaining.push({ word: w, index: idx });
        counts.set(w, remainingCount - 1);
      }
    });
    return remaining;
  };

  const handleSelectWord = (word: string) => {
    if (isChecked) return;
    sounds.playClick();
    onChange([...assembledWords, word]);
  };

  const handleRemoveWord = (indexToRemove: number) => {
    if (isChecked) return;
    sounds.playClick();
    const updated = assembledWords.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const remaining = getRemainingWords();

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Exercise Prompt */}
      <div className="w-full mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-2">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt && (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-2">
            {exercise.subPrompt}
          </p>
        )}
        {exercise.audioText && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-sky-50 rounded-2xl border border-sky-200">
            <AudioSpeaker text={exercise.audioText} size="md" showSlow={true} />
            <span className="text-sm font-semibold text-sky-800">
              Listen to the target phrase
            </span>
          </div>
        )}
      </div>

      {/* Answer Sentence Tray */}
      <div
        className={`w-full min-h-[90px] p-4 rounded-2xl border-2 transition-all mb-8 flex flex-wrap items-center gap-2.5 ${
          isChecked
            ? isCorrect
              ? 'border-emerald-400 bg-emerald-50/60'
              : 'border-rose-400 bg-rose-50/60'
            : assembledWords.length > 0
            ? 'border-sky-300 bg-sky-50/40'
            : 'border-dashed border-slate-300 bg-slate-50/60'
        }`}
      >
        {assembledWords.length === 0 ? (
          <span className="text-sm font-medium text-slate-400 italic mx-auto">
            Tap the word blocks below to assemble your answer
          </span>
        ) : (
          assembledWords.map((word, idx) => (
            <button
              key={`assembled-${idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleRemoveWord(idx)}
              className="word-chip animate-pop group hover:border-rose-300"
            >
              <span>{word}</span>
            </button>
          ))
        )}
      </div>

      {/* Horizontal Divider Line */}
      <div className="w-full border-t border-slate-200 mb-6" />

      {/* Available Words Pool */}
      <div className="w-full flex flex-wrap justify-center gap-2.5">
        {exercise.words.map((word, idx) => {
          // Check if this specific item is currently in the remaining list
          const isAvailable = remaining.some(item => item.index === idx);

          return isAvailable ? (
            <button
              key={`bank-${idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleSelectWord(word)}
              className="word-chip"
            >
              {word}
            </button>
          ) : (
            <div
              key={`placeholder-${idx}`}
              className="word-chip-slot"
              style={{ width: `${Math.max(65, word.length * 14)}px` }}
            />
          );
        })}
      </div>
    </div>
  );
};
