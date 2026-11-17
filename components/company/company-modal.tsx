"use client";

import { useEffect, useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Building, Upload, Image as ImageIcon, X, Save, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { saveCompany, deleteCompany } from "@/lib/db/crud";
import { processCompanyLogoFile } from "@/lib/image-compression";
import type { Company } from "@/types/database";

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany?: (companyId: string) => void;
  initialCompanyId?: string;
}

export function CompanyModal({
  open,
  onClose,
  onSelectCompany,
  initialCompanyId,
}: CompanyModalProps) {
  const companiesList = useLiveQuery(() => db.companies.toArray(), []);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [isNewCompany, setIsNewCompany] = useState<boolean>(false);
  const [initializedForOpen, setInitializedForOpen] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankAccountNo, setBankAccountNo] = useState<string>("");
  const [bankAccountName, setBankAccountName] = useState<string>("");
  const [logoUri, setLogoUri] = useState<string>("");

  const [logoUploading, setLogoUploading] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Load current session user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice_pwa_session");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse session:", e);
        }
      }
    }
  }, []);

  // Filter companies: Admin sees all; regular user sees their own or system default companies
  const userCompanies = useMemo(() => {
    if (!companiesList) return [];
    return companiesList.filter((comp) => {
      if (!currentUser) return true;
      if (currentUser.role === "ADMIN") return true;
      return comp.created_by_user_id === currentUser.id || !comp.created_by_user_id;
    });
  }, [companiesList, currentUser]);

  // Sync latest companies from MySQL when modal is opened and online
  useEffect(() => {
    if (open && typeof window !== "undefined" && navigator.onLine) {
      const url = "/api/companies" + (currentUser?.id ? `?userId=${encodeURIComponent(currentUser.id)}` : "");
      fetch(url)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
            db.companies.bulkPut(resData.data).catch(console.error);
          }
        })
        .catch(() => {});
    }
  }, [open, currentUser]);

  // Populate form fields based on target company
  const populateFields = (comp: Company | null) => {
    if (comp) {
      setIsNewCompany(false);
      setSelectedCompId(comp.id);
      setName(comp.name || "");
      setAddress(comp.address || "");
      setPhone(comp.phone || "");
      setEmail(comp.email || "");
      setBankName(comp.bank_name || "");
      setBankAccountNo(comp.bank_account_no || "");
      setBankAccountName(comp.bank_account_name || "");
      setLogoUri(comp.logo || "");
    } else {
      setIsNewCompany(true);
      setSelectedCompId("");
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setBankName("");
      setBankAccountNo("");
      setBankAccountName("");
      setLogoUri("");
    }
    setLogoError("");
  };

  // Safe one-time initialization when modal opens (does NOT overwrite user keystrokes)
  useEffect(() => {
    if (!open) {
      setInitializedForOpen(false);
      return;
    }

    if (open && !initializedForOpen) {
      const targetId = initialCompanyId || selectedCompId;
      const found = userCompanies.find((c) => c.id === targetId) || userCompanies[0];
      if (found) {
        populateFields(found);
      } else {
        populateFields(null);
      }
      setInitializedForOpen(true);
    }
  }, [open, initializedForOpen, userCompanies, initialCompanyId, selectedCompId]);

  // Handle switching company in dropdown
  const handleSelectCompany = (compId: string) => {
    if (compId === "NEW") {
      populateFields(null);
    } else {
      const found = userCompanies.find((c) => c.id === compId);
      if (found) {
        populateFields(found);
      }
    }
  };

  // Handle "+ Baru" button click
  const handleCreateNew = () => {
    populateFields(null);
  };

  // Handle Logo Upload File Selection (Max 2MB, WebP HD)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError("");
    setLogoUploading(true);

    const result = await processCompanyLogoFile(file, 2 * 1024 * 1024);

    setLogoUploading(false);

    if (!result.success || !result.dataUri) {
      setLogoError(result.error || "Gagal memproses gambar logo.");
      return;
    }

    setLogoUri(result.dataUri);
  };

  // Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setSaving(true);
    const compId = isNewCompany || !selectedCompId ? `cmp-${Date.now()}` : selectedCompId;

    const companyData: Company = {
      id: compId,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bank_name: bankName.trim(),
      bank_account_no: bankAccountNo.trim(),
      bank_account_name: bankAccountName.trim(),
      logo: logoUri,
      created_by_user_id: currentUser?.id || "usr-admin-01",
      created_at: new Date().toISOString(),
    };

    try {
      await saveCompany(companyData);

      if (onSelectCompany) {
        onSelectCompany(compId);
      }

      onClose();
    } catch (err) {
      console.error("Gagal menyimpan profil perusahaan:", err);
      setLogoError("Terjadi kesalahan saat menyimpan data perusahaan.");
    } finally {
      setSaving(false);
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    if (!selectedCompId || isNewCompany) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus profil perusahaan "${name}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteCompany(selectedCompId);

      const remaining = userCompanies.filter((c) => c.id !== selectedCompId);
      if (remaining.length > 0) {
        populateFields(remaining[0]);
        if (onSelectCompany) onSelectCompany(remaining[0].id);
      } else {
        populateFields(null);
        if (onSelectCompany) onSelectCompany("");
      }
    } catch (err) {
      console.error("Gagal menghapus perusahaan:", err);
      alert("Gagal menghapus profil perusahaan.");
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Kelola Perusahaan & Logo</h3>
              <p className="text-xs text-slate-400">Pengaturan profil perusahaan penerbit invoice</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Selector dropdown if companies exist or in creation mode */}
        <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pilih Perusahaan:
            </label>
            <select
              value={isNewCompany ? "NEW" : selectedCompId}
              onChange={(e) => handleSelectCompany(e.target.value)}
              className="w-full h-8 bg-transparent text-xs font-bold text-blue-400 focus:outline-none cursor-pointer"
            >
              {userCompanies.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white font-medium">
                  {c.name}
                </option>
              ))}
              <option value="NEW" className="bg-slate-900 text-blue-400 font-bold">
                + Buat Profil Perusahaan Baru
              </option>
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            className="text-xs shrink-0 flex items-center gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-600/10 hover:text-blue-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Baru
          </Button>
        </div>

        {/* Mode Indicator Badge */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-slate-400">
            Status Form:{" "}
            <span className={isNewCompany ? "text-emerald-400 font-bold" : "text-blue-400 font-bold"}>
              {isNewCompany ? "Mode Buat Perusahaan Baru" : `Mode Edit: ${name || "Perusahaan"}`}
            </span>
          </span>
          <span className="text-[11px] text-slate-500">Tersimpan offline & online</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload Section */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Logo Perusahaan (Maksimal 2MB, HD WebP):</span>
              <span className="text-[10px] text-emerald-400 font-medium">Auto Compress WebP</span>
            </label>

            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                {logoUri ? (
                  <img src={logoUri} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>

              {/* File Input Controls */}
              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-md shadow-blue-600/20">
                  <Upload className="w-3.5 h-3.5" />
                  {logoUri ? "Ganti Logo" : "Upload Logo (Maks 2MB)"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoUri && (
                  <button
                    type="button"
                    onClick={() => setLogoUri("")}
                    className="text-xs text-rose-400 hover:underline block"
                  >
                    Hapus Logo
                  </button>
                )}

                {logoUploading && <p className="text-xs text-blue-400 animate-pulse">Memproses gambar...</p>}
                {logoError && <p className="text-xs text-rose-400">{logoError}</p>}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                Nama Perusahaan Penerbit <span className="text-rose-400">*</span>
              </label>
              <Input
                type="text"
                required
                placeholder="Padi Tech Solutions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                Alamat Lengkap <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Jl. Malioboro No. 88, Yogyakarta"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">No. Telepon</label>
                <Input
                  type="text"
                  placeholder="0812-3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Email Perusahaan</label>
                <Input
                  type="email"
                  placeholder="info@paditech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs"
                />
              </div>
            </div>

            {/* Bank Info */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                Detail Rekening Bank (Instruksi Pembayaran)
              </p>
              <Input
                type="text"
                placeholder="Nama Bank (misal: Bank BSI / BCA)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="No. Rekening"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-xs"
                />
                <Input
                  type="text"
                  placeholder="Atas Nama"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
            <div>
              {!isNewCompany && selectedCompId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deleting || saving}
                  onClick={handleDeleteCompany}
                  className="text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Menghapus..." : "Hapus Perusahaan"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
                Batal
              </Button>
              <Button type="submit" variant="gradient" disabled={saving || deleting}>
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Menyimpan..." : "Simpan Profil & Logo"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
