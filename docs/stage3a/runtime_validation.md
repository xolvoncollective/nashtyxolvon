# Runtime Validation Findings

## Overview
This document logs the runtime synchronization behavior observed across the application flows. Validation was performed by analyzing execution paths for state propagation.

## Execution Matrix

### 1. Create Product -> View Reports
- **Result**: Immediate visibility.
- **Observation**: Fully synchronized. The reporting layer reads directly from the central database schema.

### 2. Create Order -> View Dashboard
- **Result**: Immediate visibility.
- **Observation**: Fully synchronized. `FinancialCalculationService` pulls live aggregates. 

### 3. Update Recipe Cost -> View Product Margin
- **Result**: **FAILED (Stale Data)**
- **Observation**: Updating `hpp_total` in `cost_recipes` does NOT alter `products.cost`. The Dashboard and Reports continue displaying old margin data until a user manually navigates to the POS menu and updates the product cost by hand.

### 4. Create Order -> View CRM Points
- **Result**: **FAILED (Missing Automation)**
- **Observation**: Checking out a cart with a `member_id` does NOT increase the member's points. Cashiers are forced to open the CRM tab and manually input points.

### 5. Void Order -> View Inventory
- **Result**: **FAILED (Stock Drift)**
- **Observation**: The inventory (`stock_qty`) remains permanently deducted despite the order being voided.

### 6. Create Order -> View Raw Ingredients
- **Result**: **FAILED (Siloed Data)**
- **Observation**: `cost_bahan.stok` never moves. The entire raw materials ledger is dead weight unless manually reconciled.

## Conclusion
The POS operates flawlessly in a vacuum. However, the ecosystem around it (CRM, Cost Calculation, Inventory) operates completely manually. The integration tissue between these domains does not exist.
