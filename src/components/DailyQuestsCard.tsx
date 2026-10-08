'use client';

import React, { useState } from 'react';
import { Target, Check, Gift, Sparkles, Shield, X } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { DEFAULT_QUESTS } from '@/lib/storage';

export const DailyQuestsCard: React.FC = () => {
  const { progress, claimQuestRewardById, claimMysteryChestReward } = useGame();
  const quests = progress.quests || DEFAULT_QUESTS;

  const [showChestModal, setShowChestModal] = useState(false);
  const [lastChestReward, setLastChestReward] = useState<{
    xp: number;
    gems: number;
    streakFreeze: boolean;
  } | null>(null);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;
  const isAllCompleted = completedCount >= totalQuests;

  const todayStr = new Date().toISOString().split('T')[0];
  const isChestClaimedToday = progress.mysteryChestClaimedDate === todayStr;

  const handleOpenChest = () => {
    if (!isAllCompleted || isChestClaimedToday) return;
    const reward = claimMysteryChestReward();
    setLastChestReward(reward);
    setShowChestModal(true);
  };

  return (
    <div className="rounded-3xl bg-white border-2 border-slate-200 p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Target className="h-4 w-4" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Daily Quests • Užduotys
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Streak Freeze Badge */}
          <span
            className="flex items-center gap-1 text-[11px] font-black text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full"
            title="Streak Freeze shield protects your streak if you miss a practice day"
          >
            <span>🧊</span>
            <span>{progress.streakFreezes ?? 1} Freeze</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            Resets daily
          </span>
        </div>
      </div>

      {/* Quests List */}
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
                    <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>{quest.title}</span>
                      {quest.englishTitle && (
                        <span className="text-[10px] font-bold text-slate-400">
                          • {quest.englishTitle}
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                      {quest.description}
                    </p>
                    {quest.englishDescription && (
                      <p className="text-[10px] text-slate-400 font-normal italic line-clamp-1">
                        {quest.englishDescription}
                      </p>
                    )}
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

      {/* Mystery Reward Chest Section */}
      <div
        className={`relative overflow-hidden rounded-2xl p-3.5 border-2 transition-all ${
          isChestClaimedToday
            ? 'bg-slate-50 border-slate-200'
            : isAllCompleted
            ? 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 border-amber-400 shadow-md ring-2 ring-amber-300/50'
            : 'bg-slate-50/70 border-dashed border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-xs transition-transform ${
                isChestClaimedToday
                  ? 'bg-slate-200 text-slate-400'
                  : isAllCompleted
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-bounce shadow-amber-300'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isChestClaimedToday ? '✨' : '🎁'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800">
                  Paslapties Skrynia • Mystery Chest
                </span>
                {isAllCompleted && !isChestClaimedToday && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md">
                    Ready!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isChestClaimedToday
                  ? 'Šiandien jau atidaryta! Sugrįžkite rytoj • Claimed today!'
                  : isAllCompleted
                  ? 'Visos užduotys atliktos! Atidarykite dovaną • All quests done!'
                  : `Atlikite visas užduotis (${completedCount}/${totalQuests}) skryniai atrakinti`}
              </p>
            </div>
          </div>

          <div>
            {isChestClaimedToday ? (
              <span className="flex items-center gap-1 text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                Atidaryta
              </span>
            ) : isAllCompleted ? (
              <button
                type="button"
                onClick={handleOpenChest}
                className="btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md animate-pulse"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Atidaryti!</span>
              </button>
            ) : (
              <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                {completedCount}/{totalQuests}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Celebratory Chest Opened Modal */}
      {showChestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-300 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowChestModal(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-5xl shadow-lg ring-4 ring-amber-200 animate-bounce">
              🎁
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Dienos Prizas • Daily Reward
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Skrynia Atidaryta!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sveikiname atlikus visas šiandienos užduotis! Štai jūsų apdovanojimai:
              </p>
            </div>

            {/* Reward Badges */}
            <div className="grid grid-cols-3 gap-2 w-full pt-1">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xl">⚡</span>
                <span className="text-sm font-black text-slate-800 mt-1">
                  +{lastChestReward?.xp ?? 50}
                </span>
                <span className="text-[10px] font-bold text-amber-700">XP</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xl">💎</span>
                <span className="text-sm font-black text-slate-800 mt-1">
                  +{lastChestReward?.gems ?? 25}
                </span>
                <span className="text-[10px] font-bold text-emerald-700">Gems</span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-50 border border-cyan-200">
                <span className="text-xl">🧊</span>
                <span className="text-sm font-black text-slate-800 mt-1">
                  +1
                </span>
                <span className="text-[10px] font-bold text-cyan-700">Freeze</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[11px] text-cyan-900 text-left w-full">
              <Shield className="h-4 w-4 shrink-0 text-cyan-600" />
              <span>
                <strong>Streak Freeze 🧊:</strong> Apsaugo jūsų dienų seriją, jei nespėtumėte pasipraktikuoti!
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowChestModal(false)}
              className="btn-3d w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-md"
            >
              Puiku! • Claimed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
