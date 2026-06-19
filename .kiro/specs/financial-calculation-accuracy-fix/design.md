# Financial Calculation Accuracy Fix - Bugfix Design

## Overview

This bugfix addresses three critical financial calculation accuracy issues in the restaurant POS system that compromise financial reporting and business decision-making. The bugs are interconnected and affect calculation formulas, numeric precision, and data interpretation:

1. **Incorrect Gross Sales and Net Sales Formulas** - Using wrong calculations that don't follow accounting standards
2. **Numeric Precision Loss from Rounding** - Premature rounding causing cumulative errors in financial calculations
3. **Missing COGS Handling** - Treating missing cost data as zero, distorting profit calculations and product classification

The fix will correct the formulas, preserve decimal precision throughout calculation pipelines, and gracefully handle missing cost data with proper NULL handling and UI indicators.

## Glossary

- **Bug_Condition (C)**: The condition that triggers financial inaccuracies - incorrect formulas, premature rounding, or missing cost data treated as zero
- **Property (P)**: The desired behavior - accurate calculations following accounting standards with full precision and proper NULL handling
- **Preservation**: All existing functionality unrelated to these calculation bugs must remain unchanged
- **Gross Sales**: Total sales revenue before any deductions (subtotal of paid, non-cancelled orders)
- **Net Sales**: Final revenue collected after all adjustments (total field = subtotal - discount + tax + service_charge)
- **COGS**: Cost of Goods Sold - the cost basis for calculating product profit
- **HPP**: Harga Pokok Penjualan (Indonesian for COGS) - stored as `cost` field in products table
- **FinancialCalculationService**: Service class in `src/services/FinancialCalculationService.ts` containing report calculation queries
- **OrderService**: Service class in `src/services/OrderService.ts` containing order creation and calculation logic
- **Precision Loss**: Loss of decimal accuracy due to premature rounding in intermediate calculations

## Bug Details

### Bug Condition

The bugs manifest in three distinct but interconnected scenarios:

**1. Formula Bugs**: When calculating gross sales or net sales, the system uses incorrect SQL formulas across multiple report endpoints (shift summary, sales summary, sales breakdown, dashboard KPI).

**2. Precision Loss**: When calculating tax and service charge during order creation, the system applies `Math.round()` to intermediate values, losing decimal precision that compounds across multiple orders.

**3. Missing COGS**: When calculating product profit or menu engineering classification, the system uses `COALESCE(p.cost, 0)` which treats missing cost data as zero, producing false profit calculations.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { calculationType: string, costData: number | null, operation: string }
  OUTPUT: boolean
  
  RETURN (
    // Formula bugs
    (input.calculationType == "gross_sales" AND input.operation CONTAINS "SUM(subtotal)" WITHOUT proper filtering)
    OR (input.calculationType == "net_sales" AND input.operation CONTAINS "SUM(subtotal - discount)" OR input.operation CONTAINS negative payment additions)
    
    // Precision bugs
    OR (input.calculationType == "tax" AND input.operation CONTAINS "Math.round(baseAmount * (taxRate / 100))")
    OR (input.calculationType == "service_charge" AND input.operation CONTAINS "Math.round(baseAmount * (scRate / 100))")
    
    // Missing COGS bugs
    OR (input.calculationType == "profit" AND input.costData IS NULL AND input.operation treats it as 0)
  )
