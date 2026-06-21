# Backend Architecture

**Last Updated:** 2026-06-21  
**Status:** Production Active

---

## Overview

NASHTY OS uses a **serverless backend architecture** with Supabase Edge Functions deployed on Cloudflare Pages. The Express backend in `backoffice/backend/` is **legacy code** for local development only and is **NOT used in production**.

---

## Production Backend: Supabase Edge Functions

### Location
- **Path:** `supabase/functions/`
- **Runtime:** Deno on Supabase Edge Runtime
- **Deployment:** Automatic via Supabase CLI
- **Environment:** Production (Cloudflare Pages + Supabase)

### Active Edge Functions

| Function | Purpose | Endpoints |
|----------|---------|-----------|
| **orders-api** | POS/KDS order operations | `/orders-api` |
| **settings-api** | Outlet settings CRUD | `/settings` |
| **qris-upload** | QRIS static image upload | `/qris-upload` |
| **receipt-settings** | Receipt configuration | `/receipt-settings` |
| **display-settings** | Customer display config | `/display-settings` |
| **favorites** | Favorite products | `/favorites` |
| **analytics** | Dashboard/reports KPIs | `/analytics` |
| **activity-logs** | Activity logging | `/activity-logs` |

### orders-api Actions
```typescript
POST /orders-api
{
  "action": "create",           // Create new order
  "action": "get-orders",       // List orders
  "action": "update-status",    // Update order/kitchen status
  "action": "start-shift",      // Start cashier shift
  "action": "end-shift"         // End cashier shift
}
```

### Deployment
```bash
# Deploy single function
supabase functions deploy orders-api

# Deploy all functions
supabase functions deploy
```

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- Set in Supabase Dashboard → Edge Functions → Settings

---

## Development Backend: Express (LEGACY)

### Location
- **Path:** `backoffice/backend/`
- **Runtime:** Node.js + Express
- **Status:** **LEGACY - NOT USED IN PRODUCTION**
- **Purpose:** Local development only (optional)

### Legacy Routes
```
GET  /api/activity-logs
POST /api/qris-upload
GET  /api/settings/:outletId
PUT  /api/settings/:outletId
POST /api/settings/:outletId/logo
GET  /api/receipt-settings/:outletId
PUT  /api/receipt-settings/:outletId
GET  /api/display-settings/:outletId
PUT  /api/display-settings/:outletId
GET  /api/favorites
POST /api/favorites
DELETE /api/favorites/:id
```

### Why Legacy?
1. **Deployment Complexity:** Requires separate Node.js hosting
2. **Duplicate Logic:** Routes duplicate Edge Function functionality
3. **Production Path:** Cloudflare Pages → Supabase Edge Functions (no Express)
4. **Maintenance Burden:** Two backends to keep in sync

### Migration Status
- ✅ All production features moved to Edge Functions
- ✅ Cloudflare Pages uses Edge Functions exclusively
- ⚠️ Express backend retained for local dev (optional)
- 🔜 Can be removed or archived in future

---

## Architecture Decision: Why Serverless?

### Benefits
1. **Scalability:** Auto-scales with traffic
2. **Cost:** Pay only for actual usage
3. **Deployment:** Git push → auto-deploy
4. **Security:** Supabase RLS + Edge Functions isolation
5. **Performance:** Edge deployment near users

### Trade-offs
1. **Cold Starts:** First request may be slower (~100-300ms)
2. **Debugging:** Logs in Supabase Dashboard
3. **Local Dev:** Requires Supabase CLI for function testing

---

## Development Workflow

### Local Development (Recommended)
```bash
# Start Supabase local stack (includes Edge Functions)
supabase start

# Test Edge Function locally
supabase functions serve orders-api

# Frontend → http://localhost:54321/functions/v1/orders-api
```

### Local Development (Legacy Express)
```bash
# Optional: Run Express backend for offline dev
cd backoffice/backend
npm install
npm start

# Frontend → http://localhost:3001/api/*
```

**Note:** Use Supabase local stack for accurate production testing.

---

## API Client Configuration

### Production
```javascript
// api-client.js
API.baseURL = 'https://[project-id].supabase.co/functions/v1';
```

### Local Development
```javascript
// api-client.js
API.baseURL = 'http://localhost:54321/functions/v1';  // Supabase local
// OR
API.baseURL = 'http://localhost:3001/api';           // Express (legacy)
```

---

## Adding New Features

### ✅ DO: Create Edge Function
```bash
# Create new function
supabase functions new my-feature

# Implement in supabase/functions/my-feature/index.ts
# Deploy
supabase functions deploy my-feature
```

### ❌ DON'T: Modify Express Backend
Express routes are legacy and not deployed to production. Any changes there will NOT reach production users.

---

## Migration Guide (For Future Cleanup)

If/when removing Express backend:

1. **Verify All Routes Migrated:**
   - Check each Express route has Edge Function equivalent
   - Test Edge Functions in production

2. **Update Documentation:**
   - Remove Express references from README
   - Update setup instructions

3. **Archive Express Code:**
   ```bash
   mkdir archive/
   mv backoffice/backend archive/express-backend-legacy
   git commit -m "archive: move Express backend to archive"
   ```

4. **Update .gitignore:**
   ```
   archive/
   ```

---

## Troubleshooting

### Edge Function Errors
```bash
# View logs
supabase functions logs orders-api

# Test locally
supabase functions serve orders-api --debug
```

### CORS Issues
Edge Functions include CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Authentication
Edge Functions use Supabase service role key for bypassing RLS when needed. Row Level Security (RLS) policies handle user-level permissions.

---

## Summary

| Aspect | Production | Development |
|--------|-----------|-------------|
| **Backend** | Supabase Edge Functions | Supabase Local Stack |
| **Language** | TypeScript (Deno) | TypeScript (Deno) |
| **Deployment** | `supabase functions deploy` | `supabase functions serve` |
| **Express** | ❌ Not used | ⚠️ Optional (legacy) |
| **Hosting** | Cloudflare Pages + Supabase | localhost |

**Key Takeaway:** Always modify Edge Functions for new features. Express backend is legacy and not deployed to production.
