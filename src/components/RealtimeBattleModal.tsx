'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  RotateCcw,
  X,
  Share2,
  Copy,
  Check,
  Users,
  Bot,
  AlertCircle,
  MessageCircle,
  ArrowRight,
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
  setBattlePlayerReady,
  startBattleRoomMatch,
  updateBattlePlayerScore,
  listenToBattleRoom,
  sanitizeRoomId,
  generateBattleRoomQuestions,
  requestBattleRoomRematch,
} from '@/lib/battleRoomSync';

interface RealtimeBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
  initialRoomId?: string | null;
  isHostInitial?: boolean;
  onPlayBot?: () => void;
  onPlayQuickMatch?: () => void;
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
  tierName = 'GELEŽINĖ LYGA',
  initialRoomId = null,
  isHostInitial = true,
  onPlayBot,
  onPlayQuickMatch,
}) => {
  const { recordBattleResult } = useGame();
  const { user } = useAuth();

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialQueryRoomId = initialRoomId || urlParams?.get('roomId');
  const isGuestFromUrl = Boolean(initialQueryRoomId && initialQueryRoomId.trim());

  const [roomId, setRoomId] = useState<string>(() => {
    if (initialQueryRoomId && initialQueryRoomId.trim()) return initialQueryRoomId.trim().toUpperCase();
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });
  const [isHost, setIsHost] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && initialQueryRoomId) {
      const clean = sanitizeRoomId(initialQueryRoomId);
      if (localStorage.getItem(`battle_host_${clean}`) === 'true') {
        return true;
      }
    }
    if (isGuestFromUrl) return false;
    return isHostInitial;
  });
  const [room, setRoom] = useState<BattleRoomDoc | null>(null);
  const [phase, setPhase] = useState<
    'select_mode' | 'mode_select' | 'loading' | 'prompt_guest' | 'waiting' | 'countdown' | 'battle' | 'completed'
  >(() => {
    if (initialQueryRoomId && initialQueryRoomId.trim()) return 'loading';
    return 'select_mode';
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Manual Room Code input state
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isJoiningWithCode, setIsJoiningWithCode] = useState(false);

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
  const xpAwardedRef = useRef(false);
  const [opponentTimeoutReached, setOpponentTimeoutReached] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAnotherBattlePopup, setShowAnotherBattlePopup] = useState(false);

  const prevGuestRef = useRef<BattleRoomPlayer | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const currentUserName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)');
  const currentUserAvatar = user?.photoURL || undefined;

  const roomQuestions = (room?.questions && room.questions.length > 0)
    ? room.questions
    : generateBattleRoomQuestions(5, roomId || 'DEFAULT');

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
    xpAwardedRef.current = false;
    prevGuestRef.current = null;

    const timer = setTimeout(() => {
      if (!isMounted) return;
      setSelectedOptionIndex(null);
      setRoundCompleted(false);
      setCurrentRound(0);
      setLocalScore(0);
      setConnectionError(null);
      setHostJoinBanner(null);

      const activeUrlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const queryRoomId = initialRoomId || activeUrlParams?.get('roomId');

      if (!queryRoomId) {
        setIsHost(true);
        setPhase('select_mode');
        setManualCodeInput('');
        setCodeError(null);
        setIsJoiningWithCode(false);
      } else {
        const cleanInitialId = sanitizeRoomId(queryRoomId);
        setRoomId(cleanInitialId);
        setIsHost(false);
      }
    }, 0);

    const activeUrlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const queryRoomId = initialRoomId || activeUrlParams?.get('roomId');
    if (!queryRoomId) {
      return () => {
        clearTimeout(timer);
      };
    }

    // 2. DIRECT GUEST FLOW (URL Parameter Failsafe: drop directly into room join flow)
    const cleanInitialId = sanitizeRoomId(queryRoomId);

    // 4-Second Timeout Guard to prevent infinite "Connecting to battle arena..." hanging
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        console.error('[BATTLE_ARENA_ERROR]: Connection timeout after 4 seconds. Forcing lobby resolution.');
        setPhase((prev) => {
          if (prev === 'loading') {
            return 'prompt_guest';
          }
          return prev;
        });
      }
    }, 4000);

    const init = async () => {
      try {
        const isLocallyHost = typeof window !== 'undefined' && localStorage.getItem(`battle_host_${cleanInitialId}`) === 'true';
        const existing = await getBattleRoom(cleanInitialId);

        // Check if current user is actually the host of this room
        if (isLocallyHost || (existing && user?.uid && existing.host.id === user.uid)) {
          if (isMounted) {
            setIsHost(true);
            if (existing) {
              setRoom(existing);
              const bothReady = Boolean(
                existing.guest &&
                (existing.hostReady ?? existing.host?.ready) &&
                (existing.guestReady ?? existing.guest?.ready)
              );
              if (bothReady || existing.status === 'starting') {
                setPhase('countdown');
              } else if (existing.status === 'in_progress') {
                setPhase('battle');
              } else {
                setPhase('waiting');
              }
            } else {
              setPhase('waiting');
            }
          }
          return;
        }

        if (isMounted) {
          setIsHost(false);
          const existingName = getStoredGuestName(user?.displayName, user?.email);

          // Step 4: If they have an existing username/profile in localStorage, join immediately
          if (existingName) {
            const updated = await joinBattleRoom(cleanInitialId, {
              id: user?.uid || `guest_${Date.now()}`,
              name: existingName,
            });
            setRoom(updated);
            const bothReady = Boolean(
              updated.guest &&
              (updated.hostReady ?? updated.host?.ready) &&
              (updated.guestReady ?? updated.guest?.ready)
            );
            setPhase(bothReady || updated.status === 'starting' ? 'countdown' : 'waiting');
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
          setIsHost(false);
          const existingName = getStoredGuestName(user?.displayName, user?.email);
          if (existingName) {
            joinBattleRoom(cleanInitialId, {
              id: user?.uid || `guest_${Date.now()}`,
              name: existingName,
            }).catch(() => {});
            setPhase('waiting');
          } else {
            const randomDefault = LITHUANIAN_GUEST_NAMES[Math.floor(Math.random() * LITHUANIAN_GUEST_NAMES.length)];
            setGuestNameInput(randomDefault);
            setPhase('prompt_guest');
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

      // On the Host device (isHost === true):
      // When updatedRoom.guest is non-null, alert host
      if (isHost && updatedRoom.guest && !prevGuestRef.current) {
        prevGuestRef.current = updatedRoom.guest;
        sounds.playSuccess();
        haptics.success();
        setHostJoinBanner(`🎉 ${updatedRoom.guest.name} has joined! Both players must be ready.`);
      }

      // Check if both players are ready
      const hostReady = Boolean(updatedRoom.hostReady ?? updatedRoom.host?.ready);
      const guestReady = Boolean(updatedRoom.guestReady ?? updatedRoom.guest?.ready);
      const bothReady = Boolean(updatedRoom.guest && hostReady && guestReady);

      if (updatedRoom.status === 'in_progress') {
        if (phaseRef.current !== 'battle' && phaseRef.current !== 'completed') {
          setPhase('battle');
        }
      } else if (bothReady || updatedRoom.status === 'starting') {
        if (phaseRef.current !== 'countdown' && phaseRef.current !== 'battle' && phaseRef.current !== 'completed') {
          setPhase('countdown');
        }
      } else {
        if (phaseRef.current === 'loading') {
          setPhase('waiting');
        }
      }

      // If status changed to completed
      if (updatedRoom.status === 'completed' && phaseRef.current === 'battle') {
        setPhase('completed');
      }

      // If room was reset for a rematch while player was on completed screen
      if (updatedRoom.status === 'waiting' && phaseRef.current === 'completed') {
        cleanupTimers();
        setPhase('waiting');
        setCurrentRound(0);
        setLocalScore(0);
        xpAwardedRef.current = false;
        setSelectedOptionIndex(null);
        setRoundCompleted(false);
        setOpponentTimeoutReached(false);
        setHostJoinBanner('🎉 Rematch started! Both players must tap Ready.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, roomId, isHost]);

  // 3. Handle 3-Second Synchronized Countdown
  useEffect(() => {
    if (phase !== 'countdown' || !isOpen) return;

    let count = 3;
    sounds.playClick();

    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(Math.max(0, count));
      if (count > 0) {
        sounds.playClick();
      } else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        sounds.playSuccess();
        haptics.victory();
        if (roomId) {
          startBattleRoomMatch(roomId).catch((err) => {
            console.error('[BATTLE_ARENA_ERROR]: Error starting match:', err);
          });
        }
        setTimeout(() => {
          setRoom((prevRoom) => (prevRoom ? { ...prevRoom, status: 'in_progress' } : prevRoom));
          setPhase('battle');
        }, 400);
      }
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [phase, isOpen, roomId]);

  // 4. Guest Confirms Display Name to Join (Step 4)
  const handleConfirmGuestJoin = () => {
    if (!roomId) return;
    const cleanId = roomId.trim().replace(/^#+/, '').toUpperCase();
    const randomDefault = LITHUANIAN_GUEST_NAMES[Math.floor(Math.random() * LITHUANIAN_GUEST_NAMES.length)];
    const finalName = guestNameInput.trim() || randomDefault;

    if (typeof window !== 'undefined') {
      try { localStorage.setItem('sekmes_user_name', finalName); } catch {}
    }

    // Transition state optimistically: join in waiting phase so both players must ready up
    const guestId = user?.uid || `guest_${Date.now()}`;
    setRoom((prev) => prev ? {
      ...prev,
      status: 'waiting',
      guestReady: false,
      guest: { id: guestId, name: finalName, joined: true, score: 0, ready: false, currentRound: 0 }
    } : {
      roomId: cleanId,
      status: 'waiting',
      host: { id: 'host', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
      guest: { id: guestId, name: finalName, joined: true, score: 0, ready: false, currentRound: 0 },
      hostReady: false,
      guestReady: false,
      countdown: 3,
      currentRound: 0,
      tier: tierName,
      questions: generateBattleRoomQuestions(5, cleanId),
      createdAt: Date.now(),
    });

    setIsHost(false);
    setPhase('waiting');
    sounds.playClick();
    haptics.success();

    joinBattleRoom(cleanId, {
      id: guestId,
      name: finalName,
    })
      .then((updated) => {
        setRoom(updated);
      })
      .catch((err) => {
        console.error('[BATTLE_ARENA_ERROR]: Join sync error:', err);
      });
  };

  // 4a. Mode Select: Quick Match
  const handleSelectQuickMatch = () => {
    sounds.playClick();
    haptics.success();
    if (onPlayBot) {
      onPlayBot();
    } else if (onPlayQuickMatch) {
      onPlayQuickMatch();
    }
  };

  // 4b. Mode Select: Challenge a Friend (Create Room)
  const handleCreateRoom = () => {
    sounds.playClick();
    haptics.success();
    setIsHost(true);
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedId);
    setPhase('waiting');

    createBattleRoom(
      {
        id: user?.uid || `host_${Date.now()}`,
        name: currentUserName,
      },
      tierName,
      generatedId
    )
      .then((newRoom) => {
        setRoom(newRoom);
      })
      .catch((err) => {
        console.error('[BATTLE_ARENA_ERROR]: Room creation error:', err);
      });
  };

  // 4c. Mode Select: Paste from Clipboard
  const handlePasteCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = text.trim().replace(/^#+/, '').replace(/\s+/g, '').toUpperCase();
          setManualCodeInput(clean.slice(0, 16));
          setCodeError(null);
          sounds.playClick();
          haptics.success();
        }
      }
    } catch {
      // Clipboard read may not be permitted in all browsers
    }
  };

  // 4d. Mode Select: Join Friend's Room
  const handleJoinWithCode = () => {
    const cleanCode = manualCodeInput.trim().replace(/^#+/, '').replace(/\s+/g, '').toUpperCase();
    if (!cleanCode) {
      setCodeError('Enter a valid 6-character room code (e.g. TFYS5I)');
      sounds.playError?.();
      haptics.error();
      return;
    }

    setCodeError(null);
    setRoomId(cleanCode);
    setIsHost(false);

    const existingName = getStoredGuestName(user?.displayName, user?.email);
    if (existingName) {
      const guestId = user?.uid || `guest_${Date.now()}`;
      setRoom((prev) => prev ? {
        ...prev,
        status: 'waiting',
        guestReady: false,
        guest: { id: guestId, name: existingName, joined: true, score: 0, ready: false, currentRound: 0 }
      } : {
        roomId: cleanCode,
        status: 'waiting',
        host: { id: 'host', name: 'Host', joined: true, score: 0, ready: false, currentRound: 0 },
        guest: { id: guestId, name: existingName, joined: true, score: 0, ready: false, currentRound: 0 },
        hostReady: false,
        guestReady: false,
        countdown: 3,
        currentRound: 0,
        tier: tierName,
        questions: generateBattleRoomQuestions(5, cleanCode),
        createdAt: Date.now(),
      });

      // Joins directly into waiting lobby
      setPhase('waiting');
      sounds.playClick();
      haptics.success();

      joinBattleRoom(cleanCode, {
        id: guestId,
        name: existingName,
      })
        .then((updated) => setRoom(updated))
        .catch((err) => console.error('[BATTLE_ARENA_ERROR]: Join with code error:', err));
    } else {
      // Transitions to prompt_guest
      const randomDefault = LITHUANIAN_GUEST_NAMES[Math.floor(Math.random() * LITHUANIAN_GUEST_NAMES.length)];
      setGuestNameInput(randomDefault);
      setPhase('prompt_guest');
      sounds.playClick();
      haptics.success();
    }
  };

  // 4e. Toggle Ready State
  const handleToggleReady = () => {
    if (!roomId) return;
    const isCurrentReady = isHost
      ? Boolean(room?.hostReady ?? room?.host?.ready)
      : Boolean(room?.guestReady ?? room?.guest?.ready);
    const newReady = !isCurrentReady;

    sounds.playClick();
    if (newReady) haptics.success();

    setRoom((prev) => {
      if (!prev) return prev;
      const updatedHostReady = isHost ? newReady : Boolean(prev.hostReady ?? prev.host?.ready);
      const updatedGuestReady = !isHost ? newReady : Boolean(prev.guestReady ?? prev.guest?.ready);
      const bothReady = Boolean(prev.guest && updatedHostReady && updatedGuestReady);

      if (bothReady) {
        setPhase('countdown');
      }

      if (isHost) {
        return {
          ...prev,
          hostReady: newReady,
          host: prev.host ? { ...prev.host, ready: newReady } : { id: 'host', name: currentUserName, joined: true, score: 0, ready: newReady, currentRound: 0 },
          status: bothReady ? 'starting' : prev.status,
        };
      } else {
        return {
          ...prev,
          guestReady: newReady,
          guest: prev.guest ? { ...prev.guest, ready: newReady } : null,
          status: bothReady ? 'starting' : prev.status,
        };
      }
    });

    setBattlePlayerReady(roomId, isHost, newReady).catch((err) => {
      console.error('[BATTLE_ARENA_ERROR]: Failed to set ready:', err);
    });
  };

  const scheduleAdvance = useCallback((rIndex: number) => {
    advanceTimerRef.current = setTimeout(() => {
      if (rIndex + 1 < TOTAL_ROUNDS) {
        setCurrentRound(rIndex + 1);
        setRoundCompleted(false);
        setTimeLeft(ROUND_SECONDS);
        setSelectedOptionIndex(null);
      } else {
        setPhase('completed');
      }
    }, 1400);
  }, []);

  // Handle Timeout
  const handleRoundTimeout = useCallback(() => {
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
  }, [roundCompleted, roomId, isHost, localScore, currentRound, scheduleAdvance]);

  // Handle Option Selection
  const handleSelectOption = (index: number) => {
    if (roundCompleted || selectedOptionIndex !== null) return;

    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    setSelectedOptionIndex(index);
    setRoundCompleted(true);

    const question = roomQuestions[currentRound];
    const isCorrect = question && index === question.answerIndex;

    let nextScore = localScore;
    if (isCorrect) {
      sounds.playCorrect();
      haptics.success();
      const points = 20;
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

  // 5. Active Round Countdown & Answer Timing
  useEffect(() => {
    if (phase !== 'battle' || roundCompleted || !isOpen) {
      return;
    }

    let secondsLeft = ROUND_SECONDS;
    roundTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setTimeLeft(Math.max(0, secondsLeft));
      if (secondsLeft <= 0) {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
        handleRoundTimeout();
      }
    }, 1000);

    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [phase, currentRound, roundCompleted, isOpen, handleRoundTimeout]);

  // 6. Post-match Victory Rewards & Confetti Trigger
  useEffect(() => {
    if (phase !== 'completed') {
      return;
    }
    // If opponent already finished all rounds, no timer needed
    const opponentRounds = (isHost ? room?.guest?.currentRound : room?.host?.currentRound) ?? 0;
    if (opponentRounds >= TOTAL_ROUNDS || room?.status === 'completed') {
      return;
    }

    // Allow opponent fair time based on remaining rounds: (15s round + 5s buffer) per remaining question
    const remainingRounds = Math.max(1, TOTAL_ROUNDS - opponentRounds);
    const timeoutMs = Math.min(60000, remainingRounds * (ROUND_SECONDS + 5) * 1000);

    const timeout = setTimeout(() => {
      setOpponentTimeoutReached(true);
    }, timeoutMs);
    return () => clearTimeout(timeout);
  }, [phase, room?.status, isHost, room?.guest?.currentRound, room?.host?.currentRound]);

  useEffect(() => {
    if (phase !== 'completed' || xpAwardedRef.current || !room) return;

    // CRITICAL: Do NOT evaluate outcome or award XP until opponent has finished all rounds or timed out!
    const opponentFinished =
      ((isHost ? room.guest?.currentRound : room.host.currentRound) ?? 0) >= TOTAL_ROUNDS ||
      room.status === 'completed' ||
      opponentTimeoutReached;

    if (!opponentFinished) {
      return; // Wait for opponent to finish playing
    }
    xpAwardedRef.current = true;

    const myScore = Math.max(localScore, isHost ? room.host.score : (room.guest?.score ?? 0));
    const finalOpponentScore = isHost ? (room.guest?.score ?? 0) : room.host.score;
    const isWin = myScore > finalOpponentScore;
    const isTie = myScore === finalOpponentScore;
    const earnedXp = isWin ? 25 : isTie ? 15 : 10;
    recordBattleResult(earnedXp, isWin);
    if (isWin) {
      sounds.playSuccess();
      haptics.victory();
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

    const popupTimer = setTimeout(() => {
      setShowAnotherBattlePopup(true);
    }, 1500);

    return () => clearTimeout(popupTimer);
  }, [phase, room, isHost, localScore, opponentTimeoutReached, recordBattleResult]);

  // Copy or Share Room Link
  const shareUrl = typeof window !== 'undefined' && roomId
    ? `${window.location.origin}/league?battle=room&roomId=${roomId}`
    : '';

  const shareText = `${currentUserName} has challenged you to a live 1v1 Lithuanian Speed Battle on LabasApp! Think you can beat my score? Join now:`;

  const getActiveShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return shareUrl || `${window.location.origin}/league?battle=room&roomId=${roomId || 'ROOM'}`;
  };

  const handleCopyLink = async () => {
    const activeUrl = getActiveShareUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(activeUrl);
        setCopiedLink(true);
        showToast('Invite link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 3000);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = activeUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedLink(true);
        showToast('Invite link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Clipboard copy failed:', err);
      showToast('Invite link copied to clipboard!');
    }
  };

  const handleShareWhatsApp = () => {
    const activeUrl = getActiveShareUrl();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + activeUrl)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareInvite = async () => {
    const activeUrl = getActiveShareUrl();
    const shareData = {
      title: 'LabasApp 1v1 Battle 🇱🇹⚔️',
      text: shareText,
      url: activeUrl,
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
    // Fallback: simulate bot guest joining immediately and auto-readying
    if (roomId) {
      try {
        const botGuest = {
          id: 'bot_mantas',
          name: 'Mantas (Bot) 🤖',
        };
        await joinBattleRoom(roomId, botGuest);
        await setBattlePlayerReady(roomId, true, true);
        await setBattlePlayerReady(roomId, false, true);
        setPhase('countdown');
      } catch (err) {
        console.error('[BATTLE_ARENA_ERROR]: Bot join fallback error:', err);
        setPhase('countdown');
      }
    }
  };

  // Play Again: rematch existing room or create new room
  const handlePlayAgain = async () => {
    cleanupTimers();
    setCurrentRound(0);
    setLocalScore(0);
    xpAwardedRef.current = false;
    setOpponentTimeoutReached(false);
    setSelectedOptionIndex(null);
    setRoundCompleted(false);
    setShowAnotherBattlePopup(false);
    setConnectionError(null);
    setHostJoinBanner(null);

    // If both players are in an active room, request a synchronized rematch
    if (roomId && room?.guest) {
      setPhase('waiting');
      try {
        const rematched = await requestBattleRoomRematch(roomId, room);
        if (rematched) {
          setRoom(rematched);
          showToast('Rematch started! Both players must tap READY.');
          return;
        }
      } catch (err) {
        console.error('[BATTLE_ARENA_ERROR]: Rematch failed, creating new room:', err);
      }
    }

    // Fallback: create fresh new room
    setIsHost(true);
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedId);
    setPhase('waiting');
    prevGuestRef.current = null;

    try {
      const newRoom = await createBattleRoom(
        {
          id: user?.uid || `host_${Date.now()}`,
          name: currentUserName,
        },
        tierName,
        generatedId
      );
      setRoom(newRoom);
    } catch (err) {
      console.error('[BATTLE_ARENA_ERROR]: Play again room creation failed:', err);
    }
  };

  if (!isOpen) return null;

  const currentQ = roomQuestions[currentRound] || roomQuestions[0];
  const hostPlayer = room?.host;
  const guestPlayer = room?.guest;

  const opponentPlayer = isHost ? guestPlayer : hostPlayer;
  const opponentName = opponentPlayer?.name || (isHost ? 'Waiting for Friend...' : 'Host');
  const opponentScore = opponentPlayer?.score || 0;
  const isOpponentFinished = Boolean(
    ((opponentPlayer?.currentRound ?? 0) >= TOTAL_ROUNDS) ||
    (room?.status === 'completed') ||
    opponentTimeoutReached
  );

  const isHostReady = Boolean(room?.hostReady ?? room?.host?.ready);
  const isGuestReady = Boolean(room?.guestReady ?? room?.guest?.ready);
  const isMyReady = isHost ? isHostReady : isGuestReady;
  const isOpponentReady = isHost ? isGuestReady : isHostReady;

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
              {phase === 'select_mode' || phase === 'mode_select'
                ? `1V1 BATTLE ARENA • ${tierName}`
                : `1V1 LIVE BATTLE ROOM ${roomId ? `• #${roomId.toUpperCase()}` : ''}`}
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
        {/* 0. BATTLE MODE SELECTOR (Battle Launcher Modal) */}
        {/* ============================================================== */}
        {(phase === 'select_mode' || phase === 'mode_select') && (
          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="text-center mb-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Choose Battle Mode
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                5 rapid rounds of Lithuanian vocabulary. Answer fast for maximum XP!
              </p>
            </div>

            <div className="space-y-3">
              {/* CARD 1: ⚡ Quick Match */}
              <div
                onClick={handleSelectQuickMatch}
                className="group rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 p-3.5 sm:p-4 transition-all duration-150 hover:shadow-md cursor-pointer flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm text-xl group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        Quick Match
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Instant matchmaking with a league competitor in your current division.
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-xl bg-slate-100 group-hover:bg-amber-500 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* CARD 2: ➕ Challenge a Friend (Create Room) */}
              <div
                onClick={handleCreateRoom}
                className="group rounded-2xl border-2 border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 p-3.5 sm:p-4 transition-all duration-150 hover:shadow-md cursor-pointer flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm text-xl group-hover:scale-105 transition-transform">
                    ➕
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                        Challenge a Friend
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Create Room
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Generate a private room ID, share invite on WhatsApp, and wait for your friend.
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-xl bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* CARD 3: 🔑 Join Friend's Room */}
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 text-left shadow-2xs">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-sm text-xl">
                    🔑
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        Join Friend&apos;s Room
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Direct
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Have a friend&apos;s 6-character room code? Enter it below.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => {
                        setManualCodeInput(e.target.value.replace(/^#+/, '').replace(/\s+/g, '').toUpperCase());
                        setCodeError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinWithCode();
                      }}
                      placeholder="ENTER CODE (e.g. TFYS5I)"
                      maxLength={12}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm font-mono font-black text-slate-800 uppercase tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 bg-white shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
                    >
                      PASTE
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinWithCode}
                      disabled={!manualCodeInput.trim() || isJoiningWithCode}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
                    >
                      {isJoiningWithCode ? '...' : 'JOIN'}
                    </button>
                  </div>

                  {codeError && (
                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
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
        {/* 3. LOBBY / WAITING ROOM (Pre-match & Both Players Ready Check) */}
        {/* ============================================================== */}
        {phase === 'waiting' && (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
            {!guestPlayer ? (
              /* Case A: Waiting for Opponent to Join via Link or Code */
              <>
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
                  Share your room invite below. Once your friend joins, both players tap Ready to start the battle!
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
                    {getActiveShareUrl()}
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

                {/* Optional Ready-in-advance Toggle */}
                <div className="mt-4 w-full max-w-sm p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>Your Status:</span>
                      {isHostReady ? (
                        <span className="text-emerald-700 font-bold">Ready ✓</span>
                      ) : (
                        <span className="text-slate-500 font-normal">Waiting</span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-800/80">Tap to get ready in advance</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-xs ${
                      isHostReady
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {isHostReady ? '✓ Ready' : 'Ready Up ⚔️'}
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
                    onClick={() => setPhase('select_mode')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    ← Back to Modes
                  </button>
                </div>
              </>
            ) : (
              /* Case B: Both Players in Room - Ready Check Lobby */
              <>
                {/* Header Banner */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-black text-emerald-900 tracking-wider uppercase mb-2 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>Opponent Connected!</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  1v1 Arena Matchup
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Both players must tap &quot;Ready&quot; before the battle starts!
                </p>

                {/* Matchup Versus Card with Ready Indicators */}
                <div className="w-full max-w-sm rounded-3xl bg-slate-900 text-white p-4 sm:p-5 shadow-2xl border-2 border-slate-800 my-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10 pointer-events-none" />

                  <div className="flex items-center justify-between gap-3 relative z-10">
                    {/* Host Player Card */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="relative mb-2">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg ring-4 transition-all duration-300 ${
                            isHostReady
                              ? 'ring-emerald-400 ring-offset-2 ring-offset-slate-900'
                              : 'ring-amber-400/40'
                          }`}
                        >
                          {hostPlayer?.name ? hostPlayer.name.slice(0, 2).toUpperCase() : 'H'}
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 text-sm">👑</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white truncate max-w-full text-center">
                        {hostPlayer?.name || 'Host'} {isHost && <span className="text-amber-300 text-[10px]">(You)</span>}
                      </span>
                      <div className="mt-1.5">
                        {isHostReady ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span>✓ READY</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span>⏳ WAITING</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* VS Swords Center Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-2">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow-xl ring-4 ring-amber-300/30">
                        VS
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold tracking-wider">
                        1v1
                      </span>
                    </div>

                    {/* Guest Player Card */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className="relative mb-2">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg ring-4 transition-all duration-300 ${
                            isGuestReady
                              ? 'ring-emerald-400 ring-offset-2 ring-offset-slate-900'
                              : 'ring-emerald-400/40'
                          }`}
                        >
                          {guestPlayer?.name ? guestPlayer.name.slice(0, 2).toUpperCase() : 'G'}
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 text-sm">⚔️</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white truncate max-w-full text-center">
                        {guestPlayer?.name || 'Guest'} {!isHost && <span className="text-emerald-300 text-[10px]">(You)</span>}
                      </span>
                      <div className="mt-1.5">
                        {isGuestReady ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span>✓ READY</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span>⏳ WAITING</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Interactive Ready Action Button */}
                <div className="w-full max-w-sm space-y-2.5 mt-1">
                  {!isMyReady ? (
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-sm uppercase tracking-wider transition transform active:scale-95 shadow-xl shadow-emerald-500/30 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>I&apos;M READY ⚔️</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-800 hover:bg-emerald-100 font-black text-sm uppercase tracking-wider transition transform active:scale-95 shadow-md cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>✓ YOU ARE READY!</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold normal-case">
                        {isOpponentReady ? 'Both ready! Starting countdown...' : 'Waiting for opponent to tap Ready... (Tap to Cancel)'}
                      </span>
                    </button>
                  )}

                  {/* Status Indicator Text */}
                  <p className="text-[11px] font-bold text-slate-500 text-center">
                    {isMyReady && !isOpponentReady && (
                      <span className="text-amber-600">⏳ Waiting for {opponentName} to tap Ready...</span>
                    )}
                    {!isMyReady && isOpponentReady && (
                      <span className="text-emerald-600 animate-pulse">⚡ {opponentName} is READY! Tap I&apos;M READY to start!</span>
                    )}
                    {!isMyReady && !isOpponentReady && (
                      <span>Both players must tap Ready to trigger the 3-second countdown!</span>
                    )}
                    {isMyReady && isOpponentReady && (
                      <span className="text-emerald-700 font-black animate-pulse">🚀 Both ready! Starting battle...</span>
                    )}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 w-full max-w-sm">
                  {isHost ? (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Room: #{roomId}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPhase('select_mode');
                      setRoom(null);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Leave Room
                  </button>
                </div>
              </>
            )}
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
        {/* 5. ACTIVE SYNCHRONIZED 5-ROUND RAPID BATTLE */}
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
            {!isOpponentFinished ? (
              // STANDBY: Early Finisher Waiting for Opponent
              <div className="flex flex-col items-center justify-center my-4 max-w-sm w-full animate-in fade-in duration-200">
                <div className="relative flex items-center justify-center mb-4">
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-amber-400 opacity-25 animate-ping" />
                  <div className="relative w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-md">
                    ⏳
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Laukiama varžovo pabaigos...
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Tu jau baigei visus 5 raundus! {opponentName} šiuo metu atsako į{' '}
                  <strong className="text-amber-600">
                    {Math.min(5, (opponentPlayer?.currentRound ?? 0) + 1)} iš {TOTAL_ROUNDS}
                  </strong>{' '}
                  klausimą.
                </p>

                {/* Live Progress Card */}
                <div className="mt-5 w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tavo rezultatas</span>
                    <span className="text-base font-black text-emerald-600">{localScore} taškų</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{opponentName}</span>
                    <span className="text-base font-black text-amber-600">
                      {opponentScore} taškų ({Math.min(5, (opponentPlayer?.currentRound ?? 0) + 1)}/5)
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4 italic">
                  Galutinis nugalėtojas ir lygos apdovanojimas bus nustatyti, kai abu žaidėjai baigs kovą.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Grįžti į lygą
                </button>
              </div>
            ) : (
              // FINAL MATCH RESULT (Both players finished or timeout reached)
              <div className="flex flex-col items-center w-full animate-in fade-in duration-200">
                {localScore > opponentScore ? (
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
                ) : localScore === opponentScore ? (
                  <>
                    <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mb-3 shadow-md">
                      🤝
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Lygiosios! 🤝
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Atkakli kova! Abu žaidėjai surinko po {localScore} taškų.
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
                    localScore > opponentScore
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="relative mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center ring-2 ring-emerald-400 shadow-xs">
                        Tu
                      </div>
                      {localScore > opponentScore && (
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
                        {localScore > opponentScore ? '+25 Lygos XP' : localScore === opponentScore ? '+15 Lygos XP' : '+10 Lygos XP'}
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
        )}
        {/* "Do you want another battle?" Pop-up Modal */}
        {showAnotherBattlePopup && phase === 'completed' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-amber-300 p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl mx-auto mb-3 shadow-md shadow-amber-500/20">
                ⚔️
              </div>

              <h3 className="text-xl font-black text-slate-900 leading-tight">
                Do you want another battle?
              </h3>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">
                Ar norite dar vienos dvikovos?
              </p>

              <p className="text-xs text-slate-500 font-medium my-3 leading-relaxed">
                Keep the adrenaline going! Rematch your opponent or jump straight into another live battle!
              </p>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnotherBattlePopup(false);
                    handlePlayAgain();
                  }}
                  className="w-full btn-3d btn-green-3d py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Taip! Žaisti dar kartą (Yes, Battle!)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAnotherBattlePopup(false);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Ne, grįžti į lygą (No, Return to League)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
