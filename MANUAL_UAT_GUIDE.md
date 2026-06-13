# 🧪 Manual UAT Testing Guide - NASHTY OS

**Tujuan:** Test full order flow secara manual menggunakan POS, KDS, dan Backoffice

---

## 🚀 Persiapan

### 1. Pastikan Backend Running
```powershell
cd backoffice\backend
npm run dev
```

Cek backend status:
```
http://localhost:3099/health
```

Harus return: `{"status":"ok","timestamp":"..."}`

### 2. Buka 3 Browser Windows

**Option A: Manual**
- Window 1 (POS): http://localhost:3099/pos/frontend/index.html
- Window 2 (KDS): http://localhost:3099/kds/frontend/index.html  
- Window 3 (Backoffice): http://localhost:3099/backoffice/frontend/index.html

**Option B: PowerShell Script**
```powershell
# Jalankan dari root project
.\open_test_windows.ps1
```

---

## 📋 Test Scenario: Complete Order Flow

### STEP 1: Login di POS (Window 1)

1. **Buka:** http://localhost:3099/pos/frontend/index.html
2. **Login Screen** akan muncul
3. **Pilih Kasir:** Klik card "Citra Dewi" (Cashier)
4. **Input PIN:** `1234`
   - Akan muncul numpad
   - Klik: 1 → 2 → 3 → 4
5. ✅ **Login berhasil** jika masuk ke POS interface

**Troubleshooting:**
- Jika stuck di login, refresh page (F5)
- Jika PIN salah, klik "Kembali" dan coba lagi

---

### STEP 2: Check/Start Shift

Setelah login, POS akan otomatis check active shift:

**Jika Shift Belum Ada:**
- Modal "Buka Shift" akan muncul
- Input **Modal Awal:** `500000` (Rp 500.000)
- Klik "Buka Shift"

**Jika Shift Sudah Ada:**
- Langsung masuk ke POS interface
- Skip ke Step 3

---

### STEP 3: Buat Order di POS

#### 3.1 Browse Menu
- **Categories** ada di bagian atas (strip horizontal)
- **Default:** Tab "Makanan" aktif
- **Visible:** 10 items makanan dengan foto/icon

#### 3.2 Pilih Item: Ayam Bakar Madu
1. **Klik card** "Ayam Bakar Madu" (Rp 55.000)
2. **Modal Modifier** akan muncul
3. **Pilih Level Pedas:** 
   - Radio button: pilih "Pedas Sedang"
4. **Optional Add-ons:**
   - Checkbox: centang "Nasi Putih" (+Rp 6.000)
5. **Klik "Tambahkan ke Cart"**

#### 3.3 Tambah Item Lain (Opsional)
1. **Pilih kategori** "Minuman" (tab atas)
2. **Klik** "Es Teh Manis" (Rp 8.000)
3. **Modal Modifier** muncul
4. **Pilih Tingkat Manis:** "Normal"
5. **Klik "Tambahkan ke Cart"**

#### 3.4 Lihat Cart
- **Panel kanan** menampilkan cart
- **Expected:**
  - Ayam Bakar Madu + Nasi Putih = Rp 61.000
  - Es Teh Manis = Rp 8.000
  - **Subtotal:** Rp 69.000
  - **Tax (11%):** Rp 7.590
  - **Service (5%):** Rp 3.450
  - **TOTAL:** Rp 80.040

#### 3.5 Proses Pembayaran
1. **Pilih Order Type:** 
   - Klik "Dine In"
   - Input **Table Number:** `T05`
2. **Klik tombol "Bayar"** (pojok kanan bawah)
3. **Payment Modal** muncul
4. **Pilih metode:** "Tunai" (default)
5. **Input nominal:** Klik `100000` (Rp 100.000)
6. **Kembalian otomatis:** Rp 19.960
7. **Klik "Konfirmasi Bayar"**

#### 3.6 Verifikasi Order Created
- ✅ **Success message** muncul
- ✅ **Order Number** generated (contoh: `SNY-0201`)
- ✅ **Struk** akan di-print (console log)
- ✅ **Cart cleared**

---

### STEP 4: Check KDS (Window 2)

1. **Buka:** http://localhost:3099/kds/frontend/index.html
2. **Login KDS** (jika diminta):
   - Pilih "Ani Kitchen" (Chef)
   - PIN: `3456`

#### 4.1 Verifikasi Order Muncul
- ✅ **Order card** muncul di KDS queue
- **Expected content:**
  - Order Number: SNY-0201
  - Table: T05
  - Items:
    - 1x Ayam Bakar Madu (Pedas Sedang, +Nasi Putih)
    - 1x Es Teh Manis (Normal)
  - Timer: mulai hitung dari 00:00
  - Status: **Pending** (warna default)

#### 4.2 Update Status Order
**Scenario: Chef selesai memasak**

1. **Swipe order card** ke kanan (atau klik tombol "Ready")
2. **Konfirmasi** "Tandai Selesai"
3. ✅ **Status berubah** ke "Ready"
4. ✅ **Order hilang** dari KDS queue (pindah ke Ready list)

**Visual Feedback:**
- Order card berubah warna (hijau/ready)
- Timer berhenti
- Notifikasi sound (jika enabled)

---

### STEP 5: Konfirmasi di POS (Window 1)

#### 5.1 Overlay Notifikasi
Kembali ke POS Window:
- ✅ **Overlay notification** muncul
- **Content:** "Order T05 - SNY-0201 Siap!"
- **Action:** Klik "Konfirmasi Diantar"

#### 5.2 Complete Order
- Order status → `completed`
- Order masuk ke history
- Ready untuk order berikutnya

---

### STEP 6: Check Backoffice Dashboard (Window 3)

