# Data Flow Mapping

## Overview
A comprehensive mapping of end-to-end business workflows, noting the services invoked, DB queries executed, and any downstream consequences.

### 1. Create Product
- **Trigger**: Client POST `/api/products`
- **Service Called**: Controller -> `ProductService` is missing here (Wait, `products.ts` doesn't have a full Service layer for creation, only `ProductService.checkAvailability` and `deductStock` exist). Actually, `products.ts` directly creates products via SQL.
- **Database Writes**: `INSERT INTO products`, `INSERT INTO product_modifiers`
- **Database Reads**: Category validation.
- **Dependent Services**: None.
- **Downstream Consumers**: Available immediately to POS `OrderService`.

### 2. Update Recipe (R&D)
- **Trigger**: Client PUT `/api/costs/recipes/:id`
- **Service Called**: None. Direct `costs.ts` controller.
- **Database Writes**: `UPDATE cost_recipes`
- **Database Reads**: None.
- **Dependent Services**: None.
- **Downstream Consumers**: None. (Isolated).

### 3. Create Order (Checkout)
- **Trigger**: Client POST `/api/orders`
- **Service Called**: `OrderService.createOrder`
- **Database Reads**: `SettingsService` (Tax/SC), `ProductService` (Pricing).
- **Database Writes**: `orders`, `order_items`, `order_item_modifiers`, `payments`, `activity_logs`.
- **Dependent Services**: `ProductService.deductStock()`
- **Downstream Consumers**: KDS Queue instantly updates; Financial Reports instantly reflect new revenue.

### 4. Void Order
- **Trigger**: Client POST `/api/orders/:id/void`
- **Service Called**: `OrderService.voidOrder`
- **Database Reads**: Manager PIN validation.
- **Database Writes**: `UPDATE orders` (status), `activity_logs`.
- **Dependent Services**: None. (Notice: Missing stock re-addition; missing point deduction).
- **Downstream Consumers**: Financial Reports instantly reflect loss in revenue.

### 5. Award Points
- **Trigger**: Client POST `/api/crm/point-transactions`
- **Service Called**: `MemberService.handlePointTransaction`
- **Database Reads**: Current point balance.
- **Database Writes**: `INSERT crm_point_transactions`, `UPDATE crm_customers`.
- **Dependent Services**: None.
- **Downstream Consumers**: POS Member lookup.

### 6. Update Settings
- **Trigger**: Client PUT `/api/settings/:key`
- **Service Called**: Controller -> DB (Settings are cached via `SettingsService` maybe, wait, `SettingsService` fetches directly from DB).
- **Database Writes**: `UPDATE settings`
- **Database Reads**: None.
- **Dependent Services**: None.
- **Downstream Consumers**: Next `OrderService.createOrder` pull will instantly use new Tax/SC rules.
