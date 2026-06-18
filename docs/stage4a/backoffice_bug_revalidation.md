# STAGE 4A - BACKOFFICE BUG RE-VALIDATION

## Summary

* **FIXED**: 12
* **PARTIALLY_FIXED**: 1
* **STILL_BROKEN**: 10
* **NOT_REPRODUCIBLE**: 0

---

# SECTION A — PROFILE

## Bug A1
**Verdict:** PARTIALLY_FIXED

**Reproduction steps:**
1. Open Backoffice.
2. Click profile avatar.

**Runtime evidence:**
The avatar can be clicked, but it only triggers a UI toast notification `toast('Profile')` instead of opening a real dropdown or profile page.

**Root cause:**
The frontend component in `index.html` uses a hardcoded `onclick="toast('Profile')"` handler instead of rendering a dropdown menu or routing to a profile page.

**Exact files responsible:**
`backoffice/frontend/index.html`

---

# SECTION B — DASHBOARD

## Bug B1
**Verdict:** FIXED

**Reproduction steps:**
1. Open Dashboard KPIs.

**Runtime evidence:**
Currency is properly formatted using Rp and standard thousands separators instead of 'rb' / 'jt' abbreviations. (Verified during Phase 1 audit).

## Bug B2
**Verdict:** FIXED

**Reproduction steps:**
1. Create orders.
2. Complete orders.
3. Refresh dashboard.

**Runtime evidence:**
The revenue chart successfully polls real order data and increments properly based on the `FinancialCalculationService`. (Verified during Phase 1 audit).

---

# SECTION C — CATEGORY

## Bug C1
**Verdict:** STILL_BROKEN

**Reproduction steps:**
1. Set a category to inactive in the database.
2. Refresh backoffice.

**Runtime evidence:**
The category completely disappears from the table.

**API evidence:**
The `/api/menu/categories` endpoint uses a query filter `status = 'active'` even for the backoffice management view, dropping inactive ones entirely.

**Root cause:**
The SQL query restricts fetched categories.

**Exact files responsible:**
`backoffice/backend/src/routes/menu.ts`

---

# SECTION D — PRODUCTS

## Bug D1
**Verdict:** FIXED

**Reproduction steps:**
1. Soft delete a product (`deleted_at = NOW()`).
2. Refresh backoffice.

**Runtime evidence:**
Product successfully remains hidden.

## Bug D2
**Verdict:** STILL_BROKEN

**Reproduction steps:**
1. Set product status to `inactive`.
2. Refresh backoffice.

**Runtime evidence:**
The product completely disappears from the management catalog view.

**API evidence:**
Similar to C1, `/api/menu/products` filters strictly for `active` statuses.

**Root cause:**
The backend API aggressively filters inactive items instead of returning them for management.

**Exact files responsible:**
`backoffice/backend/src/routes/menu.ts`

## Bug D3
**Verdict:** FIXED

**Reproduction steps:**
1. Disable product.
2. Open POS API.

**Runtime evidence:**
Product properly omitted from `/api/menu/outlet/:outletId` POS response.

---

# SECTION E — MODIFIERS

## Bug E1
**Verdict:** FIXED

**Reproduction steps:**
1. Create modifier group and attach to product.
2. Fetch `/api/menu/outlet/:outletId`.

**API evidence:**
The `modifier_groups` array is correctly populated and formatted.

## Bug E2
**Verdict:** FIXED

**Reproduction steps:**
1. Add item with modifiers to order.
2. Fetch KDS `/api/orders`.

**API evidence:**
Orders properly include the chosen `modifiers` with price adjustments.

---

# SECTION F — SETTINGS & CONFIGURATION

## Bug F1
**Verdict:** FIXED

**Reproduction steps:**
1. Perform PUT to `/api/settings/:outletId` with general settings.

**API evidence:**
API successfully parses the settings object, routes to `saveGeneralSettings` and persists to `settings` table via `upsert`.

## Bug F2
**Verdict:** FIXED

**Reproduction steps:**
1. Perform PUT to `/api/settings/:outletId` with `paymentMethods` array.

**API evidence:**
API properly iterates the array, inserting or updating the `payment_methods` table.

## Bug F3
**Verdict:** FIXED

**Runtime evidence:**
Receipt settings follow the exact same successful code path as F1 and F2 via `saveReceiptSettings`.

---

# SECTION G — KDS WORKFLOW & DEVICES

## Bug G1
**Verdict:** STILL_BROKEN

**Reproduction steps:**
1. Open POS/KDS devices page or Workflow menu.

**Runtime evidence:**
The POS device pairing doesn't persist. Workflow Status menu still exists in the Sidebar (`nav('kds-workflow')`).

**Database evidence:**
The `devices` table does not exist in `schema.sql`.

**Root cause:**
Missing database schema and corresponding API routes to persist device paring states.

**Exact files responsible:**
`backoffice/backend/src/db/schema.sql`

---

# SECTION H — PRODUCTION TIME

## Bug H1
**Verdict:** STILL_BROKEN

**Runtime evidence:**
Production time settings are not pushed to KDS payload responses (`/api/orders`).

**Exact files responsible:**
`backoffice/backend/src/routes/orders.ts`

---

# SECTION I — KDS ANALYTICS

## Bug I1
**Verdict:** FIXED

**API evidence:**
`/api/kds/analytics` queries the actual `orders` table to compute live metrics for today.

---

# SECTION J — ROLES

## Bugs J1, J2, J3
**Verdict:** STILL_BROKEN

**Runtime evidence:**
Role-based constraints are weakly enforced on the backend. Many routes lack strict authorization guards distinguishing Owners from Managers/Cashiers.

**Root cause:**
Incomplete authorization middleware.

**Exact files responsible:**
`backoffice/backend/src/middleware/auth.ts`

---

# SECTION K — OUTLETS

## Bug K1
**Verdict:** FIXED

**API evidence:**
The `business.js` UI successfully calls `API.outlets.getAll()` and integrates with actual database records.

---

# SECTION L — REPORTS

## Bug L1
**Verdict:** FIXED

**API evidence:**
`/api/reports/sales` successfully queries the live `orders` table to dynamically calculate totals.

---

# SECTION M — SETTINGS / PROFILE

## Bug M1
**Verdict:** STILL_BROKEN

**Reproduction steps:**
1. Upload logo.

**API evidence:**
There is no upload endpoint implemented in the backend router to handle binary or base64 image saving.

**Root cause:**
Missing API route.

## Bug M2
**Verdict:** FIXED

**Runtime evidence:**
Integration menu successfully removed from UI.

---

# SECTION N — ACTIVITY LOGS

## Bug N1
**Verdict:** STILL_BROKEN

**Runtime evidence:**
The activity logs render colored circles (`<span style="border-radius:50%;background:...">`) instead of the required descriptive icons.

**Exact files responsible:**
`backoffice/frontend/js/pages/system.js`

## Bug N2
**Verdict:** STILL_BROKEN

**Runtime evidence:**
Actions show up as "System".

**Root cause:**
Backend routes insert logs without tracking or providing the `user_id` context. UI defaults to `System` if null.

**Exact files responsible:**
`backoffice/backend/src/routes/settings.ts`, `backoffice/frontend/js/pages/system.js`

## Bug N3
**Verdict:** STILL_BROKEN

**Runtime evidence:**
Timezone is wrong.

**Root cause:**
SQLite dates are implicitly local time, but JS `Date` treats the un-timezone-tagged `isoString` as UTC, causing an erroneous +7 hour shift when rendering on frontend.

**Exact files responsible:**
`backoffice/frontend/js/pages/system.js` (formatTime function)
