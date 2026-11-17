"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CloudLightning, Sparkles, ShieldCheck, Heart, Users, Home, FileText, PlusCircle, Building } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { DEFAULT_CMS_CONTENT, type CMSContent } from "@/lib/cms-defaults";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

export default function LandingClient({ initialContent }: { initialContent: CMSContent }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [content, setContent] = useState<CMSContent>(initialContent);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Live query from Dexie for offline-first instant render and real-time updates
  const cmsRecord = useLiveQuery(() => db.cms_settings.get("landing_content"), []);

  useEffect(() => {
    if (cmsRecord) {
      try {
        const parsed = JSON.parse(cmsRecord.value);
        setContent({ ...DEFAULT_CMS_CONTENT, ...parsed });
      } catch (e) {
        console.error("Failed to parse CMS record:", e);
      }
    }
  }, [cmsRecord]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice_pwa_session");
      if (saved) {
        try {
          setSession(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local session:", e);
        }
      }

      // Sync CMS from server to Dexie
      const syncCMS = async () => {
        if (navigator.onLine) {
          try {
            const res = await fetch("/api/cms", { cache: "no-store" });
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.data) {
                setContent(result.data);
                await db.cms_settings.put({
                  key: "landing_content",
                  value: JSON.stringify(result.data)
                });
              }
            }
          } catch (e) {
            console.warn("Failed to fetch CMS from server:", e);
          }
        }
      };
      syncCMS();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">
      {/* 1. Navbar Fixed (Desktop & Mobile, iOS-style Glassmorphism) */}
      <header className={`w-full z-50 fixed top-0 left-0 right-0 backdrop-blur-md transition-all duration-300 ${
        isScrolled 
          ? "bg-white/75 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-slate-200/80"
          : "bg-[#FDFBF7]/60 border-b border-amber-900/5"
      } px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-[#EAE2FB] shadow-[0_8px_16px_rgba(139,92,246,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] flex items-center justify-center">
            <img src="/logo.jpg" alt="PADI GROUP Logo" className="w-8 h-8 object-contain rounded-lg" />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-800 tracking-tight leading-none block">Padi Invoice</span>
            <span className="text-[10px] font-bold text-violet-500">SaaS Workspace</span>
          </div>
        </div>

        {/* Navigation Middle Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-extrabold text-slate-500 hover:text-slate-850 transition-colors">Fitur</a>
          <a href="#about" className="text-xs font-extrabold text-slate-500 hover:text-slate-850 transition-colors">Tentang Kami</a>
          <a href="#pricing" className="text-xs font-extrabold text-slate-500 hover:text-slate-850 transition-colors">Harga</a>
        </nav>

        {/* Redirect buttons based on session */}
        <div>
          {session ? (
            <Link href={session.role === "ADMIN" ? "/admin" : "/user"}>
              <button className="h-10 px-5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold text-xs tracking-wide shadow-[0_8px_16px_rgba(139,92,246,0.25),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5">
                Ke Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="h-10 px-6 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#9575CD] hover:from-[#F06292] hover:to-[#7E57C2] text-white font-extrabold text-xs tracking-wider shadow-[0_8px_16px_rgba(139,92,246,0.15),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="pt-[76px]">
        <section className="relative px-6 pt-12 pb-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-[inset_0_1px_2px_rgba(139,92,246,0.2)] animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> {content.hero_badge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-none tracking-tight">
              {content.hero_title}
            </h1>

            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {content.hero_subtext}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href={session ? (session.role === "ADMIN" ? "/admin" : "/user") : "/login"}>
                <button className="w-full sm:w-auto h-12 px-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold text-xs tracking-wider shadow-[0_12px_24px_rgba(139,92,246,0.25),inset_0_4px_8px_rgba(255,255,255,0.4)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                  {content.hero_cta} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <button className="w-full h-12 px-8 rounded-full border-2 border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white/80 backdrop-blur text-slate-600 font-extrabold text-xs tracking-wider transition-all">
                  Pelajari Fitur
                </button>
              </a>
            </div>

            {/* Micro details */}
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> PWA Installable</div>
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Offline First</div>
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Google OAuth</div>
            </div>
          </div>

          {/* Right Hero Column (Claymorphic Vector Scene) */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            {/* Background Pastel 3D Bubbles */}
            <div className="absolute top-[-30px] left-[-30px] w-64 h-64 bg-purple-200/40 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-30px] right-[-30px] w-72 h-72 bg-pink-200/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Main Interactive Vector Scene */}
            <div className="relative w-full max-w-[480px] p-6 bg-white/70 backdrop-blur-md rounded-[48px] border-4 border-white/85 shadow-[0_24px_50px_rgba(139,92,246,0.12),inset_0_4px_12px_rgba(255,255,255,0.95)] flex flex-col items-center">
              
              {/* Tempat Maskot 3D */}
              <div className="relative w-full h-[260px] flex justify-center items-center select-none">
                <svg width="340" height="260" viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.06)]">
                  {/* Purple Curved Desk Plate */}
                  <path d="M20 200 C80 180, 260 180, 320 200 C320 230, 20 230, 20 200 Z" fill="url(#deskGrad)" />
                  <ellipse cx="170" cy="205" rx="140" ry="12" fill="#7C3AED" opacity="0.15" />

                  {/* Pink Flower Pot on Desk */}
                  <g transform="translate(240, 150)">
                    {/* Plant leaf */}
                    <path d="M20 10 C20 -15, 35 -20, 25 -30 C15 -20, 20 -10, 20 10 Z" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1" />
                    <path d="M20 10 C10 -5, 5 -10, 10 -20 C15 -10, 20 -5, 20 10 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
                    {/* Pot base */}
                    <path d="M8 20 L32 20 L28 45 L12 45 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1.5" />
                    <rect x="5" y="15" width="30" height="6" rx="3" fill="#FBCFE8" stroke="#DB2777" strokeWidth="1.5" />
                  </g>

                  {/* Coffee Cup on Desk */}
                  <g transform="translate(285, 175)">
                    <path d="M5 10 L25 10 L22 28 L8 28 Z" fill="#DDB892" stroke="#7F5539" strokeWidth="1.2" />
                    <rect x="3" y="6" width="24" height="4" rx="2" fill="#B08968" stroke="#7F5539" strokeWidth="1.2" />
                    <path d="M22 12 C25 12, 27 15, 25 18 C23 20, 21 19, 21 19" stroke="#7F5539" strokeWidth="1.2" fill="none" />
                  </g>

                  {/* The Cartoon Waving Character */}
                  <g transform="translate(100, 40)" className="animate-bounce" style={{ animationDuration: '5s' }}>
                    {/* Hair Back */}
                    <circle cx="70" cy="70" r="42" fill="#7F5539" />
                    
                    {/* Head */}
                    <circle cx="70" cy="65" r="30" fill="#FBC396" />
                    <path d="M52 65 C52 52, 88 52, 88 65" fill="#FBC396" />

                    {/* Hair Front Bangs */}
                    <path d="M40 65 C40 38, 100 38, 100 65 C90 52, 80 50, 70 55 C60 50, 50 52, 40 65 Z" fill="#5E3F27" />
                    <circle cx="70" cy="20" r="14" fill="#5E3F27" /> {/* Ponytail bun */}
                    <path d="M70 28 L70 34" stroke="#D97706" strokeWidth="3" /> {/* Hairtie */}

                    {/* Eyes */}
                    <circle cx="60" cy="66" r="3.5" fill="#1E293B" />
                    <circle cx="80" cy="66" r="3.5" fill="#1E293B" />
                    
                    {/* Blushing cheeks */}
                    <ellipse cx="54" cy="72" rx="4" ry="2.5" fill="#F43F5E" opacity="0.5" />
                    <ellipse cx="86" cy="72" rx="4" ry="2.5" fill="#F43F5E" opacity="0.5" />

                    {/* Smile */}
                    <path d="M66 75 Q70 79 74 75" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

                    {/* Body (Overalls) */}
                    <path d="M45 95 L95 95 L88 150 L52 150 Z" fill="#9575CD" /> {/* Purple overalls */}
                    <path d="M40 95 C40 95, 70 85, 100 95 C100 95, 95 115, 45 115 Z" fill="#FDE047" /> {/* Yellow t-shirt */}
                    <rect x="52" y="98" width="6" height="18" rx="2" fill="#7E57C2" /> {/* Straps */}
                    <rect x="82" y="98" width="6" height="18" rx="2" fill="#7E57C2" />
                    
                    {/* Flower decoration on laptop */}
                    <circle cx="70" cy="125" r="5" fill="#FDE047" />

                    {/* Waving Arm (Left) */}
                    <g transform="translate(10, 60)" className="origin-[30px_35px] animate-pulse">
                      <path d="M30 35 C20 20, 10 10, 18 5 C25 2, 35 20, 30 35 Z" fill="#FBC396" />
                      <circle cx="18" cy="6" r="5" fill="#FBC396" />
                    </g>
                  </g>

                  {/* Purple Laptop on Desk */}
                  <g transform="translate(125, 150)">
                    {/* Laptop Screen (Open) */}
                    <path d="M10 20 L75 5 L85 40 L20 52 Z" fill="#B39DDB" stroke="#673AB7" strokeWidth="1.5" />
                    <path d="M14 21 L71 8 L79 37 L22 47 Z" fill="#EDE7F6" /> {/* Laptop inner screen */}
                    <circle cx="48" cy="26" r="5" fill="#D97706" /> {/* Flower logo */}
                    {/* Laptop Keyboard Base */}
                    <path d="M10 50 L95 40 L108 58 L20 68 Z" fill="#7E57C2" stroke="#5E35B1" strokeWidth="2" />
                    <path d="M22 62 C22 62, 55 58, 85 54" stroke="#9575CD" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* May 2026 Calendar Card */}
                  <g transform="translate(210, 15)" className="animate-pulse">
                    <rect x="0" y="0" width="95" height="100" rx="16" fill="white" stroke="#EAE2FB" strokeWidth="2" />
                    <path d="M0 16 C0 7.2, 7.2 0, 16 0 L79 0 C87.8 0, 95 7.2, 95 16 L95 32 L0 32 Z" fill="#F48FB1" />
                    <text x="47.5" y="20" fill="white" fontSize="9" fontWeight="extrabold" textAnchor="middle">MEI 2026</text>
                    
                    {/* Mini Calendar Dots/Grid representation */}
                    <rect x="10" y="42" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="26" y="42" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="42" y="42" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="58" y="42" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="74" y="42" width="12" height="10" rx="2" fill="#E8E8E8" />

                    <rect x="10" y="58" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="26" y="58" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="42" y="58" width="12" height="10" rx="2" fill="#F48FB1" />
                    <rect x="58" y="58" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="74" y="58" width="12" height="10" rx="2" fill="#E8E8E8" />

                    <rect x="10" y="74" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="26" y="74" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="42" y="74" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="58" y="74" width="12" height="10" rx="2" fill="#E8E8E8" />
                    <rect x="74" y="74" width="12" height="10" rx="2" fill="#E8E8E8" />
                  </g>

                  {/* Floating 3D Heart */}
                  <g transform="translate(62, 70)" className="animate-pulse">
                    <path d="M12 5 C8 1, 1 3, 1 9 C1 15, 12 21, 12 21 C12 21, 23 15, 23 9 C23 3, 16 1, 12 5 Z" fill="#F48FB1" opacity="0.85" />
                  </g>

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="deskGrad" x1="20" y1="210" x2="320" y2="210" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#DDD6FE" />
                      <stop offset="1" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Claymorphic Mini Indicator Card */}
              <div className="w-full mt-4 p-4 bg-violet-100/50 dark:bg-violet-950/20 border border-violet-200/40 rounded-3xl flex items-center justify-between shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_16px_rgba(139,92,246,0.06)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800 block">Kolaborasi Tim</span>
                    <span className="text-[9px] font-bold text-slate-400">Kerja sama real-time</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-extrabold shadow-sm">
                  Aktif
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Features Grid Section (Claymorphic) */}
        <section id="features" className="px-6 py-24 bg-white/40 backdrop-blur-sm border-t border-b border-amber-900/5">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                {content.features_title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                {content.features_subtext}
              </p>
            </div>

            {/* Grid 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1: Invoice Instan */}
              <div className="p-8 bg-[#FFF0F5] dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/10 rounded-[32px] shadow-[0_16px_32px_rgba(244,63,94,0.05),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.03] transition-transform duration-300 flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-pink-500 shadow-md">
                    <CloudLightning className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">{content.feat1_title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {content.feat1_desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">{content.feat1_badge}</div>
              </div>

              {/* Card 2: Akses Offline (Dexie.js) */}
              <div className="p-8 bg-[#F3E8FF] dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/10 rounded-[32px] shadow-[0_16px_32px_rgba(139,92,246,0.05),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.03] transition-transform duration-300 flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-purple-500 shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">{content.feat2_title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {content.feat2_desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{content.feat2_badge}</div>
              </div>

              {/* Card 3: Pantau Omset */}
              <div className="p-8 bg-[#ECFDF5] dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 rounded-[32px] shadow-[0_16px_32px_rgba(16,185,129,0.05),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.03] transition-transform duration-300 flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">{content.feat3_title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {content.feat3_desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{content.feat3_badge}</div>
              </div>

              {/* Card 4: Manajemen Klien */}
              <div className="p-8 bg-[#FEF3C7] dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10 rounded-[32px] shadow-[0_16px_32px_rgba(245,158,11,0.05),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.03] transition-transform duration-300 flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-md">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800">{content.feat4_title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {content.feat4_desc}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{content.feat4_badge}</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3.5. Tentang Kami Section (Claymorphic) */}
        <section id="about" className="px-6 py-24 bg-[#FAF5FF] dark:bg-[#0f172a] border-b border-amber-900/5">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-[inset_0_1px_2px_rgba(139,92,246,0.2)]">
                  {content.about_badge || "Tentang Kami"}
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  {content.about_title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {content.about_desc1}
                </p>
                <p className="text-xs sm:text-sm text-slate-550 font-medium leading-relaxed">
                  {content.about_desc2}
                </p>
              </div>

              {/* Right Column: Key Pillars (Claymorphic List) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 bg-white border border-[#EAE2FB] rounded-2xl shadow-[0_8px_16px_rgba(139,92,246,0.03),inset_0_2px_4px_rgba(255,255,255,0.95)] flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-850">{content.about_pillar1_title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-normal">{content.about_pillar1_desc}</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#EAE2FB] rounded-2xl shadow-[0_8px_16px_rgba(139,92,246,0.03),inset_0_2px_4px_rgba(255,255,255,0.95)] flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                    <CloudLightning className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-850">{content.about_pillar2_title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-normal">{content.about_pillar2_desc}</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#EAE2FB] rounded-2xl shadow-[0_8px_16px_rgba(139,92,246,0.03),inset_0_2px_4px_rgba(255,255,255,0.95)] flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-850">{content.about_pillar3_title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-normal">{content.about_pillar3_desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Claymorphic) */}
        <section id="pricing" className="px-6 py-24 bg-gradient-to-b from-[#FDFBF7] to-[#F3E8FF]/20 border-b border-amber-900/5">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                {content.pricing_title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                {content.pricing_subtext}
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Card 1: Bulanan */}
              <div className="p-8 bg-white border border-[#EAE2FB] rounded-[32px] shadow-[0_16px_32px_rgba(139,92,246,0.06),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-[380px] relative">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">{content.price1_title}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Sangat Fleksibel</p>
                  </div>
                  <div className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {content.price1_desc}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-3xl font-extrabold text-slate-800">{content.price1_amount}</span>
                      {content.price1_original && (
                        <span className="text-xs font-extrabold text-rose-500/80 line-through bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md">
                          {content.price1_original}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs font-bold block">{content.price1_period}</span>
                  </div>
                </div>
                <Link href="/login" className="w-full">
                  <button className="w-full h-11 rounded-full border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-extrabold text-xs tracking-wider transition-all">
                    Pilih Paket Bulanan
                  </button>
                </Link>
              </div>

              {/* Card 2: Tahunan (Glowing / Highlighted) */}
              <div className="p-8 bg-gradient-to-br from-[#FAF5FF] to-white border-2 border-violet-300 rounded-[32px] shadow-[0_20px_40px_rgba(139,92,246,0.12),inset_0_4px_8px_rgba(255,255,255,0.95)] hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-[380px] relative overflow-hidden">
                {/* Highlight Badge Ribbon */}
                <div className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-extrabold px-4 py-1.5 rounded-bl-2xl shadow-md uppercase tracking-wider">
                  {content.price2_badge}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-1.5">
                      {content.price2_title} <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    </h3>
                    <p className="text-xs text-violet-500 font-bold mt-1">Paling Populer</p>
                  </div>
                  <div className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {content.price2_desc}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-3xl font-extrabold text-slate-800">{content.price2_amount}</span>
                      {content.price2_original && (
                        <span className="text-xs font-extrabold text-rose-500/80 line-through bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md">
                          {content.price2_original}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs font-bold block">{content.price2_period}</span>
                  </div>
                </div>
                <Link href="/login" className="w-full">
                  <button className="w-full h-11 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold text-xs tracking-wider shadow-[0_8px_16px_rgba(139,92,246,0.2),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all">
                    Pilih Paket Tahunan
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Extra Call To Action Section */}
        <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-extrabold text-slate-800">
            {content.cta_title}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
            {content.cta_subtext}
          </p>
          <div>
            <Link href={session ? (session.role === "ADMIN" ? "/admin" : "/user") : "/login"}>
              <button className="h-12 px-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold text-xs tracking-wider shadow-[0_12px_24px_rgba(139,92,246,0.2),inset_0_4px_8px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-transform">
                {content.cta_btn}
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-900/5 py-12 px-6 bg-white/20 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.jpg" alt="PADI GROUP Logo" className="w-6 h-6 object-contain rounded-md" />
          <span className="font-bold text-xs text-slate-700">Padi Invoice &copy; 2026. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
