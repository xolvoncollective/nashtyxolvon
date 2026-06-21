# PROBLEM REPORT - NASHTY OS Architecture Issues

**Document Created**: 2026-06-21  
**Purpose**: Categorized list of issues, inconsistencies, and technical debt  
**Status**: Read-Only Documentation - Issues identified, NOT fixed

---

## 🚨 CRITICAL ISSUES (Breaking Functionality)

### 1. Missing API Methods (KDS Settings)

**Location**: `/backoffice/frontend/js/pages/kds.js`

**Problem**:
```javascript
// Called in UI but NOT DEFINED in api-client.js
API.kds.updateCategoryProductionTime(catId, timeMinutes)
API.kds.getAnalytics()
```

**Impact**:
- "Ubah Target" button in KDS Time page → Runtime error
- KDS Analytics page → Cannot load data

**Root Cause**: `API.kds` namespace doesn't exist in `/api-client.js`

**Affected Features**:
- Backoffice → KDS → Production Time Configuration
- Backoffice → KDS → Analytics Dashboard

**Recommended Fix**: Implement missing methods in `/api-client.js` or remove UI buttons

---

### 2. Syntax Error in System Page

**Location**: `/backoffice/frontend/js/pages/system.js`

**Problem**:
```javascript
// Line ~200
};  // ← Extra semicolon + closing brace after PAGES.settings definition
```

**Impact**:
- All code after this line may not execute
- `PAGES.actlogs` and subsequent definitions broken
- Node/browser parsers may fail

**Verification**:
```bash
node --check backoffice/frontend/js/pages/system.js
# → SyntaxError: Unexpected token '}'
```

**Affected Features**:
- Activity Logs page
- Any page modules defined after the error

**Recommended Fix**: Remove the extra `};`

---

### 3. QRIS Upload Not Synced to Backend

**Location**: `/backoffice/frontend/js/pages/system.js`

**Problem**:
```javascript
window.uploadQRIS = async function(file) {
  // Only writes to localStorage
  localStorage.setItem('nashty_qris_static', base64);
  // Does NOT call API.outletSettings.uploadQris()
}
```

**Impact**:
- QRIS image only saved locally in browser
- Not synced to database or Supabase Storage
- Lost when user clears cache or switches browser
- POS cannot access QRIS image

**Backend Routes Exist But Unused**:
- `POST /api/outlets/:id/qris/upload`
- `DELETE /api/outlets/:id/qris`
- `API.outletSettings.uploadQris(file)` implemented in api-client.js

**Recommended Fix**: Call `API.outletSettings.uploadQris(file)` instead of localStorage

---

### 4. Export Logs Handler Mismatch

**Location**: `/backoffice/frontend/js/pages/activity-logs.js`

**Problem**:
```javascript
// HTML button:
<button onclick="exportLogs()">Export CSV</button>

// Function exposed as:
window.activityLogsModule = { updateFilter, exportLogs };

// Actual call needed:
activityLogsModule.exportLogs()
```

**Impact**:
- "Export CSV" button → `exportLogs is not defined` error
- Cannot export activity logs

**Recommended Fix**: Change button to `onclick="activityLogsModule.exportLogs()"` or expose `exportLogs` globally

---

## ⚠️ BROKEN FEATURES (Non-Functional But Non-Critical)

### 5. No Refresh Token Implementation

**Location**: Multiple files

**Problem**:
- `auth-login` Edge Function generates refresh tokens
- Tokens stored in session
- But NO refresh endpoint exists
- NO code consumes refresh tokens
- Sessions expire and users must re-login

**Documented But Not Implemented**:
```
POST /api/auth/refresh  ← DOES NOT EXIST
POST /api/auth/logout   ← DOES NOT EXIST
GET /api/auth/validate  ← DOES NOT EXIST
```

**Impact**:
- Users kicked out after 1h (manager) or 12h (cashier)
- Poor UX during long shifts

