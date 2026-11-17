# 📄 Panduan Menjalankan Sistem Padi Invoice PWA

Panduan lengkap instalasi, konfigurasi, dan pengoperasian aplikasi **Padi Invoice Generator & SaaS Workspace (PWA)**.

---

## 📌 Daftar Isi
1. [Tentang Sistem](#-tentang-sistem)
2. [Spesifikasi Teknologi (Tech Stack)](#-spesifikasi-teknologi-tech-stack)
3. [Prasyarat Sistem (Prerequisites)](#-prasyarat-sistem-prerequisites)
4. [Langkah Instalasi & Setup](#-langkah-instalasi--setup)
   - [1. Buka Direktori Proyek](#1-buka-direktori-proyek)
   - [2. Instal Dependensi Package](#2-instal-dependensi-package)
   - [3. Setup Database MySQL](#3-setup-database-mysql)
   - [4. Konfigurasi Environment (.env.local)](#4-konfigurasi-environment-envlocal)
5. [Menjalankan Aplikasi](#-menjalankan-aplikasi)
   - [Mode Development (Pengembangan)](#a-mode-development-rekomendasi-saat-ngoding)
   - [Mode Production (Produksi)](#b-mode-production-performa-optimal--pwa-aktif)
6. [Daftar Akun Bawaan (Default Accounts)](#-daftar-akun-bawaan-default-accounts)
7. [Fitur Unggulan & Cara Pengujian](#-fitur-unggulan--cara-pengujian)
8. [Troubleshooting & Solusi Masalah Umum](#-troubleshooting--solusi-masalah-umum)

---

## 📖 Tentang Sistem
**Padi Invoice** adalah aplikasi web modern berbasis **Progressive Web App (PWA)** untuk pembuatan faktur/invoice instan dan manajemen keuangan bisnis. Aplikasi ini didesain dengan konsep **Offline-First**, di mana pengguna tetap dapat membuat, mengedit, dan mencetak invoice meskipun tanpa koneksi internet, serta otomatis tersinkronisasi ke server MySQL saat online kembali.

---

## 🛠 Spesifikasi Teknologi (Tech Stack)
- **Framework Utama**: Next.js 15 (App Router, Turbopack)
- **Bahasa**: TypeScript, React 19
- **Styling**: Tailwind CSS, Lucide Icons, Glassmorphism / Claymorphic UI
- **PWA & Service Worker**: Serwist (`@serwist/next`)
- **Penyimpanan Offline**: Dexie.js (IndexedDB Engine)
- **Database Server**: MySQL (menggunakan library `mysql2/promise`)
- **Otentikasi**: NextAuth.js (Google OAuth 2.0 & Email/Password Kredensial)
- **Keamanan Khusus**:
  - `detectincognitojs`: Deteksi dan pemblokiran otomatis mode Private / Incognito browsing.
  - `@fingerprintjs/fingerprintjs`: Fingerprinting hardware browser untuk membatasi pendaftaran (*1 Device = 1 Akun*).
  - DNS MX Resolution & Blacklist: Menolak penggunaan email sementara (*temp-mail/disposable mail*).

---

## 💻 Prasyarat Sistem (Prerequisites)
Sebelum menjalankan aplikasi, pastikan komputer/server Anda telah terpasang:
1. **Node.js**: Versi `18.18.0` ke atas atau versi `20.x` LTS (Rekomendasi).
2. **NPM**: Bawaan Node.js (versi 9.x atau 10.x).
3. **MySQL Server**: 
   - Dapat menggunakan **Laragon**, **XAMPP**, **MySQL Workbench**, atau Docker.
   - Port default: `3306`.
4. **Browser Modern**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari.

---

## 🚀 Langkah Instalasi & Setup

### 1. Buka Direktori Proyek
Buka terminal (PowerShell / Command Prompt / Git Bash), lalu arahkan ke folder proyek:
```bash
cd "d:\Applikasi Invoice"
```

### 2. Instal Dependensi Package
Jalankan perintah berikut untuk mengunduh seluruh package yang dibutuhkan:
```bash
npm install
```

### 3. Setup Database MySQL
1. Nyalakan layanan MySQL pada **Laragon** atau **XAMPP**.
2. Buka database management tool Anda (phpMyAdmin / HeidiSQL / DBeaver).
3. Buat database baru bernama `invoice_app` atau impor langsung file [`schema.sql`](file:///d:/Applikasi%20Invoice/schema.sql) yang telah disediakan di root proyek:
   ```sql
   -- Menggunakan terminal MySQL:
   mysql -u root -p < schema.sql
   ```
   *File `schema.sql` otomatis membuat tabel:*
   - `users`: Data pengguna (Admin & Member) beserta hash dan sidik jari perangkat.
   - `companies`: Profil perusahaan/toko penerbit invoice.
   - `clients`: Daftar klien/pelanggan.
   - `invoices`: Data faktur/invoice.
   - `invoice_items`: Rincian item barang/jasa dalam invoice.
   - `cms_settings`: Pengaturan dinamis teks & konten Landing Page.

### 4. Konfigurasi Environment (`.env.local`)
Pastikan file [`.env.local`](file:///d:/Applikasi%20Invoice/.env.local) di root proyek telah dikonfigurasi dengan benar:

```env
# Database Configuration (MySQL)
DATABASE_URL="mysql://root:@127.0.0.1:3306/invoice_app"
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="invoice_app"

# NextAuth & Google OAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-in-production"
GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

> **Catatan**: Jika MySQL Anda memiliki kata sandi (misal `root` / password `admin`), sesuaikan nilai `DB_PASSWORD` dan `DATABASE_URL` di atas.

---

## ⚡ Menjalankan Aplikasi

### A. Mode Development (Rekomendasi saat Ngoding)
Untuk menjalankan server pengembangan lokal dengan fitur Turbopack dan Hot-Reloading:
```bash
npm run dev
```
Setelah proses compiling selesai, buka browser Anda di:
👉 **[http://localhost:3000](http://localhost:3000)**

*Keterangan mode dev:*
- Menggunakan engine Next.js Turbopack untuk kompilasi super cepat.
- Pesan log `○ (serwist) Serwist is disabled.` adalah normal karena service worker sengaja dinonaktifkan di mode dev agar tidak mengganggu hot-module reload.

---

### B. Mode Production (Performa Optimal & PWA Aktif)
Untuk menguji performa penuh, Service Worker PWA, dan kemampuan install web app ke desktop/smartphone:
1. Lakukan build aplikasi:
   ```bash
   npm run build
   ```
2. Jalankan server produksi:
   ```bash
   npm run start
   ```
3. Akses di browser: **[http://localhost:3000](http://localhost:3000)**.
   - Anda akan melihat ikon **"Install App"** di bilah alamat browser untuk menginstal PWA ke komputer Anda.

---

## 👥 Daftar Akun Bawaan (Default Accounts)

Sistem sudah dilengkapi dengan 2 akun pengujian bawaan di database:

| Role | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@invoice.com` | `password123` | • Akses Dashboard Admin (`/admin`)<br>• Kelola CMS Landing Page (`/admin/cms`)<br>• Kelola Profil Perusahaan / Logo<br>• Kelola seluruh invoice sistem |
| **MEMBER / USER** | `kasir@invoice.com` | `password123` | • Akses Dashboard Member (`/user`)<br>• Buat invoice baru pribadi (`/invoices/new`)<br>• Manajemen daftar invoice & klien pribadi<br>• Export invoice ke PDF / Cetak |

---

## 🌟 Fitur Unggulan & Cara Pengujian

### 1. Kemampuan Offline-First PWA
1. Buka aplikasi di browser dan login.
2. Matikan koneksi internet Anda (bisa lewat setting WiFi atau via Chrome DevTools > Tab *Network* > pilih **Offline**).
3. Buat invoice baru di menu **"Buat Invoice Baru"**.
4. Data akan langsung tersimpan di **IndexedDB (Dexie.js)** dengan indikator status `"Pending Sync Offline"`.
5. Nyalakan kembali koneksi internet, sistem akan otomatis melakukan background sync ke database MySQL.

### 2. Proteksi Mode Incognito
- Jika Anda membuka `http://localhost:3000/login` melalui **Jendela Penyamaran (Incognito / Private Window)**, sistem otomatis mendeteksi status browser dan menampilkan layar penolakan:
  > *"Akses Ditolak: Mohon matikan mode Incognito / Private Browsing untuk mendaftar atau masuk ke Padi Invoice."*

### 3. Proteksi "1 Device = 1 Akun" & Anti Temp-Mail
- **Device Fingerprinting**: Saat mendaftar akun baru (baik tombol *Sign Up* maupun *Google Sign-In*), sistem membaca sidik jari hardware browser (`visitorId` via FingerprintJS). Perangkat yang sama tidak akan bisa mendaftarkan akun kedua.
- **Anti Temp-Mail**: Pendaftaran menggunakan domain email sementara (misal: `@aminating.com`, `@mailinator.com`, `@tempmail.com`) otomatis ditolak oleh validasi DNS MX Resolver di sisi server.

### 4. Manajemen CMS Landing Page (Admin)
1. Login menggunakan akun `admin@invoice.com`.
2. Buka menu **CMS** di navbar (atau akses `/admin/cms`).
3. Anda dapat mengedit teks Hero, Fitur, Testimoni, dan bagian **Tentang Kami**.
4. Klik **"Simpan Perubahan"**, dan konten Landing Page (`/`) akan langsung terupdate secara real-time.

---

## 🔧 Troubleshooting & Solusi Masalah Umum

### 1. Error `EADDRINUSE: address already in use :::3000`
- **Penyebab**: Port 3000 masih digunakan oleh proses Node.js sebelumnya.
- **Solusi**: Matikan proses di port 3000 via terminal PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```
  Lalu jalankan ulang `npm run dev`.

### 2. Error Database `ECONNREFUSED 127.0.0.1:3306`
- **Penyebab**: Layanan MySQL belum dinyalakan atau port salah.
- **Solusi**: Buka Laragon/XAMPP dan pastikan tombol **Start** pada MySQL sudah aktif dan berwarna hijau.

### 3. Error `Access denied for user 'root'@'localhost'`
- **Penyebab**: Password user MySQL tidak cocok dengan konfigurasi di `.env.local`.
- **Solusi**: Buka file `.env.local` dan sesuaikan nilai `DB_PASSWORD` dengan password database MySQL Anda.

### 4. Tombol Google Sign-In Gagal / Callback Error
- **Penyebab**: URL callback belum terdaftar di Google Cloud Console.
- **Solusi**: Pastikan di Google Console OAuth credentials Anda, **Authorized redirect URIs** telah mencantumkan:
  `http://localhost:3000/api/auth/callback/google`.

---

✨ **Padi Invoice Generator PWA siap digunakan dengan lancar!** Jika ada kendala, periksa tab Console (F12) pada browser dan log terminal Anda.
