'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Dumbbell, User, Sparkles, Trophy } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { LithuanianFlagEmblem } from '@/components/LithuanianFlagEmblem';

const DESKTOP_NAV_ITEMS = [
  {
    href: '/',
    label: 'Learn',
    icon: BookOpen,
    matches: (pathname: string) => pathname === '/',
  },
  {
    href: '/tutor',
    label: 'Aistė AI',
    icon: Sparkles,
    matches: (pathname: string) => pathname.startsWith('/tutor'),
  },
  {
    href: '/practice',
    label: 'Practice',
    icon: Dumbbell,
    matches: (pathname: string) => pathname.startsWith('/practice') || pathname.startsWith('/grammar'),
  },
  {
    href: '/leaderboard',
    label: 'League',
    icon: Trophy,
    matches: (pathname: string) => pathname.startsWith('/leaderboard') || pathname.startsWith('/battle'),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    matches: (pathname: string) => pathname.startsWith('/profile'),
  },
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
        <nav className="flex flex-col gap-1.5">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.matches(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100/80 border-2 border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick motivation card in sidebar */}
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <LithuanianFlagEmblem size="sm" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Lithuanian Fact</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
            Lithuanian is one of the oldest living Indo-European languages in the world, preserving ancient Sanskrit-like roots!
          </p>
        </div>
      </aside>

      {/* Mobile Streamlined 5-Tab Bottom Navigation Bar */}
      <BottomNav />
    </>
  );
};