**Recommended Fix**: Implement refresh token endpoint or increase access token expiry

---

### 6. Search/Filter Logs Placeholder

**Location**: `/backoffice/frontend/js/pages/system.js`

**Problem**:
```javascript
// All these just show toast
onSearchLogs() { toast('Fitur pencarian logs menyusul') }
onFilterModule() { toast('Fitur filter menyusul') }
onFilterDate() { toast('Fitur filter menyusul') }
```

**Impact**:
- Cannot search activity logs
- Cannot filter by module or date
- Large log tables unusable

**Recommended Fix**: Implement actual filter logic with Supabase queries

---

### 7. Upload Product Image Placeholder

**Location**: `/backoffice/frontend/js/pages/menu.js`

**Problem**:
```javascript
// Upload zone exists but:
toast('Upload foto - coming soon')
```

**Impact**:
- Cannot upload product images from Backoffice
- Must manually add image URLs

**Note**: `API.products.uploadImage(file)` IS implemented in api-client.js

**Recommended Fix**: Wire up file input to `API.products.uploadImage()`

---

### 8. Upload Receipt Logo Placeholder

**Location**: `/backoffice/frontend/js/pages/pos.js`

**Problem**:
```javascript
toast('Upload logo belum tersedia, menggunakan logo default')
```

**Impact**:
- Cannot customize receipt logos
- All receipts use default branding

**Note**: `API.outletSettings.uploadLogo(file)` IS implemented

**Recommended Fix**: Wire up file input to `API.outletSettings.uploadLogo()`

---

### 9. Export Outlet Data Placeholder

**Location**: `/backoffice/frontend/js/pages/business.js`

**Problem**:
```javascript
toast('Fitur export belum tersedia')
```

**Impact**:
- Cannot export outlet data
- Manual data entry required for external systems

**Recommended Fix**: Implement CSV export

---

## 🔄 DUPLICATED LOGIC

### 10. Multiple API Client Implementations

**Problem**:
```
/api-client.js               ← Main API client (used by POS, Backoffice, Cost)
/kds/frontend/js/api.js      ← Separate KDS API client
/crm/frontend/js/app.js      ← Inline API calls
```

**Impact**:
- Inconsistent error handling
- Duplicated authentication logic
- Hard to maintain
- Breaking changes affect multiple files

**Examples**:
```javascript
// api-client.js uses:
API.orders.create(orderData)

// kds/frontend/js/api.js duplicates:
API.orders.getKDSQueue()
API.orders.updateKitchenStatus()
```

**Recommended Fix**: Unify to single API client used by all frontends

---

### 11. Inconsistent Auth Storage

**Problem**:
```javascript
// Main session
localStorage.setItem('nashty_main_session', ...)

// Staff session
localStorage.setItem('nashty_session', ...)

// KDS session
localStorage.setItem('nashty_kds_session', ...)

// POS compat keys
localStorage.setItem('nashty_token', ...)
localStorage.setItem('nashty_user', ...)
localStorage.setItem('nashty_outlet', ...)
```

**Impact**:
- 6+ localStorage keys for authentication
- Confusing session management
- Potential state conflicts

**Recommended Fix**: Unified session management with single storage key

---

### 12. Duplicate Menu Data Structures

**Problem**:
```javascript
// POS app.js:
MENU = [{ id, cat, n, p, ico, d, sold, opts, addons }]

// Supabase response:
products = [{ id, category_id, name, price, description, ... }]
```

**Impact**:
- Transformation logic duplicated
- Different field names
- Hard to sync changes

**Recommended Fix**: Standardize data structures across frontend/backend

---

## 🗑️ UNUSED / DEAD CODE

### 13. Legacy Express Backend

**Location**: `/backoffice/backend/`

**Problem**:
- Express server defined with routes
- But Cloudflare Pages deployment is **frontend-only**
- Express server **never runs** in production
- Only a few routes partially active (favorites, analytics)

