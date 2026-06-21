# 🚀 Backend Deployment Guide - Nashty OS

Panduan lengkap untuk deployment backend Express + Supabase ke Railway.

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm atau yarn
- Akun Supabase (sudah ada)
- Akun Railway (untuk backend hosting)
- Git (untuk deployment)

## 🗄️ Database Setup

### 1. Execute Database Migrations

Jalankan migration scripts di Supabase SQL Editor atau via psql:

```bash
# Connect to Supabase
psql -h mzucfndifneytbesirkx.supabase.co -U postgres -d postgres

# Execute migration
\i migrations/001_create_missing_tables.sql
```

**atau** via Supabase Dashboard:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project "mzucfndifneytbesirkx"
3. Go to SQL Editor
4. Paste isi file `migrations/001_create_missing_tables.sql`
5. Klik "Run"

### 2. Configure Storage Buckets

Buat 2 storage buckets di Supabase:

```sql
-- Create receipts bucket (for logos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true);

-- Create promotions bucket (for promo images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('promotions', 'promotions', true);
```

**Storage RLS Policies:**

```sql
-- Allow authenticated uploads to receipts
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'receipts');

-- Allow authenticated uploads to promotions
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'promotions');

-- Allow public reads
CREATE POLICY "Allow public reads" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id IN ('receipts', 'promotions'));
```

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd backoffice/backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
NODE_ENV=production
PORT=5000

# Supabase (sudah tersedia)
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.cZkUq5_o3z7wMZElpSfWfBIRQPJJg6Ec3Hquz40cOpU

# JWT Secrets (ganti dengan secret yang kuat)
JWT_SECRET=ZaidunkMarginNashtyOS2024SecureKey
REFRESH_TOKEN_SECRET=RefreshTokenSecretNashtyOS2024
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS (tambahkan domain frontend)
ALLOWED_ORIGINS=https://nashtyxolvon2.pages.dev,http://localhost:3000

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Analytics
ANALYTICS_CACHE_TTL=21600
MIN_TRANSACTIONS_FOR_OUTLET_ANALYTICS=100

# Logging
LOG_LEVEL=info
```

### 3. Test Locally

```bash
npm run dev
```

Buka `http://localhost:5000/health` - harus return:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "version": "2.0.0",
  "environment": "development",
  "uptime": 5
}
```

### 4. Build TypeScript

```bash
npm run build
```

Pastikan folder `dist/` terbuat dengan file JS hasil compile.

## 🚂 Railway Deployment

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

Browser akan terbuka, login dengan GitHub/email.

### 3. Link to Existing Project

```bash
railway link --project 610491e6-4a5d-433b-ae87-760711f4a04a
```

**atau** jika belum punya project:

```bash
railway init
```

### 4. Set Environment Variables

**Via Railway Dashboard** (Recommended):
1. Buka https://railway.app/dashboard
2. Pilih project Nashty Backend
3. Go to Variables tab
4. Add semua environment variables dari `.env`

**atau Via CLI:**

```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set JWT_SECRET=ZaidunkMarginNashtyOS2024SecureKey
railway variables set REFRESH_TOKEN_SECRET=RefreshTokenSecretNashtyOS2024
railway variables set ALLOWED_ORIGINS=https://nashtyxolvon2.pages.dev
# ... dll
```

### 5. Deploy

```bash
railway up
```

Atau dengan npm script:

```bash
npm run deploy
```

### 6. Verify Deployment

Check deployment URL:

```bash
railway status
```

Test health endpoint:

```bash
curl https://nashty-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 123
}
```

## 🧪 Testing API Endpoints

### Auth - Token Refresh

```bash
curl -X POST https://nashty-backend-production.up.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token"}'
```

### Favorites - Get User Favorites

```bash
curl https://nashty-backend-production.up.railway.app/api/favorites?userId=user-uuid \
  -H "Authorization: Bearer your-token"
```

### Analytics - Top Products

```bash
curl "https://nashty-backend-production.up.railway.app/api/analytics/top-products?outletId=outlet-uuid&days=7" \
  -H "Authorization: Bearer your-token"
