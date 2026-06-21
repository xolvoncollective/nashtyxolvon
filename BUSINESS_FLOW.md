# BUSINESS FLOW MAP - NASHTY OS Business Process Documentation

**Document Created**: 2026-06-21  
**Purpose**: End-to-end business process flows across all systems  
**Status**: Read-Only Documentation (No modifications made)

---

## 🎯 Overview

This document maps the actual business workflows implemented in NASHTY OS based on codebase analysis.

---

## 🛒 POS SYSTEM FLOW

### 1. Staff Login Flow

```
START
  ↓
[Login Screen] → Enter PIN (4 digits)
  ↓
POST /functions/v1/auth-login 
  action: "pin-login"
  pin: "1234"
  outletId: (optional)
  ↓
Success → JWT Token (12h expiry)
  ↓
Save to localStorage:
  - nashty_session
  - nashty_token
  - nashty_user
  - nashty_outlet
  ↓
Check Active Shift
  ↓
[If No Shift] → Show "Start Shift" Modal
  ↓
POST /functions/v1/orders-api
  action: "start-shift"
  outletId, userId, startCash
  ↓
Save shiftId to session
  ↓
[POS Ready]
```

**Key Files**:
- `/pos/frontend/js/auth.js`
- `/pos/frontend/js/app.js` (initLogin)

---

### 2. Menu Loading Flow

```
[POS Load] → fetchMenuData()
  ↓
Check localStorage cache (TTL: 60s)
  ↓
[Cache HIT] → Load from cache
  ↓
[Cache MISS] → API.menu.getOutletMenu(outletId)
  ↓
Direct Supabase Queries:
  - SELECT * FROM categories WHERE tenant_id = ?
  - SELECT * FROM products WHERE tenant_id = ?
  - SELECT * FROM modifier_groups
  - SELECT * FROM modifier_options
  ↓
Transform to POS format:
  {
    CATS: [{ id, label, svg }],
    MENU: [{ id, cat, n, p, opts, addons, sold }]
  }
  ↓
Save to cache (localStorage)
  ↓
Render menu grid
```

**Cache Invalidation**: 60-second TTL + auto-refresh every 60s

**Key Files**:
- `/pos/frontend/js/app.js` (fetchMenuData)
- `/api-client.js` (API.menu.getOutletMenu)

---

### 3. Order Creation Flow (Online Mode)

```
[Customer Order] → Add items to cart (CART array)
  ↓
Select modifiers (if applicable)
  ↓
Add notes (optional)
  ↓
Review cart → Calculate totals:
  - subtotal
  - tax (11%)
  - service charge (5%)
  - discount (if any)
  - total
  ↓
Select payment method
  ↓
[Bayar Button] → API.orders.create(orderData)
  ↓
POST /functions/v1/orders-api
  action: "create"
  {
    tenantId, outletId, userId, shiftId,
    orderType, tableNumber, items,
    subtotal, tax, discount, total,
    paymentMethod, paymentStatus
  }
  ↓
Generate orderNumber: "ORD-XXXXXX"
  ↓
INSERT INTO orders
INSERT INTO order_items
  ↓
Success Response:
  { success: true, order, orderNumber }
  ↓
[Receipt Generation]
  ↓
Generate HTML receipt with:
  - Outlet branding
  - Items + modifiers
  - Totals
  - QR code (feedback)
  - Footer text
  ↓
Print receipt (thermal printer)
  ↓
Update customer display
  ↓
Clear cart
  ↓
Add to HISTORY array
  ↓
[Ready for next order]
```

**Key Files**:
- `/pos/frontend/js/cart.js`
- `/pos/frontend/js/orders.js`
- `/pos/frontend/js/services/receipt-generator.js`

---

### 4. Order Creation Flow (Offline Mode)

```
[Network Unavailable]
  ↓
ConnectionMonitor: set isOnline = false
  ↓
[Customer Order] → Same cart flow
  ↓
[Bayar Button] → OfflineOrderHandler.saveOrderLocally()
  ↓
Encrypt order data (AES-256-GCM)
  ↓
Save to IndexedDB 'orders' table
  ↓
Add to localStorage 'nashty_offline_orders' (backup)
  ↓
Generate local receipt (print)
  ↓
Show "Order saved offline" toast
  ↓
[Background] → SyncManager monitors connection
  ↓
[Network Restored]
  ↓
SyncManager.syncOrders()
  ↓
Retrieve encrypted orders from IndexedDB
  ↓
Decrypt orders
  ↓
POST each order to /functions/v1/orders-api
  ↓
[Success] → Remove from IndexedDB
[Failure] → Keep in queue, retry later
  ↓
Update UI: "X orders synced"
```

