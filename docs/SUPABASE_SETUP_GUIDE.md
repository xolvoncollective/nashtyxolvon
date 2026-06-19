# Supabase Setup Guide - Nashty POS

**Created:** 2026-06-18  
**Project:** mzucfndifneytbesirkx  
**Status:** Configuration Complete, Migration Pending

---

## Overview

Dokumen ini menjelaskan cara mengkoneksikan Nashty POS dengan Supabase PostgreSQL database untuk production deployment.

---

## 1. Configuration Complete ✅

### Environment Variables (.env)

File `.env` sudah dikonfigurasi dengan kredensial Supabase:

```env
# Supabase Configuration
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection
SUPABASE_DB_HOST=db.mzucfndifneytbesirkx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.mzucfndifneytbesirkx
SUPABASE_DB_PASSWORD=ZaidunkMargin
```

### Supabase Client

Client sudah diinisialisasi di:
- `backoffice/backend/src/supabase/supabase-client.ts`

Tersedia 2 clients:
- `supabase` - Public client (untuk frontend operations)
- `supabaseAdmin` - Admin client (untuk backend operations dengan elevated permissions)

---

## 2. Migration Files Ready ✅

### SQL Migration File

Location: `Production-Ready/Database/supabase-migration.sql`

**Contents:**
- 20+ table definitions dengan PostgreSQL types
- Enum types untuk order status, payment methods, roles
- Row Level Security (RLS) policies
- Indexes untuk performance
- Triggers untuk auto-update timestamps
- Demo data (tenant, outlet, users)
- Helper functions (order number generation)

### Migration Scripts

Created 2 helper scripts:

1. **migrate-supabase.ts** - Automated migration runner
   ```bash
   npm run supabase:migrate
   ```

2. **test-supabase.ts** - Connection tester
   ```bash
   npm run supabase:test
   ```

---

## 3. Manual Migration Steps (RECOMMENDED)

Karena direct connection mengalami DNS issue, gunakan Supabase Dashboard:

### Step 1: Access SQL Editor

1. Buka: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
2. Sidebar: Click **SQL Editor**
3. Click **+ New Query**

### Step 2: Run Migration

1. Copy seluruh isi file: `Production-Ready/Database/supabase-migration.sql`
2. Paste ke SQL Editor
3. Click **Run** (atau tekan Ctrl+Enter)
4. Tunggu hingga selesai (~30-60 detik)

### Step 3: Verify Tables

Setelah migration sukses, verify di Table Editor:

**Expected Tables:**
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

### Step 4: Verify Demo Data

Run query di SQL Editor:

```sql
-- Check tenants
SELECT * FROM tenants;

-- Check outlets
SELECT * FROM outlets;

-- Check users
SELECT * FROM users;
```

**Expected Results:**
- 1 tenant: "Demo Tenant"
- 1 outlet: "Demo Outlet"
- 4 users: Citra Dewi, Budi Santoso, Ani Kitchen, Admin Demo

---

## 4. Connection Troubleshooting

### Issue: DNS Resolution Failed

```
Error: getaddrinfo ENOTFOUND db.mzucfndifneytbesirkx.supabase.co
```

**Possible Causes:**
1. Supabase project paused (free tier auto-pauses after inactivity)
2. Network/Firewall blocking connection
3. DNS propagation delay

**Solutions:**

#### A. Check Project Status
1. Go to Supabase Dashboard
2. Check if project shows "Paused"
3. If paused, click **Resume** button
4. Wait 2-3 minutes for project to fully start

#### B. Use Connection Pooler (For Serverless)

Update `.env`:
```env
# Use pooler instead of direct connection
SUPABASE_DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_DB_USER=postgres.mzucfndifneytbesirkx
```

#### C. Verify from Dashboard

Test connection directly from Supabase Dashboard:
1. Go to **Database** → **Connect**
2. Copy connection string
3. Test dengan `psql` or your preferred client

---

## 5. Switching from SQLite to PostgreSQL

### Current Mode: SQLite (Development)

```env
DATABASE_MODE=sqlite
```

### Switch to PostgreSQL (Production)

```env
DATABASE_MODE=postgres
NODE_ENV=production
```

### Code Changes Needed

Update `backoffice/backend/src/db/database.ts` to support both modes:

