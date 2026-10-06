'use client';

import React, { useState, useEffect } from 'react';
import { MatchPairsExercise } from '@/types/lesson';
import { sounds } from '@/lib/audio';
import { Check } from 'lucide-react';

interface MatchPairsProps {
  exercise: MatchPairsExercise;
  onAllMatched: () => void;
  onMistake: () => void;
  isChecked: boolean;
}

export const MatchPairs: React.FC<MatchPairsProps> = ({
  exercise,
  onAllMatched,
  onMistake,
}) => {
  const [shuffledLt, setShuffledLt] = useState<{ id: string; text: string }[]>([]);
  const [shuffledEn, setShuffledEn] = useState<{ id: string; text: string }[]>([]);

  const [selectedLt, setSelectedLt] = useState<string | null>(null);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchIds, setMismatchIds] = useState<{ ltId: string; enId: string } | null>(null);

  // Shuffle columns once on mount
  useEffect(() => {
    const ltItems = exercise.pairs.map(p => ({ id: p.id, text: p.lithuanian }));
    const enItems = exercise.pairs.map(p => ({ id: p.id, text: p.english }));

    setShuffledLt([...ltItems].sort(() => Math.random() - 0.5));
    setShuffledEn([...enItems].sort(() => Math.random() - 0.5));
    setMatchedIds([]);
    setSelectedLt(null);
    setSelectedEn(null);
    setMismatchIds(null);
  }, [exercise]);

  // Check matching whenever both are selected
  useEffect(() => {
    if (selectedLt && selectedEn) {
      if (selectedLt === selectedEn) {
        // Matched!
        sounds.playSuccess();
        const nextMatched = [...matchedIds, selectedLt];
        setMatchedIds(nextMatched);
        setSelectedLt(null);
        setSelectedEn(null);

        if (nextMatched.length === exercise.pairs.length) {
          onAllMatched();
        }
      } else {
        // Mismatched!
        sounds.playError();
        setMismatchIds({ ltId: selectedLt, enId: selectedEn });
        onMistake();
        setTimeout(() => {
          setSelectedLt(null);
          setSelectedEn(null);
          setMismatchIds(null);
        }, 700);
      }
    }
  }, [selectedLt, selectedEn, matchedIds, exercise.pairs.length, onAllMatched, onMistake]);

  const handleLtClick = (id: string, text: string) => {
    if (matchedIds.includes(id) || mismatchIds) return;
    sounds.playClick();
    sounds.speak(text);
    setSelectedLt(prev => (prev === id ? null : id));
  };

  const handleEnClick = (id: string) => {
    if (matchedIds.includes(id) || mismatchIds) return;
    sounds.playClick();
    setSelectedEn(prev => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Exercise Prompt */}
      <div className="w-full mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-2">
          {exercise.prompt}
        </h2>
        <p className="text-sm font-semibold text-slate-500">
          Tap a pair of matching Lithuanian words and English definitions.
        </p>
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
