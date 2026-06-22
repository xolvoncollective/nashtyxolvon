# 🚨 URGENT FIX - Sistem Login & Database

## Masalah yang Ditemukan:

### 1. ❌ POS Tidak Bisa Login (CRITICAL)
**Penyebab:** PIN di database pakai hash (`$2b$10$...`), tapi sistem cari PIN biasa (1111, 2222, dll)

**Solusi:** Ubah semua PIN user POS jadi angka biasa

### 2. ❌ Outlet ID Salah
**Penyebab:** Data seed pakai ID outlet yang berbeda dengan yang ada di database

**Solusi:** Update semua outlet_id di tabel users

---

## ✅ CARA PERBAIKI (5 MENIT):

### Langkah 1: Jalankan SQL Fix
1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project `mzucfndifneytbesirkx`
3. Klik **SQL Editor** di sidebar kiri
4. Copy paste isi file `database/fix-critical-issues.sql`
5. Klik **Run** (atau tekan F5)
6. Tunggu sampai selesai (muncul "Success")

### Langkah 2: Test Login
**Backoffice:**
- URL: https://nashtyxolvon2.pages.dev
- Username: `superadmin`
- Password: `nashty@2024`
- Pilih outlet dari dropdown
- Klik Login

**POS Terminal:**
- URL: https://nashtyxolvon2.pages.dev/pos
- Pilih outlet: **Galaxy Mall Surabaya**
- Masukkan PIN: `1111` (Citra Kusuma)
- Atau PIN: `2222` (Budi Santoso)
- Klik Login

---

## 📋 Kredensial Login (Setelah Fix)

### Backoffice Login:
| Username | Password | Role | Outlet |
|----------|----------|------|--------|
| superadmin | nashty@2024 | Superadmin | Pilih dari dropdown |
| owner.nashty | nashty@2024 | Owner | Pilih dari dropdown |
| manager.galaxy | nashty@2024 | Manager | Galaxy Mall |

### POS Login (PIN):
| Nama | PIN | Outlet | Role |
|------|-----|--------|------|
| Citra Kusuma | 1111 | Galaxy Mall Surabaya | Cashier |
| Budi Santoso | 2222 | Galaxy Mall Surabaya | Cashier |
| Ani Wijaya | 3333 | Galaxy Mall Surabaya | Cashier |
| Dina Permata | 4444 | Pakuwon Trade Center | Cashier |
| Eko Prasetyo | 5555 | Pakuwon Trade Center | Cashier |
| Fitri Wulandari | 6666 | Tunjungan Plaza 6 | Cashier |

---

## 🔧 Apa Yang Diperbaiki?

1. **PIN POS Users:**
   - Sebelum: `$2b$10$abcdefghijklmnopqrstuvwxyz123456` (bcrypt hash)
   - Sesudah: `1111`, `2222`, `3333`, dll (plain numeric)

2. **Outlet IDs:**
   - Fixed semua user outlet_id ke UUID yang benar
   - Galaxy Mall: `71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e`
   - Pakuwon TC: (auto-select dari database)
   - TP6: (auto-select dari database)

3. **Data Integrity Check:**
   - Verify tidak ada orphaned records
   - Check foreign key relationships
   - Validate semua users punya outlet valid

---

## ✅ Verifikasi Setelah Fix:

Jalankan diagnostic tool:
```bash
node scripts/diagnose-system.js
```

**Expected Output:**
```
✅ Backoffice login: SUCCESS
✅ POS PIN login: SUCCESS (PIN 1111 at Galaxy Mall)
✅ Orders API: Ready (needs auth token)
✅ Analytics API: Ready (needs params)
```

---

## 📞 Jika Masih Ada Masalah:

### Backoffice tidak bisa login:
1. Check username betul: `superadmin` (lowercase, no space)
2. Check password: `nashty@2024` (case sensitive)
3. Pilih outlet dari dropdown (required)
4. Check browser console untuk error (F12 → Console tab)

### POS tidak bisa login:
1. Pastikan SQL fix sudah di-run
2. Pilih outlet yang benar (Galaxy Mall untuk PIN 1111)
3. PIN harus 4 digit numeric
4. Check browser console untuk error

### Diagnostic script error:
```bash
# Test manual dengan curl:
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"action":"main-login","username":"superadmin","password":"nashty@2024"}'
```

---

## 📁 File Penting:

- `database/fix-critical-issues.sql` - **RUN THIS FIRST**
- `docs/CRITICAL_FIX_REPORT.md` - Detailed diagnosis
- `docs/LOGIN_DOCUMENTATION.md` - Complete API docs
- `scripts/diagnose-system.js` - Health check tool

---

**Status:** 🔴 CRITICAL - Butuh action immediate  
**Priority:** P0 - Blocking production  
**ETA:** 5 minutes to fix  
**Last Updated:** 2025-01-18
