# Order Flow Validation

This document verifies whether `OrderService` holds authoritative ownership over core transactional processes.

## Target Validation

| Responsibility | Owned by `OrderService`? | Validation Result |
|----------------|--------------------------|-------------------|
| Order Creation | Yes | **PASS** (Strictly centralized in `createOrder`) |
| Pricing Math | Yes | **PASS** (Item subtotal, multipliers) |
| Tax & Service Charge | Yes | **PASS** (Calculation done via Settings integration) |
| Discount Application | Yes | **PASS** (Validation against subtotals exists) |
| Void Logic | Yes | **PASS** (Requires Manager PIN, logging centralized) |
| Refund Logic | Yes | **PASS** (Logs and balance updates centralized) |
| Status Updates | Partially | **FAIL** (Duplicate logic found in `orders.ts` line 299) |

## Key Findings
1. **Strong Core Consolidation**: Order creation, voiding, and refunding have been successfully consolidated. No direct `INSERT INTO orders` (outside of seeding) exists.
2. **Status Update Leakage**: `OrderService` provides an `updateOrderStatus` method that includes logging. However, `orders.ts` (the controller) manually executes an `UPDATE orders SET kitchen_status = 'ready'` query, completely bypassing the service layer and skipping the associated activity logging.

## Conclusion
`OrderService` is highly effective and largely authoritative, but it has not achieved 100% exclusivity due to the controller manually mutating order statuses.
