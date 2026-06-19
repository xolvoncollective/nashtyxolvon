# POS Shift Management Bugfix Design

## Overview

This bugfix implements a complete shift management workflow for the POS system. The core issue is that the system currently allows order processing without requiring cashiers to open shifts, displays "saldo petty cash" without underlying tracking mechanisms, and lacks proper cash reconciliation and audit trails. This creates critical gaps in accountability and makes it impossible to properly track cash handling across multiple cashier shifts.

The fix introduces mandatory shift opening before order processing, proper petty cash balance tracking (starting and ending), automatic cash reconciliation calculations, comprehensive shift reports, and multi-user shift session management. The implementation leverages the existing shifts table schema but adds validation logic, frontend modals for shift workflows, and enhanced reporting capabilities.

## Glossary

- **Bug_Condition (C)**: The condition where cashiers can process orders without an open shift, or where shift management workflows (open/close) are missing
- **Property (P)**: The desired behavior where cashiers MUST open a shift with starting petty cash before processing orders, and MUST close shifts with ending petty cash and automatic reconciliation
- **Preservation**: Existing order processing, payment methods, transaction recording, and database query patterns that must remain unchanged
- **Shift Session**: A time-bounded work period for a cashier, starting with opening petty cash balance and ending with closing balance and reconciliation
- **Petty Cash**: Physical cash held by the cashier at the start and end of their shift
- **Cash Reconciliation**: The process of comparing expected cash (start cash + cash transactions) against actual ending cash to identify discrepancies
- **Shift Report**: A comprehensive summary showing all transactions, payment breakdowns, and cash reconciliation for a completed shift
- **Active Shift**: An open shift session (status='open') for a specific user

## Bug Details

### Bug Condition

The bug manifests when the POS system allows cashiers to process orders without first opening a shift session. This creates multiple problems: no starting petty cash balance is recorded, transactions are not associated with shift sessions, and there's no mechanism for end-of-shift reconciliation. The system displays "saldo petty cash" but this value has no underlying workflow or tracking mechanism.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PosSystemState
  OUTPUT: boolean
  
  RETURN (input.userHasActiveShift == false AND input.allowsOrderProcessing == true)
         OR (input.showsPettyCashDisplay == true AND input.hasPettyCashWorkflow == false)
         OR (input.shiftCloseWorkflowExists == false)
         OR (input.transactionsAssociatedWithShift == false)
