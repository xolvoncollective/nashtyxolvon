# Service Layer Inventory

This document catalogs the current business logic services, detailing their responsibilities, public interfaces, consumers, and ownership boundaries.

## 1. FinancialCalculationService
- **Responsibilities**: Summarizes shift data, gross sales, net sales, taxes, discounts, and high-level sales breakdown.
- **Public Methods**: 
  - `getShiftSummary(shiftId)`
  - `getSalesSummary(tenantId, params)`
  - `getSalesBreakdown(tenantId, params)`
  - `getSalesByOrderType(tenantId, params)`
- **Consumers**: `shifts.ts`, `dashboard.ts`, `reports.ts`.
- **Database Tables**: `orders`, `order_items`, `shifts`, `users`, `outlets`.
- **Business Rules Owned**: Shift summarization, global sales aggregations.

## 2. OrderService
- **Responsibilities**: Validates and creates orders, calculates line-item subtotals, determines order-level discounts and taxes, deducts inventory, handles voids and refunds.
- **Public Methods**: 
  - `createOrder(data)`
  - `updateOrderStatus(id, orderStatus, kitchenStatus)`
  - `voidOrder(id, reason, voidBy, managerPin)`
  - `refundOrder(id, reason, refundAmount, refundBy)`
- **Consumers**: `orders.ts`.
- **Database Tables**: `orders`, `order_items`, `order_item_modifiers`, `payments`, `activity_logs`.
- **Business Rules Owned**: Order pricing logic, Tax and Service Charge calculation (via SettingsService), Inventory deduction (via ProductService), Manager PIN authorization for voids.

## 3. ProductService
- **Responsibilities**: Ensures sufficient product availability and handles stock deductions.
- **Public Methods**: 
  - `checkAvailability(productId, requestedQty)`
  - `deductStock(productId, quantity)`
- **Consumers**: `OrderService`.
- **Database Tables**: `products`.
- **Business Rules Owned**: Stock validation, strict threshold validation.

## 4. MemberService
- **Responsibilities**: Auto-registers unregistered members, manages point tracking and conversions.
- **Public Methods**: 
  - `validateOrRegisterMember(phone, name)`
  - `handlePointTransaction(tenantId, customerId, points, type, description)`
- **Consumers**: `members.ts`, `crm.ts`.
- **Database Tables**: `members`, `crm_point_transactions`, `crm_customers`.
- **Business Rules Owned**: Point addition and deduction logic.

## 5. SettingsService
- **Responsibilities**: Resolves fallback/inherited settings logic and outputs system configurations.
- **Public Methods**: 
  - `resolveSettings(tenantId, outletId)`
  - `getTaxAndServiceChargeRate(tenantId, outletId)`
- **Consumers**: `settings.ts`, `OrderService`.
- **Database Tables**: `settings`.
- **Business Rules Owned**: Tax/SC percentage retrieval logic, nested setting parsing.
