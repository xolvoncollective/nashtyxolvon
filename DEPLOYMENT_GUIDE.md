# 🚀 NASHTY OS - PRODUCTION DEPLOYMENT GUIDE

## 📋 TABLE OF CONTENTS
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Supabase Edge Functions](#supabase-edge-functions)
4. [Environment Configuration](#environment-configuration)
5. [Testing & Verification](#testing-verification)
6. [Post-Deployment](#post-deployment)

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### Required Access
- [ ] GitHub repository access: `xolvoncollective/nashtyxolvon`
- [ ] Cloudflare Pages dashboard access
- [ ] Supabase project access: `mzucfndifneytbesirkx`
- [ ] Production URL: `https://nashtyxolvon2.pages.dev`

### Files Status
- [ ] All code committed to GitHub
- [ ] Documentation moved to `/DraftMD`
- [ ] Database migrations ready
- [ ] Seed data prepared
- [ ] Edge functions ready

---

## 💾 DATABASE SETUP

### Step 1: Run Core Migrations

Open **Supabase SQL Editor** and run these in order:

#### 1.1. User Management Tables
```bash
File: database/migrations/001_create_user_tables.sql
```
Creates: `system_users`, `user_system_access`, `user_outlet_access`, `user_sessions`

#### 1.2. Default Users
```bash
File: database/migrations/002_insert_default_users.sql
```
Creates 5 default accounts:
- `superadmin@nashty` / `nashty1111`
- `admin1` / `admin1`
- `admin2` / `admin2`
- `admin3` / `admin3`
- `admin4` / `admin4`

#### 1.3. POS Staff Table
```bash
File: database/migrations/003_create_staff_table.sql
```
Creates `staff` table with 4 kasir:
- Citra (PIN: 1234)
- Budi (PIN: 2345)
- Ani (PIN: 3456)
- Admin Kasir (PIN: 0000)

### Step 2: Load Seed Data

```bash
File: database/SEED_DATA_COMPLETE.sql
```

This will create:
- ✅ 1 Tenant, 1 Outlet
- ✅ 5 System Users
- ✅ 4 POS Staff
- ✅ 5 Menu Categories
- ✅ 15 Menu Items (Ayam Goreng, Nasi Bowl, Minuman, Snack)
- ✅ 7 Orders (5 hari ini, 2 kemarin)
- ✅ 16 Order Items
- ✅ 4 Audit Logs
- ✅ 1 Active Shift
- ✅ Relaxed RLS Policies

### Step 3: Verify Database

Run this verification query:

```sql
-- Check all tables
SELECT 
  'system_users' as table_name, COUNT(*) as count FROM system_users
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;
```

Expected output:
```
table_name     | count
---------------|-------
system_users   | 5
staff          | 4
menu_items     | 15
orders         | 7
order_items    | 16
```

---

## 🔧 SUPABASE EDGE FUNCTIONS

### Export CSV Function

Deploy edge function untuk export data:

```bash
# In Supabase Dashboard → Edge Functions
# Create new function: export-csv
# Copy code from: supabase/functions/export-csv/index.ts
```

Features:
- Export transactions to CSV
- Export audit logs to CSV
- Export order items (detail) to CSV
- Export menu to CSV
- Date range filter support

Usage from Backoffice:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/export-csv`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'transactions', // or 'audit_log', 'order_items', 'menu'
    dateFrom: '2026-06-01',
    dateTo: '2026-06-30',
    tenantId: 'xxx',
    outletId: 'xxx'
  })
});

const blob = await response.blob();
// Download as CSV file
```

---

## ⚙️ ENVIRONMENT CONFIGURATION

### Supabase Environment Variables

Already configured in code:
```javascript
SUPABASE_URL = "https://mzucfndifneytbesirkx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGc..."
```

### Cloudflare Pages

No environment variables needed - all configuration is embedded in code for static deployment.

---

## 🧪 TESTING & VERIFICATION

### Test 1: Authentication Flow

1. Open `https://nashtyxolvon2.pages.dev`
2. Login with: `admin1` / `admin1`
3. ✅ Should see dashboard with 5 system icons

### Test 2: POS Login Flow

1. Click **POS** icon
2. ✅ Should show staff selection (4 kasir)
3. Click **Citra**
4. ✅ Should show PIN input
5. Enter PIN: `1234`
6. ✅ Should login successfully
7. ✅ Should show "Buka Shift" modal
8. Input petty cash: `500000`
9. Click "Mulai Shift"
10. ✅ POS ready, no errors

### Test 3: POS Transactions

1. Add items to cart
2. ✅ Should see menu items loaded
3. Click "Bayar"
4. ✅ Should show payment modal
5. Complete payment
6. ✅ Should create order successfully
7. Check history tab
8. ✅ Should see transaction in history

### Test 4: KDS Display

1. Go to KDS system
2. ✅ Should show active orders
3. ✅ Should see order from SNY-0004, SNY-0005 (from seed data)
4. Mark item as ready
5. ✅ Should update status

### Test 5: Backoffice

1. Go to Backoffice
2. Navigate to Reports
3. ✅ Should see transactions from seed data
4. Try export to CSV
5. ✅ Should download CSV file

---

## 📊 POST-DEPLOYMENT

### Monitor These Areas

1. **Console Errors**
   - Check browser console for any errors
   - Should be zero errors on page load

2. **Network Requests**
   - All Supabase requests should return 200 OK
   - No 404 or 401 errors

3. **Data Integrity**
   - Transactions appear correctly
   - Menu items load properly
   - Staff can login with PIN

### Known Data from Seed

#### Menu Categories
1. Ayam Goreng
2. Nasi & Rice Bowl
3. Minuman Dingin
4. Minuman Panas
5. Snack & Side

#### Sample Products
- Ayam Goreng Original: Rp 25,000
- Nasi Ayam Geprek Bowl: Rp 32,000
- Es Teh Manis: Rp 5,000
- Thai Tea: Rp 12,000
- Kentang Goreng: Rp 15,000

#### Sample Orders
- SNY-0001: Paid, Rp 66,120 (2 hours ago)
- SNY-0002: Paid, Rp 44,080 (1.5 hours ago)
- SNY-0003: Paid, Rp 102,080 (45 min ago)
- SNY-0004: Confirmed, Rp 69,600 (GoFood, 20 min ago)
- SNY-0005: Confirmed, Rp 87,000 (10 min ago)

---

## 🔐 DEFAULT CREDENTIALS

### System Users (Launcher Login)
```
superadmin@nashty / nashty1111
admin1 / admin1
admin2 / admin2
admin3 / admin3
admin4 / admin4
```

### POS Staff (PIN Login)
```
Citra - PIN: 1234
Budi - PIN: 2345
Ani - PIN: 3456
Admin Kasir - PIN: 0000
```

---

## 📁 FILE STRUCTURE

```
/database
├── /migrations
│   ├── 001_create_user_tables.sql
│   ├── 002_insert_default_users.sql
│   └── 003_create_staff_table.sql
├── DEPLOY_SUPABASE_SQL.sql (all-in-one deployment)
└── SEED_DATA_COMPLETE.sql (dummy data untuk UAT)

/supabase
└── /functions
    └── /export-csv
        └── index.ts

/DraftMD (documentation archive)
└── *.md (all documentation except README)
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Failed to fetch staff"
**Solution:** Run `database/migrations/003_create_staff_table.sql`

### Issue: "Table does not exist"
**Solution:** Run all migrations in order (001, 002, 003, then SEED_DATA)

### Issue: "RLS policy error"
**Solution:** Seed data includes relaxed RLS policies, re-run SEED_DATA_COMPLETE.sql

### Issue: "No menu items showing"
**Solution:** Check `menu_items` and `outlet_menu_items` tables have data

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

- [ ] All 3 migrations ran successfully
- [ ] Seed data loaded (15 menu items, 7 orders)
- [ ] Edge function deployed (export-csv)
- [ ] Code pushed to GitHub
- [ ] Cloudflare auto-deploy completed
- [ ] Login test passed (admin1)
- [ ] POS login test passed (Citra PIN 1234)
- [ ] Transaction creation works
- [ ] KDS shows active orders
- [ ] Backoffice reports work
- [ ] CSV export works
- [ ] No console errors
- [ ] All 5 systems accessible

---

**Status:** Ready for Client Handover ✅
**Version:** Production 1.0
**Date:** June 22, 2026
