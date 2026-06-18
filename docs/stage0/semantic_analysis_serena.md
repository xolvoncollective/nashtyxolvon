# Semantic Cross Validation (Phase 3 - Serena MCP)

This document traces semantic structures, database flows, and SQL query origins using Serena MCP `search_for_pattern`. 

## 1. Architectural Flows
- **Database Connection Source**: `backoffice/backend/src/db/database.ts` directly opens the SQLite file at the resolved absolute path.
- **Database Initialization**: Traced from `index.ts` -> `initDatabase()` in `database.ts` -> Executes `schema.sql` if tables do not exist.
- **Dependency Chain**: **API -> Database**. (VERIFIED: There is no intermediate Service or Repository layer. The codebase utilizes `get()` and `query()` wrapper functions straight into the sqlite connection.)
- **Shared Utilities**: The core database wrapper (`database.ts`) provides `db.prepare()`, `run()`, `get()`, and `query()` which are heavily imported across routes.

## 2. Hardcoded Aggregation Logic
Serena semantic trace reveals that all financial math is locked inside raw SQL queries:
- **File:** `backoffice/backend/src/routes/shifts.ts`
  - **Function:** `GET /shifts/:id`
  - **Query:** `SELECT COALESCE(SUM(total), 0) as total_sales FROM orders WHERE shift_id = s.id AND payment_status = 'paid'`
  - **Target Table:** `orders` -> Corresponding Live SQLite Table: `orders`
  - **Status:** VERIFIED
- **File:** `backoffice/backend/src/routes/dashboard.ts`
  - **Function:** `GET /dashboard/summary`
  - **Query:** `SELECT COALESCE(SUM(total), 0) as total_sales`
  - **Target Table:** `orders` -> Corresponding Live SQLite Table: `orders`
  - **Status:** VERIFIED

## 3. Duplicated Logic & Modules Accessing Identical Tables
Serena discovered that Ghost Architecture files have identical SQL queries to the monolith:
- **File:** `pos/backend/src/routes/orders.ts` & `kds/backend/src/routes/orders.ts` & `backoffice/backend/src/routes/orders.ts`
  - **Function:** `GET /orders/:id`
  - **Query:** `SELECT * FROM order_items WHERE order_id = ?`
  - **Target Table:** `order_items` -> Corresponding Live SQLite Table: `order_items`
  - **Status:** VERIFIED (Code is duplicated 3x)
- **File:** `pos/backend/src/routes/shifts.ts` & `backoffice/backend/src/routes/shifts.ts`
  - **Query:** `SELECT s.*, u.name as user_name, o.name as outlet_name FROM shifts...`
  - **Status:** VERIFIED (Code is duplicated 2x)

## 4. CRM and Cost Data Silos
- **File:** `backoffice/backend/src/routes/crm.ts`
  - **Query:** `SELECT * FROM crm_customers WHERE tenant_id = ?`
  - **Target Table:** `crm_customers` -> Corresponding Live SQLite Table: `crm_customers`
  - **Status:** VERIFIED
- **File:** `backoffice/backend/src/routes/members.ts`
  - **Query:** `SELECT * FROM members WHERE phone = ?`
  - **Target Table:** `members` -> Corresponding Live SQLite Table: `members`
  - **Status:** VERIFIED (Proves identical entities exist in disjoint tables)
- **File:** `backoffice/backend/src/routes/costs.ts`
  - **Query:** `SELECT * FROM cost_bahan WHERE tenant_id = ?`
  - **Target Table:** `cost_bahan` -> Corresponding Live SQLite Table: `cost_bahan`
  - **Status:** VERIFIED
