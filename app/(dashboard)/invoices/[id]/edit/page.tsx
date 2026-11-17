"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  UserPlus,
  Calculator,
  Building,
  Calendar,
  DollarSign,
  CheckCircle2,
  X,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyModal } from "@/components/company/company-modal";
import { db } from "@/lib/db";
import { saveInvoice, saveClient, saveCompany } from "@/lib/db/crud";
import { terbilang, formatRupiah } from "@/lib/terbilang";
import type { Client, Company, Invoice, InvoiceItem, InvoiceStatus } from "@/types/database";

interface FormItem {
  id: string;
  description: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Load database entities
  const existingInvoice = useLiveQuery(() => db.invoices.get(id), [id]);
  const existingItems = useLiveQuery(
    () => db.invoiceItems.where("invoice_id").equals(id).toArray(),
    [id]
  );
  const clientsList = useLiveQuery(() => db.clients.toArray(), []);
  const companiesList = useLiveQuery(() => db.companies.toArray(), []);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<InvoiceStatus>("UNPAID");
  const [taxRate, setTaxRate] = useState<number>(11);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load currentUser on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice_pwa_session");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Filter companies and clients strictly for user data privacy
  const userCompanies = (companiesList || []).filter((comp) => {
    if (!currentUser) return true;
    if (currentUser.role === "ADMIN") return true;
    return comp.created_by_user_id === currentUser.id || !comp.created_by_user_id;
  });

  const userClients = (clientsList || []).filter((cli) => {
    if (!currentUser) return true;
    return cli.created_by_user_id === currentUser.id;
  });

