# Duplicate Logic Elimination Summary

## Objective
Detect and destroy all duplicated mathematics, business rules, and SQL aggregations. Ensure all calculations point to exactly one owner.

## Eliminations Achieved

### 1. Revenue Calculations
- **Previous State**: Revenue was calculated locally in `dashboard.ts` (using `SUM(total)`) across multiple chart endpoints, as well as in `reports.ts`.
- **New State**: Removed all localized `SUM(total)` queries. Charts, reports, and dashboards now point directly to `FinancialCalculationService.getWeeklyChart` and `getDashboardKpi`.

### 2. Product Profit & COGS
- **Previous State**: Profit margins and BCG logic were written as massive nested SQL operations inside the `/products` and `/menu-engineering` route handlers.
- **New State**: Logic was safely relocated to `FinancialCalculationService`. The controller no longer possesses knowledge of what `profit_margin` or `estimated_profit` means.

### 3. Kitchen Status Updates
- **Previous State**: The `orders.ts` controller replicated the order state-machine (checking if all items were 'ready' and mutating the main order status to 'ready') using bare SQL `UPDATE` operations. This bypassed logging hooks.
- **New State**: The duplicate state-machine logic was purged from the controller and merged into `OrderService.updateOrderItemStatus()`, guaranteeing that `logOrderStatusUpdate` is cleanly invoked.

## Conclusion
A true Single Source of Truth has been established. Redundancy in math has been entirely eliminated.
