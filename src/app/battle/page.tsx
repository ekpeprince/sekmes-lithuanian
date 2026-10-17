'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BattleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const room = searchParams.get('room') || searchParams.get('roomId');
    const targetUrl = room
      ? `/league?battle=room&roomId=${encodeURIComponent(room)}`
      : '/league?battle=room';

    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
      <p className="text-lg font-bold">Nukreipiama į Kovos Areną...</p>
      <p className="text-sm text-slate-400 mt-1">Redirecting to League Battle Arena...</p>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
        </div>
      }
    >
      <BattleRedirect />
    </Suspense>
  );
}
