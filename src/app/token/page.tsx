'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Flame,
  ArrowRight,
  Globe,
  Sparkles,
  BarChart3,
  Layers,
  Repeat,
  Lock,
} from 'lucide-react';
import { LithuanianFlagEmblem } from '@/components/LithuanianFlagEmblem';

const ISSUER_ADDRESS = 'GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND';
const ASSET_CODE = 'LABASCOIN';
const TOTAL_SUPPLY = '100,000,000,000';

export default function TokenPortalPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyIssuer = () => {
    navigator.clipboard.writeText(ISSUER_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 md:pb-16 space-y-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-12 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stellar Mainnet Native Asset</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">$LABASCOIN</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            The decentralized fuel connecting global language learners with liquidity providers. 
            Earned through verified Lithuanian vocabulary mastery, traded on the high-speed Stellar Decentralized Exchange.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-3d btn-green-3d py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-lg hover:brightness-105 transition"
            >
              <Coins className="w-4 h-4" />
              <span>Trade on Lobstr</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <a
              href="https://stellar.expert/explorer/public/asset/LABASCOIN-GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-white border border-slate-700 transition"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Stellar.expert Analytics</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://labasapp.com/.well-known/stellar.toml"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>SEP-0001 TOML</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Key On-Chain Metrics Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Supply
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {TOTAL_SUPPLY}
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">
            Fixed 100B Cap (No Inflation)
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Blockchain
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-1.5">
            Stellar
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">
            Public Mainnet
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Average Fee
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            &lt; $0.00001
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">
            Sponsored for Students
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Settlement Speed
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            3-5 Seconds
          </span>
          <span className="text-xs text-emerald-600 font-bold block mt-1">
            Instant Finality
          </span>
        </div>
      </section>

      {/* 3. Official Issuer Contract Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Official Asset Contract Parameters</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Always verify the Issuer Public Key before adding or trading custom assets on Stellar DEX.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-black self-start sm:self-auto">
            Mainnet Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Asset Code
            </span>
            <span className="text-lg font-mono font-black text-slate-900">
              {ASSET_CODE}
            </span>
          </div>

          <div className="md:col-span-9 bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Asset Issuer Public Key
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 break-all">
                {ISSUER_ADDRESS}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyIssuer}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Dual-Engine Ecosystem: Learners vs Traders */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            The Dual-Engine Economy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            How education and decentralized trading create a self-sustaining micro-reward ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Engine 1: Learners */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">1. For Learners (The Demand Engine)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Students complete interactive Lithuanian drills, Leonas AI speaking practice, and grammar quizzes. 
              Learning XP converts at <strong>100 XP = 1 $LABASCOIN</strong>, deposited gasless to their Stellar wallet.
            </p>
            <ul className="space-y-2 text-xs font-bold text-slate-700 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Zero fees &ndash; 100% sponsored onboarding</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Rewards daily consistency & fluency milestones</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Spends token for pro features or holds for value</span>
              </li>
            </ul>
          </div>

          {/* Engine 2: Traders & Liquidity Providers */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">2. For Traders (The Liquidity Engine)</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Traders buy, sell, and provide market liquidity on the Stellar DEX. 
              Liquidity providers earn <strong>0.3% protocol trading fees</strong> on automated market maker (AMM) swaps.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-200 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>Arbitrage & AMM trading via XLM/LABASCOIN pools</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>Benefit from protocol buyback & burn mechanics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>
                <span>No lockups &ndash; trade 24/7 on decentralized orderbooks</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Utility Sinks & Value Drivers */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
            Tokenomics & Utility
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Why Traders & Learners Hold $LABASCOIN
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">Buyback & Burn</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              A portion of app subscription revenue buys $LABASCOIN from the open market to permanently burn supply.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">App Subscription Discounts</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paying for LabasApp Pro with $LABASCOIN provides a 20% discount compared to traditional fiat payments.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">AMM Yield (0.3% Fees)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deposit XLM and LABASCOIN into the Stellar Liquidity Pool to collect passive 0.3% fees on every swap.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">HODL Tier Privileges</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Holders unlock bonus voice minutes with Leonas AI tutor and exclusive leaderboard badge recognition.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Step-by-Step Guide for New Traders */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Quick Start Guide
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            How to Trade $LABASCOIN in 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="text-xs font-black text-emerald-400 font-mono">STEP 01</span>
            <h4 className="text-base font-bold text-white">Open Stellar Wallet</h4>
            <p className="text-xs text-slate-300">
              Open Lobstr (mobile or web), StellarX, or Freighter wallet and ensure you have a small XLM balance for transaction reserves.
            </p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="text-xs font-black text-emerald-400 font-mono">STEP 02</span>
            <h4 className="text-base font-bold text-white">Add Asset Trustline</h4>
            <p className="text-xs text-slate-300">
              Search <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">LABASCOIN</code> or paste the issuer address <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">GBF7L...TZND</code> and tap &quot;Add Asset&quot;.
            </p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="text-xs font-black text-emerald-400 font-mono">STEP 03</span>
            <h4 className="text-base font-bold text-white">Swap or Place Order</h4>
            <p className="text-xs text-slate-300">
              Head to Trade or Swap. Select <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">LABASCOIN/XLM</code> to place market orders or buy directly from the pool.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-center sm:justify-start">
          <a
            href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d btn-green-3d py-3 px-6 rounded-2xl text-xs font-black inline-flex items-center gap-2"
          >
            <span>Open Verified Asset on Lobstr</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 7. Return to Learning CTA */}
      <section className="text-center bg-white rounded-3xl p-8 border border-slate-200/90 shadow-2xs space-y-4">
        <LithuanianFlagEmblem size="lg" />
        <h3 className="text-xl font-black text-slate-900">
          Want to Earn $LABASCOIN for Free?
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Start speaking Lithuanian today. Master vocabulary, complete Aistė voice drills, and earn micro-rewards sent directly to your Stellar wallet.
        </p>
        <Link
          href="/"
          className="btn-3d btn-green-3d py-3 px-8 rounded-2xl text-xs font-black inline-flex items-center gap-2"
        >
          <span>Start Learning Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
