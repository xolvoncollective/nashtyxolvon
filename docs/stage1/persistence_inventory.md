# Persistence Inventory

This document catalogs every database write operation currently implemented in the backend, identifying the module, the architectural path (Route / Service), the database tables involved, and the operation type.

## Core POS Entities (Refactored)

| Module | Route | Service | Database Tables | Operation Type |
|--------|-------|---------|-----------------|----------------|
| Users | `/users` | N/A | `users`, `activity_logs` | INSERT, UPDATE, SOFT_DELETE |
| Products | `/products` | N/A | `products`, `product_modifiers`, `activity_logs` | INSERT, UPDATE, SOFT_DELETE, DELETE |
| Categories | `/categories` | N/A | `categories`, `products` (cascade), `activity_logs`| INSERT, UPDATE, SOFT_DELETE |
| Modifiers | `/modifiers` | N/A | `modifier_groups`, `modifier_options`, `product_modifiers` | INSERT, UPDATE, SOFT_DELETE, DELETE |
| Settings | `/settings` | N/A | `settings` | UPSERT, UPDATE, DELETE |
| Outlets | `/outlets` | N/A | `outlets` | INSERT, UPDATE, SOFT_DELETE |
| Members | `/members` | MemberService | `members`, `crm_point_transactions`, `crm_customers` | INSERT, UPDATE, SOFT_DELETE |

## Operational Entities (Mixed Implementation)

| Module | Route | Service | Database Tables | Operation Type |
|--------|-------|---------|-----------------|----------------|
| Orders | `/orders` | OrderService | `orders`, `order_items`, `payments` | INSERT, UPDATE, DELETE |
| Shifts | `/shifts` | N/A | `shifts` | INSERT, UPDATE |
| KDS | `/kds` | N/A | `products` (production_time) | UPDATE |
| Menu | `/menu` | N/A | `products`, `categories` | UPDATE |

## CRM & Cost Management (Direct DB Writes)

| Module | Route | Service | Database Tables | Operation Type |
|--------|-------|---------|-----------------|----------------|
| CRM | `/crm` | N/A | `crm_customers`, `crm_rewards` | INSERT, UPDATE, DELETE |
| Costs | `/costs`| N/A | `cost_bahan`, `cost_riwayat_harga`, `cost_recipes` | INSERT, UPDATE, DELETE |

## Observations
- **Direct Database Writes:** `crm.ts` and `costs.ts` are using `db.run()` with hardcoded SQL and `DELETE` instead of `softDelete()`. This bypasses the centralized persistence utilities.
- **Service Layer Bypasses:** Only `Orders` and `Members` use a `Service` class. The rest of the routes handle DB writes directly.
- **Mixed Deletion Strategies:** Some modules use `softDelete` (Users, Products, Categories, Modifiers), while others (Orders, CRM, Costs, Settings) use hard `DELETE` or lack soft deletion completely.
