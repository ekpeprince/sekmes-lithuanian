'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Zap,
  Crown,
  Medal,
  ChevronUp,
  ChevronDown,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { LEAGUE_TIERS, LeagueTier, getLeagueTimeRemaining, getWeeklyCohort, Competitor } from '@/lib/league';
import { syncUserToLeaderboard, fetchRealLeaderboardMembers } from '@/lib/leagueSync';

export default function LeaderboardPage() {
  const { progress } = useGame();
  const { user } = useAuth();

  const userAssignedTier: LeagueTier = progress.leagueTier || 'Bronza';
  const [activeTier, setActiveTier] = useState<LeagueTier>(userAssignedTier);
  const [realMembers, setRealMembers] = useState<Competitor[]>([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [timeInfo, setTimeInfo] = useState(getLeagueTimeRemaining());

  // Periodically refresh countdown
  useEffect(() => {
    setTimeInfo(getLeagueTimeRemaining());
    const interval = setInterval(() => {
      setTimeInfo(getLeagueTimeRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync logged-in user to Firestore
  useEffect(() => {
    if (user?.uid) {
      syncUserToLeaderboard(
        user.uid,
        { displayName: user.displayName, photoURL: user.photoURL },
        userAssignedTier,
        progress.xp,
        progress.streak
      );
    }
  }, [user, userAssignedTier, progress.xp, progress.streak]);

  // Fetch real users from Firestore for the active tier
  useEffect(() => {
    let isMounted = true;
    fetchRealLeaderboardMembers(activeTier).then((members) => {
      if (isMounted && members.length > 0) {
        setRealMembers(members);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTier]);

  const activeTierConfig = LEAGUE_TIERS[activeTier] || LEAGUE_TIERS.Bronza;
  const isViewingUserTier = activeTier === userAssignedTier;

  // Generate deterministic weekly cohort for the selected tier
  const competitors = useMemo(() => {
    const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)');
    const cohort = getWeeklyCohort(activeTier, isViewingUserTier ? progress.xp : -1, {
      name: userName,
      photoURL: user?.photoURL || undefined,
    });

    // If real Firestore members exist, merge them
    if (realMembers.length > 0) {
      const mergedMap = new Map<string, Competitor>();
      // First add real users
      realMembers.forEach((m) => mergedMap.set(m.name, m));
      // Then fill remaining slots with cohort members
      cohort.forEach((c) => {
        if (!mergedMap.has(c.name)) {
          mergedMap.set(c.name, c);
        }
      });
      const mergedList = Array.from(mergedMap.values());
      mergedList.sort((a, b) => b.xp - a.xp);
      return mergedList.slice(0, 30).map((c, idx) => ({ ...c, rank: idx + 1 }));
    }

    return cohort;
  }, [activeTier, isViewingUserTier, progress.xp, user, realMembers]);

  const top3 = competitors.slice(0, 3);
  const userComp = competitors.find((c) => c.isUser);
  const userRank = userComp?.rank || 4;

  const xpNeededForPromotion =
    userRank > 3 && top3[2]
      ? Math.max(1, top3[2].xp - progress.xp + 1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-slate-200 px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${activeTierConfig.bgGradient} text-white shadow-md text-3xl`}
              >
                {activeTierConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                    {activeTierConfig.name}
                  </h1>
                  <span className={`text-xs font-black uppercase tracking-wider ${activeTierConfig.badgeBg} ${activeTierConfig.badgeText} border border-slate-300 px-2.5 py-0.5 rounded-full`}>
                    {activeTierConfig.englishName}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  {activeTierConfig.description}
                </p>
              </div>
            </div>

            {/* Time & Rewards Actions */}
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setShowRewardsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Award className="h-4 w-4 text-amber-600" />
                <span>Prizai ({activeTierConfig.rewards.first} 💎)</span>
              </button>

              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Liko: {timeInfo.formatted}</span>
              </div>
            </div>
          </div>

          {/* Tier Division Navigation Carousel */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(LEAGUE_TIERS) as LeagueTier[]).map((tierKey) => {
              const tier = LEAGUE_TIERS[tierKey];
              const isSelected = tierKey === activeTier;
              const isUserCurrent = tierKey === userAssignedTier;

              return (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shrink-0 transition-all border-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{tier.icon}</span>
                  <span>{tier.name}</span>
                  {isUserCurrent && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Tavo lyga
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* Banner if viewing another division */}
        {!isViewingUserTier && (
          <div className="mb-6 bg-sky-50 border-2 border-sky-200 rounded-3xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-sky-600 shrink-0" />
              <div>
                <span className="font-extrabold text-sky-900 block">
                  Peržiūrite {activeTierConfig.name} diviziją
                </span>
                <span className="text-sky-700 font-medium">
                  Tavo aktyvi divizija yra <strong>{LEAGUE_TIERS[userAssignedTier].name}</strong>. Užbaik pamokas, kad pakiltum!
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTier(userAssignedTier)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shrink-0 shadow-2xs"
            >
              Grįžti į savo lygą
            </button>
          </div>
        )}

        {/* User Active Standing Hero Card */}
        {isViewingUserTier && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl border border-white/30">
                {userRank === 1 ? '👑' : userRank <= 3 ? '🏆' : '🇱🇹'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                    Tavo statusas šią savaitę
                  </span>
                  {userRank <= 3 && (
                    <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Pakilimo zona ▲
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black">
                  #{userRank} vieta iš 30 mokinių ({progress.xp} XP)
                </h3>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  {userRank <= 3 ? (
                    '🎉 Puiku! Išlaikyk šią poziciją iki sekmadienio ir pakilsi į aukštesnę lygą!'
                  ) : (
                    `Liko ${xpNeededForPromotion} XP iki 3-iosios vietos ir pakilimo zonos!`
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/practice"
              className="btn-3d py-2.5 px-5 bg-white text-slate-900 hover:bg-slate-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>Gauti daugiau XP</span>
            </Link>
          </div>
        )}

        {/* Top 3 Podium Cards */}
        <section className="mb-8">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 text-center">
            {activeTierConfig.name} • Lyderių Pakyla (Top 3)
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4 items-end max-w-2xl mx-auto">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  {top3[1].photoURL ? (
                    <img src={top3[1].photoURL} alt={top3[1].name} className="h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br ${top3[1].avatarColor} text-white font-black text-sm md:text-base flex items-center justify-center shadow-sm`}>
                      {top3[1].initials}
                    </div>
                  )}
                  <span className="absolute -top-2 -right-2 bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-300">
                    2
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                  <div className="text-xs font-black text-slate-800 truncate" title={top3[1].name}>
                    {top3[1].name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[1].flag}</span>
                    <span>{top3[1].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500" />
                    <span>{top3[1].xp} XP</span>
                  </div>
                  <div className="mt-2 h-14 md:h-18 bg-gradient-to-t from-slate-200 to-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-xl">
                    🥈
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Center & Taller) */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Crown className="h-6 w-6 text-yellow-500 fill-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  {top3[0].photoURL ? (
                    <img src={top3[0].photoURL} alt={top3[0].name} className="h-14 w-14 md:h-16 md:w-16 rounded-2xl object-cover shadow-md ring-2 ring-yellow-400" />
                  ) : (
                    <div className={`h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br ${top3[0].avatarColor} text-white font-black text-base md:text-lg flex items-center justify-center shadow-md ring-2 ring-yellow-400`}>
                      {top3[0].initials}
                    </div>
                  )}
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-yellow-500">
                    1
                  </span>
                </div>
                <div className="w-full bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 rounded-2xl p-3 text-center shadow-md">
                  <div className="text-xs font-black text-slate-900 truncate" title={top3[0].name}>
                    {top3[0].name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[0].flag}</span>
                    <span>{top3[0].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500" />
                    <span>{top3[0].xp} XP</span>
                  </div>
                  <div className="mt-2 h-20 md:h-26 bg-gradient-to-t from-amber-300 to-amber-100 rounded-xl flex items-center justify-center font-black text-amber-800 text-2xl">
                    🥇
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  {top3[2].photoURL ? (
                    <img src={top3[2].photoURL} alt={top3[2].name} className="h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br ${top3[2].avatarColor} text-white font-black text-sm md:text-base flex items-center justify-center shadow-sm`}>
                      {top3[2].initials}
                    </div>
                  )}
                  <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-amber-800">
                    3
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                  <div className="text-xs font-black text-slate-800 truncate" title={top3[2].name}>
                    {top3[2].name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[2].flag}</span>
                    <span>{top3[2].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500" />
                    <span>{top3[2].xp} XP</span>
                  </div>
                  <div className="mt-2 h-10 md:h-14 bg-gradient-to-t from-amber-200 to-amber-100 rounded-xl flex items-center justify-center font-black text-amber-900 text-xl">
                    🥉
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Promotion & Demotion Zone Indicators */}
        <div className="flex items-center justify-between text-xs font-bold bg-white border border-slate-200 rounded-2xl px-4 py-2.5 mb-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ChevronUp className="h-4 w-4" />
            <span>Top 3 keliauja į aukštesnę diviziją</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500">
            <ChevronDown className="h-4 w-4" />
            <span>Paskutiniai 5 iškrenta</span>
          </div>
        </div>

        {/* Full 30-Learner Cohort Table */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {competitors.map((item) => {
            const isTop3 = item.rank <= 3;
            const isDemotion = item.rank >= 26;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 md:p-4 transition-all ${
                  item.isUser
                    ? 'bg-amber-50/90 border-l-4 border-l-amber-500 ring-2 ring-amber-400/40'
                    : isTop3
                    ? 'hover:bg-emerald-50/30'
                    : isDemotion
                    ? 'hover:bg-red-50/30'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Rank, Avatar, Name, Country */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="flex flex-col items-center justify-center w-7 text-center">
                    <span
                      className={`text-sm md:text-base font-black ${
                        item.rank === 1
                          ? 'text-yellow-600'
                          : item.rank === 2
                          ? 'text-slate-500'
                          : item.rank === 3
                          ? 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.rank}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {item.photoURL ? (
                      <img src={item.photoURL} alt={item.name} className="h-10 w-10 md:h-11 md:w-11 rounded-2xl object-cover shadow-2xs" />
                    ) : (
                      <div className={`h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-gradient-to-br ${item.avatarColor} text-white font-black text-xs md:text-sm flex items-center justify-center shadow-2xs`}>
                        {item.initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs md:text-sm font-black truncate ${item.isUser ? 'text-amber-950 font-black' : 'text-slate-800'}`}>
                        {item.name}
                      </span>
                      {item.isUser && (
                        <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-md">
                          Tu
                        </span>
                      )}
                      <span className="text-xs shrink-0" title={item.city}>
                        {item.flag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mt-0.5">
                      <span className="truncate">{item.city}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Flame className="h-3 w-3 fill-orange-500" />
                        {item.streak} d. serija
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Promotion Zone Tag & XP */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {isTop3 && (
                    <span className="hidden sm:inline text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      Pakilimas ▲
                    </span>
                  )}
                  {isDemotion && (
                    <span className="hidden sm:inline text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                      Iškritimas ▼
                    </span>
                  )}

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                    <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-xs md:text-sm font-black text-amber-800">
                      {item.xp} <span className="text-[10px] text-amber-600">XP</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivation Card */}
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">Nori pakilti aukščiau lygoje?</h3>
            <p className="text-xs md:text-sm text-emerald-100 font-medium">
              Užbaikite pamokas arba praktikuokitės su DI tutoriumi ir gaukite papildomų XP!
            </p>
          </div>
          <Link
            href="/practice"
            className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-sm shrink-0"
          >
            <span>Mokytis dabar</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Rewards Breakdown Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeTierConfig.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {activeTierConfig.name} Prizai
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Turnyras baigiasi sekmadienį 23:59
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
                    <h4 className="text-xs font-black text-slate-900">1-oji vieta</h4>
                    <p className="text-[10px] text-slate-500">Čempiono statusas + Pakilimas</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-700">+{activeTierConfig.rewards.first} 💎 Gintarai</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">2-oji vieta</h4>
                    <p className="text-[10px] text-slate-500">Sidabrinis medalis + Pakilimas</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700">+{activeTierConfig.rewards.second} 💎 Gintarai</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">3-ioji vieta</h4>
                    <p className="text-[10px] text-slate-500">Bronzinis medalis + Pakilimas</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-800">+{activeTierConfig.rewards.third} 💎 Gintarai</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold leading-relaxed">
              💡 <strong>Kaip pakilti į aukštesnę lygą?</strong> Užbaikite dienos pamokas ir praktikuokitės su DI tutoriumi, kad pasiektumėte Top 3 iki sekmadienio vakaro!
            </div>

            <button
              type="button"
              onClick={() => setShowRewardsModal(false)}
              className="btn-3d w-full mt-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
            >
              Supratau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
