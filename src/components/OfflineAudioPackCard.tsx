'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, CheckCircle2, Trash2, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { getOfflineAudioStats, downloadOfflineAudioPack, clearOfflineAudioPack, OfflineAudioStats } from '@/lib/offlineAudio';
import { sounds } from '@/lib/audio';

export const OfflineAudioPackCard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<OfflineAudioStats>({
    totalPhrases: 0,
    cachedCount: 0,
    isFullyCached: false,
    supported: true,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total: number; currentPhrase: string } | null>(null);

  // 1. Monitor online / offline network state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

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

  // 2. Fetch offline audio storage stats on mount
  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    const current = await getOfflineAudioStats();
    setStats(current);
  };

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
    <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xs transition-all mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20">
            <Volume2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">
                Offline Audio Pack • Režimas be interneto
              </h3>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Wifi className="h-3 w-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <WifiOff className="h-3 w-3" /> Offline Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Download lesson native voice audio clips so you can practice on flights, trains, or without Wi-Fi.
            </p>
          </div>
        </div>

        {/* Clear Cache Action */}
        {stats.cachedCount > 0 && !isDownloading && (
          <button
            type="button"
            onClick={handleClearCache}
            className="self-start sm:self-center text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors p-1.5 rounded-xl hover:bg-slate-50"
            title="Clear stored audio"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Audio</span>
          </button>
        )}
      </div>

      {/* Progress & Storage Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between text-xs font-black mb-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Audio Readiness: {stats.cachedCount} / {stats.totalPhrases} clips cached</span>
          </div>
          <span className="text-sky-600">{percent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percent >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Live download feedback */}
        {downloadProgress && (
          <p className="text-[11px] text-slate-500 font-medium mt-2 truncate flex items-center gap-1.5 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin text-sky-600 shrink-0" />
            <span>Downloading: &quot;{downloadProgress.currentPhrase}&quot; ({downloadProgress.loaded}/{downloadProgress.total})</span>
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {percent >= 100 ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-xs uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>All Lesson Audio Stored Locally (Airplane Ready)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !isOnline}
            className={`btn-3d w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              !isOnline
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-0'
                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-md'
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading Voice Audio...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Offline Audio Pack ({stats.totalPhrases - stats.cachedCount} clips left)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
