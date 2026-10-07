'use client';

import React, { useState } from 'react';
import { MatchPairsExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';
import { Check } from 'lucide-react';

interface MatchPairsProps {
  exercise: MatchPairsExercise;
  onAllMatched: () => void;
  onMistake: () => void;
  isChecked: boolean;
}

function shufflePairs<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const MatchPairs: React.FC<MatchPairsProps> = ({
  exercise,
  onAllMatched,
  onMistake,
}) => {
  const [prevExerciseId, setPrevExerciseId] = useState(exercise.id);
  const [shuffledLt, setShuffledLt] = useState(() =>
    shufflePairs(exercise.pairs.map((p) => ({ id: p.id, text: p.lithuanian })))
  );
  const [shuffledEn, setShuffledEn] = useState(() =>
    shufflePairs(exercise.pairs.map((p) => ({ id: p.id, text: p.english })))
  );

  const [selectedLt, setSelectedLt] = useState<string | null>(null);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchIds, setMismatchIds] = useState<{ ltId: string; enId: string } | null>(null);

  if (exercise.id !== prevExerciseId) {
    setPrevExerciseId(exercise.id);
    setShuffledLt(shufflePairs(exercise.pairs.map((p) => ({ id: p.id, text: p.lithuanian }))));
    setShuffledEn(shufflePairs(exercise.pairs.map((p) => ({ id: p.id, text: p.english }))));
    setMatchedIds([]);
    setSelectedLt(null);
    setSelectedEn(null);
    setMismatchIds(null);
  }

  const handleLtClick = (id: string, text: string) => {
    if (matchedIds.includes(id) || mismatchIds) return;
    sounds.playClick();
    sounds.speak(text);

    if (selectedLt === id) {
      setSelectedLt(null);
      return;
    }

    if (selectedEn) {
      if (selectedEn === id) {
        sounds.playSuccess();
        const nextMatched = [...matchedIds, id];
        setMatchedIds(nextMatched);
        setSelectedLt(null);
        setSelectedEn(null);

        if (nextMatched.length === exercise.pairs.length) {
          onAllMatched();
        }
      } else {
        sounds.playError();
        setMismatchIds({ ltId: id, enId: selectedEn });
        onMistake();
        setTimeout(() => {
          setSelectedLt(null);
          setSelectedEn(null);
          setMismatchIds(null);
        }, 700);
      }
    } else {
      setSelectedLt(id);
    }
  };

  const handleEnClick = (id: string) => {
    if (matchedIds.includes(id) || mismatchIds) return;
    sounds.playClick();

    if (selectedEn === id) {
      setSelectedEn(null);
      return;
    }

    if (selectedLt) {
      if (selectedLt === id) {
        sounds.playSuccess();
        const nextMatched = [...matchedIds, id];
        setMatchedIds(nextMatched);
        setSelectedLt(null);
        setSelectedEn(null);

        if (nextMatched.length === exercise.pairs.length) {
          onAllMatched();
        }
      } else {
        sounds.playError();
        setMismatchIds({ ltId: selectedLt, enId: id });
        onMistake();
        setTimeout(() => {
          setSelectedLt(null);
          setSelectedEn(null);
          setMismatchIds(null);
        }, 700);
      }
    } else {
      setSelectedEn(id);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Exercise Prompt */}
      <div className="w-full mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-2">
          {exercise.prompt}
        </h2>
        {exercise.subPrompt ? (
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">
            {exercise.subPrompt}
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            Tap a pair of matching Lithuanian words and English definitions.
          </p>
        )}
      </div>

      {/* Two Columns Grid */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Left Column: Lithuanian */}
        <div className="flex flex-col gap-3">
          {shuffledLt.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedLt === item.id;
            const isMismatch = mismatchIds?.ltId === item.id;

            return (
              <button
                key={`lt-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleLtClick(item.id, item.text)}
                className={`btn-option-3d w-full p-4 rounded-2xl font-bold text-sm sm:text-base text-left flex items-center justify-between transition-all ${
                  isMatched
                    ? 'opacity-40 bg-emerald-50 border-emerald-300 text-emerald-700 pointer-events-none'
                    : isMismatch
                    ? 'incorrect animate-shake'
                    : isSelected
                    ? 'selected ring-2 ring-sky-400'
                    : ''
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: English */}
        <div className="flex flex-col gap-3">
          {shuffledEn.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedEn === item.id;
            const isMismatch = mismatchIds?.enId === item.id;

            return (
              <button
                key={`en-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleEnClick(item.id)}
                className={`btn-option-3d w-full p-4 rounded-2xl font-bold text-sm sm:text-base text-left flex items-center justify-between transition-all ${
                  isMatched
                    ? 'opacity-40 bg-emerald-50 border-emerald-300 text-emerald-700 pointer-events-none'
                    : isMismatch
                    ? 'incorrect animate-shake'
                    : isSelected
                    ? 'selected ring-2 ring-sky-400'
                    : ''
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
