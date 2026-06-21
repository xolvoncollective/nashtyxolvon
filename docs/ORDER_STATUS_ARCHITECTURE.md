# Order Status Architecture

**Last Updated:** 2026-06-21  
**Owner:** NASHTY OS Core Team

---

## Overview

NASHTY OS uses two separate status fields to track order lifecycle:
- **`order_status`** - Business/payment state (owned by POS)
- **`kitchen_status`** - Kitchen workflow state (owned by KDS)

This separation allows POS and KDS to operate independently while maintaining clear data ownership.

---

## Field Ownership

### order_status (POS Owns)

**Purpose:** Tracks payment and business completion state

**Possible Values:**
- `pending` - Order created, awaiting payment
- `paid` - Payment received
- `completed` - Order fully closed/fulfilled
- `cancelled` - Order cancelled

**Updated By:**
- POS frontend (`pos/frontend/js/orders.js`)
- `orders-api` Edge Function (action: `update-status`)

**Read By:**
- Reports and analytics
- Dashboard KPIs
- Business intelligence queries

---

### kitchen_status (KDS Owns)

**Purpose:** Tracks kitchen workflow and preparation state

**Possible Values:**
- `pending` - Waiting for kitchen to start
- `preparing` - Kitchen is working on order
- `ready` - Food ready for pickup/serving
- `served` - Food delivered to customer
- `completed` - Kitchen work finished

**Updated By:**
- KDS frontend (`kds/frontend/js/app.js`, `kds/frontend/js/orders.js`)
- `orders-api` Edge Function (action: `update-status`)

**Read By:**
- KDS displays
- Kitchen performance analytics
- Prep time calculations

---

## Order Lifecycle

### 1. Order Created (POS)
```javascript
{
  order_status: 'pending',
  kitchen_status: 'pending',
  created_at: NOW(),
  completed_at: NULL
}
```

**Trigger:** Customer places order in POS  
**Location:** `pos/frontend/js/orders.js` → `API.orders.create()`

---

### 2. Payment Received (POS)
```javascript
{
  order_status: 'paid',      // ← Changed
  kitchen_status: 'pending', // Unchanged
  completed_at: NULL
}
```

**Trigger:** Cashier processes payment  
**Location:** POS payment screen → `API.orders.updateStatus()`

---

### 3. Kitchen Starts Preparation (KDS)
```javascript
{
  order_status: 'paid',        // Unchanged
  kitchen_status: 'preparing', // ← Changed
  completed_at: NULL
}
```

**Trigger:** Chef marks order as "preparing" in KDS  
**Location:** KDS display → `API.orders.updateKitchenStatus()`

---

### 4. Kitchen Completes (KDS)
```javascript
{
  order_status: 'paid',    // Unchanged
  kitchen_status: 'ready', // ← Changed
  completed_at: NOW()      // ← Auto-set by Edge Function
}
```

**Trigger:** Chef marks order as "ready" in KDS  
**Location:** KDS display → `API.orders.updateKitchenStatus('ready')`  
**Important:** Edge Function **automatically sets `completed_at`** when `kitchen_status` becomes `'ready'`, `'served'`, or `'completed'`

---

### 5. Order Fully Complete
```javascript
{
  order_status: 'completed',  // ← Changed (manual or automated)
  kitchen_status: 'completed', // ← Changed
  completed_at: <timestamp>    // Already set in step 4
}
```

**Trigger:** Manual close-out or automated end-of-day process  
**Location:** Various (POS, backoffice reports, batch jobs)

---

## Completion Detection

### Definition of "Complete Order"

An order is considered **complete** when:

```sql
(kitchen_status IN ('ready', 'served', 'completed') AND completed_at IS NOT NULL)
OR
(order_status = 'completed')
```

**Why Two Conditions?**
- Some orders may be marked `order_status='completed'` without going through KDS (e.g., takeout paid but not prepared)
- KDS completion (`ready`, `served`) is the primary signal for kitchen performance metrics

---

## Timestamp Fields

### created_at
- **Set:** When order is created in POS
- **Never Changes:** Immutable
- **Used For:** Order age, prep time baseline, reporting periods

### completed_at
- **Set:** Automatically by Edge Function when `kitchen_status` becomes `'ready'`, `'served'`, or `'completed'`
- **Also Set:** When `order_status` becomes `'completed'`
- **Used For:** Kitchen prep time calculations, completion rate analytics
- **Implementation:** `supabase/functions/orders-api/index.ts` lines 153-164

**Important:** `completed_at` is **NOT** set when orders are just paid or pending. It only marks kitchen/operational completion.

---

## Analytics Queries

### Kitchen Prep Time
```sql
SELECT 
  id,
  order_number,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 AS prep_minutes
FROM orders
WHERE kitchen_status IN ('ready', 'served', 'completed')
  AND completed_at IS NOT NULL
  AND DATE(created_at) = CURRENT_DATE;
```

### Orders by Status
```sql
SELECT 
  order_status,
  kitchen_status,
  COUNT(*) as count
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY order_status, kitchen_status;
```

### Average Prep Time by Product
```sql
SELECT 
  p.name,
  AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 60) as avg_prep_minutes
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.kitchen_status IN ('ready', 'served', 'completed')
  AND o.completed_at IS NOT NULL
  AND DATE(o.created_at) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.name
ORDER BY avg_prep_minutes DESC;
```

---

## Edge Function Implementation

