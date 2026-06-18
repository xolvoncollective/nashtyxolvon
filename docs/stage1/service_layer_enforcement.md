# Service Layer Enforcement

This document analyzes whether database mutations flow through approved Service layers, or if they bypass them.

## Findings

| Module | Route | Bypasses Service Layer? | Observation |
|--------|-------|-------------------------|-------------|
| Members | `members.ts` | No | Delegated to `MemberService`. |
| Orders | `orders.ts` | Partial | Uses `OrderService` for checkout, but explicitly executes `db.run('UPDATE order_items...')` in kitchen status update. |
| Settings | `settings.ts` | Yes | Uses raw `upsert` and `run` directly in route. Doesn't use a SettingsService for writes. |
| Outlets | `outlets.ts` | Yes | Uses `run` to execute INSERT and UPDATEs directly. |
| CRM | `crm.ts` | Yes | Direct `db.run` operations for INSERT, UPDATE, DELETE. Only delegates point transactions to `MemberService`. |
| Costs | `costs.ts` | Yes | Direct `db.run` operations. Completely bypasses any Service Layer. |
| Products | `products.ts` | Yes | Uses centralized `insert`, `update`, `softDelete`, but logic is still entirely inside the route handler. |
| Categories | `categories.ts` | Yes | Uses centralized `insert`, `update`, `softDelete` directly in the route handler. |

## Enforcement Analysis
The persistence layer lacks a unified strategy for write operations. While `persistence.ts` provides centralized query wrappers (`insert`, `update`, `softDelete`), many routes ignore them entirely, opting for raw SQL queries (`db.run`).
There is almost zero Service Layer enforcement for database writes outside of complex transactions (e.g., checkout and point updates).

**Risk:** High. Scattered write logic makes it difficult to enforce validation, data constraints, and caching invalidation.
