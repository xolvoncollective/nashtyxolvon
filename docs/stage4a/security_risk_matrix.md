# STAGE 4A: Environment Audit & Security Risk Matrix

## 1. Environment Audit
* **.env Location:** Missing at the root level.
* **Hardcoded Secrets:** Fallback secret `nashty-super-secret-key-2026` is heavily hardcoded across multiple files (e.g., `auth.ts`, `supabase-client.ts`, test files).
* **Runtime Defaults:** Defaulting to `NODE_ENV = 'development'` is dangerous and skips core security measures.

## 2. Security Risk Matrix

| Risk Category       | Risk Description                                                                                 | Severity | Impact                                                                           |
|---------------------|--------------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------|
| Authentication      | `requireAuth` is bypassed if `NODE_ENV !== 'production'`.                                        | CRITICAL | Anyone can access the system without logging in.                                 |
| Authorization       | `requireRole` middleware unconditionally calls `next()`.                                         | CRITICAL | Privilege escalation is guaranteed for all API endpoints protected by roles.     |
| Environment Config  | Fallback JWT secret is hardcoded and `NODE_ENV` defaults to `development` if not set explicitly. | HIGH     | Easy token forgery and accidental dev-mode deployments to production.            |
| Data Integrity      | Foreign key constraints are failing for deleted users/products.                                  | MEDIUM   | UI crashes or logic errors when dealing with historical data.                    |
| Dead Code / Secrets | Unused `VOID_PIN = '1234'` left in frontend state.                                               | LOW      | Confusion during maintenance, though backend validation prevents exploitation.   |
