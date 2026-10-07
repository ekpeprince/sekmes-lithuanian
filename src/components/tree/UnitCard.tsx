'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Unit } from '@/types/lesson';
import { LessonNode } from './LessonNode';

interface UnitCardProps {
  unit: Unit;
  completedLessons: string[];
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, completedLessons }) => {
  // Compute zigzag offsets for nodes that stay within mobile screen bounds
  const getOffset = (index: number) => {
    const pattern = [0, -22, 0, 22];
    return pattern[index % pattern.length];
  };

  return (
    <div className="w-full mb-10">
      {/* Unit Header Banner */}
      <div
        className="rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden mb-6"
        style={{
          background: `linear-gradient(135deg, ${unit.color} 0%, ${unit.accentColor} 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                Unit {unit.number}
              </span>
              <span className="text-xs font-semibold text-white/80">
                {unit.subtitle}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {unit.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-white/90 max-w-xl font-medium">
              {unit.description}
            </p>
          </div>

          <Link
            href="/grammar"
            className="self-start sm:self-center shrink-0 flex items-center gap-2 bg-white text-slate-800 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md hover:bg-slate-50 active:scale-95 transition-all"
          >
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>Guidebook</span>
          </Link>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* Lesson Nodes Tree Path */}
      <div className="relative flex flex-col items-center py-4">
        {unit.lessons.map((lesson, idx) => {
          const isCompleted = completedLessons.includes(lesson.id);

          // A lesson is unlocked if it's the very first lesson of the app (order === 1),
          // OR if the immediately previous lesson in the curriculum is completed!
          const isFirstLesson = unit.number === 1 && idx === 0;
          const prevLesson = idx > 0 ? unit.lessons[idx - 1] : null;
          const isUnlocked = isFirstLesson || isCompleted || (prevLesson ? completedLessons.includes(prevLesson.id) : true);

          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              isCompleted={isCompleted}
              isUnlocked={isUnlocked}
              offset={getOffset(idx)}
            />
          );
        })}
      </div>
    </div>
  );
};
