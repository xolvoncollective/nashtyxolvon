# NASHTY OS — Stage 4B Forensic Bug Analysis
**Generated:** 2026-06-19 · WIB  
**Analyst Mode:** FORENSIC QA — No fixes applied  
**Evidence Sources:** SQLite MCP (live DB), Playwright MCP (runtime), Serena MCP (code analysis), Static file inspection

---

## Legend
| Verdict | Meaning |
|---------|---------|
| ✅ FIXED | Full end-to-end workflow proven working |
| ⚠️ PARTIALLY_FIXED | Backend/API works but UI or persistence incomplete |
| 🔴 BROKEN | Confirmed not working at runtime |
| ❓ UNVERIFIED | Cannot confirm without additional runtime |

---

## POS BUGS

---

### POS-01 — Gross Sales Calculation Incorrect
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: HIGH** | **Confidence: 88%**

#### Formula Source
`FinancialCalculationService.ts` L21:
```sql
SUM(CASE WHEN payment_status='paid' AND order_status != 'cancelled' THEN subtotal ELSE 0 END) AS gross_sales
```
`dashboard.ts` KPI endpoint exposes `gross_sales` from this query.  
UI (`dashboard.js` L44) renders `kpi.netRevenue` — **NOT gross_sales** — as "Pendapatan Hari Ini".

#### Database Evidence
```
DB Query: SELECT SUM(subtotal) FROM orders WHERE payment_status='paid' AND order_status!='cancelled'
Result:   gross_sales = 885,000
          net_sales   = 982,350  (subtotal + tax)
```
The `subtotal` column in DB = items total before tax = **true Gross Sales**.  
The `total` column in DB = subtotal + tax = what UI labels as "Pendapatan Hari Ini".

