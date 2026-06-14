# 🧪 NASHTY OS - Complete Testing Guide

**Last Updated:** 2025-01-15  
**Purpose:** Test POS → KDS → Backoffice integration

---

## 📋 Pre-Testing Checklist

### ✅ Files Fixed/Created
- [x] **POS API Port** - Fixed (3099 → 3001) in `/pos/frontend/js/api.js`
- [x] **KDS API Client** - Created at `/kds/frontend/js/api.js`
- [x] **KDS HTML** - Updated to load new API client
- [x] **Main Launcher** - Created at `/main-launcher.html`
- [x] **API Documentation** - Complete reference guide
- [x] **Audit Report** - All backend routes validated

### ✅ Backend Status
- [x] Server runs on port 3001
- [x] All 15 route files working
- [x] Database connectivity working
- [x] JWT authentication working
- [x] Health check endpoint working

---

## 🚀 Step-by-Step Testing

### Step 1: Start the Server

```powershell
# Open PowerShell in project root
.\start-local.ps1
```

**Expected Output:**
```
✓ Starting NASHTY OS...
✓ Node.js version: v18.x.x (OK)
✓ Port 3001 is free
✓ Backend server started
✓ Health check: PASSED
✓ Opening browser...
```

**If server doesn't start:**
- Check Node.js version: `node --version` (need v18+)
- Check port: `netstat -ano | findstr :3001`
- Kill process if needed: `taskkill /PID <PID> /F`

---

### Step 2: Test Backend Health

Open browser or use curl:
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.0"
}
```

✅ If you see this, backend is ready!

---

### Step 3: Open Main Launcher

Navigate to:
```
http://localhost:3001/main-launcher.html
```

**What you should see:**
- Login form with username/password fields
- Server status: "✓ Server Online (Port 3001)"
- Pre-filled credentials: admin/admin

**Test Login:**
1. Click "Login" button
2. Should see "✓ Login berhasil!"
3. Should transition to apps menu with 3 options

✅ **KPI:** JWT session created successfully

---

### Step 4: Test Individual Systems

#### Test 4A: Open POS
1. Click "🛒 POS Terminal" button
2. New window should open
3. Should see POS interface

**Check Console (F12):**
```
[POS API] Client initialized
Session restored: {...}
```

#### Test 4B: Open KDS
1. Click "👨‍🍳 Kitchen Display" button
2. New window should open
3. Should see KDS interface

**Check Console (F12):**
```
[KDS API] Client initialized
[KDS] Session restored: {...}
```

#### Test 4C: Open Backoffice
1. Click "📊 Backoffice Dashboard" button
2. New window should open
3. Should see dashboard

---

### Step 5: Test POS → Database Integration

In POS window:

**5.1 Check Menu Loading**
1. POS should call `/api/menu`
2. Open DevTools → Network tab
3. Look for request to `localhost:3001/api/menu`
4. Should return 200 OK with categories and products

**Expected Request:**
```
GET http://localhost:3001/api/menu?tenantId=<TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

**5.2 Create Test Order**
1. Add a product to cart
2. Click "Pay" or "Process Order"
3. Order should be created

**Check in DevTools → Network:**
```
POST http://localhost:3001/api/orders
Status: 201 Created
Response: { "success": true, "order": {...} }
```

✅ **KPI 1:** Order created in POS and saved to database

---

### Step 6: Test POS → KDS Integration

**6.1 Create Order in POS**
1. In POS: Add items → Complete payment
2. Note the order number (e.g., ORD-2025-0001)

**6.2 Check KDS**
1. Switch to KDS window
2. Wait up to 5 seconds (auto-refresh interval)
3. Order should appear in KDS queue

**What to look for:**
- Order card with correct order number
- Correct table number or order type
- All items listed
- Timer started (showing elapsed time)

✅ **KPI 2:** Order created in POS immediately appears in KDS

**Troubleshooting:**
- Check KDS Console for errors
- Verify auto-refresh is running: `setInterval(fetchOrders, 5000)`
- Manually refresh browser if needed

---

### Step 7: Test KDS Status Updates

**7.1 Update Kitchen Status**
1. In KDS: Click on an order card
2. Change status: Pending → Preparing → Ready → Served
3. Each status change should call API

**Check in DevTools → Network:**
```
PATCH http://localhost:3001/api/orders/<ORDER_ID>/kitchen-status
Body: { "kitchenStatus": "preparing" }
Status: 200 OK
```

**7.2 Verify in Database**
Open database browser (e.g., DB Browser for SQLite):
```
SELECT id, order_number, kitchen_status FROM orders 
WHERE id = '<ORDER_ID>';
```

Status should match what you set in KDS.

✅ **KPI 3:** Kitchen status updates persist in database

---

### Step 8: Test Backoffice → POS Menu Sync

**8.1 Create New Product in Backoffice**
1. Go to Menu Management
2. Click "Add Product"
3. Fill in details:
   - Name: "Test Coffee"
   - Category: Select existing
   - Price: 25000
