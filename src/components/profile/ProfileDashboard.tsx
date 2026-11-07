'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
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
  Sparkles,
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
import StellarWalletModal from '@/components/profile/StellarWalletModal';
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
 * 1. CLEAN PROFILE CARD (Identity, Curriculum Progress & 4 Core Stats)
 * ========================================================================== */
interface ProfileHeaderProps {
  displayName: string;
  level: number;
  gems: number;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  tierName: string;
  tierIcon: string;
  streakDays: number;
  timeLearnedFormatted: string;
  wordsMasteredCount: number;
  duelsWonCount: number;
  onOpenNotifications: () => void;
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
  tierIcon,
  streakDays,
  timeLearnedFormatted,
  wordsMasteredCount,
  duelsWonCount,
  onOpenNotifications,
  onOpenSettings,
}) => {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
      {/* Top Identity Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <LithuanianFlagEmblem size="md" />
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 border-2 border-white">
              L{level}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {displayName}
            </h1>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>{tierIcon}</span>
              <span>{tierName}</span>
              <span>•</span>
              <span className="text-amber-600 font-bold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
                {gems} Gems
              </span>
            </p>
          </div>
        </div>

        {/* Utility Icons (Reminders & Settings) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer"
            title="Study Reminders & Notifications"
            aria-label="Notifications"
          >
            <BellRing className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer"
            title="Settings & Audio"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Curriculum Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1.5">
          <span>Curriculum Progress</span>
          <span className="text-slate-800 font-bold tabular-nums">
            {completedCount} / {totalCount} Lessons ({completionPercent}%)
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.max(completionPercent, completedCount > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>

      {/* Clean 4-Metric Summary Divider Row */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
            {streakDays}d
          </div>
          <div className="text-[11px] font-medium text-slate-400">Streak</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
            {timeLearnedFormatted}
          </div>
          <div className="text-[11px] font-medium text-slate-400">Time Learned</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
            {wordsMasteredCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400">Words</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
            {duelsWonCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400">Duels Won</div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. SIMPLE, UNCLUTTERED STELLAR $LABAS REWARDS CARD
 * ========================================================================== */
interface StellarRewardsCardProps {
  xpBalance: number;
  claimableLabasTokens: number;
  convertibleXp: number;
  canMeetMinThreshold: boolean;
  thresholdProgressPercent: number;
  linkedWallet: string | null;
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
  claimableLabasTokens,
  convertibleXp,
  canMeetMinThreshold,
  thresholdProgressPercent,
  linkedWallet,
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
      aria-label="Stellar Mainnet $LABAS Rewards"
      className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs"
    >
      {/* Clean Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
            <StellarMark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                $LABAS Rewards
              </h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Mainnet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              100 XP = 1 $LABAS • Min. 500 XP
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenWalletModal}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            linkedWallet
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-mono'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <Wallet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          {linkedWallet ? (
            <span>
              {linkedWallet.slice(0, 5)}...{linkedWallet.slice(-4)}
            </span>
          ) : (
            <span>Connect Wallet</span>
          )}
        </button>
      </div>

      {/* Simple Balance Summary & Progress */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">
            Available XP
          </span>
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {xpBalance.toLocaleString()}{' '}
            <span className="text-xs font-bold text-slate-400">XP</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Claimable Reward
          </span>
          <span className="text-2xl font-black text-emerald-600 tabular-nums">
            {claimableLabasTokens.toFixed(2)}{' '}
            <span className="text-xs font-bold text-emerald-600">$LABAS</span>
          </span>
        </div>
      </div>

      {/* Single Clean Progress Bar toward 500 XP */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
          <span>
            {canMeetMinThreshold
              ? `Ready to convert ${convertibleXp} XP`
              : `${MIN_CLAIM_XP - xpBalance} XP needed to unlock payout`}
          </span>
          <span className="text-slate-600 font-bold tabular-nums">
            {Math.min(xpBalance, MIN_CLAIM_XP)} / {MIN_CLAIM_XP} XP
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${thresholdProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Error Notice */}
      {claimError && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-rose-800 font-medium">{claimError.message}</p>
            {(claimError.code === 'op_no_trust' || claimError.code === 'account_not_found') &&
              claimError.issuerPublicKey && (
                <button
                  type="button"
                  onClick={() => onCopyText(claimError.issuerPublicKey!, 'issuer')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-rose-200 font-mono text-[10px] font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
                >
                  <span>
                    Copy Issuer: {claimError.issuerPublicKey.slice(0, 6)}...
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
          <button
            type="button"
            onClick={onDismissError}
            className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Notice */}
      {claimSuccess && (
        <div
          role="status"
          className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-bold truncate">
              Sent +{claimSuccess.issuedTokenAmount} $LABAS to your wallet!
            </span>
          </div>
          <a
            href={claimSuccess.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 shrink-0"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onClaimTokens}
        disabled={!isButtonEnabled}
        className={`mt-4 w-full rounded-2xl py-3 px-4 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
          isClaiming
            ? 'bg-amber-500 text-white cursor-wait'
            : isButtonEnabled
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isClaiming ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Confirming on Stellar Mainnet...</span>
          </>
        ) : (
          <>
            <span>Convert XP to $LABAS</span>
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Compact Recent Claims (only visible if user has past claims) */}
      {claimHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <History className="w-3 h-3" />
            <span>Recent Claims</span>
          </div>
          {claimHistory.slice(0, 2).map((item) => (
            <div
              key={item.id || item.transactionHash}
              className="flex items-center justify-between text-xs text-slate-600"
            >
              <span className="font-bold text-emerald-700">
                +{item.tokenAmount} ${item.assetCode || 'LABAS'} ({item.xpClaimed} XP)
              </span>
              <a
                href={
                  item.explorerUrl ||
                  `https://stellar.expert/explorer/public/tx/${item.transactionHash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-emerald-600"
              >
                <span>{item.transactionHash.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
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
 * MINIMALIST, CLEAN PROFILE PAGE (ProfileDashboard)
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

  const handleSaveWalletAddress = async (publicKey: string) => {
    const cleaned = publicKey.trim().toUpperCase();
    await setStellarWallet(cleaned);
    sounds.playSuccess();
    setClaimError(null);
    void checkWalletTrustline(cleaned);
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
        message: `Minimum conversion threshold is ${MIN_CLAIM_XP} XP (5 $LABAS).`,
        code: 'insufficient_xp',
      });
      return;
    }

    setIsClaiming(true);
    try {
      void saveProgressToCloud(user.uid, progress, user.email);

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
            'Could not complete $LABAS token transfer on Stellar Mainnet.',
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
          particleCount: 70,
          spread: 60,
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 pb-24 md:pb-10">
      <div className="mx-auto max-w-2xl flex flex-col gap-4">
        {/* 1. Profile Identity, Progress & Core Stats */}
        <ProfileHeader
          displayName={displayName}
          level={level}
          gems={progress.gems}
          completedCount={completedCount}
          totalCount={totalCount}
          completionPercent={completionPercent}
          tierName={tierConfig.englishName}
          tierIcon={tierConfig.icon}
          streakDays={streakDays}
          timeLearnedFormatted={formatTimeLearned(totalPracticeSeconds)}
          wordsMasteredCount={wordsMasteredCount}
          duelsWonCount={duelsWonCount}
          onOpenNotifications={() => {
            sounds.playClick();
            setShowNotificationModal(true);
          }}
          onOpenSettings={() => {
            sounds.playClick();
            setShowSettingsModal(true);
          }}
        />

        {/* 2. Clean $LABAS Rewards Card */}
        <StellarRewardsCard
          xpBalance={xpBalance}
          claimableLabasTokens={claimableLabasTokens}
          convertibleXp={convertibleXp}
          canMeetMinThreshold={canMeetMinThreshold}
          thresholdProgressPercent={thresholdProgressPercent}
          linkedWallet={linkedWallet}
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

        {/* 3. Simple Utility Footer (Offline Audio + Community) */}
        <OfflineAudioPackCard />

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
          className="rounded-2xl bg-white border border-slate-200/90 px-4 py-3 flex items-center justify-between hover:border-emerald-300 transition-colors text-xs font-bold text-slate-700"
        >
          <span className="flex items-center gap-2.5">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <span>Join Lithuanian Learners on WhatsApp</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>
      </div>

      {/* Stellar Wallet Modal */}
      <StellarWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSave={handleSaveWalletAddress}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-black text-slate-900 text-base mb-4">Settings</h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  refillHearts();
                  sounds.playSuccess();
                }}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full rounded-xl border border-rose-200 py-2.5 px-4 font-bold text-rose-600 hover:bg-rose-50 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
