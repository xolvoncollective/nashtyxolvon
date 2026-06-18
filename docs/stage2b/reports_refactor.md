# Reports Refactor Report

## Objective
Ensure `reports.ts` delegates all analytical logic, COGS calculations, and BCG matrix engineering to the `FinancialCalculationService.ts`.

## Changes Implemented
1. **`GET /products`**: Replaced inline profit math (`SUM(oi.subtotal) - (cost * qty)`) with `FinancialCalculationService.getProductPerformanceReport()`.
2. **`GET /cashiers`**: Removed inline SQL aggregating `SUM(total_sales)` and `void_count`; delegated to `FinancialCalculationService.getCashierPerformanceReport()`.
3. **`GET /menu-engineering`**: Extracted complex BCG matrix categorization (Stars, Plowhorses, Puzzles, Dogs) out of the controller and centralized it inside `FinancialCalculationService.getMenuEngineeringReport()`.

## Result
`reports.ts` is now a fully decoupled orchestration layer that contains no business rules, margins, or raw SQL data manipulation.
