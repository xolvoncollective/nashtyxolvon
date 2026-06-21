# 🔧 NASHTY OS - ENVIRONMENT CONFIGURATION GUIDE

## 📋 CONFIGURATION REQUIREMENTS

Berdasarkan analisis mendalam menggunakan MCP Serena terhadap semua file di repository, berikut adalah konfigurasi lengkap yang diperlukan untuk deployment.

---

## 🎯 SUPABASE CONFIGURATION

### Required Environment Variables (Edge Functions)

Semua Edge Functions memerlukan environment variables berikut. Set di **Supabase Dashboard → Settings → Edge Functions → Secrets**:

```bash
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4
```

### Edge Functions yang Memerlukan Secrets:

| Function | Required Variables | Purpose |
|----------|-------------------|---------|
| `auth-login` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | User authentication |
| `analytics-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Analytics data |
| `dashboard-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Dashboard stats |
| `export-csv` | SUPABASE_URL, SUPABASE_ANON_KEY | CSV export |
| `favorites-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Favorites management |
| `orders-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Order processing |
| `reports-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Reports generation |
| `settings-api` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Settings CRUD |

### How to Set Supabase Secrets:

```bash
# Method 1: Via Supabase CLI
supabase secrets set SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGc...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Method 2: Via Dashboard
# 1. Go to Supabase Dashboard
# 2. Click Project Settings → Edge Functions
# 3. Add secrets manually
```

---

## 🌐 CLOUDFLARE PAGES CONFIGURATION

### Build Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Framework preset** | None | Static site |
| **Build command** | *(leave empty)* | No build step needed |
| **Build output directory** | `/` | Root directory |
| **Root directory** | `/` | Serve from root |

### Environment Variables

**⚠️ IMPORTANT:** Cloudflare Pages **TIDAK MEMERLUKAN** environment variables karena semua credentials sudah hardcoded di frontend code untuk static deployment.

Jika ingin menggunakan environment variables (opsional, untuk future flexibility):

```bash
# Optional - untuk build time substitution
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (ANON KEY only, bukan SERVICE_ROLE_KEY!)
```

**Security Note:** ANON_KEY aman untuk frontend karena:
- Protected by Row Level Security (RLS)
- Tidak memberi akses admin
- Rate limited by Supabase
- Hanya bisa operasi yang di-allow RLS policies

---

## 🔐 HARDCODED CREDENTIALS (Current Implementation)

### Frontend Files dengan Hardcoded Credentials:

| File | Variables | Access Level |
|------|-----------|--------------|
| `api-client.js` | SUPABASE_URL, SUPABASE_ANON_KEY | Public (safe) |
| `index.html` | SUPABASE_URL, SUPABASE_ANON_KEY | Public (safe) |
| `kds/frontend/js/realtime.js` | SUPABASE_URL, SUPABASE_ANON_KEY | Public (safe) |

**Why Hardcoded?**
- Static deployment ke Cloudflare Pages
- No server-side rendering
- No build step
- Instant deployment without configuration

**Is it Safe?**
✅ **YES** - ANON_KEY designed untuk public exposure  
❌ **NO** - SERVICE_ROLE_KEY harus rahasia (hanya di Edge Functions)

---

## 📦 DEPLOYMENT CHECKLIST

### Supabase Setup
- [ ] Create project: mzucfndifneytbesirkx
- [ ] Enable Edge Functions
- [ ] Set 3 secrets (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] Deploy all edge functions:
  - [ ] auth-login
  - [ ] analytics-api
  - [ ] dashboard-api
  - [ ] export-csv
  - [ ] favorites-api
  - [ ] orders-api
  - [ ] reports-api
  - [ ] settings-api
- [ ] Run SQL migrations (001, 002, 003)
- [ ] Load seed data (SEED_DATA_COMPLETE.sql)
- [ ] Verify RLS policies active
- [ ] Test direct database access

### Cloudflare Pages Setup
- [ ] Connect repository: xolvoncollective/nashtyxolvon
- [ ] Set branch: main
- [ ] Build command: *(empty)*
- [ ] Output directory: /
- [ ] Custom domain (optional): nashtyxolvon2.pages.dev
- [ ] Enable auto-deploy on push
- [ ] **NO environment variables needed**
- [ ] Test deployment URL

---

## 🧪 VERIFICATION STEPS

### Test Supabase Edge Functions:

```bash
# Test auth-login
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"pin-login","pin":"1234","outletId":"00000000-0000-0000-0000-000000000101"}'

# Test export-csv
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/export-csv \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"transactions","dateFrom":"2026-06-01","dateTo":"2026-06-30"}'
```

### Test Cloudflare Deployment:

```bash
# 1. Check if site loads
curl -I https://nashtyxolvon2.pages.dev

# 2. Check if API client loads
curl https://nashtyxolvon2.pages.dev/api-client.js | grep "SUPABASE_URL"

# 3. Test login page
curl https://nashtyxolvon2.pages.dev | grep "NASHTY OS"
```

---

## 🔑 CREDENTIALS REFERENCE

### Supabase Project
```
Project ID: mzucfndifneytbesirkx
Project URL: https://mzucfndifneytbesirkx.supabase.co
Region: Southeast Asia (Singapore)
```

### API Keys (dari Supabase Dashboard → Settings → API)
```
Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg

Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4
```

### GitHub
```
Repository: xolvoncollective/nashtyxolvon
Branch: main
```

### Cloudflare Pages
```
Project: nashtyxolvon2
Domain: nashtyxolvon2.pages.dev
Auto-deploy: Enabled
```

---

## ⚠️ SECURITY BEST PRACTICES

### ✅ DO:
- Keep SERVICE_ROLE_KEY in Edge Functions only
- Use ANON_KEY in frontend code (safe)
- Enable RLS policies on all tables
- Use JWT tokens for user sessions
- Rotate SERVICE_ROLE_KEY periodically
- Monitor Edge Function logs

### ❌ DON'T:
- Expose SERVICE_ROLE_KEY in frontend
- Disable RLS policies
- Hardcode user passwords
- Commit .env files to Git
- Use SERVICE_ROLE_KEY in client-side code

---

## 🐛 TROUBLESHOOTING

### Issue: Edge Functions return 401 Unauthorized
**Solution:** Check if secrets are set correctly in Supabase Dashboard

### Issue: Frontend shows CORS errors
**Solution:** Verify Supabase project allows https://nashtyxolvon2.pages.dev in CORS settings

### Issue: Database queries fail with RLS error
**Solution:** Check if RLS policies allow the operation for the user's role

### Issue: Cloudflare Pages shows 404
**Solution:** Verify build output directory is set to `/` (root)

---

## 📝 DEPLOYMENT COMMAND REFERENCE

### Deploy Edge Functions:
```bash
# Deploy all functions at once
supabase functions deploy auth-login
supabase functions deploy analytics-api
supabase functions deploy dashboard-api
supabase functions deploy export-csv
supabase functions deploy favorites-api
supabase functions deploy orders-api
supabase functions deploy reports-api
supabase functions deploy settings-api
```

### Cloudflare Pages (via CLI - optional):
```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages publish . --project-name nashtyxolvon2
```

---

**Status:** Configuration Guide Complete ✅  
**Last Updated:** June 22, 2026  
**Version:** Production 1.0
