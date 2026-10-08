'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
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
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const isEnabled = settings.enabled && permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100 text-center animate-pop">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
          {isEnabled ? <BellRing className="h-8 w-8 text-indigo-600" /> : <Bell className="h-8 w-8 text-slate-400" />}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
          Pranešimai & Priminimai
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Daily reminders, streak protection & word of the day
        </p>

        {/* Master Toggle Pill */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 text-left">
          <div>
            <div className="text-xs font-black text-slate-800">
              {isEnabled ? 'Pranešimai aktyvūs 🔔' : 'Įjungti pranešimus'}
            </div>
            <div className="text-[11px] text-slate-500">
              {isEnabled ? 'Daily practice alerts enabled' : 'Tap to allow notifications'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleMasterToggle}
            disabled={isRequesting}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Channels */}
        {isEnabled && (
          <div className="space-y-2.5 mb-4 text-left">
            {/* Streak Reminder & Time */}
            <div className="p-3 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔥</span>
                  <span className="text-xs font-black text-slate-800">Streak Reminder</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.streakReminders}
                  onChange={() => handleToggleChannel('streakReminders')}
                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {settings.streakReminders && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {['09:00', '12:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeChange(time)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all ${
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

            {/* Word of the Day */}
            <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🇱🇹</span>
                <span className="text-xs font-black text-slate-800">Word of the Day</span>
              </div>
              <input
                type="checkbox"
                checked={settings.wordOfDay}
                onChange={() => handleToggleChannel('wordOfDay')}
                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Hearts Refilled */}
            <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">❤️</span>
                <span className="text-xs font-black text-slate-800">Hearts Refilled Alert</span>
              </div>
              <input
                type="checkbox"
                checked={settings.heartsRefill}
                onChange={() => handleToggleChannel('heartsRefill')}
                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Test Notification Row */}
        <div className="flex items-center justify-between mb-4 pt-1">
          <button
            type="button"
            onClick={handleSendTest}
            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Notification</span>
          </button>

          {testSent && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sent!</span>
            </span>
          )}
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-3d btn-green-3d w-full py-3 text-center text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          Išsaugoti • Done
        </button>
      </div>
    </div>
  );
};
