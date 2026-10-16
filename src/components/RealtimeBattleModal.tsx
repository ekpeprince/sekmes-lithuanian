'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  RotateCcw,
  X,
  Share2,
  Copy,
  Check,
  Users,
  Swords,
  Bot,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BattleRoomDoc,
  BattleRoomPlayer,
  createBattleRoom,
  getBattleRoom,
  joinBattleRoom,
  startBattleRoomMatch,
  updateBattlePlayerScore,
  listenToBattleRoom,
} from '@/lib/battleRoomSync';

interface RealtimeBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
  initialRoomId?: string | null;
  isHostInitial?: boolean;
  onPlayBot?: () => void;
}

const TOTAL_ROUNDS = 5;
const ROUND_SECONDS = 7;

const LITHUANIAN_GUEST_NAMES = [
  'Vilnius_Guest',
  'Kaunas_Guest',
  'Klaipėda_Guest',
  'Šiauliai_Guest',
  'Panevėžys_Guest',
  'Player 2',
];

function getStoredGuestName(currentUserDisplayName?: string | null, currentUserEmail?: string | null): string | null {
  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem('sekmes_user_name') ||
        localStorage.getItem('labas_user_name') ||
        localStorage.getItem('sekmes_nickname');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
  }
  if (currentUserDisplayName && currentUserDisplayName.trim()) return currentUserDisplayName.trim();
  if (currentUserEmail && currentUserEmail.trim()) return currentUserEmail.split('@')[0];
  return null;
}

