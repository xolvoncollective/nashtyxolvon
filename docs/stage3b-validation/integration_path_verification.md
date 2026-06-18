# Integration Path Verification

## Objective
Verify every claimed integration path exists in code. Provide call hierarchy, ownership validation, and evidence.

## Claims vs. Reality

### 1. Order Creation Integration
**Claim**: `OrderService.createOrder()` -> `ProductService.deductStock()` -> `CostService.deductIngredients()` -> `MemberService.handlePointTransaction()`

**Reality**:
- Source Method: `OrderService.createOrder()`
- Target Methods found: `ProductService.deductStock()`
- Target Methods **MISSING**: `CostService.deductIngredients()`, `MemberService.handlePointTransaction()`

**Evidence**:
In `OrderService.ts`, `createOrder()` only executes the following side-effects:
```typescript
ProductService.deductStock(item.productId, item.quantity);
```
No invocation of `CostService` or `MemberService` occurs within this flow.

### 2. Void Order Integration
**Claim**: `OrderService.voidOrder()` -> `ProductService.restoreStock()`, `CostService.restoreIngredients()`, `MemberService.reversePointTransaction()`

**Reality**:
- Source Method: `OrderService.voidOrder()`
- Target Methods found: **None**

**Evidence**:
In `OrderService.ts`, `voidOrder()` only updates the database status directly:
```typescript
run(`
  UPDATE orders SET order_status = 'cancelled', ...
  WHERE id = ?
`, [...]);
```
There are no calls to restore stock, restore ingredients, or reverse points.

### 3. Cost Sync Integration
**Claim**: `CostService` triggers `ProductService.updateProductCost()` upon recipe promotion.

**Reality**:
- Source Method: `CostService.promoteRecipe()` (Presumed)
- Reality: **`CostService.ts` does not exist in the codebase.** 

**Evidence**:
A search of `backend/src/services` reveals:
- CacheManager.ts
- FinancialCalculationService.ts
- MemberService.ts
- OrderService.ts
- ProductService.ts
- SettingsService.ts

## Conclusion
**FAILED**. The integration paths claimed in the walkthrough do not exist in the codebase.
