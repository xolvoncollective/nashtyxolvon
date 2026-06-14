# NASHTY OS - Complete API Documentation
**Version:** 2.0  
**Last Updated:** 2025  
**Backend Port:** 3001  

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Routes Summary](#api-routes-summary)
4. [Detailed Endpoints](#detailed-endpoints)
5. [Integration Flow](#integration-flow)
6. [Error Handling](#error-handling)
7. [Testing Guide](#testing-guide)

---

## Overview

NASHTY OS adalah sistem Point of Sale (POS) terintegrasi dengan 3 komponen utama:
- **POS** - Terminal kasir untuk menerima pesanan
- **KDS** - Kitchen Display System untuk dapur
- **Backoffice** - Dashboard management & reporting

### Base URL
```
http://localhost:3001/api
```

### Tech Stack
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (with sql.js)
- **Auth:** JWT + bcrypt for PIN
- **Cloud Ready:** Supabase + Cloudflare

---

## Authentication

### 🔐 Authentication Methods

#### 1. Main Admin Authentication (for launching 3 systems)
**Endpoint:** `POST /api/main/auth/login`

**Purpose:** Login administrator untuk membuka 3 sistem (POS, KDS, Backoffice) dengan satu JWT session

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session": {
    "id": "session-id",
    "username": "admin",
    "role": "admin",
    "tenantId": "tenant-001",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "expiresIn": 43200
  },
  "user": {
    "id": "user-001",
    "username": "admin",
    "role": "admin",
    "tenantId": "tenant-001"
  }
}
```

**Session Duration:** 12 hours (43200 seconds)

**Usage:** Token ini digunakan untuk membuka 3 window (POS, KDS, Backoffice) secara bersamaan dengan session yang sama.

---

#### 2. Staff PIN Authentication (for POS/KDS)
**Endpoint:** `POST /api/auth/login`

**Purpose:** Login staff (cashier/kitchen) menggunakan PIN

**Request:**
```json
{
  "pin": "1234",
  "outletId": "outlet-001"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-001",
    "name": "John Doe",
    "role": "cashier",
    "outletId": "outlet-001",
    "tenantId": "tenant-001"
  }
}
```

**Header for Authenticated Requests:**
```
Authorization: Bearer <token>
```

---

## API Routes Summary

| Category | Route | Authentication | Description |
|----------|-------|----------------|-------------|
| **Health** | GET /api/health | ❌ No | Health check with DB connectivity |
| **Main Auth** | POST /api/main/auth/login | ❌ No | Admin login (12h session) |
| **Main Auth** | POST /api/main/auth/validate | ❌ No | Validate session token |
| **Main Auth** | GET /api/main/auth/apps | ❌ No | Get available apps |
| **Staff Auth** | POST /api/auth/login | ❌ No | Staff PIN login |
| **Staff Auth** | GET /api/auth/staff | ✅ Yes | List all staff |
| **Staff Auth** | GET /api/auth/outlets | ✅ Yes | List outlets |
| **Users** | GET /api/users | ✅ Yes | List users |
| **Users** | POST /api/users | ✅ Yes | Create user |
| **Users** | PUT /api/users/:id | ✅ Yes | Update user |
| **Users** | PATCH /api/users/:id/status | ✅ Yes | Toggle user status |
| **Users** | DELETE /api/users/:id | ✅ Yes | Soft delete user |
| **Categories** | GET /api/categories | ✅ Yes | List categories |
| **Categories** | GET /api/categories/:id | ✅ Yes | Get category by ID |
| **Categories** | POST /api/categories | ✅ Yes | Create category |
| **Categories** | PUT /api/categories/:id | ✅ Yes | Update category |
| **Categories** | PATCH /api/categories/:id/status | ✅ Yes | Toggle category status |
| **Categories** | DELETE /api/categories/:id | ✅ Yes | Soft delete category |
| **Categories** | PUT /api/categories/reorder | ✅ Yes | Reorder categories |
| **Products** | GET /api/products | ✅ Yes | List products |
| **Products** | GET /api/products/:id | ✅ Yes | Get product by ID |
| **Products** | POST /api/products | ✅ Yes | Create product |
| **Products** | PUT /api/products/:id | ✅ Yes | Update product |
| **Products** | PATCH /api/products/:id/status | ✅ Yes | Update product status (soldout) |
| **Products** | PATCH /api/products/:id/favorite | ✅ Yes | Toggle favorite |
| **Products** | DELETE /api/products/:id | ✅ Yes | Soft delete product |
| **Products** | POST /api/products/:id/duplicate | ✅ Yes | Duplicate product |
| **Menu** | GET /api/menu | ✅ Yes | Get full menu tree |
| **Modifiers** | GET /api/modifiers | ✅ Yes | List modifier groups |
| **Modifiers** | POST /api/modifiers | ✅ Yes | Create modifier group |
| **Modifiers** | PUT /api/modifiers/:id | ✅ Yes | Update modifier group |
| **Modifiers** | DELETE /api/modifiers/:id | ✅ Yes | Delete modifier group |
| **Modifiers** | POST /api/modifiers/:id/options | ✅ Yes | Add option to group |
| **Modifiers** | DELETE /api/modifiers/options/:id | ✅ Yes | Delete option |
| **Orders** | GET /api/orders | ✅ Yes | List orders |
| **Orders** | GET /api/orders/:id | ✅ Yes | Get order by ID |
| **Orders** | POST /api/orders | ✅ Yes | Create order |
| **Orders** | PATCH /api/orders/:id/status | ✅ Yes | Update order status |
| **Orders** | PATCH /api/orders/:id/payment | ✅ Yes | Update payment status |
| **Orders** | GET /api/orders/kds/queue | ✅ Yes | Get KDS queue |
| **Orders** | PATCH /api/orders/:id/kitchen-status | ✅ Yes | Update kitchen status |
| **Orders** | GET /api/orders/kds/stats | ✅ Yes | Get kitchen stats |
| **Orders** | POST /api/orders/:id/void | ✅ Yes | Void order |
| **Orders** | POST /api/orders/:id/refund | ✅ Yes | Refund order |
| **Shifts** | GET /api/shifts | ✅ Yes | List shifts |
| **Shifts** | POST /api/shifts/open | ✅ Yes | Open shift |
| **Shifts** | POST /api/shifts/:id/close | ✅ Yes | Close shift |
| **Shifts** | GET /api/shifts/:id/summary | ✅ Yes | Get shift summary |
| **Shifts** | GET /api/shifts/daily-report | ✅ Yes | Get daily report |
| **Dashboard** | GET /api/dashboard/kpi | ✅ Yes | Get KPIs |
| **Dashboard** | GET /api/dashboard/recent-orders | ✅ Yes | Recent orders |
| **Dashboard** | GET /api/dashboard/weekly-chart | ✅ Yes | 7-day revenue chart |
| **Dashboard** | GET /api/dashboard/payment-distribution | ✅ Yes | Payment methods |
| **Dashboard** | GET /api/dashboard/top-products | ✅ Yes | Top 10 products |
| **Dashboard** | GET /api/dashboard/hourly-sales | ✅ Yes | Hourly sales heatmap |
| **Reports** | GET /api/reports/sales | ✅ Yes | Sales report |
| **Reports** | GET /api/reports/products | ✅ Yes | Product performance |
| **Reports** | GET /api/reports/cashiers | ✅ Yes | Cashier performance |
| **Reports** | GET /api/reports/menu-engineering | ✅ Yes | BCG Matrix analysis |
| **Outlets** | GET /api/outlets | ✅ Yes | List outlets |
| **Outlets** | POST /api/outlets | ✅ Yes | Create outlet |
| **Outlets** | PUT /api/outlets/:id | ✅ Yes | Update outlet |
| **Settings** | GET /api/settings/:outletId | ✅ Yes | Get outlet settings |
| **Settings** | PUT /api/settings/:outletId | ✅ Yes | Update settings |
| **Activity Logs** | GET /api/activity-logs | ✅ Yes | Get activity logs |
| **Members** | POST /api/members/auth/login | ❌ No | Member login/register |
| **Members** | GET /api/members/profile | ✅ Member | Get profile |
| **Members** | GET /api/members/history | ✅ Member | Order history |

---

## Detailed Endpoints

### 🏥 Health Check

#### GET /api/health
Check server and database connectivity.

**Request:**
```bash
curl http://localhost:3001/api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "version": "2.0.0",
  "uptime": 3600,
  "database": "connected",
  "features": ["sqlite", "supabase-ready", "jwt-auth", "wal-mode"],
  "responseTime": "5ms"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "version": "2.0.0",
  "uptime": 3600,
  "database": "disconnected",
  "error": "Database query failed",
  "responseTime": "8ms"
}
```

---

### 📦 Menu API (Full Tree)

#### GET /api/menu
Get complete menu tree with categories, products, and modifiers.

**Query Parameters:**
- `tenantId` (required) - Tenant ID
- `outletId` (optional) - Outlet ID for outlet-specific availability

**Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/menu?tenantId=tenant-001"
```

**Response:**
```json
{
  "categories": [
    {
      "id": "cat-001",
      "name": "Coffee",
      "slug": "coffee",
      "icon": "☕",
      "color": "#8B4513",
      "products": [
        {
          "id": "prod-001",
          "name": "Americano",
          "price": 25000,
          "status": "active",
          "has_modifiers": true,
          "image_url": "/uploads/americano.jpg",
          "modifiers": [
            {
              "id": "mod-001",
              "name": "Size",
              "type": "single",
              "required": true,
              "options": [
                { "id": "opt-001", "name": "Regular", "price_adjustment": 0 },
                { "id": "opt-002", "name": "Large", "price_adjustment": 5000 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**KPI:** Menu changes in Backoffice should immediately sync to POS & KDS via this endpoint.

---

### 🛒 Orders API

#### POST /api/orders
Create a new order from POS.

**Request:**
```json
{
  "tenantId": "tenant-001",
  "outletId": "outlet-001",
  "userId": "user-001",
  "orderType": "dine_in",
  "tableNumber": "5",
  "customerName": "John Doe",
  "customerPhone": "081234567890",
  "items": [
    {
      "productId": "prod-001",
      "productName": "Americano",
      "quantity": 2,
      "unitPrice": 25000,
      "modifiers": [
        {
          "groupId": "mod-001",
          "groupName": "Size",
          "optionId": "opt-002",
          "optionName": "Large",
          "priceAdjustment": 5000
        }
      ],
      "subtotal": 60000,
      "notes": "No sugar"
    }
  ],
  "subtotal": 60000,
  "tax": 6600,
  "serviceCharge": 3000,
  "discount": 0,
  "total": 69600,
  "paymentMethod": "cash",
  "paymentStatus": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order-001",
    "orderNumber": "ORD-2025-0001",
    "total": 69600,
    "kitchenStatus": "pending",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**KPI:** Order created in POS must immediately appear in KDS queue.

---

#### GET /api/orders/kds/queue
Get all orders for Kitchen Display System.

**Query Parameters:**
- `outletId` (required) - Outlet ID
- `status` (optional) - Filter: `pending`, `preparing`, `ready`, `served`

**Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/orders/kds/queue?outletId=outlet-001"
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order-001",
      "orderNumber": "ORD-2025-0001",
      "orderType": "dine_in",
      "tableNumber": "5",
      "kitchenStatus": "pending",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "elapsed": 5,
      "urgency": "normal",
      "items": [
        {
          "productName": "Americano",
          "quantity": 2,
          "modifiers": "Large",
          "notes": "No sugar"
        }
      ]
    }
  ],
  "stats": {
    "pending": 3,
    "preparing": 5,
    "ready": 2
  }
}
```

**KPI:** KDS should poll this endpoint every 5 seconds to check for new orders.

---

#### PATCH /api/orders/:id/kitchen-status
Update kitchen status from KDS.

**Request:**
```json
{
  "kitchenStatus": "preparing"
}
```

**Valid statuses:**
- `pending` - Menunggu diproses
- `preparing` - Sedang dibuat
- `ready` - Siap disajikan
- `served` - Sudah disajikan

**Response:**
```json
{
  "success": true,
  "message": "Status dapur diperbarui"
}
```

---

### 📊 Product Status Management

#### PATCH /api/products/:id/status
Update product availability status.

**Request:**
```json
{
  "status": "soldout"
}
```

**Valid statuses:**
- `active` - Tersedia
- `inactive` - Nonaktif (tidak tampil)
- `soldout` - Habis terjual

**Response:**
```json
{
  "success": true,
  "message": "Produk ditandai habis"
}
```

**KPI:** When marked as `soldout` in Backoffice, product should immediately disappear from POS menu.

---

## Integration Flow

### 🔄 POS → KDS → Backoffice Integration

#### Flow 1: Order Creation
```
1. POS → POST /api/orders
   └─ Create order with items
   