**Encryption**: Web Crypto API (AES-256-GCM)

**Key Files**:
- `/pos/frontend/js/services/offline-order-handler.js`
- `/pos/frontend/js/services/sync-manager.js`
- `/pos/frontend/js/services/encryption-service.js`

---

### 5. Shift Management Flow

```
[Start Shift]
  ↓
Enter starting cash amount
  ↓
POST /functions/v1/orders-api
  action: "start-shift"
  outletId, userId, startCash
  ↓
INSERT INTO shifts
  { outlet_id, user_id, start_cash, status: 'open' }
  ↓
Return shiftId
  ↓
Save to API.session.shiftId
  ↓
[Work Session] → All orders linked to shiftId
  ↓
[End Shift]
  ↓
Enter ending cash amount
  ↓
Calculate expected cash:
  expectedCash = startCash + totalCashSales - totalRefunds
  ↓
Calculate variance:
  variance = endCash - expectedCash
  ↓
POST /functions/v1/orders-api
  action: "end-shift"
  shiftId, endCash, notes
  ↓
UPDATE shifts SET
  end_cash = ?, 
  notes = ?, 
  status = 'closed',
  end_time = NOW()
  ↓
Generate shift report:
  - Total orders
  - Total revenue
  - Cash variance
  - Payment breakdown
  ↓
Clear shiftId from session
  ↓
Return to login screen
```

**Key Files**:
- `/pos/frontend/js/app.js` (shift management)
- `/api-client.js` (API.shifts)

---

### 6. Favorites System Flow

```
[POS Load] → Load favorites for current user
  ↓
GET /functions/v1/favorites-api?action=get&userId={userId}
  ↓
SELECT * FROM favorites 
WHERE user_id = ? 
ORDER BY position ASC
  ↓
Join with products table
  ↓
Return favorites with product data
  ↓
Render favorites grid (top of screen)
  ↓
[User Adds Favorite] → Click ⭐ on product
  ↓
POST /functions/v1/favorites-api
  action: "add"
  { userId, productId, position }
  ↓
Check limit (max 12 favorites)
  ↓
INSERT INTO favorites
  ↓
Refresh favorites grid
  ↓
[User Reorders Favorites] → Drag & drop
  ↓
PUT /functions/v1/favorites-api
  action: "reorder"
  { userId, favorites: [{ id, position }] }
  ↓
UPDATE favorites SET position = ? WHERE id = ?
  (batch update)
  ↓
Refresh grid
  ↓
[User Removes Favorite] → Click ✕
  ↓
DELETE /functions/v1/favorites-api?action=remove&id={favoriteId}
  ↓
DELETE FROM favorites WHERE id = ?
  ↓
Refresh grid
```

**Key Files**:
- `/pos/frontend/js/services/favorites-manager.js`
- `/api-client.js` (API.favorites)
- `/supabase/functions/favorites-api/index.ts`

---

## 👨‍🍳 KDS SYSTEM FLOW

### 1. KDS Login Flow

```
[KDS Screen Load]
  ↓
Check session (nashty_kds_session)
  ↓
[No Session] → PIN Login Modal
  ↓
Enter PIN
  ↓
POST /functions/v1/auth-login
  action: "pin-login"
  pin, outletId
  ↓
Verify user has 'kitchen' role
  ↓
Save to localStorage:
  nashty_kds_session
  ↓
[KDS Active]
```

**Key Files**:
- `/kds/frontend/js/api.js` (auth)
- `/kds/frontend/js/app.js`

---

### 2. Order Queue Display Flow

```
[KDS Load] → Start polling
  ↓
setInterval(fetchOrders, 5000) // Every 5 seconds
  ↓
API.orders.getKDSQueue()
  ↓
SELECT * FROM orders
WHERE outlet_id = ?
AND kitchen_status IN ('pending', 'preparing')
ORDER BY created_at ASC
  ↓
Join with order_items
  ↓
Calculate order urgency:
  - elapsed time = now - created_at
  - target time = max(item.production_time)
  - status = 
      if elapsed < target → "on-time" (green)
      if elapsed > target && elapsed < target+5 → "warning" (yellow)
      if elapsed > target+5 → "overdue" (red)
  ↓
Render order cards:
  - Order number
  - Table/Type
  - Items list
  - Modifiers & notes
  - Elapsed time
  - Urgency indicator
  ↓
[New Orders Detected]
  ↓
Play sound: "new order"
  ↓
Flash card animation
  ↓
[Escalation Check] (if enabled)
  ↓
If order > target time by X minutes
  ↓
Play sound: "escalation"
  ↓
Flash entire screen (optional)
```

**Polling Interval**: 5 seconds (hardcoded)

