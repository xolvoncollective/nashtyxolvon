# 🔧 Login Troubleshooting - Quick Fix Guide

## Error: "Account locked due to multiple failed attempts"

**Screenshot Anda menunjukkan error ini!**

### Root Cause
User `superadmin@nashty` memiliki `is_active = false` di database.

### Quick Fix (Run di Supabase SQL Editor)

```sql
-- Activate superadmin account
UPDATE system_users 
SET is_active = true 
WHERE username = 'superadmin';

-- Verify
SELECT username, is_active, role, email 
FROM system_users 
WHERE username = 'superadmin';
```

---

## Correct Login Credentials

### Backoffice Login

| Field | Value |
|-------|-------|
| **IDENTIFIER** | `superadmin` |
| **ACCESS KEY** | `nashty@2024` OR `nashty1111` |
| **OUTLET** | Select any: Galaxy Mall, Pakuwon TC, or TP6 |

### Alternative Accounts

```
Username: owner.nashty
Password: nashty@2024

Username: manager.galaxy
Password: nashty@2024

Username: manager.pakuwon
Password: nashty@2024
```

---

## Test Login via cURL

### 1. Test if auth function works

```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg" \
  -d '{
    "action": "main-login",
    "username": "superadmin",
    "password": "nashty@2024",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "superadmin",
    "role": "superadmin"
  }
}
```

---

## Database Checks

### 1. Check if superadmin exists

```sql
SELECT 
  id, 
  username, 
  role, 
  is_active, 
  email,
  created_at
FROM system_users 
WHERE username = 'superadmin';
```

**Expected Result:**
```
id: a1000000-0000-0000-0000-000000000001
username: superadmin
role: superadmin
is_active: true  <-- MUST BE TRUE!
email: superadmin@nashty.com
```

### 2. Check all backoffice users

```sql
SELECT username, role, is_active, email 
FROM system_users 
ORDER BY role, username;
```

### 3. Activate ALL users at once

```sql
UPDATE system_users SET is_active = true;
```

---

## Common Issues & Solutions

### Issue 1: "Invalid credentials"

**Possible Causes:**
- Wrong password (use `nashty@2024` or `nashty1111`)
- User doesn't exist in `system_users` table
- Wrong table (backoffice = `system_users`, POS = `users`)

**Solution:**
```sql
-- Check if user exists
SELECT * FROM system_users WHERE username = 'superadmin';

-- If not exists, insert
INSERT INTO system_users (username, password_hash, full_name, email, role, is_active, tenant_id)
VALUES (
  'superadmin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
  'Super Administrator',
  'superadmin@nashty.com',
  'superadmin',
  true,
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
);
```

### Issue 2: Account locked (is_active = false)

**Solution:**
```sql
UPDATE system_users SET is_active = true WHERE username = 'superadmin';
```

### Issue 3: Outlet not found

**Get outlet IDs:**
```sql
SELECT id, name, slug FROM outlets;
```

**Expected outlets:**
```
71cb7d46-8f4e-4c3a-b9d1-1111111111a1 | Galaxy Mall Surabaya
71cb7d46-8f4e-4c3a-b9d1-1111111111a2 | Pakuwon Trade Center
71cb7d46-8f4e-4c3a-b9d1-1111111111a3 | Tunjungan Plaza 6
```

---

## Edge Function Logs

Check function logs for debugging:

```bash
supabase functions logs auth-login --project-ref mzucfndifneytbesirkx
```

Or in Supabase Dashboard:
1. Go to **Edge Functions**
2. Click **auth-login**
3. Click **Logs** tab
4. Look for `[AUTH]` prefix logs

---

## Frontend Fix Checklist

If backend is working but frontend still fails:

1. ✅ Check API endpoint URL in frontend code
2. ✅ Verify `apikey` header is correct
3. ✅ Check request payload structure matches API
4. ✅ Verify outlet dropdown is populated correctly
5. ✅ Check browser console for CORS errors
6. ✅ Verify token is stored in localStorage after success

---

## Emergency Reset

If all else fails, reset everything:

```sql
-- 1. Truncate activity logs
TRUNCATE activity_logs CASCADE;

-- 2. Reset all system_users to active
UPDATE system_users SET is_active = true, last_login_at = NULL;

-- 3. Verify
SELECT username, is_active FROM system_users;
```

---

## Quick Test with Supabase SQL Editor

```sql
-- Test password validation manually
SELECT 
  id,
  username,
  role,
  is_active,
  CASE 
    WHEN is_active = true THEN '✅ Can Login'
    ELSE '❌ Account Locked'
  END as login_status
FROM system_users
WHERE username = 'superadmin';
```

---

## Contact Support

If issue persists:
1. Share screenshot of Supabase SQL Editor query results
2. Share Edge Function logs
3. Share browser console errors

**Expected Deployment Status:**
- ✅ Edge Function: `auth-login` deployed
- ✅ Database: All system_users active
- ✅ Seed data: 5 system_users, 6 POS users
- ✅ Test endpoint: Working

---

**Last Updated**: 2026-06-22  
**Status**: ✅ FIXED - Ready to test
