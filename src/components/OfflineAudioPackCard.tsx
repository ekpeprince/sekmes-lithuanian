'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { getOfflineAudioStats, downloadOfflineAudioPack, clearOfflineAudioPack, OfflineAudioStats } from '@/lib/offlineAudio';
import { sounds } from '@/lib/audio';

export const OfflineAudioPackCard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [stats, setStats] = useState<OfflineAudioStats>({
    totalPhrases: 0,
    cachedCount: 0,
    isFullyCached: false,
    supported: true,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total: number; currentPhrase: string } | null>(null);

  const refreshStats = useCallback(async () => {
    const current = await getOfflineAudioStats();
    setStats(current);
  }, []);

  // Monitor online / offline network state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Fetch offline audio storage stats on mount
  useEffect(() => {
    let isMounted = true;
    getOfflineAudioStats().then((current) => {
      if (isMounted) setStats(current);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async () => {
    if (isDownloading) return;
    sounds.playClick();
    setIsDownloading(true);

    try {
      await downloadOfflineAudioPack((loaded, total, currentPhrase) => {
        setDownloadProgress({ loaded, total, currentPhrase });
      });

      sounds.playSuccess();
      await refreshStats();
    } catch (err) {
      console.warn('Offline audio download error:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear cached offline audio clips from this device?')) {
      sounds.playClick();
      await clearOfflineAudioPack();
      await refreshStats();
    }
  };

  const percent = stats.totalPhrases > 0 
    ? Math.min(100, Math.round((stats.cachedCount / stats.totalPhrases) * 100))
    : 0;

  return (
    <div className="bg-white border-2 border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Left side */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-sm shrink-0">
          <Volume2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-black text-slate-800 truncate">
            Offline Audio
          </h3>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            {stats.totalPhrases || 221} clips • {percent}% cached
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {stats.cachedCount > 0 && !isDownloading && (
          <button
            type="button"
            onClick={handleClearCache}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
            title="Clear audio cache"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !isOnline || stats.isFullyCached}
          className={`px-3 py-1.5 rounded-xl border-b-2 active:border-b-0 text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center gap-1 ${
            stats.isFullyCached
              ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600'
              : isDownloading
              ? 'bg-sky-400 border-sky-600 cursor-wait'
              : !isOnline
              ? 'bg-slate-300 border-slate-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 border-sky-700'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{downloadProgress ? `${Math.round((downloadProgress.loaded / downloadProgress.total) * 100)}%` : 'Saving...'}</span>
            </>
          ) : stats.isFullyCached ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span>Cached</span>
            </>
          ) : (
            <span>Download</span>
          )}
        </button>
      </div>
    </div>
  );
};
