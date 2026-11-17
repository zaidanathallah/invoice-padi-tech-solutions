import Dexie, { type EntityTable } from 'dexie';
import type { Client, Company, Invoice, InvoiceItem, User } from '@/types/database';

export interface CMSSettings {
  key: string;
  value: string;
}

class InvoicePWAStore extends Dexie {
  users!: EntityTable<User, 'id'>;
  companies!: EntityTable<Company, 'id'>;
  clients!: EntityTable<Client, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  invoiceItems!: EntityTable<InvoiceItem, 'id'>;
  cms_settings!: EntityTable<CMSSettings, 'key'>;

  constructor() {
    super('InvoicePWAStore');

    this.version(3).stores({
      users: 'id, email, role',
      companies: 'id, name, created_by_user_id',
      clients: 'id, name, sync_status, created_at, created_by_user_id',
      invoices: 'id, invoice_no, client_id, created_by_user_id, status, sync_status, created_at',
      invoiceItems: 'id, invoice_id',
      cms_settings: 'key',
    });
  }
}

export const db = new InvoicePWAStore();
