import { UserProgress, MistakeItem, Quest, LeagueTier } from '@/types/lesson';

const STORAGE_KEY = 'sekmes_user_progress_v1';

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'quest-lesson',
    title: 'Daily Lesson',
    englishTitle: 'Daily Lesson',
    description: 'Complete 1 daily lesson',
    englishDescription: 'Complete 1 daily lesson',
    icon: '📖',
    current: 0,
    target: 1,
    rewardXp: 20,
    rewardGems: 10,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-xp',
    title: 'Energy Boost',
    englishTitle: 'Energy Boost',
    description: 'Earn 50 XP',
    englishDescription: 'Earn 50 XP',
    icon: '⚡',
    current: 0,
    target: 50,
    rewardXp: 30,
    rewardGems: 15,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-drill',
    title: 'Speed Master',
    englishTitle: 'Speed Master',
    description: 'Try 60s Speed Drill',
    englishDescription: 'Try 60s Speed Drill',
    icon: '⏱️',
    current: 0,
    target: 1,
    rewardXp: 25,
    rewardGems: 10,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest-mistakes',
    title: 'Mistake Cleaner',
    englishTitle: 'Mistake Cleaner',
    description: 'Clear a mistake from your mistake bank',
    englishDescription: 'Clear a mistake from your mistake bank',
    icon: '🎯',
    current: 0,
    target: 1,
    rewardXp: 15,
    rewardGems: 5,
    completed: false,
    claimed: false,
  },
];

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 1,
  completedLessons: [],
  lastActiveDate: new Date().toISOString().split('T')[0],
  soundEnabled: true,
  gems: 120,
  voiceGender: 'female',
  mistakesBank: [],
  quests: DEFAULT_QUESTS,
  leagueTier: 'Geležis',
  leagueRank: 1,
  speedDrillHighScore: 0,
  streakFreezes: 1,
  mysteryChestClaimedDate: undefined,
  totalPracticeSeconds: 0,
  activeMinutesToday: 0,
  activeSecondsToday: 0,
  activeMinutesDate: new Date().toISOString().split('T')[0],
  dailyXp: 0,
  dailyXpDate: new Date().toISOString().split('T')[0],
  lastQuestResetDate: new Date().toISOString().split('T')[0],
  duelsWonCount: 0,
  wordsMasteredCount: 0,
};

export function getStoredProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return DEFAULT_PROGRESS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProgress(DEFAULT_PROGRESS);
      return DEFAULT_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = parsed.lastQuestResetDate || parsed.lastActiveDate;
    const isNewDay = Boolean(lastQuestDate && lastQuestDate !== today);

    // Reset daily quests if a new calendar day has arrived
    const questsToUse = isNewDay
      ? DEFAULT_QUESTS.map(q => ({ ...q, current: 0, completed: false, claimed: false }))
      : (Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : DEFAULT_QUESTS);

    // Reset daily counters if a new calendar day has arrived
    const activeMinutesToday = parsed.activeMinutesDate === today ? (parsed.activeMinutesToday || 0) : 0;
    const activeSecondsToday = parsed.activeMinutesDate === today ? (parsed.activeSecondsToday || 0) : 0;
    const dailyXp = parsed.dailyXpDate === today ? (parsed.dailyXp || 0) : 0;

    const merged: UserProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure valid heart counts and arrays
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      hearts: typeof parsed.hearts === 'number' ? Math.min(5, Math.max(0, parsed.hearts)) : 5,
      mistakesBank: Array.isArray(parsed.mistakesBank) ? parsed.mistakesBank : [],
      quests: questsToUse,
      leagueTier: parsed.leagueTier || getLeagueTierByXp(parsed.xp || 0),
      speedDrillHighScore: parsed.speedDrillHighScore || 0,
      streakFreezes: typeof parsed.streakFreezes === 'number' ? parsed.streakFreezes : 1,
      mysteryChestClaimedDate: parsed.mysteryChestClaimedDate,
      totalPracticeSeconds: parsed.totalPracticeSeconds || 0,
      activeMinutesToday,
      activeSecondsToday,
      activeMinutesDate: today,
      dailyXp,
      dailyXpDate: today,
      lastQuestResetDate: today,
      duelsWonCount: parsed.duelsWonCount || 0,
      wordsMasteredCount: parsed.wordsMasteredCount || 0,
    };

    if (isNewDay) {
      saveProgress(merged);
    }

    return merged;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event('sekmes-progress-updated'));
  } catch (err) {
    console.error('Failed to save progress to localStorage', err);
  }
}

