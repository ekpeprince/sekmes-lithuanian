'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Dumbbell, GraduationCap, User, Sparkles, Trophy, Gamepad2 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Learn', mobileLabel: 'Learn', icon: BookOpen },
  { href: '/battle', label: 'Friend Battle ⚔️', mobileLabel: 'Battle', icon: Gamepad2 },
  { href: '/tutor', label: 'AI Tutor', mobileLabel: 'Tutor', icon: Sparkles },
  { href: '/practice', label: 'Practice', mobileLabel: 'Practice', icon: Dumbbell },
  { href: '/leaderboard', label: 'Amber League', mobileLabel: 'League', icon: Trophy },
  { href: '/grammar', label: 'Grammar Bank', mobileLabel: 'Grammar', icon: GraduationCap },
  { href: '/profile', label: 'Profile', mobileLabel: 'Profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  // If in active lesson runner, don't show sidebar/bottom bar to maximize focus
  if (pathname.startsWith('/lesson/')) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar (Left column) */}
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-slate-200 bg-white min-h-[calc(100vh-65px)] p-4 shrink-0">
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 border-2 border-sky-200'
                    : 'text-slate-600 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick motivation card in sidebar */}
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🇱🇹</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Lithuanian Fact</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
            Lithuanian is one of the oldest living Indo-European languages in the world, preserving ancient Sanskrit-like roots!
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t-2 border-slate-200 bg-white/95 backdrop-blur-md px-1 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all ${
                isActive
                  ? 'text-sky-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-sky-500 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{item.mobileLabel || item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
