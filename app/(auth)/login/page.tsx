"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Lock, ArrowRight, Eye, EyeOff, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { signIn, useSession } from "next-auth/react";
import { detectIncognito } from "detectincognitojs";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync Google Session to Dexie & localStorage when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const syncGoogleUser = async () => {
        try {
          const googleUser = session.user as any;
          const emailLower = googleUser.email.toLowerCase();
          const role = googleUser.role || "USER";
          const id = googleUser.id || `usr-${Date.now()}`;
          const profileImg = googleUser.image || "/icons/char-open.png";

          // Sync to Dexie
          const existingUser = await db.users.get(id);
          await db.users.put({
            id,
            name: googleUser.name || emailLower.split("@")[0],
            email: emailLower,
            role,
            password_hash: "GOOGLE_OAUTH",
            profile_image: existingUser?.profile_image || profileImg,
            created_at: existingUser?.created_at || new Date().toISOString()
          });

          // Store in LocalStorage
          localStorage.setItem(
            "invoice_pwa_session",
            JSON.stringify({
              id,
              name: googleUser.name || emailLower.split("@")[0],
              email: emailLower,
              role
            })
          );

          // Redirect to appropriate dashboard
          router.replace(role === "ADMIN" ? "/admin" : "/user");
        } catch (error) {
          console.error("Failed to sync Google user session:", error);
        }
      };

      syncGoogleUser();
    }
  }, [status, session, router]);

  const [isIncognito, setIsIncognito] = useState<boolean | null>(null);
  const [fpAgent, setFpAgent] = useState<any>(null);

  // Initialize Incognito Detection & FingerprintJS
  useEffect(() => {
    // Detect Incognito
    detectIncognito()
      .then((result) => {
        setIsIncognito(result.isPrivate);
      })
      .catch((err) => {
        console.error("Incognito detection error:", err);
        setIsIncognito(false);
      });

    // Load FingerprintJS and set cookie on load
    FingerprintJS.load()
      .then(async (agent) => {
        setFpAgent(agent);
        try {
          const result = await agent.get();
          const fp = result.visitorId;
          document.cookie = `device_id=${fp}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (err) {
          console.error("Error setting device_id cookie on load:", err);
        }
      })
      .catch(async (err) => {
        console.error("FingerprintJS initialization error:", err);
        // Fallback to getDeviceFingerprint
        const fp = await getDeviceFingerprint();
        if (fp) {
          document.cookie = `device_id=${fp}; path=/; max-age=31536000; SameSite=Lax`;
        }
      });

    // Check for Google Sign-In error cookie or NextAuth error query
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const match = document.cookie.match(/(^|;)\s*oauth_error\s*=\s*([^;]+)/);

    if ((match && match[2] === "DEVICE_ALREADY_REGISTERED") || errorParam === "Callback" || errorParam === "OAuthCallback" || errorParam === "OAuthSignin") {
      setErrorMsg("Pendaftaran gagal: Perangkat ini sudah pernah digunakan untuk mendaftar akun.");
      // Clear cookie
      document.cookie = "oauth_error=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      
      // Clean up URL query parameters
      if (typeof window !== "undefined" && window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Jika password TERSEMBUNYI (showPassword === false / ikon mata tercoret), karakter BUKA MATA
  // Ikon Eye (tidak tercoret) = password terlihat → karakter TUTUP MATA (malu)
  // Ikon EyeOff (tercoret) = password tersembunyi → karakter BUKA MATA (normal)
  const imageSrc = showPassword ? "/icons/char-closed.png" : "/icons/char-open.png";

  const handleModeSwitch = (targetMode: "LOGIN" | "REGISTER" | "FORGOT_PASSWORD") => {
    setMode(targetMode);
    setErrorMsg("");
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const computeClientHash = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const getDeviceFingerprint = async () => {
    if (typeof window === "undefined") return "";
    try {
      const navigatorInfo = window.navigator;
      const screenInfo = window.screen;
      
      let webglInfo = "";
      try {
        const glCanvas = document.createElement("canvas");
        const gl = (glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            webglInfo = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + "###" + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      } catch (e) {}

      const rawString = [
        navigatorInfo.userAgent,
        navigatorInfo.language,
        navigatorInfo.platform || "",
        navigatorInfo.hardwareConcurrency || "unknown",
        screenInfo.colorDepth,
        screenInfo.width + "x" + screenInfo.height,
        new Date().getTimezoneOffset(),
        webglInfo
      ].join("###");
      
      const encoder = new TextEncoder();
      const data = encoder.encode(rawString);
      const hash = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      console.error("Fingerprint error:", e);
      return "fallback-fingerprint";
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    let privateMode = isIncognito;
    if (privateMode === null) {
      try {
        const res = await detectIncognito();
        privateMode = res.isPrivate;
        setIsIncognito(privateMode);
      } catch {
        privateMode = false;
      }
    }

    if (privateMode) {
      setErrorMsg("Pendaftaran/Login menggunakan mode Incognito dilarang! Silakan gunakan jendela penjelajahan biasa.");
      return;
    }

    setLoading(true);
    
    let fingerprint = "";
    if (fpAgent) {
      try {
        const result = await fpAgent.get();
        fingerprint = result.visitorId;
      } catch (err) {
        console.error("Failed to get FingerprintJS ID for Google Sign-In:", err);
      }
    }
    if (!fingerprint) {
      fingerprint = await getDeviceFingerprint();
    }
    
    if (fingerprint) {
      document.cookie = `device_id=${fingerprint}; path=/; max-age=31536000; SameSite=Lax`;
    }
    
    try {
      await signIn("google");
    } catch (err) {
      setLoading(false);
      setErrorMsg("Gagal menghubungi Google Auth Provider.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) { setErrorMsg("Alamat email wajib diisi!"); return; }
    if (mode !== "LOGIN" && password !== confirmPassword) { setErrorMsg("Konfirmasi kata sandi tidak cocok!"); return; }

    setLoading(true);
    const clientHash = await computeClientHash(password);

    if (mode === "REGISTER") {
      let privateMode = isIncognito;
      if (privateMode === null) {
        try {
          const res = await detectIncognito();
          privateMode = res.isPrivate;
          setIsIncognito(privateMode);
        } catch {
          privateMode = false;
        }
      }

      if (privateMode) {
        setLoading(false);
        setErrorMsg("Pendaftaran dilarang menggunakan mode Incognito! Silakan gunakan jendela penjelajahan biasa.");
        return;
      }

      let fingerprint = "";
      if (fpAgent) {
        try {
          const result = await fpAgent.get();
          fingerprint = result.visitorId;
        } catch (err) {
          console.error("Failed to get FingerprintJS ID:", err);
        }
      }
      if (!fingerprint) {
        fingerprint = await getDeviceFingerprint();
      }
      if (fingerprint) {
        document.cookie = `device_id=${fingerprint}; path=/; max-age=31536000; SameSite=Lax`;
      }

      // Validate temporary email domain to prevent abuse of the 7-day trial
      const blockedDomains = [
        "tempmail.com", "temp-mail.org", "generator.email", "yopmail.com",
        "mailinator.com", "guerrillamail.com", "trashmail.com", "dispostable.com",
        "sharklasers.com", "guerrillamailblock.com", "guerrillamail.net", 
        "guerrillamail.org", "guerrillamail.biz", "10minutemail.com", 
        "10minutemail.co.za", "10minutemail.net", "getairmail.com", 
        "throwawaymail.com", "tempmailaddress.com", "temp-mail.ru", 
        "tempmail.net", "tempmail.casa", "tempmail.monster", "tempmail.website", 
        "maildrop.cc", "mintemail.com", "disposable.com", "disposablemail.com",
        "aminating.com", "inboxkitten.com", "moakt.cc", "armyspy.com"
      ];
      const emailDomain = email.toLowerCase().split("@")[1] || "";
      if (
        blockedDomains.includes(emailDomain) || 
        emailDomain.includes("temp") || 
        emailDomain.includes("disposable") || 
        emailDomain.includes("throwaway") ||
        emailDomain.includes("mailinator") ||
        emailDomain.includes("aminating")
      ) {
        setLoading(false);
        setErrorMsg("Pendaftaran menggunakan email sementara (temp-mail) dilarang!");
        return;
      }

      const newUserId = `usr-${Date.now()}`;
      const newUser = {
        id: newUserId,
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        role: "USER" as const,
        password_hash: clientHash,
        device_fingerprint: fingerprint,
        device_id: fingerprint,
        created_at: new Date().toISOString(),
      };

      if (navigator.onLine) {
        try {
          const res = await fetch("/api/users", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(newUser) 
          });
          const resData = await res.json();
          if (!res.ok || !resData.success) {
            setLoading(false);
            setErrorMsg(resData.error || "Gagal melakukan pendaftaran.");
            return;
          }
        } catch (err) {
          setLoading(false);
          setErrorMsg("Gagal mendaftar ke server database. Periksa koneksi internet Anda.");
          return;
        }
      }

      try { await db.users.put(newUser); } catch (err) { console.error(err); }
      localStorage.setItem("invoice_pwa_session", JSON.stringify({ id: newUserId, name: newUser.name, email: newUser.email, role: "USER" }));
      setTimeout(() => { setLoading(false); router.push("/user"); }, 600);

    } else if (mode === "FORGOT_PASSWORD") {
      let targetUser: any = null;
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/users?email=${encodeURIComponent(email.toLowerCase())}`);
          if (res.ok) { const result = await res.json(); if (result.success && result.data) targetUser = result.data; }
        } catch { /* fallback */ }
      }
      if (!targetUser) targetUser = await db.users.where("email").equals(email.toLowerCase()).first();
      if (!targetUser) { setLoading(false); setErrorMsg("Alamat email tidak terdaftar di sistem!"); return; }
      const updatedUser = { ...targetUser, password_hash: clientHash };
      try { await db.users.put(updatedUser); } catch (err) { console.error(err); }
      if (navigator.onLine) {
        try {
          await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedUser) });
        } catch { /* offline */ }
      }
      setLoading(false);
      setSuccessMsg("Kata sandi berhasil diubah! Silakan masuk kembali.");
      setTimeout(() => handleModeSwitch("LOGIN"), 1500);

    } else {
      let dbUser: any = null;
      let loginSuccess = false;
      if (navigator.onLine) {
        try {
          const res = await fetch("/api/users/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.toLowerCase(), password_hash: clientHash }) });
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.user) {
              dbUser = result.user;
              loginSuccess = true;
              const localUser = await db.users.get(dbUser.id);
              await db.users.put({
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                password_hash: clientHash,
                profile_image: localUser?.profile_image
              });
            }
          }
        } catch { /* fallback */ }
      }
      if (!loginSuccess) {
        const cachedUser = await db.users.where("email").equals(email.toLowerCase()).first();
        if (cachedUser && cachedUser.password_hash === clientHash) { dbUser = cachedUser; loginSuccess = true; }
      }
      if (!loginSuccess) {
        if (email.toLowerCase() === "admin@invoice.com" && password === "password123") { dbUser = { id: "usr-admin-01", name: "Admin Utama", email: "admin@invoice.com", role: "ADMIN" }; loginSuccess = true; }
        else if (email.toLowerCase() === "kasir@invoice.com" && password === "password123") { dbUser = { id: "usr-member-01", name: "Member Staff", email: "kasir@invoice.com", role: "USER" }; loginSuccess = true; }
      }
      if (!loginSuccess || !dbUser) { setLoading(false); setErrorMsg("Email atau kata sandi Anda salah!"); return; }
      localStorage.setItem("invoice_pwa_session", JSON.stringify({ id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role }));
      setTimeout(() => { setLoading(false); router.push(dbUser.role === "ADMIN" ? "/admin" : "/user"); }, 600);
    }
  };

  if (isIncognito === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D4C3FB] via-[#F0DCFA] to-[#FCE3EB] dark:from-[#1e152e] dark:via-[#29171d] dark:to-[#17111e]">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent" />
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 animate-pulse">Memuat Sistem Keamanan...</span>
        </div>
      </div>
    );
  }

  if (isIncognito === true) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#D4C3FB] via-[#F0DCFA] to-[#FCE3EB] dark:from-[#1e152e] dark:via-[#29171d] dark:to-[#17111e] overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-[40px] bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-slate-800/60 backdrop-blur-xl shadow-clay-card relative z-10 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-clay-button animate-bounce">
            <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 mb-4 tracking-tight">Akses Ditolak</h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-350 leading-relaxed mb-8">
            Akses Ditolak: Mohon matikan mode Incognito / Private Browsing untuk mendaftar atau masuk ke Padi Invoice.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full h-12 rounded-full bg-gradient-to-r from-rose-400 to-violet-500 hover:from-rose-500 hover:to-violet-600 text-white font-extrabold text-xs shadow-md tracking-wider transition-all hover:scale-[1.01] active:scale-95 border-none"
            >
              Coba Lagi
            </button>
            <Link href="/" className="w-full">
              <button className="w-full h-12 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wider transition-all hover:scale-[1.01] active:scale-95 border border-slate-300/30">
                Kembali ke Beranda
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-32 pb-12 px-4 relative bg-gradient-to-br from-[#D4C3FB] via-[#F0DCFA] to-[#FCE3EB] dark:from-[#1e152e] dark:via-[#29171d] dark:to-[#17111e] overflow-hidden">
      {/* Back to Home Button (Floating Claymorphic Button) */}
      <Link href="/" className="absolute top-6 left-6 z-30">
        <button className="h-10 px-4 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 border-white/60 dark:border-slate-800/60 shadow-[0_8px_16px_rgba(139,92,246,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] dark:shadow-none hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350">
          <Home className="w-4 h-4 text-violet-500" />
          Kembali ke Beranda
        </button>
      </Link>

      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Card Wrapper - Serves as the relative anchor for all floating elements to sync across mobile, tablet, and desktop */}
      <div className="relative w-full max-w-md mt-16 z-10">
        
        {/* Floating 3D Speech Bubble (User Avatar) on Left */}
        <div className="absolute left-1 sm:-left-24 top-[-45px] sm:top-[-90px] z-0 animate-bounce pointer-events-none" style={{ animationDuration: '6s' }}>
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-24 sm:h-24 drop-shadow-[0_8px_16px_rgba(139,92,246,0.22)]">
            <rect x="5" y="10" width="80" height="70" rx="24" fill="#8B5CF6" opacity="0.3" />
            <rect x="5" y="5" width="80" height="70" rx="24" fill="url(#bubbleGrad)" />
            <path d="M25 75 L35 65 L45 65 Z" fill="#A78BFA" />
            <circle cx="45" cy="30" r="10" fill="white" />
            <path d="M27 54 C27 46 34 44 45 44 C56 44 63 46 63 54 Z" fill="white" />
            <defs>
              <linearGradient id="bubbleGrad" x1="5" y1="5" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DDD6FE" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Floating 3D Padlock (Gembok) on Right */}
        <div className="absolute right-1 sm:-right-24 top-[-50px] sm:top-[-100px] z-0 animate-bounce pointer-events-none" style={{ animationDuration: '8s' }}>
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-24 sm:h-24 drop-shadow-[0_8px_16px_rgba(167,139,250,0.22)]">
            <path d="M30 45 V30 C30 18 39 10 50 10 C61 10 70 18 70 30 V45" stroke="#C4B5FD" strokeWidth="9" strokeLinecap="round" />
            <rect x="20" y="40" width="60" height="50" rx="18" fill="url(#lockGrad)" />
            <circle cx="50" cy="60" r="6" fill="#6D28D9" />
            <path d="M47 64 L53 64 L55 76 L45 76 Z" fill="#6D28D9" />
            <defs>
              <linearGradient id="lockGrad" x1="20" y1="40" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EDE9FE" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Floating 3D Checkmark (Centang) on Right */}
        <div className="absolute right-2 sm:-right-20 top-[55px] sm:top-[20px] z-0 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}>
          <svg width="42" height="42" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-20 sm:h-20 drop-shadow-[0_8px_16px_rgba(236,72,153,0.2)]">
            <circle cx="40" cy="40" r="30" fill="url(#checkGrad)" />
            <path d="M28 40 L37 49 L53 31" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="checkGrad" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBCFE8" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Left Plant Pot (Pot Bunga Kiri) */}
        <div className="absolute left-1 sm:-left-28 bottom-[-20px] z-0 pointer-events-none">
          <svg width="80" height="130" viewBox="0 0 140 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-36 sm:h-56 drop-shadow-[0_16px_32px_rgba(219,39,119,0.15)]">
            <path d="M50 150 C40 100 20 70 30 20" stroke="#84CC16" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 150 C70 80 90 60 85 10" stroke="#84CC16" strokeWidth="5" strokeLinecap="round" />
            <path d="M90 150 C100 110 115 90 110 30" stroke="#84CC16" strokeWidth="4" strokeLinecap="round" />
            
            <path d="M30 20 C15 25 10 35 25 45 C35 35 35 25 30 20 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M23 45 C10 50 8 60 20 68 C30 60 30 50 23 45 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M28 35 C40 32 45 42 35 50 C28 42 28 38 28 35 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />

            <path d="M85 10 C70 15 65 30 80 40 C95 30 90 20 85 10 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M75 50 C60 55 58 70 72 80 C85 70 82 60 75 50 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M82 35 C98 32 102 48 90 58 C82 48 82 40 82 35 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M80 75 C95 72 100 88 88 98 C80 88 80 80 80 75 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />

            <path d="M110 30 C95 35 90 45 105 55 C115 45 115 35 110 30 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M102 60 C88 65 85 75 98 85 C108 75 108 65 102 60 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M108 45 C120 42 125 52 115 60 C108 52 108 48 108 45 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />

            <ellipse cx="70" cy="188" rx="35" ry="8" fill="#F472B6" opacity="0.3" />
            <path d="M40 150 L100 150 L90 195 L50 195 Z" fill="url(#potGradL)" stroke="#DB2777" strokeWidth="2" />
            <rect x="36" y="144" width="68" height="8" rx="4" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
            <defs>
              <linearGradient id="potGradL" x1="40" y1="150" x2="90" y2="195" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBCFE8" />
                <stop offset="1" stopColor="#F472B6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right Plant Pot (Pot Bunga Kanan) */}
        <div className="absolute right-1 sm:-right-28 bottom-[-20px] z-0 pointer-events-none">
          <svg width="80" height="130" viewBox="0 0 140 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-36 sm:h-56 drop-shadow-[0_16px_32px_rgba(219,39,119,0.15)]">
            <path d="M50 150 C40 100 20 70 30 20" stroke="#84CC16" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 150 C70 80 90 60 85 10" stroke="#84CC16" strokeWidth="5" strokeLinecap="round" />
            <path d="M90 150 C100 110 115 90 110 30" stroke="#84CC16" strokeWidth="4" strokeLinecap="round" />
            
            <path d="M30 20 C15 25 10 35 25 45 C35 35 35 25 30 20 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M23 45 C10 50 8 60 20 68 C30 60 30 50 23 45 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M28 35 C40 32 45 42 35 50 C28 42 28 38 28 35 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />

            <path d="M85 10 C70 15 65 30 80 40 C95 30 90 20 85 10 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M75 50 C60 55 58 70 72 80 C85 70 82 60 75 50 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M82 35 C98 32 102 48 90 58 C82 48 82 40 82 35 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
            <path d="M80 75 C95 72 100 88 88 98 C80 88 80 80 80 75 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />

            <path d="M110 30 C95 35 90 45 105 55 C115 45 115 35 110 30 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M102 60 C88 65 85 75 98 85 C108 75 108 65 102 60 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />
            <path d="M108 45 C120 42 125 52 115 60 C108 52 108 48 108 45 Z" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1" />

            <ellipse cx="70" cy="188" rx="35" ry="8" fill="#F472B6" opacity="0.3" />
            <path d="M40 150 L100 150 L90 195 L50 195 Z" fill="url(#potGradR)" stroke="#DB2777" strokeWidth="2" />
            <rect x="36" y="144" width="68" height="8" rx="4" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
            <defs>
              <linearGradient id="potGradR" x1="40" y1="150" x2="90" y2="195" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBCFE8" />
                <stop offset="1" stopColor="#F472B6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Main Card Container */}
        <div className="relative w-full bg-white/90 dark:bg-slate-900/90 rounded-[40px] border-4 border-white/80 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(139,92,246,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md px-6 sm:px-8 pb-10 pt-24 mt-16 z-10">

          {/* Absolute Character Image — Posisikan di luar/atas card */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[160px] sm:-top-[180px] w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] pointer-events-none z-20 flex justify-center items-end">
            <Image
              src={imageSrc}
              alt="Character"
              width={260}
              height={260}
              className="object-contain object-bottom drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)]"
              priority
            />
          </div>

        {/* Teks Judul — pt-24 pada Card menekan teks ini ke bawah */}
        <div className="text-center mb-8 relative z-20">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {mode === "LOGIN" ? "Welcome Back!" : mode === "REGISTER" ? "Create Account" : "Reset Password"}
          </h1>
          <p className="text-slate-500 mt-2">
            {mode === "LOGIN" ? "Login to continue" : mode === "REGISTER" ? "Join our Invoice Workspace" : "Enter registered email"}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-500 font-bold text-center">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-600 font-bold text-center">{successMsg}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nama (Register only) */}
          {mode === "REGISTER" && (
            <div className="relative">
              <Building2 className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Workspace / Username"
                className="h-12 rounded-full border border-[#EAE2FB] dark:border-slate-800 bg-[#F5F2FC]/70 dark:bg-slate-950/70 pl-11 pr-4 text-xs font-semibold shadow-clay-input"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <User className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="Username / Email"
              className="h-12 rounded-full border border-[#EAE2FB] dark:border-slate-800 bg-[#F5F2FC]/70 dark:bg-slate-950/70 pl-11 pr-4 text-xs font-semibold shadow-clay-input"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="h-12 rounded-full border border-[#EAE2FB] dark:border-slate-800 bg-[#F5F2FC]/70 dark:bg-slate-950/70 pl-11 pr-12 text-xs font-semibold shadow-clay-input"
            />
            {/* Tombol mata — EyeOff saat false (gray), Eye saat true (indigo) */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {/* Konfirmasi Password (Register & Forgot) */}
          {mode !== "LOGIN" && (
            <div className="relative animate-in fade-in duration-200">
              <Lock className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm Password"
                className="h-12 rounded-full border border-[#EAE2FB] dark:border-slate-800 bg-[#F5F2FC]/70 dark:bg-slate-950/70 pl-11 pr-4 text-xs font-semibold shadow-clay-input"
              />
            </div>
          )}

          {/* Forgot Password Link */}
          {mode === "LOGIN" && (
            <div className="flex justify-end">
              <button type="button" onClick={() => handleModeSwitch("FORGOT_PASSWORD")}
                className="text-[10px] text-violet-600 dark:text-violet-400 font-extrabold hover:underline">
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#9575CD] hover:from-[#F06292] hover:to-[#7E57C2] text-white font-extrabold text-xs shadow-md tracking-wider transition-all hover:scale-[1.01] active:scale-95 border-none mt-2 flex items-center justify-center gap-2">
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>{mode === "LOGIN" ? "Login" : mode === "REGISTER" ? "Sign Up" : "Reset Password"}<ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </form>

        {/* Social Login (Login mode only) */}
        {mode === "LOGIN" && (
          <div className="mt-5 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#EAE2FB] dark:border-slate-800" /></div>
              <div className="relative flex justify-center text-[10px] font-bold text-slate-400 uppercase">
                <span className="bg-white dark:bg-slate-900 px-3">or continue with</span>
              </div>
            </div>
            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-12 rounded-full shadow-clay-white flex items-center justify-center gap-2.5 border border-[#EAE2FB] dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 hover:scale-[1.01] active:scale-95 transition-all text-xs font-extrabold text-slate-700 dark:text-slate-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer link */}
        <p className="text-center text-xs font-bold text-slate-500 mt-5">
          {mode === "LOGIN" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={() => handleModeSwitch("REGISTER")} className="text-violet-600 font-extrabold hover:underline">Sign Up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => handleModeSwitch("LOGIN")} className="text-violet-600 font-extrabold hover:underline">Sign In</button>
            </>
          )}
        </p>
      </div>
      </div>
    </div>
  );
}
