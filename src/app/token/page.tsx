'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Flame,
  ArrowRight,
  Globe,
  BarChart3,
  Layers,
  Lock,
  Coins,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const ISSUER_ADDRESS = 'GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND';
const DISTRIBUTION_WALLET = 'GAPNDHNHEWNMKY7N4Q6E3PNVIW36KZ6PDKAOPAEOH73W2YOAPOWYWTFO';
const ASSET_CODE = 'LABASCOIN';
const TOTAL_SUPPLY = '100,000,000,000';

const StellarMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3.5 15.5L20.5 8.5M3.5 12L20.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function TokenPortalPage() {
  const [copiedIssuer, setCopiedIssuer] = useState(false);
  const [copiedDistributor, setCopiedDistributor] = useState(false);

  const handleCopy = (text: string, type: 'issuer' | 'distributor') => {
    navigator.clipboard.writeText(text);
    if (type === 'issuer') {
      setCopiedIssuer(true);
      setTimeout(() => setCopiedIssuer(false), 2000);
    } else {
      setCopiedDistributor(true);
      setTimeout(() => setCopiedDistributor(false), 2000);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fafbfc] min-h-screen text-slate-900 antialiased">
      {/* Background Subtle Ambience */}
      <div className="relative overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-24 space-y-16">
        
        {/* =====================================================================
         * 1. INSTITUTIONAL HERO SECTION
         * =================================================================== */}
        <section className="relative rounded-3xl bg-slate-950 text-white p-7 sm:p-12 lg:p-16 border border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-emerald-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-8 space-y-6">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                  <StellarMark className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stellar Mainnet Native Asset</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SEP-0001 Verified Issuer</span>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                  The Native Token of <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                    LabasApp Ecosystem
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                  $LABASCOIN powers a decentralized micro-reward economy bridging proof-of-learning incentives with high-velocity liquidity on the Stellar Decentralized Exchange (SDEX).
                </p>
              </div>

              {/* High-Tier Action Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Trade on Lobstr</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://stellar.expert/explorer/public/asset/LABASCOIN-GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Stellar.expert Analytics</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="https://labasapp.com/.well-known/stellar.toml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>stellar.toml</span>
                </a>
              </div>
            </div>

            {/* Right Column: Prestigious Official Brand Emblem */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative group p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl flex flex-col items-center text-center w-full max-w-xs">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all" />

                {/* Official Logo Container */}
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-slate-950 p-3 border-2 border-emerald-500/40 shadow-inner flex items-center justify-center mb-4">
                  <Image
                    src="/icons/icon-512.png"
                    alt="Official LabasApp Emblem"
                    width={112}
                    height={112}
                    priority
                    className="h-full w-full object-contain rounded-xl drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400">
                    <StellarMark className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    $LABASCOIN
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">
                    Official Utility Asset
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Home Domain: labasapp.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 2. AUDITED ON-CHAIN METRICS
         * =================================================================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1 w-full bg-emerald-500 absolute top-0 left-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Fixed Total Supply
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {TOTAL_SUPPLY}
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              Hard-Capped • Zero Inflation
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1 w-full bg-teal-500 absolute top-0 left-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Ledger Consensus
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Stellar SCP
            </div>
            <span className="text-[11px] text-teal-700 font-bold block mt-1.5">
              3.5s Deterministic Finality
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1 w-full bg-slate-900 absolute top-0 left-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Average Network Fee
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              &lt; $0.00001
            </div>
            <span className="text-[11px] text-slate-600 font-bold block mt-1.5">
              100 Stroops Base Reserve
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1 w-full bg-amber-500 absolute top-0 left-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Standard Compliance
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              SEP-0001 / 38
            </div>
            <span className="text-[11px] text-amber-700 font-bold block mt-1.5">
              Automated TOML Discovery
            </span>
          </div>
        </section>


        {/* =====================================================================
         * 3. VERIFIED SMART LEDGER PARAMETERS
         * =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified On-Chain Parameters</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verify asset authenticity across Lobstr, StellarX, Freighter, or any Stellar Horizon client.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Public Horizon Verified</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Asset Code */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Asset Code (Ticker)
              </div>
              <div className="md:col-span-9 font-mono text-base font-black text-slate-900">
                {ASSET_CODE}
              </div>
            </div>

            {/* Issuer Public Key */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Issuer Account (Anchor)
              </div>
              <div className="md:col-span-7 font-mono text-xs sm:text-sm font-bold text-slate-800 break-all">
                {ISSUER_ADDRESS}
              </div>
              <div className="md:col-span-2 flex justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(ISSUER_ADDRESS, 'issuer')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedIssuer ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Distribution Account */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Treasury & Distribution
              </div>
              <div className="md:col-span-7 font-mono text-xs sm:text-sm font-bold text-slate-800 break-all">
                {DISTRIBUTION_WALLET}
              </div>
              <div className="md:col-span-2 flex justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(DISTRIBUTION_WALLET, 'distributor')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedDistributor ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 4. THE TWO-SIDED MARKET ARCHITECTURE
         * =================================================================== */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Institutional Two-Sided Token Mechanics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sustained organic demand meets decentralized capital liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Learner Demand Engine */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Demand Engine</span>
                  <h3 className="text-xl font-black text-slate-900">Proof-of-Learning Ingestion</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Language learners complete structured Lithuanian drills, pronunciation sessions with Leonas AI, and grammar milestones. Rewards are issued on-chain through sponsored zero-reserve transactions.
                </p>
                <div className="pt-2 space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Standard conversion rate: 100 XP = 1.00 $LABASCOIN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Protocol 14 Sponsored Reserves: Zero XLM required from students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Creates active daily wallet holders across global learners</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Result:</strong> Real-world, non-speculative token utility and widespread distribution.
              </div>
            </div>

            {/* Trader Liquidity Engine */}
            <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-lg flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-black">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Liquidity Engine</span>
                  <h3 className="text-xl font-black text-white">DEX Orderbooks & AMM Yield</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  Crypto traders, market makers, and liquidity providers trade $LABASCOIN directly on the Stellar Decentralized Exchange (SDEX). Liquidity providers earn continuous protocol trading fees.
                </p>
                <div className="pt-2 space-y-2.5 text-xs font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>0.30% LP fee generation on XLM/LABASCOIN automated pools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Instant trading without KYC on non-custodial decentralized markets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Full compatibility with DEX aggregators, bots, and arbitrageurs</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <strong>Result:</strong> Deep market liquidity, healthy orderbooks, and accurate price discovery.
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 5. TOKENOMICS & UTILITY ARCHITECTURE
         * =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Protocol Tokenomics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Structural Demand & Holding Incentives
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Buyback & Burn</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Protocol revenue generated from premium subscriptions periodically buys $LABASCOIN from SDEX and burns it, reducing circulating supply.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Subscription Discount</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Learners paying for LabasApp Pro subscriptions using $LABASCOIN receive a 20% discount compared to standard fiat gateways.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 text-base">AMM Pool Staking</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Holders can pair their $LABASCOIN with XLM in the native Stellar Liquidity Pool to collect passive 0.30% swap fees continuously.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 text-base">HODL Tier Governance</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Verified wallet balances unlock exclusive Leonas AI voice minutes, premium cultural modules, and ecosystem voting privileges.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 6. INSTITUTIONAL LIQUIDITY HUBS & TRADING LINKS
         * =================================================================== */}
        <section className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Trading Gateways</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Access $LABASCOIN Across Stellar Markets
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Direct On-Chain Settlement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Lobstr */}
            <a
              href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                  Lobstr Wallet & DEX
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile and web trading interface with instant swap routing and trustline management.
              </p>
              <span className="text-xs font-bold text-emerald-400 pt-2 block">
                Open Lobstr Asset &rarr;
              </span>
            </a>

            {/* Stellar.expert */}
            <a
              href="https://stellar.expert/explorer/public/asset/LABASCOIN-GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                  Stellar.expert Ledger
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Public blockchain ledger explorer tracking transactions, token holders, and orderbook depth.
              </p>
              <span className="text-xs font-bold text-emerald-400 pt-2 block">
                Inspect Ledger Metrics &rarr;
              </span>
            </a>

            {/* Horizon SEP-0001 */}
            <a
              href="https://labasapp.com/.well-known/stellar.toml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                  SEP-0001 Metadata
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Decentralized TOML manifest linking our web home domain to the on-chain issuer credentials.
              </p>
              <span className="text-xs font-bold text-emerald-400 pt-2 block">
                View Raw stellar.toml &rarr;
              </span>
            </a>
          </div>
        </section>


        {/* =====================================================================
         * 7. INSTITUTIONAL FOOTER CALL-TO-ACTION
         * =================================================================== */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Ready to Integrate or Earn $LABASCOIN?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Start learning Lithuanian for free to earn on-chain rewards, or connect your Stellar wallet to participate in the decentralized economy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition shadow-xs"
            >
              <span>Start Learning Lithuanian</span>
            </Link>

            <Link
              href="/profile"
              className="px-6 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold transition"
            >
              <span>Go to Profile & Rewards</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