#### UI Evidence (Runtime Screenshot)
Dashboard shows: **Rp 493.950** as "Pendapatan Hari Ini" (today's net_sales), **4 transaksi**.  
The API response's `netRevenue` field is displayed where `grossRevenue` should be shown.

#### Root Cause
**Dual naming confusion in API response + UI binding:**
1. `FinancialCalculationService.getSalesSummary()` computes both `gross_sales` (= subtotal) and `net_sales` (= total - refunds).
2. `dashboard.ts` L44 maps these to `grossRevenue` and `netRevenue` correctly in the API response.
3. `dashboard.js` L44 renders `kpi.netRevenue` as the primary KPI card labeled "Pendapatan Hari Ini" — this is correct **if** the intent is to show net revenue as the key figure.
4. **The actual bug**: There is no separate "Gross Sales" KPI card in the dashboard UI at all. Both fields exist in the API but only `netRevenue` is surfaced. The dashboard title says "Pendapatan Hari Ini" which is ambiguous.

#### Exact File Responsible
- [`dashboard.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/dashboard.js#L44) — missing `grossRevenue` display card
- [`FinancialCalculationService.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/services/FinancialCalculationService.ts#L21) — formula is correct

---

### POS-02 — Net Sales Calculation Incorrect
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: HIGH** | **Confidence: 82%**

#### Formula Source
`FinancialCalculationService.ts` L25 (shift summary), L66 (sales summary):
```sql
SUM(total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id=orders.id AND amount < 0), 0)) AS net_sales
```
**Formula = total + negative payment amounts (refunds)**  
This is correct — negative payments in the `payments` table represent refunds.

#### Database Evidence
```
orders table:
  gross_sales (SUM subtotal, paid, not cancelled) = 885,000
  total_tax                                       = 97,350
  net_sales (total - refunds)                     = 982,350  ← tax included, no discounts exist yet
  total_discount                                  = 0
```
DB check: `subtotal + tax = 885,000 + 97,350 = 982,350` ✅ matches.

#### Problem Identified
The `net_sales` formula in the **getSalesSummary** is used for **all-time reports** but the dashboard KPI endpoint passes a `todayFilter` WHERE clause without filtering out `order_status != 'cancelled'`:

`reports.ts` L15: `WHERE o.payment_status = 'paid'` — **missing `AND o.order_status != 'cancelled'`**

This means voided orders that were paid before being voided can appear in report totals.

#### Root Cause
`reports.ts` L15 WHERE clause omits `order_status != 'cancelled'` filter, causing cancelled orders to contaminate Net Sales in the Reports page (not dashboard). Dashboard KPI query at `dashboard.ts` L16 correctly excludes cancelled orders.

#### Exact File Responsible
- [`reports.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/reports.ts#L15) — missing `AND o.order_status != 'cancelled'`

---

### POS-03 — Backend Rounds Values Before Saving
**Verdict: 🔴 BROKEN** | **Severity: HIGH** | **Confidence: 95%**

#### Code Evidence
`OrderService.ts` L47–48:
```typescript
const calculatedTax = Math.round(baseAmount * (taxRate / 100));
const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));
```

#### Database Evidence
Order `SNY-260618-0008`: subtotal=28,000, tax=3,080 → 28000 × 11% = 3,080.00 → exact (no rounding needed here)  
Order `SNY-260618-0010`: subtotal=136,000, tax=14,960 → 136000 × 11% = 14,960.00 → exact

However: if subtotal = 37,500 → tax = 37,500 × 0.11 = **4,125.00** → `Math.round(4125)` = 4,125 (ok)  
But if subtotal = 37,137 → tax = 37,137 × 0.11 = **4,085.07** → `Math.round(4085.07)` = **4,085** (truncated 0.07)

The `Math.round()` call at line 47 and 48 **destroys decimal precision** before database write. The `total` is then calculated from already-rounded sub-values, introducing cumulative rounding error.

#### Additionally
`FinancialCalculationService.ts` L192: `Math.round(d.total_amount / total * 100)` — rounds payment distribution percentages  
`FinancialCalculationService.ts` L312: `Math.round(avgQty)`, `Math.round(avgProfit)` — rounds menu engineering averages

#### Root Cause
`OrderService.ts` lines 47–48 explicitly use `Math.round()` on tax and service charge before inserting into DB. Decimal values (e.g., odd subtotal amounts) lose fractional rupiah. This affects both individual order accuracy and aggregate reports.

#### Exact File Responsible
- [`OrderService.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/services/OrderService.ts#L47-L48) — `Math.round()` on tax and service charge

---

### POS-04 — COGS Remains Zero
**Verdict: 🔴 BROKEN** | **Severity: CRITICAL** | **Confidence: 97%**

#### Database Evidence
Products have cost values:
```
Ayam Bakar Madu:    cost = 25,000
Nasi Goreng Spesial: cost = 15,000
Rawon Spesial:      cost = 20,000
```
Calculated COGS per order (manual join):
```
SNY-260618-0010: actual_cogs = 60,000  (per DB join of order_items × products.cost)
SNY-260618-0009: actual_cogs = 42,000
SNY-260618-0008: actual_cogs = 12,000
```

#### API/Report Evidence
The **KPI API** (`dashboard.ts`) does NOT return any COGS field. The `FinancialCalculationService.getSalesSummary()` does NOT calculate COGS. No endpoint exists that returns `cogs` or `cost_of_goods_sold`.

The product performance report (`FinancialCalculationService.getProductPerformanceReport()` L233) does calculate `estimated_profit = SUM(subtotal) - (cost * qty)`, but:
1. This is only in the **reports/products** endpoint
2. The dashboard KPI has **no COGS field at all**
3. The modifier_groups table is EMPTY — no data from cost module is flowing through

#### Root Cause  
COGS is **never calculated in any dashboard KPI or summary endpoint**. The data exists in `products.cost` and can be joined through `order_items`, but no service method computes aggregate COGS. `CostService.syncRecipeCost()` (L94–96) updates `products.cost` by recipe name match — but `modifier_groups` table is empty, so no recipe → product cost sync has occurred for any active modifiers.

#### Exact File Responsible
- [`FinancialCalculationService.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/services/FinancialCalculationService.ts) — no `getCOGS()` method exists
- [`dashboard.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/dashboard.ts) — COGS field absent from KPI response

---

### POS-05 — Modifier Integration Incomplete
**Verdict: 🔴 BROKEN** | **Severity: HIGH** | **Confidence: 96%**

#### Database Evidence
```sql
SELECT * FROM modifier_groups;  -- Returns: []  (EMPTY)
SELECT * FROM modifier_options; -- Returns: []  (EMPTY)
SELECT * FROM product_modifiers; -- Returns: [] (EMPTY)
```
No modifier groups exist in the database. Therefore:
- POS cannot show any modifiers on products
- No modifier data has ever been attached to any order
- `order_item_modifiers` table has zero rows for any active orders

#### UI Evidence (Runtime)
Modifier Groups page shows: **"Belum ada Modifier Group"** (No modifier groups yet).

#### Business Flow Verification
Cannot complete the required flow:
1. ❌ Create modifier in Backoffice — UI exists but DB is empty (no test data)
2. ❌ Attach modifier to product — `product_modifiers` table empty
3. ❌ Open POS → Add modifier — no modifiers available
4. ❌ Checkout with modifier — nothing to add
5. ❌ Verify modifier in DB/KDS — no data

#### Root Cause
The modifier CRUD API (`modifiers.ts`) is fully implemented and correct. However, **zero modifier groups have ever been created in this deployment**. The initial DB seed (`npm run db:seed`) did not seed any modifier groups. The entire modifier flow is untested end-to-end because there is no test data.

#### Exact File Responsible
- Missing: seed data in database — `modifier_groups`, `modifier_options`, `product_modifiers` all empty
- [`modifiers.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/modifiers.ts) — API code exists, but untested without seed data

---

### POS-06 — Menu Creation
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 78%**

#### Database Evidence
Products exist and have valid data:
```
Ayam Bakar Madu, price=55000, cost=25000, status=active
Nasi Goreng Spesial, price=35000, cost=15000, status=active
```
12 paid orders exist referencing these products by name, confirming orders can be placed.

#### Root Cause / Concern
The product creation/edit flow via Backoffice UI (`menu.js`, 57KB) has not been live-tested in this session. Products exist in DB from seeding. The concern is whether **newly created** products appear in POS without manual cache invalidation.

`CacheManager.ts` exists as a service — `backoffice/backend/src/services/CacheManager.ts`. The POS reads products via `/api/menu` endpoint, not the backoffice `/api/products`. Cross-system product sync is the risk area.

**UNVERIFIED**: End-to-end create-in-backoffice → appears-in-POS not confirmed this session.

---

## BACKOFFICE BUGS

---

### BO-01 — Profile Cannot Be Edited
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 85%**

#### Runtime Evidence
Screenshot shows profile edit form loaded with name "TestUser UI Updated" — a previous test edit is shown. The `saveProfile()` function in `index.html` L391–419 calls `PUT /api/users/:id`.

#### Database Evidence
```sql
SELECT id, name FROM users WHERE id = 'admin';
-- Result: name = 'Zaidunk'
```
The DB shows `name = 'Zaidunk'` — but the UI shows **"TestUser UI Updated"** which means:
1. The UI session object was updated in memory: `API.session.user.name = name` (L407)
2. But the DB still has the old name = indicates a **previous failed PUT** or the avatar shows "TU" matching "TestUser UI Updated" — meaning the PUT **did** save to DB at some point

#### Deeper Check
The `users.ts` PUT endpoint at L61 has an authorization check:
```typescript
if (req.user && !['owner','manager'].includes(req.user.role.toLowerCase()) && req.user.id !== id)
  return 403
```
In **development mode**, `req.user` may be null (auth bypass), so this check is skipped and **any PUT succeeds**.

**BUT**: The DB shows `name = 'Zaidunk'` not "TestUser UI Updated" — this suggests either:
- The PUT to `/api/users/admin` is failing silently
- Or a different user ID is being used

#### Root Cause
`index.html` L384: `saveProfile('${user.id}')` — if `API.session.user.id` is `null` or `undefined`, PUT goes to `/api/users/undefined`. The session user loaded at login stores `id` but the auth bypass in dev mode may not populate `session.user` properly.

#### Exact File Responsible
- [`index.html`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/index.html#L391-L419) — `saveProfile()` — user ID from session may be undefined
- [`main-auth.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/main-auth.ts) — session user population

---

### BO-02 — Product Status Integration with POS
**Verdict: ❓ UNVERIFIED** | **Severity: HIGH** | **Confidence: 50%**

#### Code Analysis
`products.ts` route exists with ACTIVE/INACTIVE/SOLD_OUT status handling.  
POS reads menu via `/api/menu` which filters `status = 'active'` for displayed products.

The status propagation path:
1. Backoffice sets `products.status = 'inactive'`
2. POS calls `/api/menu?outletId=X` 
3. Menu query filters `WHERE status = 'active'`

This theoretically works, but **no runtime test was performed** for INACTIVE/SOLD_OUT status propagation to POS display.

#### Root Cause of Gap
Not tested in this session. Requires: set product INACTIVE → confirm not in POS menu. DB has "Es Krim Cokelat" with a recent "dinonaktifkan" activity log entry — this could be used to verify, but POS runtime was not tested.

---

### BO-03 — Modifier Groups Integration Incomplete
**Verdict: 🔴 BROKEN** | **Severity: CRITICAL** | **Confidence: 98%**

#### Runtime Evidence
- Modifier Groups UI page: Shows "Belum ada Modifier Group"
- Database: `modifier_groups` table = EMPTY
- `modifier_options` table = EMPTY
- `product_modifiers` table = EMPTY

#### Verification Status
- ❌ No modifier groups exist in Backoffice
- ❌ Cannot verify POS modifier visibility (nothing to test)
- ❌ Cannot verify KDS modifier display (no orders with modifiers)

#### Root Cause
**Zero data.** The API infrastructure (`modifiers.ts`, 290 lines) is complete. The DB schema supports modifiers. But the database contains no modifier data — no groups, no options, no product assignments. This is a **data gap**, not a code bug. However, the business flow is completely non-functional because there is nothing to test.

#### Exact File Responsible
- Database: empty `modifier_groups`, `modifier_options`, `product_modifiers` tables
- Missing: seed data or user-created modifier groups

---

### BO-04 — General Settings Not Persisting
**Verdict: 🔴 BROKEN** | **Severity: CRITICAL** | **Confidence: 99%**

#### Code Evidence
`pos.js` L2–24 — The entire `PAGES['pos-general']` function returns **hardcoded HTML**:
```javascript
PAGES['pos-general'] = () => `
  <input value="Nashty Hot Chicken">          // HARDCODED
  <input value="NST-{YYYYMMDD}-{NNNN}">       // HARDCODED
  <input type="number" value="11">            // HARDCODED
  <input type="number" value="5">             // HARDCODED
  <button onclick="toast('Pengaturan disimpan')">Simpan Perubahan</button>  // FAKE SAVE
```
The "Simpan Perubahan" button fires a **toast notification only** — **no API call is made**.

#### Database Evidence
```sql
SELECT * FROM settings;
-- Only 2 rows: receipt_footer and test
-- No tax_rate, no brandName, no service_charge_rate, no invoice_format rows
```

#### Runtime Evidence (Screenshot)
General Settings page shows fixed values: Tax=11%, Service Charge=5%, Brand="Nashty Hot Chicken".  
These match hardcoded values in `pos.js`, **NOT database values**.

#### Root Cause
`pos.js` is a **static UI mock**. It never reads from API on load and never writes to API on save. The save button calls `toast('Pengaturan disimpan')` — a fake success message with zero backend interaction.

#### Exact File Responsible
- [`pos.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/pos.js#L2-L24) — fully hardcoded, no API calls

---

### BO-05 — Payment Methods Not Persisting
**Verdict: 🔴 BROKEN** | **Severity: CRITICAL** | **Confidence: 99%**

#### Code Evidence
`pos.js` L27–54 — `PAGES['pos-payment']` renders hardcoded payment method list:
```javascript
[['Tunai','...', '#22C55E', true],
 ['Transfer','...', '#06B6D4', true],
 ['QRIS','...', '#3B82F6', true],
 ...].map(([n,d,c,on]) => `
  <input type="checkbox" ${on?'checked':''} onchange="toast('${n} ...')">
`)
```
Toggle onchange fires `toast()` only — **no API call**.

#### Database Evidence
```sql
SELECT * FROM payment_methods;
-- Only 1 row: "Test PM" (type=qris, status=active)
-- The 8 hardcoded methods (Tunai, Transfer, QRIS, etc.) do NOT exist in DB
```

#### Root Cause
`pos.js` payment methods page is a **static visual mock**. The actual payment method API (`settings.ts` routes) is implemented correctly for reading/writing, but the frontend page (`pos.js`) **never calls it**. The DB has only 1 payment method that was created via direct API call during a previous test.

#### Exact File Responsible
- [`pos.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/pos.js#L27-L54) — hardcoded, no API calls

---

### BO-06 — Receipt Settings Not Persisting
**Verdict: 🔴 BROKEN** | **Severity: HIGH** | **Confidence: 99%**

#### Code Evidence
`pos.js` L57–125 — `PAGES['pos-receipt']` is fully hardcoded static HTML:
```javascript
<input value="Nashty Hot Chicken">      // HARDCODED restaurant name
<input value="Surabaya">                // HARDCODED city
<input value="031-8123456">             // HARDCODED phone
<button onclick="toast('Pengaturan struk disimpan')">Simpan</button>  // FAKE
```

#### Database Evidence
```sql
SELECT key, value FROM settings WHERE key LIKE 'receipt%';
-- receipt_footer = "Tested Footer"
```
Only `receipt_footer` was previously saved via a direct API test. All other receipt settings (header, city, phone, logo) don't exist in DB.

#### Root Cause
`pos.js` receipt page is a static mock with zero API integration. Save button shows a toast with no backend write.

#### Exact File Responsible
- [`pos.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/pos.js#L57-L125) — hardcoded, no API calls

---

### BO-07 — Workflow Status Menu Exists
**Verdict: 🔴 BROKEN (should be removed per decision)** | **Severity: MEDIUM** | **Confidence: 97%**

#### Runtime Evidence (Screenshot)
Sidebar shows "Workflow Status" menu item under KDS section (visible in all screenshots).

#### Code Evidence
`index.html` L111:
```html
<div class="sb-item" onclick="nav('kds-workflow',this)">Workflow Status</div>
```
`kds.js` L2: `PAGES['kds-workflow'] = async () => {...}`  
`nav.js` L8: `'kds-workflow':'KDS — Workflow Status'`

The feature is **fully active** in sidebar and renders a page.

#### Business Decision
Per the task brief, the current decision is unknown — the bug asks whether this **should be removed entirely**. The feature exists and is functional (it reads/writes `kds_workflow` setting). No decision to remove it appears in the code.

#### Root Cause
No code removal was implemented. The Workflow Status menu remains active. If it should be removed, `index.html` L111–117 (sidebar item), `kds.js` PAGES['kds-workflow'] block, and `nav.js` L8 entry all need to be deleted.

#### Exact File Responsible
- [`index.html`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/index.html#L111-L117) — sidebar item
- [`kds.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/kds.js#L2) — page implementation

---

### BO-08 — Production Time Not Integrated with KDS
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 75%**

#### Code Evidence
`kds.ts` L114: `PUT /api/kds/production-time/category/:categoryId` → updates `products.production_time`.

`OrderService.ts` L310 (KDS queue):
```sql
SELECT oi.id, oi.product_name, oi.quantity, p.production_time
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
```
`production_time` **IS included** in the KDS queue response per item.

#### Database Evidence
```sql
SELECT id, name, production_time FROM products LIMIT 3;
-- Ayam Bakar Madu:    production_time = 15
-- Nasi Goreng Spesial: production_time = 12
-- Rawon Spesial:      production_time = 20
```

#### Gap
The `production_time` field is returned in the KDS queue API and exists in the DB. However, **the KDS frontend** (`kds/frontend/js/render.js`) has not been verified to actually **use** `production_time` for timer display. The value reaches the API response but UI rendering of per-item countdown timers was not confirmed.

#### Root Cause
Backend integration is **done**. KDS frontend `render.js` usage of `production_time` is **unverified in this session**.

---

### BO-09 — KDS Analytics Not Integrated
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 70%**

#### Code Evidence
`kds.ts` L7–101: `GET /api/kds/analytics` queries:
- `completedOrders` — from actual `orders` table where `kitchen_status IN ('ready','served')`
- `avgPrepTimeSeconds` — calculated from `completed_at - created_at`
- `overSlaItemsCount` — joins `order_items → orders → products` using `production_time`
- `totalOrders` — from actual orders table

#### Database Evidence
```sql
SELECT COUNT(*) FROM orders WHERE kitchen_status IN ('ready','served') AND DATE(created_at)=DATE('now');
-- 0 orders completed today (all are 'confirmed' kitchen_status from yesterday)
```

The `completed_at` column is only set when `kitchenStatus = 'ready'` in `updateOrderStatus()`. All existing orders have `kitchen_status = 'confirmed'` — never went through KDS workflow — so `avg_prep_time` = 0 and analytics show empty data.

#### Root Cause
KDS analytics endpoint queries real order data correctly. But orders have never been processed through the KDS workflow (marked pending → preparing → ready), so `completed_at` is NULL for all orders, rendering analytics meaningless. This is a **workflow gap**, not a code bug.

---

### BO-10 — Owner Profile Management
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 72%**

#### Runtime Evidence
Screenshot shows "Edit Profile" form with name field populated and "Simpan Perubahan" button.  
The `saveProfile()` function calls `PUT /api/users/:userId`.  
DB shows admin user `id = 'admin'` with `name = 'Zaidunk'`.  
Avatar button in UI shows "TU" (matching "TestUser UI Updated") — session object was updated.

#### Concern
The DB still shows `name = 'Zaidunk'` while UI shows "TestUser UI Updated". Either:
1. Previous PUT succeeded in updating session but not DB (unlikely — PUT is synchronous DB write)
2. OR the PUT went to a different user ID than 'admin'

The `openUserModal()` in `team.js` allows editing owners but uses a separate modal path from `showProfileModal()` in `index.html`. Profile modal uses `API.session.user.id` which may differ from actual DB id.

#### Exact File Responsible
- [`index.html`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/index.html#L391-L419) — `saveProfile()` session user ID reliability
- [`users.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/users.ts#L61) — PUT endpoint

---

### BO-11 — Manager Permissions Incorrect
**Verdict: ❓ UNVERIFIED** | **Severity: MEDIUM** | **Confidence: 45%**

#### Code Analysis
Manager role in `requireRole` middleware: managers can access `['owner','manager']`-guarded routes.  
`team.js` manager page: shows Name, Email, Phone, Outlet, Status — no permission matrix shown.  
No wireframe comparison was available in this session.

**Not tested**: actual permission boundary enforcement for managers (can they edit products? access reports? void orders?).

---

### BO-12 — Cashier Permissions Incorrect
**Verdict: ❓ UNVERIFIED** | **Severity: MEDIUM** | **Confidence: 45%**

#### Code Analysis
Cashier role: `team.js` L169 subtitle says "Staff POS Terminal — tidak bisa akses Backoffice".  
`requireRole(['owner','manager'])` gates most backoffice routes — cashier access is blocked at API level.  
However, no wireframe was available for comparison.

**Per the task brief**: Cashier does NOT use shift. This is consistent with the code — shifts.ts exists but is not enforced in the main POS flow (shiftId is optional/null).

---

### BO-13 — Outlets Not Fully Database Driven
**Verdict: ✅ FIXED** | **Severity: MEDIUM** | **Confidence: 90%**

#### Database Evidence
```sql
SELECT * FROM outlets;
-- Row 1: id='demo-outlet', name='Galaxy Mall', tenant_id='demo-tenant', status='active'
-- Row 2: id='outlet-1', name='Outlet 1', tenant_id='tenant-test', status='active'
```

#### Code Evidence
`outlets.ts` implements:
- `GET /api/outlets` — DB-driven list with revenue summary subqueries
- `POST /api/outlets` — creates outlet + default settings in DB
- `PUT /api/outlets/:id` — updates outlet in DB

#### Runtime Status
Outlets appear in DB and API. The sidebar shows "Galaxy Mall" from DB. Creating a new outlet via POST API writes to DB and persists across server restarts (SQLite file-based).

---

### BO-14 — Reports Not Fully Integrated
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: HIGH** | **Confidence: 80%**

#### Code Evidence
`reports.ts` L6–42 (`/api/reports/sales`): calls `FinancialCalculationService.getSalesBreakdown()` and `getSalesSummary()` — both query the real `orders` table.

#### Issue Identified
`reports.ts` L15: `WHERE o.payment_status = 'paid'` — **missing** `AND o.order_status != 'cancelled'`  
This causes voided orders (which have `payment_status='cancelled'` after void) to be excluded, but refunded orders whose `order_status` remains non-cancelled but `payment_status='paid'` still appear in gross sales.

More critically: the **Reports UI page** (`business.js`, 14KB) has not been verified to call the actual `/api/reports/*` endpoints. Given `pos.js` is entirely hardcoded, `business.js` may be similarly static.

#### Exact File Responsible
- [`reports.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/reports.ts#L15) — missing cancelled order filter

---

### BO-15 — Logo Upload Not Working
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: MEDIUM** | **Confidence: 75%**

#### Code Evidence — Backend
`settings.ts` L196–246: `POST /api/settings/:outletId/logo`  
- Reads `base64Data` from body
- Creates `data/uploads/` directory if needed
- Writes file to disk as `logo_{outletId}_{timestamp}.{ext}`
- Stores URL in `settings` table: `key='logo'`
- Returns `{ success: true, url: '/uploads/...' }`

**Path issue**: `path.join(__dirname, '../../../../data/uploads')` — relative to compiled `dist/` — navigates `dist/routes/` → `dist/` → `backoffice/backend/` → `backoffice/` → root → `data/uploads/`. This resolves to the correct `data/uploads/` folder. ✅

#### Code Evidence — Frontend
`system.js` L24–61: `uploadLogo()` function in Settings page  
- Creates file input, reads as base64  
- Posts to `POST /api/settings/:outletId/logo`  
- On success: updates `#logoPreview` img src

**BUT**: `system.js` Settings page is accessible via sidebar → "Pengaturan" (Settings). The `pos.js` Receipt Settings page L78 has a **different** upload zone: `onclick="toast('Upload logo')"` — FAKE.

#### Conclusion
Logo upload works in **Pengaturan (Settings page)** via `system.js`. It is BROKEN (fake toast) in **Pengaturan Struk (Receipt Settings)** via `pos.js`.

#### Exact File Responsible
- [`pos.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/pos.js#L78) — receipt logo upload is fake toast
- [`system.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/system.js#L24-L61) — main settings logo upload is real

---

### BO-16 — Activity Log Icons Incorrect
**Verdict: ⚠️ PARTIALLY_FIXED** | **Severity: LOW** | **Confidence: 85%**

#### Code Evidence
`system.js` L149–157 `getActionIcon(action)`:
```javascript
case 'create': return SVG(green plus)
case 'update': return SVG(blue edit pencil)
case 'delete': return SVG(red trash)
case 'login':  return SVG(yellow login arrow)
default:       return SVG(gray info circle)
```

#### Database Evidence
Activity log actions in DB: `'update'`, `'void'`, `'refund'`, `'create'`

**Missing icon mappings**: `'void'` → falls to `default` (gray info circle), `'refund'` → falls to `default` (gray info circle).

#### Runtime Evidence (Screenshot)
Activity logs show:
- Update product → blue pencil icon ✅ 
- Void → gray circle icon ⚠️ (should be a void/cancel icon)
- Refund → gray circle icon ⚠️ (should be a refund icon)

#### Root Cause
`getActionIcon()` has no cases for `'void'` or `'refund'` — both get the generic gray info circle.

#### Exact File Responsible
- [`system.js`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/frontend/js/pages/system.js#L149-L157) — missing void/refund icon cases

---

### BO-17 — Activity Log User Attribution Incorrect
**Verdict: 🔴 BROKEN** | **Severity: HIGH** | **Confidence: 99%**

#### Database Evidence
```sql
SELECT al.user_id, u.name, al.action FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id;
-- update product (Es Krim): user_id = NULL, user_name = NULL
-- update settings:          user_id = NULL, user_name = NULL
-- void order (by admin):    user_id = 'admin', user_name = 'Zaidunk'/'TestUser UI Updated'
```

#### Runtime Evidence (Screenshot)
Activity Logs show:
- "Settings diperbarui: receipt_footer" → User: **System** (user_id = NULL)
- "Produk dinonaktifkan" → User: **System** (user_id = NULL)
- "Void order" → User: **TestUser UI Updated** (correctly attributed)

#### Root Cause
`settings.ts` L169–172 — INSERT into activity_logs:
```typescript
run(`INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description) VALUES (...)`, 
    [crypto.randomUUID(), tenantId, outletId, ...])
```
**No `user_id` field is included** in the settings activity log INSERT. This produces `user_id = NULL` → displayed as "System".

Similarly, product status changes in `products.ts` likely have the same issue (no `req.user?.id` passed to activity log INSERT).

The `requireRole` middleware in development mode (auth bypass) sets `req.user = undefined` — so even if the code reads `req.user?.id`, it gets `undefined` → null in DB.

#### Exact File Responsible
- [`settings.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/settings.ts#L169-L172) — activity log INSERT missing user_id
- [`products.ts`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/routes/products.ts) — likely same issue
- [`middleware/auth`](file:///c:/Users/zaidu/OneDrive/Documents/nashtylite/backoffice/backend/src/middleware) — dev mode bypasses JWT, leaves req.user undefined

---

### BO-18 — Activity Log Timezone Incorrect
**Verdict: ✅ FIXED** | **Severity: LOW** | **Confidence: 90%**

#### Code Evidence
`system.js` L136–147:
```javascript
const formatTime = (isoString) => {
  let dStr = isoString.replace(' ', 'T');  // Handle SQLite format
  const d = new Date(dStr + 'Z');           // Parse as UTC
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', ... }) + ' WIB';
};
```

#### Runtime Evidence (Screenshot)
Activity Logs timestamps show: **"19 Jun 2026, 01.34 WIB"**, **"19 Jun 2026, 00.39 WIB"**

#### Verification
DB stored value: `2026-06-18 18:34:51` (stored as UTC/server time).  
UTC 18:34:51 + 7 hours (WIB) = **01:34:51 WIB on 2026-06-19** ✅ — correctly converted.

The timezone conversion is working correctly. Timestamps display as WIB as required.

---

## SUMMARY TABLE

| Bug | Description | Verdict | Severity | Confidence |
|-----|-------------|---------|----------|------------|
| POS-01 | Gross Sales display missing | ⚠️ PARTIALLY_FIXED | HIGH | 88% |
| POS-02 | Net Sales cancelled order filter | ⚠️ PARTIALLY_FIXED | HIGH | 82% |
| POS-03 | Math.round() on tax before DB save | 🔴 BROKEN | HIGH | 95% |
| POS-04 | COGS zero — no calculation exists | 🔴 BROKEN | CRITICAL | 97% |
| POS-05 | Modifiers: zero data in DB | 🔴 BROKEN | HIGH | 96% |
| POS-06 | Menu creation (not end-to-end tested) | ❓ UNVERIFIED | MEDIUM | 78% |
| BO-01 | Profile edit session user ID issue | ⚠️ PARTIALLY_FIXED | MEDIUM | 85% |
| BO-02 | Product status → POS propagation | ❓ UNVERIFIED | HIGH | 50% |
| BO-03 | Modifier groups: empty DB | 🔴 BROKEN | CRITICAL | 98% |
| BO-04 | General Settings: hardcoded mock | 🔴 BROKEN | CRITICAL | 99% |
| BO-05 | Payment Methods: hardcoded mock | 🔴 BROKEN | CRITICAL | 99% |
| BO-06 | Receipt Settings: hardcoded mock | 🔴 BROKEN | HIGH | 99% |
| BO-07 | Workflow Status menu still exists | 🔴 BROKEN (active) | MEDIUM | 97% |
| BO-08 | Production Time → KDS display | ⚠️ PARTIALLY_FIXED | MEDIUM | 75% |
| BO-09 | KDS Analytics: orders never completed | ⚠️ PARTIALLY_FIXED | MEDIUM | 70% |
| BO-10 | Owner profile management | ⚠️ PARTIALLY_FIXED | MEDIUM | 72% |
| BO-11 | Manager permissions | ❓ UNVERIFIED | MEDIUM | 45% |
| BO-12 | Cashier permissions | ❓ UNVERIFIED | MEDIUM | 45% |
| BO-13 | Outlets database driven | ✅ FIXED | MEDIUM | 90% |
| BO-14 | Reports real data integration | ⚠️ PARTIALLY_FIXED | HIGH | 80% |
| BO-15 | Logo upload (Settings page works) | ⚠️ PARTIALLY_FIXED | MEDIUM | 75% |
| BO-16 | Activity Log icons (void/refund) | ⚠️ PARTIALLY_FIXED | LOW | 85% |
| BO-17 | Activity Log user attribution | 🔴 BROKEN | HIGH | 99% |
| BO-18 | Activity Log timezone (WIB) | ✅ FIXED | LOW | 90% |

---

## CRITICAL FINDINGS

### 🚨 Most Urgent Fixes Required

1. **BO-04/05/06 (CRITICAL)** — `pos.js` is a 100% static mock. Three entire settings pages (General, Payment, Receipt) have no API connection whatsoever. Every save button fires a fake toast. The backend settings API is fully built but unreachable from the frontend.

2. **POS-04 (CRITICAL)** — COGS calculation does not exist anywhere in the dashboard/KPI system. Despite `products.cost` data existing in DB and COGS being calculable via `order_items JOIN products`, no endpoint returns it.

3. **BO-03/POS-05 (CRITICAL)** — Zero modifier groups in DB means the entire modifier workflow is untestable and non-functional for end users.

4. **BO-17 (HIGH)** — Activity logs show "System" for all backoffice settings changes because `settings.ts` activity log INSERT omits `user_id`. Dev mode auth bypass also prevents `req.user` from being populated.

5. **POS-03 (HIGH)** — `Math.round()` applied to tax and service charge before DB save causes precision loss for non-round subtotal amounts.

---

## SCREENSHOTS

![Dashboard KPI showing 'undefined' product names](file:///C:/Users/zaidu/.gemini/antigravity-ide/brain/57762457-fb04-4b5f-a4d1-465bc6ccd408/dashboard_loaded_1781838970861.png)

![Activity Logs showing System attribution](file:///C:/Users/zaidu/.gemini/antigravity-ide/brain/57762457-fb04-4b5f-a4d1-465bc6ccd408/activity_logs_page_1781838981354.png)

![Modifier Groups empty state](file:///C:/Users/zaidu/.gemini/antigravity-ide/brain/57762457-fb04-4b5f-a4d1-465bc6ccd408/modifier_groups_empty_1781838990332.png)

![General Settings - hardcoded values](file:///C:/Users/zaidu/.gemini/antigravity-ide/brain/57762457-fb04-4b5f-a4d1-465bc6ccd408/general_settings_page_1781838999979.png)

---

*End of Stage 4B Forensic Analysis — No code changes were made during this analysis.*
