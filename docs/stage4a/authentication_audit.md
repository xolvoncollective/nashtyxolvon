# STAGE 4A: Authentication Audit

## 1. JWT Implementation Status
* **Implemented:** The backend has a fully implemented JWT generation and verification mechanism (`src/middleware/auth.ts`).
* **Secret Key:** Uses `JWT_SECRET` from environment variables, defaulting to `nashty-super-secret-key-2026`.
* **Token Expiration:** POS roles get 12h, Backoffice gets 30m.

## 2. Bypasses and Critical Vulnerabilities
* **CRITICAL RISK:** In `auth.ts`, the `requireAuth` middleware explicitly bypasses ALL authentication if `process.env.NODE_ENV !== 'production'`.
* **Fallback Behavior:** If auth is bypassed, it forcefully injects a dummy admin user: `{ id: 'admin', role: 'admin' }`.
* **Result:** Anyone who knows the API URL can access any endpoint as an admin if the environment is not strictly set to `production`.

## 3. Production Readiness Verdict
**PRODUCTION_NOT_READY**
The development shortcut to bypass auth based on `NODE_ENV` is extremely dangerous and must be removed or strictly isolated. A missing `.env` file in production would instantly expose the entire system without authentication.
