# KDS STABILITY REPORT - STAGE 3C

## 1. Root Cause
The KDS instability and visual flickering were caused by two concurrent issues fighting for DOM control:
1. **Unnecessary Full DOM Reconstruction**: Every 5 seconds, the `fetchOrders()` polling interval completely replaced the global `ORDERS` array regardless of whether changes existed, immediately triggering `render()`. `render()` executed a full `grid.innerHTML` replacement. This constantly destroyed the DOM, broke active CSS animations, and interrupted user interactions like swiping.
2. **Urgent Logic Parameter Mismatch**: The KDS updates UI timers every 1 second via `timer.js`. The logic evaluating urgency, `urgClass(sec, o)`, expects the order object `o` to check the `targetTime`. However, `timer.js` called it without the `o` parameter. This caused `timer.js` to miscalculate the urgency using global defaults (e.g., 15 minutes) instead of the actual `targetTime` (e.g., 10 minutes). As a result, `render.js` (running every 5 seconds) would color a card RED (Urgent), but `timer.js` (running every 1 second) would immediately downgrade it back to GREEN (Fresh) because it lacked context, causing an infinite flicker loop on the borders and labels.

## 2. Code Locations
- **Polling / Re-render issue**: `kds/frontend/js/app.js` (Lines 98-99) inside `fetchOrders()`.
- **Urgent Logic issue**: `kds/frontend/js/timer.js` (Lines 17, 40, 53) where `urgClass` was called without the order parameter.

## 3. Fix Applied
1. **DOM Stability Check**: Modified `app.js` to structural-check the new payload against the old payload using `JSON.stringify(ORDERS) !== JSON.stringify(newOrders)`. The `render()` function now *only* executes if actual data mutations (new orders, status changes, modifications) occurred from the backend.
2. **Timer Context Fix**: Updated `timer.js` to correctly pass the order context `o` into `urgClass(sec, o)` across all its mapping and filtering loops. Both `render.js` and `timer.js` now mutually agree on the calculated `targetTime`.

## 4. Before vs After Behavior
- **Before**: The screen physically flashed every 5 seconds. Hover states were lost constantly. Order cards nearing their target times continuously toggled between green and red outlines every second.
- **After**: The board remains completely static and calm. Timers tick smoothly without rebuilding their parent containers. The urgent outlines correctly lock to RED and stay RED once the calculated `targetTime` is breached. Swipe interactions are no longer interrupted.

## 5. Runtime Proof
- Navigated via `Playwright MCP` locally against `http://localhost:3099/kds`.
- The frontend successfully initiated. Playwright screenshots confirm that orders correctly enter the "Urgent" state without continuously reverting.
- No DOM element replacements observed unless an order status explicitly changes via `API.orders.updateKitchenStatus`.

## 6. Regression Check
- `fetchOrders()` continues to ping every 5,000ms correctly via network requests.
- Escaped workflows (`markDone()`) still successfully clear out the `ORDERS` array, as `status: done` inherently alters the structure and correctly invokes the targeted `render()` pass.

## 7. Final Verdict
**KDS_STABILITY_VERIFIED**
