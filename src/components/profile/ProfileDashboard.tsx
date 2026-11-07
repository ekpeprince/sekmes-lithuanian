'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Flame,
  BookOpen,
  Mic,
  ArrowUpRight,
  ShieldCheck,
  Copy,
  Check,
  X,
  History,
  Settings,
  BellRing,
  Heart,
  RotateCcw,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllLessons } from '@/data/curriculum';
import { saveProgressToCloud, loadTokenClaimsFromCloud } from '@/lib/progressSync';
import { sounds } from '@/lib/audio';
import { logEvent } from '@/lib/telemetry';
import { AuthModal } from '@/components/AuthModal';
import { NotificationModal } from '@/components/NotificationModal';
import { OfflineAudioPackCard } from '@/components/OfflineAudioPackCard';
import { LithuanianFlagEmblem } from '@/components/LithuanianFlagEmblem';
import { LEAGUE_TIERS, LeagueTier, getLeagueTierByXp } from '@/lib/league';
import { TokenClaimRecord } from '@/types/lesson';

const XP_PER_LABAS = 100;
const MIN_CLAIM_XP = 500;
const STELLAR_PUBKEY_REGEX = /^G[A-Z2-7]{55}$/;

interface TrustlineCheckState {
  checking: boolean;
  checked: boolean;
  hasTrustline: boolean;
  accountExists: boolean;
  issuerConfigured: boolean;
  assetCode: string;
  issuerPublicKey: string | null;
  errorCode: string | null;
  message: string | null;
}

/**
 * Crisp custom SVG emblem for Stellar Network
 */
const StellarMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3.5 15.5L20.5 8.5M3.5 12L20.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* ============================================================================
 * A. HERO PROFILE CARD (ProfileHeader)
 * ========================================================================== */
