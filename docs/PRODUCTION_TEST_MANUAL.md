# 🧪 Production Testing Manual - June 23, 2026

## 📋 Pre-Test Checklist

- [ ] Browser: Chrome/Firefox/Edge (latest version)
- [ ] Internet connection: Stable
- [ ] Test credentials ready
- [ ] Notebook untuk catat hasil

---

## 🔐 Test Credentials

```
Backoffice (Superadmin):
Username: superadmin
Password: nashty@2024

POS (Manager):
PIN: 1111

POS (Staff):
PIN: 1234
```

---

## 🎯 CRITICAL TESTS (Must Pass!)

### Test 1: ✅ Login System

#### A. Backoffice Login
1. Buka: https://nashtyxolvon.vercel.app/backoffice/frontend/index.html
2. Enter username: `superadmin`
3. Enter password: `nashty@2024`
4. Click "Login"
5. **Expected:** Redirect to dashboard dalam < 3 detik
6. **Check:** Token tersimpan di localStorage

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

#### B. POS Login (PIN)
1. Buka: https://nashtyxolvon.vercel.app/pos/frontend/index.html
2. Enter PIN: `1234` (Staff)
3. **Expected:** Login berhasil, muncul POS interface
4. **Check:** User name tampil di header

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 2: ✅ KDS Order Display (CRITICAL FIX!)

**Context:** Ini adalah fix utama dari June 23 - orders harus muncul di KDS!

#### A. Create Order di POS
1. Login POS (PIN: 1234)
2. Click product: "Nasi Goreng"
3. Click "Dine In"
4. Enter table: `10`
5. Click "Bayar Sekarang"
6. Enter payment: `50000`
7. Click "Konfirmasi Bayar"
8. **Expected:** Order created successfully
9. **Note order number:** #_______

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

#### B. Verify Order in KDS
1. Buka tab baru
2. Go to: https://nashtyxolvon.vercel.app/kds/frontend/index.html
3. **Expected:** Order #_____ muncul dalam **< 5 detik**
4. **Check fields:**
   - ☐ Order number tampil
   - ☐ Table number tampil
   - ☐ Items tampil
   - ☐ Quantity benar
   - ☐ Status: "Pending"
5. Click "Start Cooking"
6. **Expected:** Status berubah jadi "Preparing"
7. Click "Order Ready"
8. **Expected:** Order hilang dari queue

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 3: ✅ Dashboard Auto-Refresh (NEW FEATURE!)

**Context:** Dashboard harus auto-update setiap 30 detik

1. Login Backoffice
2. Buka Dashboard page
3. **Note current values:**
   - Total Orders: _______
   - Gross Sales: _______
   - Time: _______
4. **Biarkan page terbuka, jangan refresh manual**
5. Create new order di POS (tab lain)
6. **Wait 30 seconds**
7. **Check Dashboard:**
   - ☐ Total Orders bertambah
   - ☐ Gross Sales bertambah
   - ☐ No manual refresh needed!

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 4: ✅ Reports Auto-Refresh (NEW FEATURE!)

**Context:** Reports harus auto-update setiap 60 detik

1. Login Backoffice
2. Go to: Laporan → Laporan Bisnis
3. Filter: "Hari Ini"
4. **Note current values:**
   - Gross Sales: _______
   - Net Sales: _______
   - Time: _______
5. Create new order di POS (tab lain)
6. **Wait 60 seconds**
7. **Check Reports page:**
   - ☐ Values updated
   - ☐ No manual refresh needed!

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 5: ✅ Error Handler (NEW FEATURE!)

**Context:** Errors harus tampil dengan pesan Bahasa Indonesia yang user-friendly

#### A. Test Validation Error
1. Login POS
2. Click "Bayar Sekarang" **tanpa pilih product**
3. **Expected:** Error message muncul:
   - ☐ Pesan dalam Bahasa Indonesia
   - ☐ Pesan jelas (bukan technical error)
   - ☐ Contoh: "Pesanan harus memiliki minimal 1 item"

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

#### B. Test Network Error
1. Login POS
2. **Disconnect internet** (WiFi off)
3. Try create order
4. **Expected:** Error message:
   - ☐ "Tidak ada koneksi internet"
   - ☐ "Periksa koneksi Anda"

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 6: ✅ Connection Monitor (NEW FEATURE!)

**Context:** Visual indicator harus muncul ketika offline/online

1. Open any app (POS/KDS/Backoffice)
2. **Disconnect internet**
3. **Expected within 5 seconds:**
   - ☐ Red banner muncul di top
   - ☐ Text: "Tidak ada koneksi internet"
   - ☐ Icon: ⚠️ atau 🔴
