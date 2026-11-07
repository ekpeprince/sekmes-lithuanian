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
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveProgressToCloud,
  loadTokenClaimsFromCloud,
} from '@/lib/progressSync';
import { sounds } from '@/lib/audio';
import { AuthModal } from '@/components/AuthModal';
import StellarWalletModal from '@/components/profile/StellarWalletModal';
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

export const RewardsDashboard: React.FC = () => {
  const {
    progress,
    wordsMasteredCount,
    setStellarWallet,
    applyXpClaim,
  } = useGame();
  const { user } = useAuth();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const xpBalance = typeof progress.xpBalance === 'number' ? progress.xpBalance : progress.xp;
  const lifetimeXp = Math.max(
    progress.lifetimeXpEarned || 0,
    xpBalance,
    progress.xp || 0
  );
  const streakDays = progress.streakDays ?? progress.streak ?? 1;
  const linkedWallet = progress.stellarPublicKey || null;

  // Calculate internal $LABAS balance (100 XP = 1 $LABAS, accumulated automatically)
  const internalLabasBalance =
    typeof progress.internalLabasBalance === 'number'
      ? Math.max(progress.internalLabasBalance, Number((xpBalance / XP_PER_LABAS).toFixed(4)))
      : Number((xpBalance / XP_PER_LABAS).toFixed(4));

  const canMeetMinThreshold = xpBalance >= MIN_CLAIM_XP || internalLabasBalance >= MIN_CLAIM_XP / XP_PER_LABAS;
  const convertibleXp = canMeetMinThreshold
    ? Math.floor(xpBalance / XP_PER_LABAS) * XP_PER_LABAS
    : 0;
  const claimableLabasTokens = convertibleXp / XP_PER_LABAS;
  const thresholdProgressPercent = Math.min(
    100,
    Math.round((xpBalance / MIN_CLAIM_XP) * 100)
  );

  // Milestone metrics (Consistency Streak, Vocabulary Mastery, Aistė Voice Drills)
  const voiceDrillsCount = progress.voiceDrillsCompleted || 0;
  const streakMilestonePercent = Math.min(100, Math.round((streakDays / 7) * 100));
  const vocabMilestonePercent = Math.min(100, Math.round((wordsMasteredCount / 50) * 100));
  const voiceMilestonePercent = Math.min(100, Math.round((voiceDrillsCount / 10) * 100));

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

  // Load cloud claim history when user is authenticated
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
        message: `You need at least ${MIN_CLAIM_XP} XP to claim $LABAS tokens (100 XP = 1 $LABAS). Keep completing lessons and Aistė voice drills!`,
        code: 'insufficient_xp',
      });
      return;
    }

    setIsClaiming(true);
    try {
      // Sync latest local XP and wallet to Firestore in background without blocking
      void saveProgressToCloud(user.uid, progress, user.email);

      const idToken = await user.getIdToken();
      const response = await fetch('/api/stellar/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          stellarPublicKey: linkedWallet,
          xpToConvert: convertibleXp,
          clientXpBalance: xpBalance,
          clientInternalLabasBalance: internalLabasBalance,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        sounds.playError();
        setClaimError({
          message:
            data.error ||
            'Could not complete $LABAS withdrawal on Stellar Mainnet. Your balance was not deducted.',
          code: data.errorCode || null,
          issuerPublicKey: data.issuerPublicKey || trustlineState.issuerPublicKey,
          assetCode: data.assetCode || 'LABAS',
        });
        return;
      }

      // Apply atomic state update locally & trigger celebration
      if (data.claimRecord) {
        applyXpClaim({
          newXpBalance: data.updatedXpBalance,
          newInternalLabasBalance: data.updatedInternalLabasBalance,
          tokensIssued: data.issuedTokenAmount,
          claimRecord: data.claimRecord,
          stellarPublicKey: linkedWallet,
          walletActivated: true,
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
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors in headless browsers
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
    <section
      aria-label="Stellar Mainnet $LABAS Micro-Reward & XP Conversion Engine"
      className="bg-white border-2 border-emerald-200/90 rounded-3xl p-4 sm:p-5 shadow-xs mb-2 relative overflow-hidden"
    >
      {/* Top Banner Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                $LABAS Token Micro-Rewards
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Stellar Mainnet
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Convert verified Lithuanian learning XP into real Mainnet $LABAS tokens (100 XP = 1 $LABAS)
            </p>
          </div>
        </div>

        {/* Wallet Connection Pill */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setWalletInput(linkedWallet || '');
            setWalletInputError(null);
            setShowWalletModal(true);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-extrabold border-2 transition-all cursor-pointer shrink-0 ${
            linkedWallet
              ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {linkedWallet ? (
            <span className="font-mono">
              {linkedWallet.slice(0, 6)}...{linkedWallet.slice(-4)}
            </span>
          ) : (
            <span>Link Stellar Wallet</span>
          )}
        </button>
      </div>

      {/* XP Conversion & Balance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        {/* 1. Claimable XP Balance */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Available XP Balance</span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{xpBalance}</span>
            <span className="text-xs font-bold text-slate-500">XP</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
            Lifetime Earned: {lifetimeXp} XP
          </p>
        </div>

        {/* 2. Internal $LABAS Balance */}
        <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Internal $LABAS Balance</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-900">
              {internalLabasBalance.toFixed(2)}
            </span>
            <span className="text-xs font-black text-emerald-700">$LABAS</span>
          </div>
          <p className="text-[10px] font-semibold text-emerald-700/80 mt-0.5">
            Auto-earned: 100 XP = 1 $LABAS
          </p>
        </div>

        {/* 3. Total $LABAS Claimed & Trustline Status */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Total Claimed</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">
              {progress.totalLabasClaimed || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">$LABAS</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
            {linkedWallet
              ? trustlineState.checking
                ? 'Checking Mainnet trustline...'
                : trustlineState.hasTrustline
                ? '✓ $LABAS Trustline Active'
                : 'Verify $LABAS trustline in wallet'
              : 'No Stellar wallet linked yet'}
          </p>
        </div>
      </div>

      {/* XP Progress Tracker & Learning Milestones */}
      <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 mb-3.5 space-y-3">
        {/* Minimum Claim Threshold Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold text-slate-800">
              XP-to-$LABAS Conversion Threshold
            </span>
            <span className="font-black text-emerald-700">
              {Math.min(xpBalance, MIN_CLAIM_XP)} / {MIN_CLAIM_XP} XP ({thresholdProgressPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${thresholdProgressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Learning Achievement Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Consistency Streak */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                Consistency Streak
              </span>
              <span className="text-orange-600 font-black">{streakDays}d / 7d</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${streakMilestonePercent}%` }}
              />
            </div>
          </div>

          {/* Vocabulary Mastery */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                Vocabulary Mastery
              </span>
              <span className="text-sky-700 font-black">{wordsMasteredCount} / 50</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${vocabMilestonePercent}%` }}
              />
            </div>
          </div>

          {/* Aistė Voice Drills */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                Aistė Voice Drills
              </span>
              <span className="text-rose-600 font-black">{voiceDrillsCount} / 10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${voiceMilestonePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Banner (Actionable Stellar Mainnet Error Feedback) */}
      {claimError && (
        <div
          role="alert"
          className="mb-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 p-3.5 text-xs text-rose-900 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="font-black text-rose-900 flex items-center gap-1.5 flex-wrap">
              <span>Stellar Mainnet Notice</span>
              {claimError.code && (
                <span className="px-1.5 py-0.5 rounded bg-rose-200/70 text-rose-950 font-mono text-[10px]">
                  {claimError.code}
                </span>
              )}
            </div>
            <p className="font-medium leading-relaxed text-rose-800">{claimError.message}</p>

            {(claimError.code === 'op_no_trust' || claimError.code === 'account_not_found') && (
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-rose-900">
                  Asset Code: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">{claimError.assetCode || 'LABAS'}</code>
                </span>
                {claimError.issuerPublicKey && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(claimError.issuerPublicKey!, 'issuer')
                    }
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
            onClick={() => setClaimError(null)}
            className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner with Stellar Expert Explorer Link */}
      {claimSuccess && (
        <div
          role="status"
          className="mb-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-black text-emerald-950 text-sm">
              +{claimSuccess.issuedTokenAmount} $LABAS Sent on Stellar Mainnet!
            </h4>
            <p className="text-emerald-800 font-medium">
              Converted <strong>{claimSuccess.xpClaimed} XP</strong> into{' '}
              <strong>{claimSuccess.issuedTokenAmount} $LABAS</strong>. Remaining balance:{' '}
              <strong>{claimSuccess.updatedXpBalance} XP</strong>.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <a
                href={claimSuccess.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-colors shadow-2xs"
              >
                <span>View on Stellar Expert Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="font-mono text-[10px] text-emerald-700 truncate max-w-[200px]">
                TX: {claimSuccess.transactionHash.slice(0, 10)}...
                {claimSuccess.transactionHash.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Claim Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="text-[11px] text-slate-500 font-medium">
          {!user ? (
            <span>Sign in to link your Stellar Mainnet wallet and claim $LABAS rewards.</span>
          ) : !linkedWallet ? (
            <span>Link your Stellar Mainnet wallet (G...) to enable instant XP conversion.</span>
          ) : !canMeetMinThreshold ? (
            <span>
              Earn <strong>{MIN_CLAIM_XP - xpBalance} more XP</strong> to unlock your next{' '}
              <strong>5 $LABAS</strong> Mainnet payout.
            </span>
          ) : (
            <span>
              Ready to convert <strong>{convertibleXp} XP</strong> &rarr;{' '}
              <strong className="text-emerald-700">{claimableLabasTokens} $LABAS</strong> on
              Stellar Mainnet.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClaimTokens}
          disabled={isClaiming}
          className={`btn-3d py-3 px-5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 ${
            isClaiming
              ? 'bg-amber-500 text-white opacity-90 cursor-wait'
              : canMeetMinThreshold && linkedWallet
              ? 'btn-green-3d text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
          }`}
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming on Stellar Ledger...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                Convert XP to $LABAS
                {canMeetMinThreshold ? ` (+${claimableLabasTokens} $LABAS)` : ''}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Recent Claims Audit Trail */}
      {claimHistory.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Mainnet Claim Audit Log</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {claimHistory.slice(0, 5).map((item) => (
              <div
                key={item.id || item.transactionHash}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-black text-emerald-700 shrink-0">
                    +{item.tokenAmount} ${item.assetCode || 'LABAS'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
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

      {/* Stellar Wallet Linking Modal */}
      <StellarWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSave={handleSaveWalletAddress}
        initialAddress={linkedWallet}
      />

      {/* Firebase Auth Modal if user clicks claim while logged out */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default RewardsDashboard;

