# NASHTY OS - Production Troubleshooting Guide

## 🔴 Critical Issues Fixed

### Issue 1: FK Constraint Violation (outlet_id)
**Symptom**: `Foreign key constraint violation` saat insert data ke tabel `users` atau `orders`

**Root Cause**: Data users/orders mereferensi outlet_id yang tidak ada di tabel `outlets`

**Fix Applied**:
1. Clean up orphaned records (users dan orders dengan invalid outlet_id)
2. Ensure outlets exist terlebih dahulu sebelum create users
3. Add proper validation di application layer

**Prevention**:
```sql
-- Always verify outlet exists before creating user
SELECT id FROM outlets WHERE id = :outlet_id AND status = 'active';
```

---

### Issue 2: Login Backoffice Gagal
**Symptom**: Tidak bisa login dengan username/password di backoffice

**Root Cause**: 
- Password di database menggunakan bcrypt hash
- Edge function tidak melakukan bcrypt comparison
- Data system_users tidak konsisten

**Fix Applied**:
1. Standardize password: `nashty@2024` → bcrypt hash `$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq`
2. Update edge function untuk accept plain text password (development) + bcrypt (production)
3. Ensure semua system_users punya hash yang sama untuk testing

**Test**:
```bash
curl -X POST https://[project].supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "action": "main-login",
    "username": "superadmin",
    "password": "nashty@2024",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

---

### Issue 3: POS Login dengan PIN Gagal
**Symptom**: PIN tidak diterima atau wrong outlet error

**Root Cause**:
- POS users (tabel `users`) menggunakan PLAIN TEXT PIN, bukan bcrypt
- Edge function mungkin salah compare (hash vs plain)
- outlet_id mismatch antara user dan outlet selection

**Fix Applied**:
1. Ensure PIN di tabel `users` adalah PLAIN TEXT (`1111`, `2222`, dll)
2. Edge function compare PIN secara direct (no hashing): `pin === user.pin`
3. Validate outlet_id match antara user dan selected outlet

**Data Structure**:
```
users table:
- pin: '1111' (PLAIN TEXT, not hashed)
- outlet_id: must match selected outlet
- status: 'active'

system_users table:
- password_hash: bcrypt hash (for backoffice)
```

---

### Issue 4: Petty Cash Error
**Symptom**: Unknown error saat input petty cash

**Root Cause**: (To be investigated)
- Possible FK constraint ke outlet_id atau user_id
- Possible validation error di API route
- Possible database trigger issue

**Investigation Steps**:
1. Check Edge Function logs:
```bash
supabase functions logs petty-cash --project-ref [your-project-ref]
```

2. Check database constraints:
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'petty_cash';
```

3. Test API endpoint:
```bash
curl -X POST https://[project].supabase.co/functions/v1/petty-cash \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "outlet_id": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1",
    "category": "office_supplies",
    "amount": 50000,
    "description": "Test petty cash",
    "date": "2024-01-15"
  }'
```

---

## 🛠️ Database Fix Script

**File**: `database/PRODUCTION_STABILIZATION_FIX.sql`

**How to Run**:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy-paste script content
4. Click "Run"
5. Wait ~2-3 minutes for completion
6. Check output for any errors

**What It Does**:
1. ✅ Clean up orphaned data (order_items, order_payments, orders, users)
2. ✅ Ensure tenant exists
3. ✅ Ensure outlets exist (Galaxy Mall, Pakuwon TC, TP6)
4. ✅ Fix system_users (backoffice) with bcrypt password
5. ✅ Fix users (POS) with plain text PIN
6. ✅ Configure user access mappings (system & outlet access)
7. ✅ Verify data integrity
8. ✅ Display login credentials

---

## 🔐 Login Credentials (After Fix)

### Backoffice Login
```
URL: https://nashtyxolvon2.pages.dev
Username: superadmin
Password: nashty@2024 (or nashty1111)
Outlet: Select from dropdown after login
```

