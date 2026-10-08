'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Flame,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '@/lib/notifications';
import { sounds } from '@/lib/audio';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [supported, setSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSupported(isNotificationSupported());
      setPermission(getNotificationPermission());
      setSettings(getNotificationSettings());
      setTestSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMasterToggle = async () => {
    sounds.playClick();

    if (!settings.enabled) {
      setIsRequesting(true);
      const perm = await requestNotificationPermission();
      setPermission(perm);
      setIsRequesting(false);

      if (perm === 'granted') {
        const updated = { ...settings, enabled: true };
        setSettings(updated);
        saveNotificationSettings(updated);
        sounds.playSuccess();
      } else {
        const updated = { ...settings, enabled: false };
        setSettings(updated);
        saveNotificationSettings(updated);
      }
    } else {
      const updated = { ...settings, enabled: false };
      setSettings(updated);
      saveNotificationSettings(updated);
    }
  };

  const handleToggleChannel = (key: keyof Omit<NotificationSettings, 'enabled' | 'reminderTime'>) => {
    sounds.playClick();
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleTimeChange = (time: string) => {
    sounds.playClick();
    const updated = { ...settings, reminderTime: time };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSendTest = async () => {
    sounds.playClick();
    if (permission !== 'granted') {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
    }

    const success = await sendTestNotification();
    if (success) {
      sounds.playSuccess();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const isEnabled = settings.enabled && permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border-2 border-slate-100 animate-pop">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
            {isEnabled ? <BellRing className="h-6 w-6" /> : <Bell className="h-6 w-6 text-slate-400" />}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-snug flex items-center gap-2">
              <span>Pranešimai & Priminimai</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily streak protection, Word of the Day & heart alerts
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {permission === 'granted' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pranešimai aktyvūs • Notifications Active 🔔</span>
            </div>
          ) : permission === 'denied' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Blocked in browser settings</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              <span>Not enabled yet • Switch on below</span>
            </div>
          )}
        </div>

        {/* Denied Warning Banner */}
        {permission === 'denied' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-black">Notifications are blocked by your browser.</p>
              <p className="text-rose-700 mt-0.5">
                To enable: tap the lock or site settings icon next to your browser URL, select &quot;Permissions&quot;, and set Notifications to &quot;Allow&quot;.
              </p>
            </div>
          </div>
        )}

        {/* Master Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">
              {isEnabled ? 'Pranešimai įjungti' : 'Įjungti pranešimus'}
            </h4>
            <p className="text-xs text-slate-500">
              {isEnabled
                ? 'Scheduled alerts active on this device'
                : 'Tap to grant permission and enable alerts'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleMasterToggle}
            disabled={isRequesting}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3 mb-5">
          {/* Channel 1: Streak Protector */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200 text-lg">
                  🔥
                </span>
                <div>
                  <h5 className="text-sm font-black text-slate-800">
                    Streak Protector (Dienos priminimas)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Alerts you if you haven&apos;t finished a lesson today so your streak never resets.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.streakReminders}
                onChange={() => handleToggleChannel('streakReminders')}
                className="h-5 w-5 accent-indigo-600 rounded-md cursor-pointer mt-1"
              />
            </div>

            {settings.streakReminders && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Laikas:</span>
                </span>
                {['09:00', '12:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeChange(time)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      settings.reminderTime === time
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Channel 2: Word of the Day */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500 border border-sky-200 text-lg">
                🇱🇹
              </span>
              <div>
                <h5 className="text-sm font-black text-slate-800">
                  Dienos žodis (Word of the Day)
                </h5>
                <p className="text-xs text-slate-500">
                  Morning notification with an authentic word, translation & cultural tip.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings.wordOfDay}
              onChange={() => handleToggleChannel('wordOfDay')}
              className="h-5 w-5 accent-indigo-600 rounded-md cursor-pointer mt-1"
            />
          </div>

          {/* Channel 3: Hearts Restored */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-200 text-lg">
                ❤️
              </span>
              <div>
                <h5 className="text-sm font-black text-slate-800">
                  Širdelės pilnos (Hearts Refilled Alert)
                </h5>
                <p className="text-xs text-slate-500">
                  Notifies you when your health is back to 5/5 so you can practice again.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings.heartsRefill}
              onChange={() => handleToggleChannel('heartsRefill')}
              className="h-5 w-5 accent-indigo-600 rounded-md cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Test Notification Action */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-5">
          <button
            type="button"
            onClick={handleSendTest}
            className="btn-3d px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Išbandyti • Send Test</span>
          </button>

          {testSent ? (
            <span className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered! Check your screen.</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">
              Test sound, badge & delivery instantly
            </span>
          )}
        </div>

        {/* iPhone Note */}
        <div className="mb-5 flex items-center gap-2 text-[11px] text-slate-400">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>iPhone / iPad:</strong> Web Push requires adding app to Home Screen (Share → &quot;Add to Home Screen&quot;, iOS 16.4+).
          </span>
        </div>

        {/* Done / Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-3d btn-green-3d w-full py-3 text-center text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          Išsaugoti ir Uždaryti • Done
        </button>
      </div>
    </div>
  );
};