4. Save product

**Check in DevTools:**
```
POST http://localhost:3001/api/products
Status: 201 Created
Response: { "success": true, "product": {...} }
```

**8.2 Refresh POS Menu**
1. Switch to POS window
2. Click "Refresh Menu" button (if available)
3. Or reload page
4. New product should appear in menu

✅ **KPI 4:** Menu changes in Backoffice sync to POS

---

### Step 9: Test Sold Out Status

**9.1 Mark Product as Sold Out**
In Backoffice:
1. Go to Product list
2. Find a product
3. Change status to "Sold Out"

**Check API call:**
```
PATCH http://localhost:3001/api/products/<PRODUCT_ID>/status
Body: { "status": "soldout" }
Status: 200 OK
```

**9.2 Verify in POS**
1. Refresh POS menu
2. Product should be:
   - Grayed out, OR
   - Marked as "Sold Out", OR
   - Hidden from menu

✅ **KPI 5:** Sold out status immediately reflects in POS

---

### Step 10: Test New Product → Order → KDS Flow

**Complete End-to-End Test:**

1. **Backoffice:** Create new product "Kopi Susu Special" (Rp 30,000)
2. **POS:** Refresh menu, verify product appears
3. **POS:** Create order with new product
4. **KDS:** Wait 5 seconds, verify order appears
5. **KDS:** Update status to "Preparing"
6. **KDS:** Update status to "Ready"
7. **KDS:** Update status to "Served"

**All steps should work without errors!**

✅ **MASTER KPI:** Complete POS → KDS → Backoffice integration working

---

## 🎯 Quick Test Matrix

| Test | System | Action | Expected Result | Status |
|------|--------|--------|----------------|---------|
| 1 | Backend | Start server | Health check passes | ⏳ |
| 2 | Launcher | Login | JWT token received | ⏳ |
| 3 | POS | Load menu | Products displayed | ⏳ |
| 4 | POS | Create order | 201 Created response | ⏳ |
| 5 | KDS | Auto-refresh | Order appears in 5s | ⏳ |
| 6 | KDS | Update status | API call succeeds | ⏳ |
| 7 | Backoffice | Add product | Product saved | ⏳ |
| 8 | POS | Refresh menu | New product shows | ⏳ |
| 9 | Backoffice | Mark sold out | Status updates | ⏳ |
| 10 | POS | Check menu | Product grayed out | ⏳ |

---

## 🐛 Common Issues & Solutions

### Issue 1: "API is not defined"
**Cause:** API client not loaded  
**Solution:** Check browser console, verify api.js is loaded before app.js

### Issue 2: "Failed to fetch"
**Cause:** Server not running or wrong port  
**Solution:** Verify server is on port 3001, check `start-local.ps1`

### Issue 3: "401 Unauthorized"
**Cause:** Missing or invalid JWT token  
**Solution:** Re-login through main launcher

### Issue 4: Orders not appearing in KDS
**Cause:** Auto-refresh not working or wrong outletId  
**Solution:** Check KDS console for errors, verify `fetchOrders()` is called

### Issue 5: Menu not refreshing in POS
**Cause:** Browser cache or no refresh button  
**Solution:** Hard refresh (Ctrl+F5) or add refresh button

---

## 📊 Performance Benchmarks

### Expected Response Times
- Health check: < 10ms
- Menu retrieval: < 100ms
- Order creation: < 200ms
- KDS queue: < 100ms
- Status update: < 50ms

### Auto-Refresh Intervals
- KDS: Every 5 seconds
- POS menu: Manual (button click)
- Dashboard: Every 30 seconds (if implemented)

---

## ✅ Success Criteria

All KPIs must pass:

1. ✅ Backend health check passes
2. ✅ JWT authentication works
3. ✅ POS can create orders
4. ✅ Orders appear in KDS within 5 seconds
5. ✅ Kitchen status updates persist
6. ✅ New products appear in POS
7. ✅ Sold out status syncs
8. ✅ Complete order flow works end-to-end

**If all pass:** System is ready for UI/UX improvements!

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Backend Status:
- Server started: [ ] Yes [ ] No
- Health check: [ ] Pass [ ] Fail
- Database: [ ] Connected [ ] Error

POS Tests:
- Menu loads: [ ] Pass [ ] Fail
- Order creation: [ ] Pass [ ] Fail
- Notes: ___________________

KDS Tests:
- Orders appear: [ ] Pass [ ] Fail
- Status updates: [ ] Pass [ ] Fail
- Auto-refresh: [ ] Pass [ ] Fail
- Notes: ___________________

Integration Tests:
- POS → KDS: [ ] Pass [ ] Fail
- Backoffice → POS: [ ] Pass [ ] Fail
- Sold out sync: [ ] Pass [ ] Fail
- Notes: ___________________

Issues Found:
1. ___________________
2. ___________________
3. ___________________
```

---

**Ready to Test?** Start with Step 1! 🚀
