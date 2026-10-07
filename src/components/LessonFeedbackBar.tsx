'use client';

import React from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { AudioSpeaker } from './AudioSpeaker';

interface LessonFeedbackBarProps {
  isChecked: boolean;
  isCorrect: boolean | null;
  correctAnswer: string;
  explanation?: string;
  canCheck: boolean;
  onCheck: () => void;
  onContinue: () => void;
}

export const LessonFeedbackBar: React.FC<LessonFeedbackBarProps> = ({
  isChecked,
  isCorrect,
  correctAnswer,
  explanation,
  canCheck,
  onCheck,
  onContinue,
}) => {
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 transition-all duration-200 ${
        !isChecked
          ? 'bg-white border-slate-200 py-2.5 sm:py-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]'
          : isCorrect
          ? 'bg-emerald-100 border-emerald-300 py-3 sm:py-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
          : 'bg-rose-100 border-rose-300 py-3 sm:py-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="mx-auto flex max-w-3xl flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6">
        {/* If not checked yet, show empty or helper */}
        {!isChecked ? (
          <>
            <div className="hidden sm:block text-sm font-bold text-slate-400">
              Select an answer to check
            </div>
            <button
              type="button"
              disabled={!canCheck}
              onClick={onCheck}
              className="btn-3d btn-green-3d w-full sm:w-48 py-3 sm:py-3.5 text-center text-sm sm:text-base font-extrabold tracking-wider"
            >
              CHECK
            </button>
          </>
        ) : (
          /* Checked: Expanded feedback drawer */
          <>
            <div className="flex items-start gap-4 w-full sm:w-auto animate-pop">
              <div className="shrink-0 mt-0.5">
                {isCorrect ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 fill-emerald-100" />
                ) : (
                  <XCircle className="h-10 w-10 text-rose-600 fill-rose-100" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-xl font-black ${
                      isCorrect ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {isCorrect ? 'Nuostabu! (Excellent!)' : 'Neteisingai (Incorrect)'}
                  </h3>
                  {isCorrect && correctAnswer && (
                    <AudioSpeaker text={correctAnswer} size="sm" />
                  )}
                </div>

                {!isCorrect && (
                  <div className="mt-1 text-sm font-semibold text-rose-950">
                    <span>Correct answer: </span>
                    <strong className="font-extrabold underline decoration-rose-400 decoration-2">
                      {correctAnswer}
                    </strong>
                  </div>
                )}

                {explanation && (
                  <div
                    className={`mt-2 text-xs sm:text-sm leading-relaxed max-w-xl p-2.5 rounded-xl border ${
                      isCorrect
                        ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-950'
                        : 'bg-rose-50/80 border-rose-300/80 text-rose-950'
                    }`}
                  >
                    <span className="font-extrabold flex items-center gap-1 mb-0.5 text-[11px] uppercase tracking-wider opacity-90">
                      💡 English Explanation
                    </span>
                    <p className="font-medium">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onContinue}
              className={`btn-3d w-full sm:w-48 py-3.5 text-center text-base font-extrabold tracking-wider shrink-0 flex items-center justify-center gap-2 ${
                isCorrect ? 'btn-green-3d' : 'btn-red-3d'
              }`}
            >
              <span>CONTINUE</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </footer>
  );
};