  // Modal States
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>("");
  const [newClientEmail, setNewClientEmail] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");
  const [newClientAddress, setNewClientAddress] = useState<string>("");

  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);
  const [newCompName, setNewCompName] = useState<string>("");
  const [newCompAddress, setNewCompAddress] = useState<string>("");
  const [newCompPhone, setNewCompPhone] = useState<string>("");
  const [newCompEmail, setNewCompEmail] = useState<string>("");
  const [newCompBankName, setNewCompBankName] = useState<string>("");
  const [newCompBankNo, setNewCompBankNo] = useState<string>("");
  const [newCompBankOwner, setNewCompBankOwner] = useState<string>("");

  // Populate existing data
  useEffect(() => {
    if (existingInvoice && !loaded) {
      setInvoiceNo(existingInvoice.invoice_no);
      setSelectedCompanyId(existingInvoice.company_id || (companiesList?.[0]?.id ?? "cmp-01"));
      setSelectedClientId(existingInvoice.client_id);
      setIssueDate(existingInvoice.issue_date);
      setDueDate(existingInvoice.due_date);
      setStatus(existingInvoice.status);
      setTaxRate(existingInvoice.tax_rate ?? 11);
      setOverallDiscount(existingInvoice.discount ?? 0);
      setNotes(existingInvoice.notes ?? "");
      setLoaded(true);
    }
  }, [existingInvoice, companiesList, loaded]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0 && items.length === 0) {
      setItems(
        existingItems.map((item) => ({
          id: item.id,
          description: item.description,
          qty: item.qty,
          price: item.price,
          discount: item.discount,
          total: item.total,
        }))
      );
    }
  }, [existingItems, items]);

  // ESC Key Listener for Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowClientModal(false);
        setShowCompanyModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Item Changes
  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    const disc = Number(item.discount) || 0;

    item.total = (qty * price) - (price >= 0 ? disc : -disc);
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `itm-${Date.now()}-${items.length + 1}`,
        description: "",
        qty: 1,
        price: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const handleAddDpItem = () => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    setItems([
      ...items,
      {
        id: `itm-${Date.now()}-${items.length + 1}`,
        description: `Pembayaran DP (Down Payment) pada ${today}`,
        qty: 1,
        price: -2000000,
        discount: 0,
        total: -2000000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subTotal = items.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const taxAmount = (subTotal * (taxRate || 0)) / 100;
  const grandTotal = subTotal + taxAmount - (overallDiscount || 0);
  const terbilangText = terbilang(grandTotal);

  // Save Company Inline
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName || !newCompAddress) return;

    const comp: Company = {
      id: `cmp-${Date.now()}`,
      name: newCompName,
      address: newCompAddress,
      phone: newCompPhone,
      email: newCompEmail,
      bank_name: newCompBankName,
      bank_account_no: newCompBankNo,
      bank_account_name: newCompBankOwner,
      created_at: new Date().toISOString(),
    };

    await saveCompany(comp);
    setSelectedCompanyId(comp.id);
    setShowCompanyModal(false);
    setNewCompName("");
    setNewCompAddress("");
    setNewCompPhone("");
    setNewCompEmail("");
    setNewCompBankName("");
    setNewCompBankNo("");
    setNewCompBankOwner("");
  };

  // Save Client Inline
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientAddress) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone,
      address: newClientAddress,
      created_at: new Date().toISOString(),
      sync_status: "PENDING",
    };

    await saveClient(newClient);
    setSelectedClientId(newClient.id);
    setShowClientModal(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientAddress("");
  };

  // Submit Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedInvoice: Invoice = {
      id,
      invoice_no: invoiceNo,
      created_by_user_id: existingInvoice?.created_by_user_id || "usr-admin-01",
      company_id: selectedCompanyId,
      client_id: selectedClientId,
      issue_date: issueDate,
      due_date: dueDate,
      status,
      sub_total: subTotal,
      tax_rate: taxRate,
      tax: taxAmount,
      discount: overallDiscount,
      grand_total: grandTotal,
      notes,
      created_at: existingInvoice?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: "PENDING",
    };

    const updatedItemsList: InvoiceItem[] = items.map((item) => ({
      id: item.id,
      invoice_id: id,
      description: item.description,
      qty: item.qty,
      price: item.price,
      discount: item.discount,
      total: item.total,
    }));

    await saveInvoice(updatedInvoice, updatedItemsList);

    setTimeout(() => {
      setSaving(false);
      router.push(`/invoices/${id}`);
    }, 500);
  };

  if (!existingInvoice) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data invoice...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Edit Invoice #{invoiceNo}
              <Edit className="w-4 h-4 text-blue-500" />
            </h1>
            <p className="text-xs text-muted-foreground">Ubah rincian invoice &amp; simpan langsung ke Dexie + MySQL</p>
          </div>
        </div>

        <Button
          type="submit"
          form="edit-invoice-form"
          variant="gradient"
          className="gap-2 font-bold shadow-lg"
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <form id="edit-invoice-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Company & Client Selector Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              Perusahaan Penerbit &amp; Klien
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Selector (DARI PERUSAHANA MANA) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-blue-400">Dari Perusahaan (Penerbit Invoice):</label>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(true)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  + Tambah Perusahaan
                </button>
              </div>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-blue-500/40 bg-background text-sm font-bold text-blue-600 dark:text-blue-400"
                required
              >
                {userCompanies.length === 0 ? (
                  <option value="">-- Belum ada profil perusahaan, silakan tambah di atas --</option>
                ) : (
                  userCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.address})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Client Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Ditujukan Kepada (Klien):</label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Klien Baru
                </button>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-ring"
                required
              >
                {userClients.length === 0 ? (
                  <option value="">-- Belum ada klien terdaftar, silakan tambah di atas --</option>
                ) : (
                  userClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.address})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Invoice No */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">No. Invoice</label>
              <Input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                required
                className="font-mono font-bold text-blue-600 dark:text-blue-400"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Status Pembayaran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium"
              >
                <option value="UNPAID">🔴 UNPAID (Belum Lunas)</option>
                <option value="PAID">🟢 PAID (Lunas)</option>
                <option value="DRAFT">⚪ DRAFT</option>
                <option value="CANCELLED">⚫ CANCELLED</option>
              </select>
            </div>

            {/* Issue Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Tanggal Terbit</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Jatuh Tempo</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Items Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle className="text-base">Daftar Barang / Jasa</CardTitle>
              <CardDescription>Edit rincian item, kuantitas, harga satuan, atau potongan DP (-)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAddDpItem}
                variant="outline"
                size="sm"
                className="gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                + Potongan DP (-)
              </Button>

              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris Item
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-500/5 rounded-xl border border-border"
              >
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">Deskripsi Item #{idx + 1}</label>
                  <Input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">Qty</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">
                    Harga Satuan (Rp) {item.price < 0 ? "(Potongan DP)" : ""}
                  </label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                    required
                    className={`text-xs font-mono ${item.price < 0 ? "text-rose-500 font-bold" : ""}`}
                  />
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1 text-right">
                  <label className="text-[10px] text-muted-foreground font-semibold">Total Item</label>
                  <p className="text-xs font-bold font-mono py-2">{formatRupiah(item.total)}</p>
                </div>

                <div className="col-span-1 text-right pt-4 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calculation Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Catatan &amp; Terbilang Indonesia
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">
                  Terbilang Otomatis:
                </span>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 italic">
                  &ldquo;{terbilangText}&rdquo;
                </p>
              </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold">Catatan / Rekening Bank</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-input bg-background text-xs"
                    placeholder="Masukkan instruksi pembayaran atau catatan invoice..."
                  />
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                Kalkulasi Total Tagihan
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Subtotal Item:</span>
                <span className="font-mono font-semibold">{formatRupiah(subTotal)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">PPN (%):</span>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 h-7 px-2 border rounded text-xs text-center font-mono"
                  />
                </div>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  + {formatRupiah(taxAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Potongan Diskon (Rp):</span>
                <input
                  type="number"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32 h-7 px-2 border rounded text-xs text-right font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 text-base font-extrabold border-t-2 border-border">
                <span>Total Tagihan Pelunasan:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-lg">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Company & Logo Modal */}
      <CompanyModal
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSelectCompany={(compId) => setSelectedCompanyId(compId)}
      />

      {/* New Client Modal */}
      {showClientModal && (
        <div
          onClick={() => setShowClientModal(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg">Tambah Klien Baru</h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Nama Perusahaan / Klien</label>
                <Input
                  type="text"
                  required
                  placeholder="Sinergy Ship Specialist"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Email Klien</label>
                <Input
                  type="email"
                  placeholder="sinergyshipspecialist@gmail.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">No. Telepon</label>
                <Input
                  type="text"
                  placeholder="08123456789"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Alamat klien..."
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowClientModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="gradient">
                  Simpan Klien
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
