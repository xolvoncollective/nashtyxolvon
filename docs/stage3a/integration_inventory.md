# Module Integration Inventory

## Overview
This document analyzes the current interactions, consumers, and providers across all modules within the NashtyLite platform.

## Module Interactions

### 1. POS Module -> Backoffice (Orders)
- **Provider**: `OrderService` (Backoffice)
- **Consumer**: POS Client
- **Shared Entity**: `orders`, `order_items`, `payments`
- **Read Flow**: Fetches order history and active tables.
- **Write Flow**: Pushes new orders and payment confirmations via `createOrder`.
- **Synchronization**: Synchronous database write.

### 2. Backoffice -> KDS (Kitchen Display System)
- **Provider**: `OrderService` (Backoffice)
- **Consumer**: KDS Interface
- **Shared Entity**: `orders.kitchen_status`, `order_items.kitchen_status`
- **Read Flow**: KDS polls `/api/orders/kitchen/queue` (via `getKitchenQueue`).
- **Write Flow**: KDS patches `/api/orders/:id/items/:itemId/status` (via `updateOrderItemStatus`).
- **Synchronization**: Real-time DB reads (polling).

### 3. Cost Calculation -> Products (Missing Integration)
- **Provider**: `costs.ts` (`cost_recipes`, `cost_bahan`)
- **Consumer**: `products.ts` (Should consume recipe costs, but currently isolated).
- **Shared Entity**: Conceptually `product.cost`, but currently duplicated as `cost_recipes.hpp_total`.
- **Read Flow**: None.
- **Write Flow**: None.
- **Synchronization**: **BROKEN** (Requires manual entry in both modules).

### 4. POS (Orders) -> Inventory (Missing Integration)
- **Provider**: `OrderService`
- **Consumer**: Inventory / `cost_bahan`
- **Shared Entity**: Raw materials / Stock.
- **Read Flow**: None.
- **Write Flow**: `OrderService.createOrder` calls `ProductService.deductStock()` which deducts `products.stock_qty`, but **NOT** `cost_bahan.stok`.
- **Synchronization**: **BROKEN** (Ingredients are not deducted upon sale).

### 5. POS (Orders) -> CRM (Members)
- **Provider**: `OrderService`
- **Consumer**: `MemberService` (CRM)
- **Shared Entity**: `crm_customers`, `crm_point_transactions`
- **Read Flow**: POS reads member info to display points.
- **Write Flow**: Currently, POS generates orders but there is NO automated hook in `OrderService.createOrder` to trigger `MemberService.handlePointTransaction()`. Points are awarded manually.
- **Synchronization**: **BROKEN** (Points require manual POS cashier intervention).

### 6. Reports/Dashboard -> Financial Calculations
- **Provider**: `FinancialCalculationService`
- **Consumer**: `reports.ts`, `dashboard.ts`
- **Shared Entity**: `orders`
- **Read Flow**: Fetches aggregated sales, BCG matrix, and profit metrics synchronously.
- **Write Flow**: None (Read-only module).
- **Synchronization**: Synchronous SQL aggregations.

## Summary
While the Service Layer acts as an excellent internal orchestrator, Cross-Module boundaries (Orders to CRM, Cost to Products) are currently functioning as isolated data silos.
