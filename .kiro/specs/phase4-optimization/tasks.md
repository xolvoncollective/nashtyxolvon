# Phase 4: Optimization - Tasks

**Spec:** Performance & Quality Optimization  
**Dependencies:** Phase 1, 2, 3 Complete  
**Estimated Duration:** 2-3 weeks

---

## Task 1: Create Syntax Validation Script
**ID:** phase4-task-1  
**Dependencies:** None  
**Estimated:** 2 hours

### Description
Create automated JavaScript syntax validation script using Node.js `--check`.

### Implementation
1. Create `scripts/check-syntax.js`
2. Add glob pattern support for checking multiple files
3. Add to package.json scripts
4. Test with intentionally broken syntax

### Acceptance Criteria
- ✅ Script checks all JS files
- ✅ Exits with error code on syntax failures
- ✅ Provides clear error messages
- ✅ Can be run manually or via npm script

### Files
- `scripts/check-syntax.js` (create)
- `package.json` (modify - add script)

---

## Task 2: Add Pagination Helpers
**ID:** phase4-task-2  
**Dependencies:** None  
**Estimated:** 3 hours

### Description
Create reusable pagination utilities for consistent pagination across modules.

### Implementation
1. Create `utils/pagination.js`
2. Add `getMeta()` for pagination metadata
3. Add `render()` for pagination UI
4. Add CSS for pagination components

### Acceptance Criteria
- ✅ Pagination helper works with any dataset
- ✅ UI renders correctly
- ✅ Buttons disabled appropriately
- ✅ Compatible with existing styles

### Files
- `utils/pagination.js` (create)
- `backoffice/frontend/css/app.css` (modify - add pagination styles)

---

## Task 3: Add Performance Monitoring
**ID:** phase4-task-3  
**Dependencies:** None  
**Estimated:** 2 hours

### Description
Create performance measurement utilities for tracking slow operations.

### Implementation
1. Create `utils/performance.js`
2. Add `start()`, `end()`, `measure()` methods
3. Add `measureAsync()` for promises
4. Add examples in docs

### Acceptance Criteria
- ✅ Can measure sync operations
- ✅ Can measure async operations
- ✅ Minimal performance overhead
- ✅ Easy to use API

### Files
- `utils/performance.js` (create)

---

## Task 4: Optimize KDS Real-Time
**ID:** phase4-task-4  
**Dependencies:** None  
**Estimated:** 6 hours

### Description
Replace KDS polling with Supabase Real-Time subscriptions, keep polling as fallback.

### Implementation
1. Modify `kds/frontend/js/realtime.js`
2. Add Supabase channel subscription
3. Handle insert, update, delete events
4. Add reconnection logic
5. Keep polling as fallback
6. Test with multiple KDS instances

### Acceptance Criteria
- ✅ Real-time updates work instantly
- ✅ Polling used only as fallback
- ✅ Reconnects after network loss
- ✅ No duplicate order entries
- ✅ 80% reduction in API calls

### Files
- `kds/frontend/js/realtime.js` (modify)
- `kds/frontend/js/app.js` (modify - subscription setup)

---

## Task 5: Add Pagination to Products
**ID:** phase4-task-5  
**Dependencies:** phase4-task-2  
**Estimated:** 3 hours

### Description
Add pagination to products page to handle large product catalogs.

### Implementation
1. Modify `backoffice/frontend/js/pages/products.js`
2. Add page state tracking
3. Update API calls with limit/offset
4. Render pagination UI
5. Test with 100+ products

### Acceptance Criteria
- ✅ Products load in pages of 20
- ✅ Navigation works correctly
- ✅ Search/filter preserved across pages
- ✅ Performance improved on large datasets

### Files
- `backoffice/frontend/js/pages/products.js` (modify)

---

## Task 6: Add Pagination to Orders
**ID:** phase4-task-6  
**Dependencies:** phase4-task-2, phase4-task-5  
**Estimated:** 3 hours

### Description
Add pagination to orders listing for better performance.

### Implementation
1. Modify order listing pages
2. Add pagination to API queries
3. Render pagination UI
4. Test with 500+ orders

### Acceptance Criteria
- ✅ Orders load in pages of 50
- ✅ Navigation works
- ✅ Filters work with pagination
- ✅ Performance improved

### Files
- `backoffice/frontend/js/pages/orders.js` (modify if exists)
- POS order history pages (modify)

---

## Task 7: Add Pagination to Activity Logs
**ID:** phase4-task-7  
**Dependencies:** phase4-task-2  
**Estimated:** 2 hours

### Description
Add pagination to activity logs to handle large log volumes.

### Implementation
1. Modify `backoffice/frontend/js/pages/activity-logs.js`
2. Add page state
3. Update API calls
4. Render pagination
5. Test with 1000+ logs

### Acceptance Criteria
- ✅ Logs load in pages of 50
- ✅ Date filters work with pagination
- ✅ Export includes all pages
- ✅ Performance improved

### Files
- `backoffice/frontend/js/pages/activity-logs.js` (modify)

---

## Task 8: Create API Contract Tests
**ID:** phase4-task-8  
**Dependencies:** None  
**Estimated:** 4 hours

### Description
Create simple smoke tests for critical API endpoints.

### Implementation
1. Create `tests/api-contracts.test.js`
2. Add tests for:
   - orders-api (create, get, update)
   - settings-api (get, update)
   - analytics (basic KPIs)
3. Add npm script to run tests
4. Document how to run

### Acceptance Criteria
- ✅ Tests run against local Supabase
- ✅ Critical endpoints validated
- ✅ Fast execution (<10s)
- ✅ Clear pass/fail output

### Files
- `tests/api-contracts.test.js` (create)
- `package.json` (modify - add test script)

---

## Task 9: Add Pre-Commit Hook (Optional)
**ID:** phase4-task-9  
**Dependencies:** phase4-task-1  
**Estimated:** 1 hour

### Description
Add Git pre-commit hook to run syntax check automatically.

### Implementation
1. Create `.githooks/pre-commit`
2. Configure Git to use custom hooks directory
3. Test hook triggers on commit
4. Document setup

### Acceptance Criteria
- ✅ Hook runs on git commit
- ✅ Blocks commits with syntax errors
- ✅ Easy to bypass if needed
- ✅ Works on team machines

### Files
- `.githooks/pre-commit` (create)
- `README.md` (modify - document setup)

---

## Summary

**Total Tasks:** 9  
**Total Estimated Time:** 26 hours (~3-4 days)  
**Risk Level:** Low-Medium  
**Performance Impact:** High

**Execution Order:**
1. Utilities first (pagination, performance monitoring)
2. Syntax validation (quality gate)
3. KDS real-time (biggest impact)
4. Pagination rollout (incremental)
5. API contract tests (validation)
6. Pre-commit hook (automation)

**Success Metrics:**
- Syntax errors: 0 in production
- KDS API calls: -80%
- Page load time: -30% for large datasets
- Test coverage: 5+ critical endpoints
