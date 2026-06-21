# 🚀 SUPABASE COMPLETE RESET & DEPLOYMENT GUIDE

**Date:** 2026-06-21  
**Purpose:** Complete Supabase database reset and fresh deployment  
**Status:** Ready for Execution

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Current Supabase Info
```
Project ID: mzucfndifneytbesirkx
URL: https://mzucfndifneytbesirkx.supabase.co
Dashboard: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
```

### Issues to Fix
- ✅ Duplicate data from multiple deployments
- ✅ Inconsistent primary keys
- ✅ Missing foreign key constraints
- ✅ Incomplete table structure
- ✅ Missing indexes

---

## 🗄️ COMPLETE DATABASE SCHEMA

### Master Tables Structure

```sql
-- ==========================================
-- MASTER TABLE HIERARCHY
-- ==========================================

tenants (ROOT)
  ├── id (PK: UUID)
  ├── name
  ├── slug (UNIQUE)
  ├── plan (starter/pro/enterprise)
  └── status (active/suspended/cancelled)

outlets (LEVEL 2)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── name
  ├── slug (UNIQUE per tenant)
  ├── address, phone
  ├── qris_static_url
  └── receipt/display settings (JSON)

users (LEVEL 3 - Staff)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── outlet_id (FK → outlets.id) SET NULL
  ├── email, name, role
  ├── pin (4 digits for cashier)
  └── password_hash (bcrypt)

categories (LEVEL 3 - Menu)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── name, slug
  └── order_position

products (LEVEL 4)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── category_id (FK → categories.id) SET NULL
  ├── name, price, cost
  ├── image_url
  └── production_time (minutes)

orders (LEVEL 4 - Transactions)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── outlet_id (FK → outlets.id) CASCADE
  ├── user_id (FK → users.id) SET NULL
  ├── shift_id (FK → shifts.id) SET NULL
  ├── order_number (UNIQUE)
  ├── order_type (dine-in/takeaway)
  ├── order_status (pending/completed/cancelled)
  ├── kitchen_status (pending/preparing/ready)
  └── totals (subtotal, tax, discount, total)

order_items (LEVEL 5)
  ├── id (PK: UUID)
  ├── order_id (FK → orders.id) CASCADE
  ├── product_id (FK → products.id) SET NULL
  ├── quantity, unit_price, subtotal
  ├── modifiers (JSONB)
  └── notes
```

### Supporting Tables

```sql
modifier_groups
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── name (e.g., "Level Pedas")
  ├── type (single/multiple)
  └── required (boolean)

modifier_options
  ├── id (PK: UUID)
  ├── group_id (FK → modifier_groups.id) CASCADE
  ├── name (e.g., "Pedas Sedang")
  └── price_adjustment

product_modifiers (Junction)
  ├── product_id (FK → products.id) CASCADE
  └── modifier_group_id (FK → modifier_groups.id) CASCADE
  └── PRIMARY KEY (product_id, modifier_group_id)

shifts (Cashier Sessions)
  ├── id (PK: UUID)
  ├── outlet_id (FK → outlets.id) CASCADE
  ├── user_id (FK → users.id) SET NULL
  ├── start_cash, end_cash
  └── status (open/closed)

favorites (User Quick Access)
  ├── id (PK: UUID)
  ├── user_id (FK → users.id) CASCADE
  ├── product_id (FK → products.id) CASCADE
  ├── position (for ordering)
  └── UNIQUE(user_id, product_id)

members (CRM - Customers)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── name, phone, email
  ├── points, total_spent
  └── tier (new/regular/loyal/vip)

activity_logs (Audit Trail)
  ├── id (PK: UUID)
  ├── tenant_id (FK → tenants.id) CASCADE
  ├── user_id (FK → users.id) SET NULL
  ├── action, entity_type, entity_id
  └── description, metadata

outlet_settings (NEW - Config per Outlet)
  ├── id (PK: UUID)
  ├── outlet_id (FK → outlets.id) CASCADE UNIQUE
  ├── settings_json (JSONB)
  └── updated_at

analytics_cache (NEW - Performance)
  ├── id (PK: UUID)
  ├── cache_key (UNIQUE)
  ├── outlet_id (FK → outlets.id) CASCADE
  ├── data (JSONB)
  └── expires_at

token_blacklist (NEW - Security)
  ├── id (PK: UUID)
  ├── token_hash (UNIQUE)
  ├── user_id (FK → users.id) CASCADE
  └── expires_at
```

---

## 🔄 DEPLOYMENT STEPS

### Step 1: Backup Current Data (If Needed)

Via Supabase Dashboard:
```
→ Database → Backups → Create backup
```

### Step 2: Reset Database (DESTRUCTIVE)

**⚠️ WARNING: This will delete ALL data!**

Via Supabase Dashboard:
```
→ Settings → Database → Reset Database
→ Type "I understand" → Confirm
```

Wait 5-10 minutes for reset to complete.

### Step 3: Deploy Fresh Schema

