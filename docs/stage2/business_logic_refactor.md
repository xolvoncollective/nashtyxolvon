# Business Logic Refactoring (Stage 2)

## Overview
During Stage 2, the business logic embedded within the Express route controllers was extracted and centralized into a dedicated Service Layer (`services/`). This resolved widespread code duplication and established a single source of truth for domain rules.

## Services Created
1. **`FinancialCalculationService`**: Centralized logic for `getShiftSummary`, `getSalesSummary`, `getSalesBreakdown`, and `getSalesByOrderType`. Replaces `SUM()` and `CASE WHEN` queries previously copy-pasted across `shifts.ts`, `reports.ts`, and `dashboard.ts`.
2. **`OrderService`**: Encapsulates `createOrder`, `updateOrderStatus`, `voidOrder`, and `refundOrder`. This centralizes the calculation of subtotal, tax, service charge, discount, and total, ensuring price manipulation is impossible from the frontend.
3. **`ProductService`**: Created `checkAvailability` and `deductStock` to handle stock integrity checks.
4. **`SettingsService`**: Created `resolveSettings` and `getTaxAndServiceChargeRate` to standardize the retrieval of tenant vs outlet-level configurations.
5. **`MemberService`**: Created `validateOrRegisterMember` and `handlePointTransaction` to bridge the gap between `members.ts` and `crm.ts`.

## Controllers Refactored
The following route controllers were refactored to consume the new service layer:
- `orders.ts`
- `shifts.ts`
- `reports.ts`
- `dashboard.ts`
- `settings.ts`
- `members.ts`
- `crm.ts`

## Outcomes
- **Thin Controllers**: The route controllers now strictly handle HTTP request/response formatting, while delegating domain logic to the Service Layer.
- **Single Source of Truth**: Rules regarding order creation, stock availability, and financial calculations exist in only one place.
- **Data Integrity**: The `FinancialCalculationService` ensures that the KPI dashboard matches the daily shift reports perfectly, eliminating calculation drift.
