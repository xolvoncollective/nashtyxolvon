# Financial Calculation Accuracy Fix - Implementation Tasks

## Overview

This document outlines the implementation tasks for fixing three critical financial calculation bugs:
1. Incorrect gross sales and net sales formulas across multiple reports
2. Numeric precision loss from premature rounding in tax/service charge calculations
3. Missing COGS data treated as zero instead of NULL in profit calculations

## Task Breakdown

### Phase 1: Exploratory Testing (Bug Confirmation)

**Goal**: Confirm the bugs exist by writing tests that FAIL on the current (unfixed) code, demonstrating the counterexamples.

- [x] 1.1 Set up test infrastructure for FinancialCalculationService
  - Create test file: `backoffice/backend/src/services/__tests__/FinancialCalculationService.test.ts`
  - Set up test database with sample data (orders, products, order items)
  - Create helper functions for test data generation

- [x] 1.2 Write exploratory test for gross sales formula bug
  - Create test data: 3 orders (1 paid subtotal=1000, 1 cancelled subtotal=500, 1 unpaid subtotal=300)
  - Call `getSalesSummary()` and `getSalesBreakdown()` with appropriate date filters
  - Assert that CURRENT behavior is WRONG: gross_sales includes cancelled/unpaid orders
  - Document the counterexample in test comments
  - **Expected result**: Test FAILS on unfixed code, demonstrating the bug

- [x] 1.3 Write exploratory test for net sales formula bug
  - Create test data: 1 order with subtotal=1000, discount=100, tax=99, service_charge=45, total=1044
  - Call `getSalesSummary()` and `getShiftSummary()`
  - Assert that CURRENT behavior is WRONG: net_sales = 900 (subtotal - discount) instead of 1044
  - Document the counterexample in test comments
  - **Expected result**: Test FAILS on unfixed code, demonstrating the bug

- [x] 1.4 Write exploratory test for precision loss bug
  - Create test data: order with baseAmount=12345, taxRate=11%, scRate=5%
  - Call `OrderService.createOrder()` and inspect tax/service_charge values
  - Assert that CURRENT behavior is WRONG: tax=1358 (rounded) instead of 1357.95
  - Document the counterexample in test comments
  - **Expected result**: Test FAILS on unfixed code, demonstrating the bug

- [x] 1.5 Write exploratory test for missing COGS bug
  - Create test data: product with price=50000, cost=NULL, order item with quantity=10
  - Call `getProductPerformanceReport()` and `getMenuEngineeringReport()`
  - Assert that CURRENT behavior is WRONG: profit = 500000 instead of NULL
  - Document the counterexample in test comments
  - **Expected result**: Test FAILS on unfixed code, demonstrating the bug

- [x] 1.6 Run exploratory tests and document counterexamples
  - Execute all exploratory tests
  - Verify they FAIL as expected
  - Document the specific incorrect values in a test report or comments
  - If tests don't fail as expected, re-analyze root cause

### Phase 2: Fix Implementation

**Goal**: Implement the code changes to fix the calculation bugs.

- [x] 2.1 Fix net sales formula in FinancialCalculationService.getShiftSummary()
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Line: ~25
  - Change: `SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN (subtotal - discount) ELSE 0 END)` 
  - To: `SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total ELSE 0 END)`
  - Verify: Shift summary now uses order.total for net sales

- [ ] 2.2 Fix net sales formula in FinancialCalculationService.getSalesSummary()
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Line: ~67
  - Change: `SUM(o.subtotal - o.discount)` 
  - To: `SUM(o.total)`
  - Verify: Sales summary now uses order.total for net sales

- [ ] 2.3 Fix net sales formula in FinancialCalculationService.getSalesBreakdown()
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Line: ~84
  - Change: `SUM(o.total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id AND amount < 0), 0))` 
  - To: `SUM(o.total)`
  - Verify: Sales breakdown now uses order.total without negative payment adjustments

- [ ] 2.4 Verify WHERE clause filtering for gross sales
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Functions: `getSalesSummary()`, `getSalesBreakdown()`
  - Check: Ensure the whereClause parameter passed from calling routes filters `payment_status = 'paid' AND order_status != 'cancelled'`
  - If not present, add this filter to the query WHERE clause
  - Verify: Gross sales only includes paid, non-cancelled orders

- [ ] 2.5 Remove premature rounding for tax calculation
  - File: `backoffice/backend/src/services/OrderService.ts`
  - Line: ~47
  - Change: `const calculatedTax = Math.round(baseAmount * (taxRate / 100));`
  - To: `const calculatedTax = baseAmount * (taxRate / 100);`
  - Verify: Tax calculation preserves decimal precision

