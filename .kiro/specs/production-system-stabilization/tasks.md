# Production System Stabilization - Tasks

## Task 1: Bug Condition Exploration Tests
**Type:** Exploration
**Description:** Write property-based tests to confirm the 3 actual bugs exist in the current codebase before implementing fixes.

### Subtasks:
- [ ] 1.1: Test Bug #1 - Syntax error in system.js prevents parsing
- [ ] 1.2: Test Bug #3 - Export logs handler missing causes ReferenceError  
- [ ] 1.3: Test Bug #5 - Completion timestamp not set when orders reach ready/completed states

**Success Criteria:**
- Tests FAIL on unfixed code (confirming bugs exist)
- Counterexamples documented for each bug
- Tests ready to pass after fixes applied

---

## Task 2: Fix Bug #1 - System.js Syntax Error
**Type:** Implementation
**Description:** Remove extra `};` from system.js that prevents Activity Logs page from loading.

### Subtasks:
- [ ] 2.1: Locate and remove extra closing brace after PAGES.settings definition (~line 200)
- [ ] 2.2: Verify syntax with `node --check backoffice/frontend/js/pages/system.js`
- [ ] 2.3: Test Activity Logs page loads correctly
- [ ] 2.4: Test Settings page loads correctly

**Files Changed:**
- `backoffice/frontend/js/pages/system.js`

**Success Criteria:**
- JavaScript parses without errors
- Activity Logs page renders with data table
- Settings page renders with all controls
- No console errors on page load

---

## Task 3: Fix Bug #3 - Export Logs Handler
**Type:** Implementation
**Description:** Add export button and function to Activity Logs page in system.js.

### Subtasks:
- [ ] 3.1: Add "Export CSV" button to PAGES.actlogs HTML template
- [ ] 3.2: Implement `window.exportActivityLogs()` function
- [ ] 3.3: Add CSV generation logic with proper escaping
- [ ] 3.4: Test export with sample logs data
- [ ] 3.5: Test export with empty logs (error handling)

**Files Changed:**
- `backoffice/frontend/js/pages/system.js`

**Success Criteria:**
- Export button visible in Activity Logs page
- Clicking button downloads CSV file
- CSV contains correct headers and log data
- Empty logs shows error toast
- No ReferenceError thrown

---

## Task 4: Fix Bug #5 - Completion Timestamp
**Type:** Implementation
**Description:** Modify orders-api Edge Function to set completed_at when orders reach completion states.

### Subtasks:
- [ ] 4.1: Update update-status action to detect completion states (ready, completed)
- [ ] 4.2: Set completed_at timestamp when completion detected
- [ ] 4.3: Change updates type from Record<string,string> to Record<string,any>
- [ ] 4.4: Deploy Edge Function to Supabase
- [ ] 4.5: Test with real order status updates
- [ ] 4.6: Verify KDS Analytics shows correct prep times

**Files Changed:**
- `supabase/functions/orders-api/index.ts`

**Success Criteria:**
- Orders marked "ready" have completed_at set
- Orders marked "completed" have completed_at set  
- Non-completion states (preparing, pending) don't set completed_at
- KDS Analytics displays accurate prep times (not NULL or 0:00)
- Database queries show valid timestamps

---

## Task 5: Preservation Testing
**Type:** Verification
**Description:** Verify all existing functionality remains unchanged after fixes applied.

### Subtasks:
- [ ] 5.1: Test Settings operations (brand name, logo, QRIS, removal)
- [ ] 5.2: Test Activity Logs display and filtering
- [ ] 5.3: Test KDS queue retrieval and non-completion status updates
- [ ] 5.4: Test Order creation via POS
- [ ] 5.5: Test Authentication flows (admin and PIN login)
- [ ] 5.6: Run property-based preservation tests

**Success Criteria:**
- All settings operations work identically
- Activity Logs display unchanged
- KDS queue and status updates work (except completion timestamp - now fixed)
- Order creation flow unchanged
- Auth flows unchanged
- No regressions detected

---

## Task 6: Integration Testing
**Type:** Verification  
**Description:** Test complete workflows end-to-end with all fixes applied.

### Subtasks:
- [ ] 6.1: Full order lifecycle with timestamp tracking
- [ ] 6.2: Activity Logs end-to-end with export
- [ ] 6.3: Settings workflow with persistence check
- [ ] 6.4: KDS Analytics with real order data

**Success Criteria:**
- Order created → prepared → ready shows valid prep time in analytics
- Activity logs can be exported to CSV successfully
- QRIS upload persists across browser sessions
- KDS Analytics displays accurate kitchen performance metrics

---

## Task 7: Deployment
**Type:** Deployment
**Description:** Deploy all fixes to production environment.

### Subtasks:
- [ ] 7.1: Create branch codex/fix-phase1-critical-bugs
- [ ] 7.2: Commit system.js syntax fix
- [ ] 7.3: Commit export logs handler addition
- [ ] 7.4: Deploy orders-api Edge Function
- [ ] 7.5: Deploy frontend changes to Cloudflare Pages
- [ ] 7.6: Verify production deployment success
- [ ] 7.7: Monitor error logs for 24 hours

**Success Criteria:**
- All changes committed with clear messages
- Edge Function deployed successfully
- Frontend deployed to production
- No errors in production logs
- Manual smoke tests pass in production

---

**Estimated Total Time:** 40 minutes implementation + 30 minutes testing = 70 minutes

**Dependencies:**
- Task 2, 3, 4 can run in parallel after Task 1 confirms bugs
- Task 5 requires Tasks 2, 3, 4 complete
- Task 6 requires Task 5 complete
- Task 7 requires Task 6 complete
