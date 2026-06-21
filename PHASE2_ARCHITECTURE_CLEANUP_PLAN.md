# Phase 2: Architecture Cleanup - Execution Plan

**Date:** 2026-06-21  
**Status:** 🚧 IN PROGRESS  
**Goal:** Consolidate duplicate logic, establish single source of truth, improve maintainability

---

## Overview

Phase 2 addresses **architectural duplication and inconsistency** that accumulated during AI-assisted development. These issues don't break functionality but create maintenance burden, confusion, and future bugs.

**Key Changes:**
1. Consolidate duplicate API clients (KDS vs root)
2. Normalize auth session storage (6+ keys → unified approach)
3. Clarify settings source of truth
4. Remove duplicate Activity Logs implementation
5. Document order status ownership

---

## Batch 1: API Client Consolidation

### Current State
- **Root API client:** `/api-client.js` (main, comprehensive)
- **KDS duplicate:** `/kds/frontend/js/api.js` (separate implementation)
- **Problem:** Duplicate Supabase URL, auth headers, session restore, order status logic

### Changes Required

**Step 1.1: Make KDS use root api-client.js**

Files:
- `kds/frontend/index.html` - Add script tag for root api-client.js
- `kds/frontend/js/app.js` - Remove local API import
- `kds/frontend/js/orders.js` - Use global API object

**Step 1.2: Create KDS compatibility wrapper**

Add to `api-client.js`:
```javascript
// KDS-specific convenience methods (compatibility layer)
API.kds = API.kds || {};

API.kds.getQueue = async (outletId) => {
  return await API.orders.getAll({
    outletId,
    kitchenStatus: ['pending', 'preparing'],
    orderBy: 'created_at',
    order: 'asc'
  });
};

API.kds.updateStatus = async (orderId, status) => {
  return await API.orders.updateKitchenStatus(orderId, status);
};
```

**Step 1.3: Delete duplicate KDS API client**

- DELETE: `kds/frontend/js/api.js`
- UPDATE: All KDS files using local API to use global `window.API`

**Success Criteria:**
- ✅ KDS loads and displays orders
- ✅ KDS status updates work
- ✅ No duplicate Supabase connection code
- ✅ Single auth header management

---

## Batch 2: Auth Session Normalization

### Current State
**6+ localStorage keys for auth:**
- `nashty_session`
- `nashty_kds_session`
- `nashty_main_session`
- `nashty_token`
- `nashty_user`
- `nashty_outlet`

### Changes Required

**Step 2.1: Define unified session structure**

Add to `api-client.js`:
```javascript
API.session = {
  // Unified session object
  user: null,
  token: null,
  refreshToken: null,
  tenantId: null,
  outletId: null,
  shiftId: null,        // POS only
  role: null,
  expiresAt: null,
  
  save() {
    const key = this.role === 'kitchen' ? 'nashty_kds_session' : 'nashty_session';
    localStorage.setItem(key, JSON.stringify(this));
  },
  
  load() {
    // Try all legacy keys for backward compat
    const keys = ['nashty_session', 'nashty_kds_session', 'nashty_main_session'];
    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        Object.assign(this, JSON.parse(data));
        return true;
      }
    }
    return false;
  },
  
  clear() {
    // Clear all legacy keys
    const keys = [
      'nashty_session', 'nashty_kds_session', 'nashty_main_session',
      'nashty_token', 'nashty_user', 'nashty_outlet'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    
    // Reset object
    Object.assign(this, {
      user: null, token: null, refreshToken: null,
      tenantId: null, outletId: null, shiftId: null,
      role: null, expiresAt: null
    });
  },
  
  isValid() {
    if (!this.token || !this.expiresAt) return false;
    return Date.now() < this.expiresAt;
  }
};
```

**Step 2.2: Update login flows**

Files to update:
- `index.html` (main login)
- `pos/frontend/js/auth.js` (PIN login)
- `kds/frontend/js/app.js` (kitchen login)

Change pattern:
```javascript
// OLD:
localStorage.setItem('nashty_token', token);
localStorage.setItem('nashty_user', JSON.stringify(user));
localStorage.setItem('nashty_outlet', outletId);

// NEW:
API.session.user = userData;
API.session.token = accessToken;
API.session.refreshToken = refreshToken;
API.session.tenantId = userData.tenant_id;
API.session.outletId = userData.outlet_id;
API.session.role = userData.role;
API.session.expiresAt = Date.now() + (expirySeconds * 1000);
API.session.save();
```

**Step 2.3: Gradual migration**

- Keep legacy key reading for backward compatibility
- New logins use unified structure
- Old sessions migrate on next login

