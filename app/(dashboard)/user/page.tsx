"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { PlusCircle, FileText, CheckCircle, Clock, Search, ArrowRight, Trash2, UserCheck, Eye, Inbox, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/db/crud";
import { formatRupiah } from "@/lib/terbilang";
import type { InvoiceStatus } from "@/types/database";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

export default function UserDashboard() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
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
    return null;
  });
  const [greeting, setGreeting] = useState<string>("Selamat Datang");
  const [profileImage, setProfileImage] = useState<string>("/icons/char-open.png");

  useEffect(() => {
    if (currentUser) {
      db.users.get(currentUser.id).then((dbUser) => {
        if (dbUser && dbUser.profile_image) {
          setProfileImage(dbUser.profile_image);
        }
      }).catch(err => console.error(err));
    }

    // Friendly Indonesian greetings based on current time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      setGreeting("Selamat Pagi");
    } else if (hour >= 11 && hour < 15) {
      setGreeting("Selamat Siang");
    } else if (hour >= 15 && hour < 18) {
      setGreeting("Selamat Sore");
    } else {
      setGreeting("Selamat Malam");
    }

    // Listen to profile image updates dispatched from layout
    const handleProfileImageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setProfileImage(customEvent.detail);
      }
    };
    window.addEventListener("profile-image-updated", handleProfileImageUpdate);

    return () => {
      window.removeEventListener("profile-image-updated", handleProfileImageUpdate);
    };
  }, []);

  // Live queries from Dexie IndexedDB
  const invoices = useLiveQuery(() => db.invoices.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  // User-isolated invoices: Only show invoices created by current user
  const userInvoices = (invoices || []).filter((inv) => {
    if (!currentUser) return true; // Fallback before session loads
    return inv.created_by_user_id === currentUser.id;
  });

  const getClientName = (clientId: string) => {
    const c = clients?.find((item) => item.id === clientId);
    return c ? c.name : "Klien Umum";
  };

  const filteredInvoices = userInvoices.filter((inv) => {
    const clientName = getClientName(inv.client_id).toLowerCase();
    return (
      inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.includes(searchTerm.toLowerCase())
    );
  });

  const totalHariIni = userInvoices.reduce((acc, curr) => acc + curr.grand_total, 0);
  const totalLunasCount = userInvoices.filter((i) => i.status === "PAID").length;
  const totalPendingCount = userInvoices.filter((i) => i.sync_status === "PENDING").length;

  const handleStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    await updateInvoiceStatus(id, newStatus);
  };

  const handleDelete = async (id: string, invoiceNo: string) => {
    if (confirm(`Hapus invoice ${invoiceNo}?`)) {
      await deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Playful & Modern 3D/Claymorphic Greeting Banner (Dashboard-Ref style) */}
      <div className="relative overflow-hidden rounded-[36px] bg-[#EDE7F6] dark:bg-slate-900 border border-white/60 dark:border-slate-800 p-6 sm:p-8 text-slate-800 dark:text-slate-100 shadow-clay-white flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Decorative Floating Sparkles & Files */}
        <FileText className="hidden md:block absolute w-8 h-8 text-violet-300/30 dark:text-violet-750/20 top-4 left-1/4 animate-bounce pointer-events-none" style={{ animationDuration: '3s' }} />
        <Sparkles className="hidden md:block absolute w-6 h-6 text-pink-355/40 dark:text-pink-700/20 bottom-4 left-1/3 animate-pulse pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 relative z-10 flex-1">
          {/* Character Image (Good Morning Style) */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-violet-100 flex items-center justify-center">
            <img src={profileImage} alt="Profile Character" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-200/50 dark:bg-violet-950/60 rounded-full text-[10px] font-extrabold tracking-wide text-violet-800 dark:text-violet-200">
              <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400 fill-violet-600/30" />
              <span>SaaS Member Workspace &amp; Offline Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-violet-950 dark:text-white">
              {greeting}, {currentUser?.name || "Member"}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md font-semibold leading-relaxed">
              Invoice yang Anda buat tersimpan secara mandiri dan aman di akun Anda ({currentUser?.email}). Data tersimpan lokal di IndexedDB dan otomatis sinkron saat online.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 relative z-10 w-full md:w-auto justify-end">
          <Link href="/invoices/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 px-6 rounded-full bg-white dark:bg-slate-800 hover:bg-violet-50 text-violet-750 dark:text-violet-200 font-extrabold text-xs tracking-wide shadow-[0_8px_16px_-4px_rgba(139,92,246,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] hover:scale-105 active:scale-95 transition-all gap-2 border border-violet-100/40">
              <PlusCircle className="w-4 h-4 text-violet-600 fill-violet-200" />
              Buat Invoice Baru
            </Button>
          </Link>

          {/* Elegant Clay Plant Pot (Bunga) */}
          <div className="hidden sm:block shrink-0 animate-pulse" style={{ animationDuration: '6s' }}>
            <svg width="70" height="90" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M35 80 L65 80 L60 110 L40 110 Z" fill="#E0A98C" stroke="#C88E72" strokeWidth="3" />
              <ellipse cx="50" cy="80" rx="15" ry="4" fill="#C88E72" />
              <ellipse cx="50" cy="80" rx="13" ry="3" fill="#6D4C41" />
              <path d="M50 80 Q50 40 50 30" stroke="#7CB342" strokeWidth="5" strokeLinecap="round" />
              <path d="M50 65 Q30 55 25 45 Q35 40 50 55 Z" fill="#8BC34A" stroke="#7CB342" strokeWidth="2.5" />
              <path d="M50 60 Q70 50 75 40 Q65 35 50 50 Z" fill="#8BC34A" stroke="#7CB342" strokeWidth="2.5" />
              <path d="M50 35 Q40 20 50 10 Q60 20 50 35 Z" fill="#9CCC65" stroke="#8BC34A" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Member Glassmorphic Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* 1. Total Tagihan - Glass Lavender */}
        <div className="bg-[#EAE2FB]/35 dark:bg-purple-950/20 backdrop-blur-md border border-[#EAE2FB]/65 dark:border-purple-800/25 rounded-[28px] p-6 shadow-clay-purple transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950/70 dark:text-purple-300">Total Tagihan Keseluruhan</span>
            <div className="p-3 bg-white/90 dark:bg-purple-900/50 rounded-2xl text-purple-700 dark:text-purple-200 shadow-sm flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-purple-950 dark:text-purple-100 tracking-tight font-mono">
              {formatRupiah(totalHariIni)}
            </h3>
            <p className="text-[10px] font-semibold text-purple-900/60 dark:text-purple-400">Total tagihan Anda</p>
          </div>
        </div>

        {/* 2. Invoice Lunas - Glass Mint Blue */}
        <div className="bg-[#D3EEFD]/35 dark:bg-sky-950/20 backdrop-blur-md border border-[#D3EEFD]/65 dark:border-sky-800/25 rounded-[28px] p-6 shadow-clay-blue transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-950/70 dark:text-sky-300">Invoice Lunas (PAID)</span>
            <div className="p-3 bg-white/90 dark:bg-sky-900/50 rounded-2xl text-sky-700 dark:text-sky-200 shadow-sm flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight">
              {totalLunasCount} Dokumen
            </h3>
            <p className="text-[10px] font-semibold text-sky-900/60 dark:text-sky-400">Lunas terbayar</p>
          </div>
        </div>

        {/* 3. Pending Sync - Glass Pink */}
        <div className="bg-[#FCE2EB]/35 dark:bg-rose-950/20 backdrop-blur-md border border-[#FCE2EB]/65 dark:border-rose-800/25 rounded-[28px] p-6 shadow-clay-pink transition-transform hover:-translate-y-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-950/70 dark:text-rose-300">Pending Sync Offline</span>
            <div className="p-3 bg-white/90 dark:bg-rose-900/50 rounded-2xl text-rose-700 dark:text-rose-200 shadow-sm flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-950 dark:text-rose-100 tracking-tight">
              {totalPendingCount} Dokumen
            </h3>
            <p className="text-[10px] font-semibold text-rose-900/60 dark:text-rose-400">Antrean sinkron database</p>
          </div>
        </div>
      </div>

      {/* Invoice History Card Panel (Glassmorphism style) */}
      <div className="bg-white/40 dark:bg-slate-900/30 backdrop-blur-md rounded-[32px] border border-white/60 dark:border-slate-800/40 p-6 shadow-clay-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/50 dark:border-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Invoice Saya</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Daftar faktur tagihan yang dibuat oleh akun {currentUser?.name || "Member"}</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari no. invoice / klien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full rounded-full border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 focus-visible:ring-violet-500 shadow-clay-input"
            />
          </div>
        </div>

        <div className="mt-6">
          {userInvoices.length === 0 ? (
            <div className="py-16 text-center space-y-4 rounded-[24px] bg-slate-50/40 dark:bg-slate-950/20 backdrop-blur-sm border border-dashed border-slate-200/60 dark:border-slate-800/60">
              <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
                <Inbox className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Belum Ada Invoice</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Akun Anda belum membuat faktur invoice. Klik tombol "Buat Invoice Baru" untuk memulai!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-medium bg-slate-50/40 dark:bg-slate-900/30 rounded-2xl">
                  Tidak ada invoice yang sesuai dengan pencarian &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border border-white/60 dark:border-slate-800/40 rounded-3xl shadow-clay-white hover:shadow-md hover:scale-[1.01] transition-all"
                  >
                    {/* Mobile Layout (Stacked structure to prevent overflow and clipping) */}
                    <div className="flex flex-col gap-3.5 sm:hidden">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-violet-600 dark:text-violet-300 font-bold text-xs font-mono">
                          {inv.invoice_no}
                        </span>
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                          className={`h-8 px-3 text-[10px] font-extrabold rounded-full border-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                            inv.status === "PAID"
                              ? "bg-[#D1F7E2] text-emerald-800"
                              : inv.status === "UNPAID"
                              ? "bg-[#FCDCDD] text-rose-800"
                              : inv.status === "DRAFT"
                              ? "bg-slate-100 text-slate-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          <option value="UNPAID">🔴 UNPAID</option>
                          <option value="PAID">🟢 PAID</option>
                          <option value="DRAFT">⚪ DRAFT</option>
                          <option value="CANCELLED">⚫ CANCELLED</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                          {getClientName(inv.client_id)}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>Dibuat: {inv.issue_date}</span>
                          <span>•</span>
                          <span>Jatuh Tempo: {inv.due_date}</span>
                        </p>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 my-1" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Tagihan</p>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white font-mono">
                            {formatRupiah(inv.grand_total)}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="outline" size="sm" className="h-8 px-4 rounded-full text-[10px] font-extrabold hover:bg-slate-50 border-slate-200">
                              Detail
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(inv.id, inv.invoice_no)}
                            className="h-8 w-8 p-0 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border-none shadow-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout (Horizontal row layout) */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-2xl text-violet-600 dark:text-violet-300 font-bold text-xs font-mono">
                          {inv.invoice_no}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                            {getClientName(inv.client_id)}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <span>Dibuat: {inv.issue_date}</span>
                            <span>•</span>
                            <span>Jatuh Tempo: {inv.due_date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tagihan</p>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white font-mono">
                            {formatRupiah(inv.grand_total)}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                            className={`h-8 px-3 text-[10px] font-extrabold rounded-full border-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm ${
                              inv.status === "PAID"
                                ? "bg-[#D1F7E2] text-emerald-800"
                                : inv.status === "UNPAID"
                                ? "bg-[#FCDCDD] text-rose-800"
                                : inv.status === "DRAFT"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <option value="UNPAID">🔴 UNPAID</option>
                            <option value="PAID">🟢 PAID</option>
                            <option value="DRAFT">⚪ DRAFT</option>
                            <option value="CANCELLED">⚫ CANCELLED</option>
                          </select>

                          <div className="flex items-center gap-1.5">
                            <Link href={`/invoices/${inv.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-4 rounded-full text-[10px] font-extrabold hover:bg-slate-50 border-slate-200">
                                Detail
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(inv.id, inv.invoice_no)}
                              className="h-8 w-8 p-0 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border-none shadow-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
