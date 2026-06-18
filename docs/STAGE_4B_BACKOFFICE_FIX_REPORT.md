# STAGE 4B: BACKOFFICE BUG FIX REPORT

## Overview
All identified backoffice bugs from Stage 4A have been addressed. The fixes preserve the monolithic architecture (`backoffice/backend/src/index.ts` on port 3099) and require no new microservices.

---

## 1. Profile Module (Bugs 1 & 6)
**Issue:** The avatar click only triggered a toast, and Owners couldn't edit profiles.
**Fix:** 
- Replaced the avatar toast in `index.html` with a dropdown (`Edit Profile`, `Logout`).
- Implemented `showProfileModal()` and `saveProfile()` in `index.html`.
- Updated `users.ts` (`PUT /api/users/:id`) to explicitly allow the user to edit their own profile if the user ID matches, regardless of role. Owner can edit as well.

## 2. Category & Product Lifecycles (Bugs 2 & 3)
**Issue:** Inactive categories and products vanished from Backoffice management views.
**Fix:**
- Removed the strict `c.status = 'active'` filter from `categories.ts` `GET /`.
- Updated `products.ts` `GET /` so that the default query `status` parameter is `'all'`, ensuring management views see inactive/draft items. POS remains unaffected as it strictly fetches from `menu.ts`.

## 3. Workflow Status Menu (Bug 4)
**Issue:** Extraneous menu item.
**Fix:**
- Deleted `<div class="sb-item" onclick="nav('kds-workflow',this)">...Workflow Status</div>` from `index.html`.

## 4. Production Time to KDS (Bug 5)
**Issue:** `production_time` was ignored, causing urgent status miscalculations.
**Fix:**
- Updated `OrderService.ts` (`getKitchenQueue()`) to join the `products` table and include `p.production_time` in the `order_items` JSON output. KDS now dynamically consumes `it.production_time`.

## 5. Role-Based Access Control (Bugs 7 & 8)
**Issue:** Local dev bypassed role checks, allowing Cashiers to act as Managers.
**Fix:**
- Removed the local bypass in `middleware/auth.ts` `requireRole`.
- Applied `requireRole(['owner', 'manager'])` to sensitive endpoints (e.g., `POST /api/users`, `DELETE /api/users/:id`, `PUT /api/settings/:outletId`).

## 6. Logo Upload Persistence (Bug 9)
**Issue:** Upload logo triggered a "coming soon" toast and lacked API.
**Fix:**
- Created `POST /api/settings/:outletId/logo` endpoint to parse base64 image strings, save the file to `data/uploads`, and store the URL in the `settings` database table.
- Added file input logic (`window.uploadLogo()`) to `system.js` to process `<input type="file">` and render the preview image.

## 7. Activity Logs (Bugs 10, 11 & 12)
**Issue:** Missing icons, improper user attribution, timezone drift.
**Fix:**
- Replaced basic circular indicators with dynamic SVG icons (`create`, `update`, `delete`, `login`) in `system.js`.
- Implemented an offset-aware local time formatter `timeZone: 'Asia/Jakarta'` for SQLite date strings.
- Injected `req.user?.id` inside backend CRUD operations (in `users.ts`, `categories.ts`, `products.ts`) instead of logging as `null` ("System").

---

## Conclusion
Stage 4B runtime verification and implementation is complete. All regressions and unresolved logic errors present in the KDS and Backoffice from legacy states are fixed. No new architectures or databases were introduced.
