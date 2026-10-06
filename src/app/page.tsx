'use client';

import React from 'react';
import Link from 'next/link';
import { UNITS } from '@/data/curriculum';
import { UnitCard } from '@/components/tree/UnitCard';
import { useGame } from '@/context/GameContext';
import { AudioSpeaker } from '@/components/AudioSpeaker';
import { Zap, BookOpen, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/audio';

import { DailyQuestsCard } from '@/components/DailyQuestsCard';
import { AmberLeagueCard } from '@/components/AmberLeagueCard';

export default function DashboardPage() {
  const { progress } = useGame();

  const dailyXpTarget = 50;
  const dailyXpProgress = Math.min(100, Math.round((progress.xp % dailyXpTarget) / dailyXpTarget * 100));

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Learning Tree */}
        <div className="lg:col-span-2 flex flex-col items-center">
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
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Column: Daily Goals, Phrase of Day, Quests, Amber League */}
        <div className="hidden lg:flex flex-col gap-5 sticky top-24">
          {/* Daily Goal Card */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Daily Goal • Dienos tikslas
              </span>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
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

          {/* Amber League Standing Card */}
          <AmberLeagueCard />

          {/* Daily Quests Card */}
          <DailyQuestsCard />


          {/* Phrase of the Day Card */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Phrase of the Day
              </span>
              <AudioSpeaker text="Kaip sekasi? Viskas gerai!" size="sm" />
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
              <BookOpen className="h-4 w-4" />
              <span>OPEN GRAMMAR BANK</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
