# Production Test Checklist - 23 Juni 2026

## ✅ FITUR YANG SUDAH DIPERBAIKI

### 1. KDS Order Display ✅ FIXED (Hari Ini)
**Status:** DEPLOYED & LIVE  
**Changes:**
- Added `getKDSQueue()` API method
- Added `get-kds-queue` edge function action
- Orders now fetch correctly from database

**Test Steps:**
1. Login POS dengan staff PIN
2. Buat order test (Dine In, nomor meja: 10)
3. Buka KDS di tab/device berbeda
4. Verifikasi order muncul dalam <5 detik
5. Klik "Start" → Status berubah "Preparing"
6. Klik "Ready" → Order hilang dari queue

**Expected:** ✅ Order muncul, timer jalan, status update berhasil

---

### 2. Dashboard Auto-Refresh ✅ FIXED (Hari Ini)
**Status:** DEPLOYED & LIVE  
**Changes:**
- Added auto-refresh every 30 seconds
- Cleans up interval when leaving page

**Test Steps:**
1. Login Backoffice (superadmin / nashty@2024)
2. Buka Dashboard
3. Catat angka: Total Orders, Net Revenue
4. Buka POS di tab lain, buat 1 order baru
5. Tunggu 30 detik, perhatikan Dashboard
6. Angka harus bertambah otomatis (tidak perlu manual refresh)

**Expected:** ✅ Dashboard numbers update setiap 30 detik otomatis

---

### 3. Reports Auto-Refresh ✅ FIXED (Hari Ini)
**Status:** DEPLOYED & LIVE  
**Changes:**
- Added auto-refresh every 60 seconds
- Cleans up interval when leaving page

**Test Steps:**
1. Login Backoffice
2. Buka Laporan → "Hari Ini"
3. Catat: Gross Sales, Total Transaksi
4. Buat order baru di POS
5. Tunggu 60 detik, perhatikan Reports
6. Angka harus update otomatis

**Expected:** ✅ Reports update setiap 60 detik otomatis

---

## 🔍 FITUR UNTUK DI-TEST CLIENT

### Authentication & Access
- [ ] **Backoffice Login**
  - Username: `superadmin`, Password: `nashty@2024`
  - Should redirect to launcher after login
  
- [ ] **POS PIN Login**
  - Staff: Citra Kusuma, PIN: `1234`
  - Should load POS interface after successful PIN
  
- [ ] **KDS Access**
  - Should load without additional authentication
  - Should show "Enable Sound" button on first load

---

### POS System
- [ ] **Product Selection**
  - Klik kategori di sidebar
  - Produk muncul di grid
  - Klik produk → masuk cart
  
- [ ] **Cart Operations**
  - [ ] Tambah quantity (+ button)
  - [ ] Kurangi quantity (- button)
  - [ ] Hapus item (× button)
  - [ ] Clear cart (🗑️ button)
  
- [ ] **Order Types**
  - [ ] Dine In (harus isi nomor meja)
  - [ ] Takeaway (tidak perlu nomor meja)
  
- [ ] **Payment Process**
  - [ ] Cash payment
  - [ ] QRIS payment
  - [ ] Debit card
  - [ ] Credit card
  - [ ] Split payment (multiple methods)
  
- [ ] **Receipt Print**
  - Setelah payment, receipt muncul
  - Ada tombol "Print" (browser print dialog)
  
- [ ] **Customer Display**
  - [ ] Klik icon 🖥️ di topbar
  - [ ] Window baru terbuka (customer display)
  - [ ] Cart items sync real-time
  - [ ] Idle mode with promo slideshow

---

### KDS System
- [ ] **Order Queue**
  - [ ] Orders appear after POS checkout
  - [ ] Showing: order number, table, items, timer
  - [ ] Sorted by oldest first
  
- [ ] **Sound Alerts** ✅ FIXED SEBELUMNYA
  - [ ] Klik "Enable Sound" button (muncul 3 detik pertama)
  - [ ] New order → beep sound
  - [ ] Urgent order (>80% target time) → double beep
  - [ ] Escalation (>100% target time) → triple beep
  
