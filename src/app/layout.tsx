import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/context/GameContext';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Sėkmės – Learn Lithuanian (A1 Gamified Course)',
  description: 'Duolingo-style gamified interactive web app for learning Lithuanian vocabulary, verb conjugations, and noun cases.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt">
      <body className="min-h-screen bg-[#f7fafc] text-slate-800 flex flex-col antialiased">
        <GameProvider>
          <Navbar />
          <div className="flex-1 flex w-full">
            <Sidebar />
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </GameProvider>
      </body>
    </html>
  );
}
