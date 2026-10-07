'use client';

import React from 'react';
import { MultipleChoiceExercise } from '@/types/lesson';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { sounds } from '@/lib/audio';

interface MultipleChoiceProps {
  exercise: MultipleChoiceExercise;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  exercise,
  selectedAnswer,
  onSelect,
  isChecked,
  isCorrect,
}) => {
  const handleOptionClick = (option: string) => {
    if (isChecked) return;
    sounds.playClick();
    onSelect(option);
  };

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
              Listen to the phrase
            </span>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {exercise.options.map((option, index) => {
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
            <div
              key={index}
              role="button"
              tabIndex={isChecked ? -1 : 0}
              aria-disabled={isChecked}
              onClick={() => handleOptionClick(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(option);
                }
              }}
              className={`btn-option-3d w-full p-4 rounded-2xl flex items-center justify-between text-left font-bold text-base sm:text-lg transition-all cursor-pointer select-none ${
                isChecked ? 'pointer-events-none' : ''
              } ${stateClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-xs font-black text-slate-500">
                  {index + 1}
                </span>
                <span className="leading-snug">{option}</span>
              </div>

              {/* Pronunciation button for Lithuanian options */}
              <AudioSpeaker text={option} size="sm" as="span" className="shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