4. **Reconnect internet**
5. **Expected within 5 seconds:**
   - ☐ Green banner muncul
   - ☐ Text: "Koneksi kembali normal"
   - ☐ Icon: ✅ atau 🟢
6. **Wait 3 seconds**
7. **Expected:** Banner auto-hide

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

## 📊 PERFORMANCE TESTS

### Test 7: ⚡ Page Load Speed

Measure time from URL enter until page fully loaded:

| Page | Target | Actual | Status |
|------|--------|--------|--------|
| POS | < 3s | ___s | ☐ PASS ☐ FAIL |
| KDS | < 2s | ___s | ☐ PASS ☐ FAIL |
| Backoffice | < 3s | ___s | ☐ PASS ☐ FAIL |
| Login | < 2s | ___s | ☐ PASS ☐ FAIL |

**How to measure:**
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Check "Disable cache"
4. Reload page (Ctrl+R)
5. Look at "Load" time at bottom

---

### Test 8: ⚡ API Response Time

Measure API call duration in browser console:

| API | Target | Actual | Status |
|-----|--------|--------|--------|
| Login | < 1s | ___s | ☐ PASS ☐ FAIL |
| Get Products | < 2s | ___s | ☐ PASS ☐ FAIL |
| Create Order | < 2s | ___s | ☐ PASS ☐ FAIL |
| KDS Queue | < 1s | ___s | ☐ PASS ☐ FAIL |

**How to measure:**
1. Open DevTools (F12) → Network tab
2. Perform action (login, create order, etc)
3. Find API call in network tab
4. Check "Time" column

---

### Test 9: ⚡ Database Query Performance

**Context:** Setelah database indexes di-apply

**Prerequisites:** Run `database/ADD_PERFORMANCE_INDEXES.sql` di Supabase

Test queries:

| Query | Before | After | Improvement |
|-------|--------|-------|-------------|
| Dashboard KPIs | ___s | ___s | __% |
| Reports Load | ___s | ___s | __% |
| KDS Queue | ___s | ___s | __% |
| Products Grid | ___s | ___s | __% |
| Login | ___s | ___s | __% |

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

## 🔄 END-TO-END WORKFLOW TESTS

### Test 10: 🛒 Complete POS Checkout Flow

**Full customer order workflow:**

1. ☐ Login POS (PIN: 1234)
2. ☐ Browse products grid
3. ☐ Add to cart: "Nasi Goreng" x2
4. ☐ Add to cart: "Es Teh" x1
5. ☐ Check cart total: Rp ______
6. ☐ Select order type: "Dine In"
7. ☐ Enter table: 5
8. ☐ Add notes: "Pedas level 3"
9. ☐ Click "Bayar Sekarang"
10. ☐ Total shown: Rp ______
11. ☐ Enter payment: Rp 100000
12. ☐ Change calculated: Rp ______
13. ☐ Click "Konfirmasi Bayar"
14. ☐ Order created, number: #______
15. ☐ Receipt preview shown (optional)
16. ☐ Cart cleared

**Time taken:** _____ seconds  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 11: 👨‍🍳 Complete KDS Workflow

1. ☐ Open KDS
2. ☐ Order #______ muncul (dari test 10)
3. ☐ Details tampil lengkap:
   - Table number: 5
   - Items: Nasi Goreng x2, Es Teh x1
   - Notes: "Pedas level 3"
4. ☐ Click "Start Cooking"
5. ☐ Status: "Preparing"
6. ☐ Timer starts
7. ☐ Cook the order (simulate)
8. ☐ Click "Order Ready"
9. ☐ Order hilang dari queue
10. ☐ Sound notification (if enabled)

**Time taken:** _____ seconds  
**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

### Test 12: 📊 Complete Reporting Workflow

1. ☐ Login Backoffice
2. ☐ Go to Dashboard
3. ☐ Verify KPIs tampil:
   - ☐ Total Orders Today
   - ☐ Gross Sales Today
   - ☐ Net Sales Today
   - ☐ Average Order Value
4. ☐ Go to Laporan → Laporan Bisnis
5. ☐ Select date range: "Hari Ini"
6. ☐ Report generated dalam < 5 detik
7. ☐ Data accurate (match dashboard)
8. ☐ Charts rendered correctly
9. ☐ Can export to CSV/PDF (if implemented)

**Result:** ☐ PASS  ☐ FAIL  
**Notes:** _______________________

---

## 🔐 SECURITY TESTS

### Test 13: 🛡️ Authentication Security

#### A. Unauthorized Access Prevention
1. ☐ Try access POS without login
   - Expected: Redirect to login
2. ☐ Try access Backoffice without login
   - Expected: Redirect to login
3. ☐ Try access KDS without login
   - Expected: Should work (KDS is public in kitchen)

