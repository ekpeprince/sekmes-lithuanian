import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/context/GameContext';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { TelemetryTracker } from '@/components/TelemetryTracker';
// import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
// import { IosZoomLock } from '@/components/IosZoomLock';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.labasapp.com'),
  title: {
    default: 'LabasApp – Learn Lithuanian: Gamified Lessons, AI Speaking & Grammar',
    template: '%s • LabasApp',
  },
  description:
    'Master Lithuanian online with gamified lessons, AI speaking tutor Leonas, noun cases, alphabet pronunciation, and essential vocabulary for global learners.',
  keywords: [
    // Language Learning & Courses
    'learn Lithuanian',
    'Lithuanian for beginners',
    'Lithuanian lessons',
    'Lithuanian alphabet',
    'Lithuanian cases',
    'AI Lithuanian speaking tutor',
    'Lithuanian language learning',
    'Lithuanian app',
    'speak Lithuanian',
    'Lithuanian grammar',
    'Lithuanian noun cases',
    'Lithuanian vocabulary',
    'Lithuanian AI tutor',
    'Duolingo Lithuanian alternative',
    'learn Lithuanian online',

    // Translations & Dictionaries context
    'Lithuanian dictionary phrases',
    'translate to Lithuanian practice',

    // Basic Vocabulary & Phrases
    'Labas Lithuanian greeting',
    'Lithuanian basic vocabulary numbers',
    'essential Lithuanian phrases',

    // Linguistic Facts & History
    'oldest language in Europe Lithuanian',
    'Baltic languages grammar',
  ],
  authors: [{ name: 'LabasApp' }],
  creator: 'LabasApp',
  publisher: 'LabasApp',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.labasapp.com',
    siteName: 'LabasApp',
    title: 'LabasApp – Learn Lithuanian Online',
    description:
      'Gamified lessons, AI speaking practice, and grammar for anyone wanting to master Lithuanian.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LabasApp - Learn Lithuanian',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LabasApp – Learn Lithuanian Online',
    description:
      'Gamified lessons, AI speaking practice, and grammar for anyone wanting to master Lithuanian.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://www.labasapp.com',
  },
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
    title: 'LabasApp',
  },
  other: {
    google: 'notranslate',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LabasApp',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  description:
    'Comprehensive gamified Lithuanian language learning platform featuring interactive lessons, AI conversational speaking tutor, complete grammar reference, and multiplayer battles.',
  url: 'https://www.labasapp.com',
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans min-h-screen bg-[#f7fafc] text-slate-800 flex flex-col antialiased`}>
        <AuthProvider>
          <GameProvider>
            <TelemetryTracker />
            {/* Guarded for iOS WebKit stability */}
            {/* <IosZoomLock /> */}
            <Navbar />
            <div className="flex-1 flex w-full">
              <Sidebar />
              <main className="flex-1 min-w-0 flex flex-col">
                {children}
              </main>
            </div>
            <PwaInstallPrompt />
            {/* <NotificationPermissionPrompt /> */}
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
