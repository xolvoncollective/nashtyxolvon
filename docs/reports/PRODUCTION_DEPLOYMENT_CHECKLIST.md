# 📋 PRODUCTION DEPLOYMENT CHECKLIST

Gunakan checklist ini secara berurutan saat melakukan deployment final Nashty OS Backend ke infrastruktur produksi (Railway & Supabase).

## 🗄️ Fase 1: Database Deployment (Supabase SQL Editor)
- [ ] **Backup Database:** Jalankan *Point-in-Time Recovery* atau export data dari dashboard Supabase.
- [ ] **Migrasi Skema Baru:** Jalankan file `migrations/001_create_missing_tables.sql` di SQL Editor.
- [ ] **Migrasi Storage & Fixes:** Jalankan file `migrations/002_fix_settings_and_rls.sql` di SQL Editor.
- [ ] **Deploy Indexes:** Jalankan file `database/database-indexes-optimization.sql` (Perkiraan waktu eksekusi: < 1 menit).
- [ ] **Jalankan VACUUM:** Buka tab SQL baru dan jalankan perintah `VACUUM ANALYZE;`.
- [ ] **Terapkan RLS Policies:** Jalankan file `database/database-rls-policies.sql`.

## ⚡ Fase 2: Supabase Edge Functions Deployment
*(Membutuhkan instalasi Supabase CLI `npm i -g supabase` di lokal komputer yang terhubung ke internet).*
- [ ] **Login CLI:** Jalankan `supabase login`.
- [ ] **Link Project:** `supabase link --project-ref mzucfndifneytbesirkx`.
- [ ] **Set Environment Secrets:**
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=kunci-rahasia-anda
  supabase secrets set JWT_SECRET=ZaidunkMargin
  supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkRefresh
  ```
- [ ] **Deploy Functions:**
  ```bash
  supabase functions deploy auth-login
  supabase functions deploy dashboard-api
  supabase functions deploy orders-api
  supabase functions deploy reports-api
  ```

## 🚂 Fase 3: Express Backend Deployment (Railway)
- [ ] **Project Setup:** Pastikan project terhubung dengan repositori GitHub `nashtyxolvon`.
- [ ] **Environment Variables:** Setel semua variabel di Railway Dashboard:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=[secret]`
  - `JWT_SECRET=[secret]`
  - `REFRESH_TOKEN_SECRET=[secret]`
- [ ] **Deploy Trigger:** Railway akan otomatis build menggunakan script `npm run build` dan start dengan `node dist/index.js` berdasarkan file `railway.json` yang telah disiapkan.
- [ ] **Health Check:** Kunjungi `https://nashty-backend-production.up.railway.app/health` untuk memastikan server mendapatkan respons `200 OK`.

## 🌐 Fase 4: Frontend API Update
- [ ] File `api-client-v2.js` sudah diperbarui dalam *commit* terakhir. Pastikan ini terbawa saat di-deploy ke Cloudflare Pages / Vercel.
- [ ] Hapus cache browser Anda dan lakukan percobaan *Login* di sistem POS.

---
🚨 **Prosedur Rollback Darurat**
Jika API Express bermasalah: Buka Railway -> Deployments -> Klik versi sebelumnya -> Revert.
Jika Database RLS bermasalah: Jalankan `database/disable_rls_orders.sql` sebagai tindakan sementara untuk mengembalikan akses.
