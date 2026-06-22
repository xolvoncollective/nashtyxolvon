# 🧪 NASHTY OS - UAT TEST PLAN (AUTOMATED)

## Test Environment
- **Frontend**: https://nashtyxolvon2.pages.dev
- **Database**: Supabase (mzucfndifneytbesirkx)
- **Test Method**: MCP Playwright + MCP Serena
- **Test Date**: 2026-06-22

---

## ✅ Test Credentials

### Backoffice Login
- **Username**: superadmin
- **Password**: nashty@2024
- **Outlet**: Galaxy Mall Surabaya

### POS Staff (PIN Login)
- **Citra Kusuma**: PIN 1234 (Galaxy Mall)
- **Budi Santoso**: PIN 2345 (Galaxy Mall)
- **Ani Wijaya**: PIN 3456 (Galaxy Mall)
- **Dina Permata**: PIN 4567 (Pakuwon TC)
- **Eko Prasetyo**: PIN 5678 (Pakuwon TC)

---

## 📋 TEST SCENARIOS

### 1. ✅ Backoffice Login (COMPLETED)
- [x] Navigate to https://nashtyxolvon2.pages.dev
- [x] Fill username: superadmin
- [x] Fill password: nashty@2024
- [x] Select outlet: Galaxy Mall Surabaya
- [x] Click Authenticate
- [x] Verify: System launcher appears
- [x] Verify: Shows "System Granted"

**Status**: ✅ PASSED

---

### 2. ⏳ POS Login & Staff Selection (IN PROGRESS)
- [ ] From launcher, click Nashty-POS
- [ ] Verify: Staff selection screen appears
- [ ] Verify: Shows 3 staff for Galaxy Mall (Citra, Budi, Ani)
- [ ] Select staff: Citra Kusuma
- [ ] Enter PIN: 1234
- [ ] Verify: POS main screen loads
- [ ] Verify: Staff name appears in header

**Status**: ⏳ PENDING (waiting for Cloudflare deployment)

---

### 3. ⏳ POS - Create 5 Orders
**Objective**: Test order creation flow 5 times

**Order 1**: Hot Chicken Original (1 pcs)
- [ ] Click Hot Chicken category
- [ ] Select: Hot Chicken Original (1 pcs) - Rp 25,000
- [ ] Click Add to Cart
- [ ] Verify: Cart shows 1 item
- [ ] Click Bayar
- [ ] Payment method: Cash
- [ ] Amount: Rp 30,000
- [ ] Confirm payment
- [ ] Verify: Order success, receipt printed
- [ ] Verify: Kembalian Rp 5,000

**Order 2**: Burger + Fries
- [ ] Click Burger category
- [ ] Select: Classic Chicken Burger - Rp 32,000
- [ ] Select: French Fries - Rp 15,000
- [ ] Total: Rp 47,000
- [ ] Payment: QRIS
- [ ] Verify: Order success

**Order 3**: Rice Bowl + Drink
- [ ] Select: Chicken Teriyaki Bowl - Rp 35,000
- [ ] Select: Es Teh Manis - Rp 5,000
- [ ] Total: Rp 40,000
- [ ] Payment: Debit Card
- [ ] Verify: Order success

**Order 4**: Multiple Items
- [ ] Hot Wings Level 2 (5 pcs) - Rp 35,000
- [ ] Cheese Chicken Burger - Rp 38,000
- [ ] Lemon Tea - Rp 10,000
- [ ] Total: Rp 83,000
- [ ] Payment: Cash Rp 100,000
- [ ] Verify: Kembalian Rp 17,000

**Order 5**: With Member
- [ ] Click "Cari Member"
- [ ] Search: "Budi" (will create in CRM first)
- [ ] Select member: Budi Hartono
- [ ] Add: Spicy Chicken Bowl - Rp 32,000
- [ ] Apply member discount (if any)
- [ ] Payment: Cash
- [ ] Verify: Member points added

**Status**: ⏳ PENDING

---

### 4. ⏳ KDS - Process 5 Orders
**Objective**: Verify orders appear in KDS and can be marked as complete

- [ ] From launcher, open Nashty-KDS
- [ ] Verify: 5 orders from POS appear
- [ ] For each order:
  - [ ] Verify order details correct
  - [ ] Click "Sedang Dimasak"
  - [ ] Wait 2 seconds
  - [ ] Click "Selesai"
  - [ ] Verify: Order moves to completed
- [ ] Verify: All 5 orders marked as complete

**Status**: ⏳ PENDING

---

### 5. ⏳ Backoffice - Add 3 New Menu Items
**Objective**: Test product creation and verify sync to POS/KDS

**New Product 1**: Nasi Goreng Pedas
- [ ] From launcher, access Nashty-Backoffice
- [ ] Enter superadmin credentials if required
- [ ] Navigate to Products → Add New
- [ ] Name: Nasi Goreng Pedas
- [ ] Category: Rice Bowl
- [ ] Price: Rp 28,000
- [ ] Cost: Rp 13,000
- [ ] Stock: 999
- [ ] Status: Active
- [ ] Save product
- [ ] Verify: Success message

