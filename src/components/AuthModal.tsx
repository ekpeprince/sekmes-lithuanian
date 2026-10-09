'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { autoPromptNotificationsOnAuth } from '@/lib/notifications';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        void autoPromptNotificationsOnAuth();
        onClose();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Slaptažodis turi būti bent 6 simbolių ilgio.');
          setIsSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, name || undefined);
        void autoPromptNotificationsOnAuth();
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccessMsg('Slaptažodžio atstatymo nuoroda išsiųsta į jūsų el. paštą!');
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const code = authErr?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Neteisingas el. paštas arba slaptažodis.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Šis el. pašto adresas jau užregistruotas.');
      } else if (code === 'auth/invalid-email') {
        setError('Neteisingas el. pašto formatas.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Prisijungimo langas buvo uždarytas.');
      } else {
        setError(authErr?.message || 'Įvyko klaida bandant prisijungti.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      void autoPromptNotificationsOnAuth();
      onClose();
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (authErr?.code !== 'auth/popup-closed-by-user') {
        setError(authErr?.message || 'Nepavyko prisijungti su Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border-2 border-slate-100 animate-pop">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'signin' && 'Prisijungti prie paskyros'}
            {mode === 'signup' && 'Sukurti naują paskyrą'}
            {mode === 'forgot' && 'Atkurti slaptažodį'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
            {mode === 'signin' && 'Išsaugokite savo XP, pasiekimus ir mokymosi seriją debesyje'}
            {mode === 'signup' && 'Pradėkite mokytis lietuvių kalbos ir stebėkite pažangą'}
            {mode === 'forgot' && 'Įveskite savo el. paštą ir mes atsiųsime atstatymo nuorodą'}
          </p>
        </div>

        {/* Unconfigured Alert Notice */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="block font-black mb-0.5">Firebase konfigūracija</span>
              Įrašykite savo Firebase API raktus į failą <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env.local</code>, kad aktyvuotumėte tiesioginį Google ir el. pašto prisijungimą.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3 font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Prisijungti su Google</span>
            </button>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Arba su el. paštu
              </span>
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Jūsų vardas</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="pvz., Jonas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-base font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">El. paštas</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="vardas@pavyzdys.lt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-base font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-slate-700">Slaptažodis</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Pamiršote?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-base font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-3d btn-green-3d mt-2 w-full py-3 text-center text-sm font-black tracking-wide cursor-pointer"
          >
            {isSubmitting ? 'Kraunama...' : mode === 'signin' ? 'PRISIJUNGTI' : mode === 'signup' ? 'SUKURTI PASKYRĄ' : 'SIŲSTI NUORODĄ'}
          </button>

          {mode !== 'forgot' && (
            <p className="mt-2.5 text-center text-[11px] leading-relaxed text-slate-400 font-medium">
              Prisijungdami sutinkate su{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-600 underline hover:text-emerald-600">
                Sąlygomis
              </a>
              ,{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-600 underline hover:text-emerald-600">
                Privatumo politika
              </a>{' '}
              ir sutinkate gauti kasdienius mokymosi priminimus bei naujienas.
            </p>
          )}
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 text-center text-xs font-bold text-slate-500">
          {mode === 'signin' && (
            <p>
              Dar neturite paskyros?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-emerald-600 hover:underline font-extrabold"
              >
                Užsiregistruokite čia
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Jau turite paskyrą?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-emerald-600 hover:underline font-extrabold"
              >
                Prisijunkite čia
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Prisiminėte slaptažodį?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-emerald-600 hover:underline font-extrabold"
              >
                Grįžti į prisijungimą
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
