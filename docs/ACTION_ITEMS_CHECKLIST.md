# ✅ Action Items Checklist - NASHTY OS

## 📋 Overview

Checklist lengkap untuk setup dan verifikasi semua fitur baru yang sudah di-deploy.

**Last Updated:** June 23, 2026 - 19:00 WIB  
**Priority:** 🔴 High - Must complete sebelum production launch

---

## 🚨 CRITICAL - Must Do First (30 menit)

### ☐ 1. Verify Vercel Deployment
**Priority:** 🔴 CRITICAL  
**Time:** 5 minutes  
**Person:** Developer / Tech Lead

**Steps:**
```bash
1. Wait 2-3 minutes after last push
2. Open: https://nashtyxolvon.vercel.app
3. Check: Login page appears (not 404)
4. If still 404:
   - Go to Vercel Dashboard
   - Check deployment status
   - Check build logs for errors
   - Manual redeploy if needed
```

**Success Criteria:**
- ✅ Main page loads successfully
- ✅ No 404 errors
- ✅ All static assets load

**If Failed:**
- Read: `docs/PRODUCTION_TEST_RESULTS_JUNE_23.md`
- Follow: Vercel troubleshooting steps

---

### ☐ 2. Run Database Indexes (CRITICAL!)
**Priority:** 🔴 CRITICAL  
**Time:** 5 minutes  
**Person:** Database Admin / Developer

**Why:** Performance optimization - queries akan 80-90% lebih cepat!

**Steps:**
```sql
1. Login to Supabase: https://supabase.com/dashboard
2. Select project: mzucfndifneytbesirkx
3. Go to: SQL Editor
4. Open file: database/ADD_PERFORMANCE_INDEXES.sql
5. Copy ALL SQL content
6. Paste to SQL Editor
7. Click: "Run"
8. Wait for completion (~30 seconds)
9. Verify: "15 indexes created successfully"
```

**File Location:** `database/ADD_PERFORMANCE_INDEXES.sql`

**Success Criteria:**
- ✅ All 15 indexes created
- ✅ No errors in execution
- ✅ Dashboard loads faster (<1s)

**If Failed:**
- Check error message
- Some indexes may already exist (OK)
- Run again without problematic index

---

### ☐ 3. Add Payment Method Columns
**Priority:** 🔴 CRITICAL (for new features)  
**Time:** 3 minutes  
**Person:** Database Admin

**Why:** Required for Gojek/Shopee payment breakdown

**Steps:**
```sql
1. Open Supabase SQL Editor
2. Run this SQL:

-- Add payment method columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_gojek DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_shopee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_cash DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_debit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_transfer DECIMAL(10,2) DEFAULT 0;

-- Update existing orders to set defaults
UPDATE orders 
SET 
  payment_gojek = 0,
  payment_shopee = 0,
  payment_cash = CASE WHEN payment_method = 'cash' THEN total ELSE 0 END,
  payment_debit = CASE WHEN payment_method = 'debit' THEN total ELSE 0 END,
  payment_transfer = CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END
WHERE payment_gojek IS NULL;

-- Verify
SELECT 
  COUNT(*) as total_orders,
  SUM(payment_cash) as total_cash,
  SUM(payment_debit) as total_debit,
  SUM(payment_gojek) as total_gojek,
  SUM(payment_shopee) as total_shopee
FROM orders;
```

**Success Criteria:**
- ✅ 5 columns added successfully
- ✅ Existing orders updated
- ✅ No NULL values

---

### ☐ 4. Import WhatsApp Export Module
**Priority:** 🔴 CRITICAL  
**Time:** 2 minutes  
**Person:** Developer

**Why:** Enable WhatsApp export feature

**Steps:**
```html
1. Open: backoffice/frontend/index.html
2. Find: </head> closing tag
3. Add BEFORE </head>:

<!-- WhatsApp Export Module -->
<link rel="stylesheet" href="css/whatsapp-export.css">
<script src="js/whatsapp-export.js"></script>

4. Save file
5. Commit and push:
   git add backoffice/frontend/index.html
   git commit -m "feat: Import WhatsApp export module"
   git push origin main
```

**Success Criteria:**
- ✅ CSS loaded (check Network tab)
- ✅ JS loaded (check Console)
- ✅ WhatsApp button appears in Reports

---

