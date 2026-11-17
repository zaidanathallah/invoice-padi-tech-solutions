"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Sparkles, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onClose?: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleUpgrade = () => {
    // Redirect to landing page pricing section
    router.push("/#pricing");
    if (onClose) onClose();
  };

  const handleBack = () => {
    router.back();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Claymorphic Modal Container */}
      <div 
        className="relative w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-[36px] border-4 border-white/95 dark:border-slate-800/90 shadow-[0_24px_50px_rgba(139,92,246,0.18),inset_0_4px_12px_rgba(255,255,255,0.95),inset_0_-4px_12px_rgba(139,92,246,0.05)] text-center space-y-6 transform animate-in zoom-in-95 duration-300"
      >
        {/* Soft Decorative Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Friendly Warning Icon (Claymorphic) */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center text-pink-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_8px_16px_rgba(244,63,94,0.1)] border border-pink-200/30">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
            Free Trial Habis!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Masa uji coba gratis 7 hari Anda telah habis. Yuk, upgrade ke paket Bulanan atau Tahunan untuk kembali membuat invoice tanpa batas!
          </p>
        </div>

        {/* Mini Features List */}
        <div className="p-4 bg-violet-50 dark:bg-slate-950/40 rounded-2xl border border-violet-100/50 dark:border-slate-800/50 space-y-2 text-left text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span>Buat Invoice Tanpa Batas (Unlimited)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span>Akses Multi-Device &amp; Kolaborasi Tim</span>
          </div>
        </div>

        {/* Buttons / CTA */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleUpgrade}
            className="w-full h-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold text-xs tracking-wider shadow-[0_12px_24px_rgba(139,92,246,0.25),inset_0_4px_8px_rgba(255,255,255,0.4)] hover:scale-102 active:scale-98 transition-transform"
          >
            Upgrade Sekarang
          </button>
          
          <button
            onClick={handleBack}
            className="w-full h-12 rounded-full border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
