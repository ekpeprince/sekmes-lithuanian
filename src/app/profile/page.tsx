'use client';

import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllLessons } from '@/data/curriculum';
import { Heart, Award, RotateCcw, Sparkles, BellRing, ChevronRight, Settings, X } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { OfflineAudioPackCard } from '@/components/OfflineAudioPackCard';
import { NotificationModal } from '@/components/NotificationModal';

export default function ProfilePage() {
  const {
    progress,
    totalPracticeSeconds,
    wordsMasteredCount,
    duelsWonCount,
    formatTimeLearned,
    refillHearts,
    resetProgress,
  } = useGame();
  const { user } = useAuth();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const allLessons = getAllLessons();

  const completedCount = progress.completedLessons.length;
  const totalCount = allLessons.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);

  const level = Math.floor(progress.xp / 50) + 1;
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Lithuanian Learner');

  const achievements = [
    {
      id: 'first_lesson',
      title: 'First Step',
      desc: 'Complete your first Lithuanian lesson',
      isUnlocked: completedCount >= 1,
      icon: '🌱',
    },
    {
      id: 'streak_master',
      title: 'Lithuanian Flame',
      desc: 'Achieve an active study streak',
      isUnlocked: progress.streak >= 1,
      icon: '🔥',
    },
    {
      id: 'xp_warrior',
      title: 'Centurion',
      desc: 'Earn over 50 XP in your journey',
      isUnlocked: progress.xp >= 50,
      icon: '⚡',
    },
    {
      id: 'unit_champion',
      title: 'Vilnius Expert',
      desc: 'Complete 3 or more lessons',
      isUnlocked: completedCount >= 3,
      icon: '🏰',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header Card */}
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
                  {displayName}
                </h1>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-0.5">
                  Lithuanian Learner • Level {level}
                </p>
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs px-3 py-1.5 rounded-xl">
                  <Sparkles className="h-4 w-4 fill-amber-500" />
                  {progress.gems} Amber Gems
                </span>

                {/* Subtle settings gear icon */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowSettingsModal(true);
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Settings & Preferences"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Course Completion Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-black text-slate-600 mb-1">
                <span>Curriculum Progress:</span>
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

        {/* Total Immersion Dashboard */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs mb-4">
          {/* Header */}
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <span>🇱🇹</span>
            <span>Total Immersion</span>
          </div>

          {/* 3-Tile Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Time Learned */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-1">⏱️</span>
              <span className="text-lg font-black text-slate-900 leading-tight">
                {formatTimeLearned(totalPracticeSeconds)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Time Learned
              </span>
            </div>

            {/* 2. Words Mastered */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-1">📚</span>
              <span className="text-lg font-black text-slate-900 leading-tight">
                {wordsMasteredCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Words Mastered
              </span>
            </div>

            {/* 3. Duels Won */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-1">⚔️</span>
              <span className="text-lg font-black text-slate-900 leading-tight">
                {duelsWonCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Duels Won
              </span>
            </div>
          </div>
        </div>

        {/* League & Speed Drill Highlights: 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Left: Bronze League Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 h-full">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-300/60 text-xl sm:text-2xl">
              💎
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block truncate">
                Current League
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Rank #{progress.leagueRank || 4} • {progress.leagueTier || 'Bronze'} Tier
              </p>
            </div>
          </div>

          {/* Right: Speed Drill Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 h-full">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-300/60 text-xl sm:text-2xl">
              ⏱️
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block truncate">
                60s Speed Drill
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Best: {progress.speedDrillHighScore || 0} pts
              </p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            <span>Achievements</span>
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
          className="w-full flex items-center justify-between p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left cursor-pointer group mb-8"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-105 transition-transform">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Notifications & Reminders
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Streak protection, Word of the Day & heart refill alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              Configure
            </span>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </button>

        {/* Notification Modal Pop-up */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />

        {/* Settings Modal (Developer & Progress Controls hidden from primary view) */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Settings & Testing
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Adjust practice state & hearts
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    refillHearts();
                    sounds.playSuccess();
                  }}
                  className="w-full btn-3d btn-green-3d py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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
                      setShowSettingsModal(false);
                    }
                  }}
                  className="w-full rounded-2xl border-2 border-rose-200 py-2.5 px-4 font-bold text-rose-600 hover:bg-rose-50 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset All Progress</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