```typescript
import Database from 'better-sqlite3';
import { supabaseAdmin } from '../supabase/supabase-client';

const mode = process.env.DATABASE_MODE || 'sqlite';

export function getDatabase() {
  if (mode === 'postgres') {
    return supabaseAdmin; // Use Supabase
  } else {
    return new Database('./data/nashtypos.db'); // Use SQLite
  }
}
```

---

## 6. Testing Connection

### After Migration Succeeds

Run test script:

```bash
cd backoffice/backend
npm run supabase:test
```

**Expected Output:**
```
✅ Supabase client connected
✅ Found 1 tenants
✅ Table 'tenants': 1 rows
✅ Table 'outlets': 1 rows
✅ Table 'users': 4 rows
✅ All tests passed! Supabase is ready to use.
```

### Manual Test

```typescript
import { supabase } from './src/supabase/supabase-client';

// Test query
const { data, error } = await supabase
  .from('tenants')
  .select('*');

console.log(data); // Should show "Demo Tenant"
```

---

## 7. Next Steps After Migration

### 1. Update Backend to Use Supabase

Modify service files to use Supabase instead of SQLite:

**Files to Update:**
- `src/services/OrderService.ts`
- `src/services/FinancialCalculationService.ts`
- `src/services/ProductService.ts`
- `src/services/UserService.ts`
- etc.

**Pattern:**
```typescript
// Old (SQLite)
import { query, get } from '../db/database';
const users = query('SELECT * FROM users');

// New (Supabase)
import { supabase } from '../supabase/supabase-client';
const { data: users } = await supabase.from('users').select('*');
```

### 2. Enable RLS Policies

Configure Row Level Security for multi-tenant isolation:

```sql
-- Example: Users can only see their own tenant
CREATE POLICY tenant_isolation_orders ON orders
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### 3. Setup Realtime Subscriptions

Enable realtime for KDS:

```typescript
const subscription = supabase
  .channel('orders-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload);
      updateKDSDisplay();
    }
  )
  .subscribe();
```

### 4. Optimize Queries

- Use `select('count')` instead of `count(*)`
- Add proper indexes for frequent queries
- Use connection pooling for high traffic

### 5. Backup Strategy

Setup automated backups:
1. Supabase Dashboard → **Database** → **Backups**
2. Enable Point-in-Time Recovery (PITR)
3. Schedule daily backups

---

## 8. Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Environment Variables | ✅ Configured | All Supabase credentials set |
| Supabase Client | ✅ Ready | TypeScript client initialized |
| Migration File | ✅ Ready | Complete SQL schema prepared |
| Migration Scripts | ✅ Created | Automated + manual options |
| Database Tables | ⏸️ Pending | Need to run migration |
| Backend Integration | ⏸️ Pending | Need to update service files |
| RLS Policies | ⏸️ Pending | Basic policies exist, need tuning |
| Realtime | ⏸️ Pending | Need to enable for KDS |

---

## 9. Quick Reference

### Credentials

```
Project: mzucfndifneytbesirkx
URL: https://mzucfndifneytbesirkx.supabase.co
Dashboard: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
```

### Connection Strings

**Direct (for local dev):**
```
postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@db.mzucfndifneytbesirkx.supabase.co:5432/postgres
```

**Pooler (for serverless/production):**
```
postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### API Endpoints

```
REST: https://mzucfndifneytbesirkx.supabase.co/rest/v1/
Auth: https://mzucfndifneytbesirkx.supabase.co/auth/v1/
Realtime: wss://mzucfndifneytbesirkx.supabase.co/realtime/v1/
```

---

## 10. Troubleshooting Checklist

- [ ] Supabase project is active (not paused)
- [ ] `.env` file has correct credentials
- [ ] Migration has been run successfully
- [ ] Tables visible in Table Editor
- [ ] Demo data exists (1 tenant, 1 outlet, 4 users)
- [ ] Connection test passes
- [ ] No firewall blocking port 5432/6543
- [ ] JWT secret matches between .env and Supabase

---

## Support

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Postgres Docs: https://www.postgresql.org/docs/

**Nashty Team:**
- Repository: https://github.com/zaidunk/nashtyfinal
- Specs: `.kiro/specs/`

---

*Last Updated: 2026-06-18*
*Status: Configuration Complete, Ready for Migration*