**Success Criteria:**
- ✅ All login flows use unified session
- ✅ Session persists across page reloads
- ✅ Logout clears all legacy keys
- ✅ Session validation consistent

---

## Batch 3: Settings Source of Truth

### Current State
**Conflicting settings storage:**
- `settings` table (some fields)
- `outlet_settings` table (referenced but may not exist)
- `outlets` table (has outlet-level fields)

### Changes Required

**Step 3.1: Database schema verification**

Check production database:
```sql
-- Check if outlet_settings exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'outlet_settings';

-- Check outlets table structure
\d outlets;
```

**Step 3.2: Define settings ownership**

| Setting Type | Owner Table | Access Method |
|--------------|-------------|---------------|
| Brand Name | outlets.name | API.outlets.get() |
| Brand Logo | outlets.logo_url | API.outletSettings.uploadLogo() |
| QRIS Static | outlets.qris_static_url | API.outletSettings.uploadQris() |
| Receipt Config | outlet_settings (key-value) | API.outletSettings.get/set() |
| Display Config | outlet_settings (key-value) | API.outletSettings.get/set() |

**Step 3.3: Create migration if needed**

If `outlet_settings` doesn't exist:
```sql
CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, key)
);

CREATE INDEX idx_outlet_settings_outlet ON outlet_settings(outlet_id);
```

**Step 3.4: Document in code**

Add comment block to api-client.js:
```javascript
/**
 * SETTINGS ARCHITECTURE
 * 
 * outlets table:
 *   - name (brand name)
 *   - logo_url (brand logo)
 *   - qris_static_url (payment QR)
 * 
 * outlet_settings table (key-value):
 *   - receipt_* (receipt configs)
 *   - display_* (customer display configs)
 *   - kds_* (kitchen display configs)
 */
```

**Success Criteria:**
- ✅ Settings ownership documented
- ✅ No conflicting storage paths
- ✅ All settings retrievable
- ✅ Migration idempotent

---

## Batch 4: Activity Logs Unification

### Current State
**Duplicate implementations:**
- `system.js` → `PAGES.actlogs` (legacy)
- `activity-logs.js` → `PAGES.activityLogs` (modern with export)

### Changes Required

**Step 4.1: Remove legacy implementation**

In `backoffice/frontend/js/pages/system.js`:
- Remove `PAGES.actlogs` function definition
- Keep export function `window.exportActivityLogs()` (used by modern version)

**Step 4.2: Update navigation**

In `backoffice/frontend/js/nav.js`:
- Ensure route points to `activity-logs` (modern implementation)
- Remove any references to legacy `actlogs`

**Step 4.3: Verify modern implementation**

Check `backoffice/frontend/js/pages/activity-logs.js`:
- Has export button ✅
- Has `window.activityLogsModule.exportLogs` ✅
- Also creates `window.exportActivityLogs` alias ✅

**Success Criteria:**
- ✅ Only one Activity Logs implementation
- ✅ Export button works
- ✅ Navigation consistent
- ✅ No duplicate page definitions

---

## Batch 5: Order Status Ownership Documentation

### Current State
**Unclear ownership:**
- POS sets order_status
- KDS sets kitchen_status
- Edge Functions update both
- Reports read both

### Changes Required

**Step 5.1: Document ownership rules**

Create `docs/ORDER_STATUS_ARCHITECTURE.md`:
```markdown
# Order Status Architecture

## Field Ownership

### order_status (POS owns)
- Values: pending, paid, completed, cancelled
- Updated by: POS frontend, orders-api Edge Function
- Represents: Payment and business completion state

### kitchen_status (KDS owns)
- Values: pending, preparing, ready, served, completed
- Updated by: KDS frontend, orders-api Edge Function
- Represents: Kitchen workflow state

## Lifecycle

1. **Order Created (POS)**
   - order_status: 'pending'
   - kitchen_status: 'pending'
   - created_at: NOW()
   - completed_at: NULL

2. **Payment Received (POS)**
   - order_status: 'paid'
   - kitchen_status: unchanged

3. **Kitchen Starts (KDS)**
   - kitchen_status: 'preparing'
   - order_status: unchanged

4. **Kitchen Completes (KDS)**
   - kitchen_status: 'ready' or 'served'
   - completed_at: NOW() ← Edge Function auto-sets
   - order_status: unchanged

5. **Order Fully Complete**
   - order_status: 'completed' (manual or automated)
   - kitchen_status: 'completed'
   - completed_at: already set

## Completion Detection

An order is "complete" when:
- kitchen_status IN ('ready', 'served', 'completed') AND completed_at IS NOT NULL

OR

- order_status = 'completed'

## Analytics Queries

Kitchen prep time:
```sql
SELECT 
  id,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 as prep_minutes
