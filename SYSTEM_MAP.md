# SYSTEM MAP - NASHTY OS Architecture Archaeology

**Document Created**: 2026-06-21  
**Purpose**: Complete system architecture mapping based on codebase exploration  
**Status**: Read-Only Documentation (No modifications made)

---

## 🏗️ Overall System Architecture

NASHTY OS is a **serverless SaaS restaurant management system** with 5 independent frontend modules connected to a shared Supabase backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│  Cloudflare Pages (Static Host)  │
│  nashtyxolvon2.pages.dev         │
│                                  │
│  ├─ /                 (Gateway)  │
│  ├─ /pos/frontend/    (POS)     │
│  ├─ /kds/frontend/    (KDS)     │
│  ├─ /backoffice/frontend/       │
│  ├─ /cost/frontend/             │
│  └─ /crm/frontend/              │
└──────────────────────────────────┘
           │
           │ HTTPS
           ▼
┌──────────────────────────────────┐
│   Supabase Backend               │
│   mzucfndifneytbesirkx           │
│                                  │
│  ├─ PostgreSQL Database          │
│  ├─ Edge Functions (Deno)        │
│  ├─ Storage Buckets              │
│  ├─ Auth (Custom JWT)            │
│  └─ PostgREST API                │
└──────────────────────────────────┘
```

---

## 📦 Application Structure

### 1. Root Level (Shared Infrastructure)

**Location**: `/` (root directory)

**Key Files**:
- `api-client.js` - **Central API abstraction layer** (v3.1)
- `index.html` - Main gateway/login page
- `wrangler.json` - Cloudflare Pages configuration
- `package.json` - Project dependencies (Supabase JS, Playwright, Vitest)

**Purpose**: 
- Single source of truth for all API communication
- Shared authentication layer
- Application routing gateway
- Deployment configuration

---

### 2. POS (Point of Sale) System

**Location**: `/pos/frontend/`

**Structure**:
```
pos/frontend/
├── index.html                    # Main POS interface
├── customer-display.html         # Secondary screen
├── sw.js                         # Service Worker v2.0.0
├── manifest.json                 # PWA manifest
├── components/
│   └── quick-access-grid.html    # Favorites grid component
├── css/                          # 9 CSS files (modular)
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── modal.css
│   ├── offline.css
│   ├── connection-monitor.css
│   ├── pages.css
│   └── utilities.css
├── js/
│   ├── app.js                    # Main application logic
│   ├── auth.js                   # Authentication
│   ├── cart.js                   # Cart management
│   ├── products.js               # Product catalog
│   ├── orders.js                 # Order processing
│   ├── history.js                # Order history
│   ├── modifiers.js              # Modifier management
│   ├── printer.js                # Receipt printing
│   ├── android-printer.js        # Android printer integration
│   ├── modal.js                  # Modal dialogs
│   ├── state.js                  # Global state
│   ├── utils.js                  # Utilities
│   ├── db-schema.js              # IndexedDB schema
│   ├── offline-init.js           # Offline initialization
│   ├── sw-register.js            # Service worker registration
│   ├── sw-update-manager.js      # SW update handling
│   └── services/                 # Service layer (12 modules)
│       ├── cache-manager.js
│       ├── connection-monitor.js
│       ├── customer-display-manager.js
│       ├── encryption-service.js  # AES-256-GCM
│       ├── favorites-manager.js
│       ├── keyboard-shortcuts.js
│       ├── offline-order-handler.js
│       ├── offline-queue.js
│       ├── quick-access-grid.js
│       ├── receipt-generator.js
│       ├── recent-items-tracker.js
│       └── sync-manager.js
└── settings/
    └── keyboard-shortcuts.html
```

**Key Features**:
- **Offline-first architecture** with IndexedDB + Service Worker
- **Favorites system** with drag-drop reordering
- **Keyboard shortcuts** (F1-F12 support)
- **Multi-screen support** (customer display)
- **Receipt customization** per outlet
- **Encrypted offline storage** (AES-256-GCM)
- **Sync manager** for order queue processing
- **Connection monitor** with auto-reconnect

**Technologies**:
- Vanilla JavaScript (no framework)
- Service Worker v2.0.0
- IndexedDB for offline data
- Web Crypto API for encryption

---

### 3. KDS (Kitchen Display System)

**Location**: `/kds/frontend/`

**Structure**:
```
kds/frontend/
├── index.html           # Single-page KDS interface
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── kds.css
│   ├── cards.css
│   ├── urgency.css
│   └── modal.css
└── js/
    ├── app.js           # Main KDS logic
    ├── api.js           # KDS-specific API client
    ├── ui.js            # UI rendering
    ├── sound.js         # Sound notifications
    ├── config.js        # Configuration
    └── orders.js        # Order state management
