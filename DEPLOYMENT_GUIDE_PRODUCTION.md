# 🚀 DEPLOYMENT GUIDE - PRODUCTION

**Target:**
- ✅ GitHub: xolvoncollective/nashtyxolvon
- ✅ Cloudflare Pages: nashtyxolvon2.pages.dev
- ✅ Supabase: mzucfndifneytbesirkx.supabase.co

**Date:** 22 Juni 2026  
**Status:** READY TO DEPLOY

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [x] All code committed to GitHub
- [x] Database migration prepared
- [x] Backend APIs tested locally
- [x] Frontend built and optimized
- [x] Environment variables documented
- [x] Default accounts prepared
- [ ] Database migration executed
- [ ] Backend deployed
- [ ] Frontend auto-deployed via Cloudflare
- [ ] End-to-end testing

---

## 🗄️ STEP 1: DEPLOY DATABASE MIGRATION

### Option A: Supabase SQL Editor (Recommended)

1. **Login ke Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   Project: mzucfndifneytbesirkx
   ```

2. **Buka SQL Editor**
   ```
   Navigation: SQL Editor → New Query
   ```

3. **Copy & Paste Migration**
   ```
   Copy dari: database/migrations/user_management_production.sql
   Paste ke SQL Editor
   ```

4. **Execute Migration**
   ```
   Klik: Run
   Wait for: Success message
   Verify: 4 tables created
   ```

5. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('system_users', 'user_system_access', 'user_outlet_access', 'user_sessions');
   ```

6. **Verify Default Accounts**
   ```sql
   SELECT username, role, is_active 
   FROM system_users 
   ORDER BY created_at;
   ```

   Expected Output:
   ```
   superadmin@nashty | superadmin | true
   admin1            | admin      | true
   admin2            | admin      | true
   admin3            | admin      | true
   admin4            | admin      | true
   ```

### Option B: Supabase CLI (Alternative)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref mzucfndifneytbesirkx

# Run migration
supabase db push database/migrations/user_management_production.sql
```

---

## 🌐 STEP 2: VERIFY CLOUDFLARE PAGES DEPLOYMENT

Cloudflare Pages otomatis deploy dari GitHub push.

### 2.1 Check Deployment Status

1. **Login Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Go to Pages**
   ```
   Navigation: Pages → nashtyxolvon2
   ```

3. **Check Latest Deployment**
   ```
   Status: Should show "Success"
   Commit: 9273c26 (latest)
   Branch: main
   ```

### 2.2 Verify Deployment

1. **Test Frontend URLs**
   ```
   https://nashtyxolvon2.pages.dev
   https://nashtyxolvon2.pages.dev/pos/
   https://nashtyxolvon2.pages.dev/kds/
   https://nashtyxolvon2.pages.dev/backoffice/
   https://nashtyxolvon2.pages.dev/crm/
   https://nashtyxolvon2.pages.dev/cost/
   ```

2. **Check New Files Deployed**
   ```
   https://nashtyxolvon2.pages.dev/shared/auth-v2.js
   https://nashtyxolvon2.pages.dev/backoffice/frontend/pages/user-management.html
   ```

---

## 🔧 STEP 3: DEPLOY BACKEND (Optional - if using separate backend)

### If using Railway/Render/Vercel:

1. **Update Environment Variables**
   ```env
   SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=ZaidunkMargin
   NODE_ENV=production
   CORS_ORIGIN=https://nashtyxolvon2.pages.dev
   ```

2. **Deploy Backend**
   ```bash
   # Railway
   railway up
   
   # atau Render
   git push render main
   
   # atau Vercel
   vercel --prod
   ```

3. **Update API URLs di Frontend**
   ```javascript
   // api-client.js
   const API_BASE_URL = 'https://your-backend-url.railway.app';
   ```

### If using Supabase Edge Functions:

1. **Deploy Auth Function**
   ```bash
   supabase functions deploy auth
   supabase functions deploy users
   ```

2. **Update Frontend API URLs**
   ```javascript
   const API_BASE_URL = 'https://mzucfndifneytbesirkx.supabase.co/functions/v1';
   ```

---

## ✅ STEP 4: POST-DEPLOYMENT TESTING

### 4.1 Test Authentication

1. **Open Production URL**
   ```
   https://nashtyxolvon2.pages.dev
   ```

2. **Test Superadmin Login**
   ```
   Username: superadmin@nashty
   Password: nashty1111
   Expected: Login success, redirect to dashboard
   ```

3. **Test Admin Login**
   ```
   Username: admin1
   Password: admin1
   Expected: Login success, access to POS + Backoffice only
   ```

### 4.2 Test User Management

1. **Login as Superadmin**
   ```
   https://nashtyxolvon2.pages.dev
   Login: superadmin@nashty / nashty1111
   ```

2. **Access User Management**
   ```
   Navigate: Backoffice → User Management
   atau direct: /backoffice/frontend/pages/user-management.html
   ```

3. **Test CRUD Operations**
   ```
   ✅ List users (should show 5 default accounts)
   ✅ Add new user
   ✅ Edit user (change system access)
   ✅ Disable user
   ✅ Re-enable user
   ```

### 4.3 Test System Access Control

1. **Login as admin1**
   ```
   Username: admin1
   Password: admin1
   ```

2. **Test Access**
   ```
   ✅ Can access POS
   ✅ Can access Backoffice
   ❌ Cannot access KDS (should be denied)
   ❌ Cannot access CRM (should be denied)
   ❌ Cannot access Cost (should be denied)
   ```

3. **Update Access as Superadmin**
   ```
   1. Login as superadmin@nashty
   2. Go to User Management
   3. Edit admin1
   4. Enable KDS access
   5. Save
   ```

4. **Verify Updated Access**
   ```
   1. Logout
   2. Login as admin1
   3. Now should be able to access KDS
   ```

### 4.4 Test Session Management

1. **Login and Refresh**
   ```
   1. Login with any account
   2. Refresh page (F5)
   Expected: Still logged in (session persists)
   ```

2. **Test Session Expiry**
   ```
   1. Login
   2. Wait 12 hours
   3. Try to access page
   Expected: Auto-redirect to login
   ```

3. **Test Multi-Tab**
   ```
   1. Login di tab 1
   2. Open tab 2 dengan same URL
   Expected: Tab 2 auto-authenticated
   ```

4. **Test Logout Broadcast**
   ```
   1. Login di 2 tabs
   2. Logout di tab 1
   Expected: Tab 2 also logged out
   ```

---

## 🔍 STEP 5: VERIFY SECURITY FIXES

### 5.1 Check Console (Chrome DevTools)

```
✅ No "session token invalid" errors
✅ No authentication errors spam
✅ No unnecessary auth logs
✅ Clean console output
```

### 5.2 Check Network Tab

```
✅ No redundant auth requests
✅ Token sent in Authorization header
✅ API calls return 200 OK
✅ No CORS errors
```

### 5.3 Check Local Storage

```
✅ nashty_auth key exists
✅ Contains token, user, allowedSystems
✅ Timestamp within 12 hours
✅ No sensitive data exposed
```

---

## 🐛 TROUBLESHOOTING

### Issue: Migration fails dengan "relation already exists"

**Solution:**
```sql
-- Drop existing tables jika ada konflik
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_outlet_access CASCADE;
DROP TABLE IF EXISTS user_system_access CASCADE;
DROP TABLE IF EXISTS system_users CASCADE;