- [ ] **Order Workflow**
  - [ ] Pending (abu-abu) → klik "Start"
  - [ ] Preparing (biru) → klik "Ready"
  - [ ] Ready (hijau) → order hilang dari queue
  
- [ ] **Timer Alerts**
  - [ ] Timer kuning saat >50% target time
  - [ ] Timer merah saat >80% target time
  - [ ] Flash animation saat overdue

---

### Backoffice System

#### Dashboard
- [ ] **KPI Cards**
  - [ ] Total Orders (jumlah order hari ini)
  - [ ] Net Revenue (total penjualan)
  - [ ] Average Order Value
  - [ ] Growth % (vs hari sebelumnya)
  
- [ ] **Charts**
  - [ ] Revenue chart (7 hari terakhir)
  - [ ] Order type pie chart
  - [ ] Top products bar chart
  
- [ ] **Auto-Refresh** ✅ FIXED HARI INI
  - [ ] Numbers update setiap 30 detik
  - [ ] No manual refresh needed

#### Menu Management
- [ ] **Categories**
  - [ ] View all categories
  - [ ] Add new category
  - [ ] Edit category
  - [ ] Toggle active/inactive
  
- [ ] **Products**
  - [ ] View all products
  - [ ] Add new product
  - [ ] Edit product (name, price, category, image)
  - [ ] Toggle active/inactive
  - [ ] Upload product image
  
- [ ] **Modifiers**
  - [ ] View modifier groups
  - [ ] Add new modifier group
  - [ ] Add options to group
  - [ ] Assign to products

#### Team Management
- [ ] **Owners**
  - [ ] View owner list
  - [ ] Add new owner
  - [ ] Edit owner details
  - [ ] Set role permissions
  
- [ ] **Managers**
  - [ ] View manager list
  - [ ] Add new manager
  - [ ] Assign to outlets
  
- [ ] **Kasir/Cashiers**
  - [ ] View cashier list
  - [ ] Add new cashier with PIN
  - [ ] Edit cashier details
  - [ ] Reset PIN

#### Business Management
- [ ] **Outlets**
  - [ ] View outlet list with today's stats
  - [ ] Add new outlet
  - [ ] Edit outlet (name, address, phone)
  - [ ] Change status (active/inactive/maintenance)
  
- [ ] **Nashtycost (dalam Backoffice)**
  - [ ] View expense list
  - [ ] Add new expense
  - [ ] Edit expense
  - [ ] Delete expense
  - [ ] Filter by date/outlet
  
- [ ] **Reports** ✅ AUTO-REFRESH ADDED
  - [ ] Sales summary (Hari Ini, Minggu Ini, Bulan Ini)
  - [ ] Item sales ranking
  - [ ] Cashier performance
  - [ ] Auto-refresh every 60 seconds
  
- [ ] **Menu Engineering**
  - [ ] View product matrix (Stars, Plowhorses, Puzzles, Dogs)
  - [ ] Contribution margin analysis
  - [ ] Popularity vs profitability chart

#### KDS Settings (dalam Backoffice)
- [ ] **Production Time**
  - [ ] Set default production time per product
  - [ ] Bulk update
  
- [ ] **Alert Settings**
  - [ ] Enable/disable sound alerts
  - [ ] Enable/disable flash alerts
  - [ ] Set escalation interval
  - [ ] Configure workflow statuses

#### System Settings
- [ ] **General Settings**
  - [ ] Brand name
  - [ ] Logo upload
  - [ ] Timezone
  - [ ] Currency format
  
- [ ] **POS Settings**
  - [ ] Default order type
  - [ ] Tax rate
  - [ ] Service charge rate
  - [ ] Receipt customization
  
- [ ] **Activity Logs**
  - [ ] View all system activities
  - [ ] Filter by user/action/date
  - [ ] Export logs

---

### Nashty-Cost (Standalone App)
- [ ] **Access from Launcher**
  - [ ] Klik "Nashty-Cost" card
  - [ ] Login dengan superadmin
  
- [ ] **Dashboard**
  - [ ] View total costs (today, week, month)
  - [ ] Cost breakdown by category
  - [ ] Cost trend chart
  