**New Product 2**: Matcha Latte
- [ ] Name: Matcha Latte
- [ ] Category: Beverages
- [ ] Price: Rp 18,000
- [ ] Cost: Rp 7,000
- [ ] Save

**New Product 3**: Crispy Mozarella Stick
- [ ] Name: Crispy Mozarella Stick
- [ ] Category: Snacks & Sides
- [ ] Price: Rp 22,000
- [ ] Cost: Rp 10,000
- [ ] Save

**Verification in POS**:
- [ ] Return to POS
- [ ] Refresh product list
- [ ] Verify: 3 new products appear
- [ ] Try adding to cart: Nasi Goreng Pedas
- [ ] Verify: Can complete order with new product

**Verification in KDS**:
- [ ] Check KDS
- [ ] Verify: Order with new product appears
- [ ] Mark as complete

**Status**: ⏳ PENDING

---

### 6. ⏳ CRM - Add 4 Members
**Objective**: Test member creation

**Member 1**: Budi Hartono
- [ ] From launcher, access Nashty-Member (CRM)
- [ ] Click "Tambah Member"
- [ ] Name: Budi Hartono
- [ ] Phone: 081234567001
- [ ] Email: budi.hartono@example.com
- [ ] Address: Jl. Merdeka No. 123, Surabaya
- [ ] Save
- [ ] Verify: Member created with ID

**Member 2**: Siti Aminah
- [ ] Name: Siti Aminah
- [ ] Phone: 081234567002
- [ ] Email: siti.aminah@example.com
- [ ] Save

**Member 3**: Ahmad Rizki
- [ ] Name: Ahmad Rizki
- [ ] Phone: 081234567003
- [ ] Email: ahmad.rizki@example.com
- [ ] Save

**Member 4**: Dewi Lestari
- [ ] Name: Dewi Lestari
- [ ] Phone: 081234567004
- [ ] Email: dewi.lestari@example.com
- [ ] Save

**Status**: ⏳ PENDING

---

### 7. ⏳ POS - Connect Member to Open Bill
**Objective**: Test member linking to transaction

- [ ] Return to POS
- [ ] Create new order
- [ ] Before payment, click "Tambah Member" or "Cari Member"
- [ ] Search: Budi Hartono (phone or name)
- [ ] Select member
- [ ] Verify: Member info appears on order
- [ ] Add item: Hot Chicken Level 2 (1 pcs) - Rp 27,000
- [ ] Verify: Member discount applied (if configured)
- [ ] Complete payment
- [ ] Verify: Member points added
- [ ] Check receipt: Should show member name

**Status**: ⏳ PENDING

---

### 8. ⏳ Backoffice - Check Transaction History
**Objective**: Verify all transactions recorded correctly

- [ ] Open Nashty-Backoffice
- [ ] Navigate to Reports → Transaction History
- [ ] Filter: Today
- [ ] Verify: 6 orders visible (5 from POS + 1 with member)
- [ ] Check order details:
  - [ ] Correct items
  - [ ] Correct amounts
  - [ ] Correct payment methods
  - [ ] Member data (for last order)
- [ ] Verify: Total sales match

**Status**: ⏳ PENDING

---

### 9. ⏳ Backoffice - Download Excel Report
**Objective**: Test report export functionality

- [ ] In Backoffice Reports
- [ ] Select date range: Today
- [ ] Click "Export to Excel" or "Download Report"
- [ ] Verify: Excel file downloads
- [ ] Open Excel file
- [ ] Verify contents:
  - [ ] All 6 orders present
  - [ ] Columns: Order ID, Date, Items, Total, Payment Method, Staff
  - [ ] Data accurate
  - [ ] Formatting correct

**Status**: ⏳ PENDING

---

### 10. ⏳ POS - Close Shift
**Objective**: Test shift closing and cash reconciliation

- [ ] In POS, click "Tutup Shift" or shift menu
- [ ] System shows shift summary:
  - [ ] Total orders: 6
  - [ ] Total sales: Rp XXX,XXX
  - [ ] Cash: Rp XXX,XXX
  - [ ] QRIS: Rp XXX,XXX
  - [ ] Debit: Rp XXX,XXX
- [ ] Enter actual cash count
- [ ] Verify: Cash difference calculated
- [ ] Add closing notes (optional)
- [ ] Click "Tutup Shift"
- [ ] Verify: Shift closed
- [ ] Verify: POS returns to staff selection
- [ ] Verify: Previous shift cannot be edited

**Status**: ⏳ PENDING

---

## 📊 TEST SUMMARY

### Progress
- **Total Tests**: 10 scenarios
- **Completed**: 1 (Backoffice Login)
- **Remaining**: 9
- **Completion**: 10%

### Issues Found
1. ⚠️ POS outlet ID passing from launcher (FIXED - pending deployment)
2. ⚠️ Staff table role constraint (FIXED - kasir vs cashier)

### Next Steps
1. Wait for Cloudflare Pages deployment (~2-3 minutes)
2. Test POS login with Playwright
3. Continue with order creation tests
4. Complete full UAT cycle

---

**Test Execution Date**: 2026-06-22
**Tested By**: Automated UAT (MCP Playwright + Serena)
**Environment**: Production (nashtyxolvon2.pages.dev)