```

**Key Features**:
- **Real-time order queue** with auto-refresh (5s interval)
- **Swipe-to-complete** workflow
- **Production time tracking** per category
- **Urgency alerts** (on-time, warning, overdue)
- **Sound notifications** with escalation
- **Kitchen notes** high visibility
- **Multi-station support**
- **Day/night mode** toggle

**Integration**:
- Uses dedicated `api.js` (separate from main api-client)
- PIN-based staff login
- Direct Supabase queries for orders
- WebSocket-style polling (not true WebSocket)

---

### 4. Backoffice (Management Dashboard)

**Location**: `/backoffice/frontend/`

**Structure**:
```
backoffice/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── nav.js                # Navigation
│   │   ├── data.js               # Data fetching
│   │   ├── utils.js              # Utilities
│   │   └── pages/                # Page modules (10 files)
│   │       ├── dashboard.js
│   │       ├── menu.js           # Products, categories, modifiers
│   │       ├── team.js           # User management
│   │       ├── business.js       # Outlets
│   │       ├── activity-logs.js
│   │       ├── pos.js            # POS settings
│   │       ├── kds.js            # KDS settings
│   │       ├── system.js         # System settings
│   │       ├── costs.js
│   │       └── engineering.js
│   └── settings/
│       ├── receipt-settings.html
│       └── qris-settings.html
└── backend/                       # LEGACY (mostly unused)
    ├── server.js                  # Express server
    ├── supabaseClient.js
    ├── routes/                    # 5 route files
    │   ├── analytics.js
    │   ├── display-settings.js
    │   ├── favorites.js
    │   ├── qris-upload.js
    │   └── receipt-settings.js
    └── migrations/
        ├── add_favorites_and_settings.sql
        └── add_qris_static.sql
```

**Key Modules**:

1. **Dashboard** - KPIs, revenue, charts, top products
2. **Menu Management** - Categories, products, modifiers, pricing
3. **Team** - Users, roles, permissions, PIN codes
4. **Business** - Outlets, locations, branding
5. **POS Configuration** - Receipt settings, payment methods, tax
6. **KDS Configuration** - Workflow, alerts, production times
7. **Activity Logs** - Audit trail with export
8. **Reports** - Sales, products, cashiers, menu engineering
9. **System** - Settings, QRIS, integrations
10. **Costs** - Operational expense tracking

**Backend Status**:
- **Legacy Express server exists** but mostly bypassed
- **Primary backend**: Supabase Edge Functions
- Some routes still active: `/api/favorites`, `/api/analytics/top-products`, `/api/outlets/:id/receipt-settings`, `/api/outlets/:id/qris`

---

### 5. Cost Management

**Location**: `/cost/frontend/`

**Structure**:
```
cost/frontend/
├── index.html
├── css/
│   └── app.css
└── js/
    ├── app.js
    └── data.js
```

**Features**:
- **Operational expense tracking**
- Categories: bahan-baku, operasional, gaji, utilitas, sewa, lainnya
- Daily/weekly/monthly views
- Total cost calculations
- Export to Excel

**Storage**: 
- **LocalStorage-based** (NOT database)
- Key: `nashty_costs` (tenant-scoped)

---

### 6. CRM (NashtyPeople)

**Location**: `/crm/frontend/`

**Structure**:
```
crm/frontend/
├── index.html
├── css/
│   └── app.css
└── js/
    ├── app.js
    ├── customers.js
    ├── rewards.js
    └── utils.js
