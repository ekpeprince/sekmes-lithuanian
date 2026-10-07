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
  recordSpeedDrillScore,
  DEFAULT_PROGRESS,
} from '@/lib/storage';
import { sounds } from '@/lib/audio';
import { useAuth } from '@/contexts/AuthContext';
import { saveProgressToCloud, loadProgressFromCloud } from '@/lib/progressSync';

interface GameContextType {
  progress: UserProgress;
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
          const merged: UserProgress = {
            ...prev,
            ...cloudProg,
            xp: Math.max(prev.xp, cloudProg.xp || 0),
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
    const nextVal = !progress.soundEnabled;
    const updated = { ...progress, soundEnabled: nextVal };
    saveProgress(updated);
    setProgress(updated);
    sounds.setSoundEnabled(nextVal);
    if (nextVal) {
      sounds.playClick();
    }
  };

  const setVoiceGender = (gender: 'female' | 'male') => {
    const updated = { ...progress, voiceGender: gender };
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
  };

  const claimQuestRewardById = (questId: string) => {
    const updatedProg = claimQuestReward(questId);
    setProgress(updatedProg);
    sounds.playLevelComplete();
  };

  const saveSpeedDrillScoreVal = (score: number) => {
    const updatedProg = recordSpeedDrillScore(score);
    setProgress(updatedProg);
  };

  const addXp = (amount: number) => {
    const updated = { ...progress, xp: progress.xp + amount };
    saveProgress(updated);
    setProgress(updated);
    syncToCloudIfUser(updated);
  };

  return (
    <GameContext.Provider
      value={{
        progress,
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
