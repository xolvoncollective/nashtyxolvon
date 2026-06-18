# Financial Logic Validation

This document verifies whether `FinancialCalculationService` is the single source of truth for financial aggregations.

## Target Validation

| Financial Metric | Owned by `FinancialCalculationService`? | Validation Result |
|------------------|-----------------------------------------|-------------------|
| Gross Sales | Partially | **FAIL** (Duplicated in Dashboard and Reports via raw SQL `SUM(oi.subtotal)`) |
| Net Sales | Partially | **FAIL** (Duplicated in Outlets, Dashboard, Shifts via raw SQL `SUM(o.total)`) |
| COGS / Profit | No | **FAIL** (Hardcoded exclusively in `reports.ts`) |
| Revenue | Partially | **FAIL** (Duplicated across charts and dashboards) |
| Shift Summary | Yes | **PASS** (`getShiftSummary` handles all shift data) |
| Dashboard Summary | Partially | **FAIL** (Some KPIs are delegated, but chart data bypasses the service) |

## Key Findings
1. **Incomplete Consolidation**: The `FinancialCalculationService` exists and exposes valid methods (`getSalesSummary`, `getSalesBreakdown`), but it has not been fully integrated across the codebase.
2. **Missing Business Logic**: Profit margin and COGS calculations are entirely missing from the service layer, leaving `reports.ts` as the sole container for this critical financial math.

## Conclusion
`FinancialCalculationService` is **NOT** authoritative. Raw SQL aggregations scattered across controllers still act as secondary, disconnected sources of truth for financial data.
