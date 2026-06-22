# 🧪 COMPREHENSIVE E2E TEST PLAN

**Project:** NASHTY OS - POS Enhancement  
**Date:** June 22, 2026  
**Status:** READY FOR EXECUTION  
**Total Tests:** 30+ test cases

---

## 🎯 TEST OBJECTIVES

### Primary Goals
1. **Verify KDS Sound Notifications Work** ✅
2. **Verify Dashboard/Reports Numbers Update** ✅
3. **Test Complete Order Lifecycle** ✅
4. **Validate System Integration** ✅
5. **Performance & Reliability** ✅

### Critical Issues to Fix
1. ❌ **KDS Sound tidak bunyi** → Fix AudioContext initialization
2. ❌ **Dashboard angka tidak bertambah** → Verify API integration
3. ❌ **Reports tidak update** → Check data sync

---

## 🔧 PREREQUISITES

### Environment Setup
```bash
# 1. Install Playwright
npm install -D @playwright/test

# 2. Install browsers
npx playwright install

# 3. Start local servers
# Terminal 1: Backoffice
cd backoffice && npm run dev

# Terminal 2: POS
cd pos && npm run dev

# Terminal 3: KDS
cd kds && npm run dev

# Alternative: Use existing server
```

### Configuration
```typescript
// Update in comprehensive-system-test.spec.ts
const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'your-actual-anon-key'; // TODO: Replace

const BACKOFFICE_URL = 'http://localhost/backoffice';
const POS_URL = 'http://localhost/pos';
const KDS_URL = 'http://localhost/kds';
```

### Test Data
- **Tenant ID:** `b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab`
- **Outlet ID:** `71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e`
- **Superadmin:** superadmin / nashty@2024
- **Staff PIN:** 1234 (Citra Kusuma)

---

## 📋 TEST SUITES

### Suite 1: Authentication Tests (4 tests)
**Purpose:** Verify login/logout functionality

| # | Test Case | Priority | Expected Result |
|---|-----------|----------|-----------------|
| 1.1 | Login to Backoffice | HIGH | Success, dashboard loads |
| 1.2 | Login to POS with PIN | HIGH | Success, POS interface loads |
| 1.3 | Reject invalid backoffice credentials | MEDIUM | Error message shown |
| 1.4 | Reject invalid POS PIN | MEDIUM | Error message shown |

**Commands:**
```bash
npx playwright test --grep "Authentication Tests"
```

### Suite 2: Dashboard & Reports Tests (4 tests)
**Purpose:** Verify dashboard metrics and reports update correctly

| # | Test Case | Priority | Expected Result | Fix Issue |
|---|-----------|----------|-----------------|-----------|
| 2.1 | Display dashboard with metrics | HIGH | 4 KPI cards + 3 charts visible | ✅ |
| 2.2 | Update metrics after new order | **CRITICAL** | Order count increases | ❌ FIX THIS |
| 2.3 | Display sales report with data | HIGH | Table with rows visible | ❌ FIX THIS |
| 2.4 | Filter dashboard by date range | MEDIUM | Metrics update on filter | ✅ |

**Known Issues:**
- ❌ Dashboard tidak update real-time
- ❌ Perlu refresh manual
- ❌ Cache issue di API?

**Fix Strategy:**
1. Check `/dashboard/kpi` API endpoint
2. Verify database triggers
3. Check caching mechanism
4. Add real-time subscription (optional)

**Commands:**
```bash
npx playwright test --grep "Dashboard & Reports"
```

### Suite 3: KDS System Tests (5 tests)
**Purpose:** Verify KDS functionality including sound notifications

| # | Test Case | Priority | Expected Result | Fix Issue |
|---|-----------|----------|-----------------|-----------|
| 3.1 | Enable KDS sound notifications | **CRITICAL** | Sound checkbox checked | ✅ |
| 3.2 | Display KDS queue with orders | HIGH | Order cards visible | ✅ |
| 3.3 | Play sound when new order arrives | **CRITICAL** | Sound plays | ❌ FIX THIS |
| 3.4 | Update order status in workflow | HIGH | Status changes | ✅ |
| 3.5 | Display KDS analytics | MEDIUM | KPIs and charts visible | ✅ |

