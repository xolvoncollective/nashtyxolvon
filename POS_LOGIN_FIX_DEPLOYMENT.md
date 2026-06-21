# 🔧 CRITICAL POS LOGIN FIX - DEPLOYMENT GUIDE

## MASALAH YANG DIPERBAIKI
1. ❌ Login langsung skip ke petty cash tanpa pilih kasir
2. ❌ "Failed to fetch" error berulang
3. ❌ Tidak ada flow pilih kasir → input PIN
4. ❌ Table `staff` belum ada di database

## SOLUSI
1. ✅ Buat table `staff` untuk kasir POS
2. ✅ Fix API `getStaff()` untuk query table yang benar
3. ✅ Fix API `login()` untuk autentikasi PIN tanpa edge function
4. ✅ Fix `initLogin()` agar tidak auto-restore session
5. ✅ Flow baru: Admin1 login → Lihat daftar kasir → Pilih → Input PIN → Buka shift

---

## 📋 LANGKAH DEPLOYMENT

### STEP 1: Jalankan Migration Baru di Supabase

Buka **Supabase SQL Editor** dan jalankan:

```sql
-- ============================================
-- POS STAFF TABLE
-- Table untuk kasir yang login menggunakan PIN
-- ============================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  outlet_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  pin VARCHAR(4) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'kasir',
  color VARCHAR(7) DEFAULT '#E4540C',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_staff_role CHECK (role IN ('kasir', 'admin'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON staff(outlet_id);
CREATE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS staff_all_access ON staff;

-- Create policies
CREATE POLICY staff_all_access ON staff
  FOR ALL 
  TO authenticated, anon
  USING (true);

-- Insert default staff for testing
INSERT INTO staff (tenant_id, outlet_id, name, pin, role, color) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Citra', '1234', 'kasir', '#E4540C'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Budi', '2345', 'kasir', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Ani', '3456', 'kasir', '#22C55E'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Admin Kasir', '0000', 'admin', '#A855F7')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE staff IS 'Kasir POS yang login menggunakan PIN 4 digit';
```

### STEP 2: Verifikasi Table Berhasil Dibuat

Jalankan query ini untuk cek:

```sql
SELECT * FROM staff;
```

Expected output:
```
id | tenant_id | outlet_id | name        | pin  | role  | color   | is_active
---|-----------|-----------|-------------|------|-------|---------|----------
... | ...       | ...       | Citra       | 1234 | kasir | #E4540C | true
... | ...       | ...       | Budi        | 2345 | kasir | #3B82F6 | true
... | ...       | ...       | Ani         | 3456 | kasir | #22C55E | true
... | ...       | ...       | Admin Kasir | 0000 | admin | #A855F7 | true
```

### STEP 3: Push Code ke GitHub

Code sudah diperbaiki, tinggal push:

```bash
git add .
git commit -m "Fix: POS login flow - add staff table and fix authentication"
git push origin main
```

### STEP 4: Tunggu Cloudflare Auto-Deploy

Cloudflare Pages akan otomatis deploy dari GitHub push (2-3 menit).

---

## 🧪 TESTING FLOW BARU

### Test 1: Login sebagai Admin1
1. Buka https://nashtyxolvon2.pages.dev
2. Login dengan: **admin1** / **admin1**
3. Klik icon **POS**
4. ✅ **Expected:** Muncul layar pilih kasir (Citra, Budi, Ani, Admin Kasir)

### Test 2: Pilih Kasir dan Input PIN
1. Klik salah satu kasir (contoh: **Citra**)
2. ✅ **Expected:** Muncul layar input PIN 4 digit
3. Input PIN: **1234**
4. ✅ **Expected:** Berhasil login, muncul modal "Buka Shift"

### Test 3: Buka Shift
1. Input saldo petty cash awal (contoh: 500,000)
2. Klik "Mulai Shift"
3. ✅ **Expected:** Shift dibuka, POS siap digunakan
4. ✅ **Expected:** TIDAK ada error "failed to fetch"

### Test 4: Logout dan Login Ulang
1. Klik menu user → Logout
2. Login ulang sebagai admin1
3. Masuk ke POS lagi
4. ✅ **Expected:** Harus pilih kasir lagi (TIDAK auto-login)

---

## 📊 KASIR DEFAULT

| Nama        | PIN  | Role  | Warna   |
|-------------|------|-------|---------|
| Citra       | 1234 | kasir | Orange  |
| Budi        | 2345 | kasir | Blue    |
| Ani         | 3456 | kasir | Green   |
| Admin Kasir | 0000 | admin | Purple  |

---

## ⚠️ TROUBLESHOOTING

### Masalah: "Failed to fetch staff"
**Solusi:** 
- Cek apakah table `staff` sudah dibuat di Supabase
- Cek RLS policy: `staff_all_access` harus allow `anon` role

### Masalah: "PIN salah" padahal PIN benar
**Solusi:**
- Cek data di table staff dengan query: `SELECT name, pin FROM staff;`
- Pastikan PIN match (case sensitive untuk table)

### Masalah: Langsung masuk tanpa pilih kasir
**Solusi:**
- Clear browser localStorage
- Hard refresh (Ctrl+Shift+R)
- Cek `api-client.js` sudah update

---

## 📝 FILES YANG DIUBAH

1. `pos/frontend/js/auth.js` - Fix initLogin() agar tidak auto-restore
2. `api-client.js` - Fix getStaff() dan login() untuk query table staff
3. `database/migrations/003_create_staff_table.sql` - New table staff

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Migration SQL dijalankan di Supabase
- [ ] Table `staff` berhasil dibuat
- [ ] 4 kasir default ter-insert
- [ ] Code di-push ke GitHub
- [ ] Cloudflare auto-deploy selesai
- [ ] Test login flow berhasil
- [ ] Test pilih kasir berhasil
- [ ] Test input PIN berhasil
- [ ] Test buka shift berhasil
- [ ] Tidak ada error "failed to fetch"

---

**Status:** Ready to deploy ✅
**Priority:** CRITICAL 🚨
**ETA:** 5 menit
