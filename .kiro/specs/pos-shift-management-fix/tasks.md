# POS Shift Management Bugfix Tasks

## Phase 1: Backend Shift Validation and Enforcement

### 1.1 Add Active Shift Validation to Order Creation Endpoint

**Objective**: Prevent order creation when user has no active shift

**Files**: `backoffice/backend/src/routes/orders.ts`

**Implementation**:
- In POST /api/orders endpoint, before order creation logic:
  - Query for active shift: `SELECT id FROM shifts WHERE user_id = ? AND status = 'open' ORDER BY started_at DESC LIMIT 1`
  - If no active shift found, return 400 error with: `{ error: 'No active shift. Please open a shift before creating orders.', code: 'NO_ACTIVE_SHIFT' }`
  - If active shift exists, store shiftId for use in order insertion

**Acceptance Criteria**:
- POST /api/orders without active shift returns 400 with code 'NO_ACTIVE_SHIFT'
- POST /api/orders with active shift proceeds normally
- Error response includes user-friendly message in Indonesian

**Dependencies**: None

**Estimated Effort**: 30 minutes

---

### 1.2 Enforce Shift Association in Order Records

**Objective**: Automatically associate all orders with user's active shift

**Files**: `backoffice/backend/src/routes/orders.ts`

**Implementation**:
- In POST /api/orders endpoint, after retrieving active shift:
  - Set `shift_id` field in INSERT statement to active shift ID
  - Ensure shift_id is included in order creation SQL

**Acceptance Criteria**:
- All new orders have non-null shift_id matching user's active shift
- Orders table query shows correct shift association
- Shift summary endpoint returns correct order count for shift

**Dependencies**: Task 1.1

**Estimated Effort**: 15 minutes

---

### 1.3 Enhance Shift Summary Endpoint Response

**Objective**: Provide complete data for shift close modal

**Files**: `backoffice/backend/src/routes/shifts.ts`

**Implementation**:
- Review GET /api/shifts/:id/summary endpoint
- Ensure response includes:
  - Shift basic info (id, user_name, outlet_name, started_at, start_cash)
  - Total orders count
  - Cash transactions total (sum of all cash payment amounts)
  - Non-cash transactions total
  - Expected cash calculation (start_cash + cash_transactions)
  - Payment method breakdown

**Acceptance Criteria**:
- Endpoint returns all required fields for reconciliation modal
- Cash transactions calculated correctly from payments table
- Response format matches frontend expectations

**Dependencies**: None

**Estimated Effort**: 30 minutes

---

### 1.4 Add Pending Orders Check to Shift Close Endpoint

**Objective**: Prevent shift closing with incomplete orders

**Files**: `backoffice/backend/src/routes/shifts.ts`

**Implementation**:
- In POST /api/shifts/:id/end endpoint, before closing shift:
  - Query for pending orders: `SELECT COUNT(*) FROM orders WHERE shift_id = ? AND (payment_status = 'pending' OR order_status IN ('pending', 'confirmed', 'preparing'))`
  - If count > 0, return 400 error with message: `Tidak bisa menutup shift. Ada {count} pesanan yang belum selesai atau belum dibayar.`
  - This validation already exists but verify it's working correctly

**Acceptance Criteria**:
- Cannot close shift with pending orders (returns 400)
- Can close shift when all orders are completed or cancelled
- Error message shows exact count of pending orders

**Dependencies**: None

**Estimated Effort**: 15 minutes (verification only)

---

## Phase 2: Frontend Shift Open Workflow

### 2.1 Create Shift Open Modal Component

**Objective**: Build modal UI for shift opening

**Files**: `backoffice/frontend/js/pages/pos.js` (or create new `pos-shift-modals.js`)

**Implementation**:
- Create function `window.showShiftOpenModal = async () => { ... }`
- Modal HTML structure:
  - Title: "Buka Shift"
  - Subtitle: "Masukkan saldo awal petty cash untuk memulai shift"
  - Input field: Starting cash amount (type="number", min="0", placeholder="Contoh: 500000")
  - Buttons: "Batal" (cancel), "Buka Shift" (submit, primary style)
- Modal styling: overlay background, centered modal, responsive width
- On submit:
  - Validate input (not empty, >= 0)
  - Call `API.request('/shifts/start', { method: 'POST', body: JSON.stringify({ outletId, userId, startCash }) })`
  - On success: close modal, store shift ID, refresh POS interface
  - On error: display toast with error message

