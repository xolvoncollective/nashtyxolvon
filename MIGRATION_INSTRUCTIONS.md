# 🚀 MIGRATION SUPABASE - Instruksi Lengkap

**PILIH SALAH SATU METODE DI BAWAH INI**

---

## ✅ METODE 1: Via Supabase Dashboard (PALING MUDAH) ⭐

### Langkah 1: Buka Dashboard
```
URL: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
```

### Langkah 2: Check Project Status
- Pastikan status: **ACTIVE** (hijau)
- Jika **PAUSED** → klik "Resume Project" → tunggu 2-3 menit

### Langkah 3: Buka SQL Editor
1. Sidebar kiri → klik **"SQL Editor"** (icon ⚡)
2. Klik **"+ New Query"** (pojok kanan atas)

### Langkah 4: Copy Migration SQL
**Lokasi file:**
```
c:\Users\farsya\NashtyBerubah\Production-Ready\Database\supabase-migration.sql
```

**Cara:**
1. Buka file tersebut dengan text editor (Notepad, VS Code, dll)
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)

### Langkah 5: Paste & Run
1. Kembali ke Supabase SQL Editor
2. Paste SQL (Ctrl+V) ke editor
3. Klik tombol **"Run"** atau tekan **Ctrl+Enter**
4. Tunggu 30-60 detik

### Langkah 6: Check Hasil
Panel bawah akan show:
- ✅ "Success" → Migration berhasil!
- ❌ Error → Screenshot error dan kasih tau saya

### Langkah 7: Verify Tables
1. Sidebar kiri → klik **"Table Editor"**
2. Harus ada 18 tables baru:

**Core Tables:**
- ✅ tenants
- ✅ outlets  
- ✅ users
- ✅ categories
- ✅ products

**Transaction Tables:**
- ✅ orders
- ✅ order_items
- ✅ order_item_modifiers
- ✅ payments
- ✅ shifts

**Modifier Tables:**
- ✅ modifier_groups
- ✅ modifier_options
- ✅ product_modifiers

**Other Tables:**
- ✅ payment_methods
- ✅ activity_logs
- ✅ settings
- ✅ stations
- ✅ nashtycosts

### Langkah 8: Check Demo Data
Klik masing-masing table:

**tenants** → harus ada 1 row:
```
id: 00000000-0000-0000-0000-000000000001
name: Demo Tenant
slug: demo-tenant
plan: pro
status: active
```

**outlets** → harus ada 1 row:
```
id: 00000000-0000-0000-0000-000000000002
name: Demo Outlet
slug: demo-outlet
```

**users** → harus ada 4 rows:
```
1. Citra Dewi    (cashier) PIN: 1234
2. Budi Santoso  (cashier) PIN: 2345
3. Ani Kitchen   (kitchen) PIN: 3456
4. Admin Demo    (owner)   PIN: 0000
```

### Langkah 9: Test dari Backend
```bash
cd c:\Users\farsya\NashtyBerubah\backoffice\backend
npm run supabase:test
```

**Expected:**
```
✅ Supabase client connected
✅ Found 1 tenants
✅ Table 'tenants': 1 rows
✅ Table 'outlets': 1 rows
✅ Table 'users': 4 rows
✅ All tests passed!
```

---

## 🔧 METODE 2: Via Command Line (Jika DNS Resolved)

### Prerequisites
- Supabase project harus ACTIVE
- Network bisa akses db.mzucfndifneytbesirkx.supabase.co

### Run Migration
```bash
cd c:\Users\farsya\NashtyBerubah\backoffice\backend
npm run supabase:migrate
```

### Expected Output
```
🔄 Connecting to Supabase PostgreSQL...
✅ Connected successfully!
📄 Reading migration file...
🚀 Running migration...
✅ Migration completed successfully!
🧪 Testing connection...
✅ Found 1 tenants in database
```

### If Failed
```
❌ Migration failed:
getaddrinfo ENOTFOUND db.mzucfndifneytbesirkx.supabase.co
```

→ **Gunakan METODE 1** (Dashboard)

---

## 🐛 TROUBLESHOOTING

### Problem: "Project is paused"
**Solution:**
1. Dashboard → Resume Project
2. Wait 2-3 minutes
3. Try again

### Problem: "Table already exists"
**Solution:**
Migration sudah pernah dijalankan! Skip ke verification:
```bash
npm run supabase:test
```

### Problem: "Permission denied"
**Solution:**
1. Check login dengan account owner
2. Atau use Service Role key di .env

### Problem: "Connection timeout"
**Solution:**
1. Check internet connection
2. Try VPN jika ada firewall
3. Use METODE 1 (Dashboard) instead

### Problem: "Some statements failed"
**Solution:**
Lihat error message, biasanya:
- Extension already exists → OK, ignore
- Type already exists → OK, ignore
- Permission issue → Check role/auth

---

## ✅ SUCCESS CHECKLIST

Setelah migration, pastikan:

- [ ] 18 tables created
- [ ] 1 tenant exists (Demo Tenant)
- [ ] 1 outlet exists (Demo Outlet)
- [ ] 4 users exist (cashiers + admin)
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] `npm run supabase:test` passes

---

## 📞 AFTER MIGRATION SUCCESS

### Next Steps:

1. **Commit Changes**
```bash
git add .
git commit -m "feat: Complete Supabase migration"
git push
```

2. **Update Backend Code**
Edit `src/db/database.ts` to support Supabase mode

3. **Switch Database Mode**
Update `.env`:
```env
DATABASE_MODE=postgres
```

4. **Test Application**
```bash
npm run dev
```

Visit: http://localhost:3099

---

## 🎯 QUICK REFERENCE

**Dashboard:**
https://supabase.com/dashboard/project/mzucfndifneytbesirkx

**Migration File:**
`c:\Users\farsya\NashtyBerubah\Production-Ready\Database\supabase-migration.sql`

**Test Connection:**
```bash
npm run supabase:test
```

**Documentation:**
- `docs/SUPABASE_SETUP_GUIDE.md` - Full guide
- `docs/RUN_MIGRATION_NOW.md` - Quick guide

---

## 💡 TIPS

1. **Gunakan METODE 1** (Dashboard) - paling reliable
2. Screenshot error jika ada masalah
3. Check Table Editor setelah migration
4. Test connection sebelum lanjut coding
5. Backup local SQLite sebelum switch mode

---

**⏰ Estimasi Total: 10 minutes**

**SEKARANG: Ikuti METODE 1 step-by-step!** 🚀