- [ ] 2.6 Remove premature rounding for service charge calculation
  - File: `backoffice/backend/src/services/OrderService.ts`
  - Line: ~49
  - Change: `const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));`
  - To: `const calculatedServiceCharge = baseAmount * (scRate / 100);`
  - Verify: Service charge calculation preserves decimal precision

- [ ] 2.7 Fix missing COGS handling in getProductPerformanceReport()
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Line: ~235
  - Change: `SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as estimated_profit`
  - To: `CASE WHEN p.cost IS NOT NULL THEN SUM(oi.subtotal) - (p.cost * SUM(oi.quantity)) ELSE NULL END as estimated_profit`
  - Verify: Products without cost data show NULL profit instead of inflated values

- [ ] 2.8 Fix missing COGS handling in getMenuEngineeringReport()
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Lines: ~277-278
  - Change profit_margin: `(AVG(oi.unit_price) - COALESCE(p.cost, 0))`
  - To: `CASE WHEN p.cost IS NOT NULL THEN (AVG(oi.unit_price) - p.cost) ELSE NULL END`
  - Change total_profit: `SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity))`
  - To: `CASE WHEN p.cost IS NOT NULL THEN SUM(oi.subtotal) - (p.cost * SUM(oi.quantity)) ELSE NULL END`
  - Verify: Menu engineering report returns NULL for profit when cost is missing

- [ ] 2.9 Fix menu engineering average profit calculation
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Lines: ~290-293
  - Filter out products with NULL profit_margin before calculating avgProfit
  - Add code: `const productsWithCost = (products as any[]).filter((p: any) => p.profit_margin !== null);`
  - Update avgProfit calculation to use `productsWithCost` instead of `products`
  - Verify: Average profitability only includes products with valid cost data

- [ ] 2.10 Fix menu engineering classification for products without cost
  - File: `backoffice/backend/src/services/FinancialCalculationService.ts`
  - Lines: ~300-310
  - Add check: If `p.profit_margin === null`, classify as 'unknown' with reason 'No cost data'
  - Keep existing classification logic for products with profit_margin
  - Verify: Products without cost are classified as "unknown" instead of being misclassified

### Phase 3: Fix Verification Testing

**Goal**: Verify that the fixes work correctly by re-running the exploratory tests and confirming they now PASS.

- [ ] 3.1 Update exploratory tests to verify fix for gross sales
  - Modify test from 1.2 to assert CORRECT behavior after fix
  - Expected: gross_sales = 1000 (only includes paid, non-cancelled order)
  - Run test and verify it PASSES on fixed code

- [ ] 3.2 Update exploratory tests to verify fix for net sales
  - Modify test from 1.3 to assert CORRECT behavior after fix
  - Expected: net_sales = 1044 (uses order.total)
  - Run test and verify it PASSES on fixed code

- [ ] 3.3 Update exploratory tests to verify fix for precision loss
  - Modify test from 1.4 to assert CORRECT behavior after fix
  - Expected: tax = 1357.95, service_charge = 617.25 (decimal precision preserved)
  - Run test and verify it PASSES on fixed code

- [ ] 3.4 Update exploratory tests to verify fix for missing COGS
  - Modify test from 1.5 to assert CORRECT behavior after fix
  - Expected: profit = NULL when cost is NULL
  - Run test and verify it PASSES on fixed code

- [ ] 3.5 Add test for products WITH valid COGS (edge case)
  - Create test data: product with price=50000, cost=30000, quantity=10
  - Call profit calculation functions
  - Assert: profit = 200000 (correct calculation for products with cost)
  - Verify: Products with valid cost still calculate profit correctly

### Phase 4: Preservation Testing

**Goal**: Verify that non-buggy functionality remains unchanged.

- [ ] 4.1 Write preservation test for order creation flow
  - Create order with multiple items, modifiers, payments
  - Verify: Order record created with correct structure
  - Verify: Payment status determination logic unchanged
  - Verify: Subtotal calculation (items * quantity) unchanged
  - Verify: All relationships (items, modifiers, payments) preserved

- [ ] 4.2 Write preservation test for report structure
  - Call getShiftSummary()
  - Verify: Returns shift info, payment breakdown, order type breakdown, top products
  - Verify: Structure and non-financial fields unchanged
  - Verify: Only financial calculation values differ (due to bug fixes)

- [ ] 4.3 Write preservation test for filtering logic
  - Call reports with various date filters, outlet filters, tenant filters
  - Verify: Correct orders are included in queries
  - Verify: Filtering logic unchanged (only calculated values differ)

- [ ] 4.4 Write preservation test for payment distribution
  - Call getPaymentDistribution()
  - Verify: Grouping by payment method unchanged
  - Verify: Percentage calculation logic unchanged
  - Verify: Response structure unchanged