```

**Features**:
- **Customer database**
- **Point rewards system**
- **Membership tiers**
- **Purchase history**
- **Loyalty program integration**

**Storage**: 
- **Hybrid**: Supabase `members` table + localStorage fallback
- Keys: `nashty_customers`, `nashty_rewards`, `nashty_point_txs`

---

## 🔌 API Architecture

### API Client v3.1 (`/api-client.js`)

**Central facade** exposing unified API methods to all frontends.

**Layers**:

1. **Edge Function Requests**
   - `API.edgeRequest(functionName, body)`
   - CRITICAL: Uses `SUPABASE_ANON_KEY` in Authorization header
   - User token sent via custom header `x-nashty-token`

2. **Direct Supabase Queries**
   - `API.supabase.from(table).select()...`
   - Used for simple CRUD operations
   - Tables: users, categories, products, modifiers, outlets, shifts

3. **LocalStorage Fallbacks**
   - Cost management (costs)
   - CRM (customers, rewards, transactions)

**Session Management**:
```javascript
API.session = {
  admin: null,           // Admin/manager user
  adminToken: null,      // Main auth token
  token: null,           // Staff PIN token
  refreshToken: null,    // Refresh token
  user: null,            // Current user
  tenantId: null,        // Tenant ID (SaaS isolation)
  outletId: null,        // Outlet ID
  shiftId: null          // Active shift
}
```

**Storage Keys**:
- `nashty_main_session` - Admin/manager session
- `nashty_session` - Staff PIN session
- `nashty_kds_session` - KDS session
- `nashty_token`, `nashty_user`, `nashty_outlet` - POS compat keys

---

### Supabase Edge Functions

**Location**: `/supabase/functions/`

**Functions** (7 total):

1. **auth-login** (`/functions/v1/auth-login`)
   - Actions: `main-login`, `superadmin-login`, `pin-login`
   - JWT generation (HS256)
   - Refresh token support
   - Activity logging

2. **orders-api** (`/functions/v1/orders-api`)
   - Actions: `create`, `get-orders`, `update-status`, `start-shift`, `end-shift`
   - Order number generation
   - Kitchen status management

3. **dashboard-api** (`/functions/v1/dashboard-api`)
   - Actions: `kpi`, `recent-orders`, `weekly-chart`
   - Real-time KPIs
   - Payment method breakdown
   - Growth calculation

4. **favorites-api** (`/functions/v1/favorites-api`)
   - Actions: `get`, `add`, `remove`, `reorder`
   - Product favorites management
   - Position tracking

5. **analytics-api** (`/functions/v1/analytics-api`)
   - Top products with trends
   - Memory cache TTL 6 hours
   - Database cache table

6. **reports-api** (`/functions/v1/reports-api`)
   - Actions: `sales`, `top-products`
   - Sales summary
   - Payment method breakdown

7. **settings-api** (`/functions/v1/settings-api`)
   - Actions: `get`, `update`, `upload-logo`
   - Outlet settings management
   - Receipt/display configuration

**Runtime**: Deno with `@supabase/supabase-js@2`

---

### Legacy Express Backend

**Location**: `/backoffice/backend/server.js`

**Status**: Partially active

**Active Routes**:
- `GET /health`
- `POST /api/favorites`
- `GET /api/favorites?userId=...`
- `DELETE /api/favorites/:productId`
- `PUT /api/favorites/reorder`
- `GET /api/analytics/top-products`
- `GET /api/outlets/:id/receipt-settings`
- `PUT /api/outlets/:id/receipt-settings`
- `GET /api/outlets/:id/display-settings`
- `PUT /api/outlets/:id/display-settings`
- `GET /api/outlets/:id/qris`
- `POST /api/outlets/:id/qris/upload`
- `DELETE /api/outlets/:id/qris`

**Deployment**: Not deployed on Cloudflare (frontend only deployment)

---

## 🗄️ Storage Architecture

### Supabase Storage Buckets

1. **receipts** (public)
   - Receipt logos
   - Path: `logos/{outletId}/logo-{timestamp}.{ext}`

2. **promotions** (public)
   - Promo images
   - Path: `promos/{outletId}/promo-{timestamp}-{index}.{ext}`

3. **outlet-assets** (public)
   - QRIS static images
   - Product images
   - Path: `qris/{outletId}-{timestamp}.{ext}`
   - Path: `products/{outletId}/{productId}-{timestamp}.{ext}`

### LocalStorage Usage

**POS System**:
- `nashty_menu_cache` - Menu cache (TTL: 60s)
- `nashty_offline_orders` - Pending order queue
- `nashty_offline_products` - Product catalog
- `nashty_favorites` - User favorites
- `nashty_qris_static` - QRIS image (local only)

**Authentication**:
- `nashty_main_session`
- `nashty_session`
- `nashty_kds_session`
- `nashty_token`, `nashty_user`, `nashty_outlet`

**CRM System**:
- `nashty_customers` (tenant-scoped)
- `nashty_rewards` (tenant-scoped)
- `nashty_point_txs` (tenant-scoped)

**Cost System**:
- `nashty_costs` (tenant-scoped)

### IndexedDB Usage

**POS System** (`db-schema.js`):
- Database: `NashtyPOS`
- Stores:
  - `products` - Full product catalog
  - `orders` - Offline order queue
  - `syncQueue` - Pending sync items
  - `settings` - Outlet settings
  - `favorites` - User favorites
  - `cache` - Menu cache

**Encryption**: AES-256-GCM via Web Crypto API

---

## 🔐 Security Architecture

### Authentication Flow

1. **Main Login** (Manager/Admin)
   - Username/password
   - POST `/functions/v1/auth-login` action: `main-login`
   - JWT access token (1h expiry)
   - Refresh token (30 days)

2. **PIN Login** (Staff/Cashier)
   - 4-digit PIN
   - POST `/functions/v1/auth-login` action: `pin-login`
   - JWT access token (12h expiry)
   - Refresh token (30 days)

3. **Token Storage**
   - LocalStorage (session persistence)
   - No automatic token refresh implemented

### Authorization

**Header Pattern**:
```http
Authorization: Bearer {SUPABASE_ANON_KEY}
x-nashty-token: {USER_JWT_TOKEN}
```

**Role-Based Access**:
- `superadmin` - Full system access
- `owner` - Full system access
- `manager` - Backoffice + reports
- `cashier` - POS only
- `kitchen` - KDS only

### Data Encryption

**Offline Data** (POS):
- AES-256-GCM encryption
- Key derived from user session
- Applied to offline orders and sensitive settings

**In Transit**:
- HTTPS only
- Cloudflare SSL/TLS

**At Rest**:
- Supabase PostgreSQL encryption
- Storage bucket access control

---

## 📊 Real-Time Architecture

**Polling-Based** (Not WebSocket):

- **KDS**: 5-second intervals (`setInterval(fetchOrders, 5000)`)
- **POS**: Menu cache auto-refresh every 60 seconds
- **Dashboard**: Manual refresh or page reload

**No Supabase Realtime subscriptions** currently implemented.

---

## 🚀 Deployment Architecture

### Cloudflare Pages Configuration

**File**: `/wrangler.json`

**Redirects**:
```json
{
  "/pos/*": "/pos/:splat",
  "/kds/*": "/kds/:splat",
  "/backoffice/*": "/backoffice/:splat",
  "/cost/*": "/cost/:splat",
  "/crm/*": "/crm/:splat",
  "/api/*": "https://mzucfndifneytbesirkx.supabase.co/functions/v1/:splat"
}
```

**Build Command**: `echo 'Static site - no build required'`

**Publish Directory**: `.` (root)

### Environment Variables

**Required**:
- `SUPABASE_URL` - Hardcoded in api-client.js
- `SUPABASE_ANON_KEY` - Hardcoded in api-client.js
- `JWT_SECRET` - Edge function environment (default: `ZaidunkMargin`)
- `REFRESH_TOKEN_SECRET` - Edge function environment

### CI/CD

**Method**: GitHub push auto-deploys to Cloudflare Pages

**No explicit CI/CD pipeline** configured (GitHub Actions not used)

---

## 🧩 Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Dependency Hierarchy                     │
└─────────────────────────────────────────────────────────────┘

Root Dependencies (package.json):
├─ @supabase/supabase-js@2.108.2  (Production)
├─ jsdom@29.1.1                    (Production)
├─ @playwright/test@1.60.0         (Dev)
├─ supertest@7.2.2                 (Dev)
└─ vitest@4.1.8                    (Dev)

Frontend Dependencies (CDN):
├─ @supabase/supabase-js (loaded via CDN in each app)
└─ qrcode.js (receipt generation)

Edge Functions Dependencies (Deno):
├─ https://deno.land/std@0.168.0/http/server.ts
└─ https://esm.sh/@supabase/supabase-js@2

Service Worker:
└─ Native browser APIs (no external dependencies)
```

