# Tasks

## Task 1: Create Database Migration Scripts for Missing Tables
> **depends_on:** []
> **priority:** high
> **status:** not_started

Create SQL migration scripts for missing database tables required by backend API.

**Sub-tasks:**
1. Create `migrations/001_create_missing_tables.sql`
2. Add `favorites` table with UUID primary key, user_id, product_id, position, unique constraint
3. Add `outlet_settings` table with UUID, outlet_id FK, key, value as JSONB, type enum
4. Add `token_blacklist` table with token_hash unique, user_id FK, expires_at
5. Add `analytics_cache` table with cache_key unique, outlet_id FK, data as JSONB, expires_at
6. Add all necessary indexes for each table
7. Add IF NOT EXISTS checks to make script idempotent

**Acceptance Criteria:**
- Migration script creates all 4 missing tables
- All tables have proper foreign key relationships
- Indexes created for performance-critical queries
- Script can be run multiple times safely (idempotent)
- Tables follow existing UUID and timestamp conventions

---

## Task 2: Deploy Database Performance Indexes
> **depends_on:** [1]
> **priority:** high
> **status:** not_started

Deploy 35+ strategic indexes from database-indexes-optimization.sql to production database.

**Sub-tasks:**
1. Review existing `database-indexes-optimization.sql` file
2. Add CREATE INDEX IF NOT EXISTS to all index statements
3. Connect to Supabase production database using provided credentials
4. Execute index creation script via `psql` or Supabase SQL Editor
5. Run VACUUM ANALYZE after index creation
6. Run verification queries to confirm indexes exist
7. Document index deployment in deployment log

**Acceptance Criteria:**
- All 35+ indexes created successfully
- No duplicate index errors
- VACUUM ANALYZE completes successfully
- Verification queries confirm index usage
- Query performance improves by 70-87% for tested queries

---

## Task 3: Deploy Row Level Security Policies
> **depends_on:** [2]
> **priority:** high
> **status:** not_started

Deploy RLS policies from database-rls-policies.sql for multi-tenant data isolation.

**Sub-tasks:**
1. Review existing `database-rls-policies.sql` file
2. Execute helper function creation (auth.tenant_id, auth.outlet_id, etc.)
3. Enable RLS on all 16 core tables
4. Deploy admin policies (full tenant access)
5. Deploy manager policies (outlet-scoped access)
6. Deploy cashier policies (own orders only)
7. Test RLS with sample queries for each role

**Acceptance Criteria:**
- RLS enabled on: tenants, outlets, users, categories, products, orders, order_items, payments, shifts, members, activity_logs, costs, favorites, outlet_settings
- Helper functions created and working
- 40+ policies deployed successfully
- Test queries verify proper access control
- No cross-tenant data leakage

---

## Task 4: Configure Supabase Storage Buckets
> **depends_on:** [1]
> **priority:** high
> **status:** not_started

Create and configure Supabase Storage buckets for receipt logos and promotional images.

**Sub-tasks:**
1. Create `receipts` bucket in Supabase dashboard/SQL
2. Create `promotions` bucket in Supabase dashboard/SQL
3. Set receipts bucket: public read, 2MB limit, PNG/JPG/SVG allowed
4. Set promotions bucket: public read, 5MB limit, PNG/JPG allowed
5. Create RLS policy for authenticated upload on receipts bucket
6. Create RLS policy for authenticated upload on promotions bucket
7. Test file upload and public access

**Acceptance Criteria:**
- Both buckets created with public read access
- File size limits enforced (2MB for receipts, 5MB for promotions)
- MIME type validation working
- RLS policies allow authenticated users to upload
- Test upload succeeds, public URL accessible

---

## Task 5: Update Backend Package.json and Install Dependencies
> **depends_on:** []
> **priority:** high
> **status:** not_started

Ensure all required npm packages are installed for backend deployment.

**Sub-tasks:**
1. Navigate to `backoffice/backend` directory
2. Review package.json for completeness
3. Ensure dependencies include: express, @supabase/supabase-js, cors, helmet, multer, sharp, express-rate-limit, winston, vitest, supertest
4. Run `npm install` to install all dependencies
5. Run `npm audit fix` to resolve security vulnerabilities
6. Verify tsconfig.json is correct
7. Run `npm run build` to test TypeScript compilation