### orders-api: update-status Action

**File:** `supabase/functions/orders-api/index.ts`

**Automatic Timestamp Logic:**
```typescript
if (action === 'update-status') {
  const { orderId, orderStatus, kitchenStatus } = payload;
  
  const updates: Record<string, any> = {};
  if (orderStatus) updates.order_status = orderStatus;
  if (kitchenStatus) updates.kitchen_status = kitchenStatus;

  // ✅ Auto-set completed_at on completion states
  const completionStates = ['ready', 'served', 'completed'];
  const isKitchenComplete = kitchenStatus && completionStates.includes(kitchenStatus);
  const isOrderComplete = orderStatus === 'completed';
  
  if (isKitchenComplete || isOrderComplete) {
    updates.completed_at = new Date().toISOString();
  }

  // Update database...
}
```

**Key Points:**
- Completion timestamp is **automatic** - frontend doesn't need to send it
- Once set, `completed_at` is **not cleared** even if status reverts (idempotent)
- Both `kitchen_status` and `order_status` completion states trigger the timestamp

---

## API Methods

### Update Order Status (POS)
```javascript
await API.orders.updateStatus(orderId, {
  orderStatus: 'paid'  // or 'completed', 'cancelled'
});
```

### Update Kitchen Status (KDS)
```javascript
await API.orders.updateKitchenStatus(orderId, 'ready');
// completed_at will be auto-set by Edge Function
```

### Get KDS Queue
```javascript
const orders = await API.orders.getAll({
  outletId: 'outlet-uuid',
  kitchenStatus: ['pending', 'preparing'],
  orderBy: 'created_at',
  order: 'asc'
});
```

---

## Common Patterns

### Pattern 1: POS Order Flow
```
1. Create order         → order_status='pending', kitchen_status='pending'
2. Process payment      → order_status='paid'
3. [Kitchen works]      → kitchen_status='preparing'
4. [Kitchen completes]  → kitchen_status='ready', completed_at=NOW()
5. Customer receives    → kitchen_status='served'
```

### Pattern 2: Takeout/Skip Kitchen
```
1. Create order  → order_status='pending', kitchen_status='pending'
2. Pay & collect → order_status='completed', completed_at=NOW()
(kitchen_status may stay 'pending' or be updated to 'completed')
```

### Pattern 3: Cancelled Order
```
1. Create order  → order_status='pending'
2. Cancel        → order_status='cancelled'
(kitchen_status may remain 'pending' or update to 'cancelled')
```

---

## Status Transition Rules

### Valid Transitions

**order_status:**
- `pending` → `paid` ✅
- `pending` → `cancelled` ✅
- `paid` → `completed` ✅
- `paid` → `cancelled` ✅ (refund scenario)

**kitchen_status:**
- `pending` → `preparing` ✅
- `preparing` → `ready` ✅
- `ready` → `served` ✅
- `served` → `completed` ✅
- Any → `cancelled` ✅ (cancellation override)

### Invalid/Discouraged Transitions

- `completed` → `pending` ❌ (reopening orders not supported)
- `cancelled` → `paid` ❌ (must create new order)
- Skipping states (e.g., `pending` → `ready`) ⚠️ (breaks analytics, avoid)

---

## Troubleshooting

### Problem: Prep time showing NULL or 0:00

**Cause:** `completed_at` is NULL for completed orders

**Check:**
```sql
SELECT id, kitchen_status, completed_at 
FROM orders 
WHERE kitchen_status IN ('ready', 'served', 'completed') 
  AND completed_at IS NULL;
```

**Solution:** Ensure Edge Function has completion timestamp logic (should already be implemented as of 2026-06-21)

---

### Problem: Orders stuck in "preparing" state

**Cause:** KDS not updating status to "ready"

**Check:** KDS display workflow, network connectivity, auth tokens

**Manual Fix:**
```sql
UPDATE orders 
SET kitchen_status = 'ready', 
    completed_at = NOW() 
WHERE id = '<order-id>';
```

---

### Problem: Duplicate completion timestamps

**Cause:** Multiple status updates to completion states

**Behavior:** Idempotent - timestamp doesn't change after first set

**No Action Needed:** This is expected behavior

---

## Migration Notes

### Pre-2026-06-21 Orders

Orders created before the completion timestamp fix may have:
- `kitchen_status='ready'` but `completed_at IS NULL`
- This causes NULL prep times in analytics

**Backfill Script (if needed):**
```sql
UPDATE orders
SET completed_at = updated_at  -- Use updated_at as approximation
WHERE kitchen_status IN ('ready', 'served', 'completed')
  AND completed_at IS NULL
  AND created_at < '2026-06-21';
```

---

## References

**Related Files:**
- `supabase/functions/orders-api/index.ts` - Edge Function with completion timestamp logic
- `api-client.js` - API.orders methods
- `pos/frontend/js/orders.js` - POS order creation and status updates
- `kds/frontend/js/app.js` - KDS status updates
- `backoffice/frontend/js/pages/kds.js` - KDS analytics dashboard

**Related Docs:**
- `REFACTOR_PLAN.md` - Phase 1, Bug #5: Completion Timestamp
- `PHASE1_VERIFICATION_REPORT.md` - Verification that fix is applied
- `DATABASE_MAP.md` - Full database schema documentation

---

**Document Version:** 1.0  
**Last Reviewed:** 2026-06-21  
**Next Review:** 2026-09-21 (quarterly)