export function deductHeart(): UserProgress {
  const current = getStoredProgress();
  const nextHearts = Math.max(0, current.hearts - 1);
  const updated: UserProgress = {
    ...current,
    hearts: nextHearts,
  };
  saveProgress(updated);
  return updated;
}

export function refillHearts(): UserProgress {
  const current = getStoredProgress();
  const updated: UserProgress = {
    ...current,
    hearts: current.maxHearts || 5,
  };
  saveProgress(updated);
  return updated;
}

export function getLeagueTierByXp(xp: number): LeagueTier {
  if (xp >= 2500) return 'Deimantas';
  if (xp >= 1500) return 'Gintaras';
  if (xp >= 800) return 'Auksas';
  if (xp >= 400) return 'Sidabras';
  if (xp >= 150) return 'Bronza';
  return 'Geležis';
}

export function completeLesson(lessonId: string, xpEarned: number): UserProgress {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate streak & check freeze protection
  let newStreak = current.streak;
  let remainingFreezes = current.streakFreezes ?? 1;

  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays === 2 && remainingFreezes > 0) {
      // Streak freeze protects 1 missed day!
      remainingFreezes -= 1;
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  const completedLessons = current.completedLessons.includes(lessonId)
    ? current.completedLessons
    : [...current.completedLessons, lessonId];

  const nextXp = current.xp + xpEarned;

  // Update daily quests
  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-lesson') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    if (q.id === 'quest-xp') {
      const nextCurr = Math.min(q.target, q.current + xpEarned);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const currentDailyXp = current.dailyXpDate === today ? (current.dailyXp || 0) : 0;
  const nextDailyXp = currentDailyXp + xpEarned;

  const updated: UserProgress = {
    ...current,
    xp: nextXp,
    dailyXp: nextDailyXp,
    dailyXpDate: today,
    gems: (current.gems || 0) + 15,
    streak: Math.max(1, newStreak),
    streakFreezes: remainingFreezes,
    completedLessons,
    lastActiveDate: today,
    quests: updatedQuests,
    leagueTier: getLeagueTierByXp(nextXp),
  };

  saveProgress(updated);
  return updated;
}

// Record an exercise mistake into user's mistakes bank
export function recordMistake(mistake: Omit<MistakeItem, 'timestamp'>): UserProgress {
  const current = getStoredProgress();
  const existing = current.mistakesBank || [];

  // Deduplicate by exercise prompt
  if (existing.some(m => m.exercisePrompt === mistake.exercisePrompt)) {
    return current;
  }

  const newEntry: MistakeItem = {
    ...mistake,
    timestamp: Date.now(),
  };

  const updated: UserProgress = {
    ...current,
    mistakesBank: [newEntry, ...existing].slice(0, 50), // keep top 50
  };

  saveProgress(updated);
  return updated;
}

// Remove or resolve a mistake from bank
export function resolveMistake(id: string): UserProgress {
  const current = getStoredProgress();
  const updatedBank = (current.mistakesBank || []).filter(m => m.id !== id);
  const today = new Date().toISOString().split('T')[0];
  const earnedXp = 5;
  const nextXp = current.xp + earnedXp;
  const currentDailyXp = current.dailyXpDate === today ? (current.dailyXp || 0) : 0;
  const nextDailyXp = currentDailyXp + earnedXp;

  // Update mistake quest and XP quest
  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-mistakes') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    if (q.id === 'quest-xp') {
      const nextCurr = Math.min(q.target, q.current + earnedXp);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    mistakesBank: updatedBank,
    quests: updatedQuests,
    xp: nextXp,
    dailyXp: nextDailyXp,
    dailyXpDate: today,
    leagueTier: getLeagueTierByXp(nextXp),
  };

  saveProgress(updated);
  return updated;
}

