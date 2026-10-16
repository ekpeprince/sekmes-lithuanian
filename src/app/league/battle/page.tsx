'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { LeagueTier } from '@/lib/league';
import { LeagueBattleModal } from '@/components/LeagueBattleModal';

export default function LeagueBattlePage() {
  const router = useRouter();
  const { progress } = useGame();
  const userAssignedTier: LeagueTier = progress.leagueTier || 'Sidabras';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <LeagueBattleModal
        isOpen={true}
        onClose={() => router.push('/league')}
        tier={userAssignedTier}
      />
    </div>
  );
}
