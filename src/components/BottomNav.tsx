'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Dumbbell, Trophy, User } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matches: (pathname: string) => boolean;
}

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Learn',
    icon: BookOpen,
    matches: (pathname: string) => pathname === '/',
  },
  {
    href: '/tutor',
    label: 'Leonas AI',
    icon: Sparkles,
    matches: (pathname: string) => pathname.startsWith('/tutor'),
  },
  {
    href: '/practice',
    label: 'Practice',
    icon: Dumbbell,
    // Group Grammar into the Practice hub
    matches: (pathname: string) => pathname.startsWith('/practice') || pathname.startsWith('/grammar'),
  },
  {
    href: '/leaderboard',
    label: 'League',
    icon: Trophy,
    // Nest 1v1 Battles inside the League hub
    matches: (pathname: string) => pathname.startsWith('/leaderboard') || pathname.startsWith('/league') || pathname.startsWith('/battle'),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    matches: (pathname: string) => pathname.startsWith('/profile'),
  },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  // If in active lesson runner, don't show bottom navigation bar to maximize focus
  if (pathname.startsWith('/lesson/')) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-1 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex-1 flex flex-col items-center justify-center min-h-[48px] h-12 py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 select-none ${
              isActive
                ? 'text-emerald-600 font-extrabold bg-emerald-50/50'
                : 'text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-50/50'
            }`}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-emerald-500 shadow-xs" />
            )}

            <div
              className={`flex items-center justify-center rounded-xl transition-all duration-150 ${
                isActive ? 'scale-110 text-emerald-600' : 'group-hover:scale-105 text-slate-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            </div>

            <span
              className={`text-[10px] leading-tight mt-0.5 tracking-tight transition-colors ${
                isActive ? 'text-emerald-700 font-black' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
