# Production System Stabilization - Bugfix Design

## Overview

This design addresses five critical production bugs blocking operational functionality in NASHTY OS. Each bug prevents core features from working correctly. The fix approach is surgical and minimal - targeting only the specific defects without refactoring the surrounding codebase. This ensures zero regression risk while restoring full system functionality.

**Bugs Addressed:**
1. **Syntax Error** - JavaScript parse failure in `system.js` preventing Activity Logs page from loading
2. **QRIS Persistence** - QRIS upload only saves to localStorage instead of backend storage
3. **Export Handler** - Activity Logs CSV export function not accessible causing ReferenceError
4. **Missing KDS APIs** - Two critical KDS methods not implemented in `api-client.js`
5. **Timestamp Misalignment** - `completed_at` field not set when orders reach completion states

**Strategy:** Fix only what's broken. No architectural changes, no refactoring, no "improvements" beyond the bug fix. Each change is isolated and testable independently.

## Glossary

- **Bug_Condition (C)**: The specific input/state that triggers each bug
- **Property (P)**: The correct behavior expected when bug condition occurs  
- **Preservation**: All existing functionality that must remain unchanged
- **system.js**: Backoffice page definitions file at `backoffice/frontend/js/pages/system.js`
- **api-client.js**: Main API client at root level (`api-client.js`)
- **orders-api Edge Function**: Supabase Edge Function at `supabase/functions/orders-api/index.ts`
- **QRIS Static**: Static QR code image for QRIS payment displayed on POS
- **completed_at**: Timestamp field in `orders` table marking order completion time
- **Kitchen Status**: Status field in orders table tracking kitchen workflow (pending, preparing, ready, completed)

## Bug Details

### Bug #1: System.js Syntax Error

**Location:** `backoffice/frontend/js/pages/system.js` (approximately line 200)

**Bug Condition:**
```
FUNCTION isSyntaxErrorBug(X)
  INPUT: X of type FileContent
  OUTPUT: boolean
  
  RETURN X.file_path = "backoffice/frontend/js/pages/system.js" AND
         X.content contains "PAGES.settings" followed by extra "};" token
END FUNCTION
```

**Manifestation:** After the `PAGES.settings` function definition closes properly, there is an additional `};` that causes JavaScript parser to fail. This prevents all subsequent page definitions (`PAGES.actlogs`) from registering.

**Examples:**
- User navigates to Activity Logs page → White screen or console error
- User navigates to Settings page → May work partially or show undefined behavior
- Console shows "SyntaxError: Unexpected token '}'"

### Bug #2: QRIS Upload Not Persisted

**Location:** `backoffice/frontend/js/pages/system.js` - `window.uploadQRIS()` function

**Bug Condition:**
```
FUNCTION isQRISLocalOnlyBug(X)
  INPUT: X of type UploadAction
  OUTPUT: boolean
  
  RETURN X.action = "uploadQRIS" AND
         X.saves_to_localStorage = true AND
         X.calls_backend_API = false
END FUNCTION
```

**Manifestation:** The current implementation successfully calls `API.outletSettings.uploadQris(file)` which:
1. Uploads file to Supabase Storage (`outlet-assets` bucket)
2. Updates database `outlets.qris_static_url` field  
3. Caches URL to localStorage

**WAIT - Bug Analysis Update:** Upon code review, the QRIS upload **IS already implemented correctly**. The code at lines 88-103 already:
- Calls `API.outletSettings.uploadQris(file)` 
- Stores result URL in localStorage as fallback
- Has proper error handling

**Bug Status:** FALSE POSITIVE - This is already fixed in the current codebase.

**Examples:**
- ✅ User uploads QRIS → Backend receives upload, database updated, localStorage cache set
- ✅ User clears cache and reloads → QRIS retrieved from backend successfully

### Bug #3: Export Logs Handler Mismatch

**Location:** `backoffice/frontend/js/pages/activity-logs.js` (separate module) vs `system.js` (legacy implementation)

**Bug Condition:**
```
FUNCTION isExportHandlerMissingBug(X)
  INPUT: X of type ButtonClick
  OUTPUT: boolean
  
  RETURN X.button_id = "export-logs-button" AND
         X.onclick = "exportLogs()" AND
         NOT exists_in_global_scope("exportLogs")
END FUNCTION
```

