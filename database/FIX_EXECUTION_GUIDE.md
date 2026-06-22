# NASHTY OS - System Fix Execution Guide

## Critical Issues Identified

### 1. FK Constraint Violations
- **Problem**: Users with invalid `outlet_id` (outlet tidak exist)
- **Impact**: Cannot create users, login fails, queries error
- **Root Cause**: Data inserted before outlets existed

### 2. Backoffice Login Failure
- **Problem**: Cannot login with superadmin credentials
- **Impact**: No access to backoffice
- **Root Cause**: Password mismatch or missing system_users

### 3. POS Login Issues
- **Problem**: PIN login fails or selects wrong user
- **Impact**: Cannot use POS system
- **Root Cause**: PIN stored as bcrypt hash instead of plain text

### 4. Data Integrity
- **Problem**: Orphaned records breaking queries
- **Impact**: Performance degradation, error responses
- **Root Cause**: Improper delete cascade handling

## Solution Overview

The `FIX_COMPLETE_SYSTEM.sql` script performs:

1. **Data Cleanup** - Removes all orphaned records
2. **Master Data Fix** - Ensures outlets exist before users
3. **Authentication Fix** - Corrects password and PIN storage
4. **Integrity Validation** - Verifies all FK relationships
5. **Verification** - Checks all critical data

## Execution Instructions

### Step 1: Backup Current Database (MANDATORY)

```bash
# Using backup script
cd database
python backup-database.py
```

Or manually via Supabase Dashboard:
1. Go to Project Settings → Database
2. Click "Backup Now"
3. Wait for confirmation

### Step 2: Run Fix Script

**Option A: Supabase SQL Editor (Recommended)**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire contents of `database/FIX_COMPLETE_SYSTEM.sql`
5. Paste into editor
6. Click "Run"
7. Wait for completion (2-3 minutes)
8. Check output for "ALL CHECKS PASSED"

**Option B: Supabase CLI**
```bash
supabase db reset --db-url "your-connection-string"
psql "your-connection-string" < database/FIX_COMPLETE_SYSTEM.sql
```

### Step 3: Verify Fix

Run these verification queries in SQL Editor:

```sql
-- Check outlets
SELECT COUNT(*) as outlet_count FROM outlets WHERE status = 'active';
-- Should return: 3

-- Check system_users
SELECT COUNT(*) as user_count FROM system_users WHERE is_active = true;
-- Should return: 4 or more

-- Check POS users
SELECT COUNT(*) as pos_count FROM users WHERE status = 'active';
-- Should return: 6 or more

-- Check for orphans (should be 0)
SELECT COUNT(*) as orphaned
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
WHERE o.id IS NULL;
-- Should return: 0

-- Verify PINs are plain text
SELECT name, pin, LENGTH(pin) as pin_length FROM users LIMIT 3;
-- pin_length should be 4, not 60
```

### Step 4: Test Login Flows

**A. Test Backoffice Login**
1. Open: https://nashtyxolvon2.pages.dev
2. Click "Backoffice" atau "Admin"
3. Username: `superadmin`
4. Password: `nashty@2024`
5. Select outlet: Galaxy Mall
6. Should redirect to dashboard

**B. Test POS Login**
1. Open: https://nashtyxolvon2.pages.dev/pos
2. Select outlet: Galaxy Mall Surabaya
3. Enter PIN: `1111`
4. Should show: "Citra Kusuma"
5. Click "Login"
6. Should load POS interface

### Step 5: Test Edge Functions

Run test script:
```bash
cd scripts
node test-full-system.js
```

Expected: 24/26 tests pass (92%)

## What The Script Does

### Phase 1: Cleanup (Lines 18-36)
```sql
-- Deletes orphaned users
DELETE FROM users WHERE outlet_id NOT IN (SELECT id FROM outlets);

-- Deletes orphaned orders
DELETE FROM orders WHERE outlet_id NOT IN (SELECT id FROM outlets);

-- Cleans up access mappings
DELETE FROM user_system_access WHERE user_id NOT IN (SELECT id FROM system_users);
```

### Phase 2: Master Data (Lines 41-112)
```sql
-- Ensures tenant exists
INSERT INTO tenants (...) ON CONFLICT (id) DO UPDATE ...

-- Ensures 3 outlets exist
INSERT INTO outlets (Galaxy, Pakuwon, TP6) ON CONFLICT (id) DO UPDATE ...
```