## 📊 TESTING - Must Verify (30 menit)

### ☐ 5. Test All Critical Features
**Priority:** 🟠 HIGH  
**Time:** 15 minutes  
**Person:** QA / Manager

**Test Checklist:**

#### A. Login System
```
☐ Backoffice login works (superadmin / nashty@2024)
☐ POS login works (PIN: 1234)
☐ Token persists after refresh
```

#### B. KDS Order Display (CRITICAL FIX!)
```
☐ Create order in POS
☐ Order appears in KDS < 5 seconds
☐ Order details complete (items, table, notes)
☐ Can change status: Start → Preparing → Ready
☐ Order disappears after Ready
```

#### C. Dashboard Auto-Refresh
```
☐ Open Dashboard
☐ Note current values
☐ Create new order
☐ Wait 30 seconds
☐ Dashboard updates automatically (no manual refresh)
```

#### D. Reports Auto-Refresh
```
☐ Open Reports page
☐ Note current values
☐ Create new order
☐ Wait 60 seconds
☐ Reports update automatically
```

#### E. WhatsApp Export (NEW!)
```
☐ Go to Laporan → Ringkasan Penjualan
☐ Click "📱 WhatsApp" button
☐ Preview modal appears
☐ Message format correct (check template)
☐ Click "📋 Copy" - clipboard works
☐ Click "💾 Download" - file downloads
☐ Click "📱 Send WhatsApp" - WhatsApp opens
```

#### F. Filter Seminggu (NEW!)
```
☐ Click "Seminggu" filter button
☐ Button highlights (orange background)
☐ Data loads (KPIs update)
☐ Shows last 7 days data
☐ Average per day calculated correctly
```

#### G. Payment Breakdown (NEW!)
```
☐ Tab "Ringkasan Penjualan"
☐ Scroll to "💳 Payment Methods" table
☐ Verify 5 payment methods shown:
   ☐ 💵 Cash
   ☐ 💳 Debit Card
   ☐ 🏦 Transfer
   ☐ 🚗 Gojek (NEW!)
   ☐ 🛒 Shopee (NEW!)
☐ Percentages add up to 100%
☐ Colors match brand (Gojek green, Shopee orange)
```

#### H. Error Handler
```
☐ Try create order without items
☐ Error message in Indonesian appears
☐ Message is user-friendly
```

#### I. Connection Monitor
```
☐ Disconnect WiFi
☐ Red banner appears: "Tidak ada koneksi internet"
☐ Reconnect WiFi
☐ Green banner: "Koneksi kembali normal"
☐ Banner auto-hides after 3 seconds
```

**Success Criteria:**
- ✅ All 9 feature groups working
- ✅ No console errors
- ✅ Performance acceptable (<3s page load)

---

### ☐ 6. Run Quick Browser Test
**Priority:** 🟠 HIGH  
**Time:** 5 minutes  
**Person:** Developer / QA

**Steps:**
```javascript
1. Open: https://nashtyxolvon.vercel.app/pos/frontend/index.html
2. Press F12 (open console)
3. Copy content from: tests/quick-browser-test.js
4. Paste to console
5. Press Enter
6. Wait 2 seconds
7. Check results
```

**Expected Output:**
```
✅ Passed: 15/15 (100%)
🎉 ALL TESTS PASSED!
System is healthy and ready for production.
```

**Success Criteria:**
- ✅ 100% tests passed
- ✅ No errors in console
- ✅ All APIs reachable

**Repeat for:**
- ☐ POS page
- ☐ KDS page
- ☐ Backoffice page

---

### ☐ 7. Test on Multiple Devices
**Priority:** 🟡 MEDIUM  
**Time:** 10 minutes  
**Person:** QA Team

**Devices to Test:**

#### Desktop:
```
☐ Chrome (Windows/Mac)
☐ Firefox
☐ Edge
```

#### Tablet:
```
☐ iPad (Safari)
☐ Android Tablet (Chrome)
```

#### Mobile:
```
☐ iPhone (Safari)
☐ Android Phone (Chrome)
```

**Check Each Device:**
- ☐ Login works
- ☐ Layout responsive
- ☐ Touch interactions work
- ☐ Virtual keyboard doesn't block UI
- ☐ No console errors

---

## 🔧 CONFIGURATION - Setup Required (20 menit)

