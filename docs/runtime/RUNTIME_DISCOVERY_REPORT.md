# RUNTIME DISCOVERY REPORT

## Executive Summary
An exhaustive runtime analysis was conducted on the NashtyLite platform to map the current state of execution, dependencies, and architectural drift. The investigation concluded that while the folder structure suggests a microservices architecture, the application operates entirely as a tightly coupled Monolith centralized inside the `backoffice/backend` directory.

## Structure Summary
- **Primary Server:** `backoffice/backend/src/index.ts`
- **Frontends:** Served statically by the monolith (POS, KDS, Backoffice, CRM, Cost).
- **Dead Code:** `pos/backend` and `kds/backend` are abandoned workspaces.

## Startup Summary
The `start-local.ps1` script is highly opinionated. It bypasses the root workspaces and directly provisions `backoffice/backend`. It flawlessly handles NPM installations, TypeScript builds, database seeding (`sqlite`), and port allocation. 

## Dependency Summary
All frontend clients (POS, KDS, Backoffice) rely on a custom `api.js` which has a hardcoded dependency on `http://localhost:3099/api`. This tight coupling ensures they communicate exclusively with the monolith. No external microservices are required to operate.

## Port Summary
A single port, `:3099`, handles the entirety of the local runtime.
- Backend API (`/api/*`)
- POS Frontend (`/pos`)
- KDS Frontend (`/kds`)
- Backoffice Frontend (`/backoffice`)
- CRM SPA (`/crm`)
- Cost SPA (`/cost`)

## Failure Summary
There are no critical failures preventing local execution. 
- Supabase connection throws a managed `TypeError: fetch failed` due to missing credentials, executing a clean fallback to SQLite.
- `pos/backend` and `kds/backend` do not boot, which is an expected consequence of the architectural drift.

## Architecture Drift Summary
The application has drifted from **Microservices to a Monolith**. The backend logic was consolidated, and the frontend serving mechanisms were unified. The root `package.json` workspace definitions and orphaned backend directories are remnants of the past architecture and provide misleading signals to new developers.

---
**RUNTIME_STATE_DISCOVERED**
