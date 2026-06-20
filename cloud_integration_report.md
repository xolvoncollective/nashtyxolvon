# Laporan Integrasi Cloud NASHTY OS v2.0 (Tahap Akhir)

## Status Keseluruhan: ⚠️ Perlu Tindakan Manual pada Database / Kode

Semua sistem (POS, KDS, CRM, COST, BACKOFFICE) **secara infrastruktur telah terhubung ke cloud** (`nashtyxolvon2.pages.dev` → `Railway API`). Autentikasi lintas aplikasi via `postMessage` berjalan dengan baik, dan semua endpoint API memberikan respons 200/201. 

**Namun, ada satu masalah kritikal pada integrasi data database (Supabase) yang mencegah data muncul di aplikasi:**

### 🔍 Temuan Bug Kritikal pada Database

1. **Gagal Fetch / Simpan Data (UUID Mismatch):**
   Backend API saat ini melakukan _hardcode_ `tenantId: 'demo-tenant'` pada token JWT (`src/routes/main-auth.ts`). 
   Supabase menggunakan tipe kolom `UUID` untuk `tenant_id`. Nilai `'demo-tenant'` bukanlah UUID yang valid. Akibatnya, saat API menjalankan query (misalnya `GET /api/categories`), query tersebut bisa gagal secara diam-diam (silent fail) pada fungsi RPC `execute_sql` karena *type casting error*.
2. **Database Production di Railway Berbeda:**
   Saya telah meng-_hotpatch_ RPC `execute_sql` di Supabase (`mzucfndifneytbesirkx`) untuk men-translasi `'demo-tenant'` menjadi UUID yang valid agar sistem tetap bisa berjalan. Namun, backend di Railway masih mengembalikan data kosong `[]`. Hal ini menunjukkan bahwa **Railway terhubung ke project Supabase lain**, atau RPC `execute_sql` di production Railway belum diperbarui.

### 🛠️ Upaya Perbaikan (Terkendala Hak Akses)

Saya telah mencoba untuk:
- Mengganti `'demo-tenant'` menjadi UUID asli (`337db3a3-ba68-4da9-824a-1ad261197f58`) di _source code_ backend.
- Namun, saat mencoba `git push` ke repositori `xolvoncollective/nashtyxolvon` untuk men-_trigger_ deploy ulang di Railway, saya mendapatkan pesan **403 Permission Denied** karena saya tidak memiliki hak akses tulis ke repositori tersebut.

---

### 📝 Rekomendasi / Langkah Selanjutnya untuk Anda

Agar NASHTY OS siap digunakan sepenuhnya di restoran, silakan lakukan salah satu dari dua langkah berikut:

**Opsi 1: Perbaiki Kode Backend (Direkomendasikan)**
1. Buka file `backoffice/backend/src/routes/main-auth.ts` dan `src/middleware/auth.ts`.
2. Ubah baris `tenantId: 'demo-tenant'` menjadi UUID dari tenant Anda (misal: `'337db3a3-ba68-4da9-824a-1ad261197f58'`).
3. Commit dan push ke Github agar Railway melakukan redeploy.

**Opsi 2: Perbaiki Fungsi `execute_sql` di Supabase Production Anda**
1. Buka SQL Editor di dashboard Supabase yang terhubung dengan Railway.
2. Jalankan skrip `fix-rpc.js` (atau jalankan perintah `CREATE OR REPLACE FUNCTION execute_sql...` yang ada di dalamnya) agar backend bisa mengeksekusi query dengan benar.

Setelah salah satu langkah di atas dilakukan, jalankan ulang skrip seeding (`seed-supabase-direct.js` atau via Postman) dengan UUID yang tepat. Data akan langsung terintegrasi ke 5 sistem yang sudah online.
