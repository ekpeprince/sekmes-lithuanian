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
  Globe,
  BarChart3,
  Layers,
  Lock,
  Coins,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Code2,
  Database,
} from 'lucide-react';
import { LithuanianFlagEmblem } from '@/components/LithuanianFlagEmblem';

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
    <div className="flex-1 w-full bg-[#f7fafc] min-h-screen text-slate-800 antialiased">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-28 md:pb-20 space-y-12">
        
        {/* =====================================================================
         * 1. CLEAN HERO SECTION: TWO PRIMARY ACTIONS ONLY
         * =================================================================== */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] text-white p-6 sm:p-10 lg:p-14 shadow-xl shadow-emerald-950/15 border-2 border-emerald-600/30 overflow-hidden">
          {/* Subtle Warm Amber Micro-Glow Accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FDB913]/25 via-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 left-10 w-64 h-64 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Focused Value Proposition & 2 Primary Actions */}
            <div className="lg:col-span-8 space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-black tracking-wide uppercase shadow-2xs backdrop-blur-sm">
                  <StellarMark className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>Stellar Mainnet Asset</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-100 text-xs font-bold backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>SEP-0001 Verified</span>
                </span>
              </div>

              {/* Title & Concise Professional Description */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Meet <span className="text-[#FDB913] drop-shadow-sm">$LABASCOIN</span>
                </h1>
                <p className="text-sm sm:text-base text-emerald-50 max-w-2xl leading-relaxed font-normal">
                  The native micro-reward and liquidity token of LabasApp. Earned organically through verified Lithuanian vocabulary mastery and AI voice drills, settled with instant finality on the Stellar network.
                </p>
              </div>

              {/* STRICT TWO PRIMARY ACTIONS ONLY */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Action 1: Trade on SDEX / LOBSTR */}
                <a
                  href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-[#FDB913] hover:bg-[#f5b002] text-slate-950 text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>Trade on SDEX / LOBSTR</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                {/* Action 2: Copy Asset Key */}
                <button
                  type="button"
                  onClick={() => handleCopy(ISSUER_ADDRESS, 'issuer')}
                  className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
                >
                  {copiedIssuer ? (
                    <>
                      <Check className="w-4 h-4 text-[#FDB913]" />
                      <span className="text-white font-black">Copied Asset Key!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-200" />
                      <span>Copy Asset Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Official Brand Emblem */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative p-6 sm:p-7 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl flex flex-col items-center text-center w-full max-w-[280px]">
                {/* Official Logo Frame with Amber Border */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white p-2.5 border-4 border-[#FDB913] shadow-lg flex items-center justify-center mb-3">
                  <Image
                    src="/icons/icon-512.png"
                    alt="Official LabasApp Logo"
                    width={96}
                    height={96}
                    priority
                    className="h-full w-full object-contain rounded-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-[#047857] border-2 border-white text-white shadow-xs">
                    <StellarMark className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-white space-y-0.5">
                  <h3 className="text-base font-black tracking-tight">
                    $LABASCOIN
                  </h3>
                  <p className="text-[11px] font-bold text-[#FDB913] uppercase tracking-wider">
                    Official Token
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/15 w-full flex items-center justify-center gap-1 text-[11px] text-emerald-100 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FDB913]" />
                  <span>labasapp.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 2. ON-CHAIN METRICS SUMMARY
         * =================================================================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-emerald-600 absolute top-0 left-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Fixed Supply
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {TOTAL_SUPPLY}
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              Hard-Capped • 0 Inflation
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-[#FDB913] absolute top-0 left-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Blockchain
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Stellar</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold block mt-1">
              Public Mainnet Ledger
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-emerald-600 absolute top-0 left-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Network Fee
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              &lt; $0.00001
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              Sponsored for Students
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs relative overflow-hidden">
            <div className="h-1.5 w-full bg-teal-600 absolute top-0 left-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Finality Speed
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3.5s
            </div>
            <span className="text-[11px] text-teal-700 font-bold block mt-1">
              Instant Settlement
            </span>
          </div>
        </section>


        {/* =====================================================================
         * 3. VERIFIED ON-CHAIN PARAMETERS
         * =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified Asset Coordinates</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Official issuer key and parameters published under SEP-0001 standards.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Horizon Verified</span>
            </span>
          </div>

          <div className="space-y-3">
            {/* Asset Code */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Asset Code (Ticker)
              </div>
              <div className="md:col-span-9 font-mono text-base font-black text-emerald-700">
                {ASSET_CODE}
              </div>
            </div>

            {/* Issuer Account */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Issuer Anchor Account
              </div>
              <div className="md:col-span-7 font-mono text-xs sm:text-sm font-bold text-slate-800 break-all">
                {ISSUER_ADDRESS}
              </div>
              <div className="md:col-span-2 flex justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(ISSUER_ADDRESS, 'issuer')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Treasury / Distribution
              </div>
              <div className="md:col-span-7 font-mono text-xs sm:text-sm font-bold text-slate-800 break-all">
                {DISTRIBUTION_WALLET}
              </div>
              <div className="md:col-span-2 flex justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(DISTRIBUTION_WALLET, 'distributor')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
         * 4. TWO-SIDED MARKET MECHANICS
         * =================================================================== */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              The Dual-Engine Economy
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Bridging educational proof-of-work with decentralized market liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Engine 1: Learners (Emerald) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200/90 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-200 flex items-center justify-center font-black shadow-xs">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Demand Engine</span>
                  <h3 className="text-xl font-black text-slate-900">1. For Learners & Students</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Learners practice Lithuanian vocabulary, speech drills with Leonas AI, and noun cases. XP automatically converts into $LABASCOIN (100 XP = 1 $LABAS) delivered gasless to their wallet.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>100% sponsored fees &ndash; zero XLM needed to receive rewards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Daily streak incentives create constant organic distribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Spend for Pro features or withdraw to any Stellar wallet</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs font-semibold text-emerald-900">
                Creates daily active on-chain holders and real non-speculative utility.
              </div>
            </div>

            {/* Engine 2: Traders (Amber) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200/90 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 border-2 border-amber-200 flex items-center justify-center font-black shadow-xs">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Liquidity Engine</span>
                  <h3 className="text-xl font-black text-slate-900">2. For Traders & Liquidity Providers</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Traders and liquidity providers trade $LABASCOIN on the open Stellar DEX. Automated Market Maker (AMM) pools enable instant swap liquidity with zero KYC and non-custodial custody.
                </p>
                <div className="space-y-2 text-xs font-bold text-slate-700 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Earn 0.30% fees on all XLM/LABASCOIN swap transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Decentralized 24/7 orderbooks via Lobstr, StellarX, and SDEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Structural buy pressure from protocol subscription buyback</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-semibold text-amber-900">
                Establishes fair market depth, tight spreads, and real cash valuation.
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 5. SUSTAINABLE TOKENOMICS & UTILITY
         * =================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Sustainable Tokenomics
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Why Traders & Learners Hold $LABASCOIN
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">Buyback & Burn</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Protocol revenue generated from premium subscriptions periodically buys $LABASCOIN from SDEX to burn supply.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">20% Subscription Discount</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Subscribers paying for LabasApp Pro using $LABASCOIN receive a 20% discount compared to fiat payments.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">AMM 0.3% Swap Yield</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Pair $LABASCOIN with XLM into the native Stellar Liquidity Pool to collect automatic 0.30% swap fees.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">HODL Perks & AI Minutes</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Verified wallet holders unlock bonus voice minutes with Leonas AI tutor and exclusive profile badges.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 6. TECHNICAL METADATA FOOTER & DEVELOPER RESOURCES
         * (Moved raw technical links: stellar.toml, analytics, API down here)
         * =================================================================== */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold text-[#FDB913] uppercase tracking-wider">Protocol Specifications</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Technical Metadata & Verification Endpoints
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Deterministic Public Ledger
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            All cryptographic assets, home domain affiliations, and smart ledger proofs are open and programmatically auditable through Stellar Ecosystem Proposals (SEP) and public Horizon endpoints.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* SEP-0001 TOML Link */}
            <a
              href="https://labasapp.com/.well-known/stellar.toml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                    stellar.toml (SEP-0001)
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Cryptographic metadata linking labasapp.com to the on-chain issuer account.
              </p>
              <span className="text-xs font-bold text-emerald-400 block pt-1">
                View Raw TOML Spec &rarr;
              </span>
            </a>

            {/* Stellar.expert Analytics */}
            <a
              href="https://stellar.expert/explorer/public/asset/LABASCOIN-GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#FDB913]" />
                  <span className="text-sm font-black text-white group-hover:text-[#FDB913] transition-colors">
                    Stellar.expert Analytics
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#FDB913] transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Public blockchain ledger explorer tracking transactions, volume, and holders.
              </p>
              <span className="text-xs font-bold text-[#FDB913] block pt-1">
                Inspect Ledger Analytics &rarr;
              </span>
            </a>

            {/* Horizon Asset Endpoint */}
            <a
              href="https://horizon.stellar.org/assets?asset_code=LABASCOIN&asset_issuer=GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-black text-white group-hover:text-teal-300 transition-colors">
                    Horizon Asset JSON API
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Direct live JSON endpoint from the Stellar Horizon Mainnet validator nodes.
              </p>
              <span className="text-xs font-bold text-teal-400 block pt-1">
                Query Horizon Node &rarr;
              </span>
            </a>
          </div>
        </section>


        {/* =====================================================================
         * 7. ORGANIC FOOTER BANNER
         * =================================================================== */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-amber-50/30 p-8 sm:p-10 border-2 border-emerald-200 text-center space-y-5">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-center mb-1">
              <LithuanianFlagEmblem size="md" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Earn $LABASCOIN While Learning
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Join students mastering Lithuanian on LabasApp. Complete lessons, maintain streaks, and claim your rewards on Stellar Mainnet.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black transition shadow-sm"
            >
              <span>Start Learning Lithuanian</span>
            </Link>

            <Link
              href="/profile"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-200 text-xs sm:text-sm font-black transition shadow-2xs"
            >
              <span>View Profile & Rewards</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
