'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  RotateCcw,
  X,
  Share2,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { BATTLE_QUESTIONS, BattleQuestion } from '@/data/battleQuestions';
import { LeagueTier, LEAGUE_TIERS, Competitor } from '@/lib/league';
import { shareBattleInvite } from '@/lib/shareUtils';

interface LeagueBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: LeagueTier;
  activeTier?: string; // Dynamic tier name e.g. "SIDABRINĖ LYGA" or "Silver League"
  competitors?: Competitor[];
  onRewardClaimed?: (xp: number) => void;
  onChallengeFriend?: () => void;
}

interface OpponentProfile {
  name: string;
  city: string;
  flag: string;
  initials: string;
  avatarColor: string;
  photoURL?: string;
}

const FALLBACK_OPPONENTS: OpponentProfile[] = [
  {
    name: 'Matas J.',
    city: 'Šiauliai',
    flag: '🇱🇹',
    initials: 'MJ',
    avatarColor: 'from-amber-600 to-orange-700',
  },
  {
    name: 'Kotryna S.',
    city: 'Utena',
    flag: '🇱🇹',
    initials: 'KS',
    avatarColor: 'from-purple-600 to-indigo-700',
  },
  {
    name: 'Austėja R.',
    city: 'Klaipėda',
    flag: '🇱🇹',
    initials: 'AR',
    avatarColor: 'from-emerald-600 to-teal-700',
  },
  {
    name: 'Mindaugas B.',
    city: 'Alytus',
    flag: '🇱🇹',
    initials: 'MB',
    avatarColor: 'from-blue-600 to-sky-700',
  },
  {
    name: 'Gabrielė P.',
    city: 'Panevėžys',
    flag: '🇱🇹',
    initials: 'GP',
    avatarColor: 'from-rose-600 to-pink-700',
  },
];

const TOTAL_ROUNDS = 5;
const ROUND_SECONDS = 7;