END FUNCTION
```

### Examples

**Example 1 - Incorrect Gross Sales**:
- **Input**: Shift summary query with orders including cancelled and unpaid orders
- **Current Behavior**: `SUM(subtotal)` includes cancelled orders → gross_sales = 1,500,000 (inflated)
- **Expected Behavior**: `SUM(subtotal WHERE payment_status='paid' AND order_status!='cancelled')` → gross_sales = 1,200,000 (accurate)

**Example 2 - Incorrect Net Sales**:
- **Input**: Sales summary query for orders with discount=100, tax=50, service_charge=25
- **Current Behavior**: `SUM(subtotal - discount)` = 1,900 (omits tax and SC) → net_sales = 1,900
- **Expected Behavior**: `SUM(total)` = 1,975 (includes all adjustments) → net_sales = 1,975

**Example 3 - Precision Loss**:
- **Input**: Order with subtotal=12,345, discount=0, taxRate=11%, scRate=5%
- **Current Behavior**: 
  - tax = Math.round(12345 * 0.11) = 1,358 (should be 1,357.95)
  - service_charge = Math.round(12345 * 0.05) = 617 (should be 617.25)
  - Error per order: 0.05 + 0.25 = 0.30 IDR
  - Over 1000 orders: 300 IDR cumulative error
- **Expected Behavior**: Preserve decimals → tax=1357.95, SC=617.25, accurate totals

**Example 4 - Missing COGS as Zero**:
- **Input**: Product with price=50,000, cost=NULL (not set yet), quantity=10
- **Current Behavior**: profit = 500,000 - (0 * 10) = 500,000 (100% margin - misleading)
- **Expected Behavior**: profit = NULL or "N/A" (cannot calculate without cost data)

**Edge Case - Product With Valid COGS**:
- **Input**: Product with price=50,000, cost=30,000, quantity=10
- **Expected Behavior**: profit = 500,000 - (30,000 * 10) = 200,000 (accurate 40% margin)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Order creation logic must continue to work with all items, modifiers, and payment records
- Subtotal calculation (sum of item prices * quantities) must remain unchanged
- Payment status determination (paid vs pending based on amount collected) must remain unchanged
- All report filtering by date, outlet, and tenant must continue to function
- Report structure and response format (order count, payment breakdown, top products, etc.) must remain unchanged
- Dashboard KPI calculation structure must remain the same
- Menu engineering classification logic (star/plowhorse/puzzle/dog) must remain the same for products WITH cost data
- Kitchen queue, order status updates, void/refund operations must remain unchanged

**Scope:**
All inputs and operations that do NOT involve the specific calculation bugs (gross sales, net sales, tax/SC precision, profit with missing cost) should be completely unaffected by this fix. This includes:
- Order item subtotal calculations
- Discount validation
- Payment method distribution
- Hourly and weekly sales charts
- Cashier performance metrics (except if affected by corrected formulas)
- Order type breakdown
- Top products ranking

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Copy-Paste Formula Errors**: The gross sales and net sales formulas were likely copied from a different context or misunderstood during implementation. Across multiple report functions, different incorrect formulas are used:
   - Shift summary uses `SUM(subtotal - discount)` for net sales (omits tax/SC)
   - Sales summary uses `SUM(subtotal)` without filtering paid orders for gross sales
   - Sales breakdown uses a complex negative payment adjustment that incorrectly adds back refunds

2. **Premature Optimization with Math.round()**: In OrderService.createOrder(), tax and service charge are rounded to integers immediately after calculation, likely to ensure "clean" integer values for Indonesian Rupiah. However, this causes precision loss in intermediate calculations that should be deferred to display time only.

3. **Defensive COALESCE Without NULL Semantics**: The SQL queries use `COALESCE(p.cost, 0)` to prevent NULL errors, but this creates false data by treating missing cost as zero cost. The proper approach is to propagate NULL through calculations so that profit becomes NULL when cost is NULL.

4. **Inconsistent Formula Application**: Different reports use different formulas for the same metric (gross sales, net sales), suggesting lack of centralized calculation logic or clear definition of these accounting terms.

## Correctness Properties

Property 1: Bug Condition - Correct Financial Formulas and Precision

_For any_ financial calculation where gross sales, net sales, tax, service charge, or profit with missing cost data is computed, the fixed system SHALL use the correct formula following accounting standards, preserve decimal precision without premature rounding, and propagate NULL for profit calculations when cost data is missing.

**Validates: Requirements 2.1.1, 2.1.2, 2.1.3, 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.3.1, 2.3.2, 2.3.3, 2.3.4, 2.3.5, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.5**

Property 2: Preservation - Non-Calculation Business Logic

_For any_ order processing operation, report generation, or business logic that does NOT involve the specific buggy calculations (gross/net sales formulas, tax/SC rounding, profit with missing cost), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing functionality including order creation, payment processing, report filtering, and non-financial metrics.

**Validates: Requirements 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.3.1, 3.3.2, 3.3.3, 3.4.1, 3.4.2, 3.4.3, 3.5.1, 3.5.2, 3.5.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, we need to make targeted changes to two service files:

**File**: `backoffice/backend/src/services/FinancialCalculationService.ts`

**Function**: Multiple functions - `getShiftSummary`, `getSalesSummary`, `getSalesBreakdown`, `getProductPerformanceReport`, `getMenuEngineeringReport`

**Specific Changes**:

1. **Fix Gross Sales Formula in getShiftSummary() (lines 21)**:
   - **Current**: `COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN subtotal ELSE 0 END), 0) as gross_sales`
   - **Fixed**: Keep as is (this formula is actually CORRECT - it already filters properly)
   - **Note**: Shift summary gross sales is correct; only net sales needs fixing

2. **Fix Net Sales Formula in getShiftSummary() (line 25)**:
   - **Current**: `COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN (subtotal - discount) ELSE 0 END), 0) as net_sales`
   - **Fixed**: `COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total ELSE 0 END), 0) as net_sales`
   - **Rationale**: Net sales should use the `total` field which already includes all adjustments

3. **Fix Gross Sales Formula in getSalesSummary() (line 63)**:
   - **Current**: `COALESCE(SUM(o.subtotal), 0) as gross_sales`
   - **Fixed**: Add WHERE clause filter in the params (ensure only paid, non-cancelled orders are included)
   - **Note**: This will require checking how whereClause is built in the calling code

4. **Fix Net Sales Formula in getSalesSummary() (line 67)**:
   - **Current**: `COALESCE(SUM(o.subtotal - o.discount), 0) as net_sales`
   - **Fixed**: `COALESCE(SUM(o.total), 0) as net_sales`

5. **Fix Gross Sales Formula in getSalesBreakdown() (line 80)**:
   - **Current**: `COALESCE(SUM(o.subtotal), 0) as gross_sales`
   - **Fixed**: Add proper WHERE clause filtering (same as getSalesSummary)

6. **Fix Net Sales Formula in getSalesBreakdown() (line 84)**:
   - **Current**: `COALESCE(SUM(o.total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id AND amount < 0), 0)), 0) as net_sales`
   - **Fixed**: `COALESCE(SUM(o.total), 0) as net_sales`
   - **Rationale**: Stop adding back negative payments; net sales should reflect the order.total value

7. **Fix Missing COGS in getProductPerformanceReport() (line 235)**:
   - **Current**: `SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as estimated_profit`
   - **Fixed**: `CASE WHEN p.cost IS NOT NULL THEN SUM(oi.subtotal) - (p.cost * SUM(oi.quantity)) ELSE NULL END as estimated_profit`
   - **Rationale**: Return NULL for profit when cost is missing, not a false value

8. **Fix Missing COGS in getMenuEngineeringReport() (lines 277-278)**:
   - **Current**: 
     ```sql
     (AVG(oi.unit_price) - COALESCE(p.cost, 0)) as profit_margin,
     SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as total_profit
     ```
   - **Fixed**:
     ```sql
     CASE WHEN p.cost IS NOT NULL THEN (AVG(oi.unit_price) - p.cost) ELSE NULL END as profit_margin,
     CASE WHEN p.cost IS NOT NULL THEN SUM(oi.subtotal) - (p.cost * SUM(oi.quantity)) ELSE NULL END as total_profit
     ```

9. **Fix Menu Engineering Classification Logic (lines 290-301)**:
   - **Current**: Includes all products in average profit calculation, even those with NULL cost (treated as 0)
   - **Fixed**: Filter out products with NULL profit_margin before calculating avgProfit
   - **Code Change**:
     ```typescript
     const productsWithCost = (products as any[]).filter((p: any) => p.profit_margin !== null);
     const avgProfit = productsWithCost.length > 0
       ? productsWithCost.reduce((sum: number, p: any) => sum + (p.profit_margin || 0), 0) / productsWithCost.length
       : 0;
     ```
   
10. **Fix Menu Engineering Classification - Exclude Products Without Cost (lines 300-310)**:
    - **Current**: Classifies all products including those with NULL profit_margin
    - **Fixed**: Add a classification for products without cost data
    - **Code Change**:
      ```typescript
      const classified = (products as any[]).map(p => {
        if (p.profit_margin === null) {
          return { ...p, classification: 'unknown', reason: 'No cost data' };
        }
        
        const highPopularity = p.total_qty >= avgQty;
        const highProfitability = p.profit_margin >= avgProfit;
        
        let classification: string;
        if (highPopularity && highProfitability) classification = 'star';       
        else if (highPopularity && !highProfitability) classification = 'plowhorse'; 
        else if (!highPopularity && highProfitability) classification = 'puzzle';    
        else classification = 'dog';
        
        return { ...p, classification };
      });
      ```

**File**: `backoffice/backend/src/services/OrderService.ts`

**Function**: `createOrder`

**Specific Changes**:

11. **Remove Premature Rounding for Tax (line 47)**:
    - **Current**: `const calculatedTax = Math.round(baseAmount * (taxRate / 100));`
    - **Fixed**: `const calculatedTax = baseAmount * (taxRate / 100);`
    - **Rationale**: Preserve decimal precision; rounding should only occur at display time

12. **Remove Premature Rounding for Service Charge (line 49)**:
    - **Current**: `const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));`
    - **Fixed**: `const calculatedServiceCharge = baseAmount * (scRate / 100);`
    - **Rationale**: Preserve decimal precision; rounding should only occur at display time

13. **Consider Database Column Types**:
    - **Issue**: SQLite REAL type may still lose precision
    - **Mitigation**: While we can't change the schema in this bugfix (would break migrations), we should document that NUMERIC or TEXT-based decimal storage would be more accurate for production financial systems
    - **Action for this fix**: Ensure calculations preserve precision in JavaScript before storage

### Additional Considerations

**WHERE Clause Filtering**: For `getSalesSummary()` and `getSalesBreakdown()`, we need to verify that the `whereClause` parameter passed from calling routes includes proper filtering for `payment_status = 'paid'` AND `order_status != 'cancelled'`. If not, we may need to add this as a mandatory filter in the query itself.

**Frontend Display**: The frontend should handle rounding for display purposes (e.g., format currency to 0 decimal places for IDR if desired), but the database and calculation layer must preserve full precision.

**Menu Engineering "Unknown" Category**: The frontend may need updates to handle the new "unknown" classification for products without cost data. This ensures users understand why some products cannot be classified.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code (exploratory testing), then verify the fixes work correctly and preserve existing behavior (fix checking and preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Create unit tests that:
1. Set up test data with known values (orders with specific subtotals, discounts, tax, service charge, payment status, cancellation status)
2. Call the buggy calculation functions
3. Assert that the results are INCORRECT (demonstrating the bug exists)
4. Document the specific incorrect values as counterexamples

**Test Cases**:

1. **Gross Sales Bug Test** (will fail on unfixed code):
   - Create 3 orders: 1 paid (subtotal=1000), 1 cancelled (subtotal=500), 1 unpaid (subtotal=300)
   - Call `getSalesSummary()` and `getSalesBreakdown()`
   - **Expected counterexample**: gross_sales = 1800 (includes cancelled/unpaid), should be 1000

2. **Net Sales Bug Test** (will fail on unfixed code):
   - Create 1 order: subtotal=1000, discount=100, tax=99, service_charge=45, total=1044
   - Call `getSalesSummary()` and `getShiftSummary()`
   - **Expected counterexample**: net_sales = 900 (subtotal - discount), should be 1044

3. **Precision Loss Bug Test** (will fail on unfixed code):
   - Create order with baseAmount=12345, taxRate=11%, scRate=5%
   - Call `OrderService.createOrder()`
   - **Expected counterexample**: tax=1358, service_charge=617 (rounded), should be 1357.95, 617.25

4. **Missing COGS Bug Test** (will fail on unfixed code):
   - Create product with price=50000, cost=NULL
   - Create order item with quantity=10
   - Call `getProductPerformanceReport()` and `getMenuEngineeringReport()`
   - **Expected counterexample**: estimated_profit = 500000, profit_margin = 50000, should be NULL

**Expected Counterexamples**:
- Formula bugs: Incorrect sums including wrong orders or wrong fields
- Precision bugs: Rounded integer values instead of decimal values
- COGS bugs: Zero or false values instead of NULL for missing cost data

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixed_function(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Plan**: After implementing the fix, re-run the exploratory tests and assert they now PASS with correct values.

**Test Cases**:

1. **Gross Sales Correctness**: Same data as exploratory test, now gross_sales = 1000 (correct)
2. **Net Sales Correctness**: Same data as exploratory test, now net_sales = 1044 (correct)
3. **Precision Preservation**: Same data as exploratory test, now tax=1357.95, SC=617.25 (correct)
4. **Missing COGS Handling**: Same data as exploratory test, now profit = NULL (correct)
5. **Valid COGS Calculation**: Product with cost=30000, verify profit = 200000 (still works)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT original_function(input) = fixed_function(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: 
1. Observe behavior on UNFIXED code first for non-calculation operations (order creation flow, report structure, filtering)
2. Write property-based tests or comprehensive unit tests capturing that behavior
3. Run tests on FIXED code to verify preservation

**Test Cases**:

1. **Order Creation Preservation**: 
   - Observe: Create order with items, modifiers, payment → order record created with all relationships
   - Test: Verify fixed code produces identical order structure, payment status, subtotal calculation

2. **Report Structure Preservation**:
   - Observe: Call getShiftSummary → returns shift info, payment breakdown, order type breakdown, top products
   - Test: Verify fixed code returns same structure with same non-financial fields

3. **Filtering Preservation**:
   - Observe: Call reports with date filters, outlet filters → correct orders included
   - Test: Verify fixed code applies same filters (only financial values change, not which records)

4. **Payment Distribution Preservation**:
   - Observe: getPaymentDistribution groups by payment method with counts and percentages
   - Test: Verify fixed code produces same grouping and percentage calculation logic

5. **Menu Engineering for Products WITH Cost**:
   - Observe: Products with valid cost data are classified correctly in original code
   - Test: Verify fixed code produces identical classification for these products

### Unit Tests

**Test File**: `backoffice/backend/src/services/__tests__/FinancialCalculationService.test.ts`
- Test gross sales calculation with mixed order statuses
- Test net sales calculation with orders containing discounts, tax, service charge
- Test product performance report with NULL cost vs valid cost
- Test menu engineering classification with mixed cost data availability
- Test that filtered queries respect payment status and cancellation status

**Test File**: `backoffice/backend/src/services/__tests__/OrderService.test.ts`
- Test tax calculation preserves decimals (e.g., 11% of 12345 = 1357.95 not 1358)
- Test service charge calculation preserves decimals
- Test that total calculation uses unrounded intermediate values
- Test order creation flow end-to-end with decimal precision
- Test that database stores decimal values correctly

### Property-Based Tests

**Library**: Consider using `fast-check` (JavaScript property-based testing library)

**Property 1**: For any order with valid payment status and non-cancelled status, gross sales includes its subtotal
**Property 2**: For any order with cancelled or unpaid status, gross sales excludes its subtotal
**Property 3**: For any order, net sales equals the total field (not subtotal minus discount)
**Property 4**: For any baseAmount and tax rate, calculated tax equals baseAmount * (taxRate / 100) with full decimal precision (no rounding)
**Property 5**: For any product with NULL cost, profit calculation returns NULL
**Property 6**: For any product with valid cost, profit calculation returns revenue - (cost * quantity)
**Property 7**: For any set of products in menu engineering, products with NULL cost are classified as "unknown"
**Property 8**: For any set of products in menu engineering with valid cost, classification matches original logic

### Integration Tests

**Test Scenario 1**: Full order creation and reporting flow
- Create 10 orders with various configurations (dine-in, takeaway, different items, discounts, tax rates)
- Generate shift summary, sales summary, sales breakdown, dashboard KPI
- Verify all financial values are accurate and consistent across reports
- Verify precision is maintained throughout (no rounding errors)

**Test Scenario 2**: Product performance with mixed cost data
- Create products: some with cost data, some without
- Create orders for all products
- Generate product performance report and menu engineering report
- Verify products with cost show accurate profit, products without cost show NULL/unknown
- Verify classification only uses products with cost data for profitability threshold

**Test Scenario 3**: Edge case scenarios
- Order with zero discount (ensure formulas still work)
- Order with 100% discount (edge case for net sales)
- Product with zero cost (different from NULL - should calculate profit as full revenue)
- High precision tax rate (e.g., 11.5%) to test decimal handling
