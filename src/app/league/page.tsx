'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Zap,
  Crown,
  ChevronUp,
  ChevronDown,
  Clock,
  ArrowRight,
  Award,
  Info,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { LEAGUE_TIERS, LeagueTier, getLeagueTimeRemaining, getWeeklyCohort, Competitor } from '@/lib/league';
import { syncUserToLeaderboard, fetchRealLeaderboardMembers } from '@/lib/leagueSync';
import { LeagueBattleModal } from '@/components/LeagueBattleModal';
import { RealtimeBattleModal } from '@/components/RealtimeBattleModal';

function LeagueContent() {
  const { progress } = useGame();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const battleParam = searchParams.get('battle');
  const roomIdParam = searchParams.get('roomId');
  const isGuestInvite = (battleParam === 'room' || !!roomIdParam) && !!roomIdParam;

  const userAssignedTier: LeagueTier = progress.leagueTier || 'Geležis';
  const [activeTier, setActiveTier] = useState<LeagueTier>(userAssignedTier);
  const [realMembers, setRealMembers] = useState<Competitor[]>([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [isBattleOpen, setIsBattleOpen] = useState(() => battleParam === 'invite');
  const [realtimeRoomId, setRealtimeRoomId] = useState<string | null>(() => {
    if (isGuestInvite && roomIdParam) {
      return roomIdParam.trim().replace(/^#+/, '').toUpperCase();
    }
    return null;
  });
  const [isRealtimeHost, setIsRealtimeHost] = useState(() => {
    if (isGuestInvite && roomIdParam) {
      const cleanId = roomIdParam.trim().replace(/^#+/, '').toUpperCase();
      return typeof window !== 'undefined' && localStorage.getItem(`battle_host_${cleanId}`) === 'true';
    }
    return true;
  });
  const [isRealtimeBattleOpen, setIsRealtimeBattleOpen] = useState(() => {
    if (battleParam === 'room') return true;
    if (isGuestInvite && roomIdParam) return true;
    return false;
  });
  const [timeInfo, setTimeInfo] = useState(() => getLeagueTimeRemaining());

  const handleStartRealtimeBattle = () => {
    setRealtimeRoomId(null);
    setIsRealtimeHost(true);
    setIsRealtimeBattleOpen(true);
  };

  // Periodically refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getLeagueTimeRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync logged-in user to Firestore
  useEffect(() => {
    if (user?.uid) {
      syncUserToLeaderboard(
        user.uid,
        { displayName: user.displayName, photoURL: user.photoURL },
        userAssignedTier,
        progress.xp,
        progress.streak
      );
    }
  }, [user, userAssignedTier, progress.xp, progress.streak]);

  // Fetch real users from Firestore for the active tier
  useEffect(() => {
    let isMounted = true;
    fetchRealLeaderboardMembers(activeTier).then((members) => {
      if (isMounted && members.length > 0) {
        setRealMembers(members);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTier]);

  const activeTierConfig = LEAGUE_TIERS[activeTier] || LEAGUE_TIERS.Geležis;
  const isViewingUserTier = activeTier === userAssignedTier;

  // Generate deterministic weekly cohort for the selected tier and merge into unified list
  const unifiedList = useMemo(() => {
    const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)');
    const cohort = getWeeklyCohort(activeTier, isViewingUserTier ? progress.xp : -1, {
      name: userName,
      photoURL: user?.photoURL || undefined,
      streak: progress.streak,
    });

    let list: Competitor[];
    // If real Firestore members exist, merge them
    if (realMembers.length > 0) {
      const mergedMap = new Map<string, Competitor>();
      realMembers.forEach((m) => mergedMap.set(m.name, m));
      cohort.forEach((c) => {
        if (!mergedMap.has(c.name)) {
          mergedMap.set(c.name, c);
        }
      });
      list = Array.from(mergedMap.values());
    } else {
      list = [...cohort];
    }

    // Ensure the current user has isCurrentUser flag
    list = list.map((c) => {
      const isCurrent =
        c.isCurrentUser ||
        c.isUser ||
        Boolean(user?.uid && c.id === `firestore_${user.uid}`) ||
        Boolean(user?.displayName && c.name === user.displayName) ||
        Boolean(user?.email && c.name === user.email.split('@')[0]);
      return isCurrent ? { ...c, isUser: true, isCurrentUser: true } : c;
    });

    // Complete player roster unified into a single sorted array descending by XP
    list.sort((a, b) => b.xp - a.xp);

    return list.slice(0, 30).map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [activeTier, isViewingUserTier, progress.xp, progress.streak, user, realMembers]);

  // Calculate userRank dynamically
  const userRank = unifiedList.findIndex((p) => p.isCurrentUser) + 1 || 4;
  const currentUser = unifiedList.find((p) => p.isCurrentUser) || {
    id: 'user_active',
    name: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Tu (You)'),
    city: 'Lietuva',
    flag: '🇱🇹',
    avatarColor: 'from-amber-400 to-orange-500',
    initials: 'TU',
    streak: Math.max(1, progress.streak || 1),
    xp: progress.xp,
    isUser: true,
    isCurrentUser: true,
    rank: userRank,
  };

  const isUserInTop3 = isViewingUserTier && userRank <= 3;
  const thirdPlacePlayer = unifiedList[2];
  const xpToTop3 = isUserInTop3 ? 0 : Math.max(0, (thirdPlacePlayer?.xp || 0) - currentUser.xp + 1);

  const top3 = unifiedList.slice(0, 3);
  // Start the list directly from Rank 4 so Top 3 are NOT duplicated in the list
  const listCompetitors = unifiedList.slice(3);

  const formatPodiumName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return fullName;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-36 md:pb-24">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-slate-200 px-4 py-5 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${activeTierConfig.bgGradient} text-white shadow-md text-2xl sm:text-3xl shrink-0`}
              >
                {activeTierConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800">
                    {activeTierConfig.englishName}
                  </h1>
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    {activeTierConfig.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {activeTierConfig.englishDescription}
                </p>
              </div>
            </div>

            {/* Time & Rewards Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setShowRewardsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Award className="h-4 w-4 text-amber-600" />
                <span>Prizes ({activeTierConfig.rewards.first} 💎)</span>
              </button>

              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>{timeInfo.englishFormatted} left</span>
              </div>
            </div>
          </div>

          {/* Tier Division Navigation Carousel */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(LEAGUE_TIERS) as LeagueTier[]).map((tierKey) => {
              const tier = LEAGUE_TIERS[tierKey];
              const isSelected = tierKey === activeTier;
              const isUserCurrent = tierKey === userAssignedTier;

              return (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all border-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{tier.icon}</span>
                  <span>{tier.englishName}</span>
                  {isUserCurrent && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      You
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-5">
        {/* Banner if viewing another division */}
        {!isViewingUserTier && (
          <div className="mb-5 bg-sky-50 border-2 border-sky-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-sky-600 shrink-0" />
              <div>
                <span className="font-bold text-sky-900 block">
                  Viewing {activeTierConfig.englishName}
                </span>
                <span className="text-sky-700 font-medium">
                  Your current division is <strong>{LEAGUE_TIERS[userAssignedTier].englishName}</strong>. Complete lessons to advance!
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTier(userAssignedTier)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shrink-0 shadow-2xs"
            >
              Back to your league
            </button>
          </div>
        )}

        {/* Dynamic User Rank Summary Card */}
        {isViewingUserTier && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 sm:p-3.5 mb-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 text-lg shrink-0">
                {activeTierConfig.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-black text-slate-800">{activeTierConfig.englishName}</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {timeInfo.englishFormatted} left
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  Rank #{userRank} • {currentUser.xp} XP
                </p>
              </div>
            </div>

            {/* XP Goal Pill with Dynamic Rank */}
            <div className="flex items-center gap-2 self-stretch sm:self-center justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 shrink-0">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>
                  {activeTier === 'Deimantas'
                    ? (isUserInTop3 ? '🏆 Diamond Championship Zone' : `⚡ ${xpToTop3} XP to reach Podium`)
                    : (isUserInTop3 ? '⚡ Top 3 Promotion Zone' : `⚡ ${xpToTop3} XP to reach Top 3`)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1v1 Battle Banner */}
        <div className="h-14 min-h-[56px] rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3.5 sm:px-4 flex items-center justify-between gap-3 text-amber-950 mb-6 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-base shrink-0">
              ⚔️
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-amber-950 leading-tight truncate">
                1v1 Speed Battle
              </h4>
              <p className="text-[11px] text-amber-900/80 font-medium truncate hidden sm:block">
                Live multiplayer &amp; friend challenges
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStartRealtimeBattle}
              className="btn-tactile btn-tactile-amber px-4 py-1.5 text-xs font-bold rounded-xl shadow-2xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
            >
              <span>PLAY ⚔️</span>
            </button>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <section className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Top 3 Podium
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-lg mx-auto">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  {top3[1].photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={top3[1].photoURL} alt={top3[1].name} className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover shadow-sm ring-2 ring-slate-300" />
                  ) : (
                    <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br ${top3[1].avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm ring-2 ring-slate-300`}>
                      {top3[1].initials}
                    </div>
                  )}
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-slate-300">
                    2
                  </span>
                </div>
                <div className="w-full bg-slate-100/90 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 text-center shadow-xs flex flex-col items-center">
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 text-center leading-tight whitespace-nowrap">
                    {formatPodiumName(top3[1].name)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[1].flag}</span>
                    <span>{top3[1].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-0.5 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{top3[1].xp} XP</span>
                  </div>
                  <div className="mt-2 h-10 sm:h-12 w-full bg-gradient-to-t from-slate-200 to-slate-100/60 rounded-xl flex items-center justify-center font-black text-slate-600 text-base sm:text-lg">
                    🥈
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Center & Slightly Elevated) */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Crown className="h-4 w-4 text-amber-500 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2" />
                  {top3[0].photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={top3[0].photoURL} alt={top3[0].name} className="h-13 w-13 sm:h-14 sm:w-14 rounded-full object-cover shadow-md ring-2 ring-amber-400" />
                  ) : (
                    <div className={`h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br ${top3[0].avatarColor} text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md ring-2 ring-amber-400`}>
                      {top3[0].initials}
                    </div>
                  )}
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-500">
                    1
                  </span>
                </div>
                <div className="w-full bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-2.5 sm:p-3 text-center shadow-md flex flex-col items-center">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 text-center leading-tight whitespace-nowrap">
                    {formatPodiumName(top3[0].name)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[0].flag}</span>
                    <span>{top3[0].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-0.5 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{top3[0].xp} XP</span>
                  </div>
                  <div className="mt-2 h-14 sm:h-16 w-full bg-gradient-to-t from-amber-300 to-amber-100 rounded-xl flex items-center justify-center font-black text-amber-800 text-xl sm:text-2xl shadow-inner">
                    🥇
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  {top3[2].photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={top3[2].photoURL} alt={top3[2].name} className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover shadow-sm ring-2 ring-amber-700/60" />
                  ) : (
                    <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br ${top3[2].avatarColor} text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm ring-2 ring-amber-700/60`}>
                      {top3[2].initials}
                    </div>
                  )}
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-800">
                    3
                  </span>
                </div>
                <div className="w-full bg-amber-100/50 border border-amber-200/80 rounded-2xl p-2.5 sm:p-3 text-center shadow-xs flex flex-col items-center">
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 text-center leading-tight whitespace-nowrap">
                    {formatPodiumName(top3[2].name)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <span>{top3[2].flag}</span>
                    <span>{top3[2].city}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-0.5 mt-1">
                    <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{top3[2].xp} XP</span>
                  </div>
                  <div className="mt-2 h-8 sm:h-10 w-full bg-gradient-to-t from-amber-200 to-amber-100/60 rounded-xl flex items-center justify-center font-black text-amber-900 text-base sm:text-lg">
                    🥉
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Promotion & Demotion Zone Header */}
        <div className="flex items-center justify-between text-xs font-bold bg-white border border-slate-200 rounded-xl px-3.5 py-2 mb-3 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-700">
            <ChevronUp className="h-4 w-4" />
            <span>{activeTier === 'Deimantas' ? 'Top 3 Champions' : 'Top 3 Promoted'}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-500">
            <ChevronDown className="h-4 w-4" />
            <span>{activeTier === 'Geležis' ? 'Starter Division' : 'Bottom 5 Demoted'}</span>
          </div>
        </div>

        {/* Learner Cohort List (Starting cleanly from Rank 4) */}
        <div className="space-y-1.5">
          {listCompetitors.map((item) => {
            const isUserRow =
              item.isCurrentUser ||
              item.isUser ||
              Boolean(user?.uid && item.id === `firestore_${user.uid}`) ||
              Boolean(user?.displayName && item.name === user.displayName) ||
              Boolean(user?.email && item.name === user.email.split('@')[0]);
            const isDemotion = activeTier !== 'Geležis' && item.rank >= 26;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isUserRow
                    ? 'bg-amber-50/80 border-amber-300/80 ring-1 ring-amber-300/50 shadow-xs'
                    : isDemotion
                    ? 'bg-white border-rose-200/60 shadow-2xs hover:bg-rose-50/30'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Left: Dynamic Rank, Avatar, Name, Country */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="flex flex-col items-center justify-center w-6 text-center shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-400">
                      {item.rank}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {item.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.photoURL} alt={item.name} className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shadow-2xs" />
                    ) : (
                      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br ${item.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}>
                        {item.initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs sm:text-sm font-semibold truncate ${isUserRow ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                        {item.name}
                      </span>
                      {isUserRow && (
                        <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-md">
                          You
                        </span>
                      )}
                      <span className="text-xs shrink-0" title={item.city}>
                        {item.flag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
                      <span className="truncate">{item.city}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-orange-500 font-semibold">
                        <Flame className="h-3 w-3 fill-orange-500 text-orange-500 shrink-0" />
                        {item.streak}d streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Demotion Tag & XP */}
                <div className="flex items-center gap-2 shrink-0">
                  {isDemotion && (
                    <span className="hidden sm:inline text-[10px] font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                      Demoted
                    </span>
                  )}

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                    <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-amber-900">
                      {item.xp} <span className="text-[10px] text-amber-700/80">XP</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivation Card */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black">Want to rank higher?</h3>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              Complete lessons or practice in the Gym to earn bonus XP!
            </p>
          </div>
          <Link
            href="/practice"
            className="flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl font-bold text-xs transition shadow-2xs shrink-0"
          >
            <span>Practice</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Dynamic Sticky Bottom User Bar ("Rank #X You • 235 XP") */}
      <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] md:bottom-5 left-0 right-0 z-30 max-w-4xl mx-auto px-3 sm:px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-2.5 sm:px-4 shadow-2xl flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className={`px-2 py-0.5 rounded-lg font-black text-[11px] sm:text-xs shrink-0 ${
              userRank <= 3
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
            }`}>
              Rank #{userRank}
            </span>

            {user?.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.photoURL} alt="You" className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-white/30" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.initials || 'EP'}
              </div>
            )}

            <div className="min-w-0 flex items-center gap-1.5 truncate">
              <span className="font-bold text-white truncate">You • {currentUser.xp} XP</span>
            </div>
          </div>

          <Link
            href="/practice"
            className="btn-tactile btn-tactile-emerald px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Earn XP</span>
          </Link>
        </div>
      </div>

      {/* Rewards Breakdown Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-2 border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeTierConfig.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {activeTierConfig.englishName} Prizes
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tournament ends Sunday 23:59
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRewardsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">1st Place</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Champion status + Promotion</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-700">+{activeTierConfig.rewards.first} 💎 Gems</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">2nd Place</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Silver medal + Promotion</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700">+{activeTierConfig.rewards.second} 💎 Gems</span>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">3rd Place</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Bronze medal + Promotion</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-800">+{activeTierConfig.rewards.third} 💎 Gems</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold leading-relaxed">
              💡 <strong>How to promote:</strong> Complete daily lessons and practice in the Gym to reach the Top 3 by Sunday!
            </div>

            <button
              type="button"
              onClick={() => setShowRewardsModal(false)}
              className="btn-tactile btn-tactile-slate w-full mt-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 5-Round 1v1 Battle Modal (Matchmaking / AI Speed Battle) */}
      <LeagueBattleModal
        isOpen={isBattleOpen}
        onClose={() => setIsBattleOpen(false)}
        activeTier={activeTierConfig.name}
        tier={activeTier}
        competitors={unifiedList}
        onChallengeFriend={() => {
          setIsBattleOpen(false);
          setRealtimeRoomId(null);
          setIsRealtimeBattleOpen(true);
        }}
      />

      {/* Real-time 1v1 Battle Room Modal (Live Room Lobby & Synchronized Play) */}
      <RealtimeBattleModal
        isOpen={isRealtimeBattleOpen}
        onClose={() => {
          setIsRealtimeBattleOpen(false);
          setRealtimeRoomId(null);
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        tierName={activeTierConfig.name}
        initialRoomId={realtimeRoomId || roomIdParam}
        isHostInitial={isRealtimeHost}
        onPlayQuickMatch={() => {
          setIsRealtimeBattleOpen(false);
          setIsBattleOpen(true);
        }}
        onPlayBot={() => {
          setIsRealtimeBattleOpen(false);
          setIsBattleOpen(true);
        }}
      />


    </div>
  );
}

export default function LeaguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LeagueContent />
    </Suspense>
  );
}