**Active Routes** (minimal usage):
```
POST /api/favorites
GET /api/analytics/top-products
PUT /api/outlets/:id/receipt-settings
POST /api/outlets/:id/qris/upload
```

**Dead Routes**:
```
GET /api/auth/login       ← Uses Edge Function instead
POST /api/auth/refresh    ← Never implemented
GET /api/dashboard/*      ← Uses Edge Function
POST /api/orders/*        ← Uses Edge Function
```

**Impact**:
- Confusing codebase (which backend is real?)
- Maintenance burden
- Outdated documentation references

**Recommended Fix**: 
- Option A: Fully migrate to Edge Functions + remove Express
- Option B: Deploy Express backend separately + document clearly

---

### 14. Unused Cost Database Table

**Location**: Schema defines `nashtycosts` table

**Problem**:
- Cost module uses **localStorage ONLY**
- Database table exists but never queried
- INSERT/UPDATE/DELETE never called

**Code**:
```javascript
// /cost/frontend/js/data.js
localStorage.setItem('nashty_costs', ...)  // ← Used
// NO Supabase queries
```

**Impact**:
- Data not portable across devices
- No backup or sync
- Lost on cache clear

**Recommended Fix**: Either use database or remove table from schema

---

### 15. Unused CRM Rewards Table

**Problem**:
- `nashty_rewards` in localStorage
- No database table defined
- No sync mechanism
- Rewards lost on browser change

**Recommended Fix**: Create database table + sync logic

---

### 16. Unused Service Worker Files

**Location**: `/pos/frontend/js/services/offline-manager.js`

**Problem**:
- File referenced in documentation
- But **file does not exist** in codebase
- Likely renamed or merged into other files

**Impact**:
- Broken imports if referenced
- Documentation mismatch

**Recommended Fix**: Update documentation or create file

---

## ⚡ RISKY PATTERNS

### 17. Hardcoded Credentials

**Location**: Multiple files

**Problem**:
```javascript
// api-client.js
const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';  // ← Exposed anon key (acceptable)

// auth-login/index.ts
const JWT_SECRET = 'ZaidunkMargin';  // ← Hardcoded secret (RISKY)
```

**Impact**:
- JWT secret in code (should be env var)
- Cannot rotate secrets without code change
- Security risk if repo is public

**Note**: Supabase anon key is **acceptable** to hardcode (designed for client-side)

**Recommended Fix**: Move JWT_SECRET to environment variables only

---

### 18. No Input Validation

**Problem**:
- Frontend sends data directly to Edge Functions
- No schema validation (Zod, Joi, etc.)
- SQL injection risk mitigated by Supabase client (parameterized)
- But business logic validation missing

**Examples**:
```javascript
// No validation on:
- Order totals (could be negative)
- Product prices (could be negative)
- Quantities (could be 0 or negative)
- Email format
- Phone format
```

**Impact**:
- Data integrity issues
- Potential bugs
- Poor user experience (errors at database level)

**Recommended Fix**: Add input validation layer (frontend + backend)

---

### 19. Polling Instead of Real-Time

**Problem**:
```javascript
// KDS polling every 5 seconds
setInterval(fetchOrders, 5000);

// POS menu refresh every 60 seconds
setInterval(fetchMenuData, 60000);
```

**Impact**:
- High server load (N outlets × M KDS screens × 12 requests/min)
- Battery drain on mobile devices
- Not truly real-time (up to 5s delay)
- Wasted bandwidth

**Alternative Available**: Supabase Realtime (WebSocket-based)

**Recommended Fix**: Migrate to Supabase Realtime subscriptions

---

### 20. No Rate Limiting

**Problem**:
- No rate limiting on Edge Functions
- No request throttling on client
- Potential for abuse or accidental DOS

**Impact**:
- Supabase costs could spike
- Service degradation under load

**Recommended Fix**: Implement rate limiting (Supabase Edge Functions middleware)

