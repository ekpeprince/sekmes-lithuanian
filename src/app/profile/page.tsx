'use client';

import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllLessons } from '@/data/curriculum';
import { Heart, RotateCcw, Sparkles, BellRing, ChevronRight, Settings, X } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { OfflineAudioPackCard } from '@/components/OfflineAudioPackCard';
import { NotificationModal } from '@/components/NotificationModal';
import { LEAGUE_TIERS, LeagueTier, getLeagueTierByXp } from '@/lib/league';

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

  const userTier = (progress.leagueTier && LEAGUE_TIERS[progress.leagueTier as LeagueTier])
    ? (progress.leagueTier as LeagueTier)
    : getLeagueTierByXp(progress.xp);
  const tierConfig = LEAGUE_TIERS[userTier] || LEAGUE_TIERS['Geležis'];

  const achievements = [
    {
      id: 'first_lesson',
      title: 'First Step',
      desc: 'Complete 1 lesson',
      isUnlocked: completedCount >= 1,
      current: Math.min(1, completedCount),
      max: 1,
      progressText: `${Math.min(1, completedCount)} / 1`,
      reward: '+10 💎',
      icon: '🌱',
    },
    {
      id: 'streak_master',
      title: 'Lithuanian Flame',
      desc: 'Active study streak',
      isUnlocked: progress.streak >= 1,
      current: Math.min(1, progress.streak),
      max: 1,
      progressText: `${Math.min(1, progress.streak)} / 1 day`,
      reward: '+15 💎',
      icon: '🔥',
    },
    {
      id: 'xp_warrior',
      title: 'Centurion',
      desc: 'Earn 50 XP in journey',
      isUnlocked: progress.xp >= 50,
      current: Math.min(50, progress.xp),
      max: 50,
      progressText: `${Math.min(50, progress.xp)} / 50 XP`,
      reward: '+20 💎',
      icon: '⚡',
    },
    {
      id: 'unit_champion',
      title: 'Vilnius Expert',
      desc: 'Complete 3 lessons',
      isUnlocked: completedCount >= 3,
      current: Math.min(3, completedCount),
      max: 3,
      progressText: `${Math.min(3, completedCount)} / 3`,
      reward: '+25 💎',
      icon: '🏰',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 pb-20 md:pb-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-2">
        {/* Compact Horizontal Hero Card */}
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs mb-2">
          {/* Left: Avatar Icon */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 flex items-center justify-center text-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20">
              🇱🇹
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-amber-400 text-white font-black text-[9px] sm:text-[10px] border-2 border-white shadow-xs">
              L{level}
            </div>
          </div>

          {/* Right: User Details & Progress */}
          <div className="flex-1 min-w-0">
            {/* Top Row: User Name + Gems + Settings Gear Icon */}
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {displayName}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-500" />
                  <span>{progress.gems}</span>
                  <span className="hidden sm:inline">Amber Gems</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowSettingsModal(true);
                  }}
                  className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Settings & Preferences"
                  aria-label="Settings"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Subtitle with vertical spacing */}
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5 mb-1">
              Lithuanian Learner • Level {level}
            </p>

            {/* Progress Row */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
              <span>Curriculum Progress: </span>
              <span>{completedCount} / {totalCount} Lessons ({completionPercent}%)</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Immersion Dashboard */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-3 sm:p-3.5 shadow-xs mb-2">
          {/* Header */}
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <span>🇱🇹</span>
            <span>Total Immersion</span>
          </div>

          {/* 3-Tile Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Time Learned */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">⏱️</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {formatTimeLearned(totalPracticeSeconds)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                Time Learned
              </span>
            </div>

            {/* 2. Words Mastered */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">📚</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {wordsMasteredCount}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                Words Mastered
              </span>
            </div>

            {/* 3. Duels Won */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">⚔️</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {duelsWonCount}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                Duels Won
              </span>
            </div>
          </div>
        </div>

        {/* League & Speed Drill Highlights: 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Left: Bronze League Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 h-full">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-300/60 text-lg sm:text-xl">
              {tierConfig.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block truncate">
                Current League
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Rank #{progress.leagueRank || 4} • {tierConfig.englishName}
              </p>
            </div>
          </div>

          {/* Right: Speed Drill Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 h-full">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-300/60 text-lg sm:text-xl">
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

        {/* Achievements Horizontal Carousel Strip */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-black uppercase tracking-wider text-slate-600">
            <span>🏅</span>
            <span>Achievements</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {achievements.map((item) => {
              const progressPercent = Math.min(100, Math.round((item.current / item.max) * 100));
              return (
                <div
                  key={item.id}
                  className={`w-[140px] shrink-0 p-2.5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                    item.isUnlocked
                      ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-300 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/90 opacity-85'
                  }`}
                >
                  {/* Top row: Medallion + Reward pill */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                        item.isUnlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs ring-2 ring-amber-200'
                          : 'bg-slate-200/80 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <span className="text-[9px] font-black text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded-md">
                      {item.reward}
                    </span>
                  </div>

                  {/* Middle row: Title + Subtitle */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 truncate mt-1.5">
                      {item.title}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium truncate">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom status */}
                  <div>
                    {item.isUnlocked ? (
                      <div className="text-[9px] font-black text-emerald-600 flex items-center gap-1 mt-1.5">
                        <span>✓</span>
                        <span>Unlocked</span>
                      </div>
                    ) : (
                      <div className="mt-1.5">
                        <div className="h-[3px] w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 text-right">
                          {item.progressText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Single-Row Offline Audio Utility Tile */}
        <OfflineAudioPackCard />

        {/* Compact Single-Row Notifications & Reminders Tile */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowNotificationModal(true);
          }}
          className="bg-white border-2 border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all text-left cursor-pointer group w-full"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
              <BellRing className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800">
              Notifications & Reminders
            </h3>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
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