**Other Accounts**:
- `owner.nashty` / `nashty@2024` (Owner - full access)
- `manager.galaxy` / `nashty@2024` (Manager - Galaxy Mall only)
- `manager.pakuwon` / `nashty@2024` (Manager - Pakuwon TC only)

### POS Login
```
URL: https://nashtyxolvon2.pages.dev/pos
```

**Galaxy Mall Surabaya**:
- PIN `1111` - Citra Kusuma
- PIN `2222` - Budi Santoso
- PIN `3333` - Ani Wijaya

**Pakuwon Trade Center**:
- PIN `4444` - Dina Permata
- PIN `5555` - Eko Prasetyo

**Tunjungan Plaza 6**:
- PIN `6666` - Fitri Wulandari

---

## 🔍 Debugging Commands

### Check Database State
```sql
-- Check outlets
SELECT id, name, status FROM outlets;

-- Check system_users (backoffice)
SELECT id, username, role, is_active FROM system_users;

-- Check users (POS)
SELECT id, name, pin, outlet_id, status FROM users;

-- Check orphaned users
SELECT u.id, u.name, u.outlet_id
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
WHERE o.id IS NULL;

-- Check user access mappings
SELECT u.username, usa.system_name, usa.has_access
FROM system_users u
JOIN user_system_access usa ON u.id = usa.user_id
ORDER BY u.username, usa.system_name;
```

### Test Edge Functions
```bash
# Test backoffice login
curl -X POST https://[project].supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"action":"main-login","username":"superadmin","password":"nashty@2024"}'

# Test POS login
curl -X POST https://[project].supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"action":"pin-login","pin":"1111","outletId":"71cb7d46-8f4e-4c3a-b9d1-1111111111a1"}'
```

### View Edge Function Logs
```bash
# View recent logs
supabase functions logs auth-login --tail

# View with filter
supabase functions logs auth-login | grep ERROR
```

---

## 📋 Verification Checklist

After running the fix script, verify:

- [ ] Database script executed without errors
- [ ] All outlets exist and active (3 outlets)
- [ ] All system_users exist and active (4 users minimum)
- [ ] All POS users exist and active (6 users minimum)
- [ ] No orphaned users (check with SQL above)
- [ ] No orphaned orders
- [ ] User access mappings configured
- [ ] Backoffice login works (test with superadmin)
- [ ] POS login works (test with PIN 1111)
- [ ] Outlet selection works
- [ ] No FK constraint errors in logs

---

## 🚨 If Issues Persist

### 1. Check Supabase Logs
Go to: Dashboard → Logs → Query all logs
Filter: Last 1 hour, search for "error" or "constraint"

### 2. Check Edge Function Deployment
```bash
supabase functions list
supabase functions deploy auth-login
```

### 3. Check Environment Variables
Ensure these are set in Supabase Dashboard → Settings → Edge Functions:
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Check RLS Policies
```sql
-- Temporarily disable RLS for debugging (DO NOT USE IN PRODUCTION)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;

-- Test, then re-enable
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
```

### 5. Contact Support
If all else fails, provide:
- Screenshots of error messages
- Supabase project logs (last 1 hour)
- Edge function logs
- Database query results from debugging section

---

## 📝 Notes

1. **Password vs PIN**:
   - Backoffice (`system_users`) → bcrypt hash password
   - POS (`users`) → plain text PIN

2. **Outlet Selection**:
   - Backoffice: selected from dropdown after login
   - POS: selected before PIN entry (fixed per cashier)

3. **Data Hierarchy**:
   ```
   tenant
     └─ outlets (must exist first)
          ├─ system_users (can access multiple outlets)
          └─ users (tied to specific outlet)
   ```

4. **Testing Workflow**:
   - Always test with fresh data after running fix script
   - Clear browser cache/localStorage if needed
   - Use incognito mode for clean test

---

**Last Updated**: 2024-01-15
**Script Version**: v1.0 (PRODUCTION_STABILIZATION_FIX.sql)