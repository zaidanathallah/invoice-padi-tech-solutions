import { db } from './index';
import type { Client, Company, Invoice, InvoiceItem, InvoiceStatus } from '@/types/database';

// Initialize sample data in Dexie IndexedDB if empty
export async function seedInitialDexieData() {
  try {
    const companiesCount = await db.companies.count();
    if (companiesCount === 0) {
      await db.companies.bulkPut([
        {
          id: 'cmp-01',
          name: 'Padi Tech Solutions',
          address: 'Jl. Malioboro No. 88, Yogyakarta',
          phone: '0812-3456-7890',
          email: 'info@paditech.com',
          bank_name: 'Bank BSI (Bank Syariah Indonesia)',
          bank_account_no: '719974154652',
          bank_account_name: 'Moch. Zaidan Athallah',
          created_at: new Date().toISOString(),
          created_by_user_id: 'usr-admin-01',
        },
        {
          id: 'cmp-02',
          name: 'PT SINERGY SOLUSI INDONESIA',
          address: 'Jl. Jendral Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190',
          phone: '0812-3456-7890',
          email: 'info@sinergy.co.id',
          bank_name: 'Bank BCA',
          bank_account_no: '1234567890',
          bank_account_name: 'PT Sinergy Solusi Indonesia',
          created_at: new Date().toISOString(),
          created_by_user_id: 'usr-admin-01',
        },
      ]);
    }
    const clientsCount = await db.clients.count();
    if (clientsCount === 0) {
      await db.clients.bulkPut([
        {
          id: 'cli-01',
          name: 'PT Wijaya Karya',
          email: 'contact@wikaimp.com',
          phone: '021-5551234',
          address: 'Gedung WIKA Tower 2, Jl. DI Panjaitan Kav 9, Jakarta',
          created_at: new Date().toISOString(),
          sync_status: 'SYNCED',
          created_by_user_id: 'usr-admin-01',
        },
        {
          id: 'cli-02',
          name: 'CV Maju Bersama',
          email: 'admin@majubersama.co.id',
          phone: '081298765432',
          address: 'Jl. Pemuda No. 45, Surabaya',
          created_at: new Date().toISOString(),
          sync_status: 'SYNCED',
          created_by_user_id: 'usr-admin-01',
        },
        {
          id: 'cli-03',
          name: 'Budi Santoso (Freelance)',
          email: 'budi.santoso@gmail.com',
          phone: '085711223344',
          address: 'Jl. Melati No. 12, Bandung',
          created_at: new Date().toISOString(),
          sync_status: 'SYNCED',
          created_by_user_id: 'usr-admin-01',
        },
      ]);
    }

    const invoicesCount = await db.invoices.count();
    if (invoicesCount === 0) {
      const sampleInvoices: Invoice[] = [
        {
          id: 'inv-2026-001',
          invoice_no: 'INV-2026-001',
          created_by_user_id: 'usr-admin-01',
          client_id: 'cli-01',
          issue_date: '2026-07-22',
          due_date: '2026-08-05',
          status: 'PAID',
          sub_total: 13963964,
          tax_rate: 11,
          tax: 1536036,
          discount: 0,
          grand_total: 15500000,
          notes: 'Pembayaran via Transfer Bank BCA PT Sinergy Solusi Indonesia.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'SYNCED',
        },
        {
          id: 'inv-2026-002',
          invoice_no: 'INV-2026-002',
          created_by_user_id: 'usr-member-01',
          client_id: 'cli-02',
          issue_date: '2026-07-21',
          due_date: '2026-08-04',
          status: 'UNPAID',
          sub_total: 3783784,
          tax_rate: 11,
          tax: 416216,
          discount: 0,
          grand_total: 4200000,
          notes: 'Mohon lunasi sebelum jatuh tempo.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'PENDING',
        },
        {
          id: 'inv-2026-004',
          invoice_no: 'INV-2026-004',
          created_by_user_id: 'usr-member-01',
          client_id: 'cli-03',
          issue_date: '2026-07-19',
          due_date: '2026-08-02',
          status: 'DRAFT',
          sub_total: 1891892,
          tax_rate: 11,
          tax: 208108,
          discount: 0,
          grand_total: 2100000,
          notes: 'Draft penawaran jasa konsultasi.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'MODIFIED',
        },
      ];

      await db.invoices.bulkPut(sampleInvoices);

      await db.invoiceItems.bulkPut([
        {
          id: 'itm-01',
          invoice_id: 'inv-2026-001',
          description: 'Pengembangan Sistem Aplikasi Web PWA Invoice',
          qty: 1,
          price: 15500000,
          discount: 0,
          total: 15500000,
        },
        {
          id: 'itm-02',
          invoice_id: 'inv-2026-002',
          description: 'Jasa Maintenance Server & Domain Cloud 1 Tahun',
          qty: 1,
          price: 4200000,
          discount: 0,
          total: 4200000,
        },
        {
          id: 'itm-03',
          invoice_id: 'inv-2026-004',
          description: 'Konsultasi Arsitektur Database & Offline Sync',
          qty: 1,
          price: 2100000,
          discount: 0,
          total: 2100000,
        },
      ]);
    }
  } catch (err) {
    console.error('Dexie seeding error:', err);
  }
}

