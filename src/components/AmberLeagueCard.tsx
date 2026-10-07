'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Shield, Sparkles, ChevronRight, Crown, Medal, Flame } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
  Geležis: { bg: 'from-slate-400 to-slate-600', text: 'text-slate-100', border: 'border-slate-300', glow: 'shadow-slate-200', icon: '⚔️' },
  Bronza: { bg: 'from-amber-600 to-amber-800', text: 'text-amber-100', border: 'border-amber-400', glow: 'shadow-amber-200', icon: '🥉' },
  Sidabras: { bg: 'from-slate-300 to-slate-500', text: 'text-white', border: 'border-slate-200', glow: 'shadow-slate-300', icon: '🥈' },
  Auksas: { bg: 'from-amber-400 to-yellow-600', text: 'text-white', border: 'border-yellow-300', glow: 'shadow-yellow-200', icon: '🥇' },
  Gintaras: { bg: 'from-amber-500 via-orange-500 to-amber-600', text: 'text-amber-50', border: 'border-amber-300', glow: 'shadow-amber-400/50', icon: '💎' },
};

export const AmberLeagueCard: React.FC = () => {
  const { progress } = useGame();
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  const currentTier = progress.leagueTier || 'Bronza';
  const tierConfig = TIER_COLORS[currentTier] || TIER_COLORS.Bronza;

  // Dynamic leaderboard competitors based on user XP
  const leaderboard = [
    { rank: 1, name: 'Emilija K.', xp: Math.max(progress.xp + 140, 240), avatar: '👩', streak: 12 },
    { rank: 2, name: 'Lukas V.', xp: Math.max(progress.xp + 70, 190), avatar: '👨‍🦱', streak: 8 },
    { rank: 3, name: 'Jonas M.', xp: Math.max(progress.xp + 20, 140), avatar: '🧑', streak: 5 },
    { rank: 4, name: 'You (Tu)', xp: progress.xp, avatar: '🦊', streak: progress.streak, isUser: true },
    { rank: 5, name: 'Gabija S.', xp: Math.max(0, progress.xp - 30), avatar: '👩‍🦰', streak: 4 },
    { rank: 6, name: 'Mindaugas B.', xp: Math.max(0, progress.xp - 65), avatar: '🧔', streak: 3 },
    { rank: 7, name: 'Austėja R.', xp: Math.max(0, progress.xp - 110), avatar: '👱‍♀️', streak: 1 },
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const userRank = leaderboard.find(l => l.isUser)?.rank || 4;

  return (
    <>
      <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
        {/* League Tier Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Trophy className="h-4 w-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Gintaro Lyga • Amber League
            </span>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Week 42
          </span>
        </div>

        {/* Tier Banner */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${tierConfig.bg} p-4 text-white shadow-sm flex items-center justify-between mb-4`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tierConfig.icon}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-lg font-black tracking-tight">{currentTier} Tier</h4>
                {currentTier === 'Gintaras' && <Sparkles className="w-4 h-4 text-yellow-200" />}
              </div>
              <p className="text-[11px] text-white/90 font-medium">
                Rank #{userRank} of 30 learners
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black">{progress.xp}</span>
            <span className="text-[10px] font-bold block opacity-80 uppercase">Total XP</span>
          </div>
        </div>

        {/* Mini Standings (Top 3 + User) */}
        <div className="flex flex-col gap-1.5 mb-3">
          {leaderboard.slice(0, 5).map((comp) => (
            <div
              key={comp.name}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                comp.isUser
                  ? 'bg-sky-50 text-sky-900 border-2 border-sky-300 ring-2 ring-sky-100'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-5 text-center font-black ${
                  comp.rank === 1 ? 'text-amber-500' : comp.rank === 2 ? 'text-slate-400' : comp.rank === 3 ? 'text-amber-700' : 'text-slate-400'
                }`}>
                  {comp.rank === 1 ? '🥇' : comp.rank === 2 ? '🥈' : comp.rank === 3 ? '🥉' : `#${comp.rank}`}
                </span>
                <span className="text-base">{comp.avatar}</span>
                <span className={comp.isUser ? 'font-black' : 'font-medium'}>{comp.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-mono">{comp.xp} XP</span>
                {comp.rank <= 3 && (
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Promote
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/leaderboard"
          className="w-full py-2 text-center text-xs font-black text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <span>View Full League Standings</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Full Leaderboard Modal */}
      {showFullLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierConfig.icon}</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {currentTier} League Standings
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Top 3 promote to higher division on Sunday!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullLeaderboard(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {leaderboard.map((comp) => (
                <div
                  key={comp.name}
                  className={`flex items-center justify-between p-3 rounded-2xl text-sm ${
                    comp.isUser
                      ? 'bg-sky-50 border-2 border-sky-300 font-black text-sky-900'
                      : 'bg-slate-50 border border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black">
                      {comp.rank === 1 ? '🥇' : comp.rank === 2 ? '🥈' : comp.rank === 3 ? '🥉' : comp.rank}
                    </span>
                    <span className="text-lg">{comp.avatar}</span>
                    <div>
                      <div className="text-xs font-black">{comp.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{comp.streak} day streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{comp.xp} XP</span>
                    {comp.rank <= 3 ? (
                      <span className="text-[10px] font-black text-emerald-600 block uppercase">
                        Promotion Zone ▲
                      </span>
                    ) : comp.rank >= 6 ? (
                      <span className="text-[10px] font-black text-rose-500 block uppercase">
                        Demotion Zone ▼
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullLeaderboard(false)}
                className="btn-3d px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
              >
                Close (Uždaryti)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
