# Bugs Found - Financial Calculation Accuracy Fix

## Executive Summary

The exploratory testing phase has successfully identified and documented critical financial calculation bugs in the restaurant POS system. All exploratory tests executed successfully, confirming the presence of the following bugs:

### Bugs Confirmed:
1. ✅ **Bug 3: Numeric Precision Loss** - Tax and service charge calculations use premature rounding
2. ✅ **Bug 4: Missing COGS Handling** - Products without cost data show false profit calculations

### Test Execution Summary:
- **OrderService Tests**: 5 tests passed - All precision loss scenarios documented
- **FinancialCalculationService Tests**: 13 tests passed - COGS handling bugs documented
- **Total Tests Run**: 18 tests
- **Counterexamples Found**: Multiple specific cases documented below

---

## Bug 3: Numeric Precision Loss from Premature Rounding

### Description
Tax and service charge calculations apply `Math.round()` immediately after calculation, losing decimal precision that compounds over multiple orders.

### Affected Code
**File**: `backoffice/backend/src/services/OrderService.ts`
- **Line 47**: `const calculatedTax = Math.round(baseAmount * (taxRate / 100));`
- **Line 49**: `const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));`

### Affected Methods
- `OrderService.createOrder()` - All order creation flows
- Every order processed through the system loses precision

### Counterexample 1: Basic Precision Loss
**Input:**
```
baseAmount: 12,345 IDR
taxRate: 11%
serviceChargeRate: 5%
```

**Current Buggy Behavior:**
```
tax = Math.round(12345 × 0.11) = Math.round(1357.95) = 1358
service_charge = Math.round(12345 × 0.05) = Math.round(617.25) = 617

Error per order:
  Tax error: +0.05 IDR
  SC error: -0.25 IDR
  Total: -0.20 IDR per order
```

**Expected Correct Behavior:**
```
tax = 1357.95 (preserve decimals)
service_charge = 617.25 (preserve decimals)
Error: 0 IDR
```

**Test Evidence:**
```
Test: "should demonstrate precision loss with specific example: baseAmount=12345, taxRate=11%, scRate=5%"
Status: ✅ PASSED
File: src/services/__tests__/OrderService.test.ts
```

### Counterexample 2: Cumulative Precision Loss Over Multiple Orders

**Input:** 5 orders with different amounts
```
Order 1: baseAmount = 12,345 IDR
Order 2: baseAmount = 23,456 IDR
Order 3: baseAmount = 34,567 IDR
Order 4: baseAmount = 45,678 IDR
Order 5: baseAmount = 56,789 IDR
```

**Results:**
| Order | Base Amount | Buggy Tax | Correct Tax | Buggy SC | Correct SC | Error    |
|-------|-------------|-----------|-------------|----------|------------|----------|
| 1     | 12,345      | 1,358     | 1,357.95    | 617      | 617.25     | -0.20    |
| 2     | 23,456      | 2,580     | 2,580.16    | 1,173    | 1,172.80   | +0.04    |
| 3     | 34,567      | 3,802     | 3,802.37    | 1,728    | 1,728.35   | -0.72    |
| 4     | 45,678      | 5,025     | 5,024.58    | 2,284    | 2,283.90   | +0.52    |
| 5     | 56,789      | 6,247     | 6,246.79    | 2,839    | 2,839.45   | -0.24    |
| **Total** |         | **Cumulative Tax Error: +0.15 IDR** | **Cumulative SC Error: -0.75 IDR** | **Total: -0.60 IDR** |

**Projected Impact:**
- Over 1,000 orders: **-120 IDR cumulative error**
- Over 10,000 orders: **-1,200 IDR cumulative error**

**Test Evidence:**
```
Test: "should demonstrate cumulative precision loss over multiple orders"
Status: ✅ PASSED
File: src/services/__tests__/OrderService.test.ts
```

### Counterexample 3: Edge Cases with .5 Rounding

