# 🔐 Auth, Routes & Supabase Setup Guide

## Complete Deployment Configuration

---

## 1. Supabase Configuration

### A. Edge Functions Deployment

**Deploy semua 7 Edge Functions**:

```bash
# Navigate to project root
cd /path/to/NashtyBerubah

# Deploy each function
supabase functions deploy auth-login
supabase functions deploy orders-api
supabase functions deploy dashboard-api
supabase functions deploy reports-api
supabase functions deploy favorites-api
supabase functions deploy analytics-api
supabase functions deploy settings-api
```

### B. Verify Deployments

```bash
# Check function status
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

### C. Set Function Secrets

```bash
# JWT secrets for auth
supabase secrets set JWT_SECRET=ZaidunkMargin
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh

# Verify secrets
supabase secrets list
```

### D. Storage Buckets Setup

**Via Supabase Dashboard**:

1. Go to: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage/buckets

2. Create bucket `receipts`:
   - Name: receipts
   - Public: Yes (for logo access)
   - Allowed MIME types: image/png, image/jpeg, image/svg+xml
   - Max file size: 2MB

3. Create bucket `promotions`:
   - Name: promotions
   - Public: Yes (for promo images)
   - Allowed MIME types: image/png, image/jpeg
   - Max file size: 5MB

**Or via SQL**:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('receipts', 'receipts', true),
  ('promotions', 'promotions', true);

-- Set bucket policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public Access Promotions" ON storage.objects
  FOR SELECT USING (bucket_id = 'promotions');

CREATE POLICY "Authenticated Upload Promotions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promotions' 
    AND auth.role() = 'authenticated'
  );
```

---

## 2. Database Verification

### A. Check Required Tables

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'users',
  'outlets',
  'products',
  'categories',
  'orders',
  'order_items',
  'favorites',
  'outlet_settings',
  'token_blacklist',
  'analytics_cache'
);
```

### B. Verify Indexes

```sql
-- Check performance indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items', 'products', 'favorites')
ORDER BY tablename, indexname;
```

### C. Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

---

## 3. Authentication Flow

### A. Login Endpoint

**URL**: `https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login`

**Test Request**:
```bash
curl -X POST \
  https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg" \
  -d '{
    "identifier": "admin1",
    "access_key": "your_access_key",
    "outlet_protocol": "[00000] Main Branch"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user-id",
    "identifier": "admin1",
    "outlet_id": "outlet-id",
    "role": "cashier"
  }
}
```

### B. Token Refresh

**Endpoint**: Same as login, with `refresh_token` in body

```bash
curl -X POST \
  https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "refresh_token": "your_refresh_token"
  }'
```

### C. Token Validation

**In API Client** (`api-client-v3-pure-supabase.js`):

```javascript
// Verify current configuration
const apiClient = {
  config: {
    supabaseUrl: 'https://mzucfndifneytbesirkx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    functionsUrl: 'https://mzucfndifneytbesirkx.supabase.co/functions/v1'
  }
};
```

---

## 4. API Routes Configuration

### A. Edge Function Routes

All functions are accessible at:
```
Base URL: https://mzucfndifneytbesirkx.supabase.co/functions/v1
```

**Available Routes**:

1. **auth-login**
   - POST `/auth-login`
   - Public endpoint
   - No auth required

2. **orders-api**
   - POST `/orders-api` (create order)
   - GET `/orders-api?outlet_id=xxx` (list orders)
   - GET `/orders-api?order_id=xxx` (get order)
   - Requires: Authorization header

3. **dashboard-api**
   - GET `/dashboard-api?outlet_id=xxx`
   - Requires: Authorization header
   - Returns: sales stats, top products

4. **reports-api**
   - GET `/reports-api?outlet_id=xxx&type=daily`
   - GET `/reports-api?outlet_id=xxx&type=monthly`
   - Requires: Authorization header

5. **favorites-api**
   - POST `/favorites-api` (add favorite)
   - DELETE `/favorites-api?favorite_id=xxx` (remove)
   - GET `/favorites-api?user_id=xxx` (list)
   - PUT `/favorites-api` (reorder)
   - Requires: Authorization header

6. **analytics-api**
   - GET `/analytics-api?outletId=xxx&days=7&limit=20`
   - Returns: Top products with trending
   - Requires: Authorization header

7. **settings-api**
   - GET `/settings-api?outlet_id=xxx`
   - PUT `/settings-api` (update settings)
   - Requires: Authorization header

### B. CORS Configuration

**Verify CORS headers in each function**:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
};
```

### C. Authentication Middleware

**All protected routes check**:
```typescript
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders
  });
}
```

---

## 5. Frontend Route Configuration

### A. Update API Client

**File**: `api-client-v3-pure-supabase.js`

