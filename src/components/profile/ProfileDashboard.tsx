'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Wallet,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Flame,
  BookOpen,
  Mic,
  ArrowRightLeft,
  ShieldCheck,
  Copy,
  Check,
  X,
  History,
  Zap,
  Settings,
  BellRing,
  Heart,
  RotateCcw,
  MessageCircle,
  ChevronRight,
  Trophy,
  Timer,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllLessons } from '@/data/curriculum';
import { saveProgressToCloud, loadTokenClaimsFromCloud } from '@/lib/progressSync';
import { sounds } from '@/lib/audio';
import { logEvent } from '@/lib/telemetry';
import { AuthModal } from '@/components/AuthModal';
import { NotificationModal } from '@/components/NotificationModal';
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
  tierName: string;
  leagueRank: number;
  timeLearnedFormatted: string;
  onOpenSettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  level,
  gems,
  completedCount,
  totalCount,
  completionPercent,
  tierName,
  leagueRank,
  timeLearnedFormatted,
  onOpenSettings,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-xl">
      {/* Emerald Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* 16x16 Avatar Container with Emerald-to-Teal Gradient Border Ring */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-2xl p-[2px] bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-3xl select-none">
              🇱🇹
            </div>
          </div>
          {/* Level Indicator Pill at Bottom-Right */}
          <div className="absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 ring-2 ring-slate-950 shadow-md">
            Lvl {level}
          </div>
        </div>

        {/* User Identity & Top Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {displayName}
            </h1>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-extrabold text-amber-300">
                <Sparkles className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{gems}</span>
              </span>

              <button
                type="button"
                onClick={onOpenSettings}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 active:scale-95 cursor-pointer"
                title="Settings & Preferences"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <Trophy className="h-3.5 w-3.5" />
              Rank #{leagueRank} • {tierName}
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Timer className="h-3.5 w-3.5 text-teal-400" />
              {timeLearnedFormatted} immersed
            </span>
          </div>
        </div>
      </div>

      {/* Curriculum Progress Integration */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            Curriculum Progress
          </span>
          <span className="font-extrabold text-emerald-400">
            {completedCount}/{totalCount} Lessons ({completionPercent}%)
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-950/90 border border-slate-800/80 overflow-hidden p-[1px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500"
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
  onOpenWalletModal,
  onClaimTokens,
  onDismissError,
  onCopyText,
}) => {
  const isButtonEnabled = Boolean(linkedWallet && canMeetMinThreshold && !isClaiming);

  return (
    <section
      aria-label="Stellar Mainnet $LABAS Micro-Reward Engine"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-xl"
    >
      {/* Subtle Neo-Banking Ambient Light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-emerald-500/15 blur-3xl"
      />

      {/* Card Header & Wallet State Handling */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                $LABAS Treasury
              </h2>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                100 XP = 1 $LABAS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Stellar Public Network • Instant On-Chain Micro-Rewards
            </p>
          </div>
        </div>

        {/* Wallet State Pill / Button */}
        {linkedWallet ? (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="group inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all duration-300 active:scale-95 cursor-pointer"
            title="Click to manage Stellar Mainnet wallet"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-extrabold text-emerald-300">
              Stellar Mainnet Active
            </span>
            <span className="font-mono text-[11px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
              {linkedWallet.slice(0, 5)}...{linkedWallet.slice(-4)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-slate-900/90 hover:bg-emerald-950/40 border border-emerald-500/50 hover:border-emerald-400 px-4 py-2.5 text-xs font-extrabold text-emerald-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>Link Stellar Mainnet Wallet</span>
          </button>
        )}
      </div>

      {/* Financial Metrics (2x2 Grid) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
        {/* Card 1: Available XP Balance */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800/90 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Available XP Balance</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {xpBalance.toLocaleString()}
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              XP
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-800/60">
            <span>Lifetime Earned</span>
            <span className="font-bold text-slate-300">{lifetimeXp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Card 2: Claimable $LABAS Reward */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300/90">
            <span>Claimable $LABAS Reward</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {claimableLabasTokens}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              $LABAS
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-emerald-500/20">
            <span>Total Claimed On-Chain</span>
            <span className="font-bold text-emerald-300">{totalLabasClaimed} $LABAS</span>
          </div>
        </div>
      </div>

      {/* Conversion Progress Bar toward 500 XP Threshold */}
      <div className="relative z-10 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 mb-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>500 XP Minimum Claim Threshold</span>
          </span>
          <span className="font-extrabold text-emerald-400">
            {Math.min(xpBalance, MIN_CLAIM_XP)} / {MIN_CLAIM_XP} XP ({thresholdProgressPercent}%)
          </span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-[1px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            style={{ width: `${thresholdProgressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          {canMeetMinThreshold ? (
            <span className="text-emerald-400 font-semibold">
              ✓ Threshold unlocked! Ready to convert {convertibleXp} XP &rarr; {claimableLabasTokens} $LABAS
            </span>
          ) : (
            <span>
              Earn <strong className="text-slate-200">{MIN_CLAIM_XP - xpBalance} more XP</strong> to unlock your next 5 $LABAS Mainnet payout
            </span>
          )}
          {linkedWallet && trustlineState.checked && (
            <span
              className={`font-semibold ${
                trustlineState.hasTrustline ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {trustlineState.hasTrustline ? '• Trustline Verified' : '• Setup Trustline'}
            </span>
          )}
        </div>
      </div>

      {/* Actionable Stellar Mainnet Error Alert */}
      {claimError && (
        <div
          role="alert"
          className="relative z-10 mb-5 rounded-2xl bg-rose-950/50 border border-rose-500/40 p-4 text-xs text-rose-200 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="font-bold text-rose-100 flex items-center gap-2 flex-wrap">
              <span>Stellar Mainnet Ledger Notice</span>
              {claimError.code && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px]">
                  {claimError.code}
                </span>
              )}
            </div>
            <p className="text-rose-200/90 leading-relaxed">{claimError.message}</p>

            {(claimError.code === 'op_no_trust' || claimError.code === 'account_not_found') && (
              <div className="pt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-semibold text-rose-200">
                  Asset: <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-rose-500/30 text-emerald-300">{claimError.assetCode || 'LABAS'}</code>
                </span>
                {claimError.issuerPublicKey && (
                  <button
                    type="button"
                    onClick={() => onCopyText(claimError.issuerPublicKey!, 'issuer')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-rose-500/30 font-mono text-[10px] font-bold text-rose-200 hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <span>
                      Issuer: {claimError.issuerPublicKey.slice(0, 6)}...
                      {claimError.issuerPublicKey.slice(-4)}
                    </span>
                    {copiedKey === 'issuer' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
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
            className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mainnet Confirmation Success Banner */}
      {claimSuccess && (
        <div
          role="status"
          className="relative z-10 mb-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 p-4 text-xs text-emerald-100 flex items-start gap-3 animate-in fade-in duration-300"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="font-black text-white text-sm">
              +{claimSuccess.issuedTokenAmount} $LABAS Confirmed on Stellar Mainnet!
            </h4>
            <p className="text-emerald-200/90">
              Converted <strong>{claimSuccess.xpClaimed} XP</strong> into{' '}
              <strong>{claimSuccess.issuedTokenAmount} $LABAS</strong>. Updated balance:{' '}
              <strong>{claimSuccess.updatedXpBalance} XP</strong>.
            </p>
            <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
              <a
                href={claimSuccess.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition-all duration-300 shadow-lg shadow-emerald-500/20"
              >
                <span>Inspect on Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="font-mono text-[10px] text-emerald-300/80 truncate max-w-[200px]">
                TX: {claimSuccess.transactionHash.slice(0, 10)}...
                {claimSuccess.transactionHash.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary High-Impact Glowing CTA Button */}
      <div className="relative z-10">
        <button
          type="button"
          onClick={onClaimTokens}
          disabled={!isButtonEnabled}
          className={`w-full rounded-2xl py-4 px-6 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-300 ${
            isClaiming
              ? 'bg-emerald-600/80 text-white cursor-wait'
              : isButtonEnabled
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_30px_-5px_rgba(16,185,129,0.65)] hover:shadow-[0_0_40px_-2px_rgba(16,185,129,0.85)] active:scale-[0.98] cursor-pointer'
              : 'bg-slate-800/80 border border-slate-700/80 text-slate-400 cursor-not-allowed opacity-75'
          }`}
        >
          {isClaiming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Confirming on Stellar Mainnet Ledger...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>
                CONVERT XP TO $LABAS
                {canMeetMinThreshold ? ` (+${claimableLabasTokens} $LABAS)` : ''}
              </span>
            </>
          )}
        </button>

        {!linkedWallet && (
          <p className="mt-2.5 text-center text-[11px] text-slate-400 font-medium">
            Connect your Stellar Mainnet wallet above to enable instant on-chain XP conversion.
          </p>
        )}
      </div>

      {/* Compact On-Chain Audit Log */}
      {claimHistory.length > 0 && (
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>On-Chain Claim History</span>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {claimHistory.slice(0, 4).map((item) => (
              <div
                key={item.id || item.transactionHash}
                className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-black text-emerald-400 shrink-0">
                    +{item.tokenAmount} ${item.assetCode || 'LABAS'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    ({item.xpClaimed} XP)
                  </span>
                </div>
                <a
                  href={
                    item.explorerUrl ||
                    `https://stellar.expert/explorer/public/tx/${item.transactionHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors shrink-0"
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

/* ============================================================================
 * C. PERFORMANCE & HABIT TRACKING (MilestonesSection)
 * ========================================================================== */
interface MilestonesSectionProps {
  streakDays: number;
  wordsMasteredCount: number;
  voiceDrillsCount: number;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  streakDays,
  wordsMasteredCount,
  voiceDrillsCount,
}) => {
  const streakPercent = Math.min(100, Math.round((streakDays / 7) * 100));
  const vocabPercent = Math.min(100, Math.round((wordsMasteredCount / 50) * 100));
  const voicePercent = Math.min(100, Math.round((voiceDrillsCount / 10) * 100));

  const items = [
    {
      id: 'streak',
      title: 'Consistency Streak',
      subtitle: 'Daily Lithuanian study habit',
      badgeText: `${streakDays}d / 7d`,
      percent: streakPercent,
      icon: Flame,
      iconBoxClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
      badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
      barClass: 'from-orange-500 to-amber-400',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulary Mastery',
      subtitle: 'Verified words & phrases retained',
      badgeText: `${wordsMasteredCount} / 50`,
      percent: vocabPercent,
      icon: BookOpen,
      iconBoxClass: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
      badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
      barClass: 'from-sky-500 to-blue-400',
    },
    {
      id: 'voice_drills',
      title: 'Aistė Voice Drills',
      subtitle: 'Neural speech & pronunciation studio',
      badgeText: `${voiceDrillsCount} / 10`,
      percent: voicePercent,
      icon: Mic,
      iconBoxClass: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
      badgeClass: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
      barClass: 'from-teal-500 to-emerald-400',
    },
  ];

  return (
    <section
      aria-label="Performance & Habit Tracking"
      className="rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
            Performance & Habit Milestones
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Complete verified milestones to accelerate $LABAS XP generation
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 transition-all duration-300 hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBoxClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-xl border px-2.5 py-1 text-xs font-black ${item.badgeClass}`}
                >
                  {item.badgeText}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.barClass} transition-all duration-500`}
                  style={{ width: `${Math.max(item.percent, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ============================================================================
 * UNIFIED PROFILE & STELLAR FINTECH DASHBOARD (ProfileDashboard)
 * ========================================================================== */
export const ProfileDashboard: React.FC = () => {
  const {
    progress,
    totalPracticeSeconds,
    wordsMasteredCount,
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
        'Please enter a valid 56-character Stellar Mainnet public key starting with "G". (Never enter a secret "S" seed!)'
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 pb-24 md:pb-12">
      <div className="max-w-xl mx-auto space-y-6">
        {/* A. Hero Profile Card */}
        <ProfileHeader
          displayName={displayName}
          level={level}
          gems={progress.gems}
          completedCount={completedCount}
          totalCount={totalCount}
          completionPercent={completionPercent}
          tierName={tierConfig.englishName}
          leagueRank={progress.leagueRank || 4}
          timeLearnedFormatted={formatTimeLearned(totalPracticeSeconds)}
          onOpenSettings={() => {
            sounds.playClick();
            setShowSettingsModal(true);
          }}
        />

        {/* B. Stellar Mainnet Fintech Card */}
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

        {/* C. Performance & Habit Tracking */}
        <MilestonesSection
          streakDays={streakDays}
          wordsMasteredCount={wordsMasteredCount}
          voiceDrillsCount={voiceDrillsCount}
        />

        {/* Streamlined Quick Actions & Community Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowNotificationModal(true);
            }}
            className="flex items-center justify-between rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-4 text-left transition-all duration-300 active:scale-[0.99] cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Study Reminders</h4>
                <p className="text-[11px] text-slate-400 font-medium">Daily streak alerts</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </button>

          <a
            href="https://api.whatsapp.com/send?text=Labas!%20I%20am%20learning%20Lithuanian%20on%20LabasApp%20and%20earning%20$LABAS%20on%20Stellar!"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              logEvent({
                eventType: 'WHATSAPP_LEAD_CLICK',
                path: '/profile',
                metadata: { placement: 'profile_fintech_dashboard' },
              });
            }}
            className="flex items-center justify-between rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 p-4 text-left transition-all duration-300 active:scale-[0.99] cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Learner Community</h4>
                <p className="text-[11px] text-emerald-400 font-medium">Connect on WhatsApp</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </a>
        </div>
      </div>

      {/* Stellar Mainnet Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close wallet modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  Link Stellar Mainnet Wallet
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Enter your public G... address for on-chain $LABAS payouts
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div>
                <label
                  htmlFor="stellar-mainnet-wallet-input"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  Stellar Public Key (Mainnet)
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
                  className="w-full rounded-2xl border border-slate-700 focus:border-emerald-400 focus:outline-none px-4 py-3 text-xs font-mono text-white bg-slate-950 placeholder:text-slate-600"
                />
                {walletInputError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-400">
                    {walletInputError}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 text-[11px] text-slate-300 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Mainnet Trustline Requirement</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Ensure your Stellar wallet (Lobstr, Freighter, xBull) has established an active
                  trustline for <strong className="text-white">$LABAS</strong>. Never input your
                  private S... secret seed.
                </p>
                {trustlineState.issuerPublicKey && (
                  <div className="pt-1 flex items-center justify-between gap-2 bg-slate-900 rounded-xl px-3 py-1.5 border border-slate-800">
                    <span className="font-mono text-[10px] text-slate-300 truncate">
                      Issuer: {trustlineState.issuerPublicKey}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(trustlineState.issuerPublicKey!, 'modal-issuer')
                      }
                      className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'modal-issuer' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 rounded-2xl border border-slate-700 py-3 px-4 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWallet}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 py-3 px-4 text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Practice Settings</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Manage hearts & local progress state
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
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Heart className="h-4 w-4 fill-slate-950" />
                <span>Refill 5 Hearts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset local XP and completed lessons?')) {
                    resetProgress();
                    sounds.playClick();
                    setShowSettingsModal(false);
                  }
                }}
                className="w-full rounded-2xl border border-rose-500/40 py-3 px-4 font-bold text-rose-400 hover:bg-rose-950/40 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Local Progress</span>
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
