'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Zap, Heart, Flame, ArrowRight, Home } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface LessonCompleteModalProps {
  xpEarned: number;
  heartsRemaining: number;
  accuracy: number;
  streak: number;
  nextLessonId: string | null;
}

export const LessonCompleteModal: React.FC<LessonCompleteModalProps> = ({
  xpEarned,
  heartsRemaining,
  accuracy,
  streak,
  nextLessonId,
}) => {
  useEffect(() => {
    // Play celebratory sound
    sounds.playLevelComplete();

    // Fire confetti bursts
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FDB913', '#006A44', '#C1272D', '#58cc02', '#1cb0f6'], // Lithuanian flag + Duolingo colors
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-4 border-emerald-400 text-center">
        {/* Header Ribbon / Trophy */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-lg shadow-amber-400/30 text-4xl">
          🇱🇹
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Pamoka Baigta!
        </h2>
        <p className="mt-1 text-sm font-bold text-emerald-600 uppercase tracking-widest">
          Lesson Completed • Puikus darbas!
        </p>

        {/* Stats Grid */}
        <div className="my-6 grid grid-cols-3 gap-3">
          {/* XP Card */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Total XP</span>
            <div className="flex items-center gap-1 my-1 text-amber-600 font-black text-xl">
              <Zap className="h-5 w-5 fill-amber-500" />
              <span>+{xpEarned}</span>
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Accuracy</span>
            <span className="my-1 text-emerald-600 font-black text-xl">
              {accuracy}%
            </span>
          </div>

          {/* Hearts Card */}
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">Hearts</span>
            <div className="flex items-center gap-1 my-1 text-rose-500 font-black text-xl">
              <Heart className="h-5 w-5 fill-rose-500" />
              <span>{heartsRemaining}</span>
            </div>
          </div>
        </div>

        {/* Streak banner */}
        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-orange-50 border-2 border-orange-200 py-3 px-4 text-orange-600 font-extrabold text-sm">
          <Flame className="h-5 w-5 fill-orange-500" />
          <span>{streak} Day Learning Streak! Keep it going!</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {nextLessonId ? (
            <Link
              href={`/lesson/${nextLessonId}`}
              className="btn-3d btn-green-3d w-full py-3.5 text-center text-base font-extrabold flex items-center justify-center gap-2"
            >
              <span>NEXT LESSON</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : null}

          <Link
            href="/"
            className="btn-3d btn-blue-3d w-full py-3.5 text-center text-base font-extrabold flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
