# COMPREHENSIVE UAT EXECUTION SCRIPT
# This script will execute all UAT test scenarios automatically using MCP Playwright

## UAT Test Scenarios

### 1. LOGIN TESTING
**Objective**: Verify POS login with PIN works correctly
- Navigate to https://nashtyxolvon2.pages.dev
- Login to Backoffice (superadmin / nashty@2024)
- Select outlet: Galaxy Mall Surabaya
- Open POS application
- Test PIN login with staff: Citra Kusuma (PIN: 1234)

### 2. ORDER CREATION (5x)
**Objective**: Create 5 orders in POS
For each order:
- Select 2-3 products from different categories
- Add to cart
- Complete order (cash/qris payment)
- Verify order appears in order list

### 3. KDS ORDER COMPLETION (5x)
**Objective**: Mark 5 orders as completed in KDS
- Open KDS application
- Verify 5 orders from POS appear
- Mark each order as "Preparing"
- Mark each order as "Ready"
- Verify orders disappear from KDS queue

### 4. BACKOFFICE MENU MANAGEMENT (3 new products)
**Objective**: Add 3 new menu items
- Login to Backoffice
- Navigate to Products/Menu
- Add Product 1: "Matcha Latte" (Coffee, Rp 36,000)
- Add Product 2: "Brownies" (Food, Rp 25,000)
- Add Product 3: "Lemonade" (Non-Coffee, Rp 24,000)
- Verify products saved

### 5. VERIFY NEW PRODUCTS IN POS & KDS
**Objective**: Ensure new products appear everywhere
- Open POS
- Verify 3 new products appear in menu
- Create order with new products
- Open KDS
- Verify order with new products appears

### 6. CRM MEMBER MANAGEMENT (4 members)
**Objective**: Add 4 new members
- Login to Backoffice
- Navigate to CRM / Members
- Add Member 1: "Budi Santoso" (081234567890)
- Add Member 2: "Ani Wijaya" (081234567891)
- Add Member 3: "Dewi Lestari" (081234567892)
- Add Member 4: "Eko Prasetyo" (081234567893)
- Verify members saved with IDs

### 7. CONNECT MEMBER TO OPEN BILL
**Objective**: Link member to POS transaction
- Open POS
- Create new order
- Add products
- Before payment, click "Add Member"
- Search and select member "Budi Santoso"
- Complete payment
- Verify member linked to transaction

### 8. CHECK TRANSACTION HISTORY
**Objective**: Verify transaction in backoffice
- Login to Backoffice
- Navigate to Transactions / History
- Find transaction with "Budi Santoso"
- Verify member name, products, total amount
- Verify points earned (if applicable)

### 9. DOWNLOAD PAYMENT REPORT EXCEL
**Objective**: Export payment report
- Login to Backoffice
- Navigate to Reports / Payments
- Select date range: Today
- Click "Export Excel"
- Verify file downloads (*.xlsx)
- Verify file contains transactions

### 10. CLOSE SHIFT
**Objective**: End of day shift closing
- Open POS
- Click "Close Shift" button
- Review shift summary:
  - Total transactions
  - Total sales
  - Payment method breakdown
  - Cash in drawer
- Confirm shift close
- Verify shift closed successfully

## Expected Results Summary
- ✅ All logins successful
- ✅ 5 orders created in POS
- ✅ 5 orders completed in KDS
- ✅ 3 new products added
- ✅ New products visible in POS & KDS
- ✅ 4 members added
- ✅ Member linked to transaction
- ✅ Transaction history accurate
- ✅ Excel report downloaded
- ✅ Shift closed successfully

## Test Data Reference

### Staff Credentials (PIN Login)
1. Citra Kusuma - PIN: 1234 (Galaxy Mall)
2. Budi Santoso - PIN: 2345 (Galaxy Mall)
3. Ani Wijaya - PIN: 3456 (Galaxy Mall)
4. Dina Permata - PIN: 4567 (Pakuwon TC)
5. Eko Prasetyo - PIN: 5678 (Pakuwon TC)

### Backoffice Credentials
- Username: superadmin
- Password: nashty@2024
- Outlet: Galaxy Mall Surabaya

### Existing Products (for orders)
**Coffee:**
- Americano (Rp 25,000)
- Cappuccino (Rp 32,000)
- Caffe Latte (Rp 35,000)
- Mocha (Rp 38,000)
- Flat White (Rp 36,000)

**Non-Coffee:**
- Green Tea (Rp 22,000)
- Thai Tea (Rp 28,000)
- Lemon Tea (Rp 25,000)
- Chocolate (Rp 30,000)

**Food:**
- Croissant (Rp 18,000)
- Sandwich (Rp 42,000)

### New Products to Add
1. Matcha Latte - Coffee - Rp 36,000
2. Brownies - Food - Rp 25,000
3. Lemonade - Non-Coffee - Rp 24,000

### New Members to Add
1. Budi Santoso - 081234567890
2. Ani Wijaya - 081234567891
3. Dewi Lestari - 081234567892
4. Eko Prasetyo - 081234567893
