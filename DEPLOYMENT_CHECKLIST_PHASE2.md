# Deployment Checklist - Phase 2 Architecture Cleanup

**Date:** 2026-06-21  
**Commits:** b67fb73, b641e85, d4a6e5c  
**Branch:** main  
**Status:** 🟡 READY FOR TESTING

---

## Pre-Deployment Verification ✅

- [x] Code committed to git
- [x] Commits pushed to remote (GitHub)
- [x] Syntax validation passed (`node --check api-client.js`)
- [x] Backup created (kds/frontend/js/api.js.backup-phase2)
- [x] Documentation complete
- [x] Rollback plan documented

---

## Manual Testing Checklist

### 🔴 CRITICAL: KDS Operations (HIGHEST PRIORITY)

**Test Environment:** Local / Staging  
**Priority:** P0 - Must pass before production

- [ ] **KDS Page Loads**
  - Navigate to: `http://localhost/kds/` or staging URL
  - Expected: Page loads without console errors
  - Check: No 404 for api-client.js
  - Check: No "API is not defined" errors

- [ ] **Orders Display**
  - Expected: Pending/preparing orders show in queue
  - Check: Order cards render correctly
  - Check: Order details visible (items, table, time)
  - Check: Queue summary updates (Orders/Items/Urgent counts)

- [ ] **Status Updates**
  - Action: Click "Mulai" button (pending → preparing)
  - Expected: Order status changes, card moves/updates
  - Check: Database updated (query orders table)
  - Check: No errors in console

- [ ] **Completion Flow**
  - Action: Click "Siap" button (preparing → ready)
  - Expected: Order marked ready
  - Check: `completed_at` timestamp set in database
  - Check: Notification overlay shows

- [ ] **Realtime Updates**
  - Action: Create order from POS
  - Expected: New order appears in KDS automatically
  - Check: Realtime status indicator shows "connected"
  - Check: Queue updates without refresh

- [ ] **Sounds and Alerts**
  - Action: Click "🔊 Test" button
  - Expected: Alert sound plays
  - Action: Let order sit for 10+ minutes
  - Expected: Visual alert (orange/red) appears

**If ANY of these fail:** STOP and rollback immediately

---

### 🟡 IMPORTANT: Authentication Flows

**Test Environment:** Local / Staging  
**Priority:** P1 - Critical for operations

- [ ] **Admin Login (Main Backoffice)**
  - Navigate to: `http://localhost/` or staging
  - Enter: Username + Password
  - Expected: Login successful, redirects to dashboard
  - Check: localStorage has `nashty_session` key
  - Check: Session persists on page reload

- [ ] **PIN Login (Cashier POS)**
  - Navigate to: `http://localhost/pos/`
  - Enter: PIN (e.g., 1234)
  - Expected: Login successful, POS opens
  - Check: Session stored correctly
  - Check: Can create orders

- [ ] **Kitchen Login (KDS)**
  - Navigate to: `http://localhost/kds/`
  - Enter: PIN (kitchen staff)
  - Expected: Login successful, KDS displays
  - Check: localStorage has `nashty_kds_session` key
  - Check: Queue loads

- [ ] **Session Persistence**
  - Action: Login → Close browser → Reopen
  - Expected: Still logged in (no re-login required)
  - Check: Session data intact

- [ ] **Logout Cleanup**
  - Action: Click logout in any app
  - Expected: Redirects to login
  - Check: All localStorage keys cleared:
    - `nashty_session`
    - `nashty_kds_session`
    - `nashty_main_session`
    - `nashty_token`
    - `nashty_user`
    - `nashty_outlet`

**If login fails:** Check session.load() backward compatibility

---

### 🟢 GOOD TO HAVE: Full System Regression

**Test Environment:** Local / Staging  
**Priority:** P2 - Nice to have before prod

#### Backoffice Pages

- [ ] **Dashboard**
  - Navigate: Backoffice → Dashboard
  - Expected: KPIs load (revenue, orders, products)
  - Check: No console errors

- [ ] **Activity Logs**
  - Navigate: Backoffice → Activity Logs
  - Expected: Log entries display
  - Action: Click "Export CSV"
  - Expected: CSV file downloads
  - Check: No "exportActivityLogs is not defined" error

- [ ] **Settings**
  - Navigate: Backoffice → Settings
  - Test: Update brand name → Save
  - Expected: Saved successfully
  - Test: Upload QRIS image
  - Expected: Image uploaded to backend
  - Action: Clear browser cache → Reload
  - Expected: QRIS still displays (from backend)

