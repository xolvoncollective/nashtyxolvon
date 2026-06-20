# Design Document: Backend & Database Deployment

## Overview

This design document specifies the technical implementation for deploying the Nashty OS backend infrastructure to production, achieving 100% system score through database optimization, API deployment, security hardening, and comprehensive testing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Cloudflare Pages)                                │
│  ├─ POS: nashtyxolvon2.pages.dev                            │
│  ├─ Backoffice: nashtyxolvon2.pages.dev/backoffice         │
│  ├─ KDS: nashtyxolvon2.pages.dev/kds                       │
│  └─ CRM: nashtyxolvon2.pages.dev/crm                       │
│                      ↓                                       │
│  Backend API (Railway)                                       │
│  ├─ Express + TypeScript                                    │
│  ├─ Port: 5432                                              │
│  ├─ /api/auth      (Token refresh)                         │
│  ├─ /api/favorites (CRUD operations)                       │
│  ├─ /api/analytics (Top products)                          │
│  └─ /api/outlets   (Settings + uploads)                    │
│                      ↓                                       │
│  Supabase                                                    │
│  ├─ PostgreSQL (mzucfndifneytbesirkx)                      │
│  ├─ Storage (receipts, promotions buckets)                 │
│  ├─ Edge Functions (auth, dashboard, orders, reports)      │
│  └─ Realtime (WebSocket for KDS)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Additions

### Missing Tables

#### 1. favorites table
```sql
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_favorites_position ON favorites(user_id, position);
```

#### 2. outlet_settings table
```sql
CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, key)
);

CREATE INDEX idx_outlet_settings_outlet ON outlet_settings(outlet_id);
CREATE INDEX idx_outlet_settings_key ON outlet_settings(key);
```

#### 3. token_blacklist table
```sql
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

#### 4. analytics_cache table
```sql
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_outlet ON analytics_cache(outlet_id);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
```

## Deployment Architecture

### Phase 1: Database Migrations

**File Structure:**
```
migrations/
├── 001_create_missing_tables.sql       # Create favorites, outlet_settings, etc.
├── 002_deploy_indexes.sql              # Deploy 35+ performance indexes
├── 003_deploy_rls_policies.sql         # Enable RLS and policies
├── 004_create_storage_buckets.sql      # Configure Storage buckets
└── 005_update_existing_tables.sql      # Add missing columns if any
```

**Execution Order:**
1. Backup production database
2. Run 001_create_missing_tables.sql
3. Run 002_deploy_indexes.sql
4. Run VACUUM ANALYZE
5. Run 003_deploy_rls_policies.sql
6. Test RLS with sample queries
7. Run 004_create_storage_buckets.sql
8. Verify all changes

### Phase 2: Backend API Deployment to Railway

**Deployment Configuration:**

```bash
# Railway CLI deployment
railway login
railway link --project 610491e6-4a5d-433b-ae87-760711f4a04a
railway up

# Environment Variables (set in Railway dashboard)
NODE_ENV=production
PORT=5432
CORS_ORIGIN=https://nashtyxolvon2.pages.dev
JWT_SECRET=ZaidunkMargin
DATABASE_MODE=postgres
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Build Configuration (railway.json):**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Phase 3: Edge Functions Deployment

**Edge Function Structure:**
```
supabase/functions/
├── auth-login/
│   ├── index.ts                    # JWT generation + login validation
│   └── deno.json
├── dashboard-api/
│   ├── index.ts                    # Aggregated dashboard statistics
│   └── deno.json
├── orders-api/
│   ├── index.ts                    # Order CRUD operations
│   └── deno.json
└── reports-api/
    ├── index.ts                    # Sales reports generation
    └── deno.json
```

**Deployment Commands:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref mzucfndifneytbesirkx

# Deploy all functions
supabase functions deploy auth-login
supabase functions deploy dashboard-api
supabase functions deploy orders-api
supabase functions deploy reports-api

# Set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Phase 4: Supabase Storage Configuration

**Bucket Configuration:**

```sql
-- Create buckets via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('receipts', 'receipts', true),
  ('promotions', 'promotions', true);

-- RLS Policies for upload
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.role() IN ('admin', 'owner', 'manager'));

CREATE POLICY "Authenticated users can upload promo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promotions' AND auth.role() IN ('admin', 'owner', 'manager'));

-- Public read access
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

CREATE POLICY "Public read access for promotions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'promotions');
```

## Backend API Endpoints

### Authentication Routes

**POST /api/auth/refresh**
```typescript
// Request
{
  "refreshToken": "string"
}

// Response
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900 // seconds
}
```

### Favorites Routes