**Known Issues:**
- ❌ **Sound tidak bunyi** → AudioContext not initialized
- ❌ Perlu user interaction untuk enable audio
- ❌ Browser autoplay policy

**Fix Strategy:**
1. Initialize AudioContext on user click
2. Add "Enable Sound" button dengan clear UX
3. Check browser permissions
4. Test di Chrome, Firefox, Safari

**Commands:**
```bash
npx playwright test --grep "KDS System"
```

### Suite 4: End-to-End Order Flow (2 tests)
**Purpose:** Test complete order lifecycle

| # | Test Case | Priority | Description |
|---|-----------|----------|-------------|
| 4.1 | Complete order: POS → KDS → Dashboard | **CRITICAL** | Full integration test |
| 4.2 | Offline order sync workflow | HIGH | Offline queue works |

**Test Flow:**
```
1. Capture initial dashboard metrics
2. Create order in POS
3. Verify order appears in KDS
4. Complete order in KDS
5. Verify dashboard metrics updated
```

**Commands:**
```bash
npx playwright test --grep "End-to-End Order Flow"
```

### Suite 5: System Integration Tests (3 tests)
**Purpose:** Verify system components work together

| # | Test Case | Priority | Description |
|---|-----------|----------|-------------|
| 5.1 | Sync data between POS and Backoffice | HIGH | Product added in BO appears in POS |
| 5.2 | Maintain session across reloads | MEDIUM | Session persists |
| 5.3 | Handle concurrent orders | HIGH | Multiple POS terminals |

**Commands:**
```bash
npx playwright test --grep "System Integration"
```

### Suite 6: Performance Tests (3 tests)
**Purpose:** Verify system performance

| # | Test Case | Priority | Target | Description |
|---|-----------|----------|--------|-------------|
| 6.1 | Dashboard load time | MEDIUM | <3s | Dashboard loads quickly |
| 6.2 | POS handle rapid additions | MEDIUM | 10 items | No lag |
| 6.3 | KDS handle 50+ orders | LOW | 50 orders | No crash |

**Commands:**
```bash
npx playwright test --grep "Performance"
```

---

## 🐛 CRITICAL BUGS TO FIX

### Bug 1: KDS Sound Tidak Bunyi ❌

**Symptoms:**
- Sound notification tidak terdengar saat order baru
- `playSound()` function ada tapi tidak execute
- No errors in console

**Root Cause:**
- **AudioContext** requires user interaction to initialize
- Browser autoplay policy blocks sound
- `CFG.soundEnabled` mungkin false by default

**Fix:**
```javascript
// kds/frontend/js/utils.js
// BEFORE:
let audioCtx = null;
function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
}

// AFTER:
let audioCtx = null;
let audioInitialized = false;

// Initialize on user click
document.addEventListener('click', initAudioOnce, { once: true });

function initAudioOnce() {
  if (!audioInitialized) {
    try {
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      audioCtx.resume(); // Resume if suspended
      audioInitialized = true;
      console.log('✅ AudioContext initialized');
      
      // Play silent sound to unlock audio
      playTone(0, 0, 0);
    } catch(e) {
      console.error('Failed to init AudioContext:', e);
    }
  }
}

function ensureAudio(){
  if(!audioCtx) {
    // Try to create if not initialized yet
    try {
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      audioCtx.resume();
    } catch(e) {
      console.error('AudioContext not available:', e);
    }
  }
  
  // Check if suspended (common in mobile browsers)
  if(audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type){
  if(!CFG.soundEnabled) {
    console.log('Sound disabled in config');
    return;
  }
  
  if(!audioInitialized) {
    console.warn('AudioContext not initialized. Click anywhere to enable sound.');
    return;
  }
  
  console.log('Playing sound:', type);
  
  if(type==='new')    { 
    playTone(880, 0.18, 0.25); 
    console.log('✅ New order sound played');
  }
  if(type==='urgent') { 
    playTone(660, 0.12, 0.3, 0); 
    playTone(880, 0.12, 0.3, 0.18); 
    console.log('✅ Urgent sound played');
  }
  if(type==='escalation') {
    playTone(1047, 0.15, 0.35, 0);
    playTone(784, 0.15, 0.35, 0.2);
    playTone(1047, 0.15, 0.35, 0.4);
    console.log('✅ Escalation sound played');
  }
}
```