-- Then run migration again
```

### Issue: Cannot login dengan default accounts

**Solution 1: Check password hash**
```sql
SELECT username, substring(password_hash, 1, 10) 
FROM system_users;
```

**Solution 2: Reset password manual**
```sql
-- Generate new hash di Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('nashty1111', 10);

UPDATE system_users 
SET password_hash = '$2a$10$...' -- paste hash here
WHERE username = 'superadmin@nashty';
```

### Issue: User cannot access system meskipun granted

**Solution: Check system_access table**
```sql
SELECT u.username, usa.system_name, usa.has_access
FROM system_users u
LEFT JOIN user_system_access usa ON u.id = usa.user_id
WHERE u.username = 'admin1';
```

**Fix: Grant access manual**
```sql
INSERT INTO user_system_access (user_id, system_name, has_access)
SELECT id, 'pos', true
FROM system_users
WHERE username = 'admin1'
ON CONFLICT (user_id, system_name) DO UPDATE SET has_access = true;
```

### Issue: RLS policies blocking access

**Solution: Verify policies**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('system_users', 'user_system_access');
```

**Fix: Temporarily disable RLS untuk testing**
```sql
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_access DISABLE ROW LEVEL SECURITY;

-- Test access, then re-enable:
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_access ENABLE ROW LEVEL SECURITY;
```

---

## 📊 DEPLOYMENT VERIFICATION CHECKLIST

### Database
- [ ] 4 new tables created
- [ ] 5 default accounts inserted
- [ ] System access granted correctly
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Can query tables dari SQL Editor

### Backend
- [ ] Auth API endpoints working
- [ ] User management API working
- [ ] JWT token generation correct
- [ ] Password hashing correct
- [ ] Session tracking working
- [ ] CORS configured correctly

### Frontend
- [ ] Cloudflare Pages deployed
- [ ] New files accessible
- [ ] auth-v2.js loaded
- [ ] User management page loads
- [ ] Console clean (no errors)
- [ ] Login flow working

### Integration
- [ ] Login with superadmin works
- [ ] Login with admin1 works
- [ ] System access control working
- [ ] User management CRUD working
- [ ] Session persistence working
- [ ] Multi-tab sync working

### Security
- [ ] No console errors for auth
- [ ] No double login prompts
- [ ] No unnecessary popups
- [ ] Password hashed (bcrypt)
- [ ] JWT signed correctly
- [ ] RLS protecting data

---

## 🎉 SUCCESS CRITERIA

Deployment dianggap sukses jika:

✅ **Database**
- Migration executed tanpa error
- 5 default accounts exist dan bisa login

✅ **Frontend**
- Cloudflare Pages deployed (commit terbaru)
- Login page loads tanpa error
- User Management page accessible

✅ **Authentication**
- superadmin@nashty bisa login
- admin1-4 bisa login
- Session persists after refresh
- Logout works correctly

✅ **User Management**
- Superadmin bisa list users
- Superadmin bisa add/edit/disable users
- System access control working
- Changes reflected immediately

✅ **Security**
- Console clean (no auth errors)
- No double login issues
- No unnecessary popups
- Passwords protected (hashed)

---

## 📞 SUPPORT

Jika ada issue saat deployment:

1. **Check Supabase Logs**
   ```
   Dashboard → Logs → Database
   ```

2. **Check Cloudflare Logs**
   ```
   Pages → nashtyxolvon2 → Logs
   ```

3. **Check Browser Console**
   ```
   F12 → Console tab
   Look for errors
   ```

4. **Check Network Tab**
   ```
   F12 → Network tab
   Filter: Fetch/XHR
   Check API responses
   ```

---

**Ready to deploy! 🚀**

Execute steps 1-5 in order untuk successful deployment.

