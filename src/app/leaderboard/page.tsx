'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';

const TIERS = [
  { id: 'Geležis', name: 'Geležies Lyga', icon: '⚔️', color: 'from-slate-400 to-slate-600', badge: 'bg-slate-100 text-slate-700' },
  { id: 'Bronza', name: 'Bronzos Lyga', icon: '🥉', color: 'from-amber-600 to-amber-800', badge: 'bg-amber-100 text-amber-800' },
  { id: 'Sidabras', name: 'Sidabro Lyga', icon: '🥈', color: 'from-slate-300 to-slate-500', badge: 'bg-slate-200 text-slate-800' },
  { id: 'Auksas', name: 'Aukso Lyga', icon: '🥇', color: 'from-amber-400 to-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
  { id: 'Gintaras', name: 'Gintaro Lyga', icon: '💎', color: 'from-amber-500 via-orange-500 to-amber-600', badge: 'bg-amber-50 text-amber-900' },
];

export default function LeaderboardPage() {
  const { progress } = useGame();
  const { user } = useAuth();

  const [activeTier, setActiveTier] = useState<string>(progress.leagueTier || 'Gintaras');

  const currentTierObj = TIERS.find((t) => t.id === activeTier) || TIERS[4];

  // Dynamic simulated competitors scaled around user's current XP
  const baseXP = progress.xp;
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)');
  const userAvatar = user?.photoURL ? user.photoURL : '🦊';

  const competitors = [
    { id: 'c1', name: 'Emilija Kazlauskaitė', xp: Math.max(baseXP + 160, 310), avatar: '👩', streak: 14, change: 'up' },
    { id: 'c2', name: 'Lukas Valančius', xp: Math.max(baseXP + 95, 240), avatar: '👨‍🦱', streak: 9, change: 'same' },
    { id: 'c3', name: 'Jonas Mockus', xp: Math.max(baseXP + 35, 180), avatar: '🧑', streak: 7, change: 'up' },
    { id: 'user', name: userName, xp: baseXP, avatar: userAvatar, streak: progress.streak, isUser: true, change: 'up' },
    { id: 'c4', name: 'Gabija Stankevičiūtė', xp: Math.max(0, baseXP - 25), avatar: '👩‍🦰', streak: 5, change: 'down' },
    { id: 'c5', name: 'Mindaugas Balčiūnas', xp: Math.max(0, baseXP - 70), avatar: '🧔', streak: 4, change: 'down' },
    { id: 'c6', name: 'Austėja Radvilaitė', xp: Math.max(0, baseXP - 120), avatar: '👱‍♀️', streak: 3, change: 'same' },
    { id: 'c7', name: 'Vytautas Didysis', xp: Math.max(0, baseXP - 180), avatar: '👑', streak: 12, change: 'down' },
    { id: 'c8', name: 'Eglė Žalčių Karalienė', xp: Math.max(0, baseXP - 220), avatar: '🧝‍♀️', streak: 8, change: 'same' },
    { id: 'c9', name: 'Dovydas Petrauskas', xp: Math.max(0, baseXP - 280), avatar: '👨', streak: 2, change: 'down' },
  ]
    .sort((a, b) => b.xp - a.xp)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const top3 = competitors.slice(0, 3);
  const remaining = competitors.slice(3);
  const userRank = competitors.find((c) => c.isUser)?.rank || 4;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-slate-200 px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTierObj.color} text-white shadow-md text-2xl`}
              >
                {currentTierObj.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                    {currentTierObj.name}
                  </h1>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Gintaro Lyga
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Compete with fellow Lithuanian learners. Top 3 gain promotion to the next tier!
                </p>
              </div>
            </div>

            {/* Time Remaining Badge */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 self-start sm:self-center">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Liko: 3 dienos 14 val.</span>
            </div>
          </div>

          {/* Tier Navigation Carousel */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {TIERS.map((tier) => {
              const isSelected = tier.id === activeTier;
              return (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shrink-0 transition-all border-2 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{tier.icon}</span>
                  <span>{tier.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* Top 3 Podium Cards */}
        <section className="mb-8">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 text-center">
            Lyderių Pakyla • Podium
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4 items-end max-w-2xl mx-auto">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="text-3xl md:text-4xl">{top3[1].avatar}</div>
                  <span className="absolute -top-2 -right-2 bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-300">
                    2
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                  <div className="text-xs font-black text-slate-800 truncate">{top3[1].name}</div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                    <Zap className="h-3 w-3 fill-amber-500" />
                    <span>{top3[1].xp} XP</span>
                  </div>
                  <div className="mt-2 h-14 md:h-18 bg-gradient-to-t from-slate-200 to-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-xl">
                    🥈
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Taller Center) */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Crown className="h-6 w-6 text-yellow-500 fill-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="text-4xl md:text-5xl">{top3[0].avatar}</div>
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-yellow-500">
                    1
                  </span>
                </div>
                <div className="w-full bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 rounded-2xl p-3 text-center shadow-md">
                  <div className="text-xs font-black text-slate-900 truncate">{top3[0].name}</div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
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
                  <div className="text-3xl md:text-4xl">{top3[2].avatar}</div>
                  <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-amber-800">
                    3
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                  <div className="text-xs font-black text-slate-800 truncate">{top3[2].name}</div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
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

        {/* Promotion Zone Legend */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 mb-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <ChevronUp className="h-4 w-4" />
            <span>Top 3 keliauja į aukštesnę lygą</span>
          </div>
          <div className="text-slate-400">Paskutiniai 3 iškrenta</div>
        </div>

        {/* Competitor List */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {competitors.map((item) => {
            const isTop3 = item.rank <= 3;
            const isDemotion = item.rank >= 8;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 md:p-4 transition-all ${
                  item.isUser
                    ? 'bg-amber-50/90 border-l-4 border-l-amber-500 ring-2 ring-amber-400/30'
                    : isTop3
                    ? 'hover:bg-emerald-50/30'
                    : isDemotion
                    ? 'hover:bg-red-50/30'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Rank & Avatar */}
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

                  <div className="relative">
                    <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl shadow-2xs">
                      {item.avatar}
                    </div>
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
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Flame className="h-3 w-3 fill-orange-500" />
                        {item.streak} d. serija
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: XP Score */}
                <div className="flex items-center gap-2 shrink-0">
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

        {/* Motivational Call-to-action */}
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">Nori pakilti aukščiau lygoje?</h3>
            <p className="text-xs md:text-sm text-emerald-100 font-medium">
              Užbaik pamokas arba pasipraktikuok su DI pokalbių partneriu ir gauk papildomų XP!
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
    </div>
  );
}
