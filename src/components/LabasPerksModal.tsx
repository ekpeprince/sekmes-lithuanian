'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  Shield,
  Sparkles,
  Coins,
  Check,
  AlertCircle,
  ArrowUpRight,
  Crown,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';

interface LabasPerksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabasPerksModal: React.FC<LabasPerksModalProps> = ({ isOpen, onClose }) => {
  const { progress, spendLabas } = useGame();
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const internalBalance =
    typeof progress.internalLabasBalance === 'number'
      ? progress.internalLabasBalance
      : (progress.xp || 0) / 100;

  const currentHearts = progress.hearts ?? 5;
  const currentFreezes = progress.streakFreezes ?? 1;

  const handleBuyPerk = (amount: number, perk: 'hearts' | 'streak_freeze', perkName: string) => {
    setPurchaseError(null);
    setPurchaseSuccess(null);

    const res = spendLabas(amount, perk);
    if (res.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
      setPurchaseSuccess(`Successfully activated ${perkName}!`);
      setTimeout(() => setPurchaseSuccess(null), 3000);
    } else {
      setPurchaseError(res.error || 'Failed to purchase perk.');
      setTimeout(() => setPurchaseError(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100 space-y-5 animate-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                $LABAS Perks &amp; Store
              </h2>
              <p className="text-xs text-slate-500">
                Spend in-app earnings to boost your learning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Your Available Balance
            </span>
            <span className="text-xl font-black text-emerald-700 tracking-tight">
              {internalBalance.toFixed(2)}{' '}
              <span className="text-xs font-bold text-emerald-600">$LABAS</span>
            </span>
          </div>
          <Link
            href="/token"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 text-xs font-black inline-flex items-center gap-1 shadow-2xs transition"
          >
            <span>Token Portal</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Feedback banners */}
        {purchaseSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{purchaseSuccess}</span>
          </div>
        )}
        {purchaseError && (
          <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 font-medium text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{purchaseError}</span>
          </div>
        )}

        {/* Perks List */}
        <div className="space-y-3">
          
          {/* Perk 1: Instant Heart Refill */}
          <div className="p-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Instant Max Hearts (5/5)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {currentHearts === 5
                    ? 'Hearts currently full (5/5)'
                    : `Currently ${currentHearts} / 5 hearts`}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={currentHearts === 5 || internalBalance < 0.5}
              onClick={() => handleBuyPerk(0.5, 'hearts', '5 Full Hearts')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                currentHearts === 5
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : internalBalance < 0.5
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
              }`}
            >
              {currentHearts === 5 ? 'Full' : '0.50 $LABAS'}
            </button>
          </div>

          {/* Perk 2: Streak Freeze Shield */}
          <div className="p-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 shrink-0">
                <Shield className="w-5 h-5 fill-blue-500/20" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900">
                    Streak Freeze Shield
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {currentFreezes} active
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Protects your streak if you miss a day
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={internalBalance < 1.0}
              onClick={() => handleBuyPerk(1.0, 'streak_freeze', 'Streak Freeze Shield')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                internalBalance < 1.0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              1.00 $LABAS
            </button>
          </div>

          {/* Perk 3: LabasApp Pro 20% Discount */}
          <div className="p-3.5 rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-amber-100/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-950">
                    LabasApp Pro 20% Off
                  </span>
                  <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                    Discount
                  </span>
                </div>
                <span className="text-[11px] text-amber-900/80 block">
                  Pay with $LABAS on Stellar to get 20% off
                </span>
              </div>
            </div>

            <Link
              href="/token"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shrink-0 shadow-xs inline-flex items-center gap-1"
            >
              <span>Learn How</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          Earn $LABAS automatically (100 XP = 1 $LABAS). Spend in-app or withdraw on Stellar anytime.
        </p>
      </div>
    </div>
  );
};

