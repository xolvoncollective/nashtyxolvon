# Data Silo Analysis

## Overview
Identifies bounded contexts that have failed to integrate with the core nervous system of the application.

### Silo A: Cost Calculation Module (`costs.ts`)
- **Owned Data**: Raw ingredients (`cost_bahan`), pricing history, recipes (`cost_recipes`).
- **Consumers**: None. It is a completely dead-end module.
- **Integration Gaps**: Missing hooks into the Menu (Products) and Checkout (Orders).
- **Recommended Integration Direction**: Wrap into `CostService` and expose `calculateRecipeCost(productId)` and `deductIngredients(productId)`.

### Silo B: CRM Module (`crm.ts`)
- **Owned Data**: Customers, points, rewards.
- **Consumers**: POS UI (for lookup).
- **Integration Gaps**: Missing transactional hook from checkout.
- **Recommended Integration Direction**: Expose global settings for Point Generation Rates in `SettingsService`. Call `MemberService` upon successful checkout.

### Silo C: Inventory (`products.stock_tracking`)
- **Owned Data**: Finished good counts.
- **Consumers**: `OrderService` (Deducts stock).
- **Integration Gaps**: Disconnected from raw materials.
- **Recommended Integration Direction**: A master `InventoryService` must bridge the gap between `cost_bahan` and `products`.

### Conclusion
The architecture has successfully consolidated the "Reporting" silo into a unified `FinancialCalculationService`, but CRM and Costing remain entirely cut off from the main POS heartbeat.