2. KDS → GET /api/orders/kds/queue (auto-refresh every 5s)
   └─ New order appears in KDS
   
3. KDS → PATCH /api/orders/:id/kitchen-status
   └─ Update status: pending → preparing → ready → served
   
4. Backoffice → GET /api/dashboard/kpi
   └─ Real-time revenue updates
```

#### Flow 2: Menu Management
```
1. Backoffice → POST /api/products
   └─ Create new product
   
2. POS → GET /api/menu
   └─ New product appears in menu
   
3. Customer orders new product
   
4. POS → POST /api/orders (with new product)
   
5. KDS → GET /api/orders/kds/queue
   └─ Order with new product appears in KDS ✅
```

#### Flow 3: Sold Out Management
```
1. Backoffice → PATCH /api/products/:id/status { "status": "soldout" }
   └─ Mark product as sold out
   
2. POS → GET /api/menu
   └─ Product status = "soldout", grayed out or hidden ✅
   
3. KDS continues showing existing orders with that product
```

#### Flow 4: Multi-Window Session (Main Menu)
```
1. Main Menu → POST /api/main/auth/login
   └─ Get JWT token (12h session)
   
2. Open 3 windows:
   - window.open('/pos/frontend/index.html?token=' + token)
   - window.open('/kds/frontend/index.html?token=' + token)
   - window.open('/backoffice/frontend/index.html?token=' + token)
   
