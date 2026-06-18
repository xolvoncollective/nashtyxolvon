# Service Boundary Enforcement Report

This document evaluates whether strict architectural boundaries are maintained between the Service layer, Controller layer, and Database layer.

## Violations Detected

### 1. Routes Bypassing Services
- **`orders.ts`**: Modifies the `kitchen_status` of orders and items via direct `UPDATE` queries (e.g., Line 288), intentionally bypassing `OrderService.updateOrderStatus()`, which causes the system to skip vital Activity Logging.
- **`settings.ts`**: Bypasses the `SettingsService` for persisting payment methods and settings, executing direct `upsert` and `run` commands.
- **`crm.ts` / `members.ts`**: Bypasses the `MemberService` to execute direct CRUD queries on member and reward tables.
- **`shifts.ts`**: Opens and closes shifts via direct `run` queries instead of delegating to a `ShiftService` or `FinancialCalculationService`.

### 2. Direct SQL Recreating Service Logic
- **`dashboard.ts`**: Creates explicit SQL groupings to calculate gross sales and order counts for charts, completely redefining the logic housed inside `FinancialCalculationService`.
- **`reports.ts`**: Hardcodes Profit and COGS calculations as raw SQL mathematics (`SUM(subtotal) - (cost * qty)`) instead of extending the `FinancialCalculationService` to handle margin calculation.
- **`outlets.ts`**: Calculates "Today's Revenue" using an isolated, ad-hoc `SELECT SUM(total)` subquery.

### 3. Service Ownership Gaps
- **Missing Domain Integration**: `OrderService` handles financial calculations and inventory deduction during order creation, but it never triggers CRM Point accumulation. There is a missing integration between `OrderService` and `MemberService`.

## Conclusion
While the foundational Service classes exist and cross-service communication (e.g., `OrderService` -> `ProductService`) is working correctly, the **Controllers do not respect the boundaries**. The architecture suffers from heavy Controller -> Database leakage, negating many of the benefits of the service layer.
