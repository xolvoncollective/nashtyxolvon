# STAGE 4A: Manager PIN Audit

## 1. Flow Tracing
* **Void Order Flow:** `pos/frontend/js/orders.js` handles the void action. While the frontend still has an unused `VOID_PIN = '1234'` in `state.js`, the actual implementation in `pos/frontend/js/history.js` passes the inputted PIN via `API.orders.void` to the backend.
* **Backend Validation:** In `backoffice/backend/src/routes/orders.ts`, the `managerPin` is extracted and passed to `OrderService.voidOrder`.
* **Database Verification:** `OrderService.voidOrder` explicitly queries the database for all users with roles `'manager'` or `'owner'` under the tenant, and uses `bcrypt.compare` to check the provided PIN against the hashed PIN in the database.

## 2. Verdict
**SAFE_DATABASE_BACKED_PIN / MIXED_IMPLEMENTATION**
* The backend properly relies on the database for Manager PIN validation and uses securely hashed credentials (`bcrypt`).
* The frontend has unused hardcoded PIN logic (`state.js`) which could cause confusion but is not actively compromising security.