**Key Files**:
- `/kds/frontend/js/app.js` (fetchOrders)
- `/kds/frontend/js/ui.js` (render)
- `/kds/frontend/js/sound.js`

---

### 3. Order Status Update Flow

```
[Kitchen Staff] → Swipe order card right
  ↓
Click "Preparing" button
  ↓
POST /functions/v1/orders-api
  action: "update-status"
  { orderId, kitchenStatus: "preparing" }
  ↓
UPDATE orders SET kitchen_status = 'preparing'
  ↓
Refresh order display
  ↓
[Kitchen Completes] → Swipe card right again
  ↓
Click "Ready" button
  ↓
POST /functions/v1/orders-api
  action: "update-status"
  { orderId, kitchenStatus: "ready" }
  ↓
UPDATE orders SET kitchen_status = 'ready'
  ↓
Order disappears from KDS queue
  ↓
Sound: "order complete" (optional)
```

**Key Files**:
- `/kds/frontend/js/app.js`
- `/kds/frontend/js/ui.js`

---

## 📊 BACKOFFICE SYSTEM FLOW

### 1. Admin Login Flow

```
[Main Gateway] → index.html
  ↓
Enter username & password
  ↓
POST /functions/v1/auth-login
  action: "main-login"
  { username, password }
  ↓
Verify role IN ('manager', 'superadmin', 'owner')
  ↓
Generate JWT (1h expiry)
  ↓
Save to localStorage:
  nashty_main_session
  { admin, adminToken, tenantId }
  ↓
[Redirect to Backoffice]
```

**Special Logins**:
- `admin1`, `admin2`, `admin3`, `admin4` → Email: `manager@nashty`
- Default password: `nashty1111` for superadmin

**Key Files**:
- `/index.html` (gateway)
- `/api-client.js` (API.mainAuth)

---

### 2. Dashboard KPI Flow

```
[Dashboard Load] → PAGES.dashboard()
  ↓
API.dashboard.getKPI()
  ↓
POST /functions/v1/dashboard-api
  action: "kpi"
  { tenantId, outletId }
  ↓
Query today's orders:
  SELECT * FROM orders
  WHERE tenant_id = ?
  AND payment_status = 'paid'
  AND created_at >= TODAY
  ↓
Calculate KPIs:
  - Total orders
  - Gross revenue (SUM(subtotal))
  - Net revenue (SUM(total))
  - Total discounts
  - Average order value
  - Growth % (vs yesterday)
  - Payment method breakdown
  ↓
Render KPI cards
  ↓
API.dashboard.getWeeklyChart()
  ↓
Query last 7 days
  ↓
Group by day, SUM(total)
  ↓
Render line chart
  ↓
API.dashboard.getRecentOrders(10)
  ↓
Render order table
```

**Key Files**:
- `/backoffice/frontend/js/pages/dashboard.js`
- `/supabase/functions/dashboard-api/index.ts`

---

### 3. Menu Management Flow (Products)

```
[Menu Page] → PAGES.menu()
  ↓
Load tabs:
  - Categories
  - Products
  - Modifiers
  ↓
[Products Tab]
  ↓
API.products.getAll()
  ↓
SELECT * FROM products WHERE tenant_id = ?
  ↓
Render product grid with:
  - Image
  - Name, price
  - Category
  - Status badge
  - Edit/Delete buttons
  ↓
[Add Product] → Click "Tambah Produk"
  ↓
Show modal:
  - Name, description
  - Category (dropdown)
  - Price, cost
  - Production time
  - Image upload
  - Modifiers (multi-select)
  - Status (active/inactive)
  ↓
[Upload Image] (optional)
  ↓
API.products.uploadImage(file)
  ↓
Upload to Supabase Storage:
  bucket: 'outlet-assets'
  path: products/{outletId}/{productId}-{timestamp}.ext
  ↓
Get public URL
  ↓
API.products.create(productData)
  ↓
INSERT INTO products
  {
    tenant_id, category_id, name, 
    price, cost, image_url, 
    has_modifiers, production_time
  }
  ↓
Get product ID
  ↓
[If modifiers selected]
  ↓
INSERT INTO product_modifiers
  (product_id, modifier_group_id)
  ↓
Refresh product grid
  ↓
Invalidate POS menu cache
  ↓
Toast: "Produk berhasil ditambahkan"
```

**Key Files**:
- `/backoffice/frontend/js/pages/menu.js`
- `/api-client.js` (API.products, API.categories, API.modifiers)

---

## 💰 COST SYSTEM FLOW

### 1. Cost Entry Flow

