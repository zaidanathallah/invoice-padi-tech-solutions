import { toPng, toJpeg } from 'html-to-image';
import type { Invoice, Client, Company, InvoiceItem } from '@/types/database';
import { formatRupiah, terbilang } from '@/lib/terbilang';

// Export as PNG
export async function downloadInvoicePng(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      fontEmbedCSS: '', // Fix SecurityError: Cannot access rules on cross-origin stylesheets
      cacheBust: false,
      style: {
        overflow: 'hidden',
        maxHeight: 'none',
      },
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export PNG:', err);
    alert('Gagal mengunduh gambar PNG.');
  }
}

// Export as JPG
export async function downloadInvoiceJpg(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      fontEmbedCSS: '', // Fix SecurityError: Cannot access rules on cross-origin stylesheets
      cacheBust: false,
      style: {
        overflow: 'hidden',
        maxHeight: 'none',
      },
    });
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export JPG:', err);
    alert('Gagal mengunduh gambar JPG.');
  }
}

// Export as Microsoft Word Document (.doc)
export function downloadInvoiceWord(
  invoice: Invoice,
  client?: Client,
  company?: Company,
  items: InvoiceItem[] = []
) {
  const compName = company?.name || 'Padi Tech Solutions';
  const compAddress = company?.address || 'Jl. Malioboro No. 88, Yogyakarta';
  const compContact = `${company?.email ? `Email: ${company.email}` : ''} ${company?.phone ? `• Telp: ${company.phone}` : ''}`;
  const clientName = client?.name || 'Klien';
  const clientAddress = client?.address || '-';
  const clientContact = `${client?.email ? `Email: ${client.email}` : ''} ${client?.phone ? `• Telp: ${client.phone}` : ''}`;

  const logoHtml = company?.logo
    ? `<img src="${company.logo}" style="height: 50px; max-width: 180px; vertical-align: middle; margin-bottom: 8px;" /><br>`
    : '';

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${item.price < 0 ? 'background-color: #fff1f2;' : ''}">
        <td style="padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; ${item.price < 0 ? 'color: #e11d48; font-weight: bold;' : ''}">
          ${item.description} ${item.price < 0 ? '<span style="font-size: 8pt; background: #ffe4e6; color: #be123c; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Potongan DP</span>' : ''}
        </td>
        <td style="padding: 10px; text-align: center; font-weight: bold;">${item.qty}</td>
        <td style="padding: 10px; text-align: right; ${item.price < 0 ? 'color: #e11d48; font-weight: bold;' : ''}">${formatRupiah(item.price)}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; ${item.total < 0 ? 'color: #e11d48;' : ''}">${formatRupiah(item.total)}</td>
      </tr>`
    )
    .join('');

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Invoice #${invoice.invoice_no}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; color: #1e293b; line-height: 1.5; padding: 20px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
        .company-name { font-size: 18pt; font-weight: bold; color: #1e293b; }
        .invoice-title { font-size: 22pt; font-weight: bold; color: #2563eb; text-align: right; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f1f5f9; padding: 10px; font-weight: bold; border-bottom: 2px solid #cbd5e1; text-align: left; }
        .terbilang { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; font-style: italic; color: #1e40af; margin-top: 15px; }
        .total-box { font-size: 14pt; font-weight: bold; text-align: right; margin-top: 20px; color: #2563eb; }
      </style>
    </head>
    <body>
      <table style="width: 100%;">
        <tr>
          <td>
            ${logoHtml}
            <div class="company-name">${compName}</div>
            <div style="font-size: 10pt; color: #64748b;">${compAddress}<br>${compContact}</div>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <div class="invoice-title">INVOICE</div>
            <div style="font-weight: bold; font-size: 12pt;">${invoice.invoice_no}</div>
            <div style="font-size: 10pt; color: #64748b;">Tanggal: ${invoice.issue_date}<br>Jatuh Tempo: ${invoice.due_date}</div>
          </td>
        </tr>
      </table>

      <div class="box">
        <strong style="color: #64748b; font-size: 9pt; text-transform: uppercase;">TAGIHAN KEPADA (BILL TO):</strong>
        <div style="font-size: 13pt; font-weight: bold; margin-top: 4px;">${clientName}</div>
        <div style="font-size: 10pt; color: #475569;">${clientAddress}</div>
        <div style="font-size: 10pt; color: #475569;">${clientContact}</div>
        <div style="margin-top: 8px;"><strong>Status:</strong> ${invoice.status}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">NO</th>
            <th style="width: 48%;">DESKRIPSI BARANG / JASA</th>
            <th style="width: 10%; text-align: center;">QTY</th>
            <th style="width: 17%; text-align: right;">HARGA SATUAN</th>
            <th style="width: 17%; text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="terbilang">
        <strong>TERBILANG:</strong> "${terbilang(invoice.grand_total)}"
      </div>

      <div class="total-box">
        Total Tagihan Pelunasan: ${formatRupiah(invoice.grand_total)}
      </div>

      ${invoice.notes ? `<div style="margin-top: 30px; font-size: 10pt; color: #64748b;"><strong>Instruksi Pembayaran:</strong><br>${invoice.notes}</div>` : ''}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordContent], {
    type: 'application/msword;charset=utf-8',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice-${invoice.invoice_no}.doc`;
  link.click();
}