**Acceptance Criteria:**
- All dependencies installed without errors
- No critical security vulnerabilities
- TypeScript compilation succeeds
- Build output directory created with compiled JS files

---

## Task 6: Create .env File for Backend
> **depends_on:** [5]
> **priority:** high
> **status:** not_started

Create production .env file with Supabase and Railway credentials.

**Sub-tasks:**
1. Copy `.env.example` to `.env` in `backoffice/backend`
2. Set `NODE_ENV=production`
3. Set `PORT=5432`
4. Set `CORS_ORIGIN=https://nashtyxolvon2.pages.dev`
5. Set `JWT_SECRET=ZaidunkMargin`
6. Set `DATABASE_MODE=postgres`
7. Set all SUPABASE_* variables from provided credentials
8. Verify .env file is in .gitignore

**Acceptance Criteria:**
- .env file created with all required variables
- Supabase connection details correct
- JWT secret set
- CORS origin matches frontend domain
- .env not tracked by git

---

## Task 7: Test Backend API Locally
> **depends_on:** [5, 6]
> **priority:** high
> **status:** not_started

Start backend server locally and test all API endpoints.

**Sub-tasks:**
1. Run `npm run dev` in `backoffice/backend`
2. Test health check: GET http://localhost:5432/health
3. Test auth refresh: POST /api/auth/refresh with sample token
4. Test favorites GET: GET /api/favorites?userId=test-id
5. Test favorites POST: POST /api/favorites with userId and productId
6. Test analytics: GET /api/analytics/top-products?outletId=test-id
7. Test settings GET: GET /api/outlets/test-id/settings
8. Verify all responses return expected status codes

**Acceptance Criteria:**
- Server starts without errors
- Health check returns 200 with database connected
- All endpoints respond (even if 401/403 without proper auth)
- No TypeScript compilation errors
- Console logs show request/response activity

---

## Task 8: Deploy Backend to Railway
> **depends_on:** [7]
> **priority:** high
> **status:** not_started

Deploy Express backend to Railway cloud platform.

**Sub-tasks:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login to Railway: `railway login`
3. Link to existing project: `railway link --project 610491e6-4a5d-433b-ae87-760711f4a04a`
4. Set environment variables in Railway dashboard (all from .env)
5. Create railway.json with build and deploy config
6. Deploy: `railway up` from backoffice/backend directory
7. Verify deployment logs for successful startup
8. Test production health check endpoint

**Acceptance Criteria:**
- Railway deployment succeeds
- All environment variables set in Railway dashboard
- Health check endpoint returns 200
- Deployment logs show "Server running on port 5432"
- No deployment errors or crashes

---

## Task 9: Create Backend Integration Test Suite
> **depends_on:** [7]
> **priority:** medium
> **status:** not_started

Write comprehensive integration tests for all backend API endpoints.

**Sub-tasks:**
1. Create `backoffice/backend/test/integration` directory
2. Create test file: `api.test.ts`
3. Setup test environment with test database credentials
4. Write tests for auth refresh flow (token rotation, blacklist)
5. Write tests for favorites CRUD (create, read, delete, reorder, 50 limit)
6. Write tests for analytics endpoint (cache hit/miss, aggregation)
7. Write tests for settings endpoints (GET, PUT, upload validation)
8. Write tests for RLS enforcement (different roles)
9. Write tests for error handling (400, 401, 403, 500)

**Acceptance Criteria:**
- Test suite covers all API endpoints
- Tests for success scenarios (200, 201)
- Tests for error scenarios (400, 401, 403)
- Tests verify RLS policies work
- All tests pass: `npm test`
- Test coverage > 80%

---

## Task 10: Migrate Edge Functions to Supabase
> **depends_on:** [1, 3]
> **priority:** medium
> **status:** not_started

