# REFACTOR PLAN - NASHTY OS Stabilization

Document Created: 2026-06-21
Basis: SYSTEM_MAP.md, DATABASE_MAP.md, BUSINESS_FLOW.md, PROBLEM_REPORT.md, plus source verification.
Approach: preserve behavior first, consolidate only after critical flows are stable.

## Phase 1: Critical Fixes

Task: Fix Backoffice system page parse failure.
Reason: `backoffice/frontend/js/pages/system.js` contains an extra closing brace after `PAGES.settings`, which can prevent later page registration and settings/activity-log code from executing.
Files affected: `backoffice/frontend/js/pages/system.js`
Risk: Low; removing a stray token may expose downstream runtime errors that were previously masked by parse failure.
Expected outcome: Backoffice script bundle parses and the system/settings pages can load.

Task: Persist QRIS upload through the API client instead of only localStorage.
Reason: QRIS is a payment configuration and must be outlet-level source-of-truth data, not browser-local state.
Files affected: `backoffice/frontend/js/pages/system.js`, `api-client.js` only if an API contract gap is found.
Risk: Medium; Supabase storage/RLS configuration must permit the existing `API.outletSettings.uploadQris()` flow. Preserve localStorage fallback during transition.
Expected outcome: QRIS is available across devices and survives browser cache deletion.

Task: Fix Activity Logs export handler mismatch.
Reason: The rendered button calls `exportLogs()`, while the implemented function is scoped inside `activityLogsModule`.
Files affected: `backoffice/frontend/js/pages/activity-logs.js`
Risk: Low; adds one global alias to match existing inline event handlers.
Expected outcome: CSV export button works without runtime `ReferenceError`.

Task: Verify KDS settings functions against the live API client.
Reason: The problem report identified missing `API.kds` methods, but current `api-client.js` already contains them. The remaining risk is whether analytics fields and status transitions are consistent.
Files affected: `api-client.js`, `backoffice/frontend/js/pages/kds.js`, `kds/frontend/js/api.js`, `supabase/functions/orders-api/index.ts`
Risk: Medium; KDS status changes are operationally sensitive.
Expected outcome: Backoffice KDS production-time updates and analytics either work or degrade clearly.

Task: Align KDS completion timestamps with analytics requirements.
Reason: `API.kds.getAnalytics()` calculates prep time from `orders.completed_at`, but order status update flows may not set `completed_at` when kitchen work is completed.
Files affected: `supabase/functions/orders-api/index.ts`, `kds/frontend/js/api.js`, possibly `api-client.js`
Risk: Medium; timestamp semantics affect reports.
Expected outcome: Completed/ready kitchen orders produce usable prep-time metrics.

## Phase 2: Architecture Cleanup

Task: Consolidate API ownership around `api-client.js`.
Reason: KDS has a separate API client duplicating Supabase URL, auth headers, session restore, and order status logic.
Files affected: `api-client.js`, `kds/frontend/js/api.js`, `kds/frontend/index.html`
Risk: Medium; KDS is a live operational screen and must keep polling/status behavior intact.
Expected outcome: One source of truth for auth headers, Supabase project configuration, and order API contracts.

Task: Decide the source of truth for settings.
Reason: Code references both `settings` and `outlet_settings`, while outlet-level fields also exist on `outlets`.
Files affected: `api-client.js`, `supabase/functions/settings-api/index.ts`, `database/DEPLOY_SUPABASE_SQL.sql`, `database/schema.sqlite.sql`
Risk: High if schema is changed without migration; handle by documenting current production schema first.
Expected outcome: One documented settings owner per business operation: receipt/customer display/KDS/payment QRIS.

Task: Normalize Activity Logs page ownership.
Reason: `system.js` defines `PAGES.actlogs`, while `activity-logs.js` defines `PAGES.activityLogs`; navigation routes to `activity-logs`.
Files affected: `backoffice/frontend/js/pages/system.js`, `backoffice/frontend/js/pages/activity-logs.js`, `backoffice/frontend/js/nav.js`
Risk: Low to medium; duplicate pages may have different API expectations.
Expected outcome: One Activity Logs implementation and one route.

Task: Resolve order status ownership.
Reason: POS, KDS, Edge Functions, and reports use overlapping order/kitchen status meanings.
Files affected: `supabase/functions/orders-api/index.ts`, `api-client.js`, `kds/frontend/js/api.js`, `pos/frontend/js/orders.js`, reports/dashboard functions.
Risk: High; affects operational order lifecycle.
Expected outcome: POS owns payment/order creation; KDS owns kitchen status; reports read normalized final states.

## Phase 3: Code Organization

Task: Move direct business writes out of page modules into service/API methods.
Reason: Backoffice page files directly perform business operations and local persistence, causing inconsistent behavior.
Files affected: `backoffice/frontend/js/pages/*.js`, `api-client.js`
Risk: Medium; keep function signatures and UI text stable.
Expected outcome: Frontend pages call service methods; service layer owns storage/API details.

Task: Replace duplicate storage key logic with helper functions.
Reason: Auth, CRM, Cost, POS, and KDS each maintain their own localStorage conventions.
Files affected: `api-client.js`, module-specific frontend data files.
Risk: Medium; session migration can log users out if mishandled.
Expected outcome: Scoped localStorage keys are predictable and backward compatible.

Task: Separate legacy Express backend from production path.
Reason: `backoffice/backend` appears unused by Cloudflare Pages production but still duplicates routes.
Files affected: `backoffice/backend/*`, docs only at first.
Risk: Low if documented first; high if deleted before route consumers are proven absent.
Expected outcome: Developers know Edge Functions are production backend, Express is legacy/development only or removed later.

## Phase 4: Optimization

Task: Add focused contract checks for browser-loaded scripts.
Reason: Static script syntax failures currently reach production without automated guardrails.
Files affected: test scripts or package scripts, selected frontend JS files.
Risk: Low.
Expected outcome: `node --check` or equivalent catches parser failures before deploy.

Task: Add API contract smoke tests for critical flows.
Reason: POS order creation, KDS status updates, settings upload, and dashboard KPI depend on stable response shapes.
Files affected: tests/scripts only.
Risk: Low to medium depending on whether tests hit live Supabase.
Expected outcome: Critical API drift is detected before manual QA.

Task: Reduce KDS polling load after correctness is stable.
Reason: The KDS polls every 5 seconds; this is acceptable for stabilization but expensive at scale.
Files affected: `kds/frontend/js/realtime.js`, `kds/frontend/js/app.js`, Supabase Realtime policies.
Risk: Medium; real-time subscriptions require careful reconnect behavior.
Expected outcome: Lower backend load and faster kitchen updates.

Task: Paginate large backoffice reads.
Reason: Several pages load broad datasets without explicit pagination.
Files affected: `api-client.js`, backoffice page modules, Edge Functions where relevant.
Risk: Medium; UI must preserve current workflows.
Expected outcome: Better performance as products/orders/logs grow.
