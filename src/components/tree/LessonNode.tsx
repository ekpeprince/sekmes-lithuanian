'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Lock, Star, Play, Sparkles } from 'lucide-react';
import { Lesson } from '@/types/lesson';
import { sounds } from '@/lib/audio';

interface LessonNodeProps {
  lesson: Lesson;
  isCompleted: boolean;
  isUnlocked: boolean;
  isActive?: boolean;
  offset: number; // e.g. -45, 0, 45 px for wavy snake curve
}

export const LessonNode: React.FC<LessonNodeProps> = ({
  lesson,
  isCompleted,
  isUnlocked,
  isActive = false,
  offset,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const displayTitle = lesson.title.includes('•') ? lesson.title.split('•')[0].trim() : lesson.title;

  const handleNodeClick = () => {
    sounds.playClick();
    if (isUnlocked) {
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center my-4 sm:my-5 transition-transform duration-300 ${
        showTooltip ? 'z-50' : 'z-10'
      }`}
      style={{ transform: `translateX(${offset}px)` }}
    >
      {/* Floating Animated START Beacon on Active Node */}
      {isActive && !isCompleted && !showTooltip && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center animate-bounce">
          <div className="bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-xl shadow-md border border-emerald-400 flex items-center gap-1 shrink-0">
            <span>START</span>
            <span className="text-[9px]">▶</span>
          </div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-emerald-600 -mt-[1px]" />
        </div>
      )}

      {/* Stepping Stone Node Button */}
      <button
        type="button"
        onClick={handleNodeClick}
        disabled={!isUnlocked}
        className={`group relative flex h-20 w-20 items-center justify-center rounded-full select-none cursor-pointer ${
          isCompleted
            ? 'bg-amber-400 hover:bg-amber-300 shadow-md border-b-[5px] border-amber-600 active:border-b-0 active:translate-y-[5px] transition-all duration-75'
            : isUnlocked
            ? `bg-emerald-500 hover:bg-emerald-400 shadow-md border-b-[5px] border-emerald-700 active:border-b-0 active:translate-y-[5px] transition-all duration-75 ${
                isActive
                  ? 'ring-4 ring-emerald-300 ring-offset-2 animate-pulse'
                  : 'ring-8 ring-emerald-100'
              }`
            : 'bg-slate-200 shadow-xs border-b-[5px] border-slate-300 cursor-not-allowed opacity-75'
        }`}
      >
        {isCompleted ? (
          <div className="flex flex-col items-center">
            <Check className="h-9 w-9 text-white stroke-[3.5]" />
          </div>
        ) : isUnlocked ? (
          <div className="relative">
            <Star className="h-9 w-9 fill-white text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-200"></span>
            </span>
          </div>
        ) : (
          <Lock className="h-8 w-8 text-slate-400 stroke-[2.5]" />
        )}
      </button>

      {/* Multi-line centered title under node */}
      <div className="max-w-[100px] text-[11px] font-semibold text-center leading-tight line-clamp-2 break-words mt-2">
        <span className={`transition-colors ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
          {displayTitle}
        </span>
      </div>

      {/* Popover Bubble Dialog when clicked */}
      {showTooltip && isUnlocked && (
        <>
          {/* Backdrop click away */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTooltip(false)}
          />
          <div className="absolute top-24 z-50 w-[300px] max-w-[calc(100vw-32px)] -translate-x-1/2 left-1/2 rounded-3xl bg-white p-4.5 sm:p-5 shadow-2xl border-2 border-slate-200 animate-pop">
            {/* Triangular arrow pointing up */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-slate-200 rotate-45 z-10" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  Lesson {lesson.order}
                </span>
                <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Sparkles className="h-3 w-3 fill-amber-500" />
                  +{lesson.xpReward} XP
                </span>
              </div>

              <h4 className="font-extrabold text-slate-800 text-base mb-1">
                {lesson.title}
              </h4>
              <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">
                {lesson.description}
              </p>

              {lesson.subExplanation && (
                <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-0.5">
                    💡 English Guide
                  </span>
                  <p className="text-[11px] font-medium text-emerald-950/90 leading-snug">
                    {lesson.subExplanation}
                  </p>
                </div>
              )}

              <Link
                href={`/lesson/${lesson.id}`}
                onClick={() => sounds.playClick()}
                className={`btn-tactile w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-center text-sm font-black shadow-xs ${
                  isCompleted ? 'btn-tactile-amber' : 'btn-tactile-emerald'
                }`}
              >
                <Play className="h-4 w-4 fill-white" />
                {isCompleted ? 'PRACTICE (+10 XP)' : 'START LESSON'}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
