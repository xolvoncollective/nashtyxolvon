# Integration Candidates

## Overview
Proposed integration paths to eliminate data silos and bridge synchronization gaps across the ecosystem.

### 1. Recipe Promotion to POS
- **Source**: `cost_recipes` (Cost Module)
- **Target**: `products` (Product Module)
- **Trigger**: User calls `/api/costs/recipes/:id/promote`
- **Business Value**: Guarantees POS prices and target margins reflect live R&D costs automatically.
- **Complexity**: Low. (Simple update to `products.cost` and `products.price`).
- **Risk**: Low. (Explicit user action triggers it).

### 2. Live Inventory Depletion (Raw Materials)
- **Source**: `orders` (Checkout)
- **Target**: `cost_bahan` (Cost Module)
- **Trigger**: Successful completion of `OrderService.createOrder`
- **Business Value**: Live COGS and predictive purchasing for raw materials.
- **Complexity**: High. (Requires traversing `products` -> `cost_recipes` -> `cost_bahan` to calculate fractional weight depletion per ingredient).
- **Risk**: High. (Could cause heavy database locking during high-volume POS hours).

### 3. Automated Point Generation
- **Source**: `orders` (Checkout)
- **Target**: `crm_point_transactions` (CRM Module)
- **Trigger**: Successful completion of `OrderService.createOrder`
- **Business Value**: Eliminates manual cashier friction, guarantees 100% accurate loyalty tracking.
- **Complexity**: Medium. (Requires adding global "Points per Rp" setting, and optionally tier multipliers).
- **Risk**: Low. (Safe, async-friendly operation).

### 4. Void & Refund Reversals (Inventory + Points)
- **Source**: `OrderService.voidOrder` / `refundOrder`
- **Target**: `ProductService`, `MemberService`
- **Trigger**: Order is cancelled by a Manager.
- **Business Value**: Prevents stock drift and eliminates point fraud from cancelled orders.
- **Complexity**: Medium.
- **Risk**: Medium. (Requires careful transaction wrapping to avoid partial reversals).