END FUNCTION
```

### Examples

- **Example 1 (No Shift Requirement)**: Cashier "Budi" logs into POS at 8:00 AM and immediately starts taking orders without being prompted to open a shift with starting petty cash balance. Expected: System should block order processing and show "Buka Shift" modal. Actual: Orders are processed without shift association.

- **Example 2 (Missing Petty Cash Workflow)**: UI displays "saldo petty cash: Rp 500,000" but there's no underlying record of when this cash was counted, who counted it, or what the starting balance was. Expected: Petty cash should be tracked from shift opening through closing with full audit trail. Actual: Display shows value without workflow.

- **Example 3 (No Reconciliation)**: Cashier "Siti" completes her shift at 5:00 PM and logs out. No reconciliation workflow prompts her to count ending cash or compare against expected cash from transactions. Expected: System should require shift closing with ending cash input and display variance report. Actual: No closing workflow exists.

- **Edge Case (Multi-User Shifts)**: Two cashiers "Budi" and "Siti" work overlapping shifts (Budi: 8AM-3PM, Siti: 12PM-8PM). Each should have their own shift session with independent cash tracking. Expected: Each user's transactions tracked separately to their own shift. Actual: System doesn't enforce or track per-user shifts properly.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Order processing workflow (add items, modifiers, calculate totals) must continue to work exactly as before once shift is open
- Payment methods and payment processing logic must remain unchanged
- Transaction data recording (amount, items, payment method, timestamp) must continue to use existing database fields
- Receipt generation and printing must work identically
- User authentication and authorization patterns must remain unchanged
- Backend TypeScript/Express architecture must remain unchanged
- Frontend vanilla JavaScript rendering patterns must remain unchanged
- Kitchen display system (KDS) integration must remain unchanged

**Scope:**
All inputs and workflows that do NOT involve shift opening/closing should be completely unaffected by this fix. This includes:
- Processing orders during an open shift (existing flow)
- Viewing historical transactions outside shift context
- Managing products, categories, and menu items
- User management and authentication
- Payment method configuration
- Settings and configuration management

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing Frontend Validation**: The POS frontend (pos.js or equivalent POS terminal interface) does not check for active shift before allowing order creation. There's no guard that blocks access to the order entry screen without an open shift.

2. **Incomplete Shift Workflow UI**: While the backend has shift start/end endpoints (`/api/shifts/start`, `/api/shifts/:id/end`), the frontend lacks the modal interfaces to prompt cashiers to open shifts on login and close shifts on logout.

3. **No Shift Association Enforcement**: The orders table has a `shift_id` field (nullable), but there's no backend validation ensuring that orders are only created when a valid active shift exists for the user.

4. **Missing Auto-Refresh Logic**: After shift closing, the shift report doesn't automatically refresh to display final reconciliation data, requiring manual page refresh.

5. **Petty Cash Display Without Backend**: The "saldo petty cash" UI element may be hardcoded or calculated incorrectly without querying the actual active shift's start_cash and transaction data.

## Correctness Properties

Property 1: Bug Condition - Shift Required Before Order Processing

_For any_ POS terminal session where a cashier attempts to create an order without an active shift (isBugCondition returns true), the fixed system SHALL block order creation and display a "Buka Shift" modal requiring the cashier to input starting petty cash balance before proceeding.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Order Processing

_For any_ order creation during an active shift where the cashier has already opened their shift (isBugCondition returns false), the fixed system SHALL process the order exactly as the original system did, preserving all transaction flows, payment methods, and receipt generation behaviors.

**Validates: Requirements 3.1, 3.2, 3.6, 3.7**

## Fix Implementation

### Changes Required

**Assumption**: The root cause analysis is correct, and we need to add frontend validation, modal workflows, backend enforcement, and auto-refresh logic.

**File 1**: `backoffice/backend/src/routes/orders.ts` (or equivalent order creation endpoint)

**Changes**:
1. **Add Active Shift Validation**: Before creating an order, check that the requesting user has an active shift:
   ```typescript
   // In POST /api/orders endpoint
   const activeShift = get(`
     SELECT id FROM shifts WHERE user_id = ? AND status = 'open' ORDER BY started_at DESC LIMIT 1
   `, [userId]);
   
   if (!activeShift) {
     return res.status(400).json({ 
       error: 'No active shift. Please open a shift before creating orders.',
       code: 'NO_ACTIVE_SHIFT'
     });
   }
   ```

2. **Enforce Shift Association**: When creating orders, automatically set `shift_id` to the active shift:
   ```typescript
   const shiftId = (activeShift as any).id;
   // Include shiftId in INSERT statement for orders table
   ```

**File 2**: `backoffice/frontend/js/pages/pos.js` (or POS terminal frontend file)

**Function**: New modal rendering functions for shift workflows

**Specific Changes**:
1. **Add Shift Open Modal Function**:
   ```javascript
   window.showShiftOpenModal = async () => {
     // Render modal with input for starting petty cash
     // On submit, call API.request('/shifts/start', ...)
     // On success, close modal and allow order processing
   };
   ```

2. **Add Shift Close Modal Function**:
   ```javascript
   window.showShiftCloseModal = async (shiftId) => {
     // Fetch shift summary from /api/shifts/${shiftId}/summary
     // Render modal with input for ending petty cash
     // Display calculated variance (expected vs actual)
     // On submit, call API.request(`/shifts/${shiftId}/end`, ...)
     // On success, auto-refresh shift report display
   };
   ```

3. **Add Active Shift Check on Page Load**:
   ```javascript
   // In POS page initialization
   const checkActiveShift = async () => {
     const res = await API.request(`/shifts/active?userId=${currentUserId}`);
     if (!res.shift) {
       showShiftOpenModal();
     } else {
       window.currentShiftId = res.shift.id;
     }
   };
   ```

4. **Add Shift Status Display**:
   ```javascript
   // Display current shift info in header/footer
   // Show: Shift ID, Start Time, Starting Cash, Current Sales
   ```

5. **Block Order Creation Without Active Shift**:
   ```javascript
   // In order creation function
   if (!window.currentShiftId) {
     toast('Silakan buka shift terlebih dahulu', 'err');
     showShiftOpenModal();
     return;
   }
   ```

**File 3**: `backoffice/backend/src/routes/shifts.ts`

**Function**: Existing endpoints already exist, but may need minor enhancements

**Specific Changes**:
1. **Enhance `/api/shifts/:id/summary` Response**: Ensure it returns all data needed for shift close modal (total orders, cash transactions, expected cash calculation)

2. **Add Auto-Refresh Logic**: In the `/api/shifts/:id/end` endpoint, ensure the response includes complete shift report data so frontend can display immediately without additional API call

**File 4**: Frontend CSS (`backoffice/frontend/css/app.css` or inline styles)

**Changes**:
1. **Add Modal Styles**: Styles for shift open/close modals (overlay, modal container, form inputs, buttons)
2. **Add Shift Status Bar Styles**: Styles for displaying active shift info in POS interface

**File 5**: Database Schema (no changes needed)

**Rationale**: The existing `shifts` table already has all required fields:
- `id`, `outlet_id`, `user_id`, `start_cash`, `end_cash`, `expected_cash`, `variance`, `notes`, `started_at`, `ended_at`, `status`

The `orders` table already has `shift_id` field for association.

### Architecture Decisions

1. **Frontend-First Validation**: Use frontend checks to provide immediate UX feedback (block order button, show modal), but also enforce with backend validation for security.

2. **Session State Management**: Store `currentShiftId` in window object or session storage for quick access during order processing.

3. **Graceful Degradation**: If shift check API fails, allow user to proceed but log warning (don't completely break POS functionality).

4. **Auto-Refresh on Close**: Use JavaScript to update DOM elements after shift close API call succeeds, avoiding full page reload.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to create orders without active shifts, check for missing shift modals, and verify lack of reconciliation workflows. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **No Shift Requirement Test**: Attempt to create an order via API without an active shift for the user (will succeed on unfixed code, should fail after fix)
2. **Missing Modal Test**: Load POS page without active shift and check if shift open modal is displayed (will not display on unfixed code)
3. **No Reconciliation Test**: End a shift and check if reconciliation modal is shown (will not display on unfixed code)
4. **Shift Association Test**: Create an order and verify it has a `shift_id` associated (will be null on unfixed code in many cases)

**Expected Counterexamples**:
- Orders can be created via POST /api/orders without checking for active shift
- POS frontend allows access to order creation screen without shift open modal
- No shift close workflow is triggered when user logs out or manually closes shift
- Possible causes: missing frontend validation, no backend enforcement, incomplete UI workflows

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL posSessionState WHERE isBugCondition(posSessionState) DO
  result := posSystem_fixed.attemptOrderCreation(posSessionState)
  ASSERT result.orderCreationBlocked == true
  ASSERT result.shiftModalDisplayed == true
  ASSERT result.pettyCashInputRequired == true
END FOR
```