### ☐ 8. Configure Receipt Settings (Optional)
**Priority:** 🟡 MEDIUM  
**Time:** 10 minutes  
**Person:** Manager

**Why:** For receipt printing functionality

**Read First:**
- `docs/RECEIPT_QUICK_START.md` - 5 minute guide
- `docs/RECEIPT_CONFIGURATION_GUIDE.md` - Full guide

**Quick Setup:**
```
1. Beli thermal printer (Xprinter XP-80C ~Rp 500rb)
2. Install driver
3. Set as default printer
4. Login Backoffice → Settings → Receipt Settings
5. Upload logo (PNG, < 500KB, 300x100px)
6. Set header text:
   "NASHTY RESTAURANT
    Jl. Merdeka No. 123
    Telp: 021-12345678"
7. Choose font size: Medium (untuk 80mm)
8. Save
9. Test print from POS
```

**Success Criteria:**
- ✅ Receipt prints correctly
- ✅ Layout tidak berantakan
- ✅ Logo muncul
- ✅ All info complete

---

### ☐ 9. Update POS Payment Logic
**Priority:** 🟠 HIGH (for payment tracking)  
**Time:** 10 minutes  
**Person:** Developer

**Why:** Enable Gojek/Shopee tracking

**Code to Add:**

**File:** `pos/frontend/js/orders.js` or `checkout.js`

**Find this code:**
```javascript
// When creating order
const order = {
  // ... other fields
  payment_method: selectedPaymentMethod,
  total: totalAmount
};
```

**Replace with:**
```javascript
// When creating order
const order = {
  // ... other fields
  payment_method: selectedPaymentMethod,
  total: totalAmount,
  // NEW: Track payment per method
  payment_cash: selectedPaymentMethod === 'cash' ? totalAmount : 0,
  payment_debit: selectedPaymentMethod === 'debit' ? totalAmount : 0,
  payment_transfer: selectedPaymentMethod === 'transfer' ? totalAmount : 0,
  payment_gojek: selectedPaymentMethod === 'gojek' ? totalAmount : 0,
  payment_shopee: selectedPaymentMethod === 'shopee' ? totalAmount : 0
};
```

**Success Criteria:**
- ✅ New orders have payment breakdown
- ✅ Reports show correct split
- ✅ Gojek/Shopee tracked separately

---

## 📚 DOCUMENTATION - Share with Team (10 menit)

### ☐ 10. Share Documentation with Team
**Priority:** 🟡 MEDIUM  
**Time:** 5 minutes  
**Person:** Tech Lead / Manager

**Documents to Share:**

#### For Developers:
```
☐ docs/NEW_FEATURES_JUNE_23_EVENING.md - New features
☐ docs/COMPLETE_WORK_SUMMARY_JUNE_23.md - Complete overview
☐ docs/HOW_TO_TEST_PRODUCTION.md - Testing guide
```

#### For Managers:
```
☐ docs/PRODUCTION_TEST_MANUAL.md - UAT checklist
☐ docs/NEW_FEATURES_JUNE_23_EVENING.md - Feature guide
```

#### For End Users:
```
☐ docs/RECEIPT_QUICK_START.md - Receipt setup (5 min)
```

**How to Share:**
- ✅ Email team with links
- ✅ Post in Slack/WhatsApp group
- ✅ Print checklist for office

---

### ☐ 11. Train Staff on New Features
**Priority:** 🟡 MEDIUM  
**Time:** 5 minutes per person  
**Person:** Manager / Trainer

**Training Topics:**

#### For Cashiers (5 min):
```
1. How to use POS (basic)
2. What to do if error occurs
3. Who to call for support
```

#### For Managers (10 min):
```
1. How to export WhatsApp reports
2. How to read payment breakdown
3. How to use "Seminggu" filter
4. How to analyze trends
```

#### For Owners (15 min):
```
1. Overview of all new features
2. Strategic insights from reports
3. How to make data-driven decisions
```

**Training Checklist:**
- ☐ Demo all features
- ☐ Let them try hands-on
- ☐ Answer questions
- ☐ Share documentation
- ☐ Set up support channel

---

## 🔍 MONITORING - Ongoing (Daily)

### ☐ 12. Set Up Monitoring
**Priority:** 🟡 MEDIUM  
**Time:** Ongoing  
**Person:** Tech Lead

