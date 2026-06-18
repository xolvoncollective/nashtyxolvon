# MASTER BASELINE (Stage 0)

## Executive Summary
This document serves as the official source of truth and baseline established during **Stage 0 — Discovery & Baseline**. The objective of this stage was pure knowledge acquisition without performing any refactoring, structural modifications, or database mutations. The entire ecosystem was evaluated to discover ghost architectures, data silos, broken persistence layers, and duplicated logic.

---

## 1. Architecture Overview
- **Monolith Serving Micro-Frontends**: The `start-local.ps1` script binds to port 3099, utilizing `backoffice/backend` to statically serve `/pos`, `/kds`, `/backoffice`, `/crm`, and `/cost`.
- **Ghost Architecture**: `pos/backend` and `kds/backend` exist but are functionally abandoned/bypassed.
- **Silos**: `crm` and `cost` are primarily included as pre-compiled `dist` directories with minimal integration.
*Ref: [architecture_map.md](./architecture_map.md)*

## 2. Module Relationship Diagram (Dependency Analysis)
- All "modules" (POS, KDS, Backoffice) physically map their dependencies to the same SQLite database (`data/nashtypos.db`).
- There is massive duplication of code (`auth.ts`, `orders.ts`, `categories.ts`) duplicated into `pos`, `kds`, and `backoffice` API folders.
*Ref: [dependency_analysis.md](./dependency_analysis.md)*

## 3. API Overview
- Heavily RESTful architecture relying heavily on the monolithic `backoffice/backend/src/index.ts`.
- Endpoints manipulate business state directly via raw SQL queries.
*Ref: [api_contract.md](./api_contract.md)*

## 4. Database Overview
- SaaS-ready SQLite schema (`tenants`, `outlets`, `users`).
- **Data Silos Discovered**: Customer data is duplicated between `members` (POS) and `crm_customers` (CRM). Cost calculations (`cost_bahan`) are completely detached from POS `products`.
*Ref: [database_baseline.md](./database_baseline.md)*

## 5. Business Logic Inventory
- The ecosystem **lacks a business logic service layer**.
- Financial calculations (Gross, Net, Tax, Discount) are written as `SUM(...)` directly in SQL queries embedded in `shifts.ts` and `reports.ts`.
- Updates (like soft deletes) execute via raw SQL `UPDATE` queries scattered across controllers.
*Ref: [business_logic_inventory.md](./business_logic_inventory.md)*

## 6. Integration Map
- POS to Backoffice: Polling/REST (No WebSockets).
- KDS to POS: KDS polls `/api/orders/kitchen/queue` every 5 seconds.
- CRM & Cost: Isolated database tables, indicating fragmented monolithic boundaries rather than clean bounded contexts.
*Ref: [integration_map.md](./integration_map.md)*

## 7. Smoke Test Summary
- Applications successfully loaded via `start-local.ps1` bypass auth mechanisms successfully (`NODE_ENV=development`).
- POS auto-shift-start logic failed with 400 Bad Request if the user already had a shift, but handled gracefully.
- Destructive operations (Create/Update/Delete) were skipped to respect Read-Only constraints.
*Ref: [smoke_test_report.md](./smoke_test_report.md)*

## 8. Regression Checklist Summary
- Outlined critical paths: Order Creation, Order Voiding, Payments, and Reporting aggregations.
- Identified that changes to the Orders API will be the most brittle integration point due to overlapping data references.
*Ref: [regression_checklist.md](./regression_checklist.md)*

## 9. Risk Matrix Summary
- **Critical Risk**: Refactoring financial SQL aggregations inside `shifts.ts` and `reports.ts`.
- **Medium Risk**: De-duplicating customer data (`members` vs `crm_customers`).
- **Low Risk**: Deleting ghost architectures (`pos/backend`, `kds/backend`).
*Ref: [risk_matrix.md](./risk_matrix.md)*

---
**Stage 0 is now COMPLETE. The knowledge baseline has been established.**
