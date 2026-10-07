'use client';

import React from 'react';
import { FillInBlankExercise } from '@/types/lesson';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { sounds } from '@/lib/audio';

interface FillInTheBlankProps {
  exercise: FillInBlankExercise;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const FillInTheBlank: React.FC<FillInTheBlankProps> = ({
  exercise,
  selectedAnswer,
  onSelect,
  isChecked,
  isCorrect,
}) => {
  const parts = exercise.sentenceWithBlank.split('___');

  const handleSelect = (option: string) => {
    if (isChecked) return;
    sounds.playClick();
    onSelect(option);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Exercise Prompt */}
      <div className="w-full mb-3 sm:mb-5">
        <h2 className="text-lg sm:text-2xl font-extrabold text-slate-800 mb-1 sm:mb-2">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt && (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
            {exercise.subPrompt}
          </p>
        )}
        {exercise.audioText && (
          <div className="flex items-center gap-2.5 mt-2 p-2 sm:p-3 bg-sky-50 rounded-xl sm:rounded-2xl border border-sky-200">
            <AudioSpeaker text={exercise.audioText} size="sm" showSlow={true} />
            <span className="text-xs sm:text-sm font-semibold text-sky-800">
              Listen to the context
            </span>
          </div>
        )}
      </div>

      {/* Sentence with Interactive Blank Slot */}
      <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 shadow-sm mb-3 sm:mb-6 flex flex-wrap items-center justify-center gap-2 text-lg sm:text-2xl font-extrabold text-slate-800">
        <span>{parts[0]}</span>

        {/* Blank slot container */}
        <span
          className={`inline-flex items-center justify-center min-w-[90px] px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border-2 transition-all font-bold ${
            selectedAnswer
              ? isChecked
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                  : 'border-rose-500 bg-rose-100 text-rose-800'
                : 'border-sky-400 bg-sky-100 text-sky-800 animate-pop'
              : 'border-dashed border-slate-400 bg-slate-50 text-slate-400'
          }`}
        >
          {selectedAnswer || '_____'}
        </span>

        {parts[1] && <span>{parts[1]}</span>}
      </div>

      {/* Option Buttons */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {exercise.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          let stateClass = '';

          if (isChecked) {
            if (option === exercise.correctAnswer) {
              stateClass = 'correct';
            } else if (isSelected && !isCorrect) {
              stateClass = 'incorrect';
            }
          } else if (isSelected) {
            stateClass = 'selected';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isChecked}
              onClick={() => handleSelect(option)}
              className={`btn-option-3d py-4 px-3 rounded-2xl text-center font-bold text-base sm:text-lg transition-all ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};
