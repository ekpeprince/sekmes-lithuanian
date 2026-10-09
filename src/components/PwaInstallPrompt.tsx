'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share } from 'lucide-react';
import { autoPromptNotificationsOnAuth } from '@/lib/notifications';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && !/crios|fxios/.test(userAgent);
  });
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('sekmes_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA ServiceWorker registered successfully with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('PWA ServiceWorker registration notice:', error);
          });
      });
    }

    // 2. Check if already installed / running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();
    if (standalone) return;

    // 3. Capture BeforeInstallPrompt for Android & Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Detect successful install
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsDismissed(true);
      console.log('LabasApp PWA was installed successfully!');
      void autoPromptNotificationsOnAuth();
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        void autoPromptNotificationsOnAuth();
      }
      setDeferredPrompt(null);
      setIsDismissed(true);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('sekmes_pwa_dismissed', 'true');
  };

  // Hide prompt during active lessons to avoid blocking exercises or check buttons
  if (pathname.startsWith('/lesson/')) {
    return null;
  }

  // If already running standalone or dismissed, do not render
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only render if we have a prompt available or if user is on iOS
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <aside aria-label="Install LabasApp" className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[410px] z-50 animate-pop">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 p-0.5 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 font-black text-white">
              LT
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold tracking-tight text-white">
                Install <span className="notranslate" translate="no">LabasApp</span>
              </h4>
              <p className="text-xs text-slate-400 font-normal leading-tight mt-0.5">
                Fast, offline-ready & fullscreen learning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn-3d py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs tracking-wide rounded-xl shadow-md active:scale-95 flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-pop">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-100 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-sm">
                  📱
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                  <p className="text-xs text-slate-500 font-medium">Safari Quick Setup Guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    Tap the Share button
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    Tap <Share className="h-3.5 w-3.5 text-sky-600 inline" /> at the bottom bar of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    Select &apos;Add to Home Screen&apos;
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Scroll down through the share options and tap &quot;Add to Home Screen&quot;.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    Tap &apos;Add&apos; to Finish
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tap &quot;Add&quot; in the top-right corner to launch the fullscreen app anytime!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="btn-3d w-full mt-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