**Daily Checks:**

#### Morning (Before Opening):
```
☐ Run Quick Browser Test (2 min)
☐ Check Vercel deployment status
☐ Check Supabase API status
☐ Test login on all apps
```

#### During Operations:
```
☐ Monitor for user-reported issues
☐ Check browser console for errors
☐ Verify auto-refresh working
☐ Check connection monitor alerts
```

#### End of Day:
```
☐ Review error logs
☐ Export daily WhatsApp report
☐ Backup database
☐ Plan fixes for tomorrow
```

**Tools to Use:**
- Browser DevTools (F12)
- Vercel Dashboard
- Supabase Dashboard
- Quick Browser Test script

---

## 📊 OPTIONAL - Nice to Have (Later)

### ☐ 13. Advanced Configuration
**Priority:** 🔵 LOW  
**Time:** Various  
**Person:** Developer

**Future Enhancements:**

#### A. Custom Date Range Filter
```
- Add date picker to Reports
- Allow custom "from" and "to" dates
- Save favorite date ranges
```

#### B. More Payment Methods
```
- Add OVO, Dana, LinkAja
- Add QRIS
- Add credit card
```

#### C. Scheduled Reports
```
- Auto-send daily report via WhatsApp
- Auto-send weekly report via Email
- Set schedule and recipients
```

#### D. Advanced Analytics
```
- Product category analysis
- Customer segmentation
- Profit margin analysis
- Inventory alerts
```

#### E. Mobile App
```
- iOS app for POS
- Android app for POS
- Better offline support
```

---

## ✅ COMPLETION CHECKLIST

### Critical Items (Must Complete):
- [ ] 1. Verify Vercel Deployment (5 min)
- [ ] 2. Run Database Indexes (5 min)
- [ ] 3. Add Payment Columns (3 min)
- [ ] 4. Import WhatsApp Module (2 min)
- [ ] 5. Test All Features (15 min)
- [ ] 6. Run Browser Tests (5 min)

**Total Time:** ~35 minutes  
**Status:** ☐ Not Started / ☐ In Progress / ☐ Complete

### High Priority Items (Should Complete):
- [ ] 7. Test Multiple Devices (10 min)
- [ ] 9. Update POS Payment Logic (10 min)

**Total Time:** ~20 minutes

### Medium Priority Items (Can Do Later):
- [ ] 8. Configure Receipt (10 min)
- [ ] 10. Share Documentation (5 min)
- [ ] 11. Train Staff (varies)
- [ ] 12. Set Up Monitoring (ongoing)

---

## 📞 SUPPORT & HELP

### If You Need Help:

**Technical Issues:**
- Check: Browser console (F12) for errors
- Read: Relevant documentation in `docs/`
- Contact: Developer team

**Feature Questions:**
- Read: `docs/NEW_FEATURES_JUNE_23_EVENING.md`
- Check: `docs/PRODUCTION_TEST_MANUAL.md`

**Bug Reports:**
- Format: Which feature? What happened? Expected vs Actual?
- Include: Screenshots, console errors, steps to reproduce
- Send to: Developer team

**Emergency:**
- System down? Check Vercel deployment
- Critical bug? Report immediately with details
- Need urgent fix? Contact developer

---

## 🎯 SUCCESS CRITERIA

**System Ready for Production When:**
- ✅ All critical items completed (6 items)
- ✅ All tests passing (100%)
- ✅ No console errors
- ✅ Performance acceptable (<3s load)
- ✅ Features working as expected
- ✅ Team trained
- ✅ Documentation shared

**Then you can:**
- 🚀 Go live with confidence
- 📊 Start using new features
- 😊 Enjoy better reporting
- 💰 Track revenue more accurately

---

## 📅 TIMELINE

**Immediate (Today):**
- Complete critical items (35 min)
- Test all features (15 min)
- Fix any issues found

**Tomorrow:**
- Train staff (30 min)
- Share documentation (10 min)
- Monitor usage

**This Week:**
- Gather feedback
- Fix bugs if any
- Optimize based on usage

**Next Week:**
- Review analytics
- Plan enhancements
- Celebrate success! 🎉

---

**Document Version:** 1.0  
**Last Updated:** June 23, 2026  
**Status:** ✅ Ready to Use

**Print this checklist and check off items as you complete them!** ✓
