# Bugfix Requirements Document

## Introduction

NASHTY OS is a SaaS system for restaurant management with multiple integrated modules (POS, KDS, Backoffice, CRM, COGS). Through comprehensive codebase archaeology, we identified critical production issues that prevent core features from functioning. This bugfix addresses **Phase 1: Critical Fixes** - five issues that block operational functionality and require immediate resolution.

The system was developed with AI assistance, resulting in technical debt accumulation including:
- **Syntax errors** preventing script execution
- **Data persistence failures** losing critical configuration
- **Handler mismatches** causing runtime errors
- **Missing API implementations** breaking UI features
- **Timestamp inconsistencies** corrupting analytics data

This fix ensures all Phase 1 critical features work reliably for production operations.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug #1: System.js Parse Failure**

1.1 WHEN the backoffice loads `system.js` THEN the JavaScript parser encounters an extra closing brace `};` after the `PAGES.settings` definition (line ~200) causing a syntax error

1.2 WHEN the syntax error occurs THEN all subsequent code in the file fails to execute, preventing `PAGES.actlogs` and other page definitions from registering

1.3 WHEN users navigate to Activity Logs or Settings pages THEN the page content fails to render or shows undefined behavior

**Bug #2: QRIS Upload Not Persisted**

1.4 WHEN a user uploads a QRIS static image via the Backoffice system settings page THEN the `uploadQRIS()` function only saves the base64 data to `localStorage` with key `nashty_qris_static`

1.5 WHEN the QRIS image is saved to localStorage only THEN it is not synced to the Supabase database or storage backend

1.6 WHEN the user clears browser cache, switches browsers, or accesses POS from a different device THEN the QRIS image is lost and unavailable for payment display

1.7 WHEN the POS attempts to display the QRIS payment option THEN it cannot retrieve the image from the backend, causing payment flow failure

**Bug #3: Export Logs Handler Mismatch**

1.8 WHEN the Activity Logs page renders the "Export CSV" button THEN the button's `onclick` attribute calls `exportLogs()` as a global function

1.9 WHEN the `activity-logs.js` module defines the export function THEN it exposes it as `window.activityLogsModule.exportLogs` but also creates a global `window.exportLogs` alias

1.10 WHEN a user clicks the "Export CSV" button in the legacy system.js Activity Logs implementation THEN the browser throws `ReferenceError: exportLogs is not defined` because the global function is not accessible from that context

**Bug #4: Missing KDS API Methods**

1.11 WHEN the Backoffice KDS Production Time page calls `API.kds.updateCategoryProductionTime(catId, timeMinutes)` THEN the method does not exist in `api-client.js`, causing `TypeError: API.kds.updateCategoryProductionTime is not a function`

1.12 WHEN the Backoffice KDS Analytics page calls `API.kds.getAnalytics()` THEN the method does not exist in `api-client.js`, causing `TypeError: API.kds.getAnalytics is not a function`

1.13 WHEN users attempt to configure production time targets or view kitchen analytics THEN the features are completely non-functional

**Bug #5: KDS Completion Timestamp Misalignment**

1.14 WHEN a kitchen order status is updated to "ready" or "completed" via `API.orders.updateKitchenStatus()` THEN the `completed_at` timestamp field is not set or updated in the `orders` table

1.15 WHEN the KDS Analytics function `API.kds.getAnalytics()` queries for preparation time metrics THEN it calculates `prep_time` using `orders.completed_at - orders.created_at`

1.16 WHEN `completed_at` is NULL for completed orders THEN the analytics calculation produces NULL or incorrect prep time values, corrupting the kitchen performance dashboard

---

### Expected Behavior (Correct)

**Fix #1: System.js Parse Failure**

2.1 WHEN the backoffice loads `system.js` THEN the file SHALL parse without syntax errors, allowing all page definitions to register successfully

2.2 WHEN users navigate to Activity Logs or Settings pages THEN the pages SHALL render correctly with full functionality

**Fix #2: QRIS Upload Persistence**

