"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck,
  TrendingUp,
  Building,
  Home,
  Layout,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { Badge } from "@/components/ui/badge";
import { CompanyModal } from "@/components/company/company-modal";
import { signOut } from "next-auth/react";

import { seedInitialDexieData } from "@/lib/db/crud";
import { db } from "@/lib/db";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice_pwa_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return {
      id: "usr-admin-01",
      name: "Admin Utama",
      email: "admin@invoice.com",
      role: "ADMIN",
    };
  });
  const [profileImage, setProfileImage] = useState<string>("/icons/char-open.png");

  useEffect(() => {
    // Initialize sample Dexie IndexedDB data if empty
    seedInitialDexieData();

    if (user) {
      // Fetch profile_image from Dexie
      db.users.get(user.id).then((dbUser) => {
        if (dbUser && dbUser.profile_image) {
          setProfileImage(dbUser.profile_image);
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);

      try {
        const existingUser = await db.users.get(user.id);
        if (existingUser) {
          await db.users.update(user.id, { profile_image: base64String });
        } else {
          await db.users.put({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile_image: base64String
          });
        }
        // Dispatch custom event for real-time sync with children (dashboard pages)
        window.dispatchEvent(new CustomEvent("profile-image-updated", { detail: base64String }));
      } catch (err) {
        console.error("Failed to save profile image to Dexie:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    localStorage.removeItem("invoice_pwa_session");
    await signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    {
      label: "Dashboard Admin",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["ADMIN"],
    },
    {
      label: "Kelola Landing Page",
      href: "/admin/cms",
      icon: Settings,
      roles: ["ADMIN"],
    },
    {
      label: "Dashboard Member",
      href: "/user",
      icon: UserCheck,
      roles: ["USER", "ADMIN"],
    },
    {
      label: "Buat Invoice Baru",
      href: "/invoices/new",
      icon: PlusCircle,
      roles: ["ADMIN", "USER"],
    },
    {
      label: "Semua Invoice",
      href: "/invoices",
      icon: FileText,
      roles: ["ADMIN", "USER"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <div className="min-h-screen bg-[#F9F7FC] dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors print:bg-white print:text-black">
      {/* Desktop Sidebar (Claymorphic Pastel Purple bg-[#EDE7F6]) */}
      <aside className="hidden md:flex print:hidden flex-col w-64 border-r border-[#EAE2FB] dark:border-slate-800 bg-[#EDE7F6] dark:bg-slate-900 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 px-2">
            <div className="p-1 bg-white dark:bg-slate-800 border border-[#EAE2FB] dark:border-slate-700 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
              <img src="/logo.jpg" alt="PADI GROUP Logo" className="h-9 w-auto object-contain rounded-xl" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-none text-violet-950 dark:text-white">InvoicePWA</h2>
              <span className="text-[11px] font-bold text-violet-500/80 dark:text-slate-400">SaaS Workspace</span>
            </div>
          </Link>

          {/* User Profile Card (Interactive Avatar) */}
          <div className="flex flex-col items-center text-center p-4 bg-white/80 dark:bg-slate-800/50 border border-white/50 rounded-[28px] shadow-clay-white mb-4 relative">
            <div 
              className="w-16 h-16 rounded-full border-4 border-violet-200/60 overflow-hidden shadow-md relative mb-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              onClick={() => document.getElementById("profile-upload-input")?.click()}
              title="Klik untuk mengubah foto profil"
            >
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[9px] text-white font-extrabold text-center leading-tight">Ubah<br/>Foto</span>
              </div>
            </div>
            <input
              id="profile-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">Hi, {user?.name || "Member"}! 👋</h3>
            <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide">
              {user?.role === "ADMIN" ? "Owner / Admin" : "SaaS Member"}
            </span>
          </div>

          {/* Navigation Links (Pill-Shaped status aktif) */}
          <nav className="space-y-1.5 pt-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white text-violet-950 dark:bg-slate-850 dark:text-white shadow-[0_8px_16px_-4px_rgba(139,92,246,0.15),inset_0_2px_4px_rgba(255,255,255,0.95)]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${isActive ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/20' : 'bg-transparent'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#EAE2FB] dark:border-slate-850">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 rounded-full transition-all hover:scale-[1.02] active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar (Clean, compact, no drawer) */}
      <header className="md:hidden print:hidden flex items-center justify-between px-3 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <img src="/logo.jpg" alt="Padi Logo" className="h-7 w-auto object-contain rounded-md" />
          <span className="font-extrabold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">InvoicePWA</span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          {user?.role === "ADMIN" && (
            <>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                title="Logo & Profil Perusahaan"
              >
                <Building className="w-4 h-4" />
              </button>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-850" />
            </>
          )}
          <OfflineIndicator />
          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-850" />
          <ThemeToggle />
          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-850" />
          <button
            onClick={handleLogout}
            className="p-1 text-rose-500 hover:bg-rose-500/10 active:scale-95 rounded-lg transition-all"
            title="Keluar Aplikasi"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* iOS Style Glassmorphism Bottom Tab Bar for Mobile */}
      <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 w-full h-[72px] pb-2 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-around px-4 z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
        {/* Tab 1: Beranda */}
        <Link 
          href={user?.role === "ADMIN" ? "/admin" : "/user"}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            pathname === "/admin" || pathname === "/user"
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-extrabold mt-1">Beranda</span>
        </Link>

        {/* Tab 2: Invoice */}
        <Link 
          href="/invoices"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            pathname === "/invoices"
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-extrabold mt-1">Invoice</span>
        </Link>

        {/* Tab 2.5: CMS (Hanya untuk ADMIN) */}
        {user?.role === "ADMIN" && (
          <Link 
            href="/admin/cms"
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
              pathname === "/admin/cms"
                ? "text-violet-600 dark:text-violet-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <Layout className="w-5 h-5" />
            <span className="text-[10px] font-extrabold mt-1">CMS</span>
          </Link>
        )}

        {/* Tab 3: Buat */}
        <Link 
          href="/invoices/new"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            pathname === "/invoices/new"
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-extrabold mt-1">Buat</span>
        </Link>

        {/* Tab 4: Profil */}
        <button
          onClick={() => setShowCompanyModal(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            showCompanyModal
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-extrabold mt-1">Profil</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header Top Bar */}
        <header className="hidden md:flex print:hidden items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold capitalize">
              {pathname === "/admin" && "Dashboard Admin Utama"}
              {pathname === "/admin/cms" && "Kelola Landing Page (CMS)"}
              {pathname === "/user" && "Dashboard Member"}
              {pathname === "/invoices/new" && "Buat Invoice Baru"}
              {pathname === "/invoices" && "Kelola Data Invoice"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 rounded-xl text-xs font-semibold transition-colors"
              >
                <Building className="w-3.5 h-3.5" />
                Logo &amp; Profil Perusahaan
              </button>
            )}

            <OfflineIndicator />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-600/20 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 print:p-0 print:pb-0">
          {children}
        </main>
      </div>

      {/* Global Company & Logo Settings Modal */}
      <CompanyModal
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
      />
    </div>
  );
}
