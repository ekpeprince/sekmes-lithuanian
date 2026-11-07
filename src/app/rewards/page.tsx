'use client';

import React from 'react';
import { RewardsDashboard } from '@/components/RewardsDashboard';

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-3 pb-20 md:pb-8">
      <div className="mx-auto max-w-4xl">
        <RewardsDashboard />
      </div>
    </div>
  );
}