2.3 WHEN a user uploads a QRIS static image via the Backoffice system settings page THEN the system SHALL call `API.outletSettings.uploadQris(file)` to upload the image to Supabase Storage and persist the URL to the database

2.4 WHEN the QRIS upload completes successfully THEN the system SHALL update `localStorage` with the backend URL as a cache fallback for immediate POS access

2.5 WHEN the POS or any device retrieves QRIS settings THEN the system SHALL fetch the image URL from the backend (Supabase `outlets.qris_static_url` field), ensuring availability across all devices

2.6 WHEN the backend upload fails THEN the system SHALL save to `localStorage` as a temporary fallback and display a clear error message indicating sync failure

**Fix #3: Export Logs Handler Resolution**

2.7 WHEN the Activity Logs page (either `system.js` or `activity-logs.js` implementation) renders THEN it SHALL ensure the `exportLogs()` function is accessible to all `onclick` handlers

2.8 WHEN a user clicks the "Export CSV" button THEN the system SHALL successfully execute the export function without throwing `ReferenceError`

2.9 WHEN the export executes THEN the system SHALL generate and download a CSV file containing the activity logs data

**Fix #4: KDS API Methods Implementation**

2.10 WHEN the Backoffice KDS Production Time page calls `API.kds.updateCategoryProductionTime(catId, timeMinutes)` THEN the method SHALL exist in `api-client.js` and update all products in the specified category with the new `production_time` value

2.11 WHEN the Backoffice KDS Analytics page calls `API.kds.getAnalytics()` THEN the method SHALL exist and return kitchen performance metrics including average prep time, completed orders count, SLA metrics, and fastest/slowest products

2.12 WHEN users configure production time targets or view analytics THEN the features SHALL work correctly with data persisted to and retrieved from Supabase

**Fix #5: KDS Completion Timestamp Alignment**

2.13 WHEN a kitchen order status is updated to "ready" or "completed" via `API.orders.updateKitchenStatus()` or the orders Edge Function THEN the system SHALL automatically set `orders.completed_at` to the current timestamp

2.14 WHEN `API.kds.getAnalytics()` calculates preparation time metrics THEN it SHALL use valid `completed_at` timestamps to compute accurate prep time durations

2.15 WHEN the KDS Analytics dashboard displays performance data THEN it SHALL show correct average prep times, completion rates, and product-level timing analysis

---

### Unchanged Behavior (Regression Prevention)

**Preservation #1: Existing Settings Functionality**

3.1 WHEN users update brand name via `saveBranding()` THEN the system SHALL CONTINUE TO save settings to the backend via `PUT /settings/:outletId` as currently implemented

3.2 WHEN users upload brand logo via `uploadLogo()` THEN the system SHALL CONTINUE TO upload to Supabase Storage and update settings as currently implemented

3.3 WHEN users remove QRIS via `removeQRIS()` THEN the system SHALL CONTINUE TO delete the QRIS URL from backend and localStorage as currently implemented

**Preservation #2: Activity Logs Core Functionality**

3.4 WHEN the Activity Logs page loads THEN it SHALL CONTINUE TO fetch logs from the `/activity-logs` endpoint with tenant filtering

3.5 WHEN users apply date, action, or entity type filters THEN the filtering logic SHALL CONTINUE TO work as currently implemented

3.6 WHEN activity log entries render THEN they SHALL CONTINUE TO display timestamps, user names, actions, modules, and descriptions in the current table format

**Preservation #3: KDS Queue and Status Updates**

3.7 WHEN the KDS display calls `API.orders.getKDSQueue(outletId)` THEN it SHALL CONTINUE TO return pending and preparing orders for the kitchen display

3.8 WHEN kitchen staff update order status via `API.orders.updateKitchenStatus(orderId, status)` THEN the system SHALL CONTINUE TO update the `kitchen_status` field in the database

3.9 WHEN KDS workflow settings are configured THEN the system SHALL CONTINUE TO store and retrieve custom status names and colors

**Preservation #4: Order Creation and Payment Flow**

3.10 WHEN POS creates a new order via `API.orders.create(orderData)` THEN the system SHALL CONTINUE TO create orders with items, calculate totals, and record transactions