**Acceptance Criteria**:
- Modal displays correctly over POS interface
- Input validation works (prevents negative or empty values)
- API call sends correct payload format
- Success closes modal and enables order processing
- Error displays user-friendly toast message

**Dependencies**: None

**Estimated Effort**: 1 hour

---

### 2.2 Add Active Shift Check on POS Page Load

**Objective**: Check for active shift when POS loads

**Files**: `backoffice/frontend/js/pages/pos.js`

**Implementation**:
- Add function `window.checkActiveShift = async (userId) => { ... }`
- Make API call: `GET /api/shifts/active?userId=${userId}`
- If response.shift exists:
  - Store `window.currentShiftId = response.shift.id`
  - Store `window.currentShift = response.shift` (full shift object)
  - Display shift status in UI
- If response.shift is null:
  - Call `showShiftOpenModal()`
  - Disable order creation buttons until shift opened
- Call this function in POS page initialization (when page loads)

**Acceptance Criteria**:
- Function called automatically when POS page loads
- Correctly identifies if user has active shift
- Shows shift open modal when no active shift exists
- Stores shift data for use in order creation

**Dependencies**: Task 2.1

**Estimated Effort**: 45 minutes

---

### 2.3 Add Shift Status Display in POS Interface

**Objective**: Show current shift information in POS UI

**Files**: `backoffice/frontend/js/pages/pos.js`, `backoffice/frontend/css/app.css`

**Implementation**:
- Add shift status bar to POS interface (header or footer area)
- Display information:
  - Shift start time (formatted: "Shift dimulai: 08:00 WIB")
  - Starting cash (formatted: "Modal awal: Rp 500.000")
  - Current shift duration
  - Cashier name
- Add "Tutup Shift" button to status bar
- Style: compact bar, subtle background color, clear typography
- Update status bar when shift opens

**Acceptance Criteria**:
- Status bar visible when shift is active
- All information displayed correctly and formatted
- Status bar hidden when no active shift
- "Tutup Shift" button triggers shift close modal

**Dependencies**: Task 2.2

**Estimated Effort**: 1 hour

---

### 2.4 Block Order Creation Without Active Shift

**Objective**: Prevent order creation in frontend when no active shift

**Files**: `backoffice/frontend/js/pages/pos.js` (order creation functions)

