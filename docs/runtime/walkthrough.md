# Master Runtime Walkthrough

## 1. Current Project Structure
The project is structurally organized as a monorepo containing multiple modules (`pos`, `kds`, `backoffice`, `crm`, `cost`). However, beneath the surface, it functions as a monolith. The `backoffice/backend` folder holds the true heart of the application, encompassing all backend services, database migrations, and static asset serving. The `pos/backend` and `kds/backend` folders are abandoned workspaces.

## 2. How Startup Works
When a developer runs `start-local.ps1`, the script actively ignores the root directory workspaces. Instead, it dives straight into `backoffice/backend`. It ensures dependencies are installed via `npm install`, runs TypeScript compilation `npm run build`, and initializes the local SQLite database using `npm run db:seed`. Finally, it binds a background server to port `3099` using `npm run dev` and polls `/api/health` until the system is responsive.

## 3. How POS Connects
The POS is built with Vanilla HTML/JS inside `pos/frontend`. When you visit `http://localhost:3099/pos`, the monolith server statically serves those files. Inside the POS, a custom `api.js` script holds a hardcoded variable: `API_BASE = 'http://localhost:3099/api'`. All actions (creating orders, fetching products) are dispatched as REST calls to the monolith.

## 4. How KDS Connects
Similar to the POS, KDS lives in `kds/frontend`. It is served statically at `/kds`. It utilizes its own identical `api.js` client, relying on the same hardcoded `API_BASE` pointing to port `3099`. It polls or listens to the monolith for kitchen queue updates.

## 5. How Backoffice Connects
The Backoffice frontend (`backoffice/frontend`) is served at `/backoffice`. It also uses a vanilla JS API client configured to hit port `3099`.

## 6. How Backend Connects
The backend (`backoffice/backend`) acts as the conductor. Upon boot, it checks for Supabase cloud environment variables. If they aren't present (the default local behavior), it logs an intentional failure and smoothly falls back to a local SQLite file (`data/nashtypos.db`). It mounts all the static directories for the frontends, initializes the CacheManager, and exposes all REST routes (Auth, Orders, KDS, Menu, CRM).

## 7. What Changed from Expected Architecture
The original folder structure indicates a planned microservices split, where POS, KDS, and Backoffice had dedicated NodeJS backends. Over time, the architecture drifted heavily. All microservices collapsed into the `backoffice/backend` monolith. The expected separate servers were abandoned in favor of a simpler, unified Express server routing traffic for the entire ecosystem.

## 8. Why Services Currently Fail
- **Supabase:** Fails intentionally because the developer `.env` lacks production credentials. This is expected and triggers the SQLite fallback.
- **Microservices:** `pos/backend` and `kds/backend` "fail" to start simply because the startup script never targets them. They are orphaned.

## 9. Recommended Fixes
*Note: This phase does not perform refactoring, only recommendation.*
1. **Remove Dead Code:** Delete `pos/backend` and `kds/backend` entirely to remove confusion and reflect the true monolithic architecture.
2. **Update Root Package:** Remove the obsolete `workspaces` array from the root `package.json`.
3. **Dynamic API Binding:** Replace the hardcoded `API_BASE = 'http://localhost:3099/api'` in the frontend `api.js` files with relative paths (`/api`) so the frontends can dynamically match the port the backend is deployed on.
