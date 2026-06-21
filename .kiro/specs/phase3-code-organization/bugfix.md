# Phase 3: Code Organization

**Type:** Refactoring  
**Priority:** Medium  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** Phase 1 & 2 Complete

---

## Overview

Phase 3 focuses on organizing code structure to improve maintainability and reduce coupling between UI and business logic. This phase moves business logic from page modules into service layers, normalizes localStorage usage, and clarifies the backend architecture.

---

## Goals

1. **Service Layer Extraction:** Move business logic from page files to reusable service methods
2. **Storage Normalization:** Create consistent localStorage helper functions across modules
3. **Backend Clarification:** Document Express backend role vs Edge Functions

---

## Problems to Solve

### Problem 1: Business Logic in View Layer
**Current State:**
- Page modules (`backoffice/frontend/js/pages/*.js`) directly perform:
  - Database writes via API calls
  - localStorage manipulation
  - Business rule enforcement
  - Data transformation

**Impact:**
- Difficult to test business logic independently
- Code duplication across pages
- Inconsistent error handling
- Hard to maintain data consistency

**Example:**
```javascript
// In system.js - Business logic mixed with UI
window.saveBranding = async () => {
  const brandName = document.getElementById('brandName').value;
  if (!brandName) return toast('Nama brand tidak boleh kosong', 'err');
  
  const settings = { brandName };
  try {
    const res = await API.request('/settings/' + API.session.outletId, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    // ... more business logic
  } catch (e) {
    toast('Terjadi kesalahan', 'err');
  }
};
```

### Problem 2: Inconsistent localStorage Usage
**Current State:**
- Different modules use different localStorage key patterns:
  - Auth: `nashty_session`, `user_data`, `session_token`, etc.
  - CRM: `crm_customers`, `crm_filter_*`
  - Cost: `costs_data`, `cost_categories`
  - POS: `pos_cart`, `pos_favorites`
  - KDS: `kds_settings`, `kds_sound_enabled`

**Impact:**
- Hard to track what's stored where
- Risk of key collisions
- Difficult to debug storage issues
- Inconsistent expiration/cleanup

### Problem 3: Backend Architecture Unclear
**Current State:**
- `backoffice/backend/` contains Express server with routes
- Production uses Supabase Edge Functions
- Unclear if Express is used or legacy

**Impact:**
- Confusion about which backend to modify
- Potential duplicate route maintenance
- Unclear deployment path

---

## Scope

### In Scope
- Extract business logic to service layer in `api-client.js`
- Create localStorage helper utilities
- Document backend architecture (no code changes)
- Maintain 100% backward compatibility

### Out of Scope
- Changing UI/UX behavior
- Modifying API contracts
- Deleting Express backend (documentation only)
- Database schema changes

---

## Success Criteria

1. ✅ Business logic methods extracted to service layer
2. ✅ localStorage access uses helper functions
3. ✅ Page modules only handle UI rendering and event binding
4. ✅ Backend architecture documented
5. ✅ All existing features work identically
6. ✅ Code is easier to test and maintain

---

## Risk Assessment

**Overall Risk:** Medium

**Risks:**
- **Regression Risk (Medium):** Extracting logic may introduce subtle bugs
- **Session Migration Risk (Low):** localStorage helpers need backward compatibility
- **Testing Burden (Medium):** Each extracted method needs verification

**Mitigation:**
- Extract incrementally, one module at a time
- Maintain backward-compatible localStorage access
- Test each extraction thoroughly before next
- Keep page-level APIs unchanged

---

## Non-Goals

- Not changing database schema
- Not modifying Edge Function APIs
- Not refactoring CSS/styling
- Not adding new features