**Module System**: 
- Frontend: ES6 modules (native `<script type="module">`)
- Backend: Deno imports
- No bundler or build step

---

## 📁 Directory Size Estimates

```
Total Project: ~14,500+ lines of code

/pos/frontend/         ~4,500 lines (12 service files + app logic)
/kds/frontend/         ~800 lines
/backoffice/frontend/  ~5,000 lines (10 page modules)
/cost/frontend/        ~400 lines
/crm/frontend/         ~500 lines
/supabase/functions/   ~1,200 lines (7 functions)
/api-client.js         ~1,500 lines
/database/             ~600 lines (SQL)
/docs/DraftMD/         ~35,000 lines (31 documentation files)
```

---

## 🔄 Data Flow Patterns

### Order Creation Flow (POS → Database)

```
1. POS UI (cart.js)
   └─> API.orders.create(orderData)
       └─> api-client.js: edgeRequest('orders-api', {...})
           └─> Supabase Edge Function: orders-api
               └─> PostgreSQL: INSERT INTO orders, order_items
                   └─> Response: { success, order, orderNumber }
                       └─> POS: Update UI, print receipt
                           └─> Offline Queue: Remove if syncing
```

### Menu Data Flow (Database → POS)

```
1. POS app.js: fetchMenuData()
   └─> Check cache: getMenuFromCache()
       ├─> Cache HIT: Return cached data
       └─> Cache MISS: API.menu.getOutletMenu(outletId)
           └─> api-client.js: Direct Supabase queries
               ├─> SELECT * FROM categories
               ├─> SELECT * FROM products (with modifiers)
               └─> SELECT * FROM modifier_groups (with options)
                   └─> Response: { categories, items }
                       └─> POS: Process & render, save to cache
```