### Phase 3: Auth Fix (Lines 117-226)
```sql
-- Fixes system_users with bcrypt password
INSERT INTO system_users (
  username: 'superadmin',
  password_hash: '$2b$10$...',  -- bcrypt("nashty@2024")
  ...
) ON CONFLICT (username) DO UPDATE ...

-- Fixes POS users with plain PIN
INSERT INTO users (
  name: 'Citra Kusuma',
  pin: '1111',  -- PLAIN TEXT, not bcrypt!
  outlet_id: '71cb7d46-...'  -- Valid outlet
) ON CONFLICT (id) DO UPDATE ...
```

### Phase 4: Access Mappings (Lines 231-267)
```sql
-- Maps users to systems (pos, kds, backoffice, etc.)
INSERT INTO user_system_access ...

-- Maps users to outlets
INSERT INTO user_outlet_access ...
```

### Phase 5: Validation (Lines 272-334)
```sql
-- Verifies data integrity
-- Counts outlets, users, orphans
-- Raises exceptions if critical issues found
-- Displays success message
```

## Expected Output

When script completes successfully:
```
NOTICE:  Deleting 0 orphaned users...
NOTICE:  ✓ Active outlets: 3
NOTICE:  ✓ Active system_users: 4
NOTICE:  ✓ Active POS users: 6
NOTICE:  ✓ No orphaned users
NOTICE:  ✓ No orphaned orders
NOTICE:  
NOTICE:  ================================================
NOTICE:  DATABASE FIX COMPLETE - ALL CHECKS PASSED
NOTICE:  ================================================

==================== LOGIN CREDENTIALS ====================

=== BACKOFFICE LOGIN (Username/Password) ===
URL: https://nashtyxolvon2.pages.dev
Username: superadmin
Password: nashty@2024 (or nashty1111)
Outlet: Select from dropdown (Galaxy Mall, Pakuwon TC, or TP6)

=== POS LOGIN (PIN-based) ===
URL: https://nashtyxolvon2.pages.dev/pos

Galaxy Mall Surabaya:
  • PIN 1111 - Citra Kusuma (Cashier)
  • PIN 2222 - Budi Santoso (Cashier)
  • PIN 3333 - Ani Wijaya (Cashier)

Pakuwon Trade Center:
  • PIN 4444 - Dina Permata (Cashier)
  • PIN 5555 - Eko Prasetyo (Cashier)

Tunjungan Plaza 6:
  • PIN 6666 - Fitri Wulandari (Cashier)

============================================================
```

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution**: Some data already exists, script will UPDATE instead of INSERT

### Error: "relation does not exist"
**Solution**: Run schema migrations first:
```bash
supabase db reset
```

### Error: "password authentication failed"
**Solution**: Check Supabase connection string and credentials

### Login still fails after fix
**Check**:
1. Edge function `auth-login` is deployed
2. JWT_SECRET environment variable is set
3. Browser cache cleared (Ctrl+Shift+Delete)
4. Check browser console for errors (F12)

### POS shows wrong user
**Check**:
1. PIN is 4 digits (not bcrypt hash)
2. Outlet ID matches selection
3. User status is 'active'

## Post-Fix Verification Checklist

- [ ] Script executed without errors
- [ ] 3 outlets exist and active
- [ ] 4+ system_users exist and active
- [ ] 6+ POS users exist and active
- [ ] 0 orphaned users
- [ ] 0 orphaned orders
- [ ] Backoffice login works
- [ ] POS login works
- [ ] All edge functions respond
- [ ] Test script shows 92%+ pass rate

## Contact Support

If issues persist after fix:
1. Export error logs from Supabase (Database → Logs)
2. Export Edge Function logs (Functions → Select function → Logs)
3. Export browser console errors (F12 → Console → Save)
4. Share with development team

## Rollback Plan

If fix causes issues:
```sql
-- Restore from backup
RESTORE DATABASE FROM BACKUP 'backup-name';
```

Or via Supabase Dashboard:
1. Go to Project Settings → Database
2. Click "Backups"
3. Select most recent backup
4. Click "Restore"
