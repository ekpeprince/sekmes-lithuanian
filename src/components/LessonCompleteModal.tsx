'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Zap, Heart, Flame, ArrowRight, Home, Coins, Sparkles } from 'lucide-react';
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
  const labasEarned = Number((xpEarned / 100).toFixed(2));

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

        {/* $LABAS Token Reward Highlight Banner */}
        <div className="mt-5 mb-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/90 p-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 font-black shadow-inner">
                <Coins className="h-6 w-6 text-amber-950 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-black text-amber-950">
                    +{labasEarned.toFixed(2)} $LABASCOIN
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                    On-Chain Micro-Reward
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-amber-900/80 leading-tight mt-0.5">
                  Added to your wallet • Spend on perks or cash out on Stellar DEX
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="my-5 grid grid-cols-3 gap-2.5">
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
        <div className="flex flex-col gap-2.5">
          {nextLessonId ? (
            <Link
              href={`/lesson/${nextLessonId}`}
              className="btn-3d btn-green-3d w-full py-3.5 text-center text-base font-extrabold flex items-center justify-center gap-2"
            >
              <span>NEXT LESSON</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/token"
              className="rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 py-3 font-extrabold text-xs text-amber-900 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Coins className="h-4 w-4 text-amber-600" />
              <span>$LABAS Portal</span>
            </Link>
            <Link
              href="/"
              className="rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 py-3 font-extrabold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="h-4 w-4 text-slate-500" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
