# Bugfix Requirements Document

## Introduction

This document addresses critical financial calculation accuracy issues in the restaurant POS system. The system currently has three interconnected bugs that compromise the accuracy of financial reporting and calculations:

1. **Incorrect Gross Sales and Net Sales Formulas** - The calculation logic for gross sales and net sales does not follow standard accounting principles
2. **Precision Loss from Rounding** - Financial values are being rounded before storage in the database, causing cumulative precision loss
3. **Missing COGS Handling** - Cost of Goods Sold (COGS) shows as 0 when product cost data (HPP) is missing, distorting profit calculations

These bugs affect critical business operations including financial reporting, profit analysis, menu engineering, and product performance metrics. Accurate financial calculations are essential for business decision-making and regulatory compliance.

## Bug Analysis

### Current Behavior (Defect)

#### 1.1 Gross Sales Calculation
1.1.1 WHEN calculating gross sales in shift summary THEN the system uses `SUM(subtotal)` which incorrectly includes all orders regardless of payment status

1.1.2 WHEN calculating gross sales in sales summary THEN the system uses `SUM(o.subtotal)` without filtering paid orders only

1.1.3 WHEN calculating gross sales in sales breakdown THEN the system uses `SUM(o.subtotal)` which does not account for cancelled orders properly

#### 1.2 Net Sales Calculation
1.2.1 WHEN calculating net sales in shift summary THEN the system uses `SUM(subtotal - discount)` which is incorrect because net sales should be total revenue after all deductions (discount, tax, service charge)

1.2.2 WHEN calculating net sales in sales summary THEN the system uses `SUM(o.subtotal - o.discount)` which omits tax and service charge from net sales

1.2.3 WHEN calculating net sales in sales breakdown THEN the system uses `SUM(o.total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id AND amount < 0), 0))` which adds negative payment amounts incorrectly

#### 1.3 Numeric Precision Loss
1.3.1 WHEN calculating tax for an order THEN the system applies `Math.round(baseAmount * (taxRate / 100))` which rounds to nearest integer, losing decimal precision

1.3.2 WHEN calculating service charge for an order THEN the system applies `Math.round(baseAmount * (scRate / 100))` which rounds to nearest integer, losing decimal precision

1.3.3 WHEN saving financial values to SQLite database THEN the values are stored as REAL type which can lose precision for decimal values

1.3.4 WHEN multiple orders are processed THEN the cumulative rounding errors compound, causing significant discrepancies in financial reports

#### 1.4 Missing COGS Data
1.4.1 WHEN calculating product profit in ProductPerformanceReport THEN the system uses `COALESCE(p.cost, 0)` which treats missing cost data as zero, resulting in inflated profit estimates

1.4.2 WHEN calculating profit margin in MenuEngineeringReport THEN the system uses `COALESCE(p.cost, 0)` which produces misleading profit margins when cost data is missing

1.4.3 WHEN classifying products in menu engineering matrix THEN products with missing cost data are incorrectly classified due to false profit margin calculations

1.4.4 WHEN displaying COGS in financial reports THEN the value shows as 0 even though it should indicate "data not available"

### Expected Behavior (Correct)

#### 2.1 Gross Sales Calculation
2.1.1 WHEN calculating gross sales THEN the system SHALL use `SUM(subtotal)` for orders WHERE `payment_status = 'paid'` AND `order_status != 'cancelled'` only

2.1.2 WHEN calculating gross sales THEN the system SHALL represent the total sales amount before any deductions (discounts, taxes, service charges)

2.1.3 WHEN calculating gross sales for reporting periods THEN the system SHALL consistently apply the same formula across all reports (shift summary, sales summary, sales breakdown, dashboard KPI)

#### 2.2 Net Sales Calculation
2.2.1 WHEN calculating net sales THEN the system SHALL use `SUM(total)` for orders WHERE `payment_status = 'paid'` AND `order_status != 'cancelled'` which represents the actual revenue collected after all adjustments

2.2.2 WHEN calculating net sales for financial reports THEN the system SHALL represent the final amount collected from customers (gross sales - discounts + tax + service charge)

2.2.3 WHEN calculating net sales THEN the system SHALL NOT add back negative payment amounts as this distorts actual revenue

