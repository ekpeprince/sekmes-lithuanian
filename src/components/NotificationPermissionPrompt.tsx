'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Flame, X, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  saveNotificationSettings,
  getNotificationSettings,
  sendTestNotification,
} from '@/lib/notifications';
import { sounds } from '@/lib/audio';

const STORAGE_KEY_DISMISSED = 'sekmes_notif_prompt_dismissed_at';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const NotificationPermissionPrompt: React.FC = () => {
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not show during active lessons
    if (pathname.startsWith('/lesson/')) return;

    // Check if notification is supported
    if (!isNotificationSupported()) return;

    // Only show if user hasn't made a choice yet (permission === 'default')
    if (Notification.permission !== 'default') return;

    // Check if user dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedAt) {
      const timeSince = Date.now() - Number(dismissedAt);
      if (timeSince < THREE_DAYS_MS) return;
    }

    // Friendly 1.5s delay so the app renders smoothly first
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleEnable = async () => {
    sounds.playClick();
    setIsEnabling(true);

    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        const settings = getNotificationSettings();
        const updated = { ...settings, enabled: true };
        saveNotificationSettings(updated);
        sounds.playSuccess();

        // Send friendly confirmation notification
        await sendTestNotification();
      } else {
        localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
      }
    } finally {
      setIsEnabling(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    sounds.playClick();
    localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || pathname.startsWith('/lesson/')) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border-2 border-slate-100 text-center animate-pop">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Glowing Icon Badge */}
        <div className="mx-auto mb-4 relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-3xl bg-amber-200 opacity-60 animate-ping" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Bell className="h-10 w-10 animate-bounce-slow" />
          </div>
        </div>

        {/* Catchy Headline */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          Don&apos;t lose your streak! 🔥
        </h3>

        {/* Friendly Value Proposition */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-5">
          Get a quick daily reminder so you never break your Lithuanian learning habit.
        </p>

        {/* Benefits List */}
        <div className="bg-slate-50 rounded-2xl p-3.5 mb-6 text-left space-y-2 border border-slate-100">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <span className="text-base">🔥</span>
            <span>Protect your daily flame streak</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <span className="text-base">🇱🇹</span>
            <span>Daily Lithuanian Word of the Day</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <span className="text-base">⏱️</span>
            <span>Only 1 friendly reminder per day</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleEnable}
            disabled={isEnabling}
            className="btn-3d btn-green-3d w-full py-3.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEnabling ? 'Enabling...' : 'Turn On Notifications'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 text-xs font-extrabold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