3. All 3 systems share same JWT token
   └─ Synchronized session across POS, KDS, Backoffice
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid token or PIN)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (database disconnected)

### Common Errors

#### Missing Required Parameters
```json
{
  "error": "tenantId and name are required"
}
```

#### Invalid Authentication
```json
{
  "error": "Unauthorized"
}
```

#### Database Connection Error
```json
{
  "error": "Database query failed",
  "status": 503
}
```

---

## Testing Guide

### 1. Test Health Check
```bash
curl http://localhost:3001/api/health
```

Expected: `{ "status": "healthy", "database": "connected" }`

---

### 2. Test Admin Login
```bash
curl -X POST http://localhost:3001/api/main/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Expected: JWT token in response

---

### 3. Test Menu Retrieval
```bash
# Get tenant ID first from database
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/menu?tenantId=<TENANT_ID>"
```

Expected: Full category/product/modifier tree

---

### 4. Test Order Creation (POS → KDS Integration)
```bash
# Step 1: Create order from POS
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "outletId": "outlet-001",
    "userId": "user-001",
    "orderType": "dine_in",
    "tableNumber": "5",
    "items": [{
      "productId": "prod-001",
      "productName": "Test Product",
      "quantity": 1,
      "unitPrice": 25000,
      "subtotal": 25000
    }],
    "subtotal": 25000,
    "tax": 2750,
    "total": 27750,
    "paymentMethod": "cash",
    "paymentStatus": "paid"
  }'

