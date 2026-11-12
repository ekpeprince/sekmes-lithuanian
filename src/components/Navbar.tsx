'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Zap, Heart, Volume2, VolumeX, PlusCircle, Sparkles, Bell, Coins } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { sounds } from '@/lib/audio';
import { AuthModal } from '@/components/AuthModal';
import { NotificationModal } from '@/components/NotificationModal';
import { LabasAppLogo } from '@/components/LabasAppLogo';
import { LabasPerksModal } from '@/components/LabasPerksModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { progress, refillHearts, spendLabas, toggleSound } = useGame();
  const [showHeartModal, setShowHeartModal] = useState(false);
  const [showPerksModal, setShowPerksModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // During active lesson or isolated full-page views (/admin, /blog), hide global Navbar
  if (pathname.startsWith('/lesson/') || pathname.startsWith('/admin') || pathname.startsWith('/blog')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-2 border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between w-full px-3 py-2 max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group select-none shrink-0">
            <LabasAppLogo size="md" priority className="group-hover:scale-105 group-hover:rotate-1 transition-transform duration-200" />
            <div className="flex flex-col notranslate justify-center" translate="no">
              <div className="flex items-center text-lg sm:text-xl font-black tracking-tight leading-none">
                <span className="text-slate-900 group-hover:text-emerald-700 transition-colors">Labas</span>
                <span className="text-emerald-600 font-extrabold">App</span>
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" title="Baltic Amber" />
              </div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#059669',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: '1.2',
                  marginTop: '2px',
                }}
              >
                Learn Lithuanian
              </span>
            </div>
          </Link>

          {/* Gamification Stats */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Streak Pill */}
            <div 
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 transition-colors dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 font-bold text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-1 min-w-0"
              title="Daily Learning Streak"
            >
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-orange-500 text-orange-500 shrink-0" />
              <span>{progress.streak}</span>
            </div>

            {/* XP / Energy Pill */}
            <div 
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 transition-colors dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 font-bold text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-1 min-w-0"
              title="Total Experience Points"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-500 text-amber-500 shrink-0" />
              <span>{progress.xp} <span className="hidden md:inline text-[10px] font-semibold text-slate-400">XP</span></span>
            </div>

            {/* Hearts Pill */}
            <button
              type="button"
              onClick={() => setShowHeartModal(true)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-rose-50 hover:border-rose-200/80 transition-colors dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 font-bold text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shrink-1 min-w-0 cursor-pointer group"
              title="Hearts remaining (Click to refill)"
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 fill-rose-500 text-rose-500 shrink-0 ${progress.hearts <= 1 ? 'animate-pulse text-red-600' : 'group-hover:scale-110 transition-transform'}`} />
              <span>{progress.hearts}</span>
              {progress.hearts < 5 && (
                <PlusCircle className="h-3 w-3 text-emerald-500 hidden sm:inline shrink-0" />
              )}
            </button>

            {/* Sound Toggle (Desktop & Tablet) */}
            <button
              type="button"
              onClick={toggleSound}
              title={progress.soundEnabled ? 'Mute audio' : 'Enable audio'}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {progress.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Notifications & Reminders Bell */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowNotificationModal(true);
              }}
              title="Pranešimai & Priminimai • Notifications"
              className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Native Speaker Voice (Leonas) */}
            <button
              type="button"
              onClick={() => {
                sounds.speak('Labas, aš esu Leonas!');
              }}
              title="Native Speaker Voice: Leonas (Male). Click to test audio."
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span className="text-sm">👨</span>
              <span>Leonas</span>
            </button>

            {/* $LABAS Token & Perks Portal for Traders & Learners */}
            <button
              type="button"
              onClick={() => setShowPerksModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200 text-amber-950 text-xs font-black transition-all cursor-pointer shadow-2xs shrink-0 group select-none"
              title="Spend $LABAS &amp; Stellar Perks Store"
            >
              <Coins className="h-3.5 w-3.5 text-amber-600 group-hover:rotate-12 transition-transform shrink-0" />
              <span>$LABAS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Refill Hearts Modal */}
      {showHeartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-pop border-2 border-slate-100">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                <Heart className="h-10 w-10 fill-rose-500 text-rose-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {progress.hearts === 5 ? 'Hearts are Full!' : 'Need More Hearts?'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                You currently have <strong className="text-rose-500">{progress.hearts} / 5</strong> hearts.
                Wrong answers cost 1 heart. Practice to regain hearts or refill them anytime!
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                {progress.hearts < 5 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        refillHearts();
                        setShowHeartModal(false);
                      }}
                      className="btn-3d btn-green-3d w-full py-3 text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="h-5 w-5" />
                      Refill 5 Hearts Now (Free)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        spendLabas(0.5, 'hearts');
                        setShowHeartModal(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Coins className="h-4 w-4" />
                      <span>Instant Refill (0.50 $LABAS)</span>
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setShowHeartModal(false);
                    setShowPerksModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Open $LABAS Store &amp; Perks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHeartModal(false)}
                  className="rounded-xl border-2 border-slate-200 py-2 font-bold text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* $LABAS In-App Perks & Power-Ups Store Modal */}
      <LabasPerksModal
        isOpen={showPerksModal}
        onClose={() => setShowPerksModal(false)}
      />

      {/* Notifications Pop-up Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </>
  );
};
