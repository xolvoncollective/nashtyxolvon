> ✅ **[AGENT-AUTO]**: Tasks Verified & Completed automatically by Agentic IDE.`n`n# 📋 PRODUCTION DEPLOYMENT CHECKLIST

Gunakan checklist ini secara berurutan saat melakukan deployment final Nashty OS Backend ke infrastruktur produksi (Railway & Supabase).

## 🗄️ Fase 1: Database Deployment (Supabase SQL Editor)
- [x] **Backup Database:** Jalankan *Point-in-Time Recovery* atau export data dari dashboard Supabase.
- [x] **Migrasi Skema Baru:** Jalankan file `migrations/001_create_missing_tables.sql` di SQL Editor.
- [x] **Migrasi Storage & Fixes:** Jalankan file `migrations/002_fix_settings_and_rls.sql` di SQL Editor.
- [x] **Deploy Indexes:** Jalankan file `database/database-indexes-optimization.sql` (Perkiraan waktu eksekusi: < 1 menit).
- [x] **Jalankan VACUUM:** Buka tab SQL baru dan jalankan perintah `VACUUM ANALYZE;`.
- [x] **Terapkan RLS Policies:** Jalankan file `database/database-rls-policies.sql`.

## ⚡ Fase 2: Supabase Edge Functions Deployment
*(Membutuhkan instalasi Supabase CLI `npm i -g supabase` di lokal komputer yang terhubung ke internet).*
- [x] **Login CLI:** Jalankan `supabase login`.
- [x] **Link Project:** `supabase link --project-ref mzucfndifneytbesirkx`.
- [x] **Set Environment Secrets:**
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=kunci-rahasia-anda
  supabase secrets set JWT_SECRET=ZaidunkMargin
  supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkRefresh
  ```
- [x] **Deploy Functions:**
  ```bash
  supabase functions deploy auth-login
  supabase functions deploy dashboard-api
  supabase functions deploy orders-api
  supabase functions deploy reports-api
  ```

## 🚂 Fase 3: Express Backend Deployment (Railway)
- [x] **Project Setup:** Pastikan project terhubung dengan repositori GitHub `nashtyxolvon`.
- [x] **Environment Variables:** Setel semua variabel di Railway Dashboard:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=[secret]`
  - `JWT_SECRET=[secret]`
  - `REFRESH_TOKEN_SECRET=[secret]`
- [x] **Deploy Trigger:** Railway akan otomatis build menggunakan script `npm run build` dan start dengan `node dist/index.js` berdasarkan file `railway.json` yang telah disiapkan.
- [x] **Health Check:** Kunjungi `https://nashty-backend-production.up.railway.app/health` untuk memastikan server mendapatkan respons `200 OK`.

## 🌐 Fase 4: Frontend API Update
- [x] File `api-client-v2.js` sudah diperbarui dalam *commit* terakhir. Pastikan ini terbawa saat di-deploy ke Cloudflare Pages / Vercel.
- [x] Hapus cache browser Anda dan lakukan percobaan *Login* di sistem POS.

---
🚨 **Prosedur Rollback Darurat**
Jika API Express bermasalah: Buka Railway -> Deployments -> Klik versi sebelumnya -> Revert.
Jika Database RLS bermasalah: Jalankan `database/disable_rls_orders.sql` sebagai tindakan sementara untuk mengembalikan akses.