**Input:** Amounts that produce maximum rounding impact
```
Case 1: baseAmount = 13,636 IDR
  Tax: 1,500 vs 1,499.96 (error: +0.04)
  SC: 682 vs 681.80 (error: +0.20)
  Total error: +0.24 IDR

Case 2: baseAmount = 45,455 IDR
  Tax: 5,000 vs 5,000.05 (error: -0.05)
  SC: 2,273 vs 2,272.75 (error: +0.25)
  Total error: +0.20 IDR

Case 3: baseAmount = 90,909 IDR
  Tax: 10,000 vs 9,999.99 (error: +0.01)
  SC: 4,545 vs 4,545.45 (error: -0.45)
  Total error: -0.44 IDR
```

**Test Evidence:**
```
Test: "should demonstrate precision loss with edge case: amounts that result in .5 rounding"
Status: ✅ PASSED
File: src/services/__tests__/OrderService.test.ts
```

### Root Cause Analysis
The system applies `Math.round()` to intermediate financial calculations before storage, which:
1. Loses decimal precision that should be preserved
2. Causes cumulative errors across multiple orders
3. Violates financial calculation best practices (round only for display, not storage)

### Impact Assessment
- **Severity**: HIGH - Affects every order in the system
- **Financial Impact**: Cumulative errors compound over time
- **Scope**: All order creation flows since system inception
- **Business Risk**: Regulatory compliance issues, audit discrepancies

---

## Bug 4: Missing COGS Handling (Cost Data as Zero)

### Description
Products with missing cost data (NULL) are treated as zero cost, producing false 100% profit margins and distorting business intelligence reports.

### Affected Code
**File**: `backoffice/backend/src/services/FinancialCalculationService.ts`

**Multiple Locations:**
1. **Line ~235** - `getProductPerformanceReport()`:
   ```sql
   SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as estimated_profit
   ```

2. **Lines ~277-278** - `getMenuEngineeringReport()`:
   ```sql
   (AVG(oi.unit_price) - COALESCE(p.cost, 0)) as profit_margin,
   SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as total_profit
   ```

3. **Lines ~290-301** - Menu engineering classification logic includes products with NULL cost in profitability calculations

### Affected Methods
- `FinancialCalculationService.getProductPerformanceReport()` - Shows false profit
- `FinancialCalculationService.getMenuEngineeringReport()` - Shows false margins and incorrect classification
- Menu engineering averages and thresholds - Distorted by false data

### Counterexample 1: Product Performance Report False Profit

**Input:**
```
Product: "New Menu Item (No Cost)"
  price: 50,000 IDR
  cost: NULL (not set yet)
  quantity sold: 10 units
  revenue: 500,000 IDR
```

**Current Buggy Behavior:**
```
Database storage: cost = 0 (DEFAULT 0 in schema)
Query: COALESCE(p.cost, 0) = 0

Profit calculation:
  estimated_profit = 500,000 - (0 × 10) = 500,000 IDR
  profit_margin = 100% (full revenue as profit)
```

**Expected Correct Behavior:**
```
Profit calculation:
  estimated_profit = NULL (cannot calculate without cost data)
  Display: "N/A" or "No Cost Data"
  Classification: "unknown" or excluded from profitability analysis
```

**Test Evidence:**
```
Test: "EXPLORATION: should demonstrate false profit when cost is NULL (missing COGS bug)"
Status: ✅ PASSED
Output:
  Product without cost - estimated_profit: 500000 (should be NULL)
  Product without cost - cost field: 0 (should be NULL)
File: src/services/__tests__/FinancialCalculationService.test.ts
```

### Counterexample 2: Menu Engineering Classification Distortion

**Scenario:** Menu engineering report with mixed cost data

**Products:**
1. **Popular Item (No Cost)** - High sales, cost = NULL
2. **True Star** - High sales, cost = 40,000 (60% margin)
3. **Puzzle** - Low sales, cost = 40,000 (60% margin)
4. **Dog** - Low sales, cost = 80,000 (20% margin)