**GET /api/favorites**
```typescript
// Query params: userId
// Response
{
  "favorites": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "product": {
        "id": "uuid",
        "name": "string",
        "price": number,
        "image_url": "string"
      },
      "position": number,
      "createdAt": "timestamp"
    }
  ]
}
```

**POST /api/favorites**
```typescript
// Request
{
  "userId": "uuid",
  "productId": "uuid"
}

// Response
{
  "favorite": { /* favorite object */ }
}
```

**DELETE /api/favorites/:id**
```typescript
// Response
{
  "message": "Favorite removed successfully"
}
```

**PUT /api/favorites/reorder**
```typescript
// Request
{
  "userId": "uuid",
  "favorites": [
    { "id": "uuid", "position": 0 },
    { "id": "uuid", "position": 1 }
  ]
}

// Response
{
  "message": "Favorites reordered successfully"
}
```

### Analytics Routes

**GET /api/analytics/top-products**
```typescript
// Query params: outletId, days (default 7), limit (default 20)
// Response
{
  "products": [
    {
      "productId": "uuid",
      "productName": "string",
      "salesCount": number,
      "revenue": number,
      "trend": "up" | "down" | "stable"
    }
  ],
  "cachedAt": "timestamp",
  "expiresAt": "timestamp"
}
```

### Settings Routes

**GET /api/outlets/:outletId/settings**
```typescript
// Response
{
  "settings": {
    "receipt_logo_url": "string",
    "receipt_header": "string",
    "receipt_footer": "string",
    "receipt_font_size": "small" | "medium" | "large",
    "receipt_qr_enabled": boolean,
    "receipt_qr_url": "string",
    "receipt_social_facebook": "string",
    "receipt_social_instagram": "string",
    "receipt_social_twitter": "string",
    "receipt_social_tiktok": "string",
    "receipt_promo_messages": ["string", "string", "string"],
    "customer_display_bg_color": "string",
    "customer_display_text_color": "string",
    "customer_display_accent_color": "string",
    "customer_display_promo_images": ["url1", "url2"]
  }
}
```

**PUT /api/outlets/:outletId/settings**
```typescript
// Request
{
  "settings": {
    "receipt_header": "string",
    "receipt_footer": "string",
    // ... other settings
  }
}

// Response
{
  "message": "Settings updated successfully",
  "settings": { /* updated settings */ }
}
```

**POST /api/outlets/:outletId/upload-logo**
```typescript
// Request: multipart/form-data
{
  "file": File // PNG, JPG, SVG, max 2MB
}

// Response
{
  "logoUrl": "https://mzucfndifneytbesirkx.supabase.co/storage/v1/object/public/receipts/..."
}
```

**POST /api/outlets/:outletId/upload-promo-images**
```typescript
// Request: multipart/form-data
{
  "files": File[] // Max 10 images, PNG/JPG only, 5MB each
}

// Response
{
  "imageUrls": ["url1", "url2", ...]
}
```

## Security Implementation

### Rate Limiting Configuration

```typescript
import rateLimit from 'express-rate-limit';

// Auth endpoints: 10 requests per minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many auth requests, please try again later'
});

// Upload endpoints: 5 uploads per minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many upload requests, please try again later'
});

app.use('/api/auth', authLimiter);
app.use('/api/outlets/:id/upload-logo', uploadLimiter);
app.use('/api/outlets/:id/upload-promo-images', uploadLimiter);
```

### File Upload Validation

```typescript
import multer from 'multer';
import sharp from 'sharp';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for logos
    files: 10 // Max 10 files for promo images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, SVG allowed.'));
    }
  }
});

// Resize logos to 200px width
async function resizeLogo(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(200, null, { withoutEnlargement: true })
    .toBuffer();
}
```

### SQL Injection Prevention

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

// Always use parameterized queries
async function getUserFavorites(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(*)')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  
  return data;
}

// NEVER concatenate user input into SQL strings
// BAD: `SELECT * FROM favorites WHERE user_id = '${userId}'`
// GOOD: Use supabase client methods or parameterized queries
```

## Performance Optimization

### Index Strategy

**Composite Indexes for Multi-Tenant Queries:**
```sql
-- Orders by outlet and date (dashboard queries)
CREATE INDEX idx_orders_outlet_date ON orders(outlet_id, created_at DESC);

-- Orders by outlet and status (POS queries)
CREATE INDEX idx_orders_outlet_status ON orders(outlet_id, order_status, created_at DESC);

-- Kitchen orders (KDS queries)
CREATE INDEX idx_orders_kitchen ON orders(outlet_id, kitchen_status, created_at) 
WHERE kitchen_status IN ('pending', 'preparing');

