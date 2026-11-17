# Product Requirements Document (PRD) - Web-Based PWA Invoice Generator

## 1. Project Goal
**Pertanyaan:** Apa yang sebenarnya ingin dibangun?
**Jawab:** Membuat aplikasi Invoice Generator berbasis Web Progressive Web App (PWA) untuk UMKM/Freelancer yang modern, profesional, dan interaktif. Aplikasi ini memudahkan pembuatan faktur, pelacakan status pembayaran, dan mendukung fungsionalitas **Full Offline (CRUD)** dengan kemampuan sinkronisasi data ke cloud.

## 2. Target User
**Pertanyaan:** Siapa yang akan menggunakan product ini?
**Jawab:** Pemilik Usaha (Owner/Admin), Kasir, Freelancer, dan Supervisor/Admin Keuangan (User/Staff).

## 3. Problem Statement
**Pertanyaan:** Masalah apa yang diselesaikan?
**Jawab:** 
- Kesulitan membuat invoice saat tidak ada koneksi internet (karena web biasa tidak bisa offline).
- Format invoice yang tidak konsisten dan rawan salah hitung manual (PPN, diskon).
- Kesulitan membedakan akses antara Owner (Admin) yang bisa melihat seluruh laporan, dan Kasir (User) yang hanya mengelola transaksi harian.
- Membutuhkan sistem cloud yang aman, namun tetap sangat ringan dan cepat diakses melalui semua perangkat (HP, Tablet, PC).

## 4. Main Features
**Pertanyaan:** Fitur apa yang wajib ada?
**Jawab:**
- **PWA & Offline Mode (CRUD):** Tombol "Download PWA" agar web bisa diinstal layaknya aplikasi native. Mendukung operasi Create, Read, Update, Delete secara offline.
- **Role-Based Dashboards:** 
  - *Admin Dashboard:* Laporan penjualan menyeluruh, manajemen user/staf, dan pengaturan perusahaan.
  - *User Dashboard:* Ringkasan tagihan harian, pembuatan invoice, dan riwayat transaksi.
- **Invoice & Calculation Engine:** Kalkulasi otomatis Qty x Price, Diskon, PPN 11%, dan Total Akhir.
- **Auto "Amount in Words":** Konversi otomatis total tagihan menjadi teks Terbilang bahasa Indonesia.
- **PDF Export & Share:** Render template invoice ke PDF (persis seperti referensi gambar) dan bagikan via WhatsApp/Email.
- **Dark/Light Mode & Responsiveness:** Desain profesional, *Mobile-First*, dan responsif sempurna di mode PC/Tablet.

## 5. User Flow
**Pertanyaan:** Bagaimana user memakai product ini?
**Jawab:**
1. User membuka link aplikasi melalui browser -> Klik tombol "Download PWA / Install App".
2. Login berdasarkan Role (Admin atau User).
3. Masuk ke Dashboard (Admin/User).
4. Navigasi ke "Buat Invoice Baru" (Bisa dilakukan dalam keadaan internet mati/offline).
5. Isi data Klien, masukkan Item Barang, dan sistem otomatis melakukan kalkulasi harga + Terbilang.
6. Preview Invoice -> Simpan (tersimpan di lokal jika offline, atau langsung sinkronisasi jika online).
7. Export PDF -> Bagikan dokumen.
8. (Jika sedang offline) Saat perangkat kembali terhubung ke internet, sistem melakukan background sync secara otomatis ke server.

## 6. Design & Tech Req
**Pertanyaan:** Apa saja requirement technical yang dibutuhkan?
**Jawab:**
- **Frontend & Framework:** Next.js 16 dengan Turbopack untuk performa ekstra cepat, React (App Router).
- **Styling:** Tailwind CSS + Shadcn UI (*No AI Slop*, desain bersih, modern, profesional).
- **PWA & Offline Storage:** `next-pwa` (atau custom Service Workers) dan `IndexedDB` (misal via `Dexie.js` atau `localForage`) untuk menyimpan database di browser klien.
- **Backend/API:** Next.js API Routes / Server Actions.
- **Database Utama (Cloud):** MySQL yang di-deploy di idwebhost.
- **Deployment & Security:** Deploy frontend di **Vercel**. Keamanan domain dan proteksi DDoS/Proxy diatur menggunakan **Cloudflare**.

## 7. Success Criteria
**Pertanyaan:** Bare minimum apa yang wajib diselesaikan?
**Jawab:**
- Aplikasi bisa diinstal sebagai PWA dan beroperasi penuh (CRUD Invoice) meski koneksi internet diputus.
- Sinkronisasi data lokal (IndexedDB) ke server MySQL (idwebhost) berhasil tanpa duplikasi data.
- UI/UX modern, tidak kaku, *mobile-first*, dan mendukung Dark/Light mode di setiap komponen.
- Kalkulasi akurat, serta export PDF memiliki layout yang identik dengan referensi desain.
