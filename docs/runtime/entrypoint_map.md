# Entrypoint Map

## Global Startup
- **Entry File:** `start-local.ps1`
- **Startup Script:** Executes sequentially to initialize dependencies, seed DB, and run the monolith backend.

## 1. Monolith Backend (Currently handles POS, KDS, Backoffice, CRM, Cost)
- **Application:** Backend (serving all frontend static files and API requests)
- **Entry File:** `backoffice/backend/src/index.ts`
- **Startup Script:** `npm run dev` (maps to `tsx watch src/index.ts`)
- **Port:** `3099` (Default)
- **Dependencies:** `express`, `better-sqlite3`, `@supabase/supabase-js`, `cors`
- **Required Services:** None strictly required. Fails gracefully to local SQLite if Supabase is missing.

## 2. POS (Point of Sale)
- **Application:** POS Frontend
- **Entry File:** `pos/frontend/index.html`
- **Startup Script:** N/A (Served statically by Backend at `/pos`)
- **Port:** Uses Backend Port `3099`
- **Dependencies:** `api.js` (Custom fetch client connecting to `http://localhost:3099/api`)

## 3. KDS (Kitchen Display System)
- **Application:** KDS Frontend
- **Entry File:** `kds/frontend/index.html`
- **Startup Script:** N/A (Served statically by Backend at `/kds`)
- **Port:** Uses Backend Port `3099`
- **Dependencies:** `api.js`

## 4. Backoffice
- **Application:** Backoffice Frontend
- **Entry File:** `backoffice/frontend/index.html`
- **Startup Script:** N/A (Served statically by Backend at `/backoffice`)
- **Port:** Uses Backend Port `3099`
- **Dependencies:** `api.js`

## 5. Inactive Workspaces
The following have `package.json` entrypoints but are **never invoked** by the runtime scripts.
- **POS Backend:** `pos/backend/src/index.ts`
- **KDS Backend:** `kds/backend/src/index.ts`
*(These represent architectural drift and are effectively dead code in the current runtime context).*
