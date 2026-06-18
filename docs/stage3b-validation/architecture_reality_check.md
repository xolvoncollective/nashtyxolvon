# Architecture Reality Check

## Objective
Compare the claimed architecture in `walkthrough.md` against the actual code. Identify what is implemented, partially implemented, and not implemented.

## Comparison Table

| Claim from Walkthrough | Implementation Status | Reality / Evidence |
|-------------------------|-----------------------|--------------------|
| `OrderService` calls `ProductService` (Validate/Deduct Finished Goods) | **Implemented** | `ProductService.deductStock()` is called within `createOrder()`. |
| `OrderService` calls `CostService` (Deduct Raw Ingredients) | **Not Implemented** | `CostService.ts` does not exist. No deduction occurs. |
| `OrderService` calls `MemberService` (Award/Reverse Points) | **Not Implemented** | `MemberService` is not imported or called by `OrderService`. |
| `CostService` calls `ProductService` (Sync Pricing upon Recipe Promotion) | **Not Implemented** | `CostService.ts` does not exist. |
| Void Order restores Inventory (`ProductService`, `CostService`) | **Not Implemented** | `voidOrder` only updates `orders` table. No restoration logic exists. |
| Void Order reverses Points (`MemberService`) | **Not Implemented** | No reversal logic exists. |
| `FinancialCalculationService` is read-only | **Implemented** | The service exclusively performs `SELECT` queries. |
| Data ownership is perfectly maintained | **Partially Implemented** | Boundaries are not violated, but this is only because the integration pipes were never actually built. |

## Conclusion
The `walkthrough.md` document reads as a design specification rather than an accurate reflection of the codebase. The vast majority of the Stage 3B requirements are **Not Implemented**.
