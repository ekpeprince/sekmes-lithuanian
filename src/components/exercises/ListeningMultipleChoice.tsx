'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Snail, Headphones, CheckCircle2, XCircle } from 'lucide-react';
import { ListeningMultipleChoiceExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';

interface ListeningMultipleChoiceProps {
  exercise: ListeningMultipleChoiceExercise;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const ListeningMultipleChoice: React.FC<ListeningMultipleChoiceProps> = ({
  exercise,
  selectedAnswer,
  onSelect,
  isChecked,
  isCorrect,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowPlaying, setIsSlowPlaying] = useState(false);

  const audioContent = exercise.audioDialogue || exercise.audioText || exercise.correctAnswer;

  const handlePlay = useCallback((slow: boolean = false) => {
    if (!audioContent) return;
    if (slow) {
      setIsSlowPlaying(true);
    } else {
      setIsPlaying(true);
    }

    sounds.speak(audioContent, {
      slow,
      onEnd: () => {
        setIsPlaying(false);
        setIsSlowPlaying(false);
      },
    });
  }, [audioContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlay(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [handlePlay]);

  const handleOptionClick = (option: string) => {
    if (isChecked) return;
    sounds.playClick();
    onSelect(option);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Category Tag */}
      <div className="w-full text-center sm:text-left mb-3 sm:mb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-1.5">
          <Headphones className="w-3 h-3" />
          Listening Comprehension • Pasiklausymas
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt && (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            {exercise.subPrompt}
          </p>
        )}
      </div>

      {/* Audio Playback Box */}
      <div className="w-full bg-slate-50 border-2 border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 mb-3 sm:mb-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handlePlay(false)}
            disabled={isPlaying || isSlowPlaying}
            className={`btn-3d flex items-center justify-center gap-2 h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs sm:text-base shadow-md active:scale-95 ${
              isPlaying ? 'ring-4 ring-sky-300 ring-offset-2 animate-pulse' : ''
            }`}
          >
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Klausytis frazės</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlay(true)}
            disabled={isPlaying || isSlowPlaying}
            className={`btn-3d flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md active:scale-95 ${
              isSlowPlaying ? 'ring-4 ring-amber-300 ring-offset-2 animate-pulse' : ''
            }`}
            title="Lėtai (Slow)"
          >
            <Snail className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {isChecked && audioContent && (
          <div className="text-right">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Nuorašas</span>
            <span className="text-xs sm:text-sm font-black text-slate-700 italic">“{audioContent}”</span>
          </div>
        )}
      </div>

      {/* Sub-question */}
      {exercise.question && (
        <div className="w-full mb-2 sm:mb-3 px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-700">{exercise.question}</h3>
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full">
        {exercise.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          let buttonStyle = 'bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800';

          if (isChecked) {
            if (option === exercise.correctAnswer) {
              buttonStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200';
            } else if (isSelected && !isCorrect) {
              buttonStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-900 ring-2 ring-rose-200';
            } else {
              buttonStyle = 'bg-white border-2 border-slate-200 text-slate-400 opacity-60';
            }
          } else if (isSelected) {
            buttonStyle = 'bg-sky-50 border-2 border-sky-500 text-sky-900 ring-2 ring-sky-200';
          }

          return (
            <button
              key={`option-${option}-${idx}`}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={isChecked}
              className={`btn-3d relative w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base text-left flex items-center justify-between transition-all active:scale-[0.99] ${buttonStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                  {idx + 1}
                </span>
                <span>{option}</span>
              </div>

              {isChecked && option === exercise.correctAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {isChecked && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