**Current Buggy Behavior:**
```
Profit Margins Calculated:
  Popular No Cost: 100,000 (price - 0) = FALSE 100% margin
  True Star: 60,000 (actual margin)
  Puzzle: 60,000 (actual margin)
  Dog: 20,000 (actual margin)

Average Profit Margin: (100,000 + 60,000 + 60,000 + 20,000) / 4 = 60,000 IDR

Classification:
  Popular No Cost: "star" (false classification due to false high margin)
  True Star: "star" ✓
  Puzzle: "puzzle" ✓
  Dog: "dog" ✓

Result: FALSE data distorts average and business decisions
```

**Expected Correct Behavior:**
```
Profit Margins Calculated:
  Popular No Cost: NULL (excluded from calculation)
  True Star: 60,000
  Puzzle: 60,000
  Dog: 20,000

Average Profit Margin: (60,000 + 60,000 + 20,000) / 3 = 46,667 IDR

Classification:
  Popular No Cost: "unknown" (insufficient data)
  True Star: "star" ✓
  Puzzle: "plowhorse" (high profit above adjusted average)
  Dog: "dog" ✓

Result: Accurate profitability analysis for business decisions
```

**Test Evidence:**
```
Test: "EXPLORATION: should demonstrate menu engineering classification affected by false profit margins"
Status: ✅ PASSED
Output:
  Popular No Cost: star - profit_margin: 100000 (false classification)
  Average profit margin: 60000 (inflated by false data)
File: src/services/__tests__/FinancialCalculationService.test.ts
```

### Counterexample 3: Edge Case - Product WITH Valid Cost Still Works

**Input:**
```
Product: "Established Menu Item"
  price: 50,000 IDR
  cost: 30,000 IDR (valid cost data)
  quantity sold: 10 units
```

**Current Behavior (Correct for this case):**
```
estimated_profit = 500,000 - (30,000 × 10) = 200,000 IDR
profit_margin = 20,000 IDR per unit (40% margin)
```

**Verification:** Products WITH cost data still calculate correctly ✓

**Test Evidence:**
```
Test: Same test as Counterexample 1
Output:
  Product with cost - estimated_profit: 200000 ✓
  Product with cost - cost field: 30000 ✓
```

### Root Cause Analysis
**Two-Part Bug:**
1. **Database Schema**: `cost REAL DEFAULT 0` converts NULL inserts to 0
2. **SQL Queries**: `COALESCE(p.cost, 0)` further treats missing cost as zero

**Combined Effect:** Missing cost data is indistinguishable from zero-cost items, producing false profit calculations.

### Impact Assessment
- **Severity**: HIGH - Distorts business intelligence and decisions
- **Financial Impact**: False profit margins mislead menu optimization
- **Scope**: All products without cost data (new menu items, pending cost entry)
- **Business Risk**: 
  - Incorrect menu engineering decisions
  - False perception of product profitability
  - Misguided pricing and promotional strategies

---

## Test Execution Results

### OrderService Tests
```
Test Suite: OrderService - Precision Loss Bug Exploration
Status: ✅ ALL PASSED
Total Tests: 5
Duration: 2.488 seconds

Tests:
  ✓ should demonstrate precision loss with specific example
  ✓ should demonstrate cumulative precision loss over multiple orders
  ✓ should demonstrate precision loss with edge case (.5 rounding)
  ✓ should demonstrate that decimal values are lost in intermediate calculations
  ✓ should match the counterexample documented in the bugfix design
```

### FinancialCalculationService Tests
```
Test Suite: FinancialCalculationService - Test Infrastructure & Bug Exploration
Status: ✅ ALL PASSED
Total Tests: 13
Duration: 3.023 seconds

Tests:
  Infrastructure Setup: 9 tests ✓
  Helper Functions: 2 tests ✓
  Bug Exploration - Missing COGS: 2 tests ✓

Key Tests:
  ✓ should demonstrate false profit when cost is NULL (missing COGS bug)
  ✓ should demonstrate menu engineering classification affected by false profit margins
```

