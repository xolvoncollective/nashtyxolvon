# Phase 3: Code Organization - Design

**Status:** Design Complete  
**Last Updated:** 2026-06-21

---

## Architecture Changes

### 1. Service Layer Pattern

**Principle:** Separate concerns between UI (pages) and business logic (services)

```
┌─────────────────────────────────────────┐
│         Page Modules (View Layer)       │
│  - Render HTML                          │
│  - Handle user events                   │
│  - Call service methods                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  - Data validation                      │
│  - API calls                            │
│  - Storage operations                   │
│  - Error handling                       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Data Layer (API/Storage)           │
│  - Supabase Edge Functions              │
│  - localStorage                         │
│  - Session management                   │
└─────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Create Storage Helper Module

**File:** `utils/storage.js` (new)

**Purpose:** Centralize localStorage access with consistent patterns

**API Design:**
```javascript
// Storage helper with namespacing
const Storage = {
  // Get with optional default
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(`nashty_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  // Set with automatic serialization
  set(key, value) {
    try {
      localStorage.setItem(`nashty_${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  // Remove
  remove(key) {
    localStorage.removeItem(`nashty_${key}`);
  },
  
  // Clear all nashty keys
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('nashty_'))
      .forEach(k => localStorage.removeItem(k));
  },
  
  // Scoped storage for modules
  scope(prefix) {
    return {
      get: (k, d) => Storage.get(`${prefix}_${k}`, d),
      set: (k, v) => Storage.set(`${prefix}_${k}`, v),
      remove: (k) => Storage.remove(`${prefix}_${k}`)
    };
  }
};

