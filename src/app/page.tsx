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
import { AmberLeagueCard } from '@/components/AmberLeagueCard';

export default function DashboardPage() {
  const { progress } = useGame();

  const dailyXpTarget = 50;
  const dailyXpProgress = Math.min(100, Math.round((progress.xp % dailyXpTarget) / dailyXpTarget * 100));

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-28 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Columns: Learning Tree */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center min-w-0 w-full">
          {/* Mobile Friend Battle Quick Banner */}
          <div className="w-full lg:hidden mb-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-4 text-white shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl shrink-0">⚔️</span>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-white leading-tight truncate">Dvikova su Draugais!</h4>
                <p className="text-[11px] text-white/90 font-medium truncate">5 greiti raundai prieš draugus ar DI</p>
              </div>
            </div>
            <Link
              href="/battle"
              className="btn-3d px-3.5 py-2 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-wider shrink-0 shadow-sm"
            >
              Kovoti!
            </Link>
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
              You are mastering A1 Lithuanian. Revisit any node above to sharpen your vocabulary or test your memory in the Practice Gym!
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

        {/* Right Column: Daily Goals, Phrase of Day, Quests, Amber League */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col gap-4 min-w-0 w-full sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1">
          {/* Daily Goal Card */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 truncate">
                Daily Goal • Dienos tikslas
              </span>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1 shrink-0">
                <Zap className="h-3.5 w-3.5 fill-amber-500" />
                {progress.xp % dailyXpTarget} / {dailyXpTarget} XP
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${dailyXpProgress || 5}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-2">
              Earn {dailyXpTarget} XP daily to build long-term fluency memory.
            </p>
          </div>

          {/* Friend Battle Card */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-5 text-white shadow-md flex flex-col gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-xl">
                ⚔️
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 block truncate">
                  Multiplayer Duel
                </span>
                <h4 className="text-base font-black text-white leading-tight truncate">
                  Dvikova su Draugais
                </h4>
              </div>
            </div>
            <p className="text-xs text-white/90 font-medium leading-relaxed">
              Kovok realiu laiku! 5 greiti raundai, live rezultatai ir XP prizai nugalėtojui.
            </p>
            <Link
              href="/battle"
              className="btn-3d w-full py-2.5 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-wider text-center shadow-xs"
            >
              Pradėti Dvikovą ⚔️
            </Link>
          </div>

          {/* Amber League Standing Card */}
          <AmberLeagueCard />

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