- [ ] **Expense Management**
  - [ ] Add new expense
  - [ ] Edit expense
  - [ ] Delete expense
  - [ ] Attach receipt photo/document
  - [ ] Export expense report

---

### Nashty-Member / CRM (Standalone App)
- [ ] **Access from Launcher**
  - [ ] Klik "Nashty-Member" card
  - [ ] Login dengan staff PIN atau superadmin
  
- [ ] **Customer Database**
  - [ ] View customer list
  - [ ] Add new customer
  - [ ] Edit customer details
  - [ ] View customer transaction history
  - [ ] View loyalty points
  
- [ ] **Rewards Catalog**
  - [ ] View available rewards
  - [ ] Add new reward
  - [ ] Edit reward (name, points required, description)
  - [ ] Redeem reward for customer
  
- [ ] **Points History**
  - [ ] View all point transactions
  - [ ] Award points manually
  - [ ] Deduct points for redemption
  - [ ] Filter by customer/date

---

## 🚨 KNOWN ISSUES (NEED CLIENT FEEDBACK)

### Reported by Client
> "memang fiturnya belum bisa digunakan ya? contohnya orderan yang dibuat tidak tertampil pada KDS, dan banyak lainnya"

**Fixed Issues:**
1. ✅ KDS order display - FIXED
2. ✅ Dashboard tidak update - FIXED (auto-refresh)
3. ✅ Reports tidak update - FIXED (auto-refresh)

**Pending Client Feedback:**
- **"banyak lainnya"** - Client belum provide detail spesifik
- Mohon client test semua checklist di atas dan report fitur mana yang masih error

---

## 📊 TEST RESULTS (TO BE FILLED BY CLIENT)

### Critical Features Status
| Feature | Status | Notes |
|---------|--------|-------|
| KDS Order Display | ✅ | Fixed 23 Jun 2026 |
| Dashboard Auto-Refresh | ✅ | Fixed 23 Jun 2026 |
| Reports Auto-Refresh | ✅ | Fixed 23 Jun 2026 |
| POS Checkout | ⏳ | Pending test |
| Receipt Print | ⏳ | Pending test |
| Customer Display | ⏳ | Pending test |
| Menu Management | ⏳ | Pending test |
| Team Management | ⏳ | Pending test |
| Cost Management | ⏳ | Pending test |
| CRM/Member | ⏳ | Pending test |

### Bug Reports (TO BE FILLED)
**Format:**
```
BUG #X: [Title]
App: [POS/KDS/Backoffice/Cost/CRM]
Priority: [Critical/High/Medium/Low]
Steps:
1. Step 1
2. Step 2
3. Result (error/tidak jalan)
Expected: Should do X
Actual: Does Y instead
Screenshot: [if available]
```

---

## 🔐 TEST CREDENTIALS

### Superadmin
- Username: `superadmin`
- Password: `nashty@2024`
- Access: Backoffice, Cost, Settings

### Staff PINs (POS, KDS, CRM)
| Name | PIN | Role |
|------|-----|------|
| Citra Kusuma | 1234 | Cashier |
| Deni Pratama | 2345 | Cashier |
| Eka Wijaya | 3456 | Cashier |
| Fina Safitri | 4567 | Kitchen Staff |
| Gilang Ramadhan | 5678 | Kitchen Staff |

### Test Data
- **Tenant:** Galaxy Nashty
- **Outlets:** 
  - Nashty Pusat (Galaxy Mall)
  - Nashty Cabang 2 (Pakuwon TC)
  - Nashty Cabang 3 (TP6)
- **Products:** 50+ menu items seeded
- **Categories:** Makanan, Minuman, Dessert, Snack

---

## 📝 NEXT STEPS

1. **Client melakukan full testing** menggunakan checklist di atas
2. **Report specific bugs** dengan format yang sudah disediakan
3. **Development team akan fix** berdasarkan priority
4. **Iterative testing & fixing** sampai semua features working
5. **Final UAT sign-off** setelah semua critical features verified

---

**Last Updated:** 23 Juni 2026, 17:30 WIB  
**Test Deadline:** TBD  
**Sign-off Required:** Client UAT Team
