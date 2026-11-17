"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  FileText,
  Search,
  PlusCircle,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ArrowRight,
  MoreVertical,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function AllInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("invoice_pwa_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch real live invoices from Dexie IndexedDB
  const invoicesList = useLiveQuery(() => db.invoices.toArray(), []);
  const clientsList = useLiveQuery(() => db.clients.toArray(), []);

  const getClientName = (clientId: string) => {
    const client = clientsList?.find((c) => c.id === clientId);
    return client ? client.name : "Klien Umum";
  };

  // Filter invoices strictly for SaaS multi-tenancy user isolation
  const userInvoices = (invoicesList || []).filter((inv) => {
    if (!currentUser) return true;
    return inv.created_by_user_id === currentUser.id;
  });

  const filteredInvoices = userInvoices.filter((inv) => {
    const clientName = getClientName(inv.client_id).toLowerCase();
    const matchSearch =
      inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    await updateInvoiceStatus(id, newStatus);
  };

  const handleDelete = async (id: string, invoiceNo: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Invoice ${invoiceNo}?`)) {
      await deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold">Semua Data Invoice</h1>
          <p className="text-xs text-muted-foreground">Kelola, ubah status lunas, dan hapus data invoice secara real-time</p>
        </div>

        <Link href="/invoices/new">
          <Button variant="gradient" className="gap-2 font-bold shadow-lg">
            <PlusCircle className="w-4 h-4" />
            Buat Invoice Baru
          </Button>
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Input
              type="text"
              placeholder="Cari no. invoice / nama klien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Lunas (UNPAID)</option>
              <option value="PAID">Lunas (PAID)</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-500/5 text-muted-foreground">
                  <th className="p-4 font-semibold">No. Invoice</th>
                  <th className="p-4 font-semibold">Nama Klien</th>
                  <th className="p-4 font-semibold">Tanggal Terbit</th>
                  <th className="p-4 font-semibold">Jatuh Tempo</th>
                  <th className="p-4 font-semibold">Total Tagihan</th>
                  <th className="p-4 font-semibold">Status Pembayaran</th>
                  <th className="p-4 font-semibold">Sync Status</th>
                  <th className="p-4 font-semibold text-right">Aksi CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Tidak ada invoice ditemukan. Silakan buat invoice baru!
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {inv.invoice_no}
                      </td>
                      <td className="p-4 font-semibold">{getClientName(inv.client_id)}</td>
                      <td className="p-4 text-muted-foreground">{inv.issue_date}</td>
                      <td className="p-4 text-muted-foreground">{inv.due_date}</td>
                      <td className="p-4 font-extrabold font-mono text-sm">
                        {formatRupiah(inv.grand_total)}
                      </td>

                      {/* Status Dropdown CRUD */}
                      <td className="p-4">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                          className="h-7 px-2 text-[11px] font-semibold rounded-md border border-input bg-background cursor-pointer"
                        >
                          <option value="UNPAID">🔴 UNPAID</option>
                          <option value="PAID">🟢 PAID</option>
                          <option value="DRAFT">⚪ DRAFT</option>
                          <option value="CANCELLED">⚫ CANCELLED</option>
                        </select>
                      </td>

                      {/* Sync Status Badge */}
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            inv.sync_status === "SYNCED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {inv.sync_status}
                        </span>
                      </td>

                      {/* Row Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/invoices/${inv.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-[11px] gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </Link>

                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-[11px] gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              Detail
                            </Button>
                          </Link>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(inv.id, inv.invoice_no)}
                            className="h-8 w-8 p-0"
                            title="Hapus Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