-- Product search (POS search)
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Query Caching Strategy

```typescript
// Analytics cache: 6 hours TTL
async function getTopProducts(outletId: string, days: number = 7) {
  const cacheKey = `top_products_${outletId}_${days}d`;
  const now = new Date();
  
  // Check cache first
  const { data: cached } = await supabase
    .from('analytics_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', now.toISOString())
    .single();
  
  if (cached) {
    return cached.data;
  }
  
  // Compute expensive aggregation
  const { data: products } = await supabase.rpc('get_top_products', {
    p_outlet_id: outletId,
    p_days: days,
    p_limit: 20
  });
  
  // Cache result
  await supabase.from('analytics_cache').upsert({
    cache_key: cacheKey,
    outlet_id: outletId,
    data: products,
    expires_at: new Date(now.getTime() + 6 * 60 * 60 * 1000) // 6 hours
  });
  
  return products;
}
```

## Testing Strategy

### Integration Test Suite

```typescript
// test/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Backend API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testOutletId: string;
  
  beforeAll(async () => {
    // Setup: Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '8888', pin: 'nashty1111' });
    
    authToken = res.body.accessToken;
    testUserId = res.body.user.id;
    testOutletId = res.body.user.outlet_id;
  });
  
  describe('Favorites API', () => {
    it('should get user favorites', async () => {
      const res = await request(app)
        .get('/api/favorites')
        .query({ userId: testUserId })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.favorites).toBeInstanceOf(Array);
    });
    
    it('should add favorite', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          productId: 'test-product-id'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.favorite).toHaveProperty('id');
    });
    
    it('should enforce 50 favorite limit', async () => {
      // Add 50 favorites first
      // Then try to add 51st
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          productId: 'test-product-51'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('maximum');
    });
  });
  
  describe('Analytics API', () => {
    it('should get top products', async () => {
      const res = await request(app)
        .get('/api/analytics/top-products')
        .query({ outletId: testOutletId, days: 7 })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.products.length).toBeLessThanOrEqual(20);
    });
  });
  
  describe('Settings API', () => {
    it('should get outlet settings', async () => {
      const res = await request(app)
        .get(`/api/outlets/${testOutletId}/settings`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
    });
    
    it('should update settings', async () => {
      const res = await request(app)
        .put(`/api/outlets/${testOutletId}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          settings: {
            receipt_header: 'Test Header',
            receipt_footer: 'Test Footer'
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.settings.receipt_header).toBe('Test Header');
    });
  });
});
```

## Monitoring and Logging

### Health Check Endpoint

```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});
```

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'nashty-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log all requests
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip
  });
  next();
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Review all migration scripts
- [ ] Test migrations on staging database
- [ ] Review environment variables
- [ ] Build and test backend locally

### Phase 1: Database
- [ ] Run 001_create_missing_tables.sql
- [ ] Verify tables created: favorites, outlet_settings, token_blacklist, analytics_cache
- [ ] Run 002_deploy_indexes.sql
- [ ] Run VACUUM ANALYZE
- [ ] Verify query performance improvements
- [ ] Run 003_deploy_rls_policies.sql
- [ ] Test RLS with sample queries
- [ ] Run 004_create_storage_buckets.sql
- [ ] Verify bucket permissions

### Phase 2: Backend API
- [ ] Deploy to Railway: `railway up`
- [ ] Set environment variables
- [ ] Verify health check: GET /health
- [ ] Test auth endpoint: POST /api/auth/refresh
- [ ] Test favorites endpoints
- [ ] Test analytics endpoint
- [ ] Test settings endpoints
- [ ] Run integration test suite

### Phase 3: Edge Functions
- [ ] Deploy auth-login function
- [ ] Deploy dashboard-api function
- [ ] Deploy orders-api function
- [ ] Deploy reports-api function
- [ ] Set SUPABASE_SERVICE_ROLE_KEY secret
- [ ] Test each function with curl

### Phase 4: Frontend Integration
- [ ] Update api-client-v2.js with production URLs
- [ ] Deploy frontends to Cloudflare Pages
- [ ] Test end-to-end flows (login, favorites, analytics, settings)
- [ ] Verify file uploads work

### Phase 5: Monitoring
- [ ] Configure Railway deployment logs
- [ ] Configure Supabase performance monitoring
- [ ] Set up error alerts
- [ ] Set up uptime monitoring
- [ ] Test alert notifications

### Post-Deployment
- [ ] Run performance benchmarks
- [ ] Monitor error logs for 24 hours
- [ ] Generate final audit report
- [ ] Document any issues encountered
- [ ] Plan future optimizations