Convert existing functions/api/*.js to Supabase Edge Functions format.

**Sub-tasks:**
1. Install Supabase CLI: `npm install -g supabase`
2. Create `supabase/functions` directory structure
3. Migrate `functions/api/auth-login.js` to `supabase/functions/auth-login/index.ts`
4. Migrate `functions/api/dashboard-api.js` to `supabase/functions/dashboard-api/index.ts`
5. Migrate `functions/api/orders-api.js` to `supabase/functions/orders-api/index.ts`
6. Migrate `functions/api/reports-api.js` to `supabase/functions/reports-api/index.ts`
7. Add deno.json to each function directory
8. Update to use Deno-compatible imports

**Acceptance Criteria:**
- 4 edge functions created in supabase/functions/ directory
- Each function has index.ts and deno.json
- Functions use Deno imports (no Node.js APIs)
- Functions compile without errors locally

---

## Task 11: Deploy Edge Functions to Supabase
> **depends_on:** [10]
> **priority:** medium
> **status:** not_started

Deploy all edge functions to Supabase production environment.

**Sub-tasks:**
1. Login to Supabase CLI: `supabase login`
2. Link to project: `supabase link --project-ref mzucfndifneytbesirkx`
3. Set secrets: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
4. Deploy auth-login: `supabase functions deploy auth-login`
5. Deploy dashboard-api: `supabase functions deploy dashboard-api`
6. Deploy orders-api: `supabase functions deploy orders-api`
7. Deploy reports-api: `supabase functions deploy reports-api`
8. Test each function with curl/Postman

**Acceptance Criteria:**
- All 4 functions deployed successfully
- Function URLs accessible
- Functions can connect to Supabase database
- Test requests return expected responses
- Function logs show no errors

---

## Task 12: Update Frontend API Client
> **depends_on:** [8, 11]
> **priority:** high
> **status:** not_started

Update api-client-v2.js with production backend URLs and new methods.

**Sub-tasks:**
1. Open `api-client-v2.js` in project root
2. Replace placeholder backend URL with Railway production URL
3. Add method: `refreshToken(refreshToken)`
4. Add method: `getFavorites(userId)`
5. Add method: `addFavorite(userId, productId)`
6. Add method: `removeFavorite(favoriteId)`
7. Add method: `reorderFavorites(userId, favoritesArray)`
8. Add method: `getTopProducts(outletId, days)`
9. Add method: `getOutletSettings(outletId)`
10. Add method: `updateOutletSettings(outletId, settings)`
11. Add method: `uploadLogo(outletId, file)`
12. Add method: `uploadPromoImages(outletId, files)`
13. Implement automatic token refresh on 401 responses

**Acceptance Criteria:**
- API client has all 10 new methods
- Methods use correct Railway/Supabase URLs
- Automatic token refresh works (intercepts 401, refreshes, retries)
- Request/response logging implemented
- Error handling returns consistent error format

---

## Task 13: Integrate POS Frontend with New API
> **depends_on:** [12]
> **priority:** high
> **status:** not_started

Update POS frontend to use new backend API endpoints.

**Sub-tasks:**
1. Update `pos/frontend/js/services/favorites-manager.js` to use API client methods
2. Update `pos/frontend/js/services/quick-access-grid.js` to fetch favorites from API
3. Update `pos/frontend/js/services/recent-items-tracker.js` to use API
4. Update `pos/frontend/js/auth.js` to use token refresh endpoint
5. Test favorites add/remove/reorder in POS UI
6. Test offline queue sync with new API
7. Verify auto-suggest loads top products from analytics API

**Acceptance Criteria:**
- Favorites load from backend API on POS startup
- Add/remove favorite updates backend
- Drag-drop reorder syncs to backend
- Token refresh works automatically
- Offline changes queue and sync on reconnect
- Auto-suggest shows top products from analytics

---

## Task 14: Integrate Backoffice Frontend with New API
> **depends_on:** [12]
> **priority:** high
> **status:** not_started

Update Backoffice frontend to use new settings API endpoints.

**Sub-tasks:**
1. Update `backoffice/frontend/settings/receipt-settings.html` to load settings from API
2. Add logo upload functionality using `uploadLogo()` method
3. Add promo images upload using `uploadPromoImages()` method
4. Add real-time preview of receipt customizations
5. Implement settings save with `updateOutletSettings()` method
6. Add validation for header (200 char), footer (300 char), promo messages (150 char)
7. Test receipt customization end-to-end

**Acceptance Criteria:**
- Settings page loads current outlet settings
- Logo upload works with preview
- Promo images upload (max 10, 5MB each)
- Settings save to backend successfully
- Real-time preview reflects changes
- Validation prevents oversized inputs

---

## Task 15: Add Security Hardening to Backend
> **depends_on:** [8]
> **priority:** high
> **status:** not_started

Implement security best practices: rate limiting, input validation, HTTPS enforcement.

**Sub-tasks:**
1. Install express-rate-limit: already in package.json
2. Add rate limiter to auth endpoints (10 req/min)
3. Add rate limiter to upload endpoints (5 req/min)
4. Add file upload validation (MIME type, size, extension)
5. Add input sanitization middleware (helmet already installed)
6. Implement parameterized queries (already using Supabase client)
7. Add CSRF protection for state-changing operations
8. Configure HTTPS-only (enforced by Railway)

**Acceptance Criteria:**
- Rate limiting active on /api/auth/* (10 req/min)
- Rate limiting active on upload endpoints (5 req/min)
- File uploads validate MIME type, size, extension
- Helmet.js security headers applied
- All queries use parameterized/ORM approach
- Rate limit returns 429 when exceeded

---

## Task 16: Setup Production Monitoring and Logging
> **depends_on:** [8]
> **priority:** medium
> **status:** not_started

Configure monitoring, logging, and alerting for production backend.

**Sub-tasks:**
1. Install winston logger: already in package.json
2. Configure structured JSON logging with winston
3. Add request logging middleware (log method, path, userId, response time)
4. Configure Railway deployment logs
5. Set up Supabase database performance monitoring
6. Configure error alerts for 5xx responses
7. Configure uptime monitoring for /health endpoint
8. Document alert notification setup (email/Slack)

**Acceptance Criteria:**
- Winston logs to console and file (error.log, combined.log)
- All requests logged with structured data
- Railway logs accessible in dashboard
- Supabase performance monitoring active
- Error alerts configured (even if notification channel not set)
- Health check monitored for uptime

---

## Task 17: Run Performance Benchmarks
> **depends_on:** [2, 3, 8]
> **priority:** medium
> **status:** not_started

Measure query performance improvements after index deployment.

**Sub-tasks:**
1. Create benchmark script: `scripts/benchmark.ts`
2. Measure dashboard query time (orders count, revenue sum, by outlet + date range)
3. Measure KDS query time (pending/preparing orders for outlet)
4. Measure order history query time (paginated orders for outlet)
5. Measure product search query time (full-text search on names)
6. Measure activity logs query time (recent logs for tenant)
7. Run each query 100 times, calculate average
8. Generate benchmark report comparing before/after

**Acceptance Criteria:**
- Benchmark script runs without errors
- Dashboard query: 3.2s → <1.5s (53% improvement)
- KDS query: 120ms → <30ms (75% improvement)
- Order history: 150ms → <20ms (87% improvement)
- Product search: 80ms → <15ms (81% improvement)
- Activity logs: 200ms → <40ms (80% improvement)
- Benchmark report saved to `PERFORMANCE_BENCHMARK_REPORT.md`

---

## Task 18: Write Deployment Documentation
> **depends_on:** [1, 2, 3, 4, 8, 11]
> **priority:** medium
> **status:** not_started

Create comprehensive deployment guide for future deployments.

**Sub-tasks:**
1. Create `DEPLOYMENT_GUIDE.md` in project root
2. Document Railway deployment steps (CLI, env vars, deploy command)
3. Document Supabase configuration (Storage, RLS, indexes)
4. Document edge function deployment (CLI, secrets, deploy command)
5. Document database migration execution order
6. Document rollback procedures for failed deployments
7. Document environment variable requirements
8. Create deployment checklist (pre-deploy, deploy, post-deploy)

**Acceptance Criteria:**
- Deployment guide covers all services (Railway, Supabase, Edge Functions)
- Step-by-step instructions with commands
- Rollback procedures documented
- Deployment checklist included
- Environment variable reference table
- Troubleshooting section for common issues

---

## Task 19: Execute Database Migrations in Production
> **depends_on:** [1, 2, 3, 4]
> **priority:** critical
> **status:** not_started

Execute all database migrations on Supabase production database.

**Sub-tasks:**
1. Backup production database via Supabase dashboard
2. Connect to production database: `psql -h mzucfndifneytbesirkx.supabase.co -U postgres`
3. Execute 001_create_missing_tables.sql
4. Verify tables created: SELECT * FROM favorites LIMIT 1; (etc.)
5. Execute 002_deploy_indexes.sql (database-indexes-optimization.sql)
6. Run VACUUM ANALYZE;
7. Execute 003_deploy_rls_policies.sql (database-rls-policies.sql)
8. Test RLS with sample queries for admin/cashier roles
9. Document migration execution in deployment log

**Acceptance Criteria:**
- Database backup completed
- All 4 new tables created (favorites, outlet_settings, token_blacklist, analytics_cache)
- 35+ indexes created successfully
- VACUUM ANALYZE completes
- RLS enabled on 16 tables
- 40+ policies created
- Test queries verify RLS works
- No errors in migration execution

---

## Task 20: Run End-to-End Integration Tests
> **depends_on:** [8, 11, 12, 13, 14, 19]
> **priority:** critical
> **status:** not_started

Test complete user workflows from frontend to backend to database.

**Sub-tasks:**
1. Test POS login flow (frontend → backend auth → database)
2. Test adding favorite product (POS → backend API → database → verify in favorites table)
3. Test removing favorite (POS → backend API → database → verify deletion)
4. Test reordering favorites (POS drag-drop → backend API → database → verify position)
5. Test offline order creation (POS offline → IndexedDB → sync to backend → database)
6. Test analytics loading (POS auto-suggest → backend API → analytics_cache → database aggregation)
7. Test receipt settings (Backoffice → backend API → outlet_settings → database)
8. Test logo upload (Backoffice → backend API → Supabase Storage → database URL)
9. Verify RLS prevents cross-tenant access
10. Generate integration test report

**Acceptance Criteria:**
- All 8 workflows complete successfully
- Data flows correctly through all layers
- RLS policies enforce tenant isolation
- File uploads work with Storage
- Offline sync works correctly
- Analytics cache works
- No errors in browser console
- Integration test report generated

---

## Task 21: Conduct Final System Audit
> **depends_on:** [20]
> **priority:** critical
> **status:** not_started

Perform comprehensive audit to verify 100/100 system score.

**Sub-tasks:**
1. Verify all database tables exist (22 total including 4 new)
2. Verify all indexes deployed (35+)
3. Verify RLS policies active (40+ policies on 16 tables)
4. Verify all backend endpoints working (auth, favorites, analytics, settings)
5. Verify edge functions deployed (4 functions)
6. Verify Storage buckets configured (receipts, promotions)
7. Verify security hardening applied (rate limiting, validation)
8. Verify monitoring and logging active
9. Verify performance benchmarks meet targets
10. Calculate final system score based on audit criteria

**Acceptance Criteria:**
- Database: 100% (all tables, indexes, RLS policies deployed)
- Backend API: 100% (all endpoints working, tested)
- Security: 100% (RLS, rate limiting, validation, HTTPS)
- Performance: 100% (70-87% improvements verified)
- Monitoring: 100% (logging, alerts configured)
- Documentation: 100% (deployment guide, API docs complete)
- Overall Score: 100/100
- Final audit report generated: `FINAL_SYSTEM_AUDIT_100.md`

---

## Task 22: Create Production Deployment Checklist
> **depends_on:** [21]
> **priority:** medium
> **status:** not_started

Create final checklist for production deployment and maintenance.

**Sub-tasks:**
1. Create `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
2. Add pre-deployment checks (backup, review changes, test staging)
3. Add deployment steps (database migrations, backend deploy, edge functions)
4. Add post-deployment verification (health checks, smoke tests, monitoring)
5. Add rollback procedures (database restore, previous Railway deployment)
6. Add maintenance tasks (weekly backups, monthly index rebuilds, quarterly audits)
7. Add emergency contacts and escalation procedures

**Acceptance Criteria:**
- Checklist covers all deployment phases
- Pre-deployment, deployment, post-deployment sections
- Rollback procedures clearly documented
- Maintenance schedule defined
- Emergency procedures documented
- Checklist reviewed and approved
