'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Zap, Heart, Volume2, VolumeX, PlusCircle, Sparkles, Mic } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { sounds } from '@/lib/audio';

export const Navbar: React.FC = () => {
  const { progress, refillHearts, toggleSound, setVoiceGender } = useGame();
  const [showHeartModal, setShowHeartModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-2 border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 p-1 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🇱🇹</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-emerald-600 block leading-tight">
                SĖKMĖS!
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Lithuanian A1
              </span>
            </div>
          </Link>

          {/* Gamification Stats */}
          <div className="flex items-center gap-2 sm:gap-5">
            {/* Streak */}
            <div 
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold text-orange-500 hover:bg-orange-50 transition-colors"
              title="Daily Learning Streak"
            >
              <Flame className="h-5 w-5 fill-orange-500 animate-bounce-slow text-orange-500" />
              <span className="text-sm sm:text-base">{progress.streak}</span>
            </div>

            {/* XP */}
            <div 
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold text-amber-500 hover:bg-amber-50 transition-colors"
              title="Total Experience Points"
            >
              <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="text-sm sm:text-base">{progress.xp} <span className="hidden sm:inline text-xs font-semibold text-amber-600/70">XP</span></span>
            </div>

            {/* Hearts */}
            <button
              type="button"
              onClick={() => setShowHeartModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer group"
              title="Hearts remaining (Click to refill)"
            >
              <Heart className={`h-5 w-5 fill-rose-500 text-rose-500 transition-transform ${progress.hearts <= 1 ? 'animate-pulse text-red-600' : 'group-hover:scale-110'}`} />
              <span className="text-sm sm:text-base">{progress.hearts}</span>
              {progress.hearts < 5 && (
                <PlusCircle className="h-4 w-4 text-emerald-500 hidden sm:inline" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={progress.soundEnabled ? 'Mute audio' : 'Enable audio'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {progress.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Native Speaker Voice Switcher */}
            <button
              type="button"
              onClick={() => {
                const nextGender = progress.voiceGender === 'male' ? 'female' : 'male';
                setVoiceGender(nextGender);
                sounds.speak(nextGender === 'male' ? 'Labas, aš esu Leonas!' : 'Labas, aš esu Ona!');
              }}
              title={`Native Speaker Voice: ${progress.voiceGender === 'male' ? 'Leonas (Male)' : 'Ona (Female)'}. Click to switch voice.`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span className="text-sm">{progress.voiceGender === 'male' ? '👨' : '👩'}</span>
              <span className="hidden md:inline">{progress.voiceGender === 'male' ? 'Leonas' : 'Ona'}</span>
            </button>
          </div>
        </div>
      </header>

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
    </>
  );
};
