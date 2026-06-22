# NASHTY OS - Database Reset Guide

## 🔴 CRITICAL - READ FIRST

**WARNING**: Script `RESET_COMPLETE_DATABASE.sql` akan **MENGHAPUS SEMUA DATA** yang ada di database!

**Gunakan hanya untuk**:
- ✅ Fresh production setup
- ✅ UAT environment
- ✅ Development environment
- ❌ **JANGAN** gunakan di production yang sudah ada data customer!

---

## 📋 What This Script Does

### Phase 1: DROP ALL DATA
Menghapus semua data dari tables (urutan yang benar untuk avoid FK constraints):
- activity_logs
- user_sessions
- user_outlet_access
- user_system_access
- order_items
- orders
- users (POS)
- system_users (Backoffice)
- products
- product_categories
- outlets
- tenants

### Phase 2: SEED MASTER DATA
Re-insert data bersih dengan fix yang benar:
- 1 tenant (Nashty Hot Chicken)
- 3 outlets (Galaxy Mall, Pakuwon TC, TP6)
- 4 system_users (superadmin, owner, 2 managers)
- 6 POS users (2 per outlet)
- User access mappings
- Product categories
- 7 products

### Phase 3: VERIFICATION
Verify data integrity:
- Check counts
- Validate FK constraints
- Ensure no orphaned records

### Phase 4: DISPLAY CREDENTIALS
Show login credentials untuk testing

---

## 🚀 How to Execute

### Step 1: Backup Current Data (Optional)
Jika ada data penting, backup dulu:
```sql
-- Export via Supabase Dashboard → Database → Backups
-- Or use pg_dump if you have CLI access
```

### Step 2: Execute Reset Script
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy-paste entire content of `database/RESET_COMPLETE_DATABASE.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait 2-3 minutes

### Step 3: Verify Output
Expected output:
```
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  PHASE 1: DROPPING ALL EXISTING DATA
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  ✓ All data dropped
NOTICE:  
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  PHASE 2: SEEDING MASTER DATA
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  ✓ Master data seeded
NOTICE:  
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  PHASE 3: VERIFYING DATA INTEGRITY
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  ✓ Tenants: 1
NOTICE:  ✓ Active outlets: 3
NOTICE:  ✓ Active system users: 4
NOTICE:  ✓ Active POS users: 6
NOTICE:  ✓ Active products: 7
NOTICE:  
NOTICE:  ═══════════════════════════════════════════════════════════
NOTICE:  SUCCESS - ALL DATA SEEDED CORRECTLY
NOTICE:  ═══════════════════════════════════════════════════════════

╔════════════════════════════════════════════════════════════╗
║       NASHTY OS - LOGIN CREDENTIALS (RESET COMPLETE)      ║
╚════════════════════════════════════════════════════════════╝

...
```

### Step 4: Test Login

**Backoffice**:
```
URL: https://nashtyxolvon2.pages.dev
Username: superadmin
Password: nashty@2024
```

**POS**:
```
URL: https://nashtyxolvon2.pages.dev/pos
Outlet: Galaxy Mall Surabaya
PIN: 1111
```

---

## ✅ Post-Reset Verification Checklist

Run these SQL queries to verify:

### 1. Check Master Data
```sql
-- Should return 1 tenant
SELECT COUNT(*) FROM tenants WHERE status = 'active';

-- Should return 3 outlets
SELECT id, name, status FROM outlets ORDER BY name;

-- Should return 4 system users
SELECT username, role, is_active FROM system_users ORDER BY username;

-- Should return 6 POS users
SELECT u.name, u.pin, o.name AS outlet 
FROM users u 
JOIN outlets o ON u.outlet_id = o.id 
ORDER BY o.name, u.name;
```

### 2. Check for Orphaned Records (Should all return 0)
```sql
-- Orphaned users
SELECT COUNT(*) FROM users u 
LEFT JOIN outlets o ON u.outlet_id = o.id 
WHERE o.id IS NULL;

-- Orphaned orders
SELECT COUNT(*) FROM orders ord 
LEFT JOIN outlets o ON ord.outlet_id = o.id 
WHERE o.id IS NULL;

-- Orphaned user access
SELECT COUNT(*) FROM user_outlet_access uoa
LEFT JOIN outlets o ON uoa.outlet_id = o.id
WHERE o.id IS NULL;
```

### 3. Check User Access Mappings
```sql
-- Should show system access per user
SELECT su.username, usa.system_name, usa.has_access
FROM system_users su
JOIN user_system_access usa ON su.id = usa.user_id
ORDER BY su.username, usa.system_name;

