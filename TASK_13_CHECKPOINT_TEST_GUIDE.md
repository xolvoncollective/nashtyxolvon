# Task 13: POS → KDS Order Flow Checkpoint Test Guide

## Overview
This is a manual testing checkpoint to verify the end-to-end order flow from POS to KDS. The test ensures that orders created in the POS appear in the KDS within 5 seconds and that status updates work correctly.

## Prerequisites
✅ Backend server is running on port 3099  
✅ Health check endpoint returns "healthy"  
✅ Database is initialized and seeded  

## Test Setup

### Step 1: Open Two Browser Windows

1. **Window 1 - POS Terminal**
   - Open: `http://localhost:3099/pos`
   - Login with default PIN: `1234`
   - Navigate to POS terminal

2. **Window 2 - KDS Display**
   - Open: `http://localhost:3099/kds`
   - Login with default PIN: `1234`
   - KDS should start polling for orders automatically

**Tip:** Use browser's "Tile/Snap" feature to view both windows side-by-side

## Test Scenarios

### Scenario 1: Basic Order Creation & Display

**Expected Result:** Order appears in KDS within 5 seconds

1. **In POS Window:**
   - Select order type: `Dine-In`
   - Enter table number: `T01`
   - Add 2-3 menu items to cart (e.g., "Nasi Goreng", "Es Teh Manis")
   - Click "Bayar" (Payment) button
   - Select payment method: `Tunai` (Cash)
   - Enter amount or click "UANG PAS" (Exact Amount)
   - Click "Konfirmasi" (Confirm)
   - Wait for success message

2. **In KDS Window:**
   - **Within 5 seconds**, a new order card should appear
   - Verify order shows:
     - ✓ Order number (e.g., SNY-0601-001)
     - ✓ Table number (T01)
     - ✓ Order type (Dine In)
     - ✓ All items from POS cart
     - ✓ Timer starts running (showing elapsed time)
     - ✓ Status shows "Pending" or "Active"

**Pass Criteria:**  
- [ ] Order appears in KDS within 5 seconds  
- [ ] All order details match POS  
- [ ] Timer is running correctly

---

### Scenario 2: Order with Modifiers

**Expected Result:** Modifiers and add-ons display correctly in KDS

1. **In POS Window:**
   - Add a menu item that has modifiers (e.g., "Ayam Bakar")
   - Select modifiers:
     - Choose "Pedas Extra" (Spice Level)
     - Add "+Extra Sambal" (Add-on)
   - Add quantity: `2`
   - Click "Bayar" and complete payment

2. **In KDS Window:**
   - Verify new order shows:
     - ✓ Item quantity: 2x
     - ✓ Modifier badges displayed (e.g., "Pedas Extra")
     - ✓ Add-on badges displayed (e.g., "+Extra Sambal")

**Pass Criteria:**  
- [ ] Modifiers appear correctly  
- [ ] Add-ons appear correctly  
- [ ] Quantity is correct

---

### Scenario 3: Order Status Update (Preparing)

**Expected Result:** Status changes from Pending to Preparing

1. **In KDS Window:**
   - Locate the most recent order card
   - Click or swipe the card to mark as "Preparing"
   - (Implementation may use button click or swipe gesture)

2. **Verify:**
   - ✓ Card visual changes (color/badge updates)
   - ✓ Status badge shows "Preparing"
   - ✓ Card remains in active queue
   - ✓ Timer continues running

**Pass Criteria:**  
- [ ] Status updates to "Preparing"  
- [ ] Visual feedback is immediate  
- [ ] No errors in browser console

---

### Scenario 4: Order Status Update (Ready)

**Expected Result:** Order marked as ready and removed from queue

1. **In KDS Window:**
   - Click/swipe the same order to mark as "Ready"

2. **Verify:**
   - ✓ Card animates out (fade/slide animation)
   - ✓ Card is removed from active queue after animation
   - ✓ Order no longer appears in pending/preparing list

**Pass Criteria:**  
- [ ] Status updates to "Ready"  
- [ ] Card is removed from KDS queue  
- [ ] Animation completes smoothly

---

### Scenario 5: Multiple Concurrent Orders

**Expected Result:** All orders appear and can be managed independently

1. **In POS Window:**
   - Create Order #1: 1x Item A, Table T02
   - Complete payment
   - Immediately create Order #2: 2x Item B, Table T03
   - Complete payment
   - Create Order #3: 3x Item C, Takeaway
   - Complete payment

2. **In KDS Window:**
   - Verify all 3 orders appear within 5 seconds
   - Orders should be sorted by creation time (oldest first)

3. **Test Status Updates:**
   - Mark Order #2 as "Preparing" → verify only Order #2 changes
   - Mark Order #1 as "Ready" → verify Order #1 is removed
   - Mark Order #3 as "Preparing" → verify Order #3 changes