**Test Plan**: After implementing the fix, test that:
1. Orders cannot be created without active shifts (backend returns 400 error)
2. POS frontend displays shift open modal on load when no active shift exists
3. Shift close modal displays reconciliation data and prompts for ending cash
4. All orders are correctly associated with the user's active shift

**Test Cases**:
1. **Shift Requirement Enforcement**: Attempt to POST to /api/orders without active shift → expect 400 error with code 'NO_ACTIVE_SHIFT'
2. **Modal Display**: Load POS page without active shift → expect shift open modal to be visible in DOM
3. **Reconciliation Modal**: Call shift close endpoint and verify response includes reconciliation data → expect variance calculation displayed
4. **Shift Association**: Create order with active shift → verify order record has correct shift_id

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL orderData WHERE NOT isBugCondition(orderData) DO
  ASSERT posSystem_original.processOrder(orderData) = posSystem_fixed.processOrder(orderData)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for order processing with active shifts, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Order Processing Preservation**: With active shift, create orders of various types (dine-in, takeaway, delivery) → verify transaction flow identical to original
2. **Payment Method Preservation**: Process orders with different payment methods (cash, card, QRIS) → verify payment recording unchanged
3. **Receipt Generation Preservation**: Generate receipts for orders → verify receipt content and format unchanged
4. **Historical Data Preservation**: Query orders from before the fix → verify all data fields accessible and unchanged

