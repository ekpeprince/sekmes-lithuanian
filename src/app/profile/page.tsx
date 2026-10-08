'use client';

import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { getAllLessons } from '@/data/curriculum';
import { Zap, Flame, Heart, Trophy, Award, RotateCcw, Sparkles, BellRing, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { OfflineAudioPackCard } from '@/components/OfflineAudioPackCard';
import { NotificationModal } from '@/components/NotificationModal';

export default function ProfilePage() {
  const { progress, refillHearts, resetProgress } = useGame();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const allLessons = getAllLessons();

  const completedCount = progress.completedLessons.length;
  const totalCount = allLessons.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

  const level = Math.floor(progress.xp / 50) + 1;

  const achievements = [
    {
      id: 'first_lesson',
      title: 'Pirmas Žingsnis (First Step)',
      desc: 'Complete your first Lithuanian lesson',
      isUnlocked: completedCount >= 1,
      icon: '🌱',
    },
    {
      id: 'streak_master',
      title: 'Lietuvos Ugnis (Lithuanian Flame)',
      desc: 'Achieve an active study streak',
      isUnlocked: progress.streak >= 1,
      icon: '🔥',
    },
    {
      id: 'xp_warrior',
      title: 'Šimtas Taškų (Centurion)',
      desc: 'Earn over 50 XP in your journey',
      isUnlocked: progress.xp >= 50,
      icon: '⚡',
    },
    {
      id: 'unit_champion',
      title: 'Vilniaus Žinovas (Vilnius Expert)',
      desc: 'Complete 3 or more lessons',
      isUnlocked: completedCount >= 3,
      icon: '🏰',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Profile Card */}
        <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-5xl shadow-lg shadow-emerald-500/20">
              🇱🇹
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white font-black text-xs border-2 border-white shadow-xs">
              L{level}
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Lietuvių Mokinys • Learner
                </h1>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-0.5">
                  Lithuanian A1 Learner • Level {level}
                </p>
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs px-3 py-1.5 rounded-xl">
                  <Sparkles className="h-4 w-4 fill-amber-500" />
                  {progress.gems} Gintarai (Amber Gems)
                </span>
              </div>
            </div>

            {/* Course Completion Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-black text-slate-600 mb-1">
                <span>Curriculum Mastered</span>
                <span>{completedCount} / {totalCount} Lessons ({completionPercent}%)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 flex flex-col items-center text-center">
            <Zap className="h-8 w-8 text-amber-500 fill-amber-500 mb-2" />
            <span className="text-2xl font-black text-slate-800">{progress.xp}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
          </div>

          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 flex flex-col items-center text-center">
            <Flame className="h-8 w-8 text-orange-500 fill-orange-500 mb-2" />
            <span className="text-2xl font-black text-slate-800">{progress.streak}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day Streak</span>
          </div>

          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 flex flex-col items-center text-center">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500 mb-2" />
            <span className="text-2xl font-black text-slate-800">{progress.hearts} / 5</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hearts</span>
          </div>

          <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 flex flex-col items-center text-center">
            <Trophy className="h-8 w-8 text-sky-500 mb-2" />
            <span className="text-2xl font-black text-slate-800">{completedCount}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
          </div>
        </div>

        {/* Amber League & Speed Drill Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                Current League Division
              </span>
              <h3 className="text-2xl font-black">{progress.leagueTier || 'Bronza'} Tier</h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Division Rank #{progress.leagueRank || 4} • Amber League
              </p>
            </div>
            <span className="text-4xl">💎</span>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                60s Speed Drill High Score
              </span>
              <h3 className="text-2xl font-black">{progress.speedDrillHighScore || 0} pts</h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Practice Gym Speed Record
              </p>
            </div>
            <span className="text-4xl">⏱️</span>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            <span>Pasiekimai (Achievements)</span>
          </h2>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl p-5 border-2 flex items-center gap-4 transition-all ${
                  item.isUnlocked
                    ? 'bg-white border-amber-300 shadow-xs'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl border border-amber-200">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.desc}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider ${
                    item.isUnlocked ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {item.isUnlocked ? '✓ Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Audio Pack */}
        <OfflineAudioPackCard />

        {/* Notifications & Reminders Action Row */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowNotificationModal(true);
          }}
          className="w-full flex items-center justify-between p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-105 transition-transform">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <span>Pranešimai & Priminimai</span>
                <span className="text-[11px] font-bold text-slate-400 font-sans">(Notifications)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Streak protection, Word of the Day & heart refill alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              Nustatymai • Open
            </span>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </button>

        {/* Notification Modal Pop-up */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />

        {/* Quick Testing & Management Controls */}
        <div className="rounded-3xl bg-white border-2 border-slate-200 p-6">
          <h3 className="font-extrabold text-slate-800 text-base mb-1">
            Testing & Progress Settings
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Quickly adjust your local state while evaluating and practicing different lesson modules.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                refillHearts();
                sounds.playSuccess();
              }}
              className="btn-3d btn-green-3d py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <Heart className="h-4 w-4 fill-white" />
              <span>Refill 5 Hearts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to reset all XP and completed lessons?')) {
                  resetProgress();
                  sounds.playClick();
                }
              }}
              className="rounded-2xl border-2 border-rose-200 py-2.5 px-4 font-bold text-rose-600 hover:bg-rose-50 text-xs flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Progress</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