### Offline Order Flow (POS)

```
1. Network unavailable detected
   └─> OfflineOrderHandler: saveOrderLocally(order)
       └─> IndexedDB: store in 'orders' table
           └─> Encrypted with AES-256-GCM
               └─> ConnectionMonitor: detect online
                   └─> SyncManager: syncOrders()
                       └─> Retrieve from IndexedDB
                           └─> POST to orders-api
                               └─> Success: Remove from local
                               └─> Failure: Keep in queue
```

---

## 🎨 UI Architecture

### Design System

**CSS Variables** (`css/variables.css`):
```css
--primary: #E4540C
--bg1: #FFFFFF
--bg2: #F5F4F2
--txt1: #1A1918
--txt2: #6B6560
--txt3: #ABA49F
```

**Component Structure**:
- Modular CSS (8-9 files per app)
- No CSS framework (custom styles)
- Responsive design (mobile-first)
- Dark mode support (KDS)

### Modal System

**Global Modal Manager** (`modal.js` in POS):
- Stacked modals support
- Backdrop blur
- Keyboard navigation (ESC to close)
- Focus trap

---

## 🐛 Known Issues & Technical Debt

### Critical Issues Identified

1. **API.kds Methods Missing** (`backoffice/frontend/js/pages/kds.js`)
   - `API.kds.updateCategoryProductionTime()` - NOT DEFINED
   - `API.kds.getAnalytics()` - NOT DEFINED
   - UI buttons call non-existent methods

2. **Syntax Error** (`backoffice/frontend/js/pages/system.js`)
   - Extra `};` after `PAGES.settings` definition
   - Breaks all subsequent code in file

3. **QRIS Upload Not Synced** (`backoffice/frontend/js/pages/system.js`)
   - Only writes to localStorage
   - Does NOT call backend API
   - Backend routes `/api/outlets/:id/qris` exist but unused

4. **Export Logs Handler Mismatch** (`activity-logs.js`)
   - Button: `onclick="exportLogs()"`
   - Function exposed: `activityLogsModule.exportLogs`
   - Global function not found at runtime

5. **No Refresh Token Implementation**
   - Tokens issued but never consumed
   - No refresh endpoint exists
   - Sessions expire without renewal