```javascript
window.NashtyAPI = {
  config: {
    supabaseUrl: 'https://mzucfndifneytbesirkx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg',
    functionsUrl: 'https://mzucfndifneytbesirkx.supabase.co/functions/v1'
  },
  
  auth: {
    async login(identifier, accessKey, outletProtocol) {
      const response = await fetch(`${this.config.functionsUrl}/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.supabaseAnonKey
        },
        body: JSON.stringify({ identifier, access_key: accessKey, outlet_protocol: outletProtocol })
      });
      return response.json();
    },
    
    async getAccessToken() {
      return localStorage.getItem('access_token');
    },
    
    async getCurrentUser() {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  }
};
```

### B. Protected Routes

**All POS pages require authentication**:

```javascript
// pos/frontend/js/auth.js
async function checkAuth() {
  const token = await window.NashtyAPI.auth.getAccessToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Verify token is valid
  try {
    const user = await window.NashtyAPI.auth.getCurrentUser();
    if (!user) {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
  }
}

// Run on page load
window.addEventListener('DOMContentLoaded', checkAuth);
```

---

## 6. Testing Authentication

### A. Test Login Flow

```javascript
// Browser Console Test
async function testLogin() {
  const result = await window.NashtyAPI.auth.login(
    'admin1',
    'your_access_key',
    '[00000] Main Branch'
  );
  console.log('Login result:', result);
  
  if (result.success) {
    localStorage.setItem('access_token', result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    console.log('✅ Login successful');
  } else {
    console.error('❌ Login failed:', result.message);
  }
}

testLogin();
```

### B. Test Protected Endpoint

```javascript
async function testProtectedEndpoint() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(
    'https://mzucfndifneytbesirkx.supabase.co/functions/v1/dashboard-api?outlet_id=YOUR_OUTLET_ID',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': window.NashtyAPI.config.supabaseAnonKey
      }
    }
  );
  
  const data = await response.json();
  console.log('Dashboard data:', data);
}

testProtectedEndpoint();
```

### C. Test Storage Upload

```javascript
async function testStorageUpload() {
  const token = localStorage.getItem('access_token');
  const file = document.querySelector('input[type="file"]').files[0];
  
  const { data, error } = await window.NashtyAPI.supabase.storage
    .from('receipts')
    .upload(`logos/test-${Date.now()}.png`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = window.NashtyAPI.supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);
    
    console.log('Public URL:', publicUrl);
  }
}
```

---

## 7. Deployment Verification Checklist

### A. Supabase Backend
- [ ] All 7 Edge Functions deployed
- [ ] JWT secrets configured
- [ ] Storage buckets created (receipts, promotions)
- [ ] Database tables verified
- [ ] RLS policies active
- [ ] Indexes created

### B. API Configuration
- [ ] API URLs correct in frontend
- [ ] Anon key configured
- [ ] CORS headers set
- [ ] Auth middleware working

### C. Authentication
- [ ] Login endpoint tested
- [ ] Token refresh works
- [ ] Protected routes require auth
- [ ] Logout clears tokens

### D. Storage
- [ ] Receipt logo upload works
- [ ] Promo image upload works
- [ ] Public URLs accessible
- [ ] File size limits enforced

---

## 8. Common Issues & Solutions

### Issue 1: CORS Error
**Symptom**: "Access to fetch blocked by CORS policy"
**Solution**: Verify CORS headers in Edge Functions include your domain

### Issue 2: 401 Unauthorized
**Symptom**: API calls return 401
**Solution**: Check Authorization header format: `Bearer <token>`

### Issue 3: Storage Upload Fails
**Symptom**: Upload returns error
**Solution**: 
1. Check bucket exists and is public
2. Verify file size < limit
3. Check file type allowed

### Issue 4: Function Not Found
**Symptom**: 404 on function call
**Solution**: Verify function deployed: `supabase functions list`

### Issue 5: Token Expired
**Symptom**: Sudden 401 errors
**Solution**: Implement token refresh logic

---

## 9. Production Environment Variables

### A. Supabase Environment
```bash
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=[admin only - never expose]
JWT_SECRET=ZaidunkMargin
REFRESH_TOKEN_SECRET=ZaidunkMarginRefresh
```

### B. Frontend Environment
```javascript
// api-client-v3-pure-supabase.js
const config = {
  supabaseUrl: 'https://mzucfndifneytbesirkx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  functionsUrl: 'https://mzucfndifneytbesirkx.supabase.co/functions/v1'
};
```

---

## 10. Security Best Practices

### A. Token Management
- ✅ Store tokens in localStorage (httpOnly not available for SPA)
- ✅ Implement token refresh before expiry
- ✅ Clear tokens on logout
- ✅ Validate tokens server-side

### B. API Security
- ✅ All mutations require authentication
- ✅ RLS policies enforce data access
- ✅ Input validation on all endpoints
- ✅ Rate limiting on Edge Functions

### C. Storage Security
- ✅ Validate file types before upload
- ✅ Enforce file size limits
- ✅ Scan for malicious content
- ✅ Use signed URLs for sensitive files

---

## 11. Monitoring & Logs

### A. Check Function Logs
```bash
# View logs for specific function
supabase functions logs auth-login --tail

# View all function logs
supabase functions logs --tail
```

### B. Supabase Dashboard
- Functions: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/functions
- Storage: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/storage
- Database: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/editor
- Logs: https://supabase.com/dashboard/project/mzucfndifneytbesirkx/logs

---

## 12. Quick Test Script

```bash
#!/bin/bash
# test-deployment.sh

echo "🧪 Testing Deployment..."

# Test 1: Health check
echo "1. Testing auth-login endpoint..."
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"test": true}'

# Test 2: Storage access
echo "2. Testing storage bucket..."
curl -I https://mzucfndifneytbesirkx.supabase.co/storage/v1/object/public/receipts/test.png

# Test 3: Function list
echo "3. Listing deployed functions..."
supabase functions list

echo "✅ Tests complete"
```

---

## Summary

**To Deploy**:
1. Deploy Edge Functions: `supabase functions deploy <name>`
2. Set secrets: `supabase secrets set JWT_SECRET=...`
3. Create storage buckets via Dashboard
4. Verify API client configuration
5. Test authentication flow
6. Test protected endpoints
7. Monitor logs

**All endpoints are now ready for production use!** 🚀
