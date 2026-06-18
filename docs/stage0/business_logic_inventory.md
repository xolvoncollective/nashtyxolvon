# Business Logic Inventory (Stage 0 Baseline)

## Financial Calculations (Gross Sales, Net Sales, Tax, Discount, SC, Total)
**Location:** `backoffice/backend/src/routes/shifts.ts` and `backoffice/backend/src/routes/reports.ts`
**Implementation:**
- Financial calculations are **NOT** centralized in a service layer.
- They are implemented via raw SQLite `SUM()` and `CASE WHEN` statements embedded directly inside Express route handlers.
- Example (`shifts.ts` line 170-175):
  ```sql
  COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN subtotal ELSE 0 END), 0) as gross_sales,
  COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN discount ELSE 0 END), 0) as total_discount,
  ```
- **Duplication:** Identical raw SQL calculations are duplicated between the shifts summary endpoints and the reporting endpoints (`reports.ts` lines 39-44).

## COGS (Cost of Goods Sold)
**Location:** Likely isolated inside the `cost` module silo. The core `orders` table and `products` table do not seem to actively link to `cost_bahan` in real-time. Wait for Stage 1 for deep inspection, but it implies a severe data silo.

## Order Total & Item Subtotal
**Location:** `backoffice/backend/src/routes/orders.ts` and its duplicate `pos/backend/src/routes/orders.ts`.
**Implementation:** 
- Calculated at the time of order creation on the client or within the raw INSERT statement.
- The schema requires `subtotal`, `discount`, `tax`, `service_charge`, and `total` to be passed or calculated manually during `POST /api/orders`.

## Soft Delete & Status Management
**Location:** 
- `users.ts`: `PATCH /:id/status`
- `products.ts`: `PATCH /:id/status`
- `orders.ts`: `PATCH /:id/status`
**Implementation:** 
- Soft deletes or status changes are executed by direct SQL `UPDATE table SET status = ? WHERE id = ?`.
- No global repository pattern handles soft deletes; it's repeated per controller.

## Duplicated Implementations
Because there are duplicate API routers (`auth.ts`, `orders.ts`, `categories.ts`) in `/backoffice`, `/pos`, and `/kds`, any business logic implemented in these controllers is physically copy-pasted across the microservice boundary (even though the `start-local.ps1` script bypasses the other backends).

## Summary
The business logic layer is **non-existent**. All business rules, state transitions, and financial calculations are embedded within the Database Access Layer via raw SQL queries placed directly inside the Presentation Layer (Express Route Controllers).
