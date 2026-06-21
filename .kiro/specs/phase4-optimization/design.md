# Phase 4: Optimization - Design

**Status:** Design Complete  
**Last Updated:** 2026-06-21

---

## Architecture Changes

### 1. Syntax Validation Pipeline

```
Git Pre-Commit Hook
  ↓
Syntax Checker Script
  ↓
ESLint (optional)
  ↓
✅ Pass → Allow Commit
❌ Fail → Block Commit
```

**Implementation:**
- Node.js `--check` flag for syntax validation
- Pre-commit hook runs checks automatically
- CI/CD integration (future)

---

### 2. KDS Real-Time Architecture

**Before (Polling):**
```
KDS Frontend
  ↓ (every 5s)
Poll API → Supabase
  ↓
Return all orders
```

**After (Real-Time):**
```
KDS Frontend
  ↓ (once)
Subscribe to orders table
  ↓
Supabase Realtime
  ↓ (on change)
Push updates to KDS
```

**Benefits:**
- 80-90% reduction in API calls
- Instant updates (<1s vs 5s max delay)
- Lower costs and battery usage

---

### 3. Pagination Pattern

**UI Pattern:**
```
┌──────────────────────────────────┐
│ Products List (1-20 of 543)      │
├──────────────────────────────────┤
│ ┌────┬────┬────┬────┬────┐      │
│ │ 1  │ 2  │ 3  │ 4  │ 5  │      │
│ └────┴────┴────┴────┴────┘      │
│                                   │
│ [< Prev]  Page 1 of 28  [Next >]│
└──────────────────────────────────┘
```

**API Pattern:**
```javascript
GET /products?page=1&limit=20
Response:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 543,
    totalPages: 28
  }
}
```

---

## Implementation Tasks

### Task 1: Syntax Validation Script

**File:** `scripts/check-syntax.js` (new)

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToCheck = [
  'api-client.js',
  'backoffice/frontend/js/**/*.js',
  'pos/frontend/js/**/*.js',
  'kds/frontend/js/**/*.js',
  'utils/**/*.js'
];

let errors = 0;

filesToCheck.forEach(pattern => {
  // Expand glob patterns
  const files = glob.sync(pattern);
  
  files.forEach(file => {
    try {
      execSync(`node --check ${file}`, { stdio: 'pipe' });
      console.log(`✅ ${file}`);
    } catch (e) {
      console.error(`❌ ${file}`);
      console.error(e.stderr.toString());
      errors++;
    }
  });
});

if (errors > 0) {
  console.error(`\n❌ ${errors} file(s) failed syntax check`);
  process.exit(1);
} else {
  console.log('\n✅ All files passed syntax check');
  process.exit(0);
}
```

**Usage:**
```bash
node scripts/check-syntax.js
```

---

### Task 2: KDS Real-Time Migration

**File:** `kds/frontend/js/realtime.js` (modify)

**Before:**
```javascript
// Poll every 5 seconds
setInterval(async () => {
  const orders = await API.kds.getQueue(outletId);
  updateUI(orders);
}, 5000);
```

**After:**
```javascript
// Subscribe to real-time updates
const subscription = supabase
  .channel('kds-orders')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `outlet_id=eq.${outletId}`
    },
    (payload) => {
      handleOrderChange(payload);
    }
  )
  .subscribe();