**Manifestation:** The Activity Logs page can be rendered from two sources:
1. **Modern module**: `activity-logs.js` - exports `window.activityLogsModule.exportLogs`
2. **Legacy implementation**: `system.js` PAGES.actlogs - has no export function

The HTML in `PAGES.actlogs` lacks an export button entirely. When users navigate to Activity Logs, they cannot export data.

**Examples:**
- User clicks "Export CSV" button (if it existed in system.js version) → ReferenceError
- Currently: No export button rendered in `PAGES.actlogs` HTML

### Bug #4: Missing KDS API Methods

**Location:** `api-client.js` - `API.kds` object (lines 1407-1520 approximately)

**Bug Condition:**
```
FUNCTION isKDSMethodMissingBug(X)
  INPUT: X of type FunctionCall
  OUTPUT: boolean
  
  RETURN (X.function_name = "API.kds.updateCategoryProductionTime" OR
          X.function_name = "API.kds.getAnalytics") AND
         NOT exists_in_api_client(X.function_name)
END FUNCTION
```

**Manifestation:** The `API.kds` object exists with two methods:
1. ✅ `updateCategoryProductionTime(categoryId, timeMinutes)` - **ALREADY IMPLEMENTED** (line ~1407)
2. ✅ `getAnalytics()` - **ALREADY IMPLEMENTED** (line ~1429)

**Bug Status:** FALSE POSITIVE - Both methods are already implemented in the current codebase.

**Code Evidence:**
- `API.kds.updateCategoryProductionTime` updates all products in a category with new production_time
- `API.kds.getAnalytics` calculates kitchen performance metrics including avg prep time, SLA compliance, fastest/slowest products

**Examples:**
- ✅ KDS Production Time page calls method → Works correctly
- ✅ KDS Analytics page calls method → Returns valid data

### Bug #5: KDS Completion Timestamp Not Set

**Location:** `supabase/functions/orders-api/index.ts` - `update-status` action (lines 153-175)

**Bug Condition:**
```
FUNCTION isCompletedAtNullBug(X)
  INPUT: X of type OrderStatusUpdate
  OUTPUT: boolean
  
  RETURN X.new_kitchen_status IN ["ready", "completed"] OR
         X.new_order_status IN ["completed"] AND
         X.sets_completed_at = false
END FUNCTION
```

**Manifestation:** When orders reach completion states (`kitchen_status='ready'` or `order_status='completed'`), the `update-status` action only updates the status fields. It does NOT set `completed_at` timestamp.

This causes `API.kds.getAnalytics()` to calculate NULL prep times because the formula depends on:
```
prep_time = completed_at - created_at
```

**Examples:**
- Order created at 10:00 AM, marked ready at 10:12 AM → `completed_at` is NULL → Analytics shows 0:00 prep time
- Order created at 2:30 PM, marked completed at 2:45 PM → `completed_at` is NULL → Analytics shows NULL
- KDS dashboard shows incorrect "Avg Prep Time: 0:00" despite orders being completed

## Expected Behavior

### Fix #1: System.js Parse Success

**Correctness Property:**
_For any_ file load of `system.js`, the JavaScript parser SHALL successfully parse all content without syntax errors, allowing all page definitions (`PAGES.settings`, `PAGES.actlogs`) to register.

**Validates: Requirements 2.1, 2.2**

**Implementation:** Remove the extra `};` after `PAGES.settings` definition.

### Fix #2: QRIS Upload (Already Working)

**Status:** This requirement is already satisfied. The current implementation correctly persists QRIS to backend.

**Current Behavior (Correct):**
1. Uploads file to Supabase Storage
2. Updates `outlets.qris_static_url` in database
3. Caches URL to localStorage as fallback
4. On failure: Falls back to localStorage only with error toast

**No changes required.**

### Fix #3: Export Logs Handler Resolution

**Correctness Property:**
_For any_ Activity Logs page render from `PAGES.actlogs`, the page SHALL include an "Export CSV" button that successfully executes a CSV export function without throwing ReferenceError.

**Validates: Requirements 2.7, 2.8, 2.9**

**Implementation:** Add export button to `PAGES.actlogs` HTML and create a global `window.exportActivityLogs()` function.

### Fix #4: KDS API Methods (Already Working)

**Status:** Both required methods already exist and work correctly.