- [ ] 4.5 Write preservation test for menu engineering with valid cost
  - Create products with valid cost data
  - Call getMenuEngineeringReport()
  - Verify: Classification logic (star/plowhorse/puzzle/dog) unchanged for products with cost
  - Verify: Popularity and profitability thresholds calculated correctly
  - Verify: Summary counts (stars, plowhorses, puzzles, dogs) correct

- [ ] 4.6 Write preservation test for non-calculation operations
  - Test kitchen queue functionality
  - Test order status updates
  - Test void/refund operations (ensure they still work)
  - Verify: All non-calculation business logic preserved

### Phase 5: Integration Testing

**Goal**: Test the fixes in realistic end-to-end scenarios.

- [ ] 5.1 Integration test: Full order creation and reporting flow
  - Create 10 diverse orders (dine-in, takeaway, various items, discounts, tax rates)
  - Generate shift summary, sales summary, sales breakdown, dashboard KPI
  - Verify: All financial values are accurate and consistent across reports
  - Verify: Precision maintained throughout (no cumulative rounding errors)

- [ ] 5.2 Integration test: Product performance with mixed cost data
  - Create 5 products: 3 with cost data, 2 without
  - Create orders for all products
  - Generate product performance report and menu engineering report
  - Verify: Products with cost show accurate profit calculations
  - Verify: Products without cost show NULL profit or "unknown" classification
  - Verify: Profitability threshold only uses products with cost data

- [ ] 5.3 Integration test: Edge case scenarios
  - Test order with zero discount (ensure formulas still work)
  - Test order with 100% discount (edge case for net sales calculation)
  - Test product with zero cost (cost=0, different from NULL, should calculate profit)
  - Test high precision tax rate (e.g., 11.5%) to verify decimal handling
  - Verify: All edge cases handled correctly

- [ ] 5.4 Integration test: Cumulative precision over many orders
  - Create 100 orders with various tax rates and service charges
  - Calculate total tax and service charge expected (with full precision)
  - Generate reports and verify cumulative totals match expected values
  - Verify: No cumulative rounding errors over large datasets

### Phase 6: Frontend Compatibility (Optional Investigation)

**Goal**: Ensure frontend can handle the changes (decimal values, NULL indicators).

- [ ] 6.1 Investigate frontend display of decimal financial values
  - Check if frontend expects integer values for tax/service charge/total
  - Verify frontend can display decimal values or rounds appropriately for display
  - Document any frontend changes needed

- [ ] 6.2 Investigate frontend handling of NULL profit values
  - Check how frontend displays profit in product performance report
  - Verify frontend can handle NULL values or needs "N/A" string instead
  - Document any frontend changes needed

- [ ] 6.3 Investigate frontend handling of "unknown" classification
  - Check menu engineering report UI
  - Verify frontend can display "unknown" category or needs updates
  - Document any frontend changes needed

### Phase 7: Documentation and Deployment

- [ ] 7.1 Update API documentation (if exists)
  - Document that financial calculations now preserve decimal precision
  - Document that profit fields can be NULL when cost data is missing
  - Document new "unknown" classification in menu engineering

- [ ] 7.2 Create migration guide or release notes
  - Explain the bug fixes to stakeholders
  - Note that financial reports will show slightly different values (correct values)
  - Explain that some products may show NULL profit or "unknown" classification if cost data is missing
  - Provide guidance on setting product cost data for accurate profit tracking

- [ ] 7.3 Run full test suite
  - Execute all unit tests, integration tests, and existing tests
  - Verify: All tests pass
  - Fix any test failures due to corrected financial calculations

- [ ] 7.4 Manual smoke testing
  - Create test orders in development environment
  - Generate all financial reports
  - Verify: All calculations appear correct
  - Verify: No errors or crashes in report generation

- [ ] 7.5 Deploy to staging/production
  - Deploy backend changes
  - Monitor error logs for issues
  - Verify financial reports in production environment
  - Gather feedback from users on accuracy improvements

## Notes

- **Test-First Approach**: Phase 1 (exploratory testing) MUST be completed before Phase 2 (fix implementation) to confirm the bugs exist
- **Incremental Testing**: After each fix in Phase 2, run the corresponding test from Phase 3 to verify the fix works
- **Preservation Priority**: Phase 4 is critical to ensure no regressions in existing functionality
- **Frontend Coordination**: Phase 6 may require coordination with frontend team if changes are needed
- **Data Accuracy**: After deployment, historical data will remain unchanged (with old calculation bugs), but all new calculations will be accurate

## Risk Mitigation

- **Database Precision**: SQLite REAL type has precision limitations. Document that for production financial systems, NUMERIC or TEXT-based decimal storage may be preferable
- **Backward Compatibility**: Ensure API response structure remains the same (fields in same positions) even though values are corrected
- **Performance**: Verify that CASE WHEN logic for NULL handling doesn't significantly impact query performance on large datasets
- **Rollback Plan**: Prepare rollback strategy if unexpected issues arise in production
