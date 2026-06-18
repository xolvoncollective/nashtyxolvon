# Frontend Validation (Runtime Truth)

## Verification Mechanism
- Validated via Playwright MCP interacting dynamically with the deployed frontend routes.

## Validation Results

### 1. Root / Launcher (`/`)
- **Status:** ✅ Renders successfully.
- **Title:** "NASHTY OS - Launcher"
- **Issues:** 1 Console Error (Missing `favicon.ico`).

### 2. POS App (`/pos`)
- **Status:** ⚠️ Renders, but with runtime errors.
- **Title:** "NASHTY OS — POS"
- **Issues:** 3 Errors, 2 Warnings.
- **Critical Failure:** 500 Internal Server Error hitting `/api/shifts/start` due to `FOREIGN KEY constraint failed`.

### 3. KDS App (`/kds`)
- **Status:** ⚠️ Renders, but with JS exception.
- **Title:** "NASHTY OS — KDS"
- **Issues:** 2 Errors, 1 Warning.
- **Critical Failure:** JS Exception `TypeError: Cannot read properties of undefined (reading 'get') at fetchOrders`.

### 4. Backoffice App (`/backoffice`)
- **Status:** ✅ Renders successfully.
- **Title:** "NASHTY OS — Backoffice"
- **Issues:** 0 Errors. Complete success.

### 5. CRM SPA (`/crm`)
- **Status:** ✅ Renders and redirects to `/dashboard`.
- **Title:** "Nashtypeople Portal"
- **Issues:** 4 404 Errors (Missing SVG and PNG icons: `fire-nashty-icon.png`).

### 6. Cost SPA (`/cost`)
- **Status:** ✅ Renders and redirects to `/dashboard`.
- **Title:** "Nashty Cost System"
- **Issues:** 2 404 Errors (Missing `pwa-192x192.png`).
