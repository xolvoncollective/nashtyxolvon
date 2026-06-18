# Cost Synchronization Validation

## Objective
Verify the propagation path: Recipe Cost Change -> Product Cost Update -> COGS Update -> Profit Update.
Verify the source of truth remains `CostService`.

## Verification

### 1. The CostService Entity
**Claim**: `CostService` acts as the source of truth and pushes updates to `ProductService`.

**Reality**:
`CostService.ts` does not exist in `backend/src/services/`.

### 2. Financial Service Calculation
**Claim**: Profit updates based on dynamically synced costs.

**Reality**:
In `FinancialCalculationService.ts`, profit is estimated directly from the static `products.cost` column:
```typescript
SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as estimated_profit
```
Because the sync from R&D recipes never happens, this `p.cost` value will remain stagnant unless manually updated by management.

## Conclusion
**FAILED**. The cost synchronization integration was never built. R&D recipe costs do not sync to live POS products.