interface ProfileHeaderProps {
  displayName: string;
  level: number;
  gems: number;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  onOpenSettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  level,
  gems,
  completedCount,
  totalCount,
  completionPercent,
  onOpenSettings,
}) => {
  return (
    <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs">
      {/* Avatar with Lithuanian Tricolor Emblem & Level Pill */}
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-md shadow-emerald-600/15">
          <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
            <LithuanianFlagEmblem size="md" />
          </div>
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 border-2 border-white shadow-xs">
          Lvl {level}
        </div>
      </div>

      {/* User Details & Curriculum Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
            {displayName}
          </h1>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs px-2.5 py-1 rounded-xl tabular-nums">
              <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{gems}</span>
              <span className="hidden sm:inline">Amber Gems</span>
            </span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
              title="Settings & Preferences"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mt-0.5 mb-2">
          Lithuanian Learner • Level {level}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1.5">
          <span>Curriculum Progress</span>
          <span className="text-slate-800 font-bold tabular-nums">
            {completedCount} / {totalCount} Lessons ({completionPercent}%)
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${Math.max(completionPercent, completedCount > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * B. STELLAR MAINNET FINTECH CARD (StellarRewardsCard)
 * ========================================================================== */
interface StellarRewardsCardProps {
  xpBalance: number;
  lifetimeXp: number;
  claimableLabasTokens: number;
  convertibleXp: number;
  canMeetMinThreshold: boolean;
  thresholdProgressPercent: number;
  totalLabasClaimed: number;
  linkedWallet: string | null;
  trustlineState: TrustlineCheckState;
  isClaiming: boolean;
  claimError: {
    message: string;
    code?: string | null;
    issuerPublicKey?: string | null;
    assetCode?: string;
  } | null;
  claimSuccess: {
    transactionHash: string;
    explorerUrl: string;
    issuedTokenAmount: number;
    xpClaimed: number;
    updatedXpBalance: number;
  } | null;
  claimHistory: TokenClaimRecord[];
  copiedKey: string | null;
  streakDays: number;
  wordsMasteredCount: number;
  voiceDrillsCount: number;
  onOpenWalletModal: () => void;
  onClaimTokens: () => void;
  onDismissError: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const StellarRewardsCard: React.FC<StellarRewardsCardProps> = ({
  xpBalance,
  lifetimeXp,
  claimableLabasTokens,
  convertibleXp,
  canMeetMinThreshold,
  thresholdProgressPercent,
  totalLabasClaimed,
  linkedWallet,
  trustlineState,
  isClaiming,
  claimError,
  claimSuccess,
  claimHistory,
  copiedKey,
  streakDays,
  wordsMasteredCount,
  voiceDrillsCount,
  onOpenWalletModal,
  onClaimTokens,
  onDismissError,
  onCopyText,
}) => {
  const isButtonEnabled = Boolean(linkedWallet && canMeetMinThreshold && !isClaiming);
  const streakPercent = Math.min(100, Math.round((streakDays / 7) * 100));
  const vocabPercent = Math.min(100, Math.round((wordsMasteredCount / 50) * 100));
  const voicePercent = Math.min(100, Math.round((voiceDrillsCount / 10) * 100));

  return (
    <section
      aria-label="Stellar Mainnet $LABAS Micro-Reward Engine"
      className="rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs overflow-hidden"
    >
      {/* Top Executive Fintech Header Banner (Deep Slate-900 Accent Header) */}
      <div className="bg-slate-900 px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <StellarMark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                $LABAS Token Vault
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Stellar Mainnet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Fixed conversion rate: <strong className="text-slate-200">100 XP = 1.00 $LABAS</strong> • Minimum payout: <strong className="text-slate-200">500 XP</strong>
            </p>
          </div>
        </div>

        {/* Wallet Connection State Pill / Button (Single-line, never wraps awkwardly) */}
        {linkedWallet ? (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="inline-flex items-center gap-2 self-start sm:self-auto whitespace-nowrap rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
            title="Click to update Stellar Mainnet address"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-extrabold text-[11px]">Mainnet Linked</span>
            <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
              {linkedWallet.slice(0, 6)}...{linkedWallet.slice(-4)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="inline-flex items-center gap-2 self-start sm:self-auto whitespace-nowrap rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-black tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            <span>Connect Stellar Wallet</span>
          </button>
        )}
      </div>

      {/* Main Body: 2-Column Institutional Fintech Grid on Desktop */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (7 cols): Financial Balances, 500 XP Threshold & Conversion CTA */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* 2-Card Balance Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Available XP Balance */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Available XP</span>
                <span className="text-amber-600 font-black">XP</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {xpBalance.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-slate-400">XP</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-slate-500 tabular-nums">
                <span>Lifetime Earned</span>
                <span className="font-bold text-slate-700">{lifetimeXp.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Metric 2: Claimable $LABAS Reward */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/90 p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                <span>Claimable</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                  $LABAS
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  {claimableLabasTokens.toFixed(2)}
                </span>
                <span className="text-xs font-black text-emerald-600">$LABAS</span>
              </div>
              <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-800/80 tabular-nums">
                <span>Total Claimed</span>
                <span className="font-bold text-emerald-900">
                  {(totalLabasClaimed || 0).toFixed(2)} $LABAS
                </span>
              </div>
            </div>
          </div>

          {/* 500 XP Threshold Progress Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Payout Threshold Progress</span>
              </span>
              <span className="font-black text-slate-900 tabular-nums">
                {Math.min(xpBalance, MIN_CLAIM_XP)} / {MIN_CLAIM_XP} XP ({thresholdProgressPercent}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${thresholdProgressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
              {canMeetMinThreshold ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Ready to convert {convertibleXp} XP &rarr; {claimableLabasTokens} $LABAS on Stellar Mainnet
                </span>
              ) : (
                <span>
                  Earn <strong className="text-slate-800">{MIN_CLAIM_XP - xpBalance} more XP</strong> to unlock your 5.00 $LABAS Mainnet transfer
                </span>
              )}
              {linkedWallet && trustlineState.checked && (
                <span
                  className={`font-bold shrink-0 ${
                    trustlineState.hasTrustline ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {trustlineState.hasTrustline ? '✓ Trustline Active' : '• Add Trustline'}
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div>
            <button
              type="button"
              onClick={onClaimTokens}
              disabled={!isButtonEnabled}
              className={`w-full rounded-2xl py-3.5 px-5 text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ${
                isClaiming
                  ? 'bg-amber-500 text-white cursor-wait'
                  : isButtonEnabled
                  ? 'btn-3d btn-green-3d text-white cursor-pointer'
                  : 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting to Stellar Mainnet Ledger...</span>
                </>
              ) : isButtonEnabled ? (
                <>
                  <span>Convert {convertibleXp} XP to {claimableLabasTokens} $LABAS</span>
                  <ArrowUpRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    {!linkedWallet
                      ? 'Connect Stellar Wallet to Convert XP'
                      : `Reach ${MIN_CLAIM_XP} XP Minimum to Convert ($LABAS)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Verified Habit & Performance Multipliers */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200/90 p-4 flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Verified Earning Milestones
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Daily habits that generate convertible Mainnet XP
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {/* 1. Consistency Streak */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-500">
                    <Flame className="h-3.5 w-3.5 fill-orange-500" />
                  </span>
                  Consistency Streak
                </span>
                <span className="text-[11px] font-black text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-lg tabular-nums">
                  {streakDays}d / 7d
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(streakPercent, 6)}%` }}
                />
              </div>
            </div>

            {/* 2. Vocabulary Mastery */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  Vocabulary Mastery
                </span>
                <span className="text-[11px] font-black text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-lg tabular-nums">
                  {wordsMasteredCount} / 50
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(vocabPercent, 4)}%` }}
                />
              </div>
            </div>

            {/* 3. Aistė Voice Drills */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600">
                    <Mic className="h-3.5 w-3.5" />
                  </span>
                  Aistė Voice Drills
                </span>
                <span className="text-[11px] font-black text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-lg tabular-nums">
                  {voiceDrillsCount} / 10
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(voicePercent, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Error Feedback Banner */}
      {claimError && (
        <div
          role="alert"
          className="mx-4 mb-4 sm:mx-6 sm:mb-6 rounded-2xl bg-rose-50 border-2 border-rose-200 p-4 text-xs text-rose-900 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="font-black text-rose-900 flex items-center gap-2 flex-wrap">
              <span>Stellar Mainnet Notice</span>
              {claimError.code && (
                <span className="px-2 py-0.5 rounded-md bg-rose-200/70 text-rose-950 font-mono text-[10px]">
                  {claimError.code}
                </span>
              )}
            </div>
            <p className="text-rose-800 font-medium leading-relaxed">{claimError.message}</p>

            {(claimError.code === 'op_no_trust' || claimError.code === 'account_not_found') && (
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-rose-900">
                  Asset Code:{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">
                    {claimError.assetCode || 'LABAS'}
                  </code>
                </span>
                {claimError.issuerPublicKey && (
                  <button
                    type="button"
                    onClick={() => onCopyText(claimError.issuerPublicKey!, 'issuer')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-rose-200 font-mono text-[10px] font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
                  >
                    <span>
                      Issuer: {claimError.issuerPublicKey.slice(0, 6)}...
                      {claimError.issuerPublicKey.slice(-4)}
                    </span>
                    {copiedKey === 'issuer' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mainnet Transaction Confirmation Banner */}
      {claimSuccess && (
        <div
          role="status"
          className="mx-4 mb-4 sm:mx-6 sm:mb-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-4 text-xs text-emerald-950 flex items-start gap-3 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="font-black text-emerald-950 text-sm">
              +{claimSuccess.issuedTokenAmount} $LABAS Confirmed on Stellar Mainnet!
            </h4>
            <p className="text-emerald-800 font-medium">
              Converted <strong>{claimSuccess.xpClaimed} XP</strong> into{' '}
              <strong>{claimSuccess.issuedTokenAmount} $LABAS</strong>. Updated balance:{' '}
              <strong>{claimSuccess.updatedXpBalance} XP</strong>.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <a
                href={claimSuccess.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-colors shadow-2xs"
              >
                <span>Verify on Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="font-mono text-[10px] text-emerald-700 truncate max-w-[220px]">
                TX: {claimSuccess.transactionHash.slice(0, 10)}...
                {claimSuccess.transactionHash.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent On-Chain Claim Audit Trail */}
      {claimHistory.length > 0 && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stellar Mainnet Audit Trail</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {claimHistory.slice(0, 4).map((item) => (
              <div
                key={item.id || item.transactionHash}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-black text-emerald-700 shrink-0">
                    +{item.tokenAmount} ${item.assetCode || 'LABAS'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                    ({item.xpClaimed} XP)
                  </span>
                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={
                    item.explorerUrl ||
                    `https://stellar.expert/explorer/public/tx/${item.transactionHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 shrink-0"
                >
                  <span className="font-mono">
                    {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export const MilestonesSection: React.FC<{
  streakDays: number;
  wordsMasteredCount: number;
  voiceDrillsCount: number;
}> = () => null;

/* ============================================================================
 * COMPLETE COHESIVE PROFILE & STELLAR REWARDS SCREEN (ProfileDashboard)
 * ========================================================================== */
export const ProfileDashboard: React.FC = () => {
  const {
    progress,
    totalPracticeSeconds,
    wordsMasteredCount,
    duelsWonCount,
    formatTimeLearned,
    refillHearts,
    resetProgress,
    setStellarWallet,
    applyXpClaim,
  } = useGame();
  const { user } = useAuth();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [walletInput, setWalletInput] = useState(progress.stellarPublicKey || '');
  const [walletInputError, setWalletInputError] = useState<string | null>(null);
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<{
    message: string;
    code?: string | null;
    issuerPublicKey?: string | null;
    assetCode?: string;
  } | null>(null);

  const [claimSuccess, setClaimSuccess] = useState<{
    transactionHash: string;
    explorerUrl: string;
    issuedTokenAmount: number;
    xpClaimed: number;
    updatedXpBalance: number;
  } | null>(null);

  const [trustlineState, setTrustlineState] = useState<TrustlineCheckState>({
    checking: false,
    checked: false,
    hasTrustline: false,
    accountExists: false,
    issuerConfigured: false,
    assetCode: 'LABAS',
    issuerPublicKey: null,
    errorCode: null,
    message: null,
  });

  const [claimHistory, setClaimHistory] = useState<TokenClaimRecord[]>(
    progress.claimHistory || []
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allLessons = getAllLessons();
  const completedCount = progress.completedLessons.length;
  const totalCount = allLessons.length;
  const completionPercent = Math.round((completedCount / Math.max(1, totalCount)) * 100);

  const xpBalance = typeof progress.xpBalance === 'number' ? progress.xpBalance : progress.xp;
  const lifetimeXp = Math.max(
    progress.lifetimeXpEarned || 0,
    xpBalance,
    progress.xp || 0
  );
  const level = Math.floor(lifetimeXp / 50) + 1;
  const displayName =
    user?.displayName || (user?.email ? user.email.split('@')[0] : 'Lithuanian Learner');

  const userTier =
    progress.leagueTier && LEAGUE_TIERS[progress.leagueTier as LeagueTier]
      ? (progress.leagueTier as LeagueTier)
      : getLeagueTierByXp(lifetimeXp);
  const tierConfig = LEAGUE_TIERS[userTier] || LEAGUE_TIERS['Geležis'];

  const streakDays = progress.streakDays ?? progress.streak ?? 1;
  const voiceDrillsCount = progress.voiceDrillsCompleted || 0;
  const linkedWallet = progress.stellarPublicKey || null;

  const canMeetMinThreshold = xpBalance >= MIN_CLAIM_XP;
  const convertibleXp = canMeetMinThreshold
    ? Math.floor(xpBalance / XP_PER_LABAS) * XP_PER_LABAS
    : 0;
  const claimableLabasTokens = convertibleXp / XP_PER_LABAS;
  const thresholdProgressPercent = Math.min(
    100,
    Math.round((xpBalance / MIN_CLAIM_XP) * 100)
  );

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
      isUnlocked: streakDays >= 1,
      current: Math.min(1, streakDays),
      max: 1,
      progressText: `${Math.min(1, streakDays)} / 1 day`,
      reward: '+15 💎',
      icon: '🔥',
    },
    {
      id: 'xp_warrior',
      title: 'Centurion',
      desc: 'Earn 50 XP in journey',
      isUnlocked: lifetimeXp >= 50,
      current: Math.min(50, lifetimeXp),
      max: 50,
      progressText: `${Math.min(50, lifetimeXp)} / 50 XP`,
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

  useEffect(() => {
    if (progress.stellarPublicKey) {
      setWalletInput(progress.stellarPublicKey);
    }
  }, [progress.stellarPublicKey]);

  useEffect(() => {
    if (Array.isArray(progress.claimHistory) && progress.claimHistory.length > 0) {
      setClaimHistory(progress.claimHistory);
    }
  }, [progress.claimHistory]);

  useEffect(() => {
    if (!user?.uid) return;
    loadTokenClaimsFromCloud(user.uid).then((cloudClaims) => {
      if (cloudClaims.length > 0) {
        setClaimHistory((prev) => {
          const map = new Map<string, TokenClaimRecord>();
          for (const item of [...cloudClaims, ...prev]) {
            map.set(item.transactionHash || item.id, item);
          }
          return Array.from(map.values()).slice(0, 15);
        });
      }
    });
  }, [user?.uid]);

  const checkWalletTrustline = useCallback(async (pubKey: string) => {
    if (!STELLAR_PUBKEY_REGEX.test(pubKey.trim())) return;

    setTrustlineState((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch(
        `/api/rewards/claim-xp?publicKey=${encodeURIComponent(pubKey.trim())}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setTrustlineState({
        checking: false,
        checked: true,
        hasTrustline: Boolean(data.hasTrustline),
        accountExists: Boolean(data.accountExists),
        issuerConfigured: Boolean(data.issuerConfigured),
        assetCode: data.assetCode || 'LABAS',
        issuerPublicKey: data.issuerPublicKey || null,
        errorCode: data.errorCode || null,
        message: data.message || null,
      });
    } catch {
      setTrustlineState((prev) => ({
        ...prev,
        checking: false,
        checked: true,
      }));
    }
  }, []);

  useEffect(() => {
    if (linkedWallet && STELLAR_PUBKEY_REGEX.test(linkedWallet)) {
      void checkWalletTrustline(linkedWallet);
    }
  }, [linkedWallet, checkWalletTrustline]);

  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletInputError(null);
    const cleaned = walletInput.trim().toUpperCase();

    if (!cleaned) {
      setIsSavingWallet(true);
      await setStellarWallet(null);
      setIsSavingWallet(false);
      setShowWalletModal(false);
      return;
    }

    if (!STELLAR_PUBKEY_REGEX.test(cleaned)) {
      setWalletInputError(
        'Please enter a valid 56-character Stellar Mainnet public key starting with "G". (Never enter your secret "S" key!)'
      );
      sounds.playError();
      return;
    }

    setIsSavingWallet(true);
    try {
      await setStellarWallet(cleaned);
      await checkWalletTrustline(cleaned);
      sounds.playSuccess();
      setShowWalletModal(false);
      setClaimError(null);
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleClaimTokens = async () => {
    setClaimError(null);
    setClaimSuccess(null);

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!linkedWallet || !STELLAR_PUBKEY_REGEX.test(linkedWallet)) {
      setShowWalletModal(true);
      return;
    }

    if (!canMeetMinThreshold) {
      setClaimError({
        message: `Minimum conversion threshold is ${MIN_CLAIM_XP} XP (5 $LABAS). Complete lessons or Aistė voice drills to reach ${MIN_CLAIM_XP} XP!`,
        code: 'insufficient_xp',
      });
      return;
    }

    setIsClaiming(true);
    try {
      await saveProgressToCloud(user.uid, progress, user.email);

      const idToken = await user.getIdToken();
      const response = await fetch('/api/rewards/claim-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          stellarPublicKey: linkedWallet,
          xpToConvert: convertibleXp,
          clientXpBalance: xpBalance,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        sounds.playError();
        setClaimError({
          message:
            data.error ||
            'Could not complete $LABAS token transfer on Stellar Mainnet. Your XP balance remains intact.',
          code: data.errorCode || null,
          issuerPublicKey: data.issuerPublicKey || trustlineState.issuerPublicKey,
          assetCode: data.assetCode || 'LABAS',
        });
        return;
      }

      if (data.claimRecord) {
        applyXpClaim({
          newXpBalance: data.updatedXpBalance,
          tokensIssued: data.issuedTokenAmount,
          claimRecord: data.claimRecord,
          stellarPublicKey: linkedWallet,
        });
        setClaimHistory((prev) => [data.claimRecord, ...prev].slice(0, 15));
      }

      setClaimSuccess({
        transactionHash: data.transactionHash,
        explorerUrl:
          data.explorerUrl ||
          `https://stellar.expert/explorer/public/tx/${data.transactionHash}`,
        issuedTokenAmount: data.issuedTokenAmount,
        xpClaimed: data.xpClaimed,
        updatedXpBalance: data.updatedXpBalance,
      });

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors
      }
    } catch (error: unknown) {
      sounds.playError();
      setClaimError({
        message:
          error instanceof Error
            ? error.message
            : 'Network error while connecting to Stellar Mainnet conversion service.',
        code: 'network_error',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 pb-24 md:pb-10">
      <div className="mx-auto max-w-4xl flex flex-col gap-3.5">
        {/* 1. Hero Profile Card */}
        <ProfileHeader
          displayName={displayName}
          level={level}
          gems={progress.gems}
          completedCount={completedCount}
          totalCount={totalCount}
          completionPercent={completionPercent}
          onOpenSettings={() => {
            sounds.playClick();
            setShowSettingsModal(true);
          }}
        />

        {/* 2. Stellar Mainnet ($LABAS) Executive Fintech Vault & Habits Card */}
        <StellarRewardsCard
          xpBalance={xpBalance}
          lifetimeXp={lifetimeXp}
          claimableLabasTokens={claimableLabasTokens}
          convertibleXp={convertibleXp}
          canMeetMinThreshold={canMeetMinThreshold}
          thresholdProgressPercent={thresholdProgressPercent}
          totalLabasClaimed={progress.totalLabasClaimed || 0}
          linkedWallet={linkedWallet}
          trustlineState={trustlineState}
          isClaiming={isClaiming}
          claimError={claimError}
          claimSuccess={claimSuccess}
          claimHistory={claimHistory}
          copiedKey={copiedKey}
          streakDays={streakDays}
          wordsMasteredCount={wordsMasteredCount}
          voiceDrillsCount={voiceDrillsCount}
          onOpenWalletModal={() => {
            sounds.playClick();
            setWalletInput(linkedWallet || '');
            setWalletInputError(null);
            setShowWalletModal(true);
          }}
          onClaimTokens={handleClaimTokens}
          onDismissError={() => setClaimError(null)}
          onCopyText={handleCopyText}
        />

        {/* 3. Total Immersion Dashboard */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-4 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
            <LithuanianFlagEmblem size="sm" className="!h-4 !w-4 border" />
            <span>Total Immersion</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">⏱️</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight tabular-nums">
                {formatTimeLearned(totalPracticeSeconds)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Time Learned
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">📚</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight tabular-nums">
                {wordsMasteredCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Words Mastered
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl mb-0.5">⚔️</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight tabular-nums">
                {duelsWonCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Duels Won
              </span>
            </div>
          </div>
        </div>

        {/* 4. League & Speed Drill Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 border border-amber-300/60 text-xl">
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

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2.5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-300/60 text-xl">
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

        {/* 5. Achievements Strip */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-black uppercase tracking-wider text-slate-600">
            <span>🏅</span>
            <span>Achievements</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {achievements.map((item) => {
              const progressPercent = Math.min(100, Math.round((item.current / item.max) * 100));
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                    item.isUnlocked
                      ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-300 shadow-2xs'
                      : 'bg-white border-slate-200/90 opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                        item.isUnlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs ring-2 ring-amber-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <span className="text-[10px] font-black text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                      {item.reward}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 truncate mt-2">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {item.desc}
                    </p>
                  </div>

                  <div>
                    {item.isUnlocked ? (
                      <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1 mt-2">
                        <span>✓</span>
                        <span>Unlocked</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 text-right">
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

        {/* 6. Offline Audio Utility Tile */}
        <OfflineAudioPackCard />

        {/* 7. Notifications & WhatsApp Community Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowNotificationModal(true);
            }}
            className="bg-white border-2 border-slate-200/90 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xs hover:border-indigo-300 transition-all text-left cursor-pointer group w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">
                  Notifications & Reminders
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Daily study & streak protection alerts
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
          </button>

          <a
            href="https://api.whatsapp.com/send?text=Labas!%20I%20am%20learning%20Lithuanian%20on%20LabasApp%20and%20would%20like%20to%20connect%20with%20other%20learners!"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              logEvent({
                eventType: 'WHATSAPP_LEAD_CLICK',
                path: '/profile',
                metadata: { placement: 'profile_community_card' },
              });
            }}
            className="bg-white border-2 border-emerald-200/90 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xs hover:border-emerald-400 transition-all text-left cursor-pointer group w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">
                  Lithuanian Learners on WhatsApp
                </h3>
                <p className="text-[10px] text-emerald-700 font-bold">
                  Connect with native speakers & peers
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:text-emerald-700 transition-colors shrink-0" />
          </a>
        </div>
      </div>

      {/* Stellar Mainnet Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close wallet modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400 shrink-0">
                <StellarMark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Connect Stellar Mainnet Wallet
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your public G... address for instant $LABAS payouts
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div>
                <label
                  htmlFor="stellar-mainnet-wallet-input"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  Stellar Mainnet Public Key (Starts with G)
                </label>
                <input
                  id="stellar-mainnet-wallet-input"
                  type="text"
                  value={walletInput}
                  onChange={(e) => {
                    setWalletInput(e.target.value);
                    setWalletInputError(null);
                  }}
                  placeholder="G..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none px-3.5 py-2.5 text-xs font-mono text-slate-900 bg-slate-50"
                />
                {walletInputError && (
                  <p className="mt-1.5 text-xs font-bold text-rose-600">
                    {walletInputError}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 text-[11px] text-amber-950 space-y-1.5">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Required: Establish $LABAS Trustline</span>
                </div>
                <p className="leading-relaxed text-amber-900/90">
                  Before receiving tokens on the Stellar Public Network, add a trustline for{' '}
                  <strong>$LABAS</strong> in your wallet (Lobstr, Freighter, xBull). Never enter
                  your private S... secret seed.
                </p>
                {trustlineState.issuerPublicKey && (
                  <div className="pt-1 flex items-center justify-between gap-2 bg-white rounded-xl px-2.5 py-1.5 border border-amber-200">
                    <span className="font-mono text-[10px] truncate">
                      Issuer: {trustlineState.issuerPublicKey}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(trustlineState.issuerPublicKey!, 'modal-issuer')
                      }
                      className="text-amber-800 hover:text-amber-950 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'modal-issuer' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 rounded-2xl border-2 border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWallet}
                  className="flex-1 btn-3d btn-green-3d py-2.5 px-4 text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingWallet ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Mainnet Wallet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
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
                  Settings & Practice State
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

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default ProfileDashboard;