**UI Enhancement (Add to kds/frontend/index.html):**
```html
<!-- Add after body tag -->
<div id="audio-unlock" style="
  position: fixed;
  top: 20px;
  right: 20px;
  background: #FF5A1F;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  cursor: pointer;
  font-weight: 700;
  z-index: 9999;
  display: none;
" onclick="unlockAudio()">
  🔊 Enable Sound Notifications
</div>

<script>
function unlockAudio() {
  // This will trigger the click listener that initializes audio
  document.getElementById('audio-unlock').style.display = 'none';
  
  // Force init
  if (window.initAudioOnce) window.initAudioOnce();
  
  // Test sound
  setTimeout(() => {
    if (window.playSound) window.playSound('new');
  }, 100);
}

// Show button if audio not initialized after 3 seconds
setTimeout(() => {
  if (!window.audioInitialized) {
    document.getElementById('audio-unlock').style.display = 'block';
  }
}, 3000);
</script>
```

**Testing:**
```javascript
// Manual test in browser console
playSound('new');     // Should hear short beep
playSound('urgent');  // Should hear two beeps
playSound('escalation'); // Should hear three beeps
```

### Bug 2: Dashboard Angka Tidak Bertambah ❌

**Symptoms:**
- Order dibuat di POS tapi dashboard tidak update
- Perlu refresh manual untuk lihat perubahan
- KPI cards tidak real-time

**Root Cause:**
- API caching terlalu aggressive
- Dashboard tidak subscribe ke real-time updates
- Backend query mungkin salah filter (timezone, outlet)

**Debugging Steps:**
```bash
# 1. Check if order created successfully
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mzucfndifneytbesirkx.supabase.co/rest/v1/orders?select=*&created_at=gte.2026-06-22

# 2. Check dashboard API response
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://mzucfndifneytbesirkx.supabase.co/functions/v1/dashboard/kpi?tenantId=XXX&outletId=XXX"

# 3. Check raw data in database
psql> SELECT count(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE;
```

**Fix Option 1: Add Real-time Subscription**
```javascript
// backoffice/frontend/js/pages/dashboard.js
let subscription = null;

async function subscribeToDashboardUpdates() {
  const supabase = window.API.supabase;
  
  // Subscribe to orders table
  subscription = supabase
    .channel('dashboard-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Order change detected:', payload);
        // Refresh dashboard
        setTimeout(() => nav('dashboard'), 1000);
      }
    )
    .subscribe();
}

// Call on dashboard load
PAGES.dashboard = async () => {
  // ... existing code ...
  
  // Subscribe to updates
  subscribeToDashboardUpdates();
  
  return html;
};

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
  if (subscription) subscription.unsubscribe();
});
```

**Fix Option 2: Polling (Simpler)**
```javascript
// backoffice/frontend/js/pages/dashboard.js
let refreshInterval = null;

PAGES.dashboard = async () => {
  // ... existing code ...
  
  // Auto-refresh every 30 seconds
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing dashboard...');
    nav('dashboard');
  }, 30000); // 30 seconds
  
  return html;
};

// Cleanup
window.addEventListener('beforeunload', () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
```

**Fix Option 3: Disable Caching**
```javascript
// Check API endpoint caching headers
// supabase/functions/dashboard-api/index.ts

export default async function handler(req: Request) {
  // ... existing code ...
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // DISABLE CACHE
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
```

### Bug 3: Reports Tidak Update ❌

**Similar to Bug 2**, same fixes apply:
1. Check API caching
2. Add real-time updates
3. Implement auto-refresh
4. Verify query filters (timezone, date range)

---

## 🚀 EXECUTION PLAN