### Unit Tests

**Shift Opening**:
- Test shift open modal displays when no active shift exists
- Test shift open API endpoint creates shift record with correct starting cash
- Test shift open API prevents duplicate open shifts for same user
- Test active shift query returns correct shift for user

**Shift Closing**:
- Test shift close modal displays reconciliation summary correctly
- Test shift close API calculates expected cash correctly (start_cash + cash_transactions)
- Test shift close API calculates variance correctly (end_cash - expected_cash)
- Test shift close API prevents closing shift with pending orders
- Test shift report auto-refreshes after shift close

**Order Creation Validation**:
- Test order creation blocked without active shift (backend validation)
- Test order creation blocked without active shift (frontend validation)
- Test order creation succeeds with active shift
- Test order record includes correct shift_id
- Test order processing flow unchanged when shift is active

**Multi-User Shifts**:
- Test user A and user B can have simultaneous active shifts
- Test user A's orders associated with user A's shift
- Test user B's orders associated with user B's shift
- Test each user's shift report shows only their transactions

### Property-Based Tests

**Order Processing Invariants**:
- Generate random orders with active shifts → verify all process successfully
- Generate random payment methods → verify all payment types recorded correctly
- Generate random order modifications → verify totals calculate identically to original system

**Cash Reconciliation Invariants**:
- Generate random shift scenarios (various start cash amounts, transaction counts) → verify variance calculation always equals (end_cash - (start_cash + total_cash_transactions))
- Generate random transaction mixes (cash, non-cash) → verify only cash transactions affect expected cash

**Preservation Invariants**:
- For any order processed with an active shift, verify: subtotal, tax, service charge, total calculations identical to original
- For any historical order query, verify: all fields returned match original schema
- For any payment method, verify: processing logic unchanged from original

### Integration Tests

**Complete Shift Lifecycle**:
1. User logs into POS → shift open modal appears
2. User enters starting cash Rp 500,000 → shift opens successfully
3. User creates 10 orders with mixed payment methods → all orders associated with shift
4. User clicks "Tutup Shift" → shift close modal displays with summary
5. User enters ending cash Rp 1,200,000 → reconciliation shows expected cash Rp 1,180,000, variance Rp +20,000
6. Shift report displays immediately with full breakdown

**Multi-Cashier Scenario**:
1. User A opens shift at 8:00 AM with Rp 300,000 starting cash
2. User B opens shift at 12:00 PM with Rp 500,000 starting cash
3. Both users process orders concurrently
4. User A closes shift at 3:00 PM → sees only their transactions
5. User B continues processing orders → unaffected by User A's shift close
6. User B closes shift at 8:00 PM → sees only their transactions

**Error Handling**:
1. User attempts to open shift twice → receives error "Already has active shift"
2. User attempts to close shift with pending orders → receives error with count of pending orders
3. Network error during shift open → user can retry without creating duplicate shifts
4. Network error during shift close → user can retry, shift closes idempotently

**Visual Feedback**:
1. Shift status bar displays current shift info throughout session
2. Petty cash display updates correctly based on active shift
3. Shift reports render correctly with payment breakdowns
4. Modal overlays display properly on different screen sizes
