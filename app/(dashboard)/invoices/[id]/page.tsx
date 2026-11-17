"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  Clock,
  Trash2,
  Building,
  FileText,
  DollarSign,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/db/crud";
import { terbilang, formatRupiah } from "@/lib/terbilang";
import {
  downloadInvoicePng,
  downloadInvoiceJpg,
  downloadInvoiceWord,
} from "@/lib/export-invoice";
import type { Client, Company, Invoice, InvoiceItem, InvoiceStatus } from "@/types/database";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch invoice from Dexie
  const invoice = useLiveQuery(() => db.invoices.get(id), [id]);

  // Fetch client from Dexie
  const client = useLiveQuery(
    () => (invoice ? db.clients.get(invoice.client_id) : undefined),
    [invoice]
  );

  // Fetch company from Dexie
  const company = useLiveQuery(
    () => (invoice?.company_id ? db.companies.get(invoice.company_id) : db.companies.get("cmp-01")),
    [invoice]
  );

  // Fetch items from Dexie
  const items = useLiveQuery(
    () => db.invoiceItems.where("invoice_id").equals(id).toArray(),
    [id]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    await updateInvoiceStatus(id, newStatus);
  };

  const handleDelete = async () => {
    if (invoice && confirm(`Yakin ingin menghapus invoice ${invoice.invoice_no}?`)) {
      await deleteInvoice(id);
      router.push("/invoices");
    }
  };

  if (!invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">Memuat data invoice...</p>
        <Link href="/invoices">
          <Button variant="outline">Kembali ke Daftar Invoice</Button>
        </Link>
      </div>
    );
  }

  const terbilangText = terbilang(invoice.grand_total);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Action Navigation Bar (Hidden during Print/Export) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border no-print print-hidden print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/invoices")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Invoice #{invoice.invoice_no}
              <Badge
                variant={
                  invoice.status === "PAID"
                    ? "success"
                    : invoice.status === "UNPAID"
                    ? "warning"
                    : "secondary"
                }
              >
                {invoice.status}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Diterbitkan: {invoice.issue_date} &bull; Sync: {invoice.sync_status}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Status Toggle */}
          <select
            value={invoice.status}
            onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-semibold"
          >
            <option value="UNPAID">🔴 Set UNPAID</option>
            <option value="PAID">🟢 Set PAID (Lunas)</option>
            <option value="DRAFT">⚪ Set DRAFT</option>
            <option value="CANCELLED">⚫ Set CANCELLED</option>
          </select>

          {/* Download PNG Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInvoicePng("printable-invoice-card", invoice.invoice_no)}
            className="gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            title="Download Invoice sebagai Gambar PNG"
          >
            <Download className="w-3.5 h-3.5" />
            PNG
          </Button>

          {/* Download JPG Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInvoiceJpg("printable-invoice-card", invoice.invoice_no)}
            className="gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/10"
            title="Download Invoice sebagai Gambar JPG"
          >
            <Download className="w-3.5 h-3.5" />
            JPG
          </Button>

          {/* Download Word Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInvoiceWord(invoice, client, company, items || [])}
            className="gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            title="Download Invoice sebagai Dokumen Word (.doc)"
          >
            <Download className="w-3.5 h-3.5" />
            Word (.doc)
          </Button>

          {/* Print / PDF Button */}
          <Button variant="gradient" size="sm" onClick={handlePrint} className="gap-1.5 font-bold shadow-md">
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </Button>

          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleDelete} title="Hapus Invoice">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Printable A4 Template Card */}
      <Card
        id="printable-invoice-card"
        className="printable-card p-8 sm:p-12 pb-12 sm:pb-16 bg-white text-slate-900 shadow-xl border-slate-200 print:shadow-none print:border-none print:p-0"
      >
        <CardContent className="p-0 space-y-8">
          {/* Invoice Header / Company Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {company?.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-12 w-auto max-w-[180px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {company ? company.name : "Padi Tech Solutions"}
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                {company?.address || "Jl. Malioboro No. 88, Yogyakarta"}
                <br />
                {company?.email && `Email: ${company.email}`} {company?.phone && `• Telp: ${company.phone}`}
              </p>
            </div>

            <div className="text-right sm:text-right space-y-1 w-full sm:w-auto">
              <h3 className="text-2xl font-extrabold text-blue-600 tracking-wider">INVOICE</h3>
              <p className="text-sm font-bold font-mono text-slate-700">{invoice.invoice_no}</p>
              <div className="text-xs text-slate-500 pt-1">
                <p>Tanggal: <span className="font-semibold text-slate-800">{invoice.issue_date}</span></p>
                <p>Jatuh Tempo: <span className="font-semibold text-slate-800">{invoice.due_date}</span></p>
              </div>
            </div>
          </div>

          {/* Client Bill To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                TAGIHAN KEPADA (BILL TO):
              </span>
              <h4 className="font-bold text-base text-slate-900">{client ? client.name : "Klien"}</h4>
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                {client?.address || "-"}
              </p>
              {client?.email && <p className="text-xs text-slate-500 mt-1">Email: {client.email}</p>}
              {client?.phone && <p className="text-xs text-slate-500">Telp: {client.phone}</p>}
            </div>

            <div className="flex flex-col justify-between text-right">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  STATUS PEMBAYARAN:
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    invoice.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {invoice.status === "PAID" ? "LUNAS (PAID)" : "BELUM LUNAS (UNPAID)"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="w-full overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 bg-slate-100">
                  <th className="p-3 font-bold">NO</th>
                  <th className="p-3 font-bold">DESKRIPSI BARANG / JASA</th>
                  <th className="p-3 font-bold text-center">QTY</th>
                  <th className="p-3 font-bold text-right">HARGA SATUAN</th>
                  <th className="p-3 font-bold text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={item.id} className={item.price < 0 ? "bg-rose-50/50" : ""}>
                      <td className="p-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="p-3 font-medium">
                        {item.description}
                        {item.price < 0 && (
                          <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">
                            Potongan DP
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{item.qty}</td>
                      <td className={`p-3 text-right font-mono ${item.price < 0 ? "text-rose-600 font-bold" : ""}`}>
                        {formatRupiah(item.price)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${item.total < 0 ? "text-rose-600 font-bold" : ""}`}>
                        {formatRupiah(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      Tidak ada detail item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculation Footer & Terbilang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* Terbilang & Bank Details */}
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  TERBILANG:
                </span>
                <p className="text-xs font-bold text-blue-900 italic">
                  &ldquo;{terbilangText}&rdquo;
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Catatan / Rekening Bank:</p>
                <p className="whitespace-pre-line leading-relaxed">{invoice.notes || "-"}</p>
              </div>
            </div>

            {/* Subtotal, PPN, Grand Total */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Subtotal Item:</span>
                <span className="font-mono font-semibold">{formatRupiah(invoice.sub_total)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">PPN {invoice.tax_rate}%:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    + {formatRupiah(invoice.tax)}
                  </span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Potongan Diskon Tambahan:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    - {formatRupiah(invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 text-base font-extrabold border-t-2 border-slate-900">
                <span>Total Tagihan Pelunasan:</span>
                <span className="text-blue-600 font-mono text-lg">{formatRupiah(invoice.grand_total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
