import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '$LABASCOIN • Official Stellar Mainnet Token Portal',
  description:
    'Learn Lithuanian and earn real Stellar Mainnet micro-rewards. Verified SEP-0001 asset with 24/7 on-chain DEX and AMM liquidity. Trade or earn with zero gas fees.',
  openGraph: {
    title: '$LABASCOIN • Official Stellar Mainnet Token & AMM Portal',
    description:
      'The micro-reward and utility asset of LabasApp. Earned by practicing Lithuanian, tradeable 24/7 on Stellar DEX & AMM pools with instant 3.5s finality.',
    url: 'https://labasapp.com/token',
    siteName: 'LabasApp',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: '$LABASCOIN on Stellar Mainnet',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '$LABASCOIN • Learn Lithuanian & Earn on Stellar',
    description:
      'Earn real crypto micro-rewards by completing Lithuanian lessons and AI drills. 24/7 AMM liquidity on Stellar DEX.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://labasapp.com/token',
  },
};

export default function TokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

