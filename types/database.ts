export type SyncStatus = 'PENDING' | 'SYNCED' | 'MODIFIED';
export type UserRole = 'ADMIN' | 'USER';
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PAID' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash?: string;
  created_at?: string;
  profile_image?: string; // Base64 profile image
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  logo?: string;
  created_at?: string;
  created_by_user_id?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  created_at: string;
  sync_status: SyncStatus;
  created_by_user_id?: string;
}

export interface Invoice {
  id: string; // UUID for offline creation safety
  invoice_no: string;
  created_by_user_id: string;
  company_id?: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  sub_total: number;
  tax: number;
  tax_rate: number; // e.g. 11%
  discount: number;
  grand_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
}
