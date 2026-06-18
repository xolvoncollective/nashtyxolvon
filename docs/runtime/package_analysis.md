# Package.json Analysis

## Workspace Relationships
The root `package.json` defines a workspace architecture:
```json
"workspaces": [
  "pos/backend",
  "kds/backend",
  "backoffice/backend"
]
```

## Root Package
- **Path:** `/package.json`
- **Purpose:** Manages global e2e tests.
- **Scripts:**
  - `test:e2e`: "npx playwright test --config=tests/playwright.config.ts"

## 1. Backoffice Backend (Active Monolith)
- **Path:** `/backoffice/backend/package.json`
- **Role:** Primary API and static file server.
- **Dev Command:** `npm run dev` -> `tsx watch src/index.ts`
- **Build Command:** `npm run build` -> `tsc`
- **Start Command:** `npm run start` -> `node dist/index.js`
- **Utility Commands:**
  - `db:migrate`: `tsx src/db/migrate.ts`
  - `db:seed`: `tsx src/db/seed.ts`
- **Status:** Healthy, Active, tightly coupled to `start-local.ps1`.

## 2. POS Backend (Obsolete)
- **Path:** `/pos/backend/package.json`
- **Role:** Originally intended to serve the POS.
- **Scripts:** Identical duplicate of early backend scripts (`dev`: `tsx watch src/index.ts`, etc.)
- **Dependencies:** Outdated (e.g., uses `sql.js` instead of `better-sqlite3`).
- **Status:** **Obsolete / Dead Code**. It is never invoked by `start-local.ps1`.

## 3. KDS Backend (Obsolete)
- **Path:** `/kds/backend/package.json`
- **Role:** Originally intended to serve the KDS.
- **Scripts:** Identical duplicate of early backend scripts.
- **Dependencies:** Outdated (`sql.js`).
- **Status:** **Obsolete / Dead Code**. Never invoked.

## Analysis Conclusion
There are broken/obsolete scripts mapping to `pos/backend` and `kds/backend`. The architecture has drifted into a monolith managed solely under `backoffice/backend/package.json`, rendering the workspace separation largely academic.