FROM orders
WHERE kitchen_status IN ('ready', 'served', 'completed')
  AND completed_at IS NOT NULL;
```
```

**Step 5.2: Add inline comments**

Update Edge Function:
```typescript
// ORDER STATUS OWNERSHIP:
// - order_status: POS business state (pending → paid → completed)
// - kitchen_status: KDS workflow state (pending → preparing → ready → served)
// See docs/ORDER_STATUS_ARCHITECTURE.md for details
```

**Success Criteria:**
- ✅ Ownership clearly documented
- ✅ Developers understand which system owns which field
- ✅ No conflicting updates

---

## Implementation Sequence

**Recommended order:**

1. **Batch 4** (Activity Logs) - 10 minutes
   - Lowest risk, purely frontend cleanup
   
2. **Batch 5** (Documentation) - 15 minutes
   - No code changes, just documentation
   
3. **Batch 3** (Settings) - 30 minutes
   - Database verification needed
   - May require migration
   
4. **Batch 2** (Auth Session) - 45 minutes
   - Medium risk, affects all modules
   - Backward compatible migration
   
5. **Batch 1** (API Consolidation) - 60 minutes
   - Highest risk, affects KDS operations
   - Requires thorough testing

**Total Estimated Time:** 2.5 hours

---

## Testing Strategy

### Per-Batch Testing

**After Batch 1 (API Consolidation):**
- [ ] KDS loads and shows orders
- [ ] KDS status updates work
- [ ] No console errors

**After Batch 2 (Auth Session):**
- [ ] All login types work
- [ ] Session persists on reload
- [ ] Logout clears everything

**After Batch 3 (Settings):**
- [ ] Settings CRUD operations work
- [ ] No duplicate storage

**After Batch 4 (Activity Logs):**
- [ ] Page loads correctly
- [ ] Export works

**After Batch 5 (Documentation):**
- [ ] Docs readable and accurate

### Full Regression Testing

After all batches complete:
- [ ] Full POS order flow
- [ ] Full KDS workflow
- [ ] Backoffice all pages
- [ ] Auth flows (admin, PIN, kitchen)
- [ ] Settings management
- [ ] Reports and analytics

---

## Deployment Plan

**Git Strategy:**
```bash
# Create feature branch
git checkout -b codex/phase2-architecture-cleanup

# Commit per batch
git commit -m "refactor(batch4): unify activity logs implementation"
git commit -m "docs(batch5): document order status ownership"
git commit -m "refactor(batch3): clarify settings source of truth"
git commit -m "refactor(batch2): normalize auth session storage"
git commit -m "refactor(batch1): consolidate api client"

# Push and deploy
git push origin codex/phase2-architecture-cleanup
```

**Deployment Gates:**
1. ✅ All batch tests pass
2. ✅ Full regression tests pass
3. ✅ Code review approved
4. ✅ Staging deployment successful
5. ✅ Production deployment during low-traffic window
6. ✅ Monitor for 24 hours

---

## Risk Mitigation

**Rollback Plan:**
- Each batch is a separate commit
- Can revert individual batches if issues arise
- Keep previous version tagged

**Monitoring:**
- Watch error logs for 24 hours post-deployment
- Monitor KDS operations closely (Batch 1 highest risk)
- Check auth flows across all user types (Batch 2)

**Fallback:**
- Batch 1: Revert to duplicate API client if KDS breaks
- Batch 2: Old sessions still readable (backward compat)
- Batch 3: No breaking changes (additive only)

---

## Success Metrics

**Code Quality:**
- Lines of duplicate code reduced by ~200
- Single source of truth established for API, auth, settings
- Documentation coverage increased

**Maintainability:**
- New features easier to add (one API client to update)
- Session bugs easier to debug (one structure)
- Settings changes predictable (clear ownership)

**Performance:**
- No performance regression
- May see slight improvement from reduced duplication

---

## Next Steps

After Phase 2 completion:

**Phase 3: Code Organization**
- Move business logic from page modules to services
- Normalize localStorage helper functions
- Evaluate Express backend removal

**Phase 4: Optimization**
- Add syntax validation scripts
- Add API contract smoke tests
- Reduce KDS polling frequency
- Add pagination to large datasets

---

**Plan Created:** 2026-06-21  
**Estimated Completion:** 2.5 hours implementation + testing  
**Risk Level:** Medium (carefully sequenced to minimize impact)
