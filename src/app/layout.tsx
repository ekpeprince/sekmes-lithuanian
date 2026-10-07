import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/context/GameContext';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Sėkmės – Learn Lithuanian (A1 Gamified Course)',
  description: 'Duolingo-style gamified interactive web app for learning Lithuanian vocabulary, verb conjugations, noun cases, and AI conversations.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sėkmės!',
  },
  other: {
    google: 'notranslate',
  },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body className="min-h-screen bg-[#f7fafc] text-slate-800 flex flex-col antialiased">
        <AuthProvider>
          <GameProvider>
            <Navbar />
            <div className="flex-1 flex w-full">
              <Sidebar />
              <main className="flex-1 min-w-0 pb-20 md:pb-6">
                {children}
              </main>
            </div>
            <PwaInstallPrompt />
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
