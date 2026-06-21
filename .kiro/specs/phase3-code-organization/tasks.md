# Phase 3: Code Organization - Tasks

**Spec:** Code Organization Refactoring  
**Dependencies:** Phase 1 & 2 Complete  
**Estimated Duration:** 1-2 weeks

---

## Task 1: Create Storage Helper Module
**ID:** phase3-task-1  
**Dependencies:** None  
**Estimated:** 2 hours

### Description
Create centralized localStorage helper with consistent API and namespacing.

### Implementation
1. Create `utils/storage.js` with helper methods
2. Add backward compatibility for existing keys
3. Add module-specific scoped helpers
4. Add tests for storage helpers

### Acceptance Criteria
- ✅ Storage.get(), set(), remove(), clearAll() work
- ✅ Storage.scope() creates module-specific helpers
- ✅ Backward compatible with existing localStorage keys
- ✅ Error handling for quota exceeded

### Files
- `utils/storage.js` (create)

---

## Task 2: Document Backend Architecture
**ID:** phase3-task-2  
**Dependencies:** None  
**Estimated:** 1 hour

### Description
Create documentation clarifying Express backend vs Edge Functions.

### Implementation
1. Create `docs/BACKEND_ARCHITECTURE.md`
2. Document Edge Functions as production backend
3. Mark Express backend as legacy/development only
4. List all active Edge Functions with purposes

### Acceptance Criteria
- ✅ Clear guidance on which backend to modify
- ✅ Express marked as legacy
- ✅ Edge Functions documented

### Files
- `docs/BACKEND_ARCHITECTURE.md` (create)

---

## Task 3: Extract Settings Service
**ID:** phase3-task-3  
**Dependencies:** phase3-task-1  
**Estimated:** 3 hours

### Description
Extract settings business logic from `system.js` to `API.settings` service.

### Implementation
1. Add `API.settings` methods to `api-client.js`:
   - `saveBranding(outletId, brandName)`
   - `uploadLogo(outletId, file)`
2. Simplify `system.js` to call service methods
3. Maintain exact same UI behavior
4. Test settings save/load

### Acceptance Criteria
- ✅ Settings service methods work
- ✅ Page module simplified
- ✅ No behavior changes
- ✅ Error handling consistent

### Files
- `api-client.js` (modify - add API.settings)
- `backoffice/frontend/js/pages/system.js` (modify - simplify)

---

## Task 4: Extract Products Service
**ID:** phase3-task-4  
**Dependencies:** phase3-task-3  
**Estimated:** 4 hours

### Description
Extract product management logic to `API.products` service.

### Implementation
1. Add `API.products` methods to `api-client.js`:
   - `create(productData)`
   - `update(id, updates)`
   - `delete(id)`
   - `list(filters)`
2. Simplify `products.js` to call service methods
3. Add validation in service layer
4. Test product CRUD operations

### Acceptance Criteria
- ✅ Products service methods work
- ✅ Validation logic centralized
- ✅ Page module simplified
- ✅ No regressions

### Files
- `api-client.js` (modify - add API.products)
- `backoffice/frontend/js/pages/products.js` (modify - simplify)

---

## Task 5: Extract Costs Service
**ID:** phase3-task-5  
**Dependencies:** phase3-task-4  
**Estimated:** 3 hours

### Description
Extract cost management logic to `API.costs` service.

### Implementation
1. Add `API.costs` methods to `api-client.js`:
   - `create(costData)`
   - `update(id, updates)`
   - `delete(id)`
   - `list(filters)`
2. Simplify `costs.js` to call service methods
3. Test cost CRUD operations

### Acceptance Criteria
- ✅ Costs service methods work
- ✅ Page module simplified
- ✅ No regressions

### Files
- `api-client.js` (modify - add API.costs)
- `backoffice/frontend/js/pages/costs.js` (modify - simplify)

---

## Task 6: Extract CRM Service
**ID:** phase3-task-6  
**Dependencies:** phase3-task-5  
**Estimated:** 4 hours

### Description
Extract CRM logic to `API.crm` service.

### Implementation
1. Add `API.crm` methods to `api-client.js`:
   - `createCustomer(customerData)`
   - `updateCustomer(id, updates)`
   - `deleteCustomer(id)`
   - `listCustomers(filters)`
2. Simplify `crm.js` to call service methods
3. Test CRM operations

### Acceptance Criteria
- ✅ CRM service methods work
- ✅ Page module simplified
- ✅ No regressions

### Files
- `api-client.js` (modify - add API.crm)
- `backoffice/frontend/js/pages/crm.js` (modify - simplify)

---

## Task 7: Migrate localStorage Usage
**ID:** phase3-task-7  
**Dependencies:** phase3-task-1, phase3-task-6  
**Estimated:** 6 hours

### Description
Replace direct localStorage calls with Storage helpers across all modules.

### Implementation
1. Migrate auth-related localStorage
2. Migrate POS localStorage
3. Migrate CRM localStorage
4. Migrate KDS localStorage
5. Test each module after migration
6. Keep backward compatibility fallbacks

### Acceptance Criteria
- ✅ All modules use Storage helpers
- ✅ Backward compatibility maintained
- ✅ No session loss on migration
- ✅ All features work identically

### Files
- `api-client.js` (modify - use Storage)
- `backoffice/frontend/js/pages/*.js` (modify - use Storage)
- `pos/frontend/js/*.js` (modify - use Storage)
- `kds/frontend/js/*.js` (modify - use Storage)
- `crm/frontend/js/*.js` (modify - use Storage)

---

## Summary

**Total Tasks:** 7  
**Total Estimated Time:** 23 hours (~3 days)  
**Risk Level:** Medium  
**Backward Compatibility:** 100% maintained

**Execution Order:**
1. Storage helpers (foundation)
2. Backend docs (no risk)
3. Settings service (smallest, test pattern)
4. Products service (larger)
5. Costs service (similar)
6. CRM service (largest)
7. localStorage migration (gradual)

**Success Metrics:**
- Page modules <200 lines each
- Business logic testable independently
- localStorage access consistent
- Zero functional regressions