### Architecture Concerns

1. **Duplicate API Implementations**
   - POS uses main `api-client.js`
   - KDS uses separate `kds/frontend/js/api.js`
   - CRM has custom API methods
   - Cost module uses localStorage only

2. **Legacy Backend Confusion**
   - Express server partially active
   - Edge Functions are primary but not complete
   - Mixed implementation patterns

3. **No True Real-Time**
   - Polling-based updates (5s intervals)
   - High server load for multi-outlet
   - Supabase Realtime not utilized

4. **LocalStorage vs Database Inconsistency**
   - Cost: localStorage only
   - CRM: hybrid localStorage + DB
   - POS: IndexedDB + localStorage
   - No unified storage strategy

5. **Cache Invalidation Issues**
   - Menu cache TTL 60s (very short)
   - No cache invalidation on updates
   - Potential stale data in POS

---

## 📝 Configuration Files

### Key Config Files

1. `wrangler.json` - Cloudflare deployment
2. `package.json` - Dependencies
3. `manifest.json` - PWA configuration (POS)
4. `.gitignore` - Version control
5. `deno.json` - Edge function configs (per function)

### Environment-Specific Settings

**Hardcoded** (no .env files used):
- SUPABASE_URL in api-client.js
- SUPABASE_ANON_KEY in api-client.js
- Default tenant/outlet IDs for dev

---

## 🔍 Source of Truth

### Database (PostgreSQL via Supabase)

**Primary Source**: All transactional data

**Tables** (22+):
- `tenants`, `outlets`, `users`
- `categories`, `products`, `modifier_groups`, `modifier_options`
- `orders`, `order_items`, `order_item_modifiers`
- `shifts`, `payments`
- `members` (CRM)
- `favorites`
- `activity_logs`
- `settings`
- `stations` (KDS)
- `payment_methods`

### API Client (`/api-client.js`)

**Source of Truth for**: API contract, method signatures, session management

### Edge Functions

**Source of Truth for**: Business logic, auth logic, order processing

### Frontend Code

**NOT source of truth**: UI is derived from backend data

---

## 🚦 Important Services

### Critical Services (POS)

1. **OfflineManager** - Offline/online state management
2. **SyncManager** - Order queue synchronization
3. **EncryptionService** - AES-256-GCM encryption
4. **ConnectionMonitor** - Network status tracking
5. **CacheManager** - Menu and data caching
6. **FavoritesManager** - Favorites CRUD + ordering
7. **KeyboardShortcuts** - F1-F12 hotkeys
8. **CustomerDisplayManager** - Multi-screen management
9. **ReceiptGenerator** - Receipt HTML + QR generation
10. **RecentItemsTracker** - Auto-suggest analytics
11. **QuickAccessGrid** - Favorites grid UI
12. **OfflineQueue** - Background sync queue

### Critical Functions (Edge)

1. **auth-login** - Authentication (JWT generation)
2. **orders-api** - Order lifecycle management
3. **dashboard-api** - Real-time KPIs
4. **favorites-api** - Favorites management
5. **analytics-api** - Top products with caching
6. **reports-api** - Sales reports
7. **settings-api** - Outlet configuration

---

## 📈 Performance Characteristics

### Benchmarks (from README)

- Cart operations: **35ms** (target: 50ms)
- Product search: **68ms** (target: 100ms)
- Order save: **145ms** (target: 200ms)
- Receipt generation: **240ms** (target: 300ms)
- Display update: **120ms** (target: 200ms)
- 100 orders sync: **18s** (target: 30s)

### Caching Strategy

- **Menu Cache**: 60s TTL (localStorage)
- **Analytics Cache**: 6h TTL (in-memory + database)
- **Service Worker**: Aggressive caching of static assets

---

## 🎯 Module Separation

**Fully Independent Modules**:
- POS (can work offline)
- KDS (polling-based)
- Backoffice (dashboard + management)
- Cost (localStorage-only)
- CRM (hybrid storage)

**Shared Infrastructure**:
- `api-client.js` (imported by all)
- Supabase backend (single database)
- Authentication system (shared sessions)

**No Direct Inter-Module Communication**: All communication via database

---

**End of System Map**