// Module-specific scopes
const AuthStorage = Storage.scope('auth');
const POSStorage = Storage.scope('pos');
const CRMStorage = Storage.scope('crm');
const KDSStorage = Storage.scope('kds');
```

**Migration Strategy:**
- Keep existing keys working (backward compatibility)
- New code uses helpers
- Gradual migration of existing code

---

### Task 2: Extract Settings Service

**Target:** `backoffice/frontend/js/pages/system.js`

**Before:**
```javascript
window.saveBranding = async () => {
  const brandName = document.getElementById('brandName').value;
  if (!brandName) return toast('Nama brand tidak boleh kosong', 'err');
  
  const settings = { brandName };
  try {
    const res = await API.request('/settings/' + API.session.outletId, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    if (res.success) {
      toast('Branding berhasil disimpan');
      document.querySelectorAll('.sb-brand-name').forEach(e => e.textContent = brandName);
    } else {
      toast('Gagal menyimpan branding', 'err');
    }
  } catch (e) {
    toast('Terjadi kesalahan', 'err');
  }
};
```

**After:**
```javascript
// In api-client.js
API.settings = {
  async saveBranding(outletId, brandName) {
    if (!brandName) throw new Error('Brand name required');
    const res = await API.request(`/settings/${outletId}`, {
      method: 'PUT',
      body: JSON.stringify({ settings: { brandName } })
    });
    if (!res.success) throw new Error(res.error || 'Save failed');
    return res;
  }
};

// In system.js (simplified)
window.saveBranding = async () => {
  const brandName = document.getElementById('brandName').value;
  try {
    await API.settings.saveBranding(API.session.outletId, brandName);
    toast('Branding berhasil disimpan');
    document.querySelectorAll('.sb-brand-name').forEach(e => e.textContent = brandName);
  } catch (e) {
    toast(e.message, 'err');
  }
};
```

**Benefits:**
- Business logic testable independently
- Error handling consistent
- Reusable across modules

---

### Task 3: Normalize localStorage Access

**Target:** All modules using direct `localStorage` calls

**Changes:**
1. Replace direct localStorage with Storage helpers
2. Migrate existing keys to namespaced format (with fallback)
3. Add expiration support where needed

**Example Migration:**
```javascript
// Before
localStorage.setItem('nashty_qris_static', qrisUrl);
const qris = localStorage.getItem('nashty_qris_static');

// After
Storage.set('qris_static', qrisUrl);
const qris = Storage.get('qris_static');
```

---

### Task 4: Extract Business Logic to Services

**Targets:**
- `system.js` → `API.settings.*`
- `products.js` → `API.products.*`
- `costs.js` → `API.costs.*`
- `crm.js` → `API.crm.*`

**Pattern:**
```javascript
// Service method in api-client.js
API.products = {
  async create(productData) {
    // Validation
    if (!productData.name) throw new Error('Name required');
    if (!productData.price || productData.price < 0) throw new Error('Valid price required');
    
    // API call
    const res = await API.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    
    if (!res.success) throw new Error(res.error || 'Create failed');
    return res.product;
  },
  
  async update(id, updates) { /* ... */ },
  async delete(id) { /* ... */ },
  async list(filters = {}) { /* ... */ }
};

// Page module just calls service
window.createProduct = async () => {
  const data = getFormData(); // UI helper
  try {
    const product = await API.products.create(data);
    toast('Product created');
    refreshProductList();
  } catch (e) {
    toast(e.message, 'err');
  }
};
```

---

### Task 5: Document Backend Architecture

**File:** `docs/BACKEND_ARCHITECTURE.md` (new)

**Content:**
```markdown
# Backend Architecture

## Production Backend: Supabase Edge Functions

**Location:** `supabase/functions/`
**Environment:** Cloudflare Pages + Supabase
**Purpose:** Production API for all modules

**Active Functions:**
- `orders-api` - POS/KDS order operations
- `settings-api` - Outlet settings CRUD
- `qris-upload` - QRIS static image upload
- `receipt-settings` - Receipt configuration
- `display-settings` - Customer display config
- `favorites` - Favorite products
- `analytics` - Dashboard/reports KPIs

## Development Backend: Express (Legacy)

**Location:** `backoffice/backend/`
**Status:** LEGACY - Not used in production
**Purpose:** Local development only (optional)

**Notes:**
- Routes duplicate Edge Function functionality
- Can be removed or archived
- Use Edge Functions for new features
- Do NOT deploy Express to production
```

---

## File Organization After Phase 3

```
api-client.js
  ├── API.auth (existing)
  ├── API.session (existing)
  ├── API.orders (existing)
  ├── API.kds (existing)
  ├── API.settings (NEW)
  ├── API.products (NEW)
  ├── API.costs (NEW)
  ├── API.crm (NEW)
  └── API.outletSettings (existing)

utils/
  └── storage.js (NEW)
      ├── Storage.get()
      ├── Storage.set()
      ├── Storage.remove()
      ├── Storage.clearAll()
      └── Storage.scope()

docs/
  └── BACKEND_ARCHITECTURE.md (NEW)

backoffice/frontend/js/pages/
  ├── system.js (SIMPLIFIED - UI only)
  ├── products.js (SIMPLIFIED - UI only)
  ├── costs.js (SIMPLIFIED - UI only)
  └── crm.js (SIMPLIFIED - UI only)
```

---

## Backward Compatibility

### localStorage Migration
```javascript
// Helper reads old key first, then new key
Storage.get = function(key, defaultValue) {
  // Try new namespaced key first
  let val = localStorage.getItem(`nashty_${key}`);
  
  // Fallback to old key if exists
  if (!val) {
    const oldKey = legacyKeyMap[key];
    if (oldKey) {
      val = localStorage.getItem(oldKey);
      // Migrate to new key if found
      if (val) {
        localStorage.setItem(`nashty_${key}`, val);
      }
    }
  }
  
  return val ? JSON.parse(val) : defaultValue;
};
```

### Service Method Compatibility
- All extracted services maintain exact same behavior
- Error messages may improve but functionality identical
- No API contract changes

---

## Testing Strategy

### Unit Tests (New)
- Test storage helpers independently
- Test service methods with mocked API
- Verify validation logic

### Integration Tests
- Test page → service → API flow
- Verify localStorage migration
- Test error handling

### Manual Tests
- Settings save/load
- Product CRUD
- Cost management
- CRM operations
- Verify no regressions

---

## Implementation Order

1. **Create utils/storage.js** (foundation)
2. **Document backend** (no code risk)
3. **Extract API.settings** (smallest, test pattern)
4. **Extract API.products** (more complex)
5. **Extract API.costs** (similar to products)
6. **Extract API.crm** (largest)
7. **Migrate localStorage** (gradual, page by page)

---

## Success Metrics

- ✅ Code duplication reduced
- ✅ Business logic testable
- ✅ localStorage access consistent
- ✅ Page modules <200 lines each
- ✅ Service methods have clear contracts
- ✅ Zero regressions in functionality

---

## Rollback Plan

Each task is independent:
- Storage.js can be removed without affecting existing code
- Service methods wrap existing API calls (safe)
- Documentation is additive only

If issues found, revert specific commit without affecting others.