-- Should show outlet access per user
SELECT su.username, o.name AS outlet
FROM system_users su
JOIN user_outlet_access uoa ON su.id = uoa.user_id
JOIN outlets o ON uoa.outlet_id = o.id
ORDER BY su.username, o.name;
```

---

## 🔍 Troubleshooting

### Error: "relation does not exist"
**Problem**: Table tidak ada di schema
**Solution**: 
1. Pastikan Anda sudah run migration schema terlebih dahulu
2. Check di Supabase Dashboard → Database → Tables
3. Jika tables belum ada, run schema migration dulu sebelum reset script

### Error: "zero-length delimited identifier"
**Problem**: Syntax error di SELECT dengan AS ""
**Solution**: Script baru sudah fix ini. Use `RESET_COMPLETE_DATABASE.sql`

### Error: "foreign key constraint violation"
**Problem**: Masih ada data yang referensi ke record yang mau di-delete
**Solution**: Script sudah handle ini dengan urutan DELETE yang benar (reverse FK order)

### Login Still Fails After Reset
**Check**:
1. Edge function `auth-login` sudah deployed?
2. Environment variables sudah set (JWT_SECRET, etc)?
3. Browser cache cleared?
4. Try incognito mode

**Debug**:
```sql
-- Check if user exists
SELECT * FROM system_users WHERE username = 'superadmin';

-- Check password hash
SELECT username, password_hash FROM system_users WHERE username = 'superadmin';
-- Should be: $2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq
```

---

## 🔐 Login Credentials After Reset

### Backoffice (Username/Password)
| Username | Password | Role | Access |
|----------|----------|------|--------|
| superadmin | nashty@2024 | superadmin | All systems, all outlets |
| owner.nashty | nashty@2024 | owner | Backoffice, CRM, Cost |
| manager.galaxy | nashty@2024 | manager | POS, KDS, Backoffice @ Galaxy |
| manager.pakuwon | nashty@2024 | manager | POS, KDS, Backoffice @ Pakuwon |

### POS (PIN-based)
| PIN | Name | Outlet |
|-----|------|--------|
| 1111 | Citra Kusuma | Galaxy Mall Surabaya |
| 2222 | Budi Santoso | Galaxy Mall Surabaya |
| 3333 | Ani Wijaya | Galaxy Mall Surabaya |
| 4444 | Dina Permata | Pakuwon Trade Center |
| 5555 | Eko Prasetyo | Pakuwon Trade Center |
| 6666 | Fitri Wulandari | Tunjungan Plaza 6 |

---

## 📊 Data Seeded

### Outlets (3)
- Galaxy Mall Surabaya
- Pakuwon Trade Center
- Tunjungan Plaza 6

### Product Categories (3)
- Chicken
- Sides
- Beverages

### Products (7)
**Chicken**:
- Nashty Original (Rp 35,000)
- Nashty Spicy (Rp 35,000)
- Nashty Extreme (Rp 38,000)

**Sides**:
- French Fries (Rp 12,000)
- Coleslaw (Rp 8,000)

**Beverages**:
- Iced Tea (Rp 8,000)
- Mineral Water (Rp 5,000)

---

## 🔄 When to Re-run This Script

**Situations where you should re-run**:
- FK constraint errors masih muncul setelah fix attempts
- Data corruption (orphaned records tidak bisa di-clean)
- Development/testing needs fresh data
- Setting up new environment

**Situations where you should NOT re-run**:
- Production dengan data customer yang sudah ada
- Hanya perlu update specific users (use UPDATE instead)
- Hanya perlu fix password (use UPDATE instead)

---

## 💡 Alternative: Partial Reset

Jika hanya perlu reset users tanpa drop semua data:

```sql
-- Reset system users only
DELETE FROM user_outlet_access;
DELETE FROM user_system_access;
DELETE FROM system_users;

-- Re-insert system users (copy from RESET_COMPLETE_DATABASE.sql Phase 2.3)
INSERT INTO system_users ...
```

---

## 📞 Support

If reset fails or issues persist:
1. Check Supabase logs: Dashboard → Logs
2. Review error messages carefully
3. Check `docs/PRODUCTION_TROUBLESHOOTING.md` for debugging steps
4. Verify Edge Functions are deployed correctly

---

**Last Updated**: 2024-01-15
**Script Version**: RESET_COMPLETE_DATABASE.sql v1.0
**Status**: ✅ Tested and Working