1. **Buka:** http://localhost:3099/backoffice/frontend/index.html
2. **Login Backoffice:**
   - Email: `admin@nashty.demo`
   - Password: (atau gunakan PIN 0000 jika PIN-based)

#### 6.1 Dashboard KPI
- **Navigate:** Tab "Dashboard"
- **Verify:**
  - ✅ Total Orders: bertambah +1
  - ✅ Gross Revenue: bertambah +Rp 80.040
  - ✅ Chart updated (jika ada)

#### 6.2 Recent Orders
- **Navigate:** Tab "Riwayat" atau "Orders"
- **Verify:**
  - ✅ Order SNY-0201 ada di list
  - ✅ Status: Completed
  - ✅ Total: Rp 80.040
  - ✅ Kasir: Citra Dewi
  - ✅ Table: T05

#### 6.3 Order Details
- **Klik order** SNY-0201
- **Verify details:**
  - Items: 2 items
  - Modifiers: Pedas Sedang, Nasi Putih, Normal
  - Payment: Tunai
  - Change: Rp 19.960

---

## ✅ Success Criteria

### Flow Lengkap Berhasil Jika:

- [x] **POS:** Login kasir berhasil
- [x] **POS:** Shift dibuka/detected
- [x] **POS:** Menu tampil lengkap (50 items)
- [x] **POS:** Modifier modal berfungsi
- [x] **POS:** Add to cart berhasil
- [x] **POS:** Kalkulasi total benar
- [x] **POS:** Payment processed
- [x] **POS:** Order created (dapat order number)
- [x] **KDS:** Order muncul di queue
- [x] **KDS:** Timer berjalan
- [x] **KDS:** Status update berhasil
- [x] **POS:** Notifikasi ready muncul
- [x] **POS:** Confirm delivery berhasil
- [x] **Backoffice:** Order tercatat di dashboard
- [x] **Backoffice:** KPI terupdate
- [x] **Backoffice:** Order details lengkap

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Frontend Tidak Load
**Symptom:** Blank page atau "Cannot GET /..."

**Solution:**
```powershell
# Pastikan backend running
cd backoffice\backend
npm run dev

# Test endpoint
curl http://localhost:3099/health
```

### Issue 2: Login Gagal
**Symptom:** "Invalid PIN" terus-menerus

**Solution:**
```powershell
# Re-seed database
cd backoffice\backend
npm run db:seed
```

**PIN Valid:**
- 1234 (Citra Dewi - Cashier)
- 2345 (Budi Santoso - Cashier)
- 3456 (Ani Kitchen - Chef)
- 0000 (Admin Demo - Owner)

### Issue 3: Menu Tidak Muncul
**Symptom:** Category ada tapi items kosong

**Solution:**
```bash
# Re-import menu
node reimport_menu_complete.js

# Verify import
node test_imported_menu.js
```

### Issue 4: Order Tidak Muncul di KDS
**Symptom:** Order created di POS tapi tidak ada di KDS

**Check:**
1. KDS login sebagai Chef/Kitchen role
2. Filter status: pastikan "Pending" dicentang
3. Outlet ID sama
4. Refresh KDS page (F5)

### Issue 5: CORS Error
**Symptom:** Console error "CORS policy blocked"

**Solution:**
Backend sudah set `origin: '*'` - seharusnya tidak ada CORS issue.
Jika masih ada, pastikan request dari `localhost:3099`.

### Issue 6: Database Locked
**Symptom:** "database is locked" error

**Solution:**
```powershell
# Stop semua process
# Close semua database connections
# Restart backend
```

---

## 📊 Test Data Summary

### Test Order Example:
```
Order Number: SNY-0201
Type: Dine In
Table: T05
Kasir: Citra Dewi

Items:
- Ayam Bakar Madu (Rp 55.000)
  Modifiers: Pedas Sedang, +Nasi Putih (Rp 6.000)
- Es Teh Manis (Rp 8.000)
  Modifiers: Normal

Subtotal: Rp 69.000
Tax (11%): Rp 7.590
Service (5%): Rp 3.450
TOTAL: Rp 80.040

Payment: Tunai Rp 100.000
Change: Rp 19.960
```

---

## 🎯 Advanced Testing Scenarios

### Scenario 2: Multiple Items dengan Complex Modifiers
1. Order "Kopi Susu Aren" (2 modifier groups + addons)
2. Order "French Fries" (multi-select saus + addons)
3. Verify total calculation dengan addons

### Scenario 3: Void Order
1. Create order
2. Di history, klik order
3. Klik "Void"
4. Input PIN Manager (0000)
5. Verify order status = voided

### Scenario 4: Shift Close
1. End of day
2. Klik "Tutup Shift"
3. Input closing cash
4. Verify shift summary

### Scenario 5: Delivery Order
1. Order type: "GoFood"
2. Input platform ref number
3. Payment: GoFood
4. Verify flow berbeda (no table number)

---

## 📸 Screenshot Checklist

Untuk dokumentasi, ambil screenshot:
- [ ] POS: Login screen
- [ ] POS: Menu grid with categories
- [ ] POS: Modifier modal
- [ ] POS: Cart with items
- [ ] POS: Payment modal
- [ ] KDS: Order queue
- [ ] KDS: Order card detail
- [ ] Backoffice: Dashboard with KPI
- [ ] Backoffice: Order list
- [ ] Backoffice: Order detail

---

## ⏱️ Estimated Testing Time

- **Basic Flow (1 order):** 5-10 minutes
- **Complete Testing (all scenarios):** 30-45 minutes
- **Bug Investigation:** Additional time as needed

---

**Last Updated:** June 13, 2026  
**Backend Port:** 3099  
**Database:** data/nashtypos.db  
**Status:** Ready for Manual UAT

---

*Happy Testing! 🎉*