```
[Cost Page Load]
  ↓
Load from localStorage:
  key: 'nashty_costs:{tenantId}'
  ↓
Parse JSON → Array of cost entries
  ↓
Render cost list grouped by category
  ↓
[Add Cost] → Click "Tambah Biaya"
  ↓
Show modal:
  - Amount
  - Category (dropdown)
  - Description
  - Date
  ↓
Save locally:
  {
    id: 'cost_TIMESTAMP_RANDOM',
    tenant_id,
    amount,
    category,
    description,
    created_at
  }
  ↓
localStorage.setItem('nashty_costs:{tenantId}', JSON.stringify(costs))
  ↓
Refresh cost list
  ↓
Recalculate totals
  ↓
[Note: NO database sync]
```

**Categories**:
- bahan-baku (ingredients)
- operasional (operational)
- gaji (salaries)
- utilitas (utilities)
- sewa (rent)
- lainnya (others)

**Storage**: LocalStorage ONLY (no backend)

**Key Files**:
- `/cost/frontend/js/app.js`
- `/cost/frontend/js/data.js`

---

## 👥 CRM SYSTEM FLOW

### 1. Customer Management Flow

```
[CRM Page Load]
  ↓
API.crm.getCustomers()
  ↓
Try database:
  SELECT * FROM members WHERE tenant_id = ?
  ↓
[If database fails] → Fallback to localStorage
  key: 'nashty_customers:{tenantId}'
  ↓
Render customer list:
  - Name, phone
  - Points, total spent
  - Segment (new/regular/loyal/vip)
  - Visit count
  ↓
[Add Customer]
  ↓
Show modal:
  - Name, phone, email
  - Initial points
  ↓
API.crm.createCustomer(customer)
  ↓
Try INSERT INTO members
  ↓
[If fails] → Save to localStorage
  ↓
Refresh customer list
  ↓
[Transaction] → Add points to customer
  ↓
Calculate points earned (e.g., 1 point per Rp 10,000)
  ↓
UPDATE members SET 
    points = points + ?,
    total_spent = total_spent + ?,
    visit_count = visit_count + 1
  ↓
Save transaction log (localStorage):
  key: 'nashty_point_txs:{tenantId}'
```

**Storage**: Hybrid (Database + localStorage fallback)

**Key Files**:
- `/crm/frontend/js/app.js`
- `/crm/frontend/js/customers.js`
- `/api-client.js` (API.crm)

---

## 📈 REPORTS FLOW (Backoffice)

### 1. Sales Report Generation

```
[Reports Page] → Select date range
  ↓
API.reports.getSales({ dateFrom, dateTo, outletId })
  ↓
Query orders in range:
  SELECT * FROM orders
  WHERE tenant_id = ?
  AND payment_status = 'paid'
  AND order_status != 'cancelled'
  AND created_at BETWEEN ? AND ?
  ↓
Calculate summary:
  - Gross sales (SUM(subtotal))
  - Net sales (SUM(total - tax - service))
  - Total orders
  - Total discount
  - Total tax
  - Total service charge
  ↓
Group by date:
  SELECT DATE(created_at), SUM(total), COUNT(*)
  GROUP BY DATE(created_at)
  ↓
Group by order type:
  SELECT order_type, SUM(total), COUNT(*)
  GROUP BY order_type
  ↓
Group by payment method:
  SELECT payment_method, SUM(total), COUNT(*)
  GROUP BY payment_method
  ↓
Render report:
  - Summary cards
  - Daily sales chart
  - Order type pie chart
  - Payment method bar chart
  ↓
[Export] → Generate CSV
```

**Key Files**:
- `/backoffice/frontend/js/pages/dashboard.js` (reports section)
- `/api-client.js` (API.reports)

---

### 2. Menu Engineering Report

```
[Reports → Menu Engineering]
  ↓
API.reports.getMenuEngineering({ dateFrom, dateTo })
  ↓
Join: orders → order_items → products
  ↓
Calculate per product:
  - Total quantity sold
  - Total revenue
  - Profit margin (price - cost)
  ↓
Calculate averages:
  - avgQty = AVG(quantity)
  - avgProfitMargin = AVG(profit_margin)
  ↓
Classify each product:
  popular = qty >= avgQty
  profitable = profit_margin >= avgProfitMargin
  
  classification:
    - STAR: popular + profitable
    - PLOWHORSE: popular + NOT profitable
    - PUZZLE: NOT popular + profitable
    - DOG: NOT popular + NOT profitable
  ↓
Render matrix:
  - Stars (recommend: keep & promote)
  - Plowhorses (recommend: increase price)
  - Puzzles (recommend: market better)
  - Dogs (recommend: remove or redesign)
```

**Key Files**:
- `/api-client.js` (API.reports.getMenuEngineering)

---

**End of Business Flow Map**