// Create Invoice in Dexie IndexedDB & Sync to MySQL API
export async function saveInvoice(invoiceData: Invoice, items: InvoiceItem[]) {
  // 1. Save locally to IndexedDB
  await db.invoices.put({
    ...invoiceData,
    sync_status: typeof window !== 'undefined' && navigator.onLine ? 'SYNCED' : 'PENDING',
  });

  // Clear & save items
  await db.invoiceItems.where('invoice_id').equals(invoiceData.id).delete();
  await db.invoiceItems.bulkPut(items);

  // 2. Try to sync to MySQL API if Online
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceData,
          items,
        }),
      });
    } catch (error) {
      console.warn('Network sync failed, invoice stored offline in Dexie:', error);
    }
  }
}

// Update Invoice Status (e.g. PAID / UNPAID / CANCELLED)
export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const isOnline = typeof window !== 'undefined' && navigator.onLine;

  await db.invoices.update(id, {
    status,
    sync_status: isOnline ? 'SYNCED' : 'MODIFIED',
    updated_at: new Date().toISOString(),
  });

  if (isOnline) {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn('Status update API call failed:', err);
    }
  }
}

// Delete Invoice from Dexie IndexedDB & MySQL
export async function deleteInvoice(id: string) {
  await db.invoices.delete(id);
  await db.invoiceItems.where('invoice_id').equals(id).delete();

  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Delete API call failed:', err);
    }
  }
}

// Create New Client
export async function saveClient(client: Client) {
  const isOnline = typeof window !== 'undefined' && navigator.onLine;

  let clientWithUser = { ...client };
  if (!clientWithUser.created_by_user_id && typeof window !== 'undefined') {
    const saved = localStorage.getItem("invoice_pwa_session");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.id) clientWithUser.created_by_user_id = user.id;
      } catch (e) {}
    }
  }

  await db.clients.put({
    ...clientWithUser,
    sync_status: isOnline ? 'SYNCED' : 'PENDING',
  });

  if (isOnline) {
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientWithUser),
      });
    } catch (err) {
      console.warn('Save client API call failed:', err);
    }
  }
}

// Create or Update Company (Offline IndexedDB + MySQL Sync)
export async function saveCompany(company: Company) {
  const isOnline = typeof window !== 'undefined' && navigator.onLine;

  let companyWithUser = { ...company };
  if (!companyWithUser.created_by_user_id && typeof window !== 'undefined') {
    const saved = localStorage.getItem("invoice_pwa_session");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.id) companyWithUser.created_by_user_id = user.id;
      } catch (e) {}
    }
  }

  await db.companies.put(companyWithUser);

  if (isOnline) {
    try {
      await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyWithUser),
      });
    } catch (err) {
      console.warn('Save company API call failed:', err);
    }
  }
}

// Delete Company from Dexie IndexedDB & MySQL
export async function deleteCompany(id: string) {
  await db.companies.delete(id);

  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      await fetch(`/api/companies?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Delete company API call failed:', err);
    }
  }
}

