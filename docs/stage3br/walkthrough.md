# Stage 3B-R Walkthrough

## What Validation Discovered
Stage 3B Validation exposed that although boundaries were formally declared, actual cross-domain interactions between Order, CRM, Inventory, and Cost modules were essentially mockups and not present in the runtime codebase. Orders did not award CRM points. Refunds did not reverse them. Voiding orders drained inventory permanently without restoration logic. Cost integrations did not synchronize.

## What Was Missing
- **CRM Linking**: Missing payload schemas and event triggers to bind `crm_customers` to POS `orders`.
- **Inventory Rescue**: Missing `restoreStock` method in `ProductService`.
- **Cost Engine**: The `CostService` did not exist, leading controllers to handle recipe manipulation manually without cascading product COGS synchronization.

## What Was Implemented
- Expanded `CreateOrderSchema` to accept customer identity.
- Wired `OrderService.updateOrderStatus('completed')` to trigger `MemberService.handlePointTransaction` natively.
- Developed `CostService.ts` to manage all recipes and ingredients.
- Wired recipe mutation explicitly to update product `cost` dynamically for `FinancialCalculationService` consumption.
- Implemented `ProductService.restoreStock()` to undo stock deductions when `OrderService.voidOrder` is executed.

## Why Implementation Points Were Chosen
- **Order Completion Event**: A transaction is legally closed when the state moves to `'completed'`. Hooking CRM generation precisely here ensures we don't grant points to orders that sit in 'kitchen pending'.
- **Cost Service Sync on Update**: Synchronizing `products.cost` instantly when `hpp_total` is saved in `CostService.updateRecipe` forces the analytics module to immediately see current margins without needing scheduled batch jobs or complex caching logic.

## Transaction Behavior
All mutations were wrapped in `transaction(() => {})` via `database.ts` ensuring that partial failures in point adjustments or stock restorations completely rollback the overarching action.

## Rollback Behavior
- **Refunds**: Deduct points via a CRM `'redeem'` offset matching the exact value originally accrued, maintaining audit ledgers rather than deleting point rows.
- **Voids**: Refund cash dynamically, execute stock restorations one-to-one per line-item, and flag the kitchen queue.

## Ownership Decisions
- `MemberService` is the sole owner of points. Order queries it; it never queries Order.
- `ProductService` is the sole owner of inventory quantities.
- `CostService` is the sole owner of recipe modeling.
- `FinancialCalculationService` owns zero write operations, validating its position strictly as an analytics consumer.

## Final Architecture
The backend strictly upholds a decoupled, service-oriented domain model where `routes` merely act as traffic cops, delegating exclusively to tightly-scoped Services that enforce real integrations gracefully.