export const RealtimeBattleModal: React.FC<RealtimeBattleModalProps> = ({
  isOpen,
  onClose,
  tierName = 'SIDABRINĖ LYGA',
  initialRoomId = null,
  isHostInitial = true,
  onPlayBot,
}) => {
  const { progress, addXp, recordDuelWin } = useGame();
  const { user } = useAuth();

  const [roomId, setRoomId] = useState<string | null>(initialRoomId);
  const [isHost, setIsHost] = useState<boolean>(isHostInitial);
  const [room, setRoom] = useState<BattleRoomDoc | null>(null);
  const [phase, setPhase] = useState<'loading' | 'prompt_guest' | 'waiting' | 'countdown' | 'battle' | 'completed'>('loading');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [hostJoinBanner, setHostJoinBanner] = useState<string | null>(null);

  // Active quiz state
  const [currentRound, setCurrentRound] = useState(0); // 0..4
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevGuestRef = useRef<BattleRoomPlayer | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Ekpe PrinceEsor');
  const currentUserAvatar = user?.photoURL || undefined;

  const cleanupTimers = () => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize or join room when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupTimers();
      return;
    }

    let isMounted = true;
    cleanupTimers();
    setXpAwarded(false);
    setSelectedOptionIndex(null);
    setRoundCompleted(false);
    setCurrentRound(0);
    setLocalScore(0);
    setConnectionError(null);
    setHostJoinBanner(null);
    prevGuestRef.current = null;

    // 4-Second Timeout Guard to prevent infinite "Connecting to battle arena..." hanging
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        console.error('[BATTLE_ARENA_ERROR]: Connection timeout after 4 seconds. Forcing lobby resolution.');
        setPhase((prev) => {
          if (prev === 'loading') {
            return 'waiting';
          }
          return prev;
        });
      }
    }, 4000);

    const init = async () => {
      // HOST FLOW: Generate roomId immediately & transition to 'waiting' without waiting on network
      if (!initialRoomId) {
        setIsHost(true);
        try {
          const newRoom = await createBattleRoom(
            {
              id: user?.uid || `host_${Date.now()}`,
              name: currentUserName,
            },
            tierName
          );
          if (isMounted) {
            setRoomId(newRoom.roomId);
            setRoom(newRoom);
            // Transition from connecting -> waiting as soon as room ID exists
            setPhase('waiting');
          }
        } catch (err) {
          console.error('[BATTLE_ARENA_ERROR]: Room creation error, falling back locally:', err);
          if (isMounted) {
            const fallbackId = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomId(fallbackId);
            setPhase('waiting');
          }
        }
      } else {
        // GUEST FLOW: Joining an existing room
        const cleanInitialId = initialRoomId.trim().toUpperCase();
        setRoomId(cleanInitialId);
        try {
          const existing = await getBattleRoom(cleanInitialId);

          // Check if current user is already the host of this room
          if (existing && user?.uid && existing.host.id === user.uid) {
            if (isMounted) {
              setIsHost(true);
              setRoom(existing);
              if (existing.status === 'ready' || existing.status === 'starting') {
                setPhase('countdown');
              } else if (existing.status === 'in_progress') {
                setPhase('battle');
              } else {
                setPhase('waiting');
              }
            }
            return;
          }

          if (isMounted) {
            setIsHost(false);
            const existingName = getStoredGuestName(user?.displayName, user?.email);

            // Step 4: If they have an existing username/profile in localStorage, join with that name
            if (existingName) {
              const updated = await joinBattleRoom(cleanInitialId, {
                id: user?.uid || `guest_${Date.now()}`,
                name: existingName,
              });
              setRoom(updated);
              setPhase('countdown');
            } else {
              // New visitor: prompt with quick input: "Enter your nickname"
              const randomDefault = LITHUANIAN_GUEST_NAMES[Math.floor(Math.random() * LITHUANIAN_GUEST_NAMES.length)];
              setGuestNameInput(randomDefault);
              setPhase('prompt_guest');
            }
          }
        } catch (err) {
          console.error('[BATTLE_ARENA_ERROR]: Failed to connect to room:', err);
          if (isMounted) {
            setConnectionError('Could not connect to the battle room. Please verify the link or try again.');
          }
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanupTimers();
    };
  }, [isOpen, initialRoomId, currentUserName, tierName, user]);

  // 2. Real-time Listener on battle_rooms/{roomId}
  useEffect(() => {
    if (!isOpen || !roomId) return;

    const unsubscribe = listenToBattleRoom(roomId, (updatedRoom) => {
      if (!updatedRoom) return;
      setRoom(updatedRoom);

      // Host Join Alert:
      // The moment a friend opens the link, registers their name, and joins:
      // 1. Host triggers immediate audio/haptic chime
      // 2. Host displays toast/banner: "🎉 [Guest Name] has joined the match!"
      if (updatedRoom.guest && !prevGuestRef.current && isHost) {
        prevGuestRef.current = updatedRoom.guest;
        sounds.playSuccess();
        haptics.success();
        const alertMsg = `🎉 ${updatedRoom.guest.name} has joined the match!`;
        setHostJoinBanner(alertMsg);
        showToast(alertMsg);
      }

      // Transition to Countdown when guest joins and status is ready
      if (
        (updatedRoom.status === 'ready' || updatedRoom.status === 'starting') &&
        (phase === 'waiting' || phase === 'loading')
      ) {
        sounds.playClick();
        haptics.success();
        setPhase('countdown');
      }

      // If status changed to in_progress from another device
      if (updatedRoom.status === 'in_progress' && phase === 'countdown') {
        setPhase('battle');
      }

      // If status changed to completed
      if (updatedRoom.status === 'completed' && phase === 'battle') {
        setPhase('completed');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, roomId, phase, isHost]);

  // 3. Handle 3-Second Synchronized Countdown
  useEffect(() => {
    if (phase !== 'countdown' || !isOpen) return;

    setCountdown(3);
    sounds.playClick();

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          // Only after the 3-second countdown reaches 0 does the room switch to status = 'in_progress'
          if (roomId && isHost) {
            startBattleRoomMatch(roomId).catch((err) => {
              console.error('[BATTLE_ARENA_ERROR]: Error starting match:', err);
            });
          }
          sounds.playSuccess();
          haptics.victory();
          setTimeout(() => {
            setPhase('battle');
          }, 400);
          return 0;
        }
        sounds.playClick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [phase, isOpen, roomId, isHost]);

  // 4. Guest Confirms Display Name to Join (Step 4)
  const handleConfirmGuestJoin = async () => {
    if (!roomId) return;
    try {
      const randomDefault = LITHUANIAN_GUEST_NAMES[Math.floor(Math.random() * LITHUANIAN_GUEST_NAMES.length)];
      const finalName = guestNameInput.trim() || randomDefault;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sekmes_user_name', finalName);
        } catch {}
      }
      const updated = await joinBattleRoom(roomId, {
        id: user?.uid || `guest_${Date.now()}`,
        name: finalName,
      });
      setRoom(updated);
      setPhase('countdown');
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Guest join error:', err);
      setPhase('countdown');
    }
  };

  // 5. Active Round Countdown & Answer Timing
  useEffect(() => {
    // Step 2 Guard: DO NOT start Round 1 or trigger any question timers while status === 'waiting' or guest === null
    if (
      phase !== 'battle' ||
      roundCompleted ||
      !isOpen ||
      !room ||
      room.status === 'waiting' ||
      !room.guest
    ) {
      return;
    }

    setTimeLeft(ROUND_SECONDS);
    setSelectedOptionIndex(null);

    roundTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (roundTimerRef.current) clearInterval(roundTimerRef.current);
          handleRoundTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [phase, currentRound, roundCompleted, isOpen, room]);

  // Handle Timeout
  const handleRoundTimeout = () => {
    if (roundCompleted) return;
    setRoundCompleted(true);
    sounds.playWrong();
    haptics.error();

    if (roomId) {
      updateBattlePlayerScore(roomId, isHost, localScore, currentRound + 1, false).catch((err) => {
        console.error('[BATTLE_ARENA_ERROR]: Score update timeout error:', err);
      });
    }
    scheduleAdvance(currentRound);
  };

  // Handle Option Selection
  const handleSelectOption = (index: number) => {
    if (roundCompleted || selectedOptionIndex !== null || !room) return;

    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    setSelectedOptionIndex(index);
    setRoundCompleted(true);

    const question = room.questions[currentRound];
    const isCorrect = question && index === question.answerIndex;

    let nextScore = localScore;
    if (isCorrect) {
      sounds.playCorrect();
      haptics.success();
      const points = 100 + timeLeft * 6;
      nextScore = localScore + points;
      setLocalScore(nextScore);
    } else {
      sounds.playWrong();
      haptics.error();
    }

    if (roomId) {
      updateBattlePlayerScore(roomId, isHost, nextScore, currentRound + 1, isCorrect).catch((err) => {
        console.error('[BATTLE_ARENA_ERROR]: Score update answer error:', err);
      });
    }

    scheduleAdvance(currentRound);
  };

  const scheduleAdvance = (rIndex: number) => {
    advanceTimerRef.current = setTimeout(() => {
      if (rIndex + 1 < TOTAL_ROUNDS) {
        setCurrentRound(rIndex + 1);
        setRoundCompleted(false);
      } else {
        setPhase('completed');
      }
    }, 1400);
  };

  // 6. Post-match Victory Rewards & Confetti Trigger
  useEffect(() => {
    if (phase !== 'completed' || xpAwarded || !room) return;

    const myScore = isHost ? room.host.score : (room.guest?.score ?? localScore);
    const opponentScore = isHost ? (room.guest?.score ?? 0) : room.host.score;
    const isVictory = myScore >= opponentScore;
    const earnedXp = isVictory ? 25 : 10;

    addXp(earnedXp);
    if (isVictory) {
      recordDuelWin();
      sounds.playSuccess();
      haptics.victory();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } else {
      sounds.playError();
      haptics.error();
    }

    setXpAwarded(true);
  }, [phase, xpAwarded, room, isHost, localScore, addXp, recordDuelWin]);

  // Copy or Share Room Link
  const shareUrl = typeof window !== 'undefined' && roomId
    ? `${window.location.origin}/league?battle=room&roomId=${roomId}`
    : '';

  const shareText = `${currentUserName} has challenged you to a live 1v1 Lithuanian Speed Battle on LabasApp! Think you can beat my score? Join now:`;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        showToast('Invite link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Clipboard copy failed:', err);
      showToast('Could not copy automatically');
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareUrl) return;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareInvite = async () => {
    if (!shareUrl) return;
    const shareData = {
      title: 'LabasApp 1v1 Battle 🇱🇹⚔️',
      text: shareText,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }

    handleCopyLink();
  };

  // Play Against Bot instead
  const handlePlayAgainstBot = async () => {
    if (onPlayBot) {
      onClose();
      onPlayBot();
      return;
    }
    // Fallback: simulate bot guest joining immediately
    if (roomId) {
      try {
        const botGuest = {
          id: 'bot_mantas',
          name: 'Mantas (Bot) 🤖',
        };
        await joinBattleRoom(roomId, botGuest);
        setPhase('countdown');
      } catch (err) {
        console.error('[BATTLE_ARENA_ERROR]: Bot join fallback error:', err);
        setPhase('countdown');
      }
    }
  };

  // Play Again: create new room
  const handlePlayAgain = async () => {
    cleanupTimers();
    setIsHost(true);
    setPhase('loading');
    setCurrentRound(0);
    setLocalScore(0);
    setXpAwarded(false);
    setSelectedOptionIndex(null);
    setRoundCompleted(false);
    setConnectionError(null);

    try {
      const newRoom = await createBattleRoom(
        {
          id: user?.uid || `host_${Date.now()}`,
          name: currentUserName,
        },
        tierName
      );
      setRoomId(newRoom.roomId);
      setRoom(newRoom);
      setPhase('waiting');
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Play again room creation failed:', err);
      const fallbackId = Math.random().toString(36).substring(2, 8);
      setRoomId(fallbackId);
      setPhase('waiting');
    }
  };

  if (!isOpen) return null;

  const currentQ = room?.questions && room.questions[currentRound];
  const hostPlayer = room?.host;
  const guestPlayer = room?.guest;

  const opponentPlayer = isHost ? guestPlayer : hostPlayer;
  const opponentName = opponentPlayer?.name || (isHost ? 'Waiting for Friend...' : 'Host');
  const opponentScore = opponentPlayer?.score || 0;

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
              1V1 LIVE BATTLE ROOM {roomId ? `• #${roomId.toUpperCase()}` : ''}
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

        {/* Host Join Banner Alert (Step 2: 🎉 [Guest Name] has joined the match!) */}
        {hostJoinBanner && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
            <span>{hostJoinBanner}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. LOADING SCREEN (Protected with 4-second timeout & error fallback) */}
        {/* ============================================================== */}
        {phase === 'loading' && !connectionError && (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-700">Connecting to battle arena...</p>
            <p className="text-xs text-slate-400 mt-1">Setting up live room sync</p>

            <button
              type="button"
              onClick={() => setPhase('waiting')}
              className="mt-6 text-xs text-amber-600 font-bold hover:underline cursor-pointer"
            >
              Continue to lobby now →
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONNECTION ERROR SCREEN */}
        {/* ============================================================== */}
        {connectionError && (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-4 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Connection Notice
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6 max-w-xs">
              {connectionError}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={handlePlayAgainstBot}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                <span>Play against Bot instead</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. GUEST NICKNAME PROMPT (Step 4: For new visitors) */}
        {/* ============================================================== */}
        {phase === 'prompt_guest' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center min-h-[360px] justify-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4 shadow-sm animate-bounce">
              👋
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
              Enter your nickname
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5 max-w-xs">
              Your friend has challenged you to a 1v1 Lithuanian Speed Battle! Enter your nickname to join the match.
            </p>

            <div className="w-full max-w-xs space-y-3">
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-hidden text-sm font-bold text-slate-800 text-center shadow-xs"
                maxLength={24}
              />

              <button
                type="button"
                onClick={handleConfirmGuestJoin}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Enter Battle Arena 🇱🇹⚔️</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. HOST WAITING LOBBY (Resolved state with code, WhatsApp, and Bot option) */}
        {/* ============================================================== */}
        {phase === 'waiting' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
            {/* Animated Waiting Radar Pulse */}
            <div className="relative flex items-center justify-center mb-4">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-400 opacity-25 animate-ping" />
              <span className="absolute inline-flex h-28 w-28 rounded-full bg-amber-300 opacity-15 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-lg">
                <Users className="w-7 h-7" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Waiting for opponent to join...
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xs">
              Share your room invite below. The match will start automatically once your friend joins!
            </p>

            {/* Room Code Badge */}
            {roomId && (
              <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-black text-amber-900 tracking-wider uppercase">
                <span>Room Code:</span>
                <span className="text-amber-800 font-mono font-bold text-sm">#{roomId.toUpperCase()}</span>
              </div>
            )}

            {/* Challenge URL Display Box */}
            <div className="mt-4 w-full max-w-sm rounded-2xl bg-slate-50 border-2 border-slate-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-600 truncate text-left pl-1 font-mono">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons: Copy Invite Link & Share on WhatsApp */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
              <button
                type="button"
                onClick={handleShareInvite}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Invite Link</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
            </div>

            {/* Fallback & Cancel Options */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={handlePlayAgainstBot}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-600" />
                <span>Play against Bot instead</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. SYNCHRONIZED 3-SECOND COUNTDOWN WITH MATCHUP OVERLAY (Step 3) */}
        {/* ============================================================== */}
        {phase === 'countdown' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
            {/* Header / Countdown Banner */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-black text-amber-900 tracking-wider uppercase mb-3">
              <span>Match starting in 3... 2... 1... Fight! 🇱🇹⚔️</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Opponent Joined! Matchup Ready
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              5 rapid rounds of Lithuanian vocabulary. Answer fast for maximum XP!
            </p>

            {/* Animated Matchup Overlay: [Host Avatar & Name] VS [Guest Avatar & Name] */}
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 text-white p-4 sm:p-5 shadow-2xl border-2 border-slate-800 my-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10 pointer-events-none" />

              <div className="flex items-center justify-between gap-3 relative z-10">
                {/* Host Avatar & Name */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative mb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg ring-4 ring-amber-400/40 animate-pulse">
                      {hostPlayer?.name ? hostPlayer.name.slice(0, 2).toUpperCase() : 'H'}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-sm">👑</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white truncate max-w-full text-center">
                    {hostPlayer?.name || 'Host'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-400/30 px-2 py-0.5 rounded-full mt-1">
                    Host
                  </span>
                </div>

                {/* VS Swords Center Badge */}
                <div className="flex flex-col items-center justify-center shrink-0 px-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow-xl ring-4 ring-amber-300/30 animate-pulse">
                    VS
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    1v1
                  </span>
                </div>

                {/* Guest Avatar & Name */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative mb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg ring-4 ring-emerald-400/40 animate-pulse">
                      {guestPlayer?.name ? guestPlayer.name.slice(0, 2).toUpperCase() : 'G'}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-sm">⚔️</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white truncate max-w-full text-center">
                    {guestPlayer?.name || 'Guest'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/30 px-2 py-0.5 rounded-full mt-1">
                    Challenger
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="my-1 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-500 bg-amber-50 text-4xl sm:text-5xl font-black text-amber-600 shadow-xl animate-bounce">
                {countdown > 0 ? countdown : '⚔️'}
              </div>
              <div className="mt-3 text-sm sm:text-base font-black text-slate-800">
                {countdown > 0 ? (
                  <span>Starting in {countdown}...</span>
                ) : (
                  <span className="text-amber-600 animate-pulse">Fight! 🇱🇹⚔️</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. ACTIVE SYNCHRONIZED 5-ROUND RAPID BATTLE (Guarded: in_progress & guest present) */}
        {/* ============================================================== */}
        {phase === 'battle' && room && room.status === 'in_progress' && room.guest && currentQ && (
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
                    {currentUserName} (You)
                  </span>
                  <span className="text-base font-black text-emerald-400 leading-none">
                    {localScore} <span className="text-[10px] font-semibold text-slate-400">pts</span>
                  </span>
                </div>
              </div>

              {/* Center Timer & Round */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5">
                  Round {currentRound + 1} / {TOTAL_ROUNDS}
                </span>

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

              {/* Opponent Side (Synced live) */}
              <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-300 truncate block">
                    {opponentName}
                  </span>
                  <span className="text-base font-black text-amber-400 leading-none">
                    {opponentScore} <span className="text-[10px] font-semibold text-slate-400">pts</span>
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-amber-400 shrink-0">
                  {opponentName.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-50 border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-4 text-center">
              {currentQ.category && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full inline-block mb-2">
                  {currentQ.category}
                </span>
              )}
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h3>
              {currentQ.englishSubtitle && (
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {currentQ.englishSubtitle}
                </p>
              )}
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((optionText, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrect = idx === currentQ.answerIndex;
                const showCorrect = roundCompleted && isCorrect;
                const showWrong = roundCompleted && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={roundCompleted}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-center cursor-pointer ${
                      showCorrect
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : showWrong
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                        : selectedOptionIndex !== null
                        ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs active:scale-[0.98]'
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-black ${
                      showCorrect || showWrong ? 'text-white' : 'text-slate-900'
                    }`}>
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Time left: {timeLeft}s</span>
              <span className="text-slate-500">
                {isHost ? 'Host' : 'Guest'} • Synchronized Round
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. MATCH RESULT & REWARD SCREEN */}
        {/* ============================================================== */}
        {phase === 'completed' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            {localScore >= opponentScore ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mb-3 shadow-md animate-bounce">
                  🏆
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Pergalė! 🏆
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  You outscored {opponentName} in 5 synchronized rounds!
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
                  {opponentName} won this match. Great effort!
                </p>
              </>
            )}

            {/* Score Comparison */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 my-5">
              {/* You */}
              <div className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center ${
                localScore >= opponentScore
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="relative mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center ring-2 ring-emerald-400 shadow-xs">
                    Tu
                  </div>
                  {localScore >= opponentScore && (
                    <span className="absolute -top-1.5 -right-1.5 text-base">👑</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-full">
                  {currentUserName} (You)
                </span>
                <span className="text-xl font-black text-emerald-600 mt-1">
                  {localScore} <span className="text-xs text-slate-400 font-semibold">pts</span>
                </span>
              </div>

              {/* Opponent */}
              <div className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center ${
                opponentScore > localScore
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="relative mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-white font-bold text-sm flex items-center justify-center ring-2 ring-amber-400 shadow-xs">
                    {opponentName.slice(0, 2).toUpperCase()}
                  </div>
                  {opponentScore > localScore && (
                    <span className="absolute -top-1.5 -right-1.5 text-base">👑</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-full">
                  {opponentName}
                </span>
                <span className="text-xl font-black text-amber-600 mt-1">
                  {opponentScore} <span className="text-xs text-slate-400 font-semibold">pts</span>
                </span>
              </div>
            </div>

            {/* XP Award Card */}
            <div className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3.5 shadow-md flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-white text-white" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-amber-100 block">Lygos apdovanojimas</span>
                  <span className="text-sm font-black">
                    {localScore >= opponentScore ? '+25 Lygos XP' : '+10 Lygos XP'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-xl">
                Įskaityta!
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={handlePlayAgain}
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