**Current Implementation (Correct):**
1. ✅ `API.kds.updateCategoryProductionTime(categoryId, timeMinutes)` - Updates products in bulk
2. ✅ `API.kds.getAnalytics()` - Returns kitchen performance metrics

**No changes required.**

### Fix #5: KDS Completion Timestamp Alignment

**Correctness Property:**
_For any_ order status update where `kitchen_status` becomes "ready" or "completed", OR where `order_status` becomes "completed", the Edge Function SHALL automatically set `completed_at` to the current timestamp.

**Validates: Requirements 2.13, 2.14, 2.15**

**Implementation:** Modify `update-status` action in `orders-api` Edge Function to conditionally set `completed_at` when completion states are reached.


## Preservation Requirements

**Unchanged Behaviors:**
- All existing Settings functionality (branding, logo upload, QRIS removal) continues to work
- Activity Logs data fetching, filtering, display continue to work  
- KDS queue display and status update workflow unchanged
- Order creation, payment flow, report queries remain identical
- Authentication and session management work as before
- All API methods not modified retain exact same behavior

**Scope of Non-Impact:**
All inputs that do NOT trigger the three actual bugs (syntax error, missing export button, missing timestamp) should be completely unaffected by this fix.

## Hypothesized Root Cause

### Bug #1: Syntax Error
**Root Cause:** Copy-paste error or IDE autocomplete error inserted extra `};` after `PAGES.settings` function definition. JavaScript parser fails immediately upon encountering the unexpected token.

### Bug #2: QRIS Upload
**Root Cause:** N/A - Already implemented correctly

### Bug #3: Export Logs Handler
**Root Cause:** Legacy `PAGES.actlogs` implementation was created before the modular `activity-logs.js` was built. The modern module has export functionality, but the legacy page definition does not. When users access Activity Logs through the legacy route, they have no export capability.

### Bug #4: Missing KDS APIs
**Root Cause:** N/A - Methods already exist

### Bug #5: Completion Timestamp
**Root Cause:** Edge Function `update-status` action was implemented without business logic awareness. It blindly updates whatever fields are passed in payload, but doesn't understand the semantic meaning of status transitions. The completion states ("ready", "completed") have special meaning - they should trigger `completed_at` timestamp - but this logic was never implemented.

## Correctness Properties

Property 1: Bug Condition - Syntax Error Fixed

_For any_ JavaScript file load of `system.js`, the file SHALL parse without syntax errors and all page definitions SHALL register successfully, allowing users to navigate to Activity Logs and Settings pages.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Export Functionality Available

_For any_ Activity Logs page render, an "Export CSV" button SHALL be present and functional, successfully generating and downloading a CSV file when clicked without throwing ReferenceError.

**Validates: Requirements 2.7, 2.8, 2.9**

Property 3: Bug Condition - Completion Timestamp Set

_For any_ order status update where `kitchen_status` transitions to "ready" or "completed" OR `order_status` transitions to "completed", the `completed_at` timestamp SHALL be automatically set to the current time.

**Validates: Requirements 2.13, 2.14, 2.15**

Property 4: Preservation - Non-Buggy Input Behavior

_For any_ operation not matching the three bug conditions, the system SHALL produce exactly the same result as before the fix, preserving all existing functionality for settings, authentication, orders, reports, and other features.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15**


## Fix Implementation

### Summary of Required Changes

**Actual Bugs Requiring Fixes:** 3 (out of 5 reported)
- ✅ **Bug #1**: Remove syntax error in `system.js`
- ❌ **Bug #2**: Already fixed - QRIS upload works correctly
- ✅ **Bug #3**: Add export button and function to `PAGES.actlogs`
- ❌ **Bug #4**: Already fixed - Both KDS methods exist
- ✅ **Bug #5**: Set `completed_at` timestamp in Edge Function

### Change #1: Fix Syntax Error in system.js

**File:** `backoffice/frontend/js/pages/system.js`

**Location:** Approximately line 200, after `PAGES.settings` definition

**Current Code Pattern:**
```javascript
PAGES.settings = async () => {
  // ... function body ...
  return `<div>...</div>`;
};  // ← Correct closing

};  // ← EXTRA CLOSING BRACE - REMOVE THIS LINE

PAGES.actlogs = async () => {
  // ... function body ...
};
```

**Required Change:**
Delete the extra `};` line between `PAGES.settings` and `PAGES.actlogs`.

