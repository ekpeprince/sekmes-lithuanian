'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Unit } from '@/types/lesson';
import { sounds } from '@/lib/audio';
import { LessonNode } from './LessonNode';

interface UnitCardProps {
  unit: Unit;
  completedLessons: string[];
  activeLessonId?: string;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, completedLessons, activeLessonId }) => {
  // Find active lesson in this unit (first uncompleted lesson, or fallback to first lesson)
  const activeLesson = unit.lessons.find((l) => !completedLessons.includes(l.id)) || unit.lessons[0];
  const isUnit1 = unit.number === 1 || unit.id === 'unit-1';

  // Compute zigzag offsets for nodes that stay within mobile screen bounds
  const getOffset = (index: number) => {
    const pattern = [0, -22, 0, 22];
    return pattern[index % pattern.length];
  };

  // Derive clean action/title (e.g. Unit 1 -> "Start your first lesson")
  const displayTitle = (
    unit.number === 1
      ? 'Start your first lesson'
      : unit.title.replace(/^(Unit\s*\d+:?|\d+\s*skyrius:?)\s*/i, '')
  );

  return (
    <div className="w-full mb-16">
      {/* Unit Header Banner */}
      <div
        className="rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden mb-4"
        style={{
          background: `linear-gradient(135deg, ${unit.color} 0%, ${unit.accentColor} 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Top Tag: "UNIT X" */}
            <div className="mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full inline-flex items-center">
                UNIT {unit.number}
              </span>
            </div>

            {/* Main Bold Header */}
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white">
              {displayTitle}
            </h3>

            {/* Clean Subtitle / Description Body */}
            {unit.description && (
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-white/90 max-w-xl font-normal">
                {unit.description}
              </p>
            )}
          </div>

          {/* Action Buttons: Cleanly positioned */}
          <div className="self-start sm:self-center shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
            {!isUnit1 && activeLesson && (
              <Link
                href={`/lesson/${activeLesson.id}`}
                onClick={() => sounds.playClick()}
                className="btn-tactile bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>▶</span>
                <span>Start</span>
              </Link>
            )}

            <Link
              href="/grammar"
              onClick={() => sounds.playClick()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition backdrop-blur-xs active:scale-95 cursor-pointer shadow-2xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-white" />
              <span>Guidebook</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* Lesson Nodes Tree Path */}
      <div className="relative flex flex-col items-center py-3 sm:py-5">
        {unit.lessons.map((lesson, idx) => {
          const isCompleted = completedLessons.includes(lesson.id);

          // A lesson is unlocked if it's the very first lesson of the app (order === 1),
          // OR if the immediately previous lesson in the curriculum is completed!
          const isFirstLesson = unit.number === 1 && idx === 0;
          const prevLesson = idx > 0 ? unit.lessons[idx - 1] : null;
          const isUnlocked = isFirstLesson || isCompleted || (prevLesson ? completedLessons.includes(prevLesson.id) : true);

          const isActive = activeLessonId
            ? lesson.id === activeLessonId && isUnlocked && !isCompleted
            : activeLesson?.id === lesson.id && isUnlocked && !isCompleted;

          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              isCompleted={isCompleted}
              isUnlocked={isUnlocked}
              isActive={isActive}
              offset={getOffset(idx)}
            />
          );
        })}
      </div>
    </div>
  );
};
