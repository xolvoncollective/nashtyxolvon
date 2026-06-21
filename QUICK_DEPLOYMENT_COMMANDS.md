# 🚀 Quick Deployment Commands

## Complete Deployment in 5 Steps

---

## Step 1: Verify Pre-Deployment ✅

```bash
# Run automated pre-deployment tests
bash scripts/pre-deployment-test.sh

# Run Supabase verification
bash scripts/verify-supabase-deployment.sh

# Expected: All tests PASS
```

---

## Step 2: Deploy Supabase Edge Functions 🔧

```bash
# Login to Supabase (if not already)
supabase login

# Link to project
supabase link --project-ref mzucfndifneytbesirkx

# Deploy all Edge Functions
supabase functions deploy auth-login
supabase functions deploy orders-api
supabase functions deploy dashboard-api
supabase functions deploy reports-api
supabase functions deploy favorites-api
supabase functions deploy analytics-api
supabase functions deploy settings-api

# Verify deployments
supabase functions list

# Expected output:
# ✓ auth-login (deployed)
# ✓ orders-api (deployed)
# ✓ dashboard-api (deployed)
# ✓ reports-api (deployed)
# ✓ favorites-api (deployed)
# ✓ analytics-api (deployed)
# ✓ settings-api (deployed)
```

---

## Step 3: Configure Secrets 🔐

```bash
# Set JWT secrets
supabase secrets set JWT_SECRET=ZaidunkMargin
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh

# Verify secrets
supabase secrets list

# Expected:
# JWT_SECRET (set)
# REFRESH_TOKEN_SECRET (set)
```

---

## Step 4: Setup Storage Buckets 📦

### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage/buckets

2. Click "New bucket"

3. Create `receipts` bucket:
   - Name: receipts
   - Public: ✓ Yes
   - File size limit: 2MB
   - Allowed MIME types: image/png, image/jpeg, image/svg+xml

4. Create `promotions` bucket:
   - Name: promotions
   - Public: ✓ Yes
   - File size limit: 5MB
   - Allowed MIME types: image/png, image/jpeg

### Option B: Via SQL Editor

```sql
-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/mzucfndifneytbesirkx/editor

-- Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('receipts', 'receipts', true),
  ('promotions', 'promotions', true);

-- Set policies for receipts
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

-- Set policies for promotions
CREATE POLICY "Public Read Promotions" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'promotions');

CREATE POLICY "Authenticated Upload Promotions" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'promotions' 
  AND auth.role() = 'authenticated'
);
```

---

## Step 5: Deploy Frontend to Cloudflare Pages 🌐

### Option A: Auto-Deploy (GitHub Integration)

```bash
# Push to GitHub (already done!)
git push nashtyxolvon main

# Cloudflare Pages will auto-deploy
# Monitor at: https://dash.cloudflare.com/
```

### Option B: Manual Deploy (Wrangler CLI)

```bash
# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy POS frontend
wrangler pages publish pos/frontend --project-name=nashty-pos

# Deploy Backoffice frontend
wrangler pages publish backoffice/frontend --project-name=nashty-backoffice

# Deploy CRM frontend
wrangler pages publish crm/frontend --project-name=nashty-crm

# Deploy Cost frontend
wrangler pages publish cost/frontend --project-name=nashty-cost
```

---

## Verification After Deployment ✅

### 1. Test Edge Functions

```bash
# Test auth-login
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg" \
  -d '{"test": true}'

# Expected: JSON response with success/error
```

### 2. Test Storage Access

```bash
# Test receipts bucket
curl -I https://mzucfndifneytbesirkx.supabase.co/storage/v1/bucket/receipts

# Expected: HTTP 200 OK
```

### 3. Test Frontend

```bash
# Open in browser
# POS: https://nashty-pos.pages.dev (or your custom domain)

# Check console for errors
# Verify Service Worker registers
# Test login flow
# Create test order
```

### 4. Monitor Logs

```bash
# Watch function logs
supabase functions logs --tail

# Or specific function
supabase functions logs auth-login --tail
```

---

## Quick Rollback (If Needed) 🔄

### Rollback Edge Functions

```bash
# List deployments
supabase functions list

# If needed, redeploy previous version
# (Supabase keeps history, manual selection in dashboard)
```

### Rollback Frontend

```bash
# Cloudflare Pages Dashboard
# 1. Go to project
# 2. Click "Rollbacks"
# 3. Select previous deployment
# 4. Click "Rollback"
```

---

## Common Issues & Quick Fixes 🔧

### Issue: Function 404 Not Found
```bash
# Fix: Redeploy function
supabase functions deploy <function-name>
```

### Issue: CORS Error
```bash
# Fix: Check CORS headers in function code
# Verify includes: Access-Control-Allow-Origin: *
```

### Issue: 401 Unauthorized
```bash
# Fix: Check Authorization header
# Format: Bearer <token>
# Verify JWT secrets are set
```

### Issue: Storage Upload Fails
```bash
# Fix: Check bucket exists and is public
# Verify file size and MIME type
```

---

## Post-Deployment Checklist ✅

- [ ] All 7 Edge Functions deployed
- [ ] JWT secrets configured
- [ ] Storage buckets created (receipts, promotions)
- [ ] Frontend deployed to Cloudflare Pages
- [ ] Service Worker registers (check DevTools)
- [ ] Login works
- [ ] Test order creation
- [ ] Offline mode works
- [ ] Favorites add/remove works
- [ ] Keyboard shortcuts work
- [ ] Receipt customization loads
- [ ] Customer display opens (if 2nd screen)
- [ ] Monitor logs for errors

---

## Monitoring URLs 📊

**Supabase Dashboard**:
- Main: https://supabase.com/dashboard/project/mzucfndifneytbesirkx
- Functions: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/functions
- Storage: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage
- Database: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/editor
- Logs: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/logs

**Cloudflare Dashboard**:
- Pages: https://dash.cloudflare.com/

---

## Support & Documentation 📚

- **Setup Guide**: `AUTH_ROUTES_SUPABASE_SETUP.md`
- **User Guide**: `USER_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## Success! 🎉

If all steps complete without errors, your POS system is now LIVE in production!

**Next**: Monitor for 24 hours, collect feedback, train users.

---

**Quick Reference**:
```bash
# Test everything
bash scripts/pre-deployment-test.sh && \
bash scripts/verify-supabase-deployment.sh

# Deploy Supabase
supabase functions deploy auth-login && \
supabase functions deploy orders-api && \
supabase functions deploy dashboard-api && \
supabase functions deploy reports-api && \
supabase functions deploy favorites-api && \
supabase functions deploy analytics-api && \
supabase functions deploy settings-api

# Set secrets
supabase secrets set JWT_SECRET=ZaidunkMargin && \
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh

# Deploy frontend (auto via GitHub)
git push nashtyxolvon main
```

**All systems GO!** 🚀
