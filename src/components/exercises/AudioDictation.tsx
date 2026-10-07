'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Snail, Keyboard, Sparkles } from 'lucide-react';
import { AudioDictationExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';

interface AudioDictationProps {
  exercise: AudioDictationExercise;
  assembledWords: string[];
  onChange: (words: string[]) => void;
  typedAnswer?: string;
  onTypedChange?: (val: string) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const AudioDictation: React.FC<AudioDictationProps> = ({
  exercise,
  assembledWords,
  onChange,
  typedAnswer = '',
  onTypedChange,
  isChecked,
  isCorrect,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowPlaying, setIsSlowPlaying] = useState(false);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Auto-play speech on first mount of exercise
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlay(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [exercise.id]);

  const handlePlay = (slow: boolean = false) => {
    if (slow) {
      setIsSlowPlaying(true);
    } else {
      setIsPlaying(true);
    }

    sounds.speak(exercise.targetSentence, {
      slow,
      onEnd: () => {
        setIsPlaying(false);
        setIsSlowPlaying(false);
      },
    });
  };

  // Remaining available tokens from word bank
  const getRemainingTokens = () => {
    const currentCounts = assembledWords.reduce<Record<string, number>>((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return exercise.words.map((word, index) => {
      const neededCount = (currentCounts[word] || 0);
      const usedBeforeThis = exercise.words
        .slice(0, index)
        .filter(w => w === word).length;
      const isUsed = usedBeforeThis < neededCount;

      return { word, index, isUsed };
    });
  };

  const handleSelectWord = (word: string) => {
    if (isChecked) return;
    sounds.playClick();
    onChange([...assembledWords, word]);
  };

  const handleRemoveWord = (indexToRemove: number) => {
    if (isChecked) return;
    sounds.playClick();
    onChange(assembledWords.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Title & Prompt */}
      <div className="w-full text-center sm:text-left mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Listening Comprehension • Klausymas
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt ? (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            {exercise.subPrompt}
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-500 mt-1">
            Listen carefully and reconstruct the Lithuanian sentence.
          </p>
        )}
      </div>

      {/* Audio Control Center */}
      <div className="w-full bg-slate-50 border-2 border-slate-200/80 rounded-3xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Normal Speed Button */}
          <button
            type="button"
            onClick={() => handlePlay(false)}
            disabled={isPlaying || isSlowPlaying}
            className={`btn-3d flex items-center justify-center gap-2 h-16 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-base shadow-md transition-transform active:scale-95 ${
              isPlaying ? 'ring-4 ring-sky-300 ring-offset-2 animate-pulse' : ''
            }`}
            title="Listen at normal speed"
          >
            <Volume2 className="w-7 h-7" />
            <span>Klausyti</span>
          </button>

          {/* Slow Speed Button (Turtle) */}
          <button
            type="button"
            onClick={() => handlePlay(true)}
            disabled={isPlaying || isSlowPlaying}
            className={`btn-3d flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md transition-transform active:scale-95 ${
              isSlowPlaying ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : ''
            }`}
            title="Listen slowly (slow rate)"
          >
            <Snail className="w-7 h-7" />
          </button>
        </div>

        {/* Input Toggle / Hint Buttons */}
        <div className="flex items-center gap-2">
          {exercise.translationHint && (
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              {showHint ? exercise.translationHint : '💡 Show English hint'}
            </button>
          )}

          {onTypedChange && (
            <button
              type="button"
              onClick={() => setUseKeyboard(!useKeyboard)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
              title={useKeyboard ? 'Switch to word bank' : 'Switch to keyboard input'}
            >
              <Keyboard className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Input Mode: Keyboard or Word Bank */}
      {useKeyboard && onTypedChange ? (
        <div className="w-full mb-6">
          <textarea
            value={typedAnswer}
            onChange={(e) => onTypedChange(e.target.value)}
            disabled={isChecked}
            placeholder="Type what you hear in Lithuanian..."
            rows={3}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-lg font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all resize-none"
          />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6 mb-4">
          {/* Assembled Tray Area */}
          <div
            className={`min-h-[90px] w-full rounded-2xl border-2 border-dashed p-4 flex flex-wrap gap-2.5 items-center transition-all ${
              assembledWords.length === 0
                ? 'border-slate-300 bg-slate-50/70 justify-center'
                : 'border-slate-300 bg-white justify-start'
            }`}
          >
            {assembledWords.length === 0 ? (
              <span className="text-sm font-bold text-slate-400 select-none">
                Tap words below in the order you hear them
              </span>
            ) : (
              assembledWords.map((word, idx) => (
                <button
                  key={`assembled-${word}-${idx}`}
                  type="button"
                  onClick={() => handleRemoveWord(idx)}
                  disabled={isChecked}
                  className="btn-3d px-4 py-2.5 rounded-xl bg-sky-500 text-white font-black text-base shadow-sm border-b-3 border-sky-700 active:scale-95 animate-pop"
                >
                  {word}
                </button>
              ))
            )}
          </div>

          {/* Word Token Bank */}
          <div className="flex flex-wrap gap-2.5 justify-center pt-2 min-h-[90px]">
            {getRemainingTokens().map(({ word, index, isUsed }) => (
              <button
                key={`bank-${word}-${index}`}
                type="button"
                onClick={() => handleSelectWord(word)}
                disabled={isUsed || isChecked}
                className={`btn-3d px-4 py-2.5 rounded-xl font-black text-base transition-all ${
                  isUsed
                    ? 'bg-slate-200 text-slate-300 border-b-2 border-slate-200 cursor-not-allowed opacity-40 shadow-none'
                    : 'bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 shadow-sm active:scale-95'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
