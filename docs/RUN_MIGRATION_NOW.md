# 🚀 RUN SUPABASE MIGRATION - Quick Guide

**LANGKAH CEPAT - Ikuti ini untuk setup database Supabase sekarang!**

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Buka Supabase Dashboard

1. Buka browser, masuk ke: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
2. Login jika belum
3. Pastikan project status **ACTIVE** (tidak paused)
   - Jika paused, klik tombol **Resume Project**
   - Tunggu 2-3 menit sampai fully active

### Step 2: Buka SQL Editor

1. Di sidebar kiri, klik **SQL Editor** (icon database dengan lightning)
2. Klik tombol **+ New Query** (pojok kanan atas)

### Step 3: Copy Migration SQL

1. Buka file di komputer: `c:\Users\farsya\NashtyBerubah\Production-Ready\Database\supabase-migration.sql`
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 4: Run Migration

1. Kembali ke Supabase SQL Editor
2. **Paste** SQL ke editor (Ctrl+V)
3. Klik tombol **Run** (atau tekan Ctrl+Enter)
4. Tunggu 30-60 detik
5. Lihat hasil di panel bawah - harus ada pesan sukses

### Step 5: Verify Tables

1. Di sidebar kiri, klik **Table Editor**
2. Harus muncul 18 tables:
   - ✅ tenants
   - ✅ outlets
   - ✅ users
   - ✅ categories
   - ✅ products
   - ✅ modifier_groups
   - ✅ modifier_options
   - ✅ product_modifiers
   - ✅ shifts
   - ✅ orders
   - ✅ order_items
   - ✅ order_item_modifiers
   - ✅ payments
   - ✅ payment_methods
   - ✅ activity_logs
   - ✅ settings
   - ✅ stations
   - ✅ nashtycosts

### Step 6: Check Demo Data

1. Klik table **tenants** → harus ada 1 row: "Demo Tenant"
2. Klik table **outlets** → harus ada 1 row: "Demo Outlet"
3. Klik table **users** → harus ada 4 rows:
   - Citra Dewi (cashier)
   - Budi Santoso (cashier)
   - Ani Kitchen (kitchen)
   - Admin Demo (owner)

### Step 7: Test Connection dari Backend

```bash
cd c:\Users\farsya\NashtyBerubah\backoffice\backend
npm run supabase:test
```

**Expected Output:**
```
✅ Supabase client connected
✅ Found 1 tenants
✅ Table 'users': 4 rows
✅ All tests passed!
```

---

## 🎯 Jika Ada Masalah

### Problem: Project Paused

**Error:** "Project is paused"

**Solution:**
1. Dashboard → klik **Resume Project**
2. Tunggu 2-3 menit
3. Refresh page
4. Ulangi migration

### Problem: Permission Denied

**Error:** "permission denied for table tenants"

**Solution:**
1. Pastikan login dengan akun owner project
2. Atau run di SQL Editor dengan **service_role** privileges
3. Settings → API → copy Service Role key
4. Use that for admin operations

### Problem: Table Already Exists

**Error:** "relation 'tenants' already exists"

**Solution:**
Migration sudah pernah dijalankan! Skip ke verification (Step 5)

### Problem: DNS Error

**Error:** "getaddrinfo ENOTFOUND db.mzucfndifneytbesirkx.supabase.co"

**Solution:**
Ini normal untuk direct connection. Gunakan **Supabase Dashboard** untuk run migration (Step 2-4 di atas).

---

## 📋 Post-Migration Checklist

Setelah migration sukses:

- [ ] 18 tables created successfully
- [ ] Demo tenant & outlet exist
- [ ] 4 demo users created
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Triggers working
- [ ] Connection test passes

---

## 🔄 Alternative: Reset Database (Jika Perlu)

Jika ingin mulai dari awal clean:

### Option A: Drop All Tables (via SQL Editor)

```sql
-- WARNING: This will delete ALL data!

DROP TABLE IF EXISTS order_item_modifiers CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS product_modifiers CASCADE;
DROP TABLE IF EXISTS modifier_options CASCADE;
DROP TABLE IF EXISTS modifier_groups CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS nashtycosts CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop types
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS role_type CASCADE;
DROP TYPE IF EXISTS order_type_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS kitchen_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS modifier_type CASCADE;
```

Kemudian run migration lagi dari Step 3.

### Option B: Create New Database (Not Recommended)

Atau buat project Supabase baru jika benar-benar perlu fresh start.

---

## 🎉 Next Steps After Migration Success

1. **Update Backend to Use Supabase**
   - Edit `src/db/database.ts`
   - Change from SQLite to Supabase queries
   - Use `supabase.from('table').select()` pattern

2. **Enable Realtime for KDS**
   ```typescript
   supabase.channel('orders')
     .on('postgres_changes', { event: '*', table: 'orders' }, 
       payload => updateKDS(payload))
     .subscribe();
   ```

3. **Configure RLS Policies**
   - Set proper tenant isolation
   - Add user role-based access
   - Test with different users

4. **Switch to Production Mode**
   ```env
   DATABASE_MODE=postgres
   NODE_ENV=production
   ```

5. **Deploy to Cloudflare**
   - Backend → Cloudflare Workers
   - Frontend → Cloudflare Pages
   - Connect to Supabase from edge

---

## 💡 Quick Commands Reference

```bash
# Test connection
npm run supabase:test

# Run migration (if DNS works)
npm run supabase:migrate

# Start dev server with Supabase
npm run dev

# Build for production
npm run build
```

---

## 📞 Need Help?

**Check Logs:**
- Supabase Dashboard → Logs
- Check for errors during migration

**Documentation:**
- Full guide: `docs/SUPABASE_SETUP_GUIDE.md`
- Supabase docs: https://supabase.com/docs

**Repository:**
- Specs: `.kiro/specs/`
- Issues: GitHub Issues

---

**🚀 SEKARANG: Ikuti Step 1-7 di atas untuk setup database!**

*Estimasi waktu: 5 minutes*
*Difficulty: Easy*

