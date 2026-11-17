"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Save, RefreshCw, Layout, Sparkles, ShieldCheck, Heart, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { DEFAULT_CMS_CONTENT, type CMSContent } from "@/lib/cms-defaults";

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<"hero" | "about" | "features" | "pricing" | "cta">("hero");
  const [formData, setFormData] = useState<CMSContent>(DEFAULT_CMS_CONTENT);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"SYNCED" | "OFFLINE" | "PENDING">("SYNCED");

  // Load from Dexie in real time
  const cmsRecord = useLiveQuery(() => db.cms_settings.get("landing_content"), []);
  const syncStatusRecord = useLiveQuery(() => db.cms_settings.get("landing_content_sync_status"), []);

  useEffect(() => {
    if (syncStatusRecord) {
      setSyncStatus(syncStatusRecord.value as any);
    }
  }, [syncStatusRecord]);

  useEffect(() => {
    if (cmsRecord) {
      try {
        const parsed = JSON.parse(cmsRecord.value);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse CMS record:", e);
      }
    }
  }, [cmsRecord]);

  // Handle Input Changes
  const handleChange = (key: keyof CMSContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSyncStatus("PENDING");
  };

  // Save changes to Dexie and sync with MySQL if online
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataString = JSON.stringify(formData);
      
      // 1. Save to Dexie (Offline First)
      await db.cms_settings.put({
        key: "landing_content",
        value: dataString,
      });

      const isOnline = navigator.onLine;
      await db.cms_settings.put({
        key: "landing_content_sync_status",
        value: isOnline ? "SYNCED" : "OFFLINE"
      });
      setSyncStatus(isOnline ? "SYNCED" : "OFFLINE");

      // 2. Save to MySQL (if online)
      if (isOnline) {
        const res = await fetch("/api/cms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: dataString,
        });

        if (res.ok) {
          await db.cms_settings.put({
            key: "landing_content_sync_status",
            value: "SYNCED"
          });
          setSyncStatus("SYNCED");
        } else {
          await db.cms_settings.put({
            key: "landing_content_sync_status",
            value: "OFFLINE"
          });
          setSyncStatus("OFFLINE");
        }
      }
    } catch (err) {
      console.error("Save CMS Error:", err);
      await db.cms_settings.put({
        key: "landing_content_sync_status",
        value: "OFFLINE"
      });
      setSyncStatus("OFFLINE");
    } finally {
      setSaving(false);
    }
  };

  // Force sync from MySQL to Dexie
  const handleForceSync = async () => {
    if (!navigator.onLine) {
      alert("Anda sedang offline. Tidak dapat melakukan sinkronisasi dengan server.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cms", { cache: "no-store" });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          await db.cms_settings.put({
            key: "landing_content",
            value: JSON.stringify(result.data),
          });
          await db.cms_settings.put({
            key: "landing_content_sync_status",
            value: "SYNCED"
          });
          setSyncStatus("SYNCED");
          alert("Sinkronisasi konten dari server berhasil!");
        } else {
          alert("Server tidak memiliki data CMS yang tersimpan. Data lokal Anda aman.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Gagal melakukan sinkronisasi dengan server.");
    } finally {
      setSaving(false);
    }
  };

  // Auto-sync when online and syncStatus is "OFFLINE"
  useEffect(() => {
    const autoSync = async () => {
      if (navigator.onLine && syncStatus === "OFFLINE" && cmsRecord) {
        try {
          const res = await fetch("/api/cms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: cmsRecord.value,
          });
          if (res.ok) {
            await db.cms_settings.put({
              key: "landing_content_sync_status",
              value: "SYNCED"
            });
            setSyncStatus("SYNCED");
          }
        } catch (e) {
          console.error("Auto-sync CMS failed:", e);
        }
      }
    };

    autoSync();
    window.addEventListener("online", autoSync);
    return () => window.removeEventListener("online", autoSync);
  }, [syncStatus, cmsRecord]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-violet-500" />
            Landing Page CMS
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Ubah teks, judul, deskripsi, dan tombol yang tampil di Landing Page utama secara real-time.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {syncStatus === "SYNCED" && (
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold shadow-sm border border-emerald-500/20">
              ● Terhubung &amp; Sinkron (Online)
            </span>
          )}
          {syncStatus === "OFFLINE" && (
            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-extrabold shadow-sm border border-amber-500/20">
              ● Tersimpan Lokal (Offline)
            </span>
          )}
          {syncStatus === "PENDING" && (
            <span className="px-3 py-1.5 bg-violet-500/10 text-violet-600 rounded-full text-[10px] font-extrabold shadow-sm border border-violet-500/20 animate-pulse">
              ● Ada Perubahan Belum Disimpan
            </span>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleForceSync} 
            title="Sinkronisasi dari Database Server"
            className="h-8 w-8 rounded-xl border-[#EAE2FB]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs Switcher (Claymorphic) */}
      <div className="flex flex-wrap p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("hero")}
          className={`flex-1 min-w-[80px] py-2 px-4 rounded-[18px] text-xs font-bold transition-all ${
            activeTab === "hero"
              ? "bg-white dark:bg-slate-800 text-violet-600 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Hero Section
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`flex-1 min-w-[80px] py-2 px-4 rounded-[18px] text-xs font-bold transition-all ${
            activeTab === "about"
              ? "bg-white dark:bg-slate-800 text-violet-600 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tentang Kami
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("features")}
          className={`flex-1 min-w-[80px] py-2 px-4 rounded-[18px] text-xs font-bold transition-all ${
            activeTab === "features"
              ? "bg-white dark:bg-slate-800 text-violet-600 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Fitur Unggulan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`flex-1 min-w-[80px] py-2 px-4 rounded-[18px] text-xs font-bold transition-all ${
            activeTab === "pricing"
              ? "bg-white dark:bg-slate-800 text-violet-600 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Paket Harga
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cta")}
          className={`flex-1 min-w-[80px] py-2 px-4 rounded-[18px] text-xs font-bold transition-all ${
            activeTab === "cta"
              ? "bg-white dark:bg-slate-800 text-violet-600 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Footer CTA
        </button>
      </div>

      {/* Main CMS Editor Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Hero Section */}
        {activeTab === "hero" && (
          <Card className="rounded-[32px] border border-[#EAE2FB] dark:border-slate-800 shadow-[0_16px_32px_rgba(139,92,246,0.03)] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-500" /> Pengaturan Hero Banner
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">
                Ubah teks tajuk promosi utama paling atas di Landing Page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pita / Badge Atas Hero (e.g. SaaS INVOICE MODERN UNTUK UMKM)</label>
                <Input
                  value={formData.hero_badge || ""}
                  onChange={(e) => handleChange("hero_badge", e.target.value)}
                  placeholder="Masukkan teks badge..."
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Judul Utama Hero (h1)</label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  placeholder="Masukkan judul utama..."
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sub-Teks Hero</label>
                <Input
                  value={formData.hero_subtext}
                  onChange={(e) => handleChange("hero_subtext", e.target.value)}
                  placeholder="Masukkan sub-deskripsi..."
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Teks Tombol CTA</label>
                <Input
                  value={formData.hero_cta}
                  onChange={(e) => handleChange("hero_cta", e.target.value)}
                  placeholder="Contoh: Get Started / Mulai Sekarang"
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 1.5: Tentang Kami Section */}
        {activeTab === "about" && (
          <Card className="rounded-[32px] border border-[#EAE2FB] dark:border-slate-800 shadow-[0_16px_32px_rgba(139,92,246,0.03)] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-violet-500" /> Pengaturan Tentang Kami
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">
                Ubah teks penjelas di bagian Tentang Kami di Landing Page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pita / Badge Tentang Kami (e.g. Tentang Kami)</label>
                <Input
                  value={formData.about_badge || ""}
                  onChange={(e) => handleChange("about_badge", e.target.value)}
                  placeholder="Masukkan teks badge..."
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Judul Utama Tentang Kami</label>
                <Input
                  value={formData.about_title || ""}
                  onChange={(e) => handleChange("about_title", e.target.value)}
                  placeholder="Masukkan judul utama..."
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Deskripsi Paragraf 1</label>
                <textarea
                  value={formData.about_desc1 || ""}
                  onChange={(e) => handleChange("about_desc1", e.target.value)}
                  placeholder="Masukkan deskripsi paragraf 1..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-[#EAE2FB] bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Deskripsi Paragraf 2</label>
                <textarea
                  value={formData.about_desc2 || ""}
                  onChange={(e) => handleChange("about_desc2", e.target.value)}
                  placeholder="Masukkan deskripsi paragraf 2..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-[#EAE2FB] bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-violet-500 block">Pilar 1 (Kiri)</span>
                  <Input
                    value={formData.about_pillar1_title || ""}
                    onChange={(e) => handleChange("about_pillar1_title", e.target.value)}
                    placeholder="Judul Pilar 1"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                  <Input
                    value={formData.about_pillar1_desc || ""}
                    onChange={(e) => handleChange("about_pillar1_desc", e.target.value)}
                    placeholder="Deskripsi Pilar 1"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-violet-500 block">Pilar 2 (Tengah)</span>
                  <Input
                    value={formData.about_pillar2_title || ""}
                    onChange={(e) => handleChange("about_pillar2_title", e.target.value)}
                    placeholder="Judul Pilar 2"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                  <Input
                    value={formData.about_pillar2_desc || ""}
                    onChange={(e) => handleChange("about_pillar2_desc", e.target.value)}
                    placeholder="Deskripsi Pilar 2"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-violet-500 block">Pilar 3 (Kanan)</span>
                  <Input
                    value={formData.about_pillar3_title || ""}
                    onChange={(e) => handleChange("about_pillar3_title", e.target.value)}
                    placeholder="Judul Pilar 3"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                  <Input
                    value={formData.about_pillar3_desc || ""}
                    onChange={(e) => handleChange("about_pillar3_desc", e.target.value)}
                    placeholder="Deskripsi Pilar 3"
                    className="rounded-xl border-[#EAE2FB] text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Features Section */}
        {activeTab === "features" && (
          <Card className="rounded-[32px] border border-[#EAE2FB] dark:border-slate-800 shadow-[0_16px_32px_rgba(139,92,246,0.03)] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-violet-500" /> Pengaturan Fitur Unggulan
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">
                Ubah tajuk dan konten 4 kartu fitur utama yang ditampilkan di Landing Page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Header Teks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Judul Section Fitur (h2)</label>
                  <Input
                    value={formData.features_title}
                    onChange={(e) => handleChange("features_title", e.target.value)}
                    className="rounded-xl border-[#EAE2FB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sub-Teks Section Fitur</label>
                  <Input
                    value={formData.features_subtext}
                    onChange={(e) => handleChange("features_subtext", e.target.value)}
                    className="rounded-xl border-[#EAE2FB]"
                  />
                </div>
              </div>

              {/* Grid 4 Kartu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kartu 1 */}
                <div className="p-4 bg-pink-50/30 border border-pink-100/50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-pink-600 uppercase">Kartu Fitur 1</span>
                  <Input
                    value={formData.feat1_title}
                    onChange={(e) => handleChange("feat1_title", e.target.value)}
                    placeholder="Judul Fitur 1"
                    className="bg-white text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.feat1_desc}
                    onChange={(e) => handleChange("feat1_desc", e.target.value)}
                    placeholder="Deskripsi Fitur 1"
                    className="bg-white text-xs rounded-lg"
                  />
                  <Input
                    value={formData.feat1_badge}
                    onChange={(e) => handleChange("feat1_badge", e.target.value)}
                    placeholder="Badge Teks"
                    className="bg-white text-xs rounded-lg"
                  />
                </div>

                {/* Kartu 2 */}
                <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase">Kartu Fitur 2</span>
                  <Input
                    value={formData.feat2_title}
                    onChange={(e) => handleChange("feat2_title", e.target.value)}
                    placeholder="Judul Fitur 2"
                    className="bg-white text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.feat2_desc}
                    onChange={(e) => handleChange("feat2_desc", e.target.value)}
                    placeholder="Deskripsi Fitur 2"
                    className="bg-white text-xs rounded-lg"
                  />
                  <Input
                    value={formData.feat2_badge}
                    onChange={(e) => handleChange("feat2_badge", e.target.value)}
                    placeholder="Badge Teks"
                    className="bg-white text-xs rounded-lg"
                  />
                </div>

                {/* Kartu 3 */}
                <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Kartu Fitur 3</span>
                  <Input
                    value={formData.feat3_title}
                    onChange={(e) => handleChange("feat3_title", e.target.value)}
                    placeholder="Judul Fitur 3"
                    className="bg-white text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.feat3_desc}
                    onChange={(e) => handleChange("feat3_desc", e.target.value)}
                    placeholder="Deskripsi Fitur 3"
                    className="bg-white text-xs rounded-lg"
                  />
                  <Input
                    value={formData.feat3_badge}
                    onChange={(e) => handleChange("feat3_badge", e.target.value)}
                    placeholder="Badge Teks"
                    className="bg-white text-xs rounded-lg"
                  />
                </div>

                {/* Kartu 4 */}
                <div className="p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase">Kartu Fitur 4</span>
                  <Input
                    value={formData.feat4_title}
                    onChange={(e) => handleChange("feat4_title", e.target.value)}
                    placeholder="Judul Fitur 4"
                    className="bg-white text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.feat4_desc}
                    onChange={(e) => handleChange("feat4_desc", e.target.value)}
                    placeholder="Deskripsi Fitur 4"
                    className="bg-white text-xs rounded-lg"
                  />
                  <Input
                    value={formData.feat4_badge}
                    onChange={(e) => handleChange("feat4_badge", e.target.value)}
                    placeholder="Badge Teks"
                    className="bg-white text-xs rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Pricing Section */}
        {activeTab === "pricing" && (
          <Card className="rounded-[32px] border border-[#EAE2FB] dark:border-slate-800 shadow-[0_16px_32px_rgba(139,92,246,0.03)] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-500" /> Pengaturan Paket Harga (Pricing)
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">
                Ubah judul paket, deskripsi, harga, dan pita promo di Pricing cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Header Teks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Judul Section Pricing</label>
                  <Input
                    value={formData.pricing_title}
                    onChange={(e) => handleChange("pricing_title", e.target.value)}
                    className="rounded-xl border-[#EAE2FB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sub-Teks Section Pricing</label>
                  <Input
                    value={formData.pricing_subtext}
                    onChange={(e) => handleChange("pricing_subtext", e.target.value)}
                    className="rounded-xl border-[#EAE2FB]"
                  />
                </div>
              </div>

              {/* Grid 2 Kartu Harga */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paket Bulanan */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">Paket Bulanan</span>
                  <Input
                    value={formData.price1_title}
                    onChange={(e) => handleChange("price1_title", e.target.value)}
                    placeholder="Nama Paket"
                    className="bg-white dark:bg-slate-900 text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.price1_desc}
                    onChange={(e) => handleChange("price1_desc", e.target.value)}
                    placeholder="Deskripsi Singkat"
                    className="bg-white dark:bg-slate-900 text-xs rounded-lg"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={formData.price1_original || ""}
                      onChange={(e) => handleChange("price1_original", e.target.value)}
                      placeholder="Harga Coret"
                      title="Harga Asli Sebelum Promo"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg font-semibold text-slate-400"
                    />
                    <Input
                      value={formData.price1_amount}
                      onChange={(e) => handleChange("price1_amount", e.target.value)}
                      placeholder="Harga Promo"
                      title="Harga Promo Saat Ini"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg font-bold text-slate-800 dark:text-white"
                    />
                    <Input
                      value={formData.price1_period}
                      onChange={(e) => handleChange("price1_period", e.target.value)}
                      placeholder="Periode"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Paket Tahunan */}
                <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/20 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-violet-600 uppercase">Paket Tahunan</span>
                  <Input
                    value={formData.price2_title}
                    onChange={(e) => handleChange("price2_title", e.target.value)}
                    placeholder="Nama Paket"
                    className="bg-white dark:bg-slate-900 text-xs font-bold rounded-lg"
                  />
                  <Input
                    value={formData.price2_desc}
                    onChange={(e) => handleChange("price2_desc", e.target.value)}
                    placeholder="Deskripsi Singkat"
                    className="bg-white dark:bg-slate-900 text-xs rounded-lg"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={formData.price2_original || ""}
                      onChange={(e) => handleChange("price2_original", e.target.value)}
                      placeholder="Harga Coret"
                      title="Harga Asli Sebelum Promo"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg font-semibold text-slate-400"
                    />
                    <Input
                      value={formData.price2_amount}
                      onChange={(e) => handleChange("price2_amount", e.target.value)}
                      placeholder="Harga Promo"
                      title="Harga Promo Saat Ini"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg font-bold text-slate-800 dark:text-white"
                    />
                    <Input
                      value={formData.price2_period}
                      onChange={(e) => handleChange("price2_period", e.target.value)}
                      placeholder="Periode"
                      className="bg-white dark:bg-slate-900 text-xs rounded-lg"
                    />
                  </div>
                  <Input
                    value={formData.price2_badge}
                    onChange={(e) => handleChange("price2_badge", e.target.value)}
                    placeholder="Pita Banner Promo (e.g. Bayar 10 Bulan, Dapat 12 Bulan!)"
                    className="bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Footer CTA Section */}
        {activeTab === "cta" && (
          <Card className="rounded-[32px] border border-[#EAE2FB] dark:border-slate-800 shadow-[0_16px_32px_rgba(139,92,246,0.03)] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-violet-500" /> Pengaturan Extra Call-To-Action (Footer CTA)
              </CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">
                Ubah judul ajakan terakhir dan tombol di bagian terbawah sebelum footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Judul Banner Ajakan (h2)</label>
                <Input
                  value={formData.cta_title}
                  onChange={(e) => handleChange("cta_title", e.target.value)}
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Deskripsi Ajakan</label>
                <Input
                  value={formData.cta_subtext}
                  onChange={(e) => handleChange("cta_subtext", e.target.value)}
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Teks Tombol Aksi</label>
                <Input
                  value={formData.cta_btn}
                  onChange={(e) => handleChange("cta_btn", e.target.value)}
                  className="rounded-xl border-[#EAE2FB]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit & Reset Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="gradient"
            disabled={saving}
            className="h-11 px-8 rounded-full font-extrabold shadow-md gap-1.5 text-xs tracking-wider"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan CMS"}
          </Button>
        </div>
      </form>
    </div>
  );
}