export const LeagueBattleModal: React.FC<LeagueBattleModalProps> = ({
  isOpen,
  onClose,
  tier,
  activeTier,
  competitors = [],
  onRewardClaimed,
  onChallengeFriend,
}) => {
  const { progress, addXp, recordDuelWin } = useGame();
  const { user } = useAuth();

  // Dynamic Tier Resolution
  const userAssignedTier: LeagueTier = progress.leagueTier || 'Sidabras';
  const effectiveTier: LeagueTier = tier || userAssignedTier;
  const tierConfig = LEAGUE_TIERS[effectiveTier] || LEAGUE_TIERS.Sidabras;
  const currentActiveTier = activeTier || tierConfig.name;

  const [status, setStatus] = useState<'searching' | 'battle' | 'completed'>('searching');
  const [opponent, setOpponent] = useState<OpponentProfile>(FALLBACK_OPPONENTS[0]);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState(0); // 0-indexed (0..4)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const matchmakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (matchmakingTimerRef.current) clearTimeout(matchmakingTimerRef.current);
  };

  const competitorsRef = useRef(competitors);
  competitorsRef.current = competitors;
  const userRef = useRef(user);
  userRef.current = user;

  const currentUserName = user?.displayName || 'You';
  const currentUserAvatar = user?.photoURL || undefined;

  // Initialize and start a new 5-round match
  const startNewMatch = useCallback(() => {
    cleanupTimers();

    // 1. Pick an opponent from competitors or fallback
    const currentComps = competitorsRef.current;
    const currentUser = userRef.current;
    const eligibleOpponents = currentComps.filter(
      (c) => !c.isUser && !c.isCurrentUser && (!currentUser?.displayName || c.name !== currentUser.displayName)
    );

    let chosenOpponent: OpponentProfile;
    if (eligibleOpponents.length > 0) {
      const pick = eligibleOpponents[Math.floor(Math.random() * eligibleOpponents.length)];
      const nameParts = pick.name.trim().split(/\s+/);
      const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : pick.name;
      chosenOpponent = {
        name: shortName,
        city: pick.city || 'Vilnius',
        flag: pick.flag || '🇱🇹',
        initials: pick.initials || 'OP',
        avatarColor: pick.avatarColor || 'from-amber-600 to-orange-700',
        photoURL: pick.photoURL,
      };
    } else {
      chosenOpponent = FALLBACK_OPPONENTS[Math.floor(Math.random() * FALLBACK_OPPONENTS.length)];
    }

    setOpponent(chosenOpponent);

    // 2. Pick 5 distinct questions
    const shuffled = [...BATTLE_QUESTIONS].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, TOTAL_ROUNDS));

    // 3. Reset scores and round
    setCurrentRound(0);
    setUserScore(0);
    setOpponentScore(0);
    setSelectedOption(null);
    setOpponentAnswered(false);
    setRoundCompleted(false);
    setXpAwarded(false);
    setTimeLeft(ROUND_SECONDS);
    setStatus('searching');

    // 2-Second Matchmaking Transition (No confetti during matchmaking)
    sounds.playClick();
    matchmakingTimerRef.current = setTimeout(() => {
      setStatus('battle');
      sounds.playClick();
      haptics.tap();
    }, 2000);
  }, []);

  // Modal Open Lifecycle Guard to eliminate restart loops
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      startNewMatch();
    } else if (!isOpen) {
      wasOpenRef.current = false;
      cleanupTimers();
    }
    return () => {
      cleanupTimers();
    };
  }, [isOpen, startNewMatch]);

  // Round Timer & Opponent answering simulation
  useEffect(() => {
    if (status !== 'battle' || roundCompleted || !isOpen) return;

    setTimeLeft(ROUND_SECONDS);
    setSelectedOption(null);
    setOpponentAnswered(false);

    // Opponent response delay between 1.8s and 4.8s
    const opponentDelayMs = 1800 + Math.random() * 3000;
    opponentTimeoutRef.current = setTimeout(() => {
      setOpponentAnswered(true);
      const isOpponentCorrect = Math.random() < 0.75;
      if (isOpponentCorrect) {
        setOpponentScore((prev) => prev + 20);
      }
    }, opponentDelayMs);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    };
  }, [status, currentRound, roundCompleted, isOpen]);

  // Handle timeout
  const handleTimeOut = () => {
    if (roundCompleted) return;
    setRoundCompleted(true);
    sounds.playWrong();
    haptics.error();

    scheduleNextRound(currentRound);
  };

  // Schedule advance to next round or complete match
  const scheduleNextRound = (currentR: number) => {
    advanceTimerRef.current = setTimeout(() => {
      if (currentR + 1 < TOTAL_ROUNDS) {
        setCurrentRound(currentR + 1);
        setRoundCompleted(false);
      } else {
        // Round 5 completed: Transition state to 'completed'. DO NOT route back to 'searching' or reset round counter
        setStatus('completed');
      }
    }, 1400);
  };

  // Handle user option select
  const handleSelectOption = (ltText: string) => {
    if (roundCompleted || selectedOption !== null) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(ltText);
    setRoundCompleted(true);

    const activeQuestion = questions[currentRound];
    const isCorrect = activeQuestion && ltText === activeQuestion.correctAnswer;

    if (isCorrect) {
      sounds.playCorrect();
      haptics.success();
      const points = 20;
      setUserScore((prev) => prev + points);
    } else {
      sounds.playWrong();
      haptics.error();
    }

    scheduleNextRound(currentRound);
  };

  // Post-match victory logic, XP persistence and Confetti Trigger
  useEffect(() => {
    if (status !== 'completed' || xpAwarded) return;

    const isWin = userScore > opponentScore;
    const isTie = userScore === opponentScore;
    const earnedXp = isWin ? 25 : isTie ? 15 : 10;

    // Persist XP reward to the user's total league XP in storage/context
    addXp(earnedXp);
    if (isWin) {
      recordDuelWin();
      sounds.playSuccess();
      haptics.victory();
      // Confetti Trigger:
      // Only fire confetti particle effect once the Victory screen mounts AND userScore > opponentScore
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } else if (isTie) {
      sounds.playLevelComplete();
      haptics.success();
    } else {
      sounds.playError();
      haptics.error();
    }

    setXpAwarded(true);
    if (onRewardClaimed) onRewardClaimed(earnedXp);
  }, [status, userScore, opponentScore, xpAwarded, addXp, recordDuelWin, onRewardClaimed]);

  const handleInviteFriend = async () => {
    const res = await shareBattleInvite(currentUserName);
    if (res.copied) {
      setToastMessage('Invite link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentRound];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
            <span>📋</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Modal Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-900 text-sm">
              ⚔️
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              1V1 SPEED BATTLE • {currentActiveTier.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* PHASE 1: MATCHMAKING STATE (2-second search) */}
        {/* ============================================================== */}
        {status === 'searching' && (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
            {/* Animated Radar Pulse */}
            <div className="relative flex items-center justify-center mb-6">
              <span className="absolute inline-flex h-24 w-24 rounded-full bg-amber-400 opacity-25 animate-ping" />
              <span className="absolute inline-flex h-32 w-32 rounded-full bg-amber-300 opacity-15 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-lg">
                ⚔️
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Searching for an opponent in {currentActiveTier}...
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs">
              Matching with a live learner from your weekly league cohort.
            </p>

            {/* Found Opponent Teaser Badge */}
            <div className="mt-6 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${opponent.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                {opponent.initials}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-amber-950 block">
                  Found: {opponent.name} {opponent.flag}
                </span>
                <span className="text-[10px] text-amber-800/80 font-medium">
                  {opponent.city} • Ready to battle!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE 2: ACTIVE 5-ROUND RAPID BATTLE */}
        {/* ============================================================== */}
        {status === 'battle' && currentQ && (
          <div className="p-4 sm:p-6 flex flex-col">
            {/* Split View Scoreboard */}
            <div className="grid grid-cols-3 items-center bg-slate-900 text-white rounded-2xl p-3.5 shadow-md mb-4 border border-slate-800">
              {/* User Side */}
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUserAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={currentUserAvatar} alt="You" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-400 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-400 shrink-0">
                    Tu
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-300 truncate block">
                    {currentUserName}
                  </span>
                  <span className="text-base font-black text-emerald-400 leading-none">
                    {userScore} <span className="text-[10px] font-semibold text-slate-400">pts</span>
                  </span>
                </div>
              </div>

              {/* Center Timer & Round */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5">
                  Round {currentRound + 1} / {TOTAL_ROUNDS}
                </span>

                {/* 7-Second Countdown Circle */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-black text-sm transition-all shadow-inner ${
                  timeLeft <= 2
                    ? 'border-rose-500 text-rose-400 bg-rose-950/40 animate-pulse'
                    : timeLeft <= 4
                    ? 'border-amber-400 text-amber-300 bg-amber-950/40'
                    : 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                }`}>
                  {timeLeft}s
                </div>
              </div>

              {/* Opponent Side */}
              <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-300 truncate block">
                    {opponent.name} {opponent.flag}
                  </span>
                  <span className="text-base font-black text-amber-400 leading-none">
                    {opponentScore} <span className="text-[10px] font-semibold text-slate-400">pts</span>
                  </span>
                </div>
                {opponent.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={opponent.photoURL} alt={opponent.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400 shrink-0" />
                ) : (
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${opponent.avatarColor} text-white font-bold text-xs flex items-center justify-center ring-2 ring-amber-400 shrink-0`}>
                    {opponent.initials}
                  </div>
                )}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-50 border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full inline-block mb-2">
                {currentQ.category}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.prompt}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {currentQ.englishSubtitle}
              </p>
            </div>

            {/* 4 Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === option.lt;
                const isCorrect = option.lt === currentQ.correctAnswer;
                const showCorrect = roundCompleted && isCorrect;
                const showWrong = roundCompleted && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={roundCompleted}
                    onClick={() => handleSelectOption(option.lt)}
                    className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-center cursor-pointer ${
                      showCorrect
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : showWrong
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                        : selectedOption
                        ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs active:scale-[0.98]'
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-black ${
                      showCorrect || showWrong ? 'text-white' : 'text-slate-900'
                    }`}>
                      {option.lt}
                    </span>
                    <span className={`text-[11px] font-medium mt-0.5 ${
                      showCorrect || showWrong ? 'text-white/90' : 'text-slate-500'
                    }`}>
                      {option.en}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Opponent Answered Live Status */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Time left: {timeLeft}s</span>
              <span className={`flex items-center gap-1 transition-opacity ${
                opponentAnswered ? 'opacity-100 text-amber-600 font-semibold' : 'opacity-0'
              }`}>
                ⚡ {opponent.name} answered!
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE 3: DEDICATED VICTORY / MATCH SUMMARY VIEW */}
        {/* ============================================================== */}
        {status === 'completed' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            {/* Result Header */}
            {userScore > opponentScore ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mb-3 shadow-md animate-bounce">
                  🏆
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Pergalė! 🏆
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Puikiai pasirodei 5 greitų raundų kovoje!
                </p>
              </>
            ) : userScore === opponentScore ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mb-3 shadow-md">
                  🤝
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Lygiosios! 🤝
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Atkakli kova! Abu žaidėjai surinko po {userScore} taškų.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center text-3xl mb-3 shadow-md">
                  ⚔️
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Gera kova! ⚔️
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {opponent.name} šįkart buvo greitesnis. Nenusimink ir treniruokis toliau!
                </p>
              </>
            )}

            {/* Score Comparison */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 my-5">
              {/* Player Card */}
              <div className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center ${
                userScore > opponentScore
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="relative mb-2">
                  {currentUserAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={currentUserAvatar} alt="You" className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center ring-2 ring-emerald-400 shadow-xs">
                      Tu
                    </div>
                  )}
                  {userScore > opponentScore && (
                    <span className="absolute -top-1.5 -right-1.5 text-base">👑</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-full">
                  {currentUserName} (Tu)
                </span>
                <span className="text-xl font-black text-emerald-600 mt-1">
                  {userScore} <span className="text-xs text-slate-400 font-semibold">pts</span>
                </span>
              </div>

              {/* Opponent Card */}
              <div className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center ${
                opponentScore > userScore
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="relative mb-2">
                  {opponent.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={opponent.photoURL} alt={opponent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-xs" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${opponent.avatarColor} text-white font-bold text-sm flex items-center justify-center ring-2 ring-amber-400 shadow-xs`}>
                      {opponent.initials}
                    </div>
                  )}
                  {opponentScore > userScore && (
                    <span className="absolute -top-1.5 -right-1.5 text-base">👑</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-full">
                  {opponent.name} {opponent.flag}
                </span>
                <span className="text-xl font-black text-amber-600 mt-1">
                  {opponentScore} <span className="text-xs text-slate-400 font-semibold">pts</span>
                </span>
              </div>
            </div>

            {/* XP Award Card */}
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3.5 shadow-md flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-white text-white" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-amber-100 block">Lygos apdovanojimas</span>
                  <span className="text-sm font-black">
                    {userScore > opponentScore ? '+25 Lygos XP' : userScore === opponentScore ? '+15 Lygos XP' : '+10 Lygos XP'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-xl">
                Įskaityta!
              </span>
            </div>

            {/* Challenge a Friend Secondary Action Button */}
            <button
              type="button"
              onClick={() => {
                if (onChallengeFriend) {
                  onChallengeFriend();
                } else {
                  handleInviteFriend();
                }
              }}
              className="w-full max-w-sm mb-5 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Challenge a Friend • Iššūkis draugui</span>
            </button>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={startNewMatch}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Žaisti dar kartą</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Grįžti į lygą
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
