'use client';

import React from 'react';
import { Target, Gift, Check, Sparkles } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { DEFAULT_QUESTS } from '@/lib/storage';

export const DailyQuestsCard: React.FC = () => {
  const { progress, claimQuestRewardById } = useGame();
  const quests = progress.quests || DEFAULT_QUESTS;

  return (
    <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Target className="h-4 w-4" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Daily Quests • Užduotys
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          Resets daily
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {quests.map((quest) => {
          const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{quest.icon}</span>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">
                      {quest.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      {quest.description}
                    </p>
                  </div>
                </div>

                {quest.completed && !quest.claimed ? (
                  <button
                    type="button"
                    onClick={() => claimQuestRewardById(quest.id)}
                    className="btn-3d px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-[11px] uppercase tracking-wider shadow-xs animate-bounce"
                  >
                    Claim!
                  </button>
                ) : quest.claimed ? (
                  <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <Check className="h-3 w-3 stroke-[3]" />
                    Done
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">
                    {quest.current}/{quest.target}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    quest.completed ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                <span>Reward: +{quest.rewardXp} XP</span>
                <span className="text-amber-500">+{quest.rewardGems} 💎</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
