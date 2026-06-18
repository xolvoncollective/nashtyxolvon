# Regression Checklist (Stage 0 Baseline)

This checklist provides the critical paths that must be verified whenever refactoring architectural layers (especially routes and database calls).

## Authentication
- [ ] **Login with valid credentials** - Expected: Token issued, successful redirect. (Criticality: HIGH)
- [ ] **Login with invalid credentials** - Expected: 401 Unauthorized. (Criticality: HIGH)
- [ ] **Bypass in Development** - Expected: No token required when NODE_ENV=development. (Criticality: LOW)

## Products
- [ ] **Create new product** - Expected: Inserted into `products`, visible in POS. (Criticality: HIGH)
- [ ] **Update product price** - Expected: Changes reflected in POS, zero impact on historical completed orders. (Criticality: HIGH)
- [ ] **Soft delete product** - Expected: `status` changed to deleted, hidden from active POS menu. (Criticality: MEDIUM)

## Categories
- [ ] **Create category** - Expected: Inserted into `categories`. (Criticality: MEDIUM)
- [ ] **Assign product to category** - Expected: Visible under the correct category grouping. (Criticality: MEDIUM)

## Orders
- [ ] **Create dine-in order** - Expected: Inserted into `orders` and `order_items`, `kitchen_status` pending. (Criticality: CRITICAL)
- [ ] **Create takeaway order** - Expected: Inserted into `orders` and `order_items`. (Criticality: CRITICAL)
- [ ] **Void order** - Expected: `order_status` updated to cancelled. (Criticality: HIGH)

## Payments
- [ ] **Process full payment** - Expected: `payment_status` becomes paid, order is completed. (Criticality: CRITICAL)
- [ ] **Process split payment** - Expected: Multiple records in `payments`, `payment_status` paid when balance is 0. (Criticality: HIGH)

## Dashboard & Reports
- [ ] **Load Sales Report** - Expected: Correctly aggregates Gross, Net, Tax, Discount based on `orders` table. (Criticality: HIGH)
- [ ] **Load Dashboard** - Expected: Displays accurate daily summary. (Criticality: MEDIUM)

## Settings
- [ ] **Update tenant setting** - Expected: Key-value pair updated in `settings` table. (Criticality: LOW)

## Cost Calculation (Silo)
- [ ] **Update ingredient cost** - Expected: Updates `cost_bahan` and generates a `cost_riwayat_harga` record. (Criticality: MEDIUM)

## CRM (Silo)
- [ ] **Earn points** - Expected: Record in `crm_point_transactions`, updates `crm_customers.points`. (Criticality: MEDIUM)
- [ ] **Redeem points** - Expected: Deducts points. (Criticality: MEDIUM)

## KDS
- [ ] **Receive new order** - Expected: KDS fetches new order items with `kitchen_status = pending`. (Criticality: HIGH)
- [ ] **Mark item ready** - Expected: Updates `order_items.kitchen_status` to `ready`. (Criticality: HIGH)
