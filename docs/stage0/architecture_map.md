# Repository Architecture Map (Stage 0 Baseline)

## Applications Overview

The repository consists of a POS ecosystem separated into multiple applications, some of which seem to be structured as full-stack workspaces while others exist as pre-built or frontend-only modules:

1. **Back Office**: `/backoffice`
   - Backend: Node.js/Express (`/backoffice/backend`)
   - Frontend: Web application (`/backoffice/frontend`)
2. **POS (Point of Sale)**: `/pos`
   - Backend: Node.js/Express (`/pos/backend`)
   - Frontend: Web application (`/pos/frontend`)
3. **KDS (Kitchen Display System)**: `/kds`
   - Backend: Node.js/Express (`/kds/backend`)
   - Frontend: Web application (`/kds/frontend`)
4. **CRM**: `/crm`
   - Exists as a built artifact (`/crm/dist`) and dependencies. Source code not directly mapped as a full stack module in `package.json` workspaces.
5. **Cost Calculation**: `/cost`
   - Exists as a built artifact (`/cost/dist`) and dependencies.
6. **Member**: `/member`
   - Contains a `/member/frontend` directory.

## Frontend Entry Points

- **Root Launcher**: `main-launcher.html` and `index.html` at the project root act as potential starting points or landing pages.
- **POS**: `/pos/frontend` (Served statically by backoffice at `/pos`)
- **KDS**: `/kds/frontend` (Served statically by backoffice at `/kds`)
- **Back Office**: `/backoffice/frontend` (Served statically at `/backoffice`)
- **CRM**: `/crm/dist` (Served statically at `/crm`)
- **Cost**: `/cost/dist` (Served statically at `/cost`)

## Backend Entry Points

- **Back Office Backend** (`/backoffice/backend/src/index.ts`): The primary monolithic server entry point used by the `start-local.ps1` script. It binds to port 3099, mounts API routes for auth, users, categories, products, menu, orders, etc., and statically serves all the frontend applications (POS, KDS, Backoffice, CRM, Cost).
- **POS Backend** (`/pos/backend/src/index.ts`): A potentially redundant or standalone backend that mounts a subset of routes (`auth`, `categories`, `products`, `orders`, `shifts`).
- **KDS Backend** (`/kds/backend/src/index.ts`): Another potentially redundant or standalone backend that mounts (`auth`, `orders`).

## Database Access Layer

- Uses SQLite databases located in the `/data` folder.
- **Main DB**: `nashtypos.db`
- **Other DBs observed**: `nashty.sqlite`, `test-nashtypos.db`

## Shared Utilities & Modules

- `/shared/auth.js`: A shared authentication module.
- `api-client-v2.js` at project root: A shared HTTP client or API wrapper.
- Workspaces defined in `package.json`: `pos/backend`, `kds/backend`, `backoffice/backend`.

## Configuration Files

- Root `package.json` and `package-lock.json`
- `vitest.config.ts` (Root testing config)
- `playwright.config.ts` (under `/tests`)
- Environment variables: Observed `.env` in the `cost/` directory. Backoffice script overrides `NODE_ENV` and `PORT`.

## Startup Scripts

- `start-local.ps1`: An advanced PowerShell script (NASHTY OS - Local Development Starter v3.0.0) that ensures Node.js is present, frees port 3099, builds the `backoffice/backend`, seeds the DB, starts the backoffice server locally (`npm run dev`), performs a health check, and launches the browser to `http://localhost:3099/`.

## Observations / Ghost Architecture

- **Ghost/Duplicated Backends**: The POS and KDS directories have their own backend servers (`/pos/backend/src/index.ts`, `/kds/backend/src/index.ts`) defining overlapping routes. However, `start-local.ps1` completely ignores them and serves all functionality from `/backoffice/backend`.
- **Pre-compiled Silos**: CRM and Cost calculation modules exist mainly as `dist/` folders without their raw source code clearly integrated into the primary workspace loop.
- **Unused Folders**: `Draft/`, `Nashty/`, `Production-Ready/`, `.kiro/`. These might contain legacy or prototyping code.
