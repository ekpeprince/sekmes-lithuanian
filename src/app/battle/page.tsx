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
} from 'lucide-react';
import { sounds } from '@/lib/audio';
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
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(roomParam || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-Game state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnsweredCurrentRound, setHasAnsweredCurrentRound] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [roundTransitioning, setRoundTransitioning] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  const myPlayerId = user?.uid || 'guest-user-1';

  // Sync user profile from auth
  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName);
    }
  }, [user]);

  // Auto-fill room code if ?room= query param is provided
  useEffect(() => {
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
    }
  }, [roomParam]);

  // Subscribe to room updates
  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = subscribeToBattleRoom(room.id, (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'in_progress' && view === 'lobby') {
        setView('in_game');
        setRoundStartTime(Date.now());
        setTimeLeft(15);
        setSelectedOption(null);
        setHasAnsweredCurrentRound(false);
      } else if (updatedRoom.status === 'finished' && view === 'in_game') {
        setView('results');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [room?.id, view]);

  // 15-second round countdown timer
  useEffect(() => {
    if (view !== 'in_game' || !room || room.status !== 'in_progress') return;

    setTimeLeft(15);
    setRoundStartTime(Date.now());
    setSelectedOption(null);
    setHasAnsweredCurrentRound(false);
    setRoundTransitioning(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.currentRound, view]);

  // AI Rival automated response simulation
  useEffect(() => {
    if (view !== 'in_game' || !room || room.status !== 'in_progress') return;

    const botPlayer = Object.values(room.players).find((p) => p.isBot);
    if (!botPlayer) return;

    const botAlreadyAnswered = Boolean(botPlayer.answers[room.currentRound]);
    if (botAlreadyAnswered) return;

    const currentQ = room.questions[room.currentRound];
    if (!currentQ) return;

    // Simulate bot thinking delay
    const delay = Math.floor(2500 + Math.random() * 3500);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(async () => {
      // 85% chance bot chooses correctly
      const willBeCorrect = Math.random() < 0.85;
      const botAnswer = willBeCorrect
        ? currentQ.correctAnswer
        : currentQ.options.find((o) => o !== currentQ.correctAnswer) || currentQ.options[0];

      const updated = await submitAnswer(
        room.id,
        botPlayer.id,
        room.currentRound,
        botAnswer,
        currentQ.correctAnswer,
        delay
      );
      if (updated) setRoom(updated);
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [room?.currentRound, view]);

  // Handle when timer hits 0
  const handleTimeExpired = async () => {
    if (!room || hasAnsweredCurrentRound) return;
    const currentQ = room.questions[room.currentRound];
    if (!currentQ) return;

    setHasAnsweredCurrentRound(true);
    setSelectedOption('');
    sounds.playError();

    await submitAnswer(room.id, myPlayerId, room.currentRound, '', currentQ.correctAnswer, 15000);
    checkAdvanceRound();
  };

  // Submit player's answer
  const handleSelectOption = async (option: string) => {
    if (hasAnsweredCurrentRound || !room) return;

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

    const updated = await submitAnswer(
      room.id,
      myPlayerId,
      room.currentRound,
      option,
      currentQ.correctAnswer,
      elapsedMs
    );
    if (updated) setRoom(updated);

    checkAdvanceRound();
  };

  // Auto-advance round after both have answered or delay
  const checkAdvanceRound = () => {
    setRoundTransitioning(true);
    setTimeout(async () => {
      if (!room) return;
      const nextRound = room.currentRound + 1;
      const updated = await advanceRound(room.id, nextRound);
      if (updated) {
        setRoom(updated);
        if (nextRound >= updated.questions.length) {
          setView('results');
        }
      }
    }, 2500);
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
    const newRoom = createAIBattleRoom(
      { id: myPlayerId, name: userName, avatar: userAvatar },
      rival
    );
    setRoom(newRoom);
    setView('in_game');
  };

  // Join friend's room with code
  const handleJoinRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Įveskite 6 simbolių kambario kodą.');
      return;
    }

    try {
      setIsJoiningRoom(true);
      setErrorMessage(null);
      const joined = await joinBattleRoom(code, {
        id: myPlayerId,
        name: userName,
        avatar: userAvatar,
      });

      if (!joined) {
        setErrorMessage(`Kambarys „${code}“ nerastas. Patikrinkite kodą!`);
        return;
      }

      setRoom(joined);
      sounds.playClick();
      if (joined.status === 'in_progress') {
        setView('in_game');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setErrorMessage('Nepavyko prisijungti prie kambario.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Start game when both players are in lobby
  const handleStartHostGame = async () => {
    if (!room) return;
    sounds.playClick();
    await startBattle(room.id);
    setView('in_game');
  };

  // Share room invite
  const handleShareInvite = () => {
    if (!room) return;
    const shareUrl = `${window.location.origin}/battle?room=${room.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Sėkmės! – Lietuvių kalbos dvikova',
        text: `Kviečiu tave į lietuvių kalbos dvikovą! Ar įveiksi mane? Prisijunk su kodu: ${room.id}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
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
    const otherPlayer = Object.values(room.players).find((p) => p.id !== myPlayerId);
    if (otherPlayer?.isBot) {
      const botRival = AI_RIVALS.find((r) => r.id === otherPlayer.id) || AI_RIVALS[0];
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-xl">
                  ⚔️
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                  Dvikovos Arena • Multiplayer Duel
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                Kovok su draugais lietuviškai!
              </h1>
              <p className="text-xs md:text-sm text-white/90 font-medium max-w-xl mt-1">
                5 greiti raundai: žodžiai, frazės ir gramatika. Kas atsakys greičiau ir surinks daugiausiai taškų?
              </p>
            </div>

            {/* Quick User Customization Card */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-start md:self-auto">
              <span className="text-3xl">{userAvatar}</span>
              <div>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Tavo vardas..."
                  className="bg-transparent border-b border-white/40 text-white font-bold text-sm focus:outline-none focus:border-white w-28 md:w-36"
                />
                <span className="block text-[10px] text-white/70 font-semibold mt-0.5">
                  Tavo kovos vardas
                </span>
              </div>
              {/* Avatar Selector Dropdown / Row */}
              <div className="flex gap-1 overflow-x-auto max-w-[100px]">
                {AVATARS.slice(0, 4).map((av) => (
                  <button
                    key={av}
                    onClick={() => setUserAvatar(av)}
                    className={`p-1 rounded-lg text-sm transition ${
                      userAvatar === av ? 'bg-white/30 scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Active Created Room Banner (Waiting for Friend) */}
        {room && room.status === 'waiting' && (
          <div className="rounded-3xl bg-white border-4 border-amber-300 p-6 shadow-md flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Kambarys Paruoštas • Room Code
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-wider">
                    {room.id}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="Kopijuoti kodą"
                  >
                    {isCopied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Nusiųskite šį kodą draugui arba pasidalinkite tiesiogine nuoroda!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareInvite}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{isCopied ? 'Nuoroda nukopijuota!' : 'Dalintis nuoroda'}</span>
                </button>
              </div>
            </div>

            {/* Players Joined Status */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                Prisijungę žaidėjai ({playersList.length} / 2):
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
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md font-bold">
                              Kūrėjas
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold">Pasiruošęs kovai</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                ))}

                {playersList.length < 2 && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50 border-2 border-dashed border-amber-300 text-amber-800 animate-pulse">
                    <span className="text-2xl animate-spin">⏳</span>
                    <div>
                      <div className="text-xs font-bold">Laukiama draugo prisijungimo...</div>
                      <span className="text-[11px] text-amber-600">Nuoroda išsiųsta?</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Start Button */}
            {canStart ? (
              <button
                onClick={handleStartHostGame}
                className="btn-3d w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg animate-bounce"
              >
                Pradėti kovą! • Start Battle ⚔️
              </button>
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium py-1">
                Kova prasidės, kai draugas prisijungs prie kambario.
              </div>
            )}
          </div>
        )}

        {/* Action Panels: Create, Join, or Battle AI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Room Card */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Crown className="h-5 w-5" />
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Sukurti kambarį draugui
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Sukurkite privatų kambarį, gaukite 6 simbolių kodą ir pakvieskite draugą per WhatsApp, Messenger ar SMS.
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              className="btn-3d flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isCreatingRoom ? 'Kuriamas kambarys...' : 'Sukurti naują dvikovą ⚔️'}</span>
            </button>
          </div>

          {/* Join Room Card */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-600">
                  <Users className="h-5 w-5" />
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Prisijungti su draugo kodu
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Gavote kambario kodą iš draugo? Įveskite jį čia ir pradėkite kovą!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="pvz.: VYT-482"
                maxLength={8}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-800 uppercase tracking-widest focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={handleJoinRoom}
                disabled={isJoiningRoom || !joinCodeInput.trim()}
                className="btn-3d px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
              >
                {isJoiningRoom ? 'Jungiamasi...' : 'Jungtis!'}
              </button>
            </div>
          </div>
        </div>

        {/* Instant AI Rivals Section */}
        <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-violet-100 text-violet-600 text-lg">
                ⚡
              </span>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Momentinė Dvikova su Rivalu • Practice vs AI
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Nėra draugų internete dabar? Išbandykite jėgas prieš virtualius Lietuvos varžovus!
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
              Momentinis startas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AI_RIVALS.map((rival) => (
              <div
                key={rival.id}
                className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between gap-3 hover:border-violet-300 transition-all hover:shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{rival.avatar}</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-1">
                      <span>{rival.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">({rival.city})</span>
                    </h4>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                        rival.difficulty === 'easy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rival.difficulty === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rival.difficulty === 'easy' ? 'Pradedantysis' : rival.difficulty === 'medium' ? 'Pažengęs' : 'Ekspertas'}
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                      {rival.tagline}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartAIBattle(rival)}
                  className="btn-3d w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Kovoti su {rival.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: IN-GAME BATTLE ARENA
  // --------------------------------------------------------------------------
  if (view === 'in_game' && room) {
    const currentQ = room.questions[room.currentRound];
    const playersList = Object.values(room.players);
    const myPlayer = room.players[myPlayerId] || playersList[0];
    const opponentPlayer = playersList.find((p) => p.id !== myPlayerId) || playersList[1];

    const myAnswer = myPlayer?.answers[room.currentRound];
    const opponentAnswer = opponentPlayer?.answers[room.currentRound];

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
                {opponentPlayer?.streak > 1 && (
                  <span className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.2 rounded-md">
                    <Flame className="h-3 w-3 fill-amber-500" />
                    {opponentPlayer.streak}x
                  </span>
                )}
                <span className="text-xs md:text-sm font-black text-slate-800 truncate max-w-[100px] md:max-w-[130px]">
                  {opponentPlayer?.name || 'Varžovas'}
                </span>
              </div>
              <span className="text-lg md:text-xl font-black text-violet-600">
                {opponentPlayer?.score || 0} pts
              </span>
            </div>
            <span className="text-3xl md:text-4xl">{opponentPlayer?.avatar || '🦁'}</span>
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
              {currentQ.subPrompt && (
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {currentQ.subPrompt}
                </p>
              )}
            </div>

            {/* 4 Interactive Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;
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
                    onClick={() => handleSelectOption(opt)}
                    disabled={hasAnsweredCurrentRound}
                    className={`p-4 rounded-2xl border-2 text-left font-bold text-sm md:text-base transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <span>{opt}</span>
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
                  <span>Paaiškinimas • Explanation:</span>
                </div>
                <p className="font-medium">{currentQ.explanation}</p>
                {opponentAnswer && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-500 flex items-center gap-2">
                    <span>{opponentPlayer?.name}:</span>
                    <span className={opponentAnswer.correct ? 'text-emerald-600' : 'text-rose-600'}>
                      {opponentAnswer.correct ? 'Atsakė teisingai! (Correct)' : 'Suklydo! (Wrong)'} (+{opponentAnswer.points} pts)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transition indicator */}
        {roundTransitioning && (
          <div className="text-center text-xs font-black text-amber-600 animate-pulse">
            Ruošiamas kitas raundas... Next round coming up!
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: RESULTS SCREEN
  // --------------------------------------------------------------------------
  if (view === 'results' && room) {
    const playersList = Object.values(room.players);
    playersList.sort((a, b) => b.score - a.score);

    const winner = playersList[0];
    const isUserWinner = winner?.id === myPlayerId;
    const isTie = playersList.length >= 2 && playersList[0].score === playersList[1].score;

    return (
      <div className="flex-1 max-w-xl w-full mx-auto p-4 md:p-8 flex flex-col items-center gap-6 animate-in zoom-in-95">
        {/* Victory Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-xl ring-4 ring-amber-200 animate-bounce">
            {isTie ? '🤝' : isUserWinner ? '🏆' : '🥈'}
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Dvikova Baigta • Match Ended
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
              {isTie
                ? 'Lygiosios! Neįtikėtina kova!'
                : isUserWinner
                ? 'Pergalė! Tu nugalėjai dvikovoje!'
                : `${winner?.name} laimėjo šį kartą!`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Puiki treniruotė! Abu žaidėjai patobulino lietuvių kalbos žinias.
            </p>
          </div>
        </div>

        {/* Final Scoreboard Comparison */}
        <div className="w-full rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Galutiniai Taškai:
            </span>
            <span className="text-xs font-bold text-amber-600">5 Raundai</span>
          </div>

          <div className="space-y-3">
            {playersList.map((player, rank) => {
              const isMe = player.id === myPlayerId;
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
                            Tu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Daugiausiai serija: {player.streak}x 🔥
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
              <span className="block text-[10px] text-emerald-600 font-bold">Patirtis</span>
            </div>
            <div className="h-6 w-px bg-emerald-200" />
            <div>
              <span className="text-base font-black text-amber-600">+15 💎</span>
              <span className="block text-[10px] text-amber-700 font-bold">Brangakmeniai</span>
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
            <span>Žaisti Revanšą! • Rematch</span>
          </button>

          <button
            onClick={() => {
              setView('lobby');
              setRoom(null);
            }}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition text-center"
          >
            Grįžti į Lobi • Lobby
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