**Result:** ☐ PASS  ☐ FAIL  

---

#### B. Token Expiration
1. ☐ Login Backoffice
2. ☐ Wait 24 hours (or modify token expiry)
3. ☐ Try access protected page
4. ☐ Expected: Auto-logout, redirect to login

**Result:** ☐ PASS  ☐ FAIL  

---

#### C. Role-Based Access
1. ☐ Login as Staff (PIN: 1234)
2. ☐ Try access Backoffice URL directly
3. ☐ Expected: Access denied or redirect

**Result:** ☐ PASS  ☐ FAIL  

---

## 🌐 BROWSER COMPATIBILITY TESTS

Test di berbagai browser:

| Browser | Version | POS | KDS | Backoffice | Status |
|---------|---------|-----|-----|------------|--------|
| Chrome | Latest | ☐ | ☐ | ☐ | _____ |
| Firefox | Latest | ☐ | ☐ | ☐ | _____ |
| Edge | Latest | ☐ | ☐ | ☐ | _____ |
| Safari | Latest | ☐ | ☐ | ☐ | _____ |

**Test each:**
- ☐ Login works
- ☐ Layout correct
- ☐ Features functional
- ☐ No console errors

---

## 📱 MOBILE/TABLET TESTS

Test di mobile devices:

| Device | OS | POS | KDS | Status |
|--------|----|----|-----|--------|
| iPad | iOS | ☐ | ☐ | _____ |
| Android Tablet | Android | ☐ | ☐ | _____ |
| iPhone | iOS | ☐ | ☐ | _____ |
| Android Phone | Android | ☐ | ☐ | _____ |

**Check:**
- ☐ Responsive layout
- ☐ Touch interactions work
- ☐ Virtual keyboard tidak block UI
- ☐ Performance acceptable

---

## 🐛 KNOWN ISSUES CHECK

Verify bahwa known issues sudah fixed:

### ✅ FIXED Issues (June 23):
- ☐ KDS orders not displaying (FIXED - get-kds-queue API added)
- ☐ Dashboard requires manual refresh (FIXED - auto-refresh 30s)
- ☐ Reports require manual refresh (FIXED - auto-refresh 60s)
- ☐ createOpenBill() missing (FIXED - method added)
- ☐ No error handling (FIXED - global error handler)
- ☐ No connection status (FIXED - connection monitor)

### ⏳ PENDING Issues (Need Client Action):
- ☐ Database indexes not applied
  - Action: Run `ADD_PERFORMANCE_INDEXES.sql` in Supabase
- ☐ Receipt printer not configured
  - Action: Follow `RECEIPT_QUICK_START.md`

---

## 📊 TEST SUMMARY

**Test Date:** _______________  
**Tested By:** _______________  
**Environment:** Production  
**URL:** https://nashtyxolvon.vercel.app

### Results:

| Category | Total | Pass | Fail | Pass % |
|----------|-------|------|------|--------|
| Critical Tests | 6 | ___ | ___ | ___% |
| Performance Tests | 3 | ___ | ___ | ___% |
| Workflow Tests | 3 | ___ | ___ | ___% |
| Security Tests | 3 | ___ | ___ | ___% |
| Compatibility Tests | 2 | ___ | ___ | ___% |
| **TOTAL** | **17** | ___ | ___ | ___% |

---

## 🎯 FINAL VERDICT

**Overall System Status:**

☐ 🟢 **EXCELLENT** (100% pass) - Production ready, no issues  
☐ 🟡 **GOOD** (>90% pass) - Production ready with minor issues  
☐ 🟠 **FAIR** (>70% pass) - Can go live, but needs monitoring  
☐ 🔴 **POOR** (<70% pass) - Critical issues, DO NOT deploy

---

## 📝 ISSUES FOUND

**Critical Issues (Block production):**
1. _________________________________
2. _________________________________
3. _________________________________

**High Priority (Should fix ASAP):**
1. _________________________________
2. _________________________________
3. _________________________________

**Medium Priority (Fix within 1 week):**
1. _________________________________
2. _________________________________

**Low Priority (Fix when possible):**
1. _________________________________
2. _________________________________

---

## ✅ SIGN-OFF

**Tester Name:** _______________________  
**Date:** _______________________  
**Signature:** _______________________

**Decision:**
☐ Approve for production  
☐ Approve with conditions  
☐ Reject - needs fixes

**Conditions/Notes:**
_________________________________________
_________________________________________
_________________________________________

---

## 📞 SUPPORT CONTACTS

**Technical Issues:** Developer Team  
**Bug Reports:** GitHub Issues  
**Documentation:** `docs/` folder

---

**Document Version:** 1.0  
**Last Updated:** June 23, 2026  
**Status:** ✅ Ready for Testing