// Fallback polling (if real-time fails)
let pollInterval = null;
subscription.on('error', () => {
  console.warn('Realtime failed, falling back to polling');
  pollInterval = setInterval(pollOrders, 30000); // 30s fallback
});
```

---

### Task 3: Pagination Helpers

**File:** `utils/pagination.js` (new)

```javascript
const Pagination = {
  /**
   * Calculate pagination metadata
   */
  getMeta(total, page = 1, limit = 20) {
    const totalPages = Math.ceil(total / limit);
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  /**
   * Render pagination UI
   */
  render(meta, onPageChange) {
    const { page, totalPages, hasNext, hasPrev } = meta;
    
    return `
      <div class="pagination">
        <button 
          class="pg-btn ${!hasPrev ? 'disabled' : ''}" 
          ${!hasPrev ? 'disabled' : ''}
          onclick="${onPageChange}(${page - 1})">
          ← Prev
        </button>
        
        <span class="pg-info">Page ${page} of ${totalPages}</span>
        
        <button 
          class="pg-btn ${!hasNext ? 'disabled' : ''}"
          ${!hasNext ? 'disabled' : ''}
          onclick="${onPageChange}(${page + 1})">
          Next →
        </button>
      </div>
    `;
  }
};
```

---

### Task 4: API Contract Tests

**File:** `tests/api-contracts.test.js` (new)

```javascript
// Simple contract tests (no framework needed)
const API_BASE = 'http://localhost:54321/functions/v1';

const tests = {
  'orders-api: create order': async () => {
    const res = await fetch(`${API_BASE}/orders-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        tenantId: 'test',
        outletId: 'test',
        userId: 'test',
        items: [{ productId: 1, qty: 1, price: 10000 }],
        total: 10000
      })
    });
    const data = await res.json();
    
    assert(data.success === true, 'Should return success');
    assert(data.order, 'Should return order object');
    assert(data.order.id, 'Order should have ID');
    assert(data.orderNumber, 'Should return order number');
  },
  
  'settings-api: get settings': async () => {
    const res = await fetch(`${API_BASE}/settings/test-outlet`);
    const data = await res.json();
    
    assert(data.success === true, 'Should return success');
    assert(typeof data.settings === 'object', 'Should return settings object');
  }
};

// Run tests
Object.keys(tests).forEach(async (name) => {
  try {
    await tests[name]();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}:`, e.message);
  }
});
```

---

### Task 5: Performance Monitoring

**File:** `utils/performance.js` (new)

```javascript
const Performance = {
  marks: {},
  
  start(name) {
    this.marks[name] = performance.now();
  },
  
  end(name) {
    if (!this.marks[name]) {
      console.warn(`No mark found for: ${name}`);
      return 0;
    }
    const duration = performance.now() - this.marks[name];
    delete this.marks[name];
    return duration;
  },
  
  measure(name, fn) {
    this.start(name);
    const result = fn();
    const duration = this.end(name);
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return result;
  },
  
  async measureAsync(name, fn) {
    this.start(name);
    const result = await fn();
    const duration = this.end(name);
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return result;
  }
};

// Usage:
// Performance.measure('loadProducts', () => { ... });
// await Performance.measureAsync('fetchOrders', async () => { ... });
```

---

## File Organization After Phase 4

```
scripts/
  ├── check-syntax.js (NEW)
  ├── test-phase2-deployment.ps1 (existing)
  └── test-production-system.ps1 (existing)

utils/
  ├── storage.js (Phase 3)
  ├── pagination.js (NEW)
  └── performance.js (NEW)

tests/
  └── api-contracts.test.js (NEW)

kds/frontend/js/
  └── realtime.js (MODIFIED - real-time subscriptions)

backoffice/frontend/js/pages/
  ├── products.js (MODIFIED - pagination)
  ├── costs.js (MODIFIED - pagination)
  └── activity-logs.js (MODIFIED - pagination)
```

---

## Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **KDS API Calls** | 720/hour | <100/hour | 86% reduction |
| **Products Page Load** | 2-3s (1000 items) | <500ms (20 items) | 75% faster |
| **Orders Page Load** | 3-5s (500 orders) | <800ms (50 orders) | 80% faster |
| **Syntax Errors in Prod** | 2-3/month | 0 | 100% reduction |

---

## Testing Strategy

### Syntax Validation
- Run `node scripts/check-syntax.js` before commit
- Add to package.json scripts
- Future: Git pre-commit hook

### Real-Time Testing
- Test Supabase Realtime subscriptions
- Verify fallback polling works
- Test reconnection after network loss
- Load test with multiple KDS instances

### Pagination Testing
- Test edge cases (page 1, last page, empty results)
- Verify "Load More" UX
- Test with different dataset sizes

### API Contract Tests
- Run against local Supabase
- Test critical endpoints only
- Fast execution (<10s total)

---

## Backward Compatibility

- KDS polling kept as fallback (real-time can fail)
- Pagination optional (can load all with `?limit=9999`)
- Syntax checks don't modify code
- Performance helpers are additive

---

## Rollback Plan

- Real-time migration: Revert to polling (1 line change)
- Pagination: Remove limit param (API returns all)
- Syntax checks: Skip script if issues
- Each optimization independent and reversible