3.11 WHEN orders transition to "paid" status THEN the payment flow and order completion logic SHALL CONTINUE TO work without modification

3.12 WHEN reports query order data THEN they SHALL CONTINUE TO access the same order fields and relationships

**Preservation #5: Authentication and Session Management**

3.13 WHEN users authenticate via PIN login (staff) or username/password (admin) THEN the authentication flow SHALL CONTINUE TO work through the `auth-login` Edge Function

3.14 WHEN session tokens are stored and restored THEN the localStorage session management SHALL CONTINUE TO function for all modules

3.15 WHEN API requests include authentication headers THEN the `x-nashty-token` custom header pattern SHALL CONTINUE TO be used for user token validation

---

## Bug Condition Derivation

### Bug Condition Functions

```pascal
// Bug #1: System.js Parse Failure
FUNCTION isSyntaxErrorBug(X)
  INPUT: X of type FileContent
  OUTPUT: boolean
  
  RETURN X.file_path = "backoffice/frontend/js/pages/system.js" AND
         X.content contains "PAGES.settings" followed by extra "};" token
END FUNCTION
```

```pascal
// Bug #2: QRIS Upload Not Persisted
FUNCTION isQRISLocalOnlyBug(X)
  INPUT: X of type UploadAction
  OUTPUT: boolean
  
  RETURN X.action = "uploadQRIS" AND
         X.saves_to_localStorage = true AND
         X.calls_backend_API = false
END FUNCTION
```

```pascal
// Bug #3: Export Logs Handler Mismatch
FUNCTION isExportHandlerMissingBug(X)
  INPUT: X of type ButtonClick
  OUTPUT: boolean
  
  RETURN X.button_id = "export-logs-button" AND
         X.onclick = "exportLogs()" AND
         NOT exists_in_global_scope("exportLogs")
END FUNCTION
```

```pascal
// Bug #4: Missing KDS API Methods
FUNCTION isKDSMethodMissingBug(X)
  INPUT: X of type FunctionCall
  OUTPUT: boolean
  
  RETURN (X.function_name = "API.kds.updateCategoryProductionTime" OR
          X.function_name = "API.kds.getAnalytics") AND
         NOT exists_in_api_client(X.function_name)
END FUNCTION
```

```pascal
// Bug #5: KDS Completion Timestamp Missing
FUNCTION isCompletedAtNullBug(X)
  INPUT: X of type OrderStatusUpdate
  OUTPUT: boolean
  
  RETURN X.new_kitchen_status IN ["ready", "completed"] AND
         X.sets_completed_at = false
END FUNCTION
```

### Property Specifications

```pascal
// Property: Fix Checking - Bug #1
FOR ALL X WHERE isSyntaxErrorBug(X) DO
  result ← parseJavaScript'(X.content_after_fix)
  ASSERT result.parse_success = true AND
         result.registered_pages includes "settings" AND
         result.registered_pages includes "actlogs"
END FOR
```

```pascal
// Property: Fix Checking - Bug #2
FOR ALL X WHERE isQRISLocalOnlyBug(X) DO
  result ← uploadQRIS'(X.file)
  ASSERT result.calls_API_outletSettings_uploadQris = true AND
         result.updates_supabase_storage = true AND
         result.updates_database_qris_static_url = true AND
         result.caches_to_localStorage_as_fallback = true
END FOR
```

```pascal
// Property: Fix Checking - Bug #3
FOR ALL X WHERE isExportHandlerMissingBug(X) DO
  result ← clickExportButton'()
  ASSERT no_reference_error(result) AND
         result.exports_CSV_file = true
END FOR
```

```pascal
// Property: Fix Checking - Bug #4
FOR ALL X WHERE isKDSMethodMissingBug(X) DO
  result ← callKDSMethod'(X.function_name, X.arguments)
  ASSERT no_type_error(result) AND
         result.returns_valid_response = true
END FOR
```