### Phase 1: Fix Critical Bugs (Priority 1) - 2 hours
```bash
# Step 1: Fix KDS Sound
1. Update kds/frontend/js/utils.js with AudioContext fix
2. Add "Enable Sound" button to KDS UI
3. Test manually in browser
4. Verify sound plays on order creation

# Step 2: Fix Dashboard Updates
1. Add real-time subscription OR polling
2. Disable aggressive caching
3. Test with new order creation
4. Verify metrics update automatically

# Step 3: Git commit
git add -A
git commit -m "fix: KDS sound notifications and dashboard real-time updates"
git push origin main
```

### Phase 2: Run E2E Tests (Priority 2) - 1 hour
```bash
# Run all tests
npx playwright test tests/e2e/comprehensive-system-test.spec.ts

# Run specific suite
npx playwright test --grep "KDS System"
npx playwright test --grep "Dashboard"

# Run with UI (debug mode)
npx playwright test --ui

# Generate report
npx playwright show-report
```

### Phase 3: Fix Failing Tests (Priority 3) - 2 hours
```bash
# If tests fail:
1. Review error messages
2. Check screenshots (test-results folder)
3. Fix issues
4. Re-run tests
5. Repeat until all pass
```

### Phase 4: Documentation (Priority 4) - 30 minutes
```bash
# Document test results
1. Update PROJECT_COMPLETION_STATUS.md
2. Create TEST_EXECUTION_REPORT.md
3. Note any remaining issues
4. Plan next iteration
```

---

## 📊 SUCCESS CRITERIA

### Must Pass (Critical)
- [  ] All authentication tests pass ✅
- [  ] KDS sound plays on new order ✅
- [  ] Dashboard metrics update after order ✅
- [  ] Complete order flow works end-to-end ✅

### Should Pass (High Priority)
- [  ] Reports display data correctly
- [  ] Offline sync works
- [  ] Concurrent orders handled
- [  ] Performance targets met (<3s dashboard load)

### Nice to Have (Medium Priority)
- [  ] Date filter works
- [  ] Session persists
- [  ] 50+ orders render without lag

---

## 🔍 MONITORING & DEBUGGING

### During Test Execution
```bash
# Watch console logs
tail -f test-results/*/stdio

# Check screenshots on failure
ls test-results/*/*.png

# Review video recordings
ls test-results/*/*.webm
```

### Common Issues & Solutions

**Issue:** Tests timeout waiting for elements
**Solution:** Increase timeout or check selectors
```typescript
await page.waitForSelector('.element', { timeout: 30000 });
```

**Issue:** Authentication fails
**Solution:** Check credentials and network
```typescript
console.log('Login attempt:', username, password);
```

**Issue:** Sound doesn't play in headless mode
**Solution:** Run tests in headed mode
```bash
npx playwright test --headed
```

---

## 📝 TEST EXECUTION CHECKLIST

### Pre-Execution
- [  ] All servers running (backoffice, pos, kds)
- [  ] Database seeded with test data
- [  ] Playwright installed and updated
- [  ] Configuration updated with correct URLs
- [  ] Test credentials verified

### During Execution
- [  ] Monitor console for errors
- [  ] Watch test progress
- [  ] Note any failures
- [  ] Check performance metrics

### Post-Execution
- [  ] Review test report
- [  ] Check screenshots/videos
- [  ] Document failures
- [  ] Create bug tickets
- [  ] Update status document

---

## 📞 SUPPORT

**Questions:**
- Technical issues: Check Playwright docs
- Test failures: Review error messages and screenshots
- Bug fixes: Refer to fix strategies above
- Performance: Check browser DevTools

**Resources:**
- Playwright Docs: https://playwright.dev
- Test Files: `tests/e2e/comprehensive-system-test.spec.ts`
- Fix Guide: This document (section "CRITICAL BUGS TO FIX")

---

**Status:** ✅ TEST PLAN READY  
**Next Action:** Fix critical bugs → Run tests → Document results  
**ETA:** 5 hours (2h fixes + 1h testing + 2h iteration)

**Last Updated:** June 22, 2026  
**Version:** 1.0
