'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  Globe,
  BarChart3,
  Database,
  ArrowRight,
} from 'lucide-react';

const ISSUER_ADDRESS = 'GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ISSUER_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 w-full bg-[#f7fafc] min-h-screen text-slate-800 antialiased">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-24 space-y-10">
        
        {/* =====================================================================
         * 1. CLEAN HERO (FOCUSED, ORGANIC, DECLUTTERED)
         * =================================================================== */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] text-white p-7 sm:p-12 shadow-xl shadow-emerald-950/10 border-2 border-emerald-600/30 overflow-hidden">
          {/* Subtle Warm Amber Light Accent */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#FDB913]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Official Logo Emblem */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white p-2 border-2 border-[#FDB913] shadow-lg shrink-0 flex items-center justify-center">
              <Image
                src="/icons/icon-512.png"
                alt="Official LabasApp Logo"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain rounded-xl"
              />
              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-[#047857] border border-white text-white shadow-2xs">
                <StellarMark className="w-3 h-3" />
              </div>
            </div>

            {/* Headline & Focused Pitch */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-black tracking-wide uppercase">
                  <StellarMark className="w-3 h-3 text-[#FDB913]" />
                  <span>Stellar Mainnet</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-emerald-100 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#FDB913]" />
                  <span>SEP-0001 Verified</span>
                </span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  $LABASCOIN
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-xl">
                  The native micro-reward and liquidity token of LabasApp. Earned by mastering Lithuanian lessons and voice drills, settled with instant finality on the Stellar network.
                </p>
              </div>

              {/* TWO PRIMARY ACTIONS ONLY */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <a
                  href="https://lobstr.co/assets/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-[#FDB913] hover:bg-[#f5b002] text-slate-950 text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>Trade on SDEX / LOBSTR</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#FDB913]" />
                      <span className="text-white font-black">Copied Key!</span>
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
          </div>
        </section>


        {/* =====================================================================
         * 2. STREAMLINED METRICS BAR (CLEAN SINGLE ROW, NO BOXED CLUTTER)
         * =================================================================== */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="px-3 pt-2 md:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Fixed Supply
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight block mt-0.5">
              100,000,000,000
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              Hard-Capped • 0 Inflation
            </span>
          </div>

          <div className="px-3 pt-2 md:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Asset Code
            </span>
            <span className="text-lg font-mono font-black text-emerald-700 tracking-tight block mt-0.5">
              {ASSET_CODE}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Standard Alphanum12
            </span>
          </div>

          <div className="px-3 pt-2 md:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Network Fee
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight block mt-0.5">
              &lt; $0.00001
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              Sponsored for Students
            </span>
          </div>

          <div className="px-3 pt-2 md:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Settlement
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight block mt-0.5">
              3.5s Finality
            </span>
            <span className="text-[10px] text-teal-700 font-bold block">
              Stellar Consensus Protocol
            </span>
          </div>
        </section>


        {/* =====================================================================
         * 3. VERIFIED ISSUER COORDINATES (CLEAN COMPACT BAR)
         * =================================================================== */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Issuer Anchor Account</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-800 break-all mt-0.5 select-all">
              {ISSUER_ADDRESS}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            {copied ? (
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
        </section>


        {/* =====================================================================
         * 4. CORE PROTOCOL UTILITY (SINGLE CLEAN CARD, NO REPETITIVE GRIDS)
         * =================================================================== */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            How $LABASCOIN Works
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                01
              </span>
              <div>
                <strong className="text-slate-900">Proof-of-Learning Ingestion:</strong> Students earn $LABASCOIN automatically by completing Lithuanian lessons and Leonas AI pronunciation drills. Conversion rate: 100 XP = 1.00 $LABAS, sponsored gasless on Stellar.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                02
              </span>
              <div>
                <strong className="text-slate-900">Subscription Discounts & Buyback:</strong> Subscribers paying with $LABASCOIN receive a 20% discount on LabasApp Pro. Protocol revenue periodically buys back tokens from the DEX to burn supply.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                03
              </span>
              <div>
                <strong className="text-slate-900">DEX Liquidity & 0.3% AMM Yield:</strong> Anyone can trade $LABASCOIN 24/7 on the decentralized exchange or pair tokens into the XLM/LABASCOIN liquidity pool to collect 0.30% swap fees.
              </div>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 5. TRADER QUICK-ACCESS: FIND & SWAP ON LOBSTR (NO LANGUAGE LESSONS NEEDED)
         * =================================================================== */}
        <section className="bg-white rounded-2xl border-2 border-emerald-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block mb-1 border border-emerald-200/50">
                Direct Trading Guide
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                How to Find & Swap $LABASCOIN on LOBSTR
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://lobstr.co/trade/LABASCOIN:GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
              >
                <span>Instant Swap</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              </a>
              <a
                href="https://stellar.expert/explorer/public/liquidity-pool/1a886a34bc7712a9691692b5da494d092ae84f5d0e0804d8baa46c9fbdc214f3"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                <span>Live AMM Pool</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>Open LOBSTR</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Log into LOBSTR (web or mobile app) and navigate directly to the <strong>Swap</strong> tab.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>Search by Domain</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                In asset search, type <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-700 font-bold">labasapp.com</code> or paste the issuer key to instantly resolve verified details.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                <span>Instant AMM Execution</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Swap XLM for $LABASCOIN with 3-second settlement routed through the on-chain liquidity pool.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================================
         * 5. DEVELOPER & VERIFICATION METADATA FOOTER (MINIMALIST INLINE ROW)
         * =================================================================== */}
        <footer className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Home Domain:</span>
            <span className="font-bold text-slate-800">labasapp.com</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <a
              href="https://labasapp.com/.well-known/stellar.toml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>stellar.toml (SEP-0001)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://stellar.expert/explorer/public/asset/LABASCOIN-GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stellar.expert</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://horizon.stellar.org/assets?asset_code=LABASCOIN&asset_issuer=GBF7L4AEFZPSWZA3DMQBPCS3FK533FRLAM3SG4UUUMOCZBSR3BHMTZND"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Horizon API</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
