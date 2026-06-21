# 🔧 NASHTY OS - Manual Setup Guide

**Target**: Production Launch (June 22, 2026)  
**Duration**: ~30 minutes

---

## ✅ Pre-Deployment Checklist

Gunakan checklist ini untuk memastikan semua setup selesai **SEBELUM** launch besok.

### **Step 1: Supabase CLI Setup** (5 minutes)

#### **Install Supabase CLI** (jika belum ada)

**Via NPM:**
```bash
npm install -g supabase
```

**Via Homebrew (Mac/Linux):**
```bash
brew install supabase/tap/supabase
```

**Verify Installation:**
```bash
supabase --version
```

#### **Login to Supabase**
```bash
supabase login
```
- Browser akan terbuka untuk authentication
- Login dengan account Supabase
- Verify: `supabase projects list`

---

### **Step 2: Deploy Edge Functions** (10 minutes)

#### **Run Deployment Script:**
```bash
cd /path/to/NashtyBerubah
bash scripts/deploy-edge-functions.sh
```

Script akan deploy 7 Edge Functions:
- ✅ auth-login
- ✅ orders-api
- ✅ dashboard-api
- ✅ reports-api
- ✅ favorites-api
- ✅ analytics-api
- ✅ settings-api

#### **Set JWT Secrets** (jika belum ada)
```bash
supabase secrets set JWT_SECRET=ZaidunkMargin --project-ref mzucfndifneytbesirkx
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh --project-ref mzucfndifneytbesirkx
```

#### **Verify Deployment:**
```bash
supabase functions list --project-ref mzucfndifneytbesirkx
```

---

### **Step 3: Create Storage Buckets** (5 minutes)

⚠️ **MANUAL STEP** - Must be done via Supabase Dashboard

#### **Open Supabase Dashboard:**
```
https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage
```

#### **Create Bucket: `receipts`**
1. Click **"New Bucket"**
2. Name: `receipts`
3. Public bucket: ✅ **YES** (checked)
4. File size limit: 2 MB
5. Allowed MIME types: `image/png, image/jpeg, image/jpg`
6. Click **"Create bucket"**

#### **Create Bucket: `promotions`**
1. Click **"New Bucket"**
2. Name: `promotions`
3. Public bucket: ✅ **YES** (checked)
4. File size limit: 5 MB
5. Allowed MIME types: `image/png, image/jpeg, image/jpg, image/gif`
6. Click **"Create bucket"**

#### **Verify Buckets Created:**
```bash
curl -I https://mzucfndifneytbesirkx.supabase.co/storage/v1/bucket/receipts
curl -I https://mzucfndifneytbesirkx.supabase.co/storage/v1/bucket/promotions
```
Expected: **HTTP 200**

---

### **Step 4: Populate Initial Data** (5 minutes)

#### **Connect to Database:**

**Option A: Via Supabase SQL Editor** (Recommended)
1. Open: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/editor
2. Click **"New query"**
3. Copy entire content from: `database/initial-data-production.sql`
4. Paste into SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for completion (should see success notices)

**Option B: Via psql CLI** (if you have direct DB access)
```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[password]@db.mzucfndifneytbesirkx.supabase.co:5432/postgres" \
  -f database/initial-data-production.sql
```

#### **Verify Data Created:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  (SELECT COUNT(*) FROM users WHERE tenant_id = 'default-tenant') as users_count,
  (SELECT COUNT(*) FROM categories WHERE tenant_id = 'default-tenant') as categories_count,
  (SELECT COUNT(*) FROM products WHERE tenant_id = 'default-tenant') as products_count,
  (SELECT COUNT(*) FROM modifiers WHERE tenant_id = 'default-tenant') as modifiers_count;
```

**Expected Result:**
- users_count: 5 (admin + 4 staff)
- categories_count: 5
- products_count: 17-20
- modifiers_count: 8

---

### **Step 5: Test Complete System** (5 minutes)

#### **Run Test Script:**
```bash
bash scripts/test-production-system.sh
```

This will test:
- ✅ Cloudflare Pages accessibility
- ✅ Supabase API connectivity
- ✅ All 7 Edge Functions
- ✅ Auth login endpoint
- ✅ Database tables
- ✅ Initial data (users, products)
- ✅ Storage buckets

#### **Expected Output:**
```
════════════════════════════════════════════════════════════
📊 Test Summary
════════════════════════════════════════════════════════════
Passed: 25+
Failed: 0