**Pass Criteria:**  
- [ ] All 3 orders appear correctly  
- [ ] Orders are independent (updating one doesn't affect others)  
- [ ] Sorting is correct (oldest first)

---

### Scenario 6: KDS Polling Resilience

**Expected Result:** KDS continues polling and recovers from interruptions

1. **Test Continuous Polling:**
   - Keep KDS window open for 1 minute without creating orders
   - Monitor browser console (F12 → Console tab)
   - Verify: GET requests to `/api/orders/kitchen/queue` occur every 5 seconds

2. **Test Network Recovery:**
   - Open browser DevTools (F12)
   - Go to Network tab → Enable "Offline" mode for 15 seconds
   - Re-enable network
   - Create a new order in POS
   - Verify: Order appears in KDS after network is restored

**Pass Criteria:**  
- [ ] Polling occurs every 5 seconds consistently  
- [ ] No errors during normal polling  
- [ ] KDS recovers when network is restored  
- [ ] Offline banner appears when disconnected (if implemented)

---

## Test Checklist Summary

### Order Creation Flow
- [ ] Order created in POS appears in KDS within 5 seconds
- [ ] Order number is generated correctly (format: SNY-MMDD-NNN)
- [ ] Table number/order type displays correctly
- [ ] Cashier name displays correctly
- [ ] All items appear in correct quantities

### Modifiers & Add-ons
- [ ] Modifiers are displayed in KDS
- [ ] Add-ons are displayed with "+" prefix
- [ ] Multiple modifiers per item work correctly

### Status Updates
- [ ] "Preparing" status updates immediately
- [ ] "Ready" status removes card from queue
- [ ] Status updates are persisted (refresh KDS shows correct status)
- [ ] Visual feedback is clear and immediate

### Performance
- [ ] Orders appear within 5 seconds (95% of the time)
- [ ] Polling interval is exactly 5 seconds
- [ ] No memory leaks after 30+ minutes
- [ ] Browser console shows no errors

### Concurrent Operations
- [ ] Multiple orders can exist simultaneously
- [ ] Status updates are independent per order
- [ ] Order sorting is correct (oldest first)

---

## Troubleshooting

### Issue: Order doesn't appear in KDS

**Check:**
1. Open browser console (F12) in KDS window
2. Look for polling requests: `GET /api/orders/kitchen/queue`
3. Check response: Should return `{"success": true, "orders": [...]}`
4. Verify `tenantId` and `outletId` match between POS and KDS

**Solution:**
```bash
# Check server logs
cd backoffice/backend
npm run dev
# Watch for order creation logs
```

### Issue: Status update doesn't work

**Check:**
1. Open browser console (F12) in KDS window
2. Click status update button
3. Look for `PATCH /api/orders/:id/status` request
4. Check response for errors

**Solution:**
- Verify order ID is valid
- Check database connection
- Ensure authentication token is valid

### Issue: Polling stops after a while

**Check:**
1. Browser console for JavaScript errors
2. Check if page was backgrounded (some browsers throttle background tabs)

**Solution:**
- Keep KDS window in foreground
- Check browser console for errors
- Refresh KDS page to restart polling

---

## Database Verification (Optional)

If you need to verify data is correctly stored:

```bash
# Navigate to project root
cd c:\Users\farsya\himapatokayam

# Query recent orders
sqlite3 data/nashtypos.db "SELECT id, order_number, order_type, table_number, kitchen_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5;"

# Query order items
sqlite3 data/nashtypos.db "SELECT oi.product_name, oi.quantity, o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id ORDER BY o.created_at DESC LIMIT 10;"

# Query order modifiers
sqlite3 data/nashtypos.db "SELECT m.modifier_option_name, oi.product_name, o.order_number FROM order_item_modifiers m JOIN order_items oi ON m.order_item_id = oi.id JOIN orders o ON oi.order_id = o.id ORDER BY o.created_at DESC LIMIT 10;"
```

---

## Expected Test Duration

- **Setup:** 2 minutes
- **Scenario 1-4:** 5 minutes each (20 minutes total)
- **Scenario 5:** 10 minutes
- **Scenario 6:** 5 minutes
- **Total:** ~37 minutes

---

## Success Criteria

This checkpoint passes if:

1. ✅ All 6 scenarios pass without errors
2. ✅ Orders consistently appear in KDS within 5 seconds
3. ✅ Status updates work reliably
4. ✅ No JavaScript errors in browser console
5. ✅ Polling continues for extended periods without issues
6. ✅ Multiple concurrent orders work correctly

---

## Next Steps After Checkpoint

If all tests pass:
- ✅ Task 13 complete
- ➡️ Proceed to Priority 4: Menu Sync (Tasks 14-20)

If any tests fail:
- 🔍 Document the failure (screenshot, console errors, steps to reproduce)
- 🐛 Report to developer with details
- ⏸️ Pause implementation until issue is resolved

---

## Notes

- This is a **manual** testing checkpoint (not automated)
- Take screenshots of successful tests for documentation
- Note any unexpected behavior, even if tests pass
- Test with realistic data (multiple items, various order types)
- Consider edge cases: empty modifiers, special characters in names, etc.

