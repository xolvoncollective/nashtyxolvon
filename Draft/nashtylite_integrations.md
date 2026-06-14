# Nashtylite System Architecture & Integrations

## Gambaran Umum (Overview)
Nashtylite adalah sistem kasir (Point of Sale), manajemen dapur (Kitchen Display System), dan Backoffice yang saling terintegrasi melalui REST API dengan *backend* berbasis Node.js/Express dan database SQLite.

Sistem ini didesain agar setiap modul independen secara antarmuka, namun berbagi satu sumber data (database) yang sama. Perubahan pada satu fitur seringkali berdampak pada modul lainnya.

---

## Modul Utama dan Tanggung Jawab

### 1. Point of Sale (POS)
- **Fungsi Utama**: Antarmuka untuk kasir/pelayan. Membuat pesanan, mengelola keranjang (cart), memproses pembayaran, dan melihat riwayat transaksi aktif.
- **Integrasi**: 
  - Mengirim data ke `POST /api/orders`.
  - Mengambil daftar produk dari `GET /api/menu/products`.
- **Dampak Perubahan**: Jika struktur data keranjang, perhitungan pajak, atau status pesanan (`order_status`) diubah di backend, UI POS harus disesuaikan untuk dapat menampilkan atau memproses data tersebut.

### 2. Kitchen Display System (KDS)
- **Fungsi Utama**: Antarmuka layar dapur. Menerima pesanan baru secara *real-time* atau *polling* dan memperbarui status hidangan.
- **Integrasi**:
  - Mengambil antrean pesanan dari `GET /api/orders/kitchen/queue` atau `GET /api/orders` (difilter berdasarkan `kitchen_status`).
  - Mengubah status pesanan via `PATCH /api/orders/:id/status` (contoh: dari `pending` ke `ready`).
- **Dampak Perubahan**: Jika ada penambahan tipe pesanan (misal: "Pre-order"), KDS harus disesuaikan agar tipe pesanan tersebut tampil/tidak tampil di layar dapur. Perubahan skema `kitchen_status` di database akan merusak KDS jika frontend tidak di-update.

### 3. Backoffice
- **Fungsi Utama**: Antarmuka manajerial. Mengelola Master Data (Produk, Kategori, Diskon), memantau *Shift*, Omzet harian, dan melakukan *Refund*.
- **Integrasi**:
  - Semua endpoint CRUD untuk menu dan laporan.
  - Refund memanggil backend untuk mengurangi omzet shift.
- **Dampak Perubahan**: Perubahan pada *Role/Permission* atau struktur *Shift* (seperti ID Shift) akan langsung berdampak pada pelaporan di Backoffice.

---

## Alur Integrasi (Critical Flows) - Playwright E2E Basis

### A. Alur Pesanan (Order Flow)
Alur ini divalidasi oleh Playwright test (`tests/e2e/pos-kds-flow.spec.ts`).
1. **POS**: Menambahkan produk ke keranjang -> klik Bayar -> Pilih Uang Pas -> Konfirmasi.
2. **Backend**: 
   - Melakukan *Server-Side Price Validation* (menghitung ulang harga, Tax 10%, Service Charge 5%).
   - Melakukan *Stock Checking* (menolak pesanan jika stok item yang di-*track* tidak mencukupi).
   - Menyimpan ke tabel `orders` dan `order_items` dengan `order_status = confirmed` dan `kitchen_status = pending`.
3. **KDS**: 
   - Memuat antrean pesanan. Pesanan baru muncul.
   - Koki menekan tombol selesai, memanggil `PATCH /api/orders/:id/status` dengan `kitchen_status = ready`.
4. **Backend**: Meng-update `kitchen_status = ready` dan `completed_at`.

### B. Alur Pengembalian Dana (Refund Flow)
1. **Backoffice**: Kasir/Manajer membatalkan pesanan.
2. **Backend**:
   - Status pesanan menjadi `cancelled`.
   - Mengurangi *Omzet* (turnover) pada *Shift* yang aktif.
3. **POS/KDS**: Pesanan tersebut harus menghilang dari layar aktif KDS atau ditandai sebagai 'Batal'.

### C. Alur Keamanan dan Autentikasi
1. **Login**: Endpoint `/api/auth/login` memiliki *Rate Limiting* (blokir IP jika gagal berulang kali).
2. **Local Dev Bypass**: Di environment `localhost`, sistem menggunakan script `shared/auth.js` untuk menyuntikkan *demo credentials* secara otomatis (memotong proses login via launcher).

---

## Aturan Penting bagi AI (Dependency Rules)

Jika saya (Pengguna) meminta AI untuk mengubah suatu fitur, AI HARUS memperhatikan rantai efek berikut:

1. **Mengubah Harga/Pajak/Diskon**: Jangan hanya mengubah *frontend* POS. Wajib memperbarui logika *Server-Side Price Recalculation* di backend (`backend/src/routes/orders.ts`).
2. **Menambah/Mengubah Status (Order/Kitchen)**: Pastikan query di KDS (`kitchen/queue`) dan POS (Order History) diperbarui untuk mengakomodasi status baru.
3. **Mengubah Struktur Produk (Modifier/Varian)**: Pastikan struktur JSON payload di `POST /api/orders` dan UI komponen keranjang POS serta KDS dapat me-render modifier baru tersebut.
4. **Integrasi Playwright**: Jika alur UI (seperti tombol 'Uang Pas' atau 'Bayar') diubah, pastikan memperbarui ID atau *Locator* pada `tests/e2e/pos-kds-flow.spec.ts`.
