'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProgress } from '@/types/lesson';
import {
  getStoredProgress,
  saveProgress,
  deductHeart,
  refillHearts as refillHeartsStorage,
  completeLesson as completeLessonStorage,
  recordMistake,
  resolveMistake,
  claimQuestReward,
  claimMysteryChest,
  recordSpeedDrillScore,
  addPracticeSeconds,
  recordDuelWin as recordDuelWinStorage,
  addXpStorage,
  recordBattleResult as recordBattleResultStorage,
  formatTimeLearned,
  DEFAULT_PROGRESS,
  getLocalDateString,
  getLeagueTierByXp,
} from '@/lib/storage';
import { getAllLessons } from '@/data/curriculum';
import { sounds } from '@/lib/audio';
import { useAuth } from '@/contexts/AuthContext';
import { saveProgressToCloud, loadProgressFromCloud } from '@/lib/progressSync';
import { checkDailyNotifications } from '@/lib/notifications';

interface GameContextType {
  progress: UserProgress;
  totalPracticeSeconds: number;
  activeMinutesToday: number;
  dailyXp: number;
  duelsWonCount: number;
  wordsMasteredCount: number;
  formatTimeLearned: (seconds: number) => string;
  addActivePracticeTime: (seconds: number) => void;
  recordDuelWin: () => void;
  recordBattleResult: (earnedXp: number, isWin: boolean) => void;
  loseHeart: () => boolean;
  refillHearts: () => void;
  finishLesson: (lessonId: string, xpReward: number) => void;
  toggleSound: () => void;
  setVoiceGender: (gender: 'female' | 'male') => void;
  resetProgress: () => void;
  isLessonCompleted: (lessonId: string) => boolean;
  addMistake: (mistake: Omit<import('@/types/lesson').MistakeItem, 'timestamp'>) => void;
  resolveMistakeById: (id: string) => void;
  claimQuestRewardById: (questId: string) => void;
  claimMysteryChestReward: () => { xp: number; gems: number; streakFreeze: boolean };
  saveSpeedDrillScoreVal: (score: number) => void;
  addXp: (amount: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window !== 'undefined') {
      return getStoredProgress();
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    sounds.setSoundEnabled(progress.soundEnabled);
    if (progress.voiceGender) {
      sounds.setVoiceGender(progress.voiceGender);
    }

    const handleSync = () => {
      const updated = getStoredProgress();
      setProgress(updated);
      sounds.setSoundEnabled(updated.soundEnabled);
      if (updated.voiceGender) {
        sounds.setVoiceGender(updated.voiceGender);
      }
    };

    window.addEventListener('sekmes-progress-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sekmes-progress-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [progress.soundEnabled, progress.voiceGender]);

  // When user signs in, load and merge cloud progress
  useEffect(() => {
    if (!user) return;

        loadProgressFromCloud(user.uid).then((cloudProg) => {
      if (cloudProg) {
        setProgress((prev) => {
          const mergedXp = Math.max(prev.xp, cloudProg.xp || 0);
          const merged: UserProgress = {
            ...prev,
            ...cloudProg,
            xp: mergedXp,
            gems: Math.max(prev.gems || 0, cloudProg.gems || 0),
            duelsWonCount: Math.max(prev.duelsWonCount || 0, cloudProg.duelsWonCount || 0),
            totalPracticeSeconds: Math.max(prev.totalPracticeSeconds || 0, cloudProg.totalPracticeSeconds || 0),
            wordsMasteredCount: Math.max(prev.wordsMasteredCount || 0, cloudProg.wordsMasteredCount || 0),
            leagueTier: getLeagueTierByXp(mergedXp),
            streak: Math.max(prev.streak, cloudProg.streak || 0),
            completedLessons: Array.from(
              new Set([...prev.completedLessons, ...(cloudProg.completedLessons || [])])
            ),
          };
          saveProgress(merged);
          return merged;
        });
      } else {
        // Save existing local progress to fresh cloud user account
        const current = getStoredProgress();
        saveProgressToCloud(user.uid, current);
      }
    });
  }, [user]);

  // Check and fire scheduled background notifications (streak reminder, word of the day, hearts)
  useEffect(() => {
    const isCompletedToday = Boolean(
      progress.lastActiveDate &&
      progress.lastActiveDate === getLocalDateString()
    );
    checkDailyNotifications({
      streak: progress.streak,
      completedToday: isCompletedToday,
      hearts: progress.hearts,
    });
  }, [progress.streak, progress.lastActiveDate, progress.hearts]);

  const syncToCloudIfUser = (updatedProg: UserProgress) => {
    if (user?.uid) {
      saveProgressToCloud(user.uid, updatedProg);
    }
  };

  const loseHeart = (): boolean => {
    const updated = deductHeart();
    setProgress(updated);
    sounds.playError();
    syncToCloudIfUser(updated);
    return updated.hearts > 0;
  };

  const refillHearts = () => {
    const updated = refillHeartsStorage();
    setProgress(updated);
    sounds.playSuccess();
    syncToCloudIfUser(updated);
  };

  const finishLesson = (lessonId: string, xpReward: number) => {
    const updated = completeLessonStorage(lessonId, xpReward);
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  const toggleSound = () => {
    const current = getStoredProgress();
    const nextVal = !current.soundEnabled;
    const updated = { ...current, soundEnabled: nextVal };
    saveProgress(updated);
    setProgress(updated);
    sounds.setSoundEnabled(nextVal);
    if (nextVal) {
      sounds.playClick();
    }
  };

  const setVoiceGender = (gender: 'female' | 'male') => {
    const current = getStoredProgress();
    const updated = { ...current, voiceGender: gender };
    saveProgress(updated);
    setProgress(updated);
    sounds.setVoiceGender(gender);
  };

  const resetProgress = () => {
    saveProgress(DEFAULT_PROGRESS);
    setProgress(DEFAULT_PROGRESS);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.completedLessons.includes(lessonId);
  };

  const addMistake = (mistake: Omit<import('@/types/lesson').MistakeItem, 'timestamp'>) => {
    const updatedProg = recordMistake(mistake);
    setProgress(updatedProg);
  };

  const resolveMistakeById = (id: string) => {
    const updatedProg = resolveMistake(id);
    setProgress(updatedProg);
    sounds.playSuccess();
    syncToCloudIfUser(updatedProg);
  };

  const claimQuestRewardById = (questId: string) => {
    const updatedProg = claimQuestReward(questId);
    setProgress(updatedProg);
    sounds.playLevelComplete();
    syncToCloudIfUser(updatedProg);
  };

  const claimMysteryChestReward = () => {
    const res = claimMysteryChest();
    setProgress(res.progress);
    sounds.playLevelComplete();
    syncToCloudIfUser(res.progress);
    return res.reward;
  };

  const saveSpeedDrillScoreVal = (score: number) => {
    const updatedProg = recordSpeedDrillScore(score);
    setProgress(updatedProg);
    syncToCloudIfUser(updatedProg);
  };

  const addActivePracticeTime = (seconds: number) => {
    const updated = addPracticeSeconds(seconds);
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  const recordDuelWin = () => {
    const updated = recordDuelWinStorage();
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  const recordBattleResult = (earnedXp: number, isWin: boolean) => {
    const updated = recordBattleResultStorage(earnedXp, isWin);
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  const addXp = (amount: number) => {
    const updated = addXpStorage(amount);
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  const today = typeof window !== 'undefined' ? getLocalDateString() : '';
  const dailyXp = progress.dailyXpDate === today ? (progress.dailyXp || 0) : 0;
  const activeMinutesToday = progress.activeMinutesDate === today ? (progress.activeMinutesToday || 0) : 0;
  const totalPracticeSeconds = progress.totalPracticeSeconds || 0;
  const duelsWonCount = progress.duelsWonCount || 0;

  const allLessons = getAllLessons();
  const wordsMasteredCount = Math.max(
    progress.wordsMasteredCount || 0,
    allLessons
      .filter((l) => progress.completedLessons.includes(l.id))
      .reduce((acc, l) => acc + (l.exercises?.length || 6), 0)
  );

  return (
    <GameContext.Provider
      value={{
        progress,
        totalPracticeSeconds,
        activeMinutesToday,
        dailyXp,
        duelsWonCount,
        wordsMasteredCount,
        formatTimeLearned,
        addActivePracticeTime,
        recordDuelWin,
        recordBattleResult,
        loseHeart,
        refillHearts,
        finishLesson,
        toggleSound,
        setVoiceGender,
        resetProgress,
        isLessonCompleted,
        addMistake,
        resolveMistakeById,
        claimQuestRewardById,
        claimMysteryChestReward,
        saveSpeedDrillScoreVal,
        addXp,
      }}
    >
      {children}
    </GameContext.Provider>
  );

};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