```

### Settings - Get Outlet Settings

```bash
curl https://nashty-backend-production.up.railway.app/api/outlets/outlet-uuid/settings \
  -H "Authorization: Bearer your-token"
```

### Dashboard - KPI

```bash
curl "https://nashty-backend-production.up.railway.app/api/dashboard/kpi?outletId=outlet-uuid" \
  -H "Authorization: Bearer your-token"
```

## 📊 Monitoring

### View Logs

```bash
railway logs
```

### Check Metrics

Railway Dashboard > Metrics tab:
- CPU usage
- Memory usage
- Network traffic
- Response times

### Error Tracking

Logs tersimpan di:
- Railway Dashboard > Logs
- Local: `backoffice/backend/logs/error.log`
- Local: `backoffice/backend/logs/combined.log`

## 🔒 Security Checklist

- [x] Helmet.js security headers enabled
- [x] CORS properly configured
- [x] Rate limiting active (auth: 10/min, upload: 5/min, general: 200/min)
- [x] JWT token authentication
- [x] Token blacklisting for logout
- [x] Input validation with Zod
- [x] Parameterized queries (Supabase client)
- [x] File upload validation (MIME type, size)
- [x] HTTPS enforced by Railway
- [x] Environment variables secured

## 🛠️ Troubleshooting

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run typecheck
```

### Connection Timeout

- Check Supabase URL and service role key
- Verify Railway environment variables
- Check Supabase project status

### Rate Limit Errors

Adjust limits in `src/middleware/rateLimiter.ts`:

```typescript
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // Increase from 10
  // ...
});
```

### Memory Issues

Adjust Railway plan atau optimize queries:
- Add database indexes
- Implement pagination
- Use caching

## 📈 Performance Optimization

### Database Indexes

Sudah dibuat via migration `001_create_missing_tables.sql`:
- `idx_favorites_user_id`
- `idx_favorites_product_id`
- `idx_analytics_cache_key`
- `idx_token_blacklist_hash`
- dll.

### Caching Strategy

Analytics cache (6 jam):
```typescript
const cacheTTL = 6 * 60 * 60; // 6 hours
```

### Cleanup Jobs

Jalankan secara periodik (via cron atau Railway scheduled jobs):

```sql
-- Clean expired tokens (daily)
SELECT cleanup_expired_tokens();

-- Clean expired cache (daily)
SELECT cleanup_expired_cache();
```

## 🔄 Rollback Procedures

### Rollback to Previous Deployment

```bash
# Via Railway Dashboard
# Deployments > Select previous deployment > Redeploy

# Via CLI
railway rollback
```

### Database Rollback

```sql
-- Drop tables created by migration 001
DROP TABLE IF EXISTS analytics_cache;
DROP TABLE IF EXISTS token_blacklist;
DROP TABLE IF EXISTS outlet_settings;
DROP TABLE IF EXISTS favorites;
```

## 📝 Maintenance Tasks

### Weekly

- [ ] Check error logs
- [ ] Review Railway metrics
- [ ] Run cleanup functions

### Monthly

- [ ] Update dependencies (`npm outdated`)
- [ ] Review and optimize slow queries
- [ ] Check storage usage (Supabase)

### Quarterly

- [ ] Security audit
- [ ] Performance benchmark
- [ ] Review rate limits

## 🎯 Next Steps

1. ✅ Deploy backend to Railway
2. ⬜ Update frontend `api-client-v2.js` dengan Railway URL
3. ⬜ Test end-to-end workflows (POS, Backoffice)
4. ⬜ Setup monitoring alerts
5. ⬜ Create backup strategy
6. ⬜ Document API for team

## 📞 Support

- Railway: https://railway.app/help
- Supabase: https://supabase.com/docs
- Internal: contact DevOps team

---

**Deployment Status**: ✅ Ready to Deploy
**Last Updated**: 2024-06-21
**Version**: 2.0.0
