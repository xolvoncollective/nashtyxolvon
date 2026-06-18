# Authoritative Source Of Truth Map

## Overview
This document identifies the primary owner of every business entity in the system, mapping out duplicate sources and highlighting synchronization risks.

## Entity Mapping

### 1. Product Pricing & Core Data
- **Authoritative Service**: `ProductService`
- **Authoritative Table**: `products`
- **Consumers**: `OrderService` (reads for cart), Dashboard (reads for Top Products).
- **Duplicate Sources**: `cost_recipes.harga_jual` (Target price from RnD).
- **Current Sync Status**: **UNSYNCED**. Manual update required when RnD recipe finishes.

### 2. Product Cost (COGS)
- **Authoritative Service**: Currently split between `ProductService` (`cost`) and Cost Module (`cost_recipes.hpp_total`).
- **Authoritative Table**: *Ambiguous*. `products.cost` is used for reporting; `cost_recipes.hpp_total` is used for RnD.
- **Consumers**: `FinancialCalculationService` (reads `products.cost` for BCG matrix).
- **Current Sync Status**: **UNSYNCED**. Financial reports rely on `products.cost`, which must be manually typed in by admins, disregarding dynamic recipe fluctuations.

### 3. Orders & Transactions
- **Authoritative Service**: `OrderService`
- **Authoritative Table**: `orders`, `order_items`
- **Consumers**: Financial Reports, Dashboard, Shifts, KDS.
- **Duplicate Sources**: None.
- **Current Sync Status**: **STABLE**. (Single source of truth maintained).

### 4. Inventory (Raw Materials)
- **Authoritative Service**: None explicitly (CRUDed directly in `costs.ts`).
- **Authoritative Table**: `cost_bahan.stok`
- **Consumers**: None.
- **Duplicate Sources**: `products.stock_qty` tracks finished goods, not raw ingredients.
- **Current Sync Status**: **ISOLATED**.

### 5. Members & Loyalty
- **Authoritative Service**: `MemberService`
- **Authoritative Table**: `crm_customers`, `crm_point_transactions`
- **Consumers**: POS.
- **Duplicate Sources**: None.
- **Current Sync Status**: **STABLE** internally, but isolated from automated POS workflows.

### 6. System Settings (Tax, SC)
- **Authoritative Service**: `SettingsService`
- **Authoritative Table**: `settings`
- **Consumers**: `OrderService` (for pricing).
- **Duplicate Sources**: None.
- **Current Sync Status**: **STABLE**. Fetched synchronously during checkout.

## Conclusion
The core transactional engines (Orders, Settings) are highly authoritative. However, Product Costs and Pricing suffer from split-brain ownership between the `products` table and the `cost_recipes` table.
