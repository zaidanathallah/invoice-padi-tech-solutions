# System Planning Document - PWA Invoice Generator

## 1. Software Requirements Specification (SRS)
**a. Validasi Data:**
- **Form:** Qty, Price harus angka valid > 0. Validasi dilakukan di sisi client (Zod/React Hook Form) sebelum masuk ke database lokal.
- **Status Sinkronisasi:** Setiap row data di lokal harus punya field `sync_status` (`PENDING`, `SYNCED`, `MODIFIED`).

**b. Behavior Sistem:**
- **Service Worker & PWA:** Saat user menekan "Download PWA", Service Worker akan me-cache semua aset statis (HTML, JS, CSS, Font) agar aplikasi bisa dibuka offline.
- **Offline CRUD:** Ketika offline, data di-insert/update ke dalam IndexedDB di browser.
- **Background Sync:** Begitu mendeteksi event `online`, aplikasi akan memicu fungsi `syncDataToMySQL` untuk memindahkan data berstatus `PENDING/MODIFIED` dari IndexedDB ke MySQL melalui Next.js API.
- **Role Behavior:** Admin dapat melihat semua invoice, sedangkan User hanya dapat melihat/mengedit invoice yang ia buat.

**c. Aturan Aplikasi:**
- Security: Penggunaan HTTPS wajib (via Cloudflare) agar Service Worker PWA bisa berjalan.

---

## 2. System Design Document (SDD)
**a. Arsitektur (PWA + Serverless API):**
- **Client Tier:** Next.js 16 (React), Tailwind, Shadcn UI. Menggunakan IndexedDB untuk manajemen data lokal offline.
- **CDN & Security Tier:** Cloudflare (DNS, SSL, WAF) -> Vercel (Edge/Serverless Hosting untuk frontend dan API).
- **Data Tier:** MySQL Hosted di idwebhost. Next.js API di Vercel menggunakan ORM (Prisma / Drizzle) untuk koneksi ke MySQL idwebhost.

**b. Struktur Database (Logical Model):**
Sama untuk IndexedDB (Lokal) maupun MySQL (Remote):
- **`users`**: `id`, `name`, `role` (ADMIN/USER), `email`, `password_hash`.
- **`companies`**: `id`, `name`, `address`, `bank_details`.
- **`clients`**: `id`, `name`, `address`.
- **`invoices`**: `id` (UUID agar aman saat offline), `invoice_no`, `created_by_user_id`, `client_id`, `issue_date`, `due_date`, `status`, `sub_total`, `tax`, `grand_total`, `sync_status`.
- **`invoice_items`**: `id`, `invoice_id`, `desc`, `qty`, `price`, `discount`.

**c. API Endpoints (Next.js Route Handlers):**
- `POST /api/sync/push` - Menerima data offline (IndexedDB) untuk disimpan ke MySQL.
- `GET /api/sync/pull` - Mengambil data terbaru dari MySQL ke IndexedDB saat aplikasi online.
- `POST /api/auth/login` - Autentikasi user (JWT via HTTP-only cookies).

**d. Struktur Backend:**
Serverless architecture menggunakan Next.js App Router (`/app/api/...`). Koneksi database MySQL dari Vercel ke idwebhost harus dipastikan idwebhost mengizinkan Remote MySQL connection dari IP Vercel.

---

## 3. UI/UX Flow
1. **Login Page:** Modern form, ada banner fitur aplikasi.
2. **Dashboard PWA:** 
   - Notifikasi/Tombol floating "Install App/Download PWA" (bisa dihilangkan jika sudah terinstal).
   - Sidebar navigasi (responsif menjadi hamburger menu di mobile).
   - Status koneksi (Indikator Hijau 'Online', Merah 'Offline').
3. **Role Dashboard:**
   - *Admin:* Grafik Revenue, list pengguna, pengaturan PPN dan Bank perusahaan.
   - *User:* List invoice pribadi, tombol "New Invoice".
4. **Form Create Invoice:** Desain satu halaman (Single Page) modern dengan tabel dinamis untuk input item, auto-calculate footer.
5. **Preview & PDF:** Menampilkan template A4 Invoice. Tombol cetak memanggil fungsi konversi DOM to PDF statis (misal `html2pdf.js` atau React-PDF).

---

## 4. Task Breakdown (Fase Pengerjaan Step-by-Step)
**Fase 1: Setup Lingkungan Next.js 16 (Turbopack)**
- `npx create-next-app@latest --turbo` (mengaktifkan Turbopack).
- Setup Tailwind CSS & Shadcn UI.
- Konfigurasi Cloudflare DNS menunjuk ke Vercel.

**Fase 2: Layouting & UI Dasboard (Mobile-First)**
- Membuat layout Admin Dashboard dan User Dashboard.
- Membuat komponen Form Invoice (Zod + React Hook Form).
- Implementasi Dark/Light mode toggle.

**Fase 3: Offline Storage & PWA Setup**
- Integrasi library PWA (misal `next-pwa` atau `serwist`).
- Menambahkan Web App Manifest & ikon untuk tombol "Download PWA".
- Integrasi `Dexie.js` untuk membuat sistem CRUD lokal (IndexedDB) bagi Clients, Invoices, dan Items.

**Fase 4: Core Logic & PDF Generation**
- Logic perhitungan harga, diskon, PPN, dan Terbilang.
- Implementasi HTML-to-PDF generation (client-side render) agar berfungsi offline.

**Fase 5: Backend API & Database Remote**
- Setup database MySQL di idwebhost, buka akses Remote SQL.
- Setup Prisma / Drizzle ORM di Next.js API.
- Pembuatan endpoint login, push-sync, dan pull-sync.

**Fase 6: Fitur Sinkronisasi & Testing**
- Membuat custom hook `useSync` yang mendeteksi status internet `window.navigator.onLine`.
- Menjalankan sinkronisasi otomatis dari `Dexie.js` ke Next.js API saat online.
- Testing fungsionalitas CRUD secara offline dan memastikannya masuk ke cloud setelah online.
