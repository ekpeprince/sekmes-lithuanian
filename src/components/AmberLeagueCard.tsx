'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Sparkles, ChevronRight, Clock, Award, ArrowUp, ArrowDown } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { LEAGUE_TIERS, LeagueTier, getLeagueTimeRemaining, getWeeklyCohort, Competitor } from '@/lib/league';
import { syncUserToLeaderboard } from '@/lib/leagueSync';

export const AmberLeagueCard: React.FC = () => {
  const { progress } = useGame();
  const { user } = useAuth();
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  const currentTier: LeagueTier = progress.leagueTier || 'Bronza';
  const tierConfig = LEAGUE_TIERS[currentTier] || LEAGUE_TIERS.Bronza;

  const [timeInfo, setTimeInfo] = useState(() => getLeagueTimeRemaining());

  // Update countdown periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getLeagueTimeRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync user progress to Firestore if logged in
  useEffect(() => {
    if (user?.uid) {
      syncUserToLeaderboard(
        user.uid,
        {
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        currentTier,
        progress.xp,
        progress.streak
      );
    }
  }, [user, currentTier, progress.xp, progress.streak]);

  // Generate dynamic, realistic weekly cohort where user XP accurately positions the user!
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)');
  const leaderboard: Competitor[] = getWeeklyCohort(currentTier, progress.xp, {
    name: userName,
    photoURL: user?.photoURL || undefined,
  });

  const userComp = leaderboard.find((l) => l.isUser);
  const userRank = userComp?.rank || 4;
  const isPromoting = userRank <= 3;
  const isDemoting = userRank >= 26;

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
              {tierConfig.name} • {tierConfig.englishName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Savaitė {timeInfo.weekNumber} • Liko {timeInfo.formatted} ({timeInfo.englishFormatted})</span>
          </div>
        </div>

        {/* Tier Banner */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${tierConfig.bgGradient} p-4 text-white shadow-sm flex items-center justify-between mb-4`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-sm">{tierConfig.icon}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-lg font-black tracking-tight">{tierConfig.name}</h4>
                {currentTier === 'Gintaras' && <Sparkles className="w-4 h-4 text-yellow-200 animate-spin-slow" />}
              </div>
              <span className="text-[11px] font-bold text-amber-100 block">
                {tierConfig.englishName}
              </span>
              <p className="text-[11px] text-white/90 font-medium mt-0.5">
                {isPromoting ? (
                  <span className="text-emerald-200 font-bold flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> #{userRank} vieta • Pakilimo zonoje! (Promotion Zone)
                  </span>
                ) : isDemoting ? (
                  <span className="text-rose-200 font-bold flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> #{userRank} vieta • Iškritimo zonoje! (Demotion Zone)
                  </span>
                ) : (
                  <span>#{userRank} vieta iš 30 mokinių (Rank #{userRank} of 30)</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRewardsModal(true)}
            className="flex flex-col items-end bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl transition border border-white/20 text-right cursor-pointer"
            title="Peržiūrėti prizus • View prizes"
          >
            <span className="text-xl font-black">{progress.xp}</span>
            <span className="text-[9px] font-bold block uppercase tracking-wider opacity-90 text-amber-200">
              Tavo XP • XP
            </span>
          </button>
        </div>

        {/* Mini Standings (Top 5 + User highlight) */}
        <div className="flex flex-col gap-1.5 mb-3">
          {leaderboard.slice(0, 5).map((comp) => {
            const isTop3 = comp.rank <= 3;
            return (
              <div
                key={comp.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                  comp.isUser
                    ? 'bg-amber-50 text-amber-950 border-2 border-amber-300 ring-2 ring-amber-100 shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 text-center font-black ${
                      comp.rank === 1
                        ? 'text-yellow-500'
                        : comp.rank === 2
                        ? 'text-slate-400'
                        : comp.rank === 3
                        ? 'text-amber-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {comp.rank === 1 ? '🥇' : comp.rank === 2 ? '🥈' : comp.rank === 3 ? '🥉' : `#${comp.rank}`}
                  </span>

                  {/* Real avatar / photo or styled initials */}
                  <div className="relative shrink-0">
                    {comp.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={comp.photoURL} alt={comp.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${comp.avatarColor} text-white text-[10px] font-black flex items-center justify-center shadow-2xs`}>
                        {comp.initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className={`truncate block ${comp.isUser ? 'font-black text-amber-950' : 'font-medium'}`}>
                      {comp.name}
                    </span>
                  </div>

                  <span className="text-xs shrink-0" title={comp.city}>
                    {comp.flag}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-[11px] font-mono">{comp.xp} XP</span>
                  {isTop3 && (
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Top 3
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* If user is below top 5, show a pinned row for the user */}
          {userRank > 5 && (
            <div className="mt-1 pt-1.5 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between p-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-950 border-2 border-amber-300 ring-2 ring-amber-100 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center font-black text-amber-800">
                    #{userRank}
                  </span>
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                    TU
                  </div>
                  <span className="truncate font-black text-amber-950">
                    {userName} (Tu • You)
                  </span>
                  <span className="text-xs">🇱🇹</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-900 text-[11px] font-mono font-black">{progress.xp} XP</span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Liko {leaderboard[2] ? Math.max(0, leaderboard[2].xp - progress.xp + 1) : 0} XP iki Top 3 (Need XP for Top 3)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Links to Full Standings & Rewards Breakdown */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowRewardsModal(true)}
            className="text-[11px] font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Prizai • Prizes (Gems)</span>
          </button>

          <Link
            href="/leaderboard"
            className="text-xs font-black text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
          >
            <span>Visa lentelė • Standings (30)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Rewards Breakdown Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierConfig.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {tierConfig.name} Prizai • Prizes
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Turnyras baigiasi sekmadienį 23:59 • Ends Sunday 23:59
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRewardsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">1-oji vieta • 1st Place</h4>
                    <p className="text-[10px] text-slate-500">Čempiono statusas + Pakilimas (Promotion)</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-700">+{tierConfig.rewards.first} 💎 Gintarai (Gems)</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">2-oji vieta • 2nd Place</h4>
                    <p className="text-[10px] text-slate-500">Sidabrinis medalis + Pakilimas (Promotion)</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700">+{tierConfig.rewards.second} 💎 Gintarai (Gems)</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">3-ioji vieta • 3rd Place</h4>
                    <p className="text-[10px] text-slate-500">Bronzinis medalis + Pakilimas (Promotion)</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-800">+{tierConfig.rewards.third} 💎 Gintarai (Gems)</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold leading-relaxed">
              💡 <strong>Kaip pakilti į aukštesnę lygą? • How to promote:</strong> Užbaikite dienos pamokas ir praktikuokitės su DI tutoriumi, kad pasiektumėte Top 3 iki sekmadienio vakaro! (Complete lessons and practice with AI Tutor to reach Top 3 by Sunday!)
            </div>

            <button
              type="button"
              onClick={() => setShowRewardsModal(false)}
              className="btn-3d w-full mt-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
            >
              Supratau • Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
