'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  Clock,
  Trophy,
  RotateCcw,
  X,
  Swords,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { BATTLE_QUESTIONS, BattleQuestion } from '@/data/battleQuestions';
import { LeagueTier, LEAGUE_TIERS, Competitor } from '@/lib/league';

interface LeagueBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: LeagueTier;
  competitors?: Competitor[];
  onRewardClaimed?: (xp: number) => void;
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
  tier = 'Sidabras',
  competitors = [],
  onRewardClaimed,
}) => {
  const { addXp, recordDuelWin } = useGame();
  const { user } = useAuth();

  const [phase, setPhase] = useState<'matchmaking' | 'battle' | 'summary'>('matchmaking');
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tierConfig = LEAGUE_TIERS[tier] || LEAGUE_TIERS.Sidabras;
  const tierDisplayName =
    tierConfig.name === 'SIDABRINĖ LYGA' || tierConfig.name === 'Sidabro Lyga'
      ? 'Sidabrinė Lyga'
      : tierConfig.name;

  const currentUserName = user?.displayName || 'You';
  const currentUserAvatar = user?.photoURL || undefined;

  // Pick random opponent and 5 random questions
  const initializeBattle = useCallback(() => {
    // 1. Pick an opponent from league competitors or fallback
    const eligibleOpponents = competitors.filter(
      (c) => !c.isUser && !c.isCurrentUser && c.name !== 'Ekpe PrinceEsor' && c.name !== user?.displayName
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
    setPhase('matchmaking');
  }, [competitors, user]);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      initializeBattle();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    };
  }, [isOpen, initializeBattle]);

  // 2-Second Matchmaking transition
  useEffect(() => {
    if (phase !== 'matchmaking' || !isOpen) return;

    sounds.playClick();
    const mmTimer = setTimeout(() => {
      setPhase('battle');
      sounds.playSuccess();
      haptics.success();
    }, 2000);

    return () => clearTimeout(mmTimer);
  }, [phase, isOpen]);

  // Round Timer & Opponent answering simulation
  useEffect(() => {
    if (phase !== 'battle' || roundCompleted || !isOpen) return;

    setTimeLeft(ROUND_SECONDS);
    setSelectedOption(null);
    setOpponentAnswered(false);

    // Opponent response timer: between 1.8s and 4.8s
    const opponentDelayMs = 1800 + Math.random() * 3000;
    opponentTimeoutRef.current = setTimeout(() => {
      setOpponentAnswered(true);
      // Opponent 75% accuracy
      const isOpponentCorrect = Math.random() < 0.75;
      if (isOpponentCorrect) {
        setOpponentScore((prev) => prev + 100);
      }
    }, opponentDelayMs);

    // Round countdown
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
  }, [phase, currentRound, roundCompleted, isOpen]);

  // Handle timeout
  const handleTimeOut = () => {
    if (roundCompleted) return;
    setRoundCompleted(true);
    sounds.playWrong();
    haptics.error();

    scheduleNextRound();
  };

  // Schedule advance to next round or summary
  const scheduleNextRound = () => {
    advanceTimerRef.current = setTimeout(() => {
      if (currentRound + 1 < TOTAL_ROUNDS) {
        setCurrentRound((prev) => prev + 1);
        setRoundCompleted(false);
      } else {
        setPhase('summary');
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
    const isCorrect = ltText === activeQuestion.correctAnswer;

    if (isCorrect) {
      sounds.playCorrect();
      haptics.success();
      // Points: 100 base + speed bonus up to 40
      const points = 100 + timeLeft * 6;
      setUserScore((prev) => prev + points);
    } else {
      sounds.playWrong();
      haptics.error();
    }

    scheduleNextRound();
  };

  // When battle finishes (summary screen)
  useEffect(() => {
    if (phase !== 'summary' || xpAwarded) return;

    const isVictory = userScore > opponentScore;

    if (isVictory) {
      sounds.playSuccess();
      haptics.success();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Award +25 League XP
      addXp(25);
      recordDuelWin();
      setXpAwarded(true);
      if (onRewardClaimed) onRewardClaimed(25);
    } else if (userScore === opponentScore) {
      // Draw gives +10 XP
      addXp(10);
      setXpAwarded(true);
      if (onRewardClaimed) onRewardClaimed(10);
    }
  }, [phase, userScore, opponentScore, xpAwarded, addXp, recordDuelWin, onRewardClaimed]);

  if (!isOpen) return null;

  const currentQ = questions[currentRound];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col">
        {/* Top Modal Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-900 text-sm">
              ⚔️
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              1v1 Speed Battle • {tierDisplayName}
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
        {phase === 'matchmaking' && (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
            {/* Radar Pulse Animation */}
            <div className="relative flex items-center justify-center w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-lg">
                ⚔️
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Searching for an opponent in {tierDisplayName}...
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
        {phase === 'battle' && currentQ && (
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
        {/* PHASE 3: MATCH RESULT & REWARD SCREEN */}
        {/* ============================================================== */}
        {phase === 'summary' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            {userScore > opponentScore ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mb-3 shadow-md">
                  🏆
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  VICTORY! • Pergalė!
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  You outpaced {opponent.name} in 5 rapid Lithuanian rounds!
                </p>

                {/* Reward Banner */}
                <div className="my-5 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-white text-white" />
                  <span className="text-base font-black tracking-wide">+25 League XP Awarded!</span>
                </div>
              </>
            ) : userScore === opponentScore ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center text-3xl mb-3 shadow-md">
                  🤝
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  DRAW! • Lygiosios!
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Both competitors scored evenly across 5 rounds!
                </p>

                <div className="my-5 px-5 py-2.5 rounded-2xl bg-sky-600 text-white shadow-md flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span className="text-sm font-black">+10 League XP Awarded!</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-3 shadow-md">
                  🛡️
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  DEFEAT • Pralaimėjimas
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {opponent.name} won this round. Practice makes perfect!
                </p>

                <div className="my-5 px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  Keep training to climb the {tierDisplayName}!
                </div>
              </>
            )}

            {/* Score Comparison Box */}
            <div className="w-full max-w-sm rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-6">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    You
                  </span>
                  <span className="text-xl font-black text-slate-900">{userScore}</span>
                  <span className="text-[10px] text-slate-500 block">pts</span>
                </div>

                <span className="text-xs font-black text-slate-300 uppercase">VS</span>

                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {opponent.name}
                  </span>
                  <span className="text-xl font-black text-slate-900">{opponentScore}</span>
                  <span className="text-[10px] text-slate-500 block">pts</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={initializeBattle}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Back to League
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