2.2.4 WHEN calculating net sales for KPI and dashboard THEN the system SHALL use the same formula consistently across all endpoints

#### 2.3 Numeric Precision Preservation
2.3.1 WHEN calculating tax for an order THEN the system SHALL preserve decimal precision without rounding (e.g., `baseAmount * (taxRate / 100)`)

2.3.2 WHEN calculating service charge for an order THEN the system SHALL preserve decimal precision without rounding (e.g., `baseAmount * (scRate / 100)`)

2.3.3 WHEN saving financial values to the database THEN the system SHALL store values with full decimal precision (no premature rounding)

2.3.4 WHEN displaying financial values in reports or UI THEN the system SHALL round for display purposes only, never for storage or intermediate calculations

2.3.5 WHEN performing financial calculations THEN the system SHALL maintain at least 2 decimal places of precision throughout the calculation pipeline

#### 2.4 Missing COGS Data Handling
2.4.1 WHEN calculating product profit and cost data is missing THEN the system SHALL return `NULL` or a clear indicator that profit cannot be calculated, rather than returning a false value

2.4.2 WHEN calculating profit margin and cost data is missing THEN the system SHALL exclude the product from profit margin calculations or clearly mark it as "insufficient data"

2.4.3 WHEN classifying products in menu engineering and cost data is missing THEN the system SHALL exclude those products from profitability-based classification or place them in a separate "unknown" category

2.4.4 WHEN displaying COGS in reports and cost data is missing THEN the system SHALL display "N/A" or "No Cost Data" instead of 0

2.4.5 WHEN a product has HPP/cost data available THEN the system SHALL use that value for accurate COGS calculations

### Unchanged Behavior (Regression Prevention)

#### 3.1 Order Processing
3.1.1 WHEN creating an order with valid items and payment THEN the system SHALL CONTINUE TO create the order record with all related items, modifiers, and payment records

3.1.2 WHEN calculating subtotal for order items THEN the system SHALL CONTINUE TO sum (unit_price * quantity) for all items including modifier price adjustments

3.1.3 WHEN applying discount to an order THEN the system SHALL CONTINUE TO validate that discount does not exceed subtotal

3.1.4 WHEN determining payment status THEN the system SHALL CONTINUE TO mark order as 'paid' when totalPaid >= calculatedTotal

#### 3.2 Financial Reporting Components
3.2.1 WHEN generating shift summary reports THEN the system SHALL CONTINUE TO include order count, void count, payment breakdown, order type breakdown, and top products

3.2.2 WHEN calculating payment distribution THEN the system SHALL CONTINUE TO group by payment method and calculate percentages

3.2.3 WHEN generating hourly sales report THEN the system SHALL CONTINUE TO group sales by hour of day

3.2.4 WHEN generating weekly sales chart THEN the system SHALL CONTINUE TO show 7 days of data with day names

#### 3.3 Product Performance Metrics
3.3.1 WHEN generating top products report THEN the system SHALL CONTINUE TO rank products by quantity sold or revenue

3.3.2 WHEN calculating average order value THEN the system SHALL CONTINUE TO use `AVG(total)` for paid orders

3.3.3 WHEN generating cashier performance report THEN the system SHALL CONTINUE TO sum sales by cashier/user

#### 3.4 Order Filtering
3.4.1 WHEN applying date filters to reports THEN the system SHALL CONTINUE TO respect the date range parameters

3.4.2 WHEN filtering by outlet THEN the system SHALL CONTINUE TO show only orders for the specified outlet

3.4.3 WHEN filtering by tenant THEN the system SHALL CONTINUE TO enforce tenant isolation

#### 3.5 Menu Engineering Classification
3.5.1 WHEN products have valid cost data and sufficient sales history THEN the system SHALL CONTINUE TO classify them into star, plowhorse, puzzle, and dog categories based on popularity and profitability averages

3.5.2 WHEN calculating popularity threshold THEN the system SHALL CONTINUE TO use average quantity sold across all products

3.5.3 WHEN calculating profitability threshold THEN the system SHALL CONTINUE TO use average profit margin across all products (excluding products with no cost data in the fixed version)
