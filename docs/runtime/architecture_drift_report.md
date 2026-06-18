# Architecture Drift Report

## Expected Architecture
Based on the root `package.json` workspace definitions and folder structure (`pos/backend`, `kds/backend`, `backoffice/backend`), the system was originally designed as a **Microservices Architecture**.
- Expected `pos/backend` to serve POS API.
- Expected `kds/backend` to serve KDS API.
- Expected `backoffice/backend` to serve Admin API.

## Current Runtime Architecture
The system currently operates as a **Monolithic Architecture**.

## Drift Analysis

### What Changed?
1. **Centralization:** All routing, services, and database connections have been funneled into `backoffice/backend/src/index.ts`.
2. **Frontend Serving:** Instead of separate Nginx/Vite dev servers for each frontend, `backoffice/backend` uses `express.static` to serve HTML files for POS, KDS, Backoffice, CRM, and Cost directly on the same port (`3099`).

### What Moved?
- The backend logic for POS and KDS moved into the `backoffice/backend/src/routes/` directory (e.g., `routes/orders.ts`, `routes/kds.ts`).

### What Disappeared?
- The execution of `pos/backend` and `kds/backend`. Their `package.json` files still exist, but they are completely ignored by `start-local.ps1`. 

### What No Longer Starts?
- The dedicated backend servers for POS and KDS. They are dead code.

## Conclusion
The architecture has heavily drifted from Microservices to a Monolith. This reduces local startup complexity (requiring only one script and port) but leaves orphaned directories (`pos/backend`, `kds/backend`) that could confuse developers.