### Summary
- **Total Test Suites**: 2
- **Total Tests**: 18
- **All Tests**: ✅ PASSED
- **Counterexamples Documented**: 6 major scenarios
- **Bugs Confirmed**: 2 critical bugs (Precision Loss + Missing COGS)

---

## Next Steps: Fix Implementation (Phase 2)

### Priority 1: Fix Precision Loss Bug
**Tasks 2.5 - 2.6:**
1. Remove `Math.round()` from tax calculation (Line 47, OrderService.ts)
2. Remove `Math.round()` from service charge calculation (Line 49, OrderService.ts)
3. Preserve decimal precision throughout calculation pipeline
4. Round only for display purposes in frontend

**Expected Impact:** Eliminates cumulative precision loss across all orders

### Priority 2: Fix Missing COGS Handling
**Tasks 2.7 - 2.10:**
1. Update `getProductPerformanceReport()` to return NULL for profit when cost is NULL
2. Update `getMenuEngineeringReport()` to return NULL for margins when cost is NULL
3. Filter products with NULL cost from profitability average calculations
4. Classify products without cost as "unknown" in menu engineering

**Expected Impact:** Accurate business intelligence and profit reporting

### Priority 3: Verification Testing (Phase 3)
**Tasks 3.1 - 3.5:**
1. Update exploratory tests to assert CORRECT behavior after fixes
2. Verify all counterexamples now produce expected results
3. Add tests for products WITH valid cost (edge case verification)

### Priority 4: Preservation Testing (Phase 4)
**Tasks 4.1 - 4.6:**
1. Verify non-buggy functionality remains unchanged
2. Test order creation flow preservation
3. Test report structure and filtering preservation
4. Ensure no regressions in existing business logic

---

## Evidence Files

### Test Files Location
- **OrderService Tests**: `backoffice/backend/src/services/__tests__/OrderService.test.ts`
- **FinancialCalculationService Tests**: `backoffice/backend/src/services/__tests__/FinancialCalculationService.test.ts`

### Source Files Affected
- **OrderService**: `backoffice/backend/src/services/OrderService.ts` (Lines 47, 49)
- **FinancialCalculationService**: `backoffice/backend/src/services/FinancialCalculationService.ts` (Lines 235, 277-278, 290-310)

### Test Execution Commands
```bash
# Run precision loss tests
npm test -- OrderService.test.ts

# Run COGS handling tests
npm test -- FinancialCalculationService.test.ts

# Run all tests
npm test
```

---

## Appendix: Test Output Excerpts

### Precision Loss Counterexample Output
```
=== PRECISION LOSS COUNTEREXAMPLE ===
Base Amount: 12345
Tax Rate: 11%, Service Charge Rate: 5%

Current Buggy Behavior (Math.round applied):
  Tax: 1358 (should be 1357.95)
  Service Charge: 617 (should be 617.25)
  Tax Error: 0.05 IDR
  SC Error: -0.25 IDR
  Total Error per Order: -0.20 IDR
=====================================
```

### Missing COGS Counterexample Output
```
Product without cost - estimated_profit: 500000 (should be NULL)
Product without cost - cost field: 0 (should be NULL)

Product with cost - estimated_profit: 200000 ✓
Product with cost - cost field: 30000 ✓

Menu Engineering - Product without cost - profit_margin: 50000 (should be NULL)
Menu Engineering - Product with cost - profit_margin: 20000 ✓
```

### Menu Engineering Classification Output
```
Menu Engineering Classifications:
Popular No Cost: star - profit_margin: 100000 (false)
True Star: star - profit_margin: 60000 ✓
Puzzle: puzzle - profit_margin: 60000 ✓
Dog: dog - profit_margin: 20000 ✓
Average profit margin: 60000 (inflated by false data)
```

---

**Document Generated**: Task 1.6 - Run exploratory tests and document counterexamples  
**Status**: ✅ COMPLETE  
**Next Phase**: Fix Implementation (Phase 2)  
**Ready for**: Code changes to address identified bugs
