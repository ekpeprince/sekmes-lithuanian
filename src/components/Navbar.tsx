'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Zap, Heart, Volume2, VolumeX, PlusCircle, Sparkles, User as UserIcon, LogOut, Cloud, ChevronDown, Bell } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { sounds } from '@/lib/audio';
import { AuthModal } from '@/components/AuthModal';
import { NotificationModal } from '@/components/NotificationModal';
import { LabasAppLogo } from '@/components/LabasAppLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { progress, refillHearts, toggleSound, setVoiceGender } = useGame();
  const { user, signOut } = useAuth();
  const [showHeartModal, setShowHeartModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // During active lesson, hide global Navbar to maximize mobile screen space
  if (pathname.startsWith('/lesson/')) {
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

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Paskyros nustatymai"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                    {user.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={user.photoURL} alt="User" className="h-6 w-6 rounded-full" />
                    ) : (
                      (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-emerald-600 hidden sm:inline" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-3 shadow-xl border-2 border-slate-100 animate-pop z-50">
                    <div className="border-b border-slate-100 pb-2.5 mb-2 px-1">
                      <p className="text-xs font-black text-slate-800 truncate">
                        {user.displayName || 'Vartotojas'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <Cloud className="h-3 w-3" />
                        <span>Pažanga debesyje aktyvi • Cloud sync</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Atsijungti • Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Log In to save progress"
              >
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden min-[360px]:inline">Log In</span>
              </button>
            )}
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

              <div className="mt-6 flex flex-col gap-3">
                {progress.hearts < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      refillHearts();
                      setShowHeartModal(false);
                    }}
                    className="btn-3d btn-green-3d w-full py-3 text-center flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Refill 5 Hearts Now (Free)
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowHeartModal(false)}
                  className="rounded-xl border-2 border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Pop-up Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </>
  );
};
