# DEPLOYMENT GUIDE - NASHTY OS Backend

> **Last updated:** 2026-06-21  
> **Project:** Nashty OS POS System  
> **Supabase Ref:** `mzucfndifneytbesirkx`  
> **Railway Project:** `610491e6-4a5d-433b-ae87-760711f4a04a`

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase dashboard accessible
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Production credentials ready (`.env` file)
- [ ] Git repository clean (`git status`)
- [ ] Database backup completed

---

## 🗄️ Step 1: Database Migrations

### 1a. Run Migration 001 (Create missing tables)

```sql
-- In Supabase SQL Editor: https://app.supabase.com/project/mzucfndifneytbesirkx/sql
-- Copy content from: migrations/001_create_missing_tables.sql
```

**Creates:**
- `favorites` table (user favorite products)
- `outlet_settings` table (receipt/display settings)
- `token_blacklist` table (JWT revocation)
- `analytics_cache` table (performance cache)

### 1b. Run Migration 002 (Fix schema + RLS + Storage)

```sql
-- Copy content from: migrations/002_fix_settings_and_rls.sql
```

**Creates:**
- `settings_json` column on `outlet_settings`
- Storage buckets: `receipts` (2MB) and `promotions` (5MB)
- RLS policies for all 4 new tables
- Auto-update triggers

### 1c. Deploy Performance Indexes

```sql
-- Copy content from: database-indexes-optimization.sql
-- (35+ indexes for performance)
```

### 1d. Deploy RLS Policies

```sql
-- Copy content from: database/database-rls-policies.sql
-- (40+ RLS policies for 16 tables)
```

### 1e. Run VACUUM ANALYZE

```sql
VACUUM ANALYZE;
```

---

## 🚂 Step 2: Deploy Backend to Railway

### 2a. Configure Environment Variables in Railway Dashboard

Go to: https://railway.app/project/610491e6-4a5d-433b-ae87-760711f4a04a

Add these variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `SUPABASE_URL` | `https://mzucfndifneytbesirkx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase dashboard → Settings → API)* |
| `JWT_SECRET` | `ZaidunkMargin-super-secret-min-32-chars` |
| `REFRESH_TOKEN_SECRET` | `ZaidunkRefresh-super-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | `30d` |
| `ALLOWED_ORIGINS` | `https://nashtyxolvon2.pages.dev,https://nashty.pages.dev` |
| `MAX_FILE_SIZE` | `5242880` |
| `ALLOWED_IMAGE_TYPES` | `image/jpeg,image/png,image/svg+xml,image/webp` |
| `ANALYTICS_CACHE_TTL` | `21600` |
| `LOG_LEVEL` | `info` |

### 2b. Install & Build

```powershell
cd backoffice\backend
npm install
npm run build
```

### 2c. Deploy via Railway CLI

```powershell
# Login to Railway
railway login

# Link to project
railway link --project 610491e6-4a5d-433b-ae87-760711f4a04a

# Deploy (from backoffice/backend directory)
cd backoffice\backend
railway up
```

### 2d. Verify Deployment

```powershell
# Check health endpoint
curl https://nashty-backend-production.up.railway.app/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-06-21T...","environment":"production","uptime":42}
```

---

## ⚡ Step 3: Deploy Supabase Edge Functions

### 3a. Login and Link

```powershell
supabase login
supabase link --project-ref mzucfndifneytbesirkx
```

### 3b. Set Secrets

```powershell
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set JWT_SECRET=ZaidunkMargin-super-secret-min-32-chars
supabase secrets set REFRESH_TOKEN_SECRET=ZaidunkRefresh-super-secret-min-32-chars
```

### 3c. Deploy All Functions

```powershell
supabase functions deploy auth-login
supabase functions deploy dashboard-api
supabase functions deploy orders-api
supabase functions deploy reports-api
```

### 3d. Test Functions

```powershell
# Test auth-login
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"action":"main-login","username":"admin@nashty","password":"admin123"}'

# Test dashboard-api
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/dashboard-api \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"action":"kpi","tenantId":"00000000-0000-0000-0000-000000000001"}'
```

---

## 🔗 Step 4: Update Frontend URLs

Update `api-client-v2.js` line 9:
```javascript
const RAILWAY_API_URL = 'https://nashty-backend-production.up.railway.app';
```

Replace with your actual Railway deployment URL from the Railway dashboard.

---

## ✅ Post-Deployment Verification

### Backend Endpoints to Test

| Endpoint | Method | Expected |
|---|---|---|
| `GET /health` | GET | 200 OK |
| `POST /api/auth/refresh` | POST | 200/401 |
| `GET /api/favorites` | GET | 200/401 |
| `GET /api/analytics/top-products` | GET | 200/401 |
| `GET /api/outlets/:id/settings` | GET | 200/401 |
| `GET /api/dashboard/kpi` | GET | 200/401 |
| `GET /api/dashboard/recent-orders` | GET | 200/401 |
| `GET /api/reports/sales` | GET | 200/401 |

### Database Verification

```sql
-- Verify new tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('favorites', 'outlet_settings', 'token_blacklist', 'analytics_cache');

-- Verify index count
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('favorites', 'outlet_settings', 'token_blacklist', 'analytics_cache');
```

---

## 🔄 Rollback Procedures

### Backend Rollback
```powershell
# Railway keeps previous deployments - rollback in dashboard
# Or deploy specific commit:
railway up --detach
```

### Database Rollback
```sql
-- Drop new tables if migration fails
DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS token_blacklist CASCADE;
DROP TABLE IF EXISTS outlet_settings CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
```

---

## 🔒 Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` gives full database access - keep secret!
- `JWT_SECRET` must be at least 32 chars and random
- Rate limiting: auth (10/min), uploads (5/min), general (200/min)
- CORS is restricted to `ALLOWED_ORIGINS` env variable
- File uploads limited: logos 2MB, promo images 5MB

---

## 📞 Support

- Supabase Dashboard: https://app.supabase.com/project/mzucfndifneytbesirkx
- Railway Dashboard: https://railway.app/project/610491e6-4a5d-433b-ae87-760711f4a04a
- Frontend: https://nashtyxolvon2.pages.dev