---

### 21. Unencrypted LocalStorage (Outside POS)

**Problem**:
- POS uses AES-256-GCM for offline orders ✅
- But other modules store sensitive data unencrypted:
  - Auth tokens (somewhat acceptable, short-lived)
  - Customer data (CRM)
  - Cost data

**Impact**:
- Data exposed to XSS attacks
- Browser extensions can read
- Forensic recovery possible

**Recommended Fix**: Encrypt all sensitive localStorage data

---

## 🤔 UNCLEAR / CONFUSING PATTERNS

### 22. Mixed Storage Strategies

**Problem**:
```
POS:        IndexedDB + localStorage + Supabase
KDS:        Supabase only
Backoffice: Supabase only
Cost:       localStorage only
CRM:        Supabase + localStorage fallback
```

**Impact**:
- Developers confused about where data lives
- Inconsistent offline behavior
- Hard to debug data issues

**Recommended Fix**: Document clear storage strategy per module

---

### 23. Inconsistent Field Naming

**Problem**:
```javascript
// Database
order_type, table_number, created_at

// POS Frontend
type, table, time

// API Response
orderType, tableNumber, createdAt
```

**Impact**:
- Mapping logic everywhere
- Bugs from field name typos
- Hard to maintain

**Recommended Fix**: Standardize to camelCase everywhere (database + code)

---

### 24. Order Type Confusion

**Problem**:
```javascript
// Multiple formats for same thing:
'dine-in', 'dine', 'Dine In'
'takeaway', 'take', 'Take Away'
'gofood', 'GoFood', 'Gofood'
'grabfood', 'GrabFood', 'Grabfood'
'shopee', 'shopeefood', 'ShopeeFood'
```

**Seen in**:
- POS app.js (CART logic)
- orders-api Edge Function (normalization)
- Database constraints (dine-in | takeaway only)

**Impact**:
- Data inconsistency
- Query bugs
- Display issues

**Recommended Fix**: Enum standardization + validation

---

### 25. Missing Database Tables

**Problem**:
```javascript
// Referenced in code but NOT in schema
outlet_settings    // settings-api Edge Function
analytics_cache    // analytics-api Edge Function
```

**Impact**:
- Edge Functions may fail
- Caching doesn't work as expected
- Features partially broken

**Recommended Fix**: Add missing tables to schema + migrations

---

### 26. Unclear Modifier Data Structure

**Problem**:
```sql
-- Schema defines:
order_item_modifiers (id, order_item_id, modifier_option_id, ...)

-- But code uses:
order_items.modifier_options JSON field
```

**Impact**:
- Relational table unused
- JSON field used instead
- Database normalization broken

**Recommended Fix**: Choose one approach (relational OR JSON) and stick to it

---

### 27. No Error Boundary

**Problem**:
- Frontend has no global error catching
- Uncaught promise rejections crash UI
- No fallback UI for errors

**Examples**:
```javascript
// No try-catch in many async functions
async function fetchMenuData() {
  const res = await API.menu.getOutletMenu();  // ← Could throw
  // No error handling
}
```

**Impact**:
- White screen of death on errors
- Poor user experience
- No error reporting

**Recommended Fix**: Add global error boundary + try-catch wrappers

---

### 28. Inconsistent Auth Headers

**Problem**:
```javascript
// Edge Function expects:
Authorization: Bearer {SUPABASE_ANON_KEY}
x-nashty-token: {USER_JWT}

// But some clients send:
Authorization: Bearer {USER_JWT}  // ← Wrong
```

**Impact**:
- Confusing authentication flow
- Hard to debug 401 errors
- Inconsistent between modules

**Documented in**: `AUTH & API.md` but not enforced

**Recommended Fix**: Standardize auth middleware

---

## 📊 PERFORMANCE CONCERNS

### 29. No Pagination