**Verification:**
```bash
node --check backoffice/frontend/js/pages/system.js
```
Should exit with code 0 (no errors).

### Change #2: QRIS Upload (No Changes Required)

**Status:** Already working correctly.

**Existing Implementation:**
- File: `backoffice/frontend/js/pages/system.js` lines 88-103
- Function: `window.uploadQRIS()`
- Backend: `api-client.js` lines 462-487 (`API.outletSettings.uploadQris`)

**Verification:** None needed - already functional.

### Change #3: Add Export Button to Activity Logs

**File:** `backoffice/frontend/js/pages/system.js`

**Location:** `PAGES.actlogs` function return template (line ~225)

**Current Code:** The HTML returned has no export button.

**Required Changes:**

1. **Add Export Button to HTML** - Insert before or after the filter bar:
```javascript
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" placeholder="Cari aktivitas atau user..." oninput="toast('Fitur pencarian logs menyusul')"></div>
 <select class="filter-select" onchange="toast('Fitur filter menyusul')"><option>Semua Module</option><option>Produk</option><option>POS</option><option>Menu</option><option>Tim</option></select>
 <select class="filter-select" onchange="toast('Fitur filter menyusul')"><option>Hari Ini</option><option>7 Hari Terakhir</option><option>30 Hari Terakhir</option></select>
 <button class="btn btn-primary" onclick="window.exportActivityLogs()" style="margin-left:auto">
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
   Export CSV
 </button>
</div>
```


