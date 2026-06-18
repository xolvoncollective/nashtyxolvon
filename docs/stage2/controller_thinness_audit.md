# Controller Thinness Audit

This document assesses whether controllers effectively delegate business logic and data access to the Service layer, or if they violate "thin controller" principles by directly handling database access and business logic.

## Findings Matrix

| Controller (`routes/`) | Delegates to Service? | Direct SQL / DB Execution? | Embeds Business Logic? | Audit Result |
|------------------------|-----------------------|----------------------------|------------------------|--------------|
| `orders.ts` | Yes (`OrderService`) | Yes (`query`, `run`) | Yes (Filters, Kitchen status updates) | **Violated** |
| `reports.ts` | Yes (`Financial...`) | Yes (`query` for products, staff) | Yes (Menu engineering logic) | **Violated** |
| `dashboard.ts` | Yes (`Financial...`) | Yes (`query` for charts, products) | Yes (Growth calculation) | **Violated** |
| `shifts.ts` | Yes (`Financial...`) | Yes (`run`, `query` for shifts) | Yes (Variance calculation) | **Violated** |
| `crm.ts` | Yes (`MemberService`) | Yes (`query`, `run` for CRUD) | No | **Violated** (Data Access Leak) |
| `settings.ts` | Yes (`SettingsService`)| Yes (`run`, `upsert`) | Yes (Payment method loop) | **Violated** (Data Access Leak) |
| `members.ts` | Yes (`MemberService`) | Yes (`insert`, `update`) | No | **Violated** (Data Access Leak) |

## Violations Detail

1. **Controller → SQL Violations:**
   - `dashboard.ts` manually executes complex SQL queries (e.g., `weekly-chart`, `payment-distribution`, `hourly-sales`, `recent-orders`). These aggregations bypass `FinancialCalculationService`.
   - `reports.ts` directly executes SQL to fetch products, categories, and cashiers instead of routing through a reporting service.
   - `orders.ts` directly updates `kitchen_status` of individual `order_items` via `run()`.
   - `shifts.ts` handles shift opening and closing logic directly via `run()`, including expected cash calculations.

2. **Controller → Business Logic Violations:**
   - Growth percentage calculation is embedded directly in `dashboard.ts` instead of being returned by the Financial service.
   - Expected cash vs actual cash variance logic is calculated in `shifts.ts`.

## Conclusion
While Services have been introduced, they do **not** have exclusive ownership. Controllers are **not thin**. Every single controller continues to directly query the database and execute its own bespoke SQL, violating strict Service Layer patterns.