// Record speed drill high score
export function recordSpeedDrillScore(score: number): UserProgress {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  const nextHigh = Math.max(current.speedDrillHighScore || 0, score);
  const earnedXp = Math.round(score / 2);
  const nextXp = current.xp + earnedXp;
  const currentDailyXp = current.dailyXpDate === today ? (current.dailyXp || 0) : 0;
  const nextDailyXp = currentDailyXp + earnedXp;

  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === 'quest-drill') {
      const nextCurr = Math.min(q.target, q.current + 1);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    if (q.id === 'quest-xp') {
      const nextCurr = Math.min(q.target, q.current + earnedXp);
      return { ...q, current: nextCurr, completed: nextCurr >= q.target };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    speedDrillHighScore: nextHigh,
    quests: updatedQuests,
    xp: nextXp,
    dailyXp: nextDailyXp,
    dailyXpDate: today,
    leagueTier: getLeagueTierByXp(nextXp),
  };

  saveProgress(updated);
  return updated;
}

// Claim reward for a completed quest
export function claimQuestReward(questId: string): UserProgress {
  const current = getStoredProgress();
  let xpToAdd = 0;
  let gemsToAdd = 0;

  const updatedQuests = (current.quests || DEFAULT_QUESTS).map(q => {
    if (q.id === questId && q.completed && !q.claimed) {
      xpToAdd = q.rewardXp;
      gemsToAdd = q.rewardGems;
      return { ...q, claimed: true };
    }
    return q;
  });

  const updated: UserProgress = {
    ...current,
    xp: current.xp + xpToAdd,
    gems: current.gems + gemsToAdd,
    quests: updatedQuests,
    leagueTier: getLeagueTierByXp(current.xp + xpToAdd),
  };

  saveProgress(updated);
  return updated;
}

// Claim Mystery Reward Chest when daily quests are completed
export function claimMysteryChest(): {
  progress: UserProgress;
  reward: { xp: number; gems: number; streakFreeze: boolean };
} {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  const bonusXp = 50;
  const bonusGems = 25;
  const streakFreezeAwarded = true;

  const updated: UserProgress = {
    ...current,
    xp: current.xp + bonusXp,
    gems: current.gems + bonusGems,
    streakFreezes: (current.streakFreezes ?? 1) + 1,
    mysteryChestClaimedDate: today,
    leagueTier: getLeagueTierByXp(current.xp + bonusXp),
  };

  saveProgress(updated);
  return {
    progress: updated,
    reward: { xp: bonusXp, gems: bonusGems, streakFreeze: streakFreezeAwarded },
  };
}

export function addPracticeSeconds(seconds: number): UserProgress {
  const current = getStoredProgress();
  const today = new Date().toISOString().split('T')[0];
  const totalSeconds = (current.totalPracticeSeconds || 0) + seconds;
  const prevActiveSec = current.activeMinutesDate === today
    ? (current.activeSecondsToday || (current.activeMinutesToday || 0) * 60)
    : 0;
  const newActiveSec = prevActiveSec + seconds;
  const newActiveMin = Math.floor(newActiveSec / 60);

  const updated: UserProgress = {
    ...current,
    totalPracticeSeconds: totalSeconds,
    activeMinutesToday: newActiveMin,
    activeSecondsToday: newActiveSec,
    activeMinutesDate: today,
  };
  saveProgress(updated);
  return updated;
}

export function recordDuelWin(): UserProgress {
  const current = getStoredProgress();
  const updated: UserProgress = {
    ...current,
    duelsWonCount: (current.duelsWonCount || 0) + 1,
  };
  saveProgress(updated);
  return updated;
}

export function formatTimeLearned(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${Math.max(1, minutes)}m`;
}

export function resetAllProgress(): UserProgress {
  const reset = { ...DEFAULT_PROGRESS };
  saveProgress(reset);
  return reset;
}
