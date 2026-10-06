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
}


const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getStoredProgress();
    setProgress(loaded);
    sounds.setSoundEnabled(loaded.soundEnabled);
    if (loaded.voiceGender) {
      sounds.setVoiceGender(loaded.voiceGender);
    }
    setIsLoaded(true);

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
  }, []);

  const loseHeart = (): boolean => {
    const updated = deductHeart();
    setProgress(updated);
    sounds.playError();
    return updated.hearts > 0;
  };

  const refillHearts = () => {
    const updated = refillHeartsStorage();
    setProgress(updated);
    sounds.playSuccess();
  };

  const finishLesson = (lessonId: string, xpReward: number) => {
    const updated = completeLessonStorage(lessonId, xpReward);
    setProgress(updated);
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


  return (
    <GameContext.Provider
      value={{
        progress: isLoaded ? progress : DEFAULT_PROGRESS,
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