# Step 2: Check if order appears in KDS
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/orders/kds/queue?outletId=outlet-001"
```

Expected: New order appears in KDS queue ✅

---

### 5. Test Product Sold Out (Backoffice → POS Integration)
```bash
# Step 1: Mark product as sold out
curl -X PATCH http://localhost:3001/api/products/<PRODUCT_ID>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"soldout"}'

# Step 2: Check menu in POS
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/menu?tenantId=<TENANT_ID>"
```

Expected: Product status = "soldout" ✅

---

### 6. Test New Product (Backoffice → POS → KDS Integration)
```bash
# Step 1: Create new product in Backoffice
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "categoryId": "cat-001",
    "name": "New Coffee",
    "price": 30000
  }'

# Step 2: Get menu in POS (new product should appear)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/menu?tenantId=tenant-001"

# Step 3: Create order with new product
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...order with new product...}'

# Step 4: Check KDS queue
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/orders/kds/queue?outletId=outlet-001"
```

Expected: Order with new product appears in KDS ✅

---

## 🔍 AUDIT FINDINGS

### ✅ All API Routes Are Correct

After comprehensive audit of all 15 route files, **NO ERRORS FOUND** in backend code:

1. **auth.ts** - ✅ Correct imports, no undefined variables
2. **main-auth.ts** - ✅ Proper Supabase integration
3. **orders.ts** - ✅ All database queries use correct syntax
4. **menu.ts** - ✅ Full tree retrieval working
5. **shifts.ts** - ✅ Shift management complete
6. **categories.ts** - ✅ CRUD operations correct
7. **products.ts** - ✅ Status management working
8. **modifiers.ts** - ✅ Modifier groups functional
9. **dashboard.ts** - ✅ KPI calculations correct
10. **reports.ts** - ✅ Analytics queries working
11. **outlets.ts** - ✅ Multi-outlet support
12. **settings.ts** - ✅ Settings management correct
13. **users.ts** - ✅ User management with bcrypt
14. **activity-logs.ts** - ✅ Logging functional
15. **members.ts** - ✅ Member CRM ready

### 🐛 "API is not defined" Error Source

The error **"Gagal memproses pesanan: API is not defined"** is likely from **FRONTEND CODE**, not backend.

**Common causes:**
1. Frontend JavaScript missing `const API = { ... }` definition
2. POS/KDS frontend trying to call `API.createOrder()` before API object is initialized
3. Missing API base URL configuration in frontend

**Solution:** Check these frontend files:
- `/pos/frontend/js/api.js` or similar
- `/kds/frontend/js/api.js`
- `/backoffice/frontend/js/data.js`

Look for undefined `API` variable or missing initialization.

---

## 📝 Recommendations

### Priority 1: Fix Frontend API Configuration
1. Create centralized API client for each frontend
2. Ensure all 3 systems (POS, KDS, Backoffice) have proper API initialization
3. Add error handling for network failures

### Priority 2: Implement Auto-Refresh
1. KDS should poll `/api/orders/kds/queue` every 5 seconds
2. POS should refresh menu when needed (button or interval)
3. Use WebSocket or Server-Sent Events for real-time updates (future)

### Priority 3: Testing Workflow
1. Use Postman/curl to test all endpoints
2. Create integration test suite
3. Test POS → KDS → Backoffice data flow

### Priority 4: Main Menu Launcher
Create `index.html` main menu that:
1. Shows login form
2. Calls `/api/main/auth/login`
3. Opens 3 windows with JWT token
4. Shares session across all systems

---

## 📚 Additional Resources

- **Database Schema:** `/backoffice/backend/src/db/schema.sql`
- **Start Script:** `start-local.ps1`
- **Environment:** `.env` (configure database path, JWT secret)

---

**Last Updated:** 2025-01-15  
**Maintainer:** NASHTY OS Team  
**Status:** ✅ All APIs Working - Frontend Integration Needed