Via Supabase Dashboard → SQL Editor:
```
→ New Query
→ Copy entire DEPLOY_SUPABASE_SQL.sql
→ Run
```

The script will:
1. Create all 22 tables with proper types
2. Add all primary keys
3. Add all foreign keys with CASCADE/SET NULL
4. Create 35+ performance indexes
5. Add RLS policies (if enabled)
6. Create cleanup functions

### Step 4: Deploy Initial Data

Via Supabase Dashboard → SQL Editor:
```
→ New Query
→ Copy database/initial-data-production.sql
→ Run
```

This inserts:
- 1 tenant (Xolvon Collective)
- 1 outlet (Nashty Hot Chicken Bekasi)
- 5 users (superadmin, manager, cashier, kitchen, owner)
- 10 categories
- 30+ products with proper relationships

### Step 5: Deploy Edge Functions

```bash
supabase login
supabase link --project-ref mzucfndifneytbesirkx

# Deploy all functions
supabase functions deploy auth-login
supabase functions deploy orders-api
supabase functions deploy dashboard-api
supabase functions deploy reports-api
supabase functions deploy favorites-api
supabase functions deploy analytics-api
supabase functions deploy settings-api

# Set secrets
supabase secrets set JWT_SECRET=ZaidunkMargin
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh
```

### Step 6: Create Storage Buckets

Via Supabase Dashboard → Storage:
```
Create buckets:
1. receipts (public)
2. promotions (public)
3. outlet-assets (public)
```

Set policies:
- Public read for all
- Authenticated write

---

## 🔍 VERIFICATION CHECKLIST

### Database Schema
```sql
-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should return 22+ tables
```

### Foreign Keys
```sql
-- Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Should return 30+ foreign keys
```

### Indexes
```sql
-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Should return 35+ indexes
```

### Data Population
```sql
-- Check initial data
SELECT 'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'outlets', COUNT(*) FROM outlets
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;

-- Expected:
-- tenants: 1
-- outlets: 1
-- users: 5
-- categories: 10
-- products: 30+
```

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Authentication
```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "action": "main-login",
    "username": "admin1",
    "password": "admin1"
  }'

# Expected: 200 OK with JWT token
```

### Test 2: Create Order
```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/orders-api \
  -H "Content-Type: application/json" \
  -H "x-nashty-token: <TOKEN>" \
  -d '{
    "action": "create",
    "tenantId": "<TENANT_ID>",
    "outletId": "<OUTLET_ID>",
    "userId": "<USER_ID>",
    "items": [...],
    "total": 50000
  }'

# Expected: 200 OK with order number
```

### Test 3: Dashboard KPIs
```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/dashboard-api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "kpi",
    "tenantId": "<TENANT_ID>",
    "outletId": "<OUTLET_ID>"
  }'

# Expected: 200 OK with KPI data
```

---

## 📊 SCHEMA IMPROVEMENTS FROM OLD

### Fixed Issues:
1. ✅ All UUIDs consistent (no TEXT IDs)
2. ✅ All foreign keys with proper CASCADE/SET NULL
3. ✅ All indexes optimized for query patterns
4. ✅ Added missing tables (outlet_settings, analytics_cache, token_blacklist)
5. ✅ Proper JSONB types for modifiers and settings
6. ✅ Timestamps with timezone (TIMESTAMPTZ)
7. ✅ Unique constraints on critical fields
8. ✅ Check constraints on enums
9. ✅ Default values for all fields
10. ✅ Cleanup functions for expired data

### New Features:
- Analytics caching for performance
- Token blacklist for security
- Outlet-specific settings isolation
- Activity logging for audit trail
- Favorites system for POS efficiency

---

## 🚨 CRITICAL NOTES

### Data Loss Warning
**This is a DESTRUCTIVE operation!**
- All existing data will be deleted
- Backups recommended before reset
- Test on staging first if possible

### Credentials
After reset, use these credentials:

**Superadmin:**
```
Username: admin1
Password: admin1
Email: superadmin@nashty
Password: nashty1111
```

**PIN Logins:**
```
Kasir: 8888
Owner: 9999
Superadmin: 0000
Manager: 1212
```

### Environment Variables
Update if needed:
```
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⏱️ EXPECTED TIMELINE

- Database Reset: 5-10 minutes
- Schema Deployment: 2-3 minutes
- Data Population: 1-2 minutes
- Edge Functions Deploy: 5-10 minutes
- Testing: 10-15 minutes
- **Total: ~30-40 minutes**

---

## 🎯 SUCCESS CRITERIA

- ✅ All 22 tables created
- ✅ All foreign keys working
- ✅ All indexes created
- ✅ Initial data populated
- ✅ Edge Functions deployed
- ✅ Storage buckets created
- ✅ Authentication working
- ✅ Orders can be created
- ✅ Dashboard shows data
- ✅ No console errors

---

**READY FOR DEPLOYMENT!** 🚀

**Last Updated:** 2026-06-21  
**Status:** READY FOR EXECUTION
