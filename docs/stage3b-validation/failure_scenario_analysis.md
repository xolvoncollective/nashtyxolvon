# Failure Scenario Verification

## Objective
Analyze the behavior of the system under specific failure scenarios as defined in the validation requirements.

## Scenarios

### Scenario A: Order created, Inventory deducted, Points generation fails
- **Actual Behavior**: Points generation *always* fails because the integration does not exist (`MemberService.handlePointTransaction` is never called).
- **Risk Level**: High. Guaranteed point fraud / missing customer rewards.
- **Recommended Fix**: Implement the integration inside the `OrderService.createOrder` transaction block so both succeed or fail together.

### Scenario B: Order created, Points generated, Inventory deduction fails
- **Actual Behavior**: If `ProductService.deductStock` fails (e.g., due to strict stock limits), the database transaction in `createOrder` throws an error and rolls back the order creation.
- **Risk Level**: Low for finished goods (properly transactional). High for raw ingredients (never deducted because `CostService` is missing).
- **Recommended Fix**: Implement `CostService.deductIngredients` inside the same transaction.

### Scenario C: Recipe promoted, Product cost update fails
- **Actual Behavior**: Recipe promotion does not exist (`CostService` is missing). Product costs must be manually updated.
- **Risk Level**: Critical. COGS and profit reporting will be completely disjointed from R&D ingredient prices.
- **Recommended Fix**: Build `CostService` and implement the `promoteRecipe` workflow.

### Scenario D: Void order, Inventory restored, Points reversal fails
- **Actual Behavior**: When an order is voided, **nothing is restored**. Finished goods are lost permanently, and points (if they had been awarded) would be kept by the user.
- **Risk Level**: Critical. Enables easy stock shrinkage and point fraud.
- **Recommended Fix**: Add compensation logic in `OrderService.voidOrder` to call `restoreStock`, `restoreIngredients`, and `reversePoints`.

## Conclusion
**FAILED**. The system fails entirely on Scenarios A, C, and D due to absent code. Scenario B works only partially for finished goods.
