// components/profile/StellarWalletModal.tsx
'use client';

import React, { useState } from 'react';
import { Wallet, ShieldCheck, X, AlertCircle, Sparkles } from 'lucide-react';

interface StellarWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (publicKey: string) => Promise<void>;
}

export default function StellarWalletModal({ isOpen, onClose, onSave }: StellarWalletModalProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    const trimmed = address.trim();

    // Stellar public key validation: must start with 'G' and be 56 chars
    if (!trimmed.startsWith('G') || trimmed.length !== 56) {
      setError('Invalid Stellar address. Must start with "G" and be 56 characters long.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(trimmed);
      setIsSaving(false);
      onClose();
    } catch (err) {
      setIsSaving(false);
      setError('Failed to save wallet address. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stellar Mainnet Wallet</h2>
              <p className="text-xs text-slate-400">Enter your public G... address to receive $LABAS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Public Stellar Address</label>
          <div className="relative">
            <input 
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="G..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
          {error && (
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Security Warning Notice */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start space-x-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-400 block mb-0.5">Add the $LABAS Trustline in your wallet</span>
            Make sure your Stellar wallet (Lobstr, Freighter, xBull) has an active trustline for <span className="text-white font-semibold">LABAS</span>. Never enter your secret <span className="font-mono text-rose-400">S...</span> key here.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button 
            onClick={onClose}
            className="w-1/2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-bold transition border border-slate-700/50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !address}
            className={`w-1/2 py-3.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center justify-center space-x-2 ${
              isSaving || !address 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-emerald-500/20'
            }`}
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Wallet</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