**Problem**:
```javascript
// Loads ALL products
API.products.getAll()

// Loads ALL orders
API.orders.getAll({ limit: 1000 })

// Loads ALL activity logs
API.request('/activity-logs')  // ← Hardcoded limit: 50
```

**Impact**:
- Slow page loads for large catalogs
- Memory issues
- Poor mobile experience

**Recommended Fix**: Implement cursor-based pagination

---

### 30. No Query Optimization

**Problem**:
- N+1 query pattern in menu loading:
```javascript
// Gets categories
SELECT * FROM categories
// Then for each category:
SELECT * FROM products WHERE category_id = ?
```

**Impact**:
- Slow menu load
- Multiple round trips

**Recommended Fix**: Use JOIN queries or eager loading

---

### 31. Large Payload Sizes

**Problem**:
- Menu data includes all modifiers + options
- No lazy loading
- Large JSON responses

**Example**:
```javascript
// Returns entire product catalog with modifiers
API.menu.getOutletMenu()  // ← Could be 100+ KB
```

**Impact**:
- Slow initial load
- High bandwidth usage

**Recommended Fix**: Implement lazy loading for modifiers

---

## 🧪 TESTING GAPS

### 32. No Unit Tests

**Problem**:
- `vitest` installed but no test files
- No test coverage
- Features break silently

**Recommended Fix**: Add unit tests for critical paths

---

### 33. No E2E Tests

**Problem**:
- `@playwright/test` installed but minimal usage
- No automated flow testing

**Recommended Fix**: Add E2E tests for core flows (order creation, login, etc.)

---

### 34. No API Contract Testing

**Problem**:
- Edge Functions can change response format
- Frontend breaks silently

**Recommended Fix**: Add API schema validation tests

---

## 🔒 SECURITY GAPS

### 35. No CSRF Protection

**Problem**:
- No CSRF tokens
- Pure API-based (somewhat mitigated)
- But form submissions vulnerable

**Recommended Fix**: Add CSRF protection for state-changing operations

---

### 36. No Content Security Policy

**Problem**:
- No CSP headers
- XSS risk

**Recommended Fix**: Add CSP headers via Cloudflare Pages

---

### 37. JWT Secret Exposure

**Already mentioned in #17** - Duplicate

---

## 📋 DOCUMENTATION ISSUES

### 38. Outdated AUTH & API.md

**Problem**:
- Documents routes that don't exist
- References old Express backend
- Doesn't match Edge Functions

**Recommended Fix**: Update documentation to match current architecture

---

### 39. Missing Developer Setup Guide

**Problem**:
- No CONTRIBUTING.md
- No local development instructions
- No Edge Function testing guide

**Recommended Fix**: Add developer documentation

---

## 🎯 PRIORITY RANKING

### P0 - Fix Immediately (Blocking)
1. #2 - Syntax error in system.js
2. #1 - Missing API.kds methods
3. #3 - QRIS upload not synced

### P1 - Fix Soon (Major Features Broken)
4. #4 - Export logs handler
5. #5 - Refresh token not implemented
6. #17 - Hardcoded JWT secret

### P2 - Fix Eventually (Minor Features/UX)
7. #6-9 - Placeholder features
8. #19 - Polling vs real-time
9. #22-28 - Architectural confusion

### P3 - Technical Debt (Non-Blocking)
10. #10-16 - Duplicated/unused code
11. #29-31 - Performance optimizations
12. #32-34 - Testing gaps
13. #35-36 - Security hardening

---

## 📈 ESTIMATED IMPACT

**High Impact** (Affects production users):
- Critical issues #1-4
- Risky patterns #17-21

**Medium Impact** (Affects developers):
- Duplicated logic #10-12
- Unclear patterns #22-28

**Low Impact** (Future improvements):
- Dead code #13-16
- Performance #29-31
- Testing #32-34

---

**End of Problem Report**

**Total Issues Identified**: 39 distinct problems across 8 categories
