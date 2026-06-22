# 🚨 NASHTY OS - CRITICAL FIX - QUICK START

## ⚡ 3-Minute Fix Procedure

### Step 1: Backup (30 seconds)
```bash
cd database
python backup-database.py
```

### Step 2: Run Fix (2 minutes)
1. Open: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Click "New Query"
3. Copy `database/FIX_COMPLETE_SYSTEM.sql` → Paste → Run
4. Wait for: "ALL CHECKS PASSED" ✅

### Step 3: Test (30 seconds)
1. Backoffice: https://nashtyxolvon2.pages.dev
   - Username: `superadmin`
   - Password: `nashty@2024`
2. POS: https://nashtyxolvon2.pages.dev/pos
   - Outlet: Galaxy Mall
   - PIN: `1111`

---

## 🔍 What Gets Fixed

| Issue | Solution |
|-------|----------|
| ❌ FK violations | ✅ Orphan cleanup + outlet priority |
| ❌ Backoffice login fail | ✅ Correct bcrypt password |
| ❌ POS PIN wrong user | ✅ Plain text PIN + mapping fix |
| ❌ Data integrity | ✅ Validation checks added |

---

## 📋 Expected Output

```
NOTICE:  ✓ Active outlets: 3
NOTICE:  ✓ Active system_users: 4
NOTICE:  ✓ Active POS users: 6
NOTICE:  ✓ No orphaned users
NOTICE:  DATABASE FIX COMPLETE - ALL CHECKS PASSED
```

---

## 🧪 Verification Commands

```sql
-- Should return 3
SELECT COUNT(*) FROM outlets WHERE status = 'active';

-- Should return 4+
SELECT COUNT(*) FROM system_users WHERE is_active = true;

-- Should return 6+
SELECT COUNT(*) FROM users WHERE status = 'active';

-- Should return 0 (NO ORPHANS!)
SELECT COUNT(*) 
FROM users u 
LEFT JOIN outlets o ON u.outlet_id = o.id 
WHERE o.id IS NULL;
```

---

## 🔐 Login Credentials

### Backoffice
```
URL:      https://nashtyxolvon2.pages.dev
Username: superadmin
Password: nashty@2024
Outlet:   Galaxy Mall (dari dropdown)
```

### POS
```
URL:    https://nashtyxolvon2.pages.dev/pos
Outlet: Galaxy Mall Surabaya

Staff:
  PIN 1111 → Citra Kusuma
  PIN 2222 → Budi Santoso
  PIN 3333 → Ani Wijaya
```

---

## ⚠️ If Fix Fails

### Error: "duplicate key"
→ Normal! Script uses `ON CONFLICT DO UPDATE`

### Error: "relation does not exist"
→ Run schema migrations first:
```bash
supabase db reset
```

### Login still fails
→ Check:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Open Console (F12) → look for errors
3. Verify edge function `auth-login` is deployed

---

## 📚 Full Documentation

- **Detailed Guide**: `database/FIX_EXECUTION_GUIDE.md`
- **Fix Script**: `database/FIX_COMPLETE_SYSTEM.sql`
- **Memory**: `mem:deployment/critical-database-fix-2026-06-22`

---

## 🎯 Success Criteria

- [ ] Script runs without errors
- [ ] Verification queries pass
- [ ] Backoffice login works
- [ ] POS login works
- [ ] No FK violations remain

---

**Time Required**: 3 minutes  
**Complexity**: Low  
**Reversible**: Yes (via backup)  
**Risk**: Minimal (idempotent script)

🚀 **READY TO EXECUTE!**
