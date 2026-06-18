# Inventory Validation

## Objective
Verify that creating an order correctly alters products stock, raw ingredient stock, and cost_bahan. Verify that voiding an order restores all inventory correctly.

## Verification

### 1. Order Creation
**Claim**: `products`, `raw ingredient stock`, and `cost_bahan` all change correctly.

**Reality**:
- `ProductService.deductStock()` is successfully called by `OrderService.createOrder()`. Finished goods with `stock_tracking = 1` are properly deducted from `products.stock_qty`.
- **Raw Ingredient Deduction Fails**: There is no code in `OrderService.ts` that triggers raw material or ingredient deduction. `CostService` does not exist. `cost_bahan` is never mutated during a checkout.

### 2. Order Void
**Claim**: All inventory is restored correctly upon `voidOrder`.

**Reality**:
- **Restoration Fails**: `OrderService.voidOrder` does not execute any logic to restore the deducted stock in the `products` table.
- Raw ingredients were never deducted in the first place, but if they had been, there is no code to restore them either.

## Evidence
`OrderService.ts` `voidOrder` method:
```typescript
static async voidOrder(id: string, reason: string, voidBy: string, managerPin: string) {
  // Authentication checks...
  
  run(`
    UPDATE orders SET
      order_status = 'cancelled',
      kitchen_status = 'served',
      payment_status = 'cancelled',
      notes = COALESCE(notes || ' | ', '') || ?,
      updated_at = ?
    WHERE id = ?
  `, [...]);

  run(`INSERT INTO activity_logs ...`);
  return order;
}
```
*Note the total absence of `ProductService.restoreStock()`.*

## Conclusion
**FAILED**. While finished goods are deducted upon checkout, raw ingredients are completely ignored. Furthermore, voiding an order permanently destroys the finished goods inventory since there is no restoration logic.
