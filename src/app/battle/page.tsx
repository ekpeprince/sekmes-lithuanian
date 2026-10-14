'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Zap,
  Flame,
  Trophy,
  Copy,
  Check,
  Share2,
  Volume2,
  Users,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  Crown,
  Play,
  CheckCircle2,
  XCircle,
  Clipboard,
  Bell,
  X,
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { sendFriendJoinedNotification, sendDuelInviteNotification } from '@/lib/notifications';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BattleRoom,
  BattlePlayer,
  AIRival,
  AI_RIVALS,
  createBattleRoom,
  createAIBattleRoom,
  joinBattleRoom,
  startBattle,
  submitAnswer,
  advanceRound,
  subscribeToBattleRoom,
  calculateAnswerPoints,
} from '@/lib/battleSync';

const AVATARS = ['🦊', '🐺', '🦁', '🦉', '🦅', '🐻', '🐼', '🐯'];

function BattleArenaContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');

  const { addXp, progress } = useGame();
  const { user } = useAuth();

  // User Profile
  const [userName, setUserName] = useState<string>(() => {
    return user?.displayName || (user?.email ? user.email.split('@')[0] : 'Lietuvis');
  });
  const [userAvatar, setUserAvatar] = useState<string>('🦊');

  // Navigation & Room state
  const [view, setView] = useState<'lobby' | 'in_game' | 'results'>('lobby');
  const [arenaTab, setArenaTab] = useState<'rivals' | 'friends'>(roomParam ? 'friends' : 'rivals');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(roomParam || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  // Detect if opened in standalone PWA or browser webview (e.g. WhatsApp on iOS)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    }
  }, []);

  // Paste code from clipboard
  const handlePasteCode = async () => {
    try {
      if (!navigator.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      const match = text.match(/[A-Z0-9]{3}-[A-Z0-9]{3}/i);
      const code = match ? match[0].toUpperCase() : text.trim().toUpperCase();
      if (code) {
        setJoinCodeInput(code);
        sounds.playClick();
      }
    } catch {
      // Permission denied or unavailable
    }
  };

  // In-Game state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnsweredCurrentRound, setHasAnsweredCurrentRound] = useState(false);
  const [roundStatus, setRoundStatus] = useState<'answering' | 'round_complete'>('answering');
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [roundTransitioning, setRoundTransitioning] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [activeRival, setActiveRival] = useState<AIRival | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [guestId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'guest-user';
    try {
      let stored = sessionStorage.getItem('sekmes_guest_battle_id');
      if (!stored) {
        stored = `guest-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('sekmes_guest_battle_id', stored);
      }
      return stored;
    } catch {
      return `guest-${Math.random().toString(36).substring(2, 9)}`;
    }
  });

  const myPlayerId = user?.uid || guestId;

  // Sync user profile from auth
  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName);
    }
  }, [user]);

  // Join friend's room with code
  const handleJoinRoomWithCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Įveskite 6 simbolių kambario kodą.');
      return;
    }

    try {
      setIsJoiningRoom(true);
      setErrorMessage(null);
      const joined = await joinBattleRoom(cleanCode, {
        id: myPlayerId,
        name: userName,
        avatar: userAvatar,
      });

      if (!joined) {
        setErrorMessage(`Kambarys „${cleanCode}“ nerastas. Patikrinkite kodą!`);
        return;
      }

      setRoom(joined);
      sounds.playClick();
      if (joined.status === 'in_progress') {
        setView('in_game');
        setRoundStatus('answering');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setErrorMessage('Nepavyko prisijungti prie kambario.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Auto-join room if ?room= query param is provided via invite link
  useEffect(() => {
    if (roomParam && view === 'lobby' && !room) {
      const code = roomParam.trim().toUpperCase();
      setJoinCodeInput(code);
      handleJoinRoomWithCode(code);
    }
  }, [roomParam]);

  // Subscribe to room updates
  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = subscribeToBattleRoom(room.id, (updatedRoom) => {
      // Alert host with haptics & notification when a friend connects to the room
      const prevPlayerCount = Object.keys(room?.players || {}).length;
      const newPlayerCount = Object.keys(updatedRoom.players || {}).length;
      if (prevPlayerCount === 1 && newPlayerCount >= 2 && view === 'lobby') {
        const guestPlayer = Object.values(updatedRoom.players).find((p) => !p.isHost);
        const guestName = guestPlayer?.name || 'Draugas';
        haptics.duelAlert();
        sounds.playSuccess();
        sendFriendJoinedNotification(guestName, updatedRoom.id).catch(() => {});
      }

      setRoom(updatedRoom);
      if (updatedRoom.status === 'in_progress' && view === 'lobby') {
        setView('in_game');
        setRoundStartTime(Date.now());
        setTimeLeft(15);
        setSelectedOption(null);
        setHasAnsweredCurrentRound(false);
        setRoundStatus('answering');
        setRoundTransitioning(false);
      } else if (updatedRoom.status === 'finished') {
        setView('results');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [room?.id, view]);

  // Finish battle session cleanly
  const finishBattle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setView('results');
  };

  // Advance to next round or finish match
  const advanceToNextRound = async (targetRound: number) => {
    if (!room) return;
    const totalRounds = room.questions.length;
    if (targetRound >= totalRounds) {
      finishBattle();
      return;
    }

    const updated = await advanceRound(room.id, targetRound);
    if (updated) {
      setRoom(updated);
    }
    setTimeLeft(15);
    setSelectedOption(null);
    setHasAnsweredCurrentRound(false);
    setRoundStatus('answering');
    setRoundTransitioning(false);
  };

  // Complete current round and advance after 2000ms delay
  const completeRoundAndAdvance = (currentRoundIndex: number) => {
    if (roundTransitioning) return;
    setRoundTransitioning(true);
    setRoundStatus('round_complete');

    if (timerRef.current) clearInterval(timerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);

    advanceTimeoutRef.current = setTimeout(() => {
      const totalRounds = room?.questions.length || 5;
      if (currentRoundIndex < totalRounds - 1) {
        advanceToNextRound(currentRoundIndex + 1);
      } else {
        finishBattle();
      }
    }, 2000);
  };

  // 15-second round countdown timer & 12-second safety watchdog timer
  useEffect(() => {
    if (view !== 'in_game' || !room || room.status !== 'in_progress') return;

    setTimeLeft(15);
    setRoundStartTime(Date.now());
    setSelectedOption(null);
    setHasAnsweredCurrentRound(false);
    setRoundStatus('answering');
    setRoundTransitioning(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);

    // 15s Countdown Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 4) {
          haptics.warningTick();
        }
        return prev - 1;
      });
    }, 1000);

    // 12-second safety watchdog timer: force-resolves if round hangs
    watchdogTimerRef.current = setTimeout(async () => {
      if (view === 'in_game' && room && !roundTransitioning) {
        const currentQ = room.questions[room.currentRound];
        if (!currentQ) return;

        const playersList = Object.values(room.players);
        const myActive = playersList.find((p) => !p.isBot) || room.players[myPlayerId] || playersList[0];
        const bot = playersList.find((p) => p.isBot);

        if (!myActive?.answers[room.currentRound]) {
          setHasAnsweredCurrentRound(true);
          setSelectedOption((prev) => prev || '');
          await submitAnswer(room.id, myActive?.id || myPlayerId, room.currentRound, '', currentQ.correctAnswer, 12000);
        }

        if (bot && !bot.answers[room.currentRound]) {
          await submitAnswer(room.id, bot.id, room.currentRound, currentQ.correctAnswer, currentQ.correctAnswer, 3000);
        }

        completeRoundAndAdvance(room.currentRound);
      }
    }, 12000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, [room?.currentRound, view]);

  // Automated round transition when both players have submitted answers
  useEffect(() => {
    if (view !== 'in_game' || !room || room.status !== 'in_progress' || roundTransitioning) return;

    const playersList = Object.values(room.players);
    if (playersList.length >= 2) {
      const myPlayer = room.players[myPlayerId] || playersList.find((p) => !p.isBot) || playersList[0];
      const opponentPlayer = playersList.find((p) => p.isBot) || playersList.find((p) => p.id !== myPlayer?.id);

      const userAns = myPlayer?.answers[room.currentRound] || (hasAnsweredCurrentRound ? { selected: selectedOption } : undefined);
      const oppAns = opponentPlayer?.answers[room.currentRound];

      if (userAns && oppAns) {
        completeRoundAndAdvance(room.currentRound);
      }
    }
  }, [room, view, roundTransitioning, hasAnsweredCurrentRound, selectedOption, myPlayerId]);

  // AI Rival automated response simulation
  useEffect(() => {
    if (view !== 'in_game' || !room || room.status !== 'in_progress' || roundTransitioning) return;

    const botPlayer = Object.values(room.players).find((p) => p.isBot);
    if (!botPlayer) return;

    const botAlreadyAnswered = Boolean(botPlayer.answers[room.currentRound]);
    if (botAlreadyAnswered) return;

    const currentQ = room.questions[room.currentRound];
    if (!currentQ) return;

    // Responsive thinking delay for bot (1.0s to 2.2s)
    const delay = Math.floor(1000 + Math.random() * 1200);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(async () => {
      const willBeCorrect = Math.random() < (activeRival?.accuracy ?? 0.85);
      const firstOptLt = typeof currentQ.options[0] === 'string' ? currentQ.options[0] : currentQ.options[0].lt;
      const incorrectOpt = currentQ.options.find((o) => {
        const text = typeof o === 'string' ? o : o.lt;
        return text !== currentQ.correctAnswer;
      });
      const incorrectLt = incorrectOpt ? (typeof incorrectOpt === 'string' ? incorrectOpt : incorrectOpt.lt) : firstOptLt;
      const botAnswer = willBeCorrect ? currentQ.correctAnswer : incorrectLt;

      const updated = await submitAnswer(
        room.id,
        botPlayer.id,
        room.currentRound,
        botAnswer,
        currentQ.correctAnswer,
        delay
      );
      if (updated) {
        setRoom(updated);
      }
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [room?.currentRound, view, activeRival, roundTransitioning]);

  // Handle when timer hits 0
  const handleTimeExpired = async () => {
    if (!room || hasAnsweredCurrentRound || roundTransitioning) return;
    const currentQ = room.questions[room.currentRound];
    if (!currentQ) return;

    setHasAnsweredCurrentRound(true);
    setSelectedOption('');
    sounds.playError();

    const playersList = Object.values(room.players);
    const myPlayer = room.players[myPlayerId] || playersList.find((p) => !p.isBot) || playersList[0];

    const updated = await submitAnswer(room.id, myPlayer?.id || myPlayerId, room.currentRound, '', currentQ.correctAnswer, 15000);
    if (updated) setRoom(updated);
    completeRoundAndAdvance(room.currentRound);
  };

  // Submit player's answer
  const handleSelectOption = async (option: string) => {
    if (hasAnsweredCurrentRound || !room || roundTransitioning) return;

    const currentQ = room.questions[room.currentRound];
    if (!currentQ) return;

    const elapsedMs = Date.now() - roundStartTime;
    const isCorrect = option === currentQ.correctAnswer;

    setSelectedOption(option);
    setHasAnsweredCurrentRound(true);

    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playError();
    }

    const playersList = Object.values(room.players);
    const myPlayer = room.players[myPlayerId] || playersList.find((p) => !p.isBot) || playersList[0];

    const updated = await submitAnswer(
      room.id,
      myPlayer?.id || myPlayerId,
      room.currentRound,
      option,
      currentQ.correctAnswer,
      elapsedMs
    );
    if (updated) {
      setRoom(updated);
      const opponentPlayer = Object.values(updated.players).find((p) => p.id !== (myPlayer?.id || myPlayerId));
      if (opponentPlayer?.answers[updated.currentRound]) {
        completeRoundAndAdvance(updated.currentRound);
      }
    }
  };

  // Create a new room for a friend
  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      setErrorMessage(null);
      const newRoom = await createBattleRoom({
        id: myPlayerId,
        name: userName,
        avatar: userAvatar,
      });
      setRoom(newRoom);
      sounds.playClick();
    } catch (err) {
      console.error('Error creating room:', err);
      setErrorMessage('Nepavyko sukurti kambario. Bandykite dar kartą.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Start instant match vs AI Rival
  const handleStartAIBattle = (rival: AIRival) => {
    sounds.playClick();
    setActiveRival(rival);
    const newRoom = createAIBattleRoom(
      { id: myPlayerId, name: userName, avatar: userAvatar },
      rival
    );
    setRoom(newRoom);
    setView('in_game');
    setRoundStatus('answering');
  };

  // Join friend's room with code
  const handleJoinRoom = async () => {
    await handleJoinRoomWithCode(joinCodeInput);
  };

  // Start game when both players are in lobby
  const handleStartHostGame = async () => {
    if (!room) return;
    sounds.playClick();
    await startBattle(room.id);
    setView('in_game');
    setRoundStatus('answering');
  };

  // Share room invite
  const handleShareInvite = () => {
    if (!room) return;
    const shareUrl = `${window.location.origin}/battle?room=${room.id}`;
    const shareTitle = `⚔️ Lietuvių kalbos dvikova: ${room.id}`;
    const shareText = `⚔️ Kviečiu tave į lietuvių kalbos dvikovą!\n\n👉 Dvikovos kodas: ${room.id}\n\n📱 Turi „LabasApp“ savo iPhone ekrane?\nAtidaryk programėlę ir suvesk arba įklijuok kodą: ${room.id}\n\n🌐 Arba žaisk tiesiogiai per naršyklę:\n${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Copy code only
  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Audio Playback
  const handlePlayAudio = (text: string) => {
    sounds.speak(text);
  };

  // Claim XP & Gem rewards when game finishes
  useEffect(() => {
    if (view === 'results' && room && !rewardClaimed) {
      setRewardClaimed(true);
      sounds.playLevelComplete();
      addXp(30);
    }
  }, [view, room, rewardClaimed, addXp]);

  // Restart / Rematch
  const handleRematch = () => {
    if (!room) return;
    const botPlayer = Object.values(room.players).find((p) => p.isBot);
    if (botPlayer || activeRival) {
      const botRival = AI_RIVALS.find((r) => r.id === (botPlayer?.id || activeRival?.id)) || activeRival || AI_RIVALS[0];
      handleStartAIBattle(botRival);
    } else {
      handleCreateRoom();
      setView('lobby');
    }
    setRewardClaimed(false);
  };

  // --------------------------------------------------------------------------
  // RENDER: LOBBY
  // --------------------------------------------------------------------------
  if (view === 'lobby') {
    const playersList = room ? Object.values(room.players) : [];
    const canStart = playersList.length >= 2;

    return (
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-5 sm:p-7 text-white shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-base">
                  ⚔️
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                  Battle Arena
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Lithuanian Multiplayer Duel
              </h1>
              <p className="text-xs sm:text-sm text-white/95 font-medium max-w-md mt-1 leading-relaxed">
                5 fast rounds of vocabulary, phrases, and grammar. Answer faster than your rival to claim victory!
              </p>
            </div>

            {/* Clean User Profile Card with non-overflowing avatar picker */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/25 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="relative group p-1 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/40 transition active:scale-95 cursor-pointer"
                title="Change avatar"
              >
                <span className="text-3xl select-none">{userAvatar}</span>
                <span className="absolute -bottom-1 -right-1 bg-white text-slate-800 text-[9px] font-black px-1 rounded-full shadow-xs">
                  ✏️
                </span>
              </button>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider">
                  Your Battle Tag
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your nickname..."
                  className="bg-transparent border-b border-white/40 text-white font-bold text-sm focus:outline-none focus:border-white truncate max-w-[140px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {isAvatarPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-xs rounded-3xl bg-white p-5 shadow-2xl border-2 border-slate-100 animate-in zoom-in-95 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-black text-slate-800">Select Avatar</h3>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5 py-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setUserAvatar(av);
                      setIsAvatarPickerOpen(false);
                    }}
                    className={`h-14 rounded-2xl flex items-center justify-center text-3xl transition-all cursor-pointer ${
                      userAvatar === av
                        ? 'bg-amber-100 ring-2 ring-amber-500 scale-105 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* iOS / Browser Webview Helper Banner */}
        {roomParam && !isStandalone && (
          <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-300 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Have LabasApp on your Home Screen?
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  Copy duel code <span className="font-mono font-black text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200">{roomParam}</span> and open your home screen app to play!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(roomParam);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2500);
                sounds.playClick();
              }}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{isCopied ? 'Copied! ✓' : 'Copy Code'}</span>
            </button>
          </div>
        )}

        {/* Segmented Top Controller */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl max-w-md mx-auto w-full shadow-2xs">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setArenaTab('rivals');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              arenaTab === 'rivals'
                ? 'bg-white text-violet-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className={`w-4 h-4 ${arenaTab === 'rivals' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span>AI Rivals</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setArenaTab('friends');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              arenaTab === 'friends'
                ? 'bg-white text-emerald-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className={`w-4 h-4 ${arenaTab === 'friends' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Friends & Codes</span>
            {room && room.status === 'waiting' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
        </div>

        {/* TAB 1: AI RIVALS ROSTER LIST */}
        {arenaTab === 'rivals' && (
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  AI Rivals Roster
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Instant practice against virtual opponents from around Lithuania.
                </p>
              </div>
              <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                Instant Play
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {AI_RIVALS.map((rival) => {
                const difficultyBadge =
                  rival.difficulty === 'easy'
                    ? { label: 'Beginner', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    : rival.difficulty === 'medium'
                    ? { label: 'Intermediate', style: 'bg-amber-50 text-amber-700 border-amber-200' }
                    : { label: 'Expert', style: 'bg-rose-50 text-rose-700 border-rose-200' };

                return (
                  <div
                    key={rival.id}
                    className="h-[72px] rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-violet-300 p-3 flex items-center justify-between gap-3 transition-all hover:bg-violet-50/30"
                  >
                    {/* Left: Animal avatar (w-11 h-11) with subtle ring */}
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-2xl shrink-0 ring-2 ring-violet-100">
                      {rival.avatar}
                    </div>

                    {/* Middle: Bot Name + City tag + Difficulty badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {rival.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {rival.city}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyBadge.style}`}>
                          {difficultyBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {rival.tagline}
                      </p>
                    </div>

                    {/* Right: Compact tactile button 'Challenge' */}
                    <button
                      type="button"
                      onClick={() => handleStartAIBattle(rival)}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm active:translate-y-0.5 transition cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Challenge</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FRIENDS & CODES */}
        {arenaTab === 'friends' && (
          <div className="flex flex-col gap-4">
            {/* Active Created Room Banner (Waiting for Friend) */}
            {room && room.status === 'waiting' && (
              <div className="rounded-3xl bg-white border-4 border-amber-300 p-6 shadow-md flex flex-col gap-4 animate-in zoom-in-95">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Room Ready • Waiting for Friend
                    </span>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-wider">
                        {room.id}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Copy duel code"
                      >
                        {isCopied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Share this code or direct link with your friend to begin the duel.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        sounds.playClick();
                        const success = await sendDuelInviteNotification(userName || 'Friend', room.id);
                        if (success) {
                          haptics.success();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition cursor-pointer text-xs"
                      title="Test challenge notification on this device"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Test Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareInvite}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md transition cursor-pointer text-xs"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{isCopied ? 'Link Copied!' : 'Share Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Players Joined Status */}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                    Joined Players ({playersList.length} / 2):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {playersList.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.avatar}</span>
                          <div>
                            <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isHost && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md font-bold border border-amber-200">
                                  Host
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-bold">
                              Ready for battle
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    ))}

                    {playersList.length < 2 && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50 border-2 border-dashed border-amber-300 text-amber-800 animate-pulse">
                        <span className="text-2xl animate-spin">⏳</span>
                        <div>
                          <div className="text-xs font-bold">Waiting for friend to connect...</div>
                          <span className="text-[11px] text-amber-700">Code: {room.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Button */}
                {canStart ? (
                  <button
                    type="button"
                    onClick={handleStartHostGame}
                    className="btn-tactile w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg animate-bounce flex items-center justify-center gap-2 cursor-pointer border-b-4 border-emerald-800 active:border-b-0"
                  >
                    <span className="text-base uppercase tracking-wider">Start Battle ⚔️</span>
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-500 font-medium py-1">
                    The battle will start once your friend enters the room.
                  </div>
                )}
              </div>
            )}

            {/* Action Panels: Create & Join */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Room Card */}
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-600">
                      <Crown className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-800 leading-tight">
                        Create Room
                      </h3>
                      <span className="text-[11px] font-bold text-amber-700 block">
                        Host a duel with a friend
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Generate a private room code and invite your friend via WhatsApp, Messenger, or SMS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  className="btn-tactile flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 border-b-4 border-amber-700 active:border-b-0 text-slate-950 font-black shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">
                    {isCreatingRoom ? 'Creating Room...' : 'Create Duel'}
                  </span>
                </button>
              </div>

              {/* Join Room Card */}
              <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="p-2 rounded-xl bg-sky-100 text-sky-600">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-800 leading-tight">
                        Join Room
                      </h3>
                      <span className="text-[11px] font-bold text-sky-700 block">
                        Enter your friend&apos;s code
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Received a 6-character room code from a friend? Enter it below to join the match.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. VYT-482"
                      maxLength={8}
                      className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-base font-black text-slate-800 uppercase tracking-widest focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    className="px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                    title="Paste code from clipboard"
                  >
                    <Clipboard className="h-4 w-4 text-sky-600" />
                    <span className="hidden sm:inline">Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleJoinRoom}
                    disabled={isJoiningRoom || !joinCodeInput.trim()}
                    className="btn-tactile px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 border-b-4 border-sky-700 active:border-b-0 text-white font-black shadow-md disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <span>{isJoiningRoom ? 'Joining...' : 'Join'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: IN-GAME BATTLE ARENA
  // --------------------------------------------------------------------------
  if (view === 'in_game' && room) {
    const currentQ = room.questions[room.currentRound];
    const playersList = Object.values(room.players);

    // Player 1 (You): Strictly binds to currentUser
    const myPlayer =
      room.players[myPlayerId] ||
      playersList.find((p) => !p.isBot) ||
      playersList[0];

    // Player 2 (Opponent): Strictly binds to rivalData / opponent
    const botPlayer = playersList.find((p) => p.isBot);
    const opponentPlayer: BattlePlayer =
      botPlayer ||
      playersList.find((p) => p.id !== myPlayer?.id) || {
        id: activeRival?.id || 'opponent',
        name: activeRival?.name || 'Varžovas',
        avatar: activeRival?.avatar || '🦁',
        city: activeRival?.city || '',
        score: 0,
        streak: 0,
        maxStreak: 0,
        answers: {},
        isReady: true,
        isHost: false,
        isBot: true,
      };

    const opponentName = opponentPlayer.name || (activeRival ? activeRival.name : 'Varžovas');
    const opponentAvatar = opponentPlayer.avatar || activeRival?.avatar || '🦁';
    const opponentCity = opponentPlayer.city || activeRival?.city || '';

    const myAnswer = myPlayer?.answers[room.currentRound];
    const opponentAnswer = opponentPlayer.answers[room.currentRound];

    const timerPercent = Math.max(0, Math.min(100, (timeLeft / 15) * 100));

    return (
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Matchup Scoreboard Bar */}
        <div className="rounded-3xl bg-white border-2 border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
          {/* Player 1 (You) */}
          <div className="flex items-center gap-3">
            <span className="text-3xl md:text-4xl">{myPlayer?.avatar || userAvatar}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs md:text-sm font-black text-slate-800 truncate max-w-[100px] md:max-w-[130px]">
                  {myPlayer?.name || userName}
                </span>
                {myPlayer?.streak > 1 && (
                  <span className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.2 rounded-md">
                    <Flame className="h-3 w-3 fill-amber-500" />
                    {myPlayer.streak}x
                  </span>
                )}
              </div>
              <span className="text-lg md:text-xl font-black text-emerald-600">
                {myPlayer?.score || 0} pts
              </span>
            </div>
          </div>

          {/* Center VS Indicator & Round */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Raundas {room.currentRound + 1} / {room.questions.length}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-xs shadow-md mt-0.5">
              VS
            </div>
          </div>

          {/* Player 2 (Opponent) */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="flex items-center justify-end gap-1.5">
                {opponentPlayer.streak > 1 && (
                  <span className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.2 rounded-md">
                    <Flame className="h-3 w-3 fill-amber-500" />
                    {opponentPlayer.streak}x
                  </span>
                )}
                <span className="text-xs md:text-sm font-black text-slate-800 truncate max-w-[100px] md:max-w-[130px]">
                  {opponentName}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {opponentCity && (
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
                    {opponentCity} •
                  </span>
                )}
                <span className="text-lg md:text-xl font-black text-violet-600">
                  {opponentPlayer.score || 0} pts
                </span>
              </div>
            </div>
            <span className="text-3xl md:text-4xl">{opponentAvatar}</span>
          </div>
        </div>

        {/* 15-Second Timer Bar */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 4
                  ? 'bg-rose-500'
                  : timeLeft <= 8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
          <span
            className={`text-xs font-black shrink-0 px-2 py-0.5 rounded-md ${
              timeLeft <= 4 ? 'text-rose-600 bg-rose-50 animate-pulse' : 'text-slate-600'
            }`}
          >
            ⏱️ {timeLeft}s
          </span>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {currentQ.category}
              </span>
              <button
                onClick={() => handlePlayAudio(currentQ.audioText)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Klausytis tarimo"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Garsas</span>
              </button>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                {currentQ.prompt}
              </h2>
              {/* English Subtitle Banner */}
              {currentQ.englishSubtitle && (
                <div className="mt-2 p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    English Subtitle:
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-emerald-950 italic">
                    {currentQ.englishSubtitle}
                  </p>
                </div>
              )}
              {currentQ.subPrompt && (
                <p className="text-xs text-slate-500 font-medium mt-1.5">
                  {currentQ.subPrompt}
                </p>
              )}
            </div>

            {/* 4 Interactive Answer Options with English Subtitles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const optLt = typeof opt === 'string' ? opt : opt.lt;
                const optEn = typeof opt === 'string' ? '' : opt.en;
                const isSelected = selectedOption === optLt;
                const isCorrect = optLt === currentQ.correctAnswer;
                const showResults = hasAnsweredCurrentRound;

                let btnStyle = 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 text-slate-800';

                if (showResults) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-black ring-2 ring-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-200';
                  } else {
                    btnStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(optLt)}
                    disabled={hasAnsweredCurrentRound}
                    className={`p-4 rounded-2xl border-2 text-left font-bold text-sm md:text-base transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm md:text-base font-black text-slate-900 leading-snug">
                        {optLt}
                      </span>
                      {optEn && (
                        <span
                          className={`text-xs font-semibold italic mt-0.5 leading-snug ${
                            showResults && isCorrect ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {optEn}
                        </span>
                      )}
                    </div>
                    {showResults && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    )}
                    {showResults && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation / Result banner after answer */}
            {hasAnsweredCurrentRound && (
              <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-black text-slate-900 mb-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Explanation:</span>
                </div>
                <p className="font-medium">{currentQ.explanation}</p>
                {opponentAnswer ? (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                    <span>{opponentName}:</span>
                    <span className={opponentAnswer.correct ? 'text-emerald-600' : 'text-rose-600'}>
                      {opponentAnswer.correct ? 'Correct!' : 'Incorrect!'} (+{opponentAnswer.points} pts)
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-bold text-amber-700 flex items-center gap-2 animate-pulse">
                    <span className="text-sm">⏳</span>
                    <span>Waiting for opponent to answer...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transition indicator */}
        {(roundTransitioning || roundStatus === 'round_complete') && (
          <div className="text-center text-xs font-black text-amber-700 animate-pulse bg-amber-50 border border-amber-200 py-2.5 px-4 rounded-2xl shadow-2xs flex items-center justify-center gap-2">
            <span>✨</span>
            <span>Round Complete! Advancing to next round...</span>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: RESULTS SCREEN
  // --------------------------------------------------------------------------
  if (view === 'results' && room) {
    const rawPlayersList = Object.values(room.players);
    const myPlayer =
      room.players[myPlayerId] ||
      rawPlayersList.find((p) => p.id === myPlayerId) ||
      rawPlayersList.find((p) => !p.isBot && !p.id.startsWith('bot-')) ||
      rawPlayersList[0];

    const botPlayer = rawPlayersList.find((p) => p.isBot || p.id.startsWith('bot-'));
    const opponentPlayer = botPlayer || rawPlayersList.find((p) => p.id !== myPlayer?.id);

    const playersList = rawPlayersList.map((player) => {
      const isMe = player.id === myPlayer?.id || player.id === myPlayerId;
      if (isMe) {
        return {
          ...player,
          name: player.name || userName || 'Lietuvis',
          avatar: player.avatar || userAvatar || '🦊',
        };
      }

      // Opponent / Bot resolution: if marked isBot or is the opponent, resolve display name and avatar through activeRival / opponentPlayer fallbacks
      const isBot = player.isBot || player.id.startsWith('bot-');
      const fallbackName = isBot
        ? (activeRival?.name || 'Mantas')
        : (activeRival?.name || opponentPlayer?.name || 'Varžovas');
      const fallbackAvatar = isBot
        ? (activeRival?.avatar || '🐺')
        : (activeRival?.avatar || opponentPlayer?.avatar || '🦁');

      const resolvedName =
        player.name && player.name !== 'Lietuvis'
          ? player.name
          : fallbackName;

      const resolvedAvatar =
        player.avatar && player.avatar !== '🦊'
          ? player.avatar
          : fallbackAvatar;

      return {
        ...player,
        name: resolvedName,
        avatar: resolvedAvatar,
      };
    });

    playersList.sort((a, b) => b.score - a.score);

    const winner = playersList[0];
    const isTie = playersList.length >= 2 && playersList[0].score === playersList[1].score;
    const isUserWinner = !isTie && (winner?.id === myPlayer?.id || winner?.id === myPlayerId);

    return (
      <div className="flex-1 max-w-xl w-full mx-auto p-4 md:p-8 flex flex-col items-center gap-6 animate-in zoom-in-95">
        {/* Victory Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-xl ring-4 ring-amber-200 animate-bounce">
            {isTie ? '🤝' : isUserWinner ? '🏆' : '🥈'}
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Match Ended
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
              {isTie
                ? "It's a draw! Incredible match!"
                : isUserWinner
                ? 'Victory! You won the battle!'
                : `${winner?.name} won this round!`}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Great practice! Both players sharpened their Lithuanian skills.
            </p>
          </div>
        </div>

        {/* Final Scoreboard Comparison */}
        <div className="w-full rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Final Scores
            </span>
            <span className="text-xs font-bold text-amber-600">5 Rounds</span>
          </div>

          <div className="space-y-3">
            {playersList.map((player, rank) => {
              const isMe = player.id === myPlayer?.id || player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                    rank === 0
                      ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-400">#{rank + 1}</span>
                    <span className="text-3xl">{player.avatar}</span>
                    <div>
                      <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {isMe && (
                          <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded-md font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Max streak: {player.maxStreak || player.streak || 0}x 🔥
                      </span>
                    </div>
                  </div>

                  <span className="text-xl font-black text-slate-900">
                    {player.score} pts
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rewards Earned */}
          <div className="flex items-center justify-around p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-center">
            <div>
              <span className="text-base font-black text-emerald-800">+30 XP</span>
              <span className="block text-[10px] text-emerald-600 font-bold">Experience</span>
            </div>
            <div className="h-6 w-px bg-emerald-200" />
            <div>
              <span className="text-base font-black text-amber-600">+15 💎</span>
              <span className="block text-[10px] text-amber-700 font-bold">Gems</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRematch}
            className="btn-3d flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Rematch</span>
          </button>

          <button
            onClick={() => {
              setView('lobby');
              setRoom(null);
            }}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition text-center"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function BattlePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-400">Kraunama Dvikovos Arena...</div>}>
      <BattleArenaContent />
    </Suspense>
  );
}
