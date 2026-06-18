# Synchronization Gap Analysis

## Overview
Identifies critical breaks in automated data propagation, requiring manual user intervention to reconcile systems.

### Gap 1: Recipe Costing vs Actual Product Margins
- **Current Behavior**: R&D establishes a final Recipe with `hpp_total` and a target `harga_jual`. This data sits permanently in `cost_recipes`.
- **Expected Behavior**: Promoting a Recipe to "final" should automatically update the LIVE POS product's `cost` and `price`.
- **Business Impact**: HIGH. Owners must manually type changes into the POS menu configuration, risking fatal margin errors and data staleness. 

### Gap 2: Inventory Depletion (Bahan)
- **Current Behavior**: `OrderService` triggers `ProductService.deductStock()`, which deducts `products.stock_qty`. Raw ingredients (`cost_bahan.stok`) are never deducted.
- **Expected Behavior**: Selling a product should look up its recipe ingredients and deduct raw material weights proportionally from `cost_bahan`.
- **Business Impact**: CRITICAL. The system cannot currently provide accurate COGS or real-time raw material inventory.

### Gap 3: Automated Loyalty Generation
- **Current Behavior**: Checking out an order generates revenue but does not award points to the member attached to the order. Points must be awarded manually via the CRM dashboard.
- **Expected Behavior**: `OrderService.createOrder` should detect an attached `member_id` and automatically call `MemberService.handlePointTransaction` based on a global conversion rate.
- **Business Impact**: MODERATE. Loss of cashier efficiency and highly error-prone customer experience.

### Gap 4: Order Void Reversals
- **Current Behavior**: Voiding an order merely changes the status to 'cancelled'. It does not refund member points, nor does it return `products.stock_qty` to inventory.
- **Expected Behavior**: `OrderService.voidOrder` should trigger reverse inventory adjustments and reverse CRM transactions.
- **Business Impact**: HIGH. Stock drift occurs every time an order is voided.