- [ ] **Products / Menu**
  - Navigate: Backoffice → Products
  - Expected: Product list loads
  - Test: Create/edit product
  - Expected: Works correctly

#### POS Operations

- [ ] **Order Creation**
  - Navigate: POS frontend
  - Action: Add products to cart
  - Action: Process payment
  - Expected: Order created successfully
  - Check: Order appears in orders table
  - Check: Order appears in KDS queue

- [ ] **Payment Processing**
  - Test: Cash payment
  - Test: QRIS payment (if configured)
  - Expected: Order status changes to 'paid'
  - Check: Transaction recorded

#### Reports & Analytics

- [ ] **KDS Analytics**
  - Navigate: Backoffice → KDS → Analytics
  - Expected: Prep time metrics display
  - Check: Prep times NOT showing 0:00 or NULL
  - Check: Completed orders count accurate

---

## Database Validation

### Verify Completion Timestamps

```sql
-- Check recent completed orders have timestamps
SELECT 
  id, 
  order_number,
  kitchen_status,
  created_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 as prep_minutes
FROM orders
WHERE kitchen_status IN ('ready', 'served', 'completed')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** All completed orders have `completed_at` NOT NULL

---

## Performance Checks

- [ ] **Page Load Times**
  - KDS loads in < 2 seconds
  - Backoffice loads in < 3 seconds
  - POS loads in < 2 seconds

- [ ] **API Response Times**
  - getKDSQueue: < 500ms
  - Order status update: < 300ms
  - Settings fetch: < 200ms

- [ ] **Console Errors**
  - No 404 errors for missing files
  - No "undefined" function errors
  - No Supabase connection errors

---

## Rollback Criteria

**Trigger rollback if:**
1. ❌ KDS fails to load or display orders
2. ❌ Status updates don't work
3. ❌ Login flows broken
4. ❌ Production errors spike >10x normal
5. ❌ Any P0 test fails

**Rollback Steps:**
```bash
# Option 1: Restore KDS API backup
cp kds/frontend/js/api.js.backup-phase2 kds/frontend/js/api.js
git add kds/frontend/js/api.js kds/frontend/index.html
git commit -m "rollback(phase2): restore kds api client"
git push origin main

# Option 2: Revert all commits
git revert d4a6e5c b641e85 b67fb73
git push origin main

# Then redeploy to Cloudflare Pages
```

---

## Deployment Steps

### Staging Deployment

1. **Trigger Cloudflare Pages Deploy**
   - Push to main triggers automatic deploy
   - Or manual trigger in Cloudflare dashboard

2. **Wait for Build**
   - Monitor build logs
   - Verify no build errors
   - Check deployment URL

3. **Run Full Test Suite**
   - Complete all tests above
   - Record any issues found

4. **Get Approval**
   - If all tests pass → Proceed to production
   - If any P0/P1 fails → Fix or rollback

### Production Deployment

**Timing:** Deploy during low-traffic window
- Recommended: 2-4 AM WIB (late night)
- Avoid: Lunch (11AM-2PM) and Dinner (6PM-9PM)

**Steps:**

1. **Pre-Deploy Announcement**
   - Notify team of deployment window
   - Have rollback person on standby

2. **Deploy**
   - Merge to production branch (if separate)
   - Or production auto-deploys from main

3. **Immediate Verification (0-15 mins)**
   - [ ] KDS loads and works
   - [ ] Orders flow POS → KDS correctly
   - [ ] No spike in error logs

4. **Short-Term Monitoring (0-4 hours)**
   - [ ] Watch KDS operations closely
   - [ ] Monitor error rate in logs
   - [ ] Check auth flows working
   - [ ] Verify order completion timestamps

5. **Long-Term Monitoring (24 hours)**
   - [ ] Error rate stays normal
   - [ ] No customer complaints
   - [ ] Analytics data looks correct
   - [ ] All features working

---

## Success Criteria

- ✅ All P0 tests pass (KDS operations)
- ✅ All P1 tests pass (auth flows)
- ✅ No increase in error rate
- ✅ No customer impact
- ✅ Team reports no issues
- ✅ Monitoring shows normal metrics for 24h

---

## Post-Deployment Tasks

- [ ] Update deployment log
- [ ] Document any issues found
- [ ] Share learnings with team
- [ ] Plan Phase 3 (Code Organization)
- [ ] Archive this checklist with outcome

---

## Contact / Escalation

**If issues arise:**
1. Check rollback criteria (above)
2. Execute rollback if needed
3. Document issue in GitHub issues
4. Post-mortem analysis if major incident

---

**Checklist Owner:** Architecture Team  
**Last Updated:** 2026-06-21  
**Version:** 1.0