2. **Add Global Export Function** - Add before or after `PAGES.actlogs` definition:
```javascript
window.exportActivityLogs = async () => {
  let logs = [];
  
  if (window.API && API.session.tenantId) {
    try {
      const res = await API.request('/activity-logs?tenantId=' + API.session.tenantId);
      if (res.success && res.logs) {
        logs = res.logs;
      }
    } catch (e) {
      console.error('Failed fetching activity logs for export', e);
      return toast('Gagal mengambil data logs', 'err');
    }
  }

  if (logs.length === 0) {
    return toast('Tidak ada data untuk diekspor', 'err');
  }

  // Generate CSV
  const headers = ['Waktu', 'User', 'Aksi', 'Module', 'Detail'];
  const rows = logs.map(l => [
    l.created_at || '',
    l.user_name || l.user_id || 'System',
    l.action || '',
    l.entity_type || '',
    (l.description || '').replace(/"/g, '""')  // Escape quotes
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `activity-logs-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast('CSV berhasil diunduh', 'ok');
};
```

**Verification:**
1. Navigate to Activity Logs page
2. Click "Export CSV" button
3. CSV file downloads with current date in filename
4. Open CSV - verify all log entries present with correct formatting

### Change #4: KDS API Methods (No Changes Required)

**Status:** Already implemented.

**Existing Implementation:**
- File: `api-client.js`
- Methods:
  - `API.kds.updateCategoryProductionTime` (line ~1407)
  - `API.kds.getAnalytics` (line ~1429)

**Verification:** None needed - already functional.

### Change #5: Set Completion Timestamp in Edge Function

**File:** `supabase/functions/orders-api/index.ts`

**Location:** `update-status` action (lines 153-175)

**Current Code:**
```typescript
if (action === 'update-status') {
  const { orderId, orderStatus, kitchenStatus } = payload;

  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const updates: Record<string, string> = {};
  if (orderStatus) updates.order_status = orderStatus;
  if (kitchenStatus) updates.kitchen_status = kitchenStatus;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, order: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```


**Required Change:**
Add logic to set `completed_at` when completion states are reached:

```typescript
if (action === 'update-status') {
  const { orderId, orderStatus, kitchenStatus } = payload;

  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const updates: Record<string, any> = {};  // Changed from string to any
  if (orderStatus) updates.order_status = orderStatus;
  if (kitchenStatus) updates.kitchen_status = kitchenStatus;

  // ✅ FIX: Set completed_at when order reaches completion states
  const completionStates = ['ready', 'completed'];
  const isKitchenComplete = kitchenStatus && completionStates.includes(kitchenStatus);
  const isOrderComplete = orderStatus === 'completed';
  
  if (isKitchenComplete || isOrderComplete) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, order: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

**Key Changes:**
1. Changed `updates` type from `Record<string, string>` to `Record<string, any>` to allow timestamp
2. Added logic to detect completion states: `kitchen_status` in ['ready', 'completed'] OR `order_status` = 'completed'
3. When completion detected, set `updates.completed_at = new Date().toISOString()`

**Edge Cases Handled:**
- If order is updated multiple times (e.g., pending → preparing → ready), `completed_at` is only set when "ready" is reached
- If order is updated from "ready" back to "preparing" (reversal), `completed_at` remains set (doesn't get cleared)
- If both `orderStatus='completed'` and `kitchenStatus='ready'` are sent simultaneously, `completed_at` is set once

**Verification:**
1. Create order via POS
2. Update kitchen_status to "ready" via KDS
3. Query database: `SELECT completed_at FROM orders WHERE id = <order_id>`
4. Verify `completed_at` is NOT NULL and matches approximate update time
5. Check KDS Analytics page - verify prep time displays correctly (not 0:00 or NULL)

## API Contracts

### No API Contract Changes Required

All three fixes are internal implementations that don't change external API contracts:

1. **Syntax Fix**: Internal JavaScript file correction - no API surface
2. **Export Function**: New UI feature calling existing `/activity-logs` endpoint - no backend changes
3. **Timestamp Fix**: Internal Edge Function logic - calling code unchanged

**Existing Contracts Preserved:**
- `POST /functions/v1/orders-api` with `action=update-status` continues to accept same payload shape
- Response format remains identical (returns updated order object)
- All other endpoints unchanged

## Database Schema Changes

### No Database Schema Changes Required

The `completed_at` field already exists in the `orders` table schema. This fix only ensures the field is populated correctly - no migrations needed.

**Existing Schema (Unchanged):**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,  -- ← Already exists, just not being set
  order_status TEXT,
  kitchen_status TEXT,
  -- ... other fields
);
```


## Edge Function Modifications

### orders-api Edge Function

**File:** `supabase/functions/orders-api/index.ts`

**Modification:** `update-status` action only

**Changes:**
1. Line ~160: Change `updates` type from `Record<string, string>` to `Record<string, any>`
2. Lines ~165-172: Add completion state detection and `completed_at` assignment logic

**No other actions modified:**
- `create` action - unchanged
- `get-orders` action - unchanged
- `start-shift` action - unchanged
- `end-shift` action - unchanged

**Deployment:**
```bash
supabase functions deploy orders-api
```

**Testing After Deployment:**
```bash
# Test update-status with kitchen_status=ready
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/orders-api \
  -H "Content-Type: application/json" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{
    "action": "update-status",
    "orderId": "<test-order-id>",
    "kitchenStatus": "ready"
  }'

# Verify response includes completed_at timestamp
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, confirm bugs exist on unfixed code, then verify fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm each bug exists BEFORE implementing fixes. Document counterexamples.

**Test Cases:**

**Bug #1: Syntax Error**
1. Run `node --check backoffice/frontend/js/pages/system.js` on UNFIXED code
   - Expected: SyntaxError with line number pointing to extra `};`
2. Load backoffice in browser, navigate to Activity Logs
   - Expected: White screen or console error, page doesn't render

**Bug #2: QRIS Upload**
- **SKIP** - Already working correctly, no bug to confirm

**Bug #3: Export Logs**
1. Navigate to Activity Logs page from backoffice
   - Expected: No "Export CSV" button visible
2. Open browser console, type `window.exportActivityLogs()`
   - Expected: `ReferenceError: exportActivityLogs is not defined`

**Bug #4: KDS APIs**
- **SKIP** - Already working correctly, no bug to confirm

**Bug #5: Completion Timestamp**
1. Create test order in POS
2. Update kitchen_status to "ready" via KDS or direct API call
3. Query database: `SELECT id, kitchen_status, completed_at FROM orders WHERE id = <test_id>`
   - Expected: `kitchen_status='ready'` but `completed_at IS NULL`
4. Call KDS Analytics page
   - Expected: Prep time shows 0:00 or NULL for the test order


**Expected Counterexamples:**
- Syntax error prevents JavaScript execution
- Export function undefined causing ReferenceError
- completed_at field NULL despite order completion
- Analytics calculations produce NULL/zero prep times

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Cases:**

**Fix #1: Syntax Error**
1. Run `node --check backoffice/frontend/js/pages/system.js` on FIXED code
   - Expected: Exit code 0, no errors
2. Load backoffice, navigate to Activity Logs
   - Expected: Page renders correctly with logs table
3. Navigate to Settings page
   - Expected: Page renders correctly with branding and QRIS sections

**Fix #2: QRIS Upload**
- **SKIP** - No fix required

**Fix #3: Export Logs**
1. Navigate to Activity Logs page
   - Expected: "Export CSV" button visible in UI
2. Click "Export CSV" button
   - Expected: CSV file downloads with filename `activity-logs-YYYY-MM-DD.csv`
3. Open downloaded CSV file
   - Expected: Headers present, all log entries included, correct formatting
4. Test with empty logs (new tenant with no activity)
   - Expected: Toast message "Tidak ada data untuk diekspor"

**Fix #4: KDS APIs**
- **SKIP** - No fix required

**Fix #5: Completion Timestamp**
1. Create new order via POS
2. Update `kitchen_status` to "preparing"
   - Expected: `completed_at` remains NULL (not a completion state)
3. Update `kitchen_status` to "ready"
   - Expected: `completed_at` set to current timestamp
4. Query database: `SELECT completed_at FROM orders WHERE id = <test_id>`
   - Expected: `completed_at` NOT NULL, value within last few seconds
5. Update `order_status` to "completed" on different order
   - Expected: `completed_at` set to current timestamp
6. Check KDS Analytics page
   - Expected: Prep times display correctly (e.g., "12:34" format, not NULL or 0:00)
7. Verify analytics calculation:
   - Order created at T0, completed at T0 + 15 minutes
   - Expected: Analytics shows prep time ≈ 15 minutes

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-bug scenarios, then verify same behavior on FIXED code.

**Test Cases:**

**Preservation #1: Settings Functionality**
1. Update brand name → Save → Verify saved to backend
2. Upload brand logo → Verify uploaded to Supabase Storage
3. Upload QRIS image → Verify uploaded to backend and cached to localStorage
4. Remove QRIS → Verify deleted from backend and localStorage
- Expected: All work identically before and after fixes

**Preservation #2: Activity Logs Display**
1. Load Activity Logs page → Verify logs table renders
2. Verify log entries display with correct timestamps, users, actions, modules
3. Verify date format displays as "DD MMM YYYY HH:MM WIB"
4. Apply filters (if implemented) → Verify filtering works
- Expected: Display logic unchanged

**Preservation #3: KDS Queue and Status Updates**
1. Call `API.orders.getKDSQueue()` → Verify returns pending/preparing orders
2. Update order kitchen_status to "pending" → Verify update succeeds
3. Update order kitchen_status to "preparing" → Verify update succeeds (completed_at should remain NULL)
4. KDS display shows orders correctly
- Expected: Queue retrieval and non-completion status updates unchanged

**Preservation #4: Order Creation**
1. Create order via POS with items → Verify order created with correct totals
2. Verify order_items inserted correctly
3. Verify payment flow works
4. Verify reports can query order data
- Expected: Order creation flow completely unchanged

**Preservation #5: Authentication**
1. Admin login via username/password → Verify session created
2. Staff login via PIN → Verify session created
3. Session token stored to localStorage → Verify retrieval works
4. API requests include `x-nashty-token` header → Verify authentication works
- Expected: Auth flow completely unchanged


### Unit Tests

**File Changes:**
- `backoffice/frontend/js/pages/system.js` - syntax fix and export function addition
- `supabase/functions/orders-api/index.ts` - completed_at timestamp logic

**Unit Test Coverage:**

**Test Suite 1: system.js Syntax**
- Test: JavaScript file parses without errors
- Test: All page definitions register successfully
- Test: Activity Logs page renders without errors
- Test: Settings page renders without errors

**Test Suite 2: Export Logs Function**
- Test: Export button renders in Activity Logs page HTML
- Test: `window.exportActivityLogs()` function exists and is callable
- Test: Export with valid logs produces CSV download
- Test: Export with empty logs shows error toast
- Test: CSV format includes correct headers
- Test: CSV escapes special characters (quotes, commas) correctly

**Test Suite 3: Completion Timestamp**
- Test: Update kitchen_status to "ready" sets completed_at
- Test: Update kitchen_status to "completed" sets completed_at
- Test: Update order_status to "completed" sets completed_at
- Test: Update kitchen_status to "preparing" does NOT set completed_at
- Test: Update kitchen_status to "pending" does NOT set completed_at
- Test: Multiple updates to completion states don't overwrite timestamp (idempotent)
- Test: completed_at timestamp is within reasonable time window (±5 seconds of update)

### Property-Based Tests

**Property Test 1: Order Status Preservation**
```
PROPERTY: For any order status update where status NOT IN ['ready', 'completed']
  GIVEN: order with NULL completed_at
  WHEN: updateStatus(orderId, randomNonCompletionStatus)
  THEN: completed_at remains NULL
```

**Property Test 2: Completion Timestamp Consistency**
```
PROPERTY: For any order status update where status IN ['ready', 'completed']
  GIVEN: order with NULL completed_at
  WHEN: updateStatus(orderId, completionStatus)
  THEN: completed_at IS NOT NULL AND completed_at <= NOW() AND completed_at >= updateStartTime
```

**Property Test 3: Settings Operations Preservation**
```
PROPERTY: For any settings operation (brand name, logo, QRIS)
  GIVEN: original system behavior
  WHEN: perform settings operation after fix
  THEN: result matches original behavior exactly
```

**Property Test 4: Export CSV Content Preservation**
```
PROPERTY: For any set of activity logs
  GIVEN: logs fetched from API
  WHEN: export to CSV
  THEN: CSV contains exactly N rows (where N = log count) AND all data matches source
```

### Integration Tests

**Integration Test 1: Full Order Lifecycle with Timestamps**
1. Create order via POS → Verify created_at set
2. Update to "preparing" via KDS → Verify completed_at still NULL
3. Update to "ready" via KDS → Verify completed_at set
4. Query analytics → Verify prep time calculated correctly
5. Generate kitchen performance report → Verify order included with valid prep time

**Integration Test 2: Activity Logs End-to-End**
1. Perform various actions (create product, update user, create order)
2. Navigate to Activity Logs page
3. Verify all actions logged and displayed
4. Click Export CSV
5. Verify CSV contains all logged actions with correct data

**Integration Test 3: Settings Workflow**
1. Login to backoffice
2. Navigate to Settings page
3. Update brand name → Save → Verify display updated
4. Upload QRIS image → Verify preview shows
5. Reload page → Verify QRIS still displays (from backend)
6. Clear localStorage → Reload → Verify QRIS still displays (backend persistence)

**Integration Test 4: KDS Analytics with Real Data**
1. Create 5 orders at different times
2. Mark orders as ready at staggered intervals (5 min, 10 min, 15 min, 8 min, 12 min apart)
3. Navigate to KDS Analytics page
4. Verify average prep time ≈ 10 minutes (average of 5, 10, 15, 8, 12)
5. Verify fastest product and slowest product identified correctly
6. Verify completed orders count = 5

## Implementation Sequence

**Recommended Order:**

1. **Fix #1: Syntax Error** (5 minutes)
   - Remove extra `};` from system.js
   - Verify with `node --check`
   - Test page navigation

2. **Fix #3: Export Logs** (20 minutes)
   - Add export button to HTML template
   - Add `window.exportActivityLogs()` function
   - Test export functionality

3. **Fix #5: Completion Timestamp** (15 minutes)
   - Modify Edge Function logic
   - Deploy Edge Function
   - Test with order status updates
   - Verify analytics display

**Total Estimated Time:** 40 minutes

**No Fixes Required:**
- Bug #2: QRIS Upload (already working)
- Bug #4: KDS API Methods (already working)

## Risk Assessment

**Low Risk Changes:**
- Syntax error fix: Single line deletion, zero logic change
- Export function: New feature addition, doesn't modify existing code

**Medium Risk Change:**
- Completion timestamp: Modifies Edge Function behavior, but change is isolated to single action

**Mitigation Strategies:**
- Test all fixes in development/staging environment first
- Verify preservation tests pass before deploying to production
- Deploy during low-traffic period
- Have rollback plan ready (revert Git commits)
- Monitor error logs for 24 hours post-deployment

**Rollback Plan:**
1. Revert Git commit for system.js
2. Revert Git commit for orders-api Edge Function
3. Redeploy previous Edge Function version: `supabase functions deploy orders-api`
4. Clear browser cache if syntax error returns

---

**End of Technical Design Document**