**Implementation**:
- In order creation function (wherever orders are submitted):
  - Check `if (!window.currentShiftId) { ... }`
  - If no active shift:
    - Display toast: `toast('Silakan buka shift terlebih dahulu', 'err')`
    - Call `showShiftOpenModal()`
    - Return early (don't proceed with order creation)
- Alternatively, disable "Submit Order" or "Bayar" button when no active shift
- Add visual indicator (grayed out button, tooltip) explaining shift required

**Acceptance Criteria**:
- Cannot submit orders without active shift (frontend validation)
- User sees clear error message
- Shift open modal appears automatically
- Order button re-enabled after shift opens

**Dependencies**: Task 2.2

**Estimated Effort**: 30 minutes

---

## Phase 3: Frontend Shift Close Workflow

### 3.1 Create Shift Close Modal Component

**Objective**: Build modal UI for shift closing with reconciliation

**Files**: `backoffice/frontend/js/pages/pos.js` (or `pos-shift-modals.js`)

**Implementation**:
- Create function `window.showShiftCloseModal = async (shiftId) => { ... }`
- Fetch shift summary: `API.request('/shifts/' + shiftId + '/summary')`
- Modal HTML structure:
  - Title: "Tutup Shift"
  - Subtitle: "Rekonsiliasi kas akhir shift"
  - Display summary:
    - Shift start time
    - Total orders count
    - Starting cash (from summary)
    - Cash transactions total
    - Expected cash (calculated: start + cash transactions)
  - Input field: Ending cash amount (type="number", placeholder="Masukkan jumlah kas aktual")
  - Real-time variance display: (ending cash input - expected cash)
    - Show in green if positive, red if negative
  - Notes field (optional, textarea)
  - Buttons: "Batal" (cancel), "Tutup Shift" (submit, primary, danger style)

**Acceptance Criteria**:
- Modal fetches and displays shift summary correctly
- Expected cash calculated correctly
- Variance updates in real-time as user types ending cash
- Variance color coding works (green/red)
- Submit button sends correct payload

**Dependencies**: Task 1.3

**Estimated Effort**: 2 hours

---

### 3.2 Implement Shift Close API Call and Auto-Refresh

**Objective**: Submit shift close and refresh UI with results

**Files**: `backoffice/frontend/js/pages/pos.js`

**Implementation**:
- In shift close modal submit handler:
  - Validate ending cash input (not empty, >= 0)
  - Call `API.request('/shifts/' + shiftId + '/end', { method: 'POST', body: JSON.stringify({ endCash, notes }) })`
  - On success:
    - Close modal
    - Clear `window.currentShiftId`
    - Display success toast: "Shift berhasil ditutup"
    - Option 1: Navigate to shift report page with shift ID
    - Option 2: Display inline shift report summary
    - Option 3: Refresh POS page and show shift open modal
  - On error (e.g., pending orders):
    - Display error toast with specific message
    - Keep modal open for user to resolve issue

**Acceptance Criteria**:
- API call sends correct payload (endCash, notes)
- Success clears active shift state
- UI updates immediately without manual refresh
- Error messages displayed clearly
- User can retry after resolving errors

**Dependencies**: Task 3.1, Task 1.4

**Estimated Effort**: 1 hour

---

### 3.3 Add Shift Close Button to POS Interface

**Objective**: Provide easy access to shift closing

**Files**: `backoffice/frontend/js/pages/pos.js`

**Implementation**:
- Add "Tutup Shift" button to shift status bar (from Task 2.3)
- Style: danger/warning color to indicate important action
- On click: call `showShiftCloseModal(window.currentShiftId)`
- Add confirmation prompt if there are recent unpaid orders
- Consider adding keyboard shortcut (e.g., Ctrl+Shift+E)

**Acceptance Criteria**:
- Button visible in shift status bar when shift active
- Click triggers shift close modal
- Button hidden when no active shift
- Styled appropriately to indicate importance

**Dependencies**: Task 2.3, Task 3.1

**Estimated Effort**: 30 minutes

---

## Phase 4: Shift Reports and Display

### 4.1 Create Shift Report Page/Section

**Objective**: Display comprehensive shift report after closing

**Files**: `backoffice/frontend/js/pages/pos.js` or new file `pos-shift-reports.js`

**Implementation**:
- Create page or section to display shift report
- Fetch data from:
  - `/api/shifts/:id/summary` - shift summary
  - `/api/shifts/:id/orders` - orders list
  - `/api/shifts/:id/payment-breakdown` - payment methods breakdown
- Display sections:
  - Shift header: User name, outlet, start/end times
  - Cash reconciliation: Start cash, cash transactions, expected, actual, variance
  - Payment breakdown: Chart or table showing each payment method with count and total
  - Orders list: Table with order number, type, total, payment method, time
  - Summary: Total orders, total sales, average transaction
- Add "Print Report" button
- Add "Export CSV" button (optional)

**Acceptance Criteria**:
- Report displays all sections with correct data
- Data fetched from correct API endpoints
- Report formatted clearly and professionally
- Variance highlighted appropriately (color coding)
- Print functionality works

**Dependencies**: Task 1.3

**Estimated Effort**: 3 hours

---

### 4.2 Update Petty Cash Display Logic

**Objective**: Show correct petty cash based on active shift

**Files**: Wherever "saldo petty cash" is displayed in POS interface

**Implementation**:
- Find current petty cash display element
- Update logic to calculate from active shift:
  - If active shift: Display `start_cash + cash_transactions_so_far`
  - Query cash transactions from current shift: `SELECT SUM(amount) FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.shift_id = ? AND p.method = 'tunai'`
  - If no active shift: Display "Rp 0" or hide the display
- Add label clarification: "Saldo Petty Cash (Shift Aktif)"
- Update display in real-time after each cash transaction

**Acceptance Criteria**:
- Display shows correct calculation based on active shift
- Updates after each cash order
- Shows appropriate value when no active shift
- Label clearly indicates it's for current shift

**Dependencies**: Task 2.2

**Estimated Effort**: 1 hour

---

### 4.3 Add Shift History View in Backoffice

**Objective**: Allow viewing past shift reports

**Files**: `backoffice/frontend/js/pages/pos.js` (or existing reports section)

**Implementation**:
- Use existing `GET /api/shifts` endpoint with filters
- Display table of past shifts:
  - Columns: Date, Cashier, Start Time, End Time, Starting Cash, Expected Cash, Actual Cash, Variance, Status
  - Filter by: Date range, cashier, outlet
  - Sort by: Date (default descending)
- Click row to view full shift report (use component from Task 4.1)
- Add search functionality
- Pagination if many shifts

**Acceptance Criteria**:
- Table displays all past shifts correctly
- Filters work properly
- Click row navigates to full shift report
- Pagination works (if implemented)
- Data loads efficiently even with many shifts

**Dependencies**: Task 4.1

**Estimated Effort**: 2 hours

---

## Phase 5: Testing and Validation

### 5.1 Write Unit Tests for Backend Shift Validation

**Objective**: Test shift validation logic

**Files**: `backoffice/backend/src/routes/__tests__/orders.test.ts` (create if doesn't exist)

**Implementation**:
- Test: POST /api/orders without active shift returns 400
- Test: POST /api/orders with active shift succeeds
- Test: Order record includes correct shift_id
- Test: Multiple concurrent orders use same shift_id
- Use Jest or existing test framework
- Mock database calls if needed

**Acceptance Criteria**:
- All tests pass
- Coverage includes success and error cases
- Tests are repeatable and deterministic

**Dependencies**: Task 1.1, Task 1.2

**Estimated Effort**: 2 hours

---

### 5.2 Write Unit Tests for Shift Endpoints

**Objective**: Test shift open/close endpoints

**Files**: `backoffice/backend/src/routes/__tests__/shifts.test.ts` (create if doesn't exist)

**Implementation**:
- Test: POST /api/shifts/start creates shift successfully
- Test: POST /api/shifts/start with existing open shift returns error
- Test: POST /api/shifts/:id/end calculates variance correctly
- Test: POST /api/shifts/:id/end with pending orders returns error
- Test: GET /api/shifts/active returns correct shift
- Test: GET /api/shifts/:id/summary returns complete data

**Acceptance Criteria**:
- All shift endpoint tests pass
- Cash reconciliation calculation verified
- Error cases properly tested

**Dependencies**: None (tests existing endpoints)

**Estimated Effort**: 2 hours

---

### 5.3 Manual Integration Testing - Full Shift Lifecycle

**Objective**: Test complete shift workflow end-to-end

**Test Scenario**:
1. Load POS page with no active shift
2. Verify shift open modal appears automatically
3. Enter starting cash Rp 500,000 and open shift
4. Verify shift status bar displays correctly
5. Create 5 orders with mixed payment methods (3 cash, 2 QRIS)
6. Verify all orders associated with shift
7. Check petty cash display updates correctly
8. Click "Tutup Shift" button
9. Verify shift close modal shows correct summary
10. Enter ending cash Rp 650,000
11. Verify variance calculation displayed correctly
12. Submit shift close
13. Verify shift report displays automatically
14. Verify shift report shows all orders and payment breakdown

**Acceptance Criteria**:
- All steps complete without errors
- Data displayed correctly at each step
- Calculations accurate
- UI responsive and intuitive

**Dependencies**: All previous tasks

**Estimated Effort**: 1 hour

---

### 5.4 Manual Integration Testing - Multi-User Scenario

**Objective**: Test concurrent shifts for multiple users

**Test Scenario**:
1. User A logs in and opens shift with Rp 300,000
2. User B logs in (different session) and opens shift with Rp 500,000
3. User A creates 3 orders
4. User B creates 5 orders
5. Verify User A sees only their orders in shift
6. Verify User B sees only their orders in shift
7. User A closes shift
8. Verify User B's shift still active
9. User B continues creating orders
10. User B closes shift
11. Verify both shift reports show correct data

**Acceptance Criteria**:
- Both users can have concurrent active shifts
- Orders correctly associated with respective shifts
- Closing one shift doesn't affect the other
- Both shift reports accurate and independent

**Dependencies**: All previous tasks

**Estimated Effort**: 1 hour

---

### 5.5 Manual Testing - Error Cases

**Objective**: Test error handling and edge cases

**Test Scenarios**:
1. **Attempt to open shift twice**: Open shift, then try to open again without closing
   - Expected: Error "Already has active shift"

2. **Attempt to close shift with pending orders**: Create order, don't complete payment, try to close shift
   - Expected: Error with count of pending orders

3. **Network error during shift open**: Disconnect network, try to open shift
   - Expected: User-friendly error, can retry after reconnecting

4. **Invalid input in shift open**: Enter negative starting cash
   - Expected: Validation error prevents submission

5. **Invalid input in shift close**: Enter negative ending cash
   - Expected: Validation error prevents submission

6. **Close shift with zero orders**: Open shift, immediately close without any orders
   - Expected: Shift closes successfully with zero variance

7. **Large variance scenario**: Open with Rp 1,000,000, no cash transactions, close with Rp 500,000
   - Expected: Shows large negative variance correctly

**Acceptance Criteria**:
- All error cases handled gracefully
- User sees clear error messages in Indonesian
- No crashes or unhandled exceptions
- User can recover from errors

**Dependencies**: All previous tasks

**Estimated Effort**: 1.5 hours

---

## Phase 6: Documentation and Polish

### 6.1 Add User Documentation

**Objective**: Document shift management workflow for users

**Files**: Create `docs/SHIFT_MANAGEMENT_USER_GUIDE.md` or add to existing docs

**Content**:
- Overview of shift management
- How to open a shift (with screenshots)
- How to process orders during shift
- How to close a shift (with screenshots)
- Understanding shift reports
- Troubleshooting common issues
- FAQ section

**Acceptance Criteria**:
- Documentation clear and comprehensive
- Screenshots accurate
- Language: Indonesian (primary) and English (optional)
- Covers all user-facing workflows

**Dependencies**: All implementation tasks complete

**Estimated Effort**: 2 hours

---

### 6.2 Add Developer Documentation

**Objective**: Document technical implementation for developers

**Files**: Create `docs/SHIFT_MANAGEMENT_TECHNICAL.md` or add to existing dev docs

**Content**:
- Architecture overview
- Database schema for shifts
- API endpoints documentation
- Frontend component structure
- State management approach
- Testing approach
- Future enhancements

**Acceptance Criteria**:
- Documentation technically accurate
- Includes code examples
- API endpoints fully documented
- Clear for future maintainers

**Dependencies**: All implementation tasks complete

**Estimated Effort**: 2 hours

---

### 6.3 Code Review and Refactoring

**Objective**: Review and optimize implementation

**Activities**:
- Review all code changes for:
  - Code quality and consistency
  - Error handling completeness
  - Performance optimization opportunities
  - Security considerations
  - Accessibility (keyboard navigation, screen readers)
- Refactor duplicated code into reusable functions
- Optimize API calls (reduce unnecessary requests)
- Add code comments for complex logic
- Ensure consistent naming conventions

**Acceptance Criteria**:
- Code passes team code review standards
- No obvious performance bottlenecks
- Error handling comprehensive
- Code well-documented

**Dependencies**: All implementation tasks complete

**Estimated Effort**: 3 hours

---

### 6.4 UI/UX Polish and Styling

**Objective**: Improve visual design and user experience

**Files**: `backoffice/frontend/css/app.css`, modal styling

**Activities**:
- Refine modal designs (spacing, colors, typography)
- Add loading states for API calls
- Add smooth transitions/animations
- Improve button styles and hover states
- Ensure responsive design (mobile, tablet)
- Test accessibility (color contrast, focus indicators)
- Add helpful tooltips where needed
- Ensure consistent styling with rest of POS interface

**Acceptance Criteria**:
- Modals visually polished and professional
- Loading states clear to users
- UI responsive on all screen sizes
- Meets WCAG accessibility guidelines
- Consistent with overall design system

**Dependencies**: All implementation tasks complete

**Estimated Effort**: 2 hours

---

## Summary

**Total Estimated Effort**: ~30 hours

**Critical Path**:
1. Backend validation (Phase 1) → 1.5 hours
2. Frontend shift open (Phase 2) → 3.25 hours
3. Frontend shift close (Phase 3) → 3.5 hours
4. Shift reports (Phase 4) → 6 hours
5. Testing (Phase 5) → 7.5 hours
6. Documentation and polish (Phase 6) → 9 hours

**Milestones**:
- **M1**: Backend validation complete (after Phase 1)
- **M2**: Shift open workflow functional (after Phase 2)
- **M3**: Shift close workflow functional (after Phase 3)
- **M4**: Complete shift lifecycle working (after Phase 4)
- **M5**: All tests passing (after Phase 5)
- **M6**: Production ready (after Phase 6)

**Risk Mitigation**:
- Start with backend validation to establish foundation
- Test each phase thoroughly before moving to next
- Maintain backward compatibility with existing orders
- Implement graceful degradation for API failures
- Regular progress reviews after each milestone
