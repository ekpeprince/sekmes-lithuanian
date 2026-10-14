'use client';

import React from 'react';
import Link from 'next/link';
import { UNITS } from '@/data/curriculum';
import { UnitCard } from '@/components/tree/UnitCard';
import { useGame } from '@/context/GameContext';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { Zap, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/audio';

import { DailyQuestsCard } from '@/components/DailyQuestsCard';

export default function DashboardPage() {
  const { progress, dailyXp, activeMinutesToday } = useGame();

  const dailyXpTarget = 30;
  const isGoalMet = dailyXp >= dailyXpTarget;
  const dailyXpProgress = Math.min(100, Math.round((dailyXp / dailyXpTarget) * 100));

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6 pb-44 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Columns: Learning Tree */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center min-w-0 w-full">
          {/* Sleek Compact Daily Goal Tracker Card (Mobile & Tablet only) */}
          <div className="md:hidden w-full bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs mb-3.5 dark:bg-slate-900 dark:border-slate-800">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <span className="text-xs shrink-0 mr-1.5">🎯</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 shrink-0">Daily Goal</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1.5 shrink-0">
                  {isGoalMet ? 'Goal Met! 🎉' : `⏱️ ${activeMinutesToday}m today`}
                </span>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                {dailyXp} / {dailyXpTarget} XP
              </span>
            </div>

            {/* Progress Track */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full h-full transition-all duration-500"
                style={{ width: `${dailyXpProgress}%` }}
              />
            </div>
          </div>

          {UNITS.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              completedLessons={progress.completedLessons}
            />
          ))}

          {/* End of Current Course Milestone */}
          <div className="w-full rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center mt-4">
            <span className="text-3xl">🎉</span>
            <h4 className="text-lg font-black text-slate-800 mt-2">
              Sveikiname! More Lessons Coming Soon!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              You are mastering Lithuanian! Revisit any lesson above to sharpen your vocabulary, build speaking confidence, or test your skills in the Practice Gym!
            </p>
            <Link
              href="/practice"
              className="btn-3d btn-green-3d py-2.5 px-6 inline-flex items-center gap-2 text-xs font-bold"
            >
              <span>ENTER PRACTICE GYM</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Right Column: Daily Goals, Quests, Multiplayer Duel, Phrase of Day */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col gap-4 min-w-0 w-full sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1">
          {/* Daily Goal Card (Top of Desktop Right Rail) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs mb-3.5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <span className="text-xs shrink-0 mr-1.5">🎯</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 shrink-0">Daily Goal</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1.5 shrink-0">
                  {isGoalMet ? 'Goal Met! 🎉' : `⏱️ ${activeMinutesToday}m today`}
                </span>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                {dailyXp} / {dailyXpTarget} XP
              </span>
            </div>

            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full h-full transition-all duration-500"
                style={{ width: `${dailyXpProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-2">
              Earn 30 XP daily to build long-term fluency memory.
            </p>
          </div>

          {/* Multiplayer Duel Card */}
          <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 p-4 shadow-xs flex flex-col gap-3 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300/60 text-xl">
                ⚔️
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                  Multiplayer Duel
                </h4>
                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                  Live 1v1 Lithuanian quiz
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Battle in real-time! 5 quick rounds, live scores, and XP prizes for the winner.
            </p>
            <Link
              href="/battle"
              className="btn-tactile btn-tactile-amber w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-center shadow-xs"
            >
              Battle Now ⚔️
            </Link>
          </div>


          {/* Daily Quests Card */}
          <DailyQuestsCard />

          {/* Phrase of the Day Card */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1 min-w-0 truncate">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Phrase of the Day</span>
              </span>
              <div className="shrink-0">
                <AudioSpeaker text="Kaip sekasi? Viskas gerai!" size="sm" />
              </div>
            </div>

            <h4 className="text-lg font-black text-slate-900 leading-snug">
              &quot;Kaip sekasi?&quot;
            </h4>
            <p className="text-xs font-bold text-emerald-800 mt-0.5">
              How are things going?
            </p>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              Lithuanian response: <strong className="text-emerald-700">&quot;Puikiai, ačiū!&quot;</strong> (Great, thank you!)
            </p>
          </div>

          {/* Lithuanian Grammar Quick Link */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
            <h4 className="font-extrabold text-slate-800 text-sm mb-1">
              Need Grammar Help?
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Review endings for the 7 noun cases and present tense conjugations of &quot;būti&quot;.
            </p>
            <Link
              href="/grammar"
              onClick={() => sounds.playClick()}
              className="btn-3d btn-blue-3d w-full py-2.5 text-center text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>OPEN GRAMMAR BANK</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
