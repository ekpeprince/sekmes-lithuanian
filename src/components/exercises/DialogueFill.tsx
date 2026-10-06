'use client';

import React from 'react';
import { DialogueFillExercise } from '@/types/lesson';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { sounds } from '@/lib/audio';

interface DialogueFillProps {
  exercise: DialogueFillExercise;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  isChecked: boolean;
  isCorrect: boolean | null;
}

export const DialogueFill: React.FC<DialogueFillProps> = ({
  exercise,
  selectedAnswer,
  onSelect,
  isChecked,
  isCorrect,
}) => {
  const handleSelect = (option: string) => {
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
        {exercise.audioText && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-sky-50 rounded-2xl border border-sky-200">
            <AudioSpeaker text={exercise.audioText} size="md" showSlow={true} />
            <span className="text-sm font-semibold text-sky-800">
              Listen to the dialogue
            </span>
          </div>
        )}
      </div>

      {/* Comic Dialogue Chat View */}
      <div className="w-full flex flex-col gap-4 mb-8">
        {exercise.dialogue.map((turn, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 font-extrabold text-white text-sm shadow-sm">
                {turn.speaker.charAt(0)}
              </div>

              {/* Chat Bubble */}
              <div
                className={`max-w-[80%] rounded-3xl p-4 shadow-sm border-2 ${
                  isLeft
                    ? 'bg-white border-slate-200 text-slate-800 rounded-tl-xs'
                    : 'bg-emerald-50 border-emerald-200 text-slate-800 rounded-tr-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {turn.speaker}
                  </span>
                  <AudioSpeaker text={turn.text.replace('___', selectedAnswer || '')} size="sm" />
                </div>

                <div className="text-base sm:text-lg font-bold leading-relaxed">
                  {turn.text.includes('___') ? (
                    (() => {
                      const parts = turn.text.split('___');
                      return (
                        <span>
                          {parts[0]}
                          <span
                            className={`inline-flex mx-1 px-3 py-0.5 rounded-lg border-2 transition-all font-black ${
                              selectedAnswer
                                ? isChecked
                                  ? isCorrect
                                    ? 'border-emerald-500 bg-emerald-200 text-emerald-900'
                                    : 'border-rose-500 bg-rose-200 text-rose-900'
                                  : 'border-sky-400 bg-sky-200 text-sky-900 animate-pop'
                                : 'border-dashed border-slate-400 bg-slate-100 text-slate-400'
                            }`}
                          >
                            {selectedAnswer || '_____'}
                          </span>
                          {parts[1]}
                        </span>
                      );
                    })()
                  ) : (
                    <span>{turn.text}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Options Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
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