```pascal
// Property: Fix Checking - Bug #5
FOR ALL X WHERE isCompletedAtNullBug(X) DO
  result ← updateKitchenStatus'(X.order_id, X.new_status)
  ASSERT result.completed_at_timestamp IS NOT NULL AND
         result.completed_at_timestamp <= current_timestamp()
END FOR
```

### Preservation Properties

```pascal
// Property: Preservation Checking - All Non-Buggy Scenarios
FOR ALL X WHERE NOT (isSyntaxErrorBug(X) OR 
                     isQRISLocalOnlyBug(X) OR 
                     isExportHandlerMissingBug(X) OR 
                     isKDSMethodMissingBug(X) OR 
                     isCompletedAtNullBug(X)) DO
  ASSERT F(X) = F'(X)
END FOR
```

**Where:**
- **F**: Original (unfixed) system behavior
- **F'**: Fixed system behavior
- **X**: Any input or operation not matching the bug conditions

This ensures that for all operations outside the scope of the five identified bugs, the system behavior remains identical before and after the fix.

---

## Counterexamples

### Bug #1: System.js Parse Failure
**Trigger:** Load backoffice, navigate to Activity Logs  
**Current Result:** White screen or JavaScript error in console  
**Expected Result:** Activity Logs page renders with data table

### Bug #2: QRIS Upload Not Persisted
**Trigger:** Upload QRIS image, clear browser cache, reload POS  
**Current Result:** QRIS image is lost, payment option unavailable  
**Expected Result:** QRIS image retrieved from backend, payment option displays correctly

### Bug #3: Export Logs Handler Mismatch
**Trigger:** Navigate to Activity Logs (system.js version), click "Export CSV"  
**Current Result:** `ReferenceError: exportLogs is not defined`  
**Expected Result:** CSV file downloads with activity logs data

### Bug #4: Missing KDS API Methods
**Trigger:** Navigate to Backoffice → KDS → Analytics, page attempts to load data  
**Current Result:** `TypeError: API.kds.getAnalytics is not a function`  
**Expected Result:** Analytics dashboard displays kitchen performance metrics

### Bug #5: KDS Completion Timestamp Misalignment
**Trigger:** Kitchen staff marks order as "ready", analytics page calculates prep time  
**Current Result:** Prep time shows NULL or 0:00 because `completed_at` is NULL  
**Expected Result:** Prep time shows accurate duration (e.g., 12:34 minutes:seconds)

---

## Scope

**In Scope:**
- Fix syntax error in `backoffice/frontend/js/pages/system.js`
- Implement backend persistence for QRIS upload with localStorage fallback
- Resolve Activity Logs export handler accessibility
- Implement missing `API.kds.updateCategoryProductionTime()` and `API.kds.getAnalytics()` methods
- Ensure `completed_at` timestamp is set when kitchen orders reach completion states

**Out of Scope (Phase 2-4 issues):**
- API client consolidation (duplicate api-client.js vs kds/api.js)
- Authentication storage key normalization
- Settings source of truth resolution
- Order status ownership clarification
- Code organization and service layer refactoring
- Performance optimizations (pagination, polling reduction)
- Testing infrastructure setup

---

## Success Criteria

1. ✅ `system.js` passes `node --check` syntax validation without errors
2. ✅ Activity Logs page loads successfully in backoffice from any navigation path
3. ✅ QRIS image uploaded via backoffice is accessible from POS on different devices after cache clear
4. ✅ Export CSV button in Activity Logs produces a downloadable CSV file without errors
5. ✅ KDS Production Time page allows updating category production targets without console errors
6. ✅ KDS Analytics page displays kitchen performance metrics with valid data
7. ✅ Orders marked as "ready" or "completed" have valid `completed_at` timestamps in database
8. ✅ All existing features (settings, orders, authentication) continue to work as before

---

## References

- **REFACTOR_PLAN.md** - Detailed Phase 1 task breakdown
- **PROBLEM_REPORT.md** - Comprehensive issue categorization (39 total issues)
- **SYSTEM_MAP.md** - Current architecture documentation
- **DATABASE_MAP.md** - Database schema and table relations
- **BUSINESS_FLOW.md** - Operational workflow documentation

---

**End of Bugfix Requirements Document**