✅ SYSTEM READY FOR PRODUCTION!
```

---

### **Step 6: Manual Browser Test** (5 minutes)

#### **Test 1: Login Flow**
1. Open: https://nashtyxolvon2.pages.dev
2. Login: `admin1` / `nashty1111`
3. Verify: Dashboard loads with 5 system cards
4. Expected: ✅ No errors in browser console (F12)

#### **Test 2: POS Flow**
1. Click **"POS"** card
2. Select Kasir: **Citra Dewi** (PIN: `8888`)
3. Start Shift: Set kas awal `Rp 500.000`
4. Verify: Products grid loads with 17+ items
5. Expected: ✅ Categories visible, products clickable

#### **Test 3: Add Product**
1. Click: **"Ayam Bakar Madu"**
2. Select modifier: **"Pedas Sedang"**
3. Select add-on: **"Nasi Putih"**
4. Click: **"Add to Cart"**
5. Verify: Cart shows 1 item with correct total
6. Expected: ✅ Price calculated correctly (including modifiers)

#### **Test 4: Complete Order**
1. Set Table: **T01**
2. Set Payment: **Tunai**
3. Click: **"Complete Payment"**
4. Enter cash received: `Rp 100000`
5. Verify: Receipt modal appears
6. Click: **"Print Receipt"**
7. Expected: ✅ Receipt content displays correctly

#### **Test 5: KDS Real-Time**
1. Open new tab: https://nashtyxolvon2.pages.dev/kds/frontend
2. Enter PIN: `9999` (Owner) or `1212` (Manager)
3. Verify: Test order from POS appears immediately
4. Swipe order card to right
5. Verify: Order moves to "Completed"
6. Expected: ✅ Real-time sync working

#### **Test 6: Offline Mode** (Optional but recommended)
1. In POS, open DevTools (F12)
2. Go to Network tab
3. Check: **"Offline"** (simulate no internet)
4. Create new order (same as Test 3-4)
5. Verify: Order completes successfully
6. Uncheck: **"Offline"**
7. Wait 5 seconds
8. Verify: Order syncs to server
9. Check KDS: Order should appear
10. Expected: ✅ Offline mode + sync working

---

## ✅ Final Verification Checklist

**Before going to sleep tonight, confirm:**

### **Infrastructure** ✅
- [ ] Cloudflare Pages: https://nashtyxolvon2.pages.dev (accessible)
- [ ] Supabase project: mzucfndifneytbesirkx (online)
- [ ] All 7 Edge Functions deployed and responding
- [ ] JWT secrets set (JWT_SECRET, REFRESH_TOKEN_SECRET)
- [ ] Storage buckets created (receipts, promotions)

### **Database** ✅
- [ ] Tenant created: `default-tenant`
- [ ] Outlet created: `Galaxy Mall`
- [ ] 5 users created (admin1 + 4 staff)
- [ ] 5 categories created
- [ ] 17+ products created with prices
- [ ] 8+ modifiers created and linked to products
- [ ] Outlet settings configured (receipt, tax, payment methods)

### **Testing** ✅
- [ ] Test script passed: `bash scripts/test-production-system.sh`
- [ ] Manual login successful: admin1 / nashty1111
- [ ] POS loads products correctly
- [ ] Complete order flow works (add product → pay → receipt)
- [ ] KDS receives orders real-time
- [ ] Swipe to complete works in KDS
- [ ] Offline mode tested (optional)

### **Documentation** ✅
- [ ] Print: PRODUCTION_DEPLOYMENT_PLAN.md
- [ ] Print: DAILY_OPERATIONS_GUIDE.md
- [ ] Print: QUICK_FIX_COMMANDS.md
- [ ] Bookmark: Supabase Dashboard
- [ ] Bookmark: Cloudflare Pages Dashboard

### **Hardware** ✅
- [ ] Charge all devices (kasir PC, KDS tablet)
- [ ] Check receipt printer (paper, toner, connection)
- [ ] Check internet router (stable connection)
- [ ] Prepare backup internet (mobile hotspot)

---

## 🚨 Troubleshooting

### **Problem: Edge Functions return 404**

**Solution:**
```bash
# Redeploy specific function
supabase functions deploy auth-login --project-ref mzucfndifneytbesirkx --no-verify-jwt

# Or redeploy all
bash scripts/deploy-edge-functions.sh
```

### **Problem: Login fails with "Invalid credentials"**

**Check:** User exists in database
```sql
SELECT * FROM users WHERE username = 'admin1';
```

**Fix:** Re-run initial data script
```bash
# Via Supabase SQL Editor
# Copy-paste: database/initial-data-production.sql
```

### **Problem: Products not loading**

**Check:** Products exist
```sql
SELECT COUNT(*) FROM products WHERE tenant_id = 'default-tenant' AND status = 'active';
```

**Fix:** Re-run initial data script (will not create duplicates)

### **Problem: Storage buckets not found**

**Fix:** Create manually via Dashboard
1. https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage
2. New Bucket → `receipts` (Public)
3. New Bucket → `promotions` (Public)

### **Problem: KDS not receiving orders**

**Check:** Realtime enabled in Supabase
1. Dashboard → Settings → API
2. Realtime: **Enabled**
3. Realtime tables: `orders` (checked)

**Fix:** Enable Realtime for `orders` table

---

## 📞 Emergency Contacts

### **Supabase Dashboard**
https://supabase.com/dashboard/project/mzucfndifneytbesirkx

### **Cloudflare Pages**
https://dash.cloudflare.com/pages/nashtyxolvon2

### **GitHub Repository**
https://github.com/xolvoncollective/nashtyxolvon

### **Credentials** (KEEP SECRET)
```
Super Admin:
- Username: admin1
- Password: nashty1111

Staff PINs:
- Owner: 9999
- Manager: 1212
- Kasir 1 (Citra): 8888
- Kasir 2 (Budi): 7777

Supabase:
- Project: mzucfndifneytbesirkx
- URL: https://mzucfndifneytbesirkx.supabase.co

JWT Secrets:
- JWT_SECRET: ZaidunkMargin
- REFRESH_TOKEN_SECRET: ZaidunkMarginRefresh
```

---

## 🎯 Success Criteria

**If all checkboxes above are ✅, you are ready for:**

```
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 RESTAURANT LAUNCH TOMORROW                ║
║                                                ║
║   📍 Location: Galaxy Mall, Surabaya          ║
║   🕐 Time: 12:00 PM (First customer)          ║
║   🎯 Goal: 50+ transactions on Day 1          ║
║                                                ║
║   ✅ System: PRODUCTION READY                  ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

**Last Updated**: June 21, 2026  
**Status**: Ready for Production Setup  
**Estimated Time**: 30 minutes total

**Good luck! 🔥**
