'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
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
      console.log('Sėkmės PWA was installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
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
      <aside aria-label="Install App" className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-pop">
        <div className="rounded-3xl bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-2xl border-2 border-emerald-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 p-1 flex items-center justify-center text-xl shadow-md shadow-emerald-500/30">
              🇱🇹
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black tracking-tight text-white truncate">
                  Įdiek Sėkmės • Install App
                </h4>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                Pilno ekrano režimas • Fullscreen app, fast launch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn-3d py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 stroke-[3]" />
              <span>Įdiegti • Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Praleisti • Dismiss"
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
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  📱
                </div>
                <div>
                  <h3 className="text-base font-black">Kaip įdiegti į iPhone • How to Install</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Apple iOS Safari nurodymai (Safari Guide)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[11px]">
                  1
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">
                    1. Spustelėkite mygtuką „Dalintis“ (Share)
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    Tap the <Share className="h-3.5 w-3.5 text-sky-600 inline" /> Share button at the bottom of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[11px]">
                  2
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">
                    2. Pasirinkite „Pridėti prie pagrindinio ekrano“
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Scroll down and tap &quot;Add to Home Screen&quot; ⊞.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[11px]">
                  3
                </span>
                <div>
                  <p className="font-extrabold text-slate-900">
                    3. Spustelėkite „Pridėti“ (Add)
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tap &quot;Add&quot; in the top-right corner to launch fullscreen app anytime!
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
              className="btn-3d w-full mt-5 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
            >
              Supratau • Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
