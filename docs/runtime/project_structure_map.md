# Project Structure Map

## High-Level Monorepo Structure

```text
nashtylite/
├── backoffice/           (Primary Monolith Backend + Admin UI)
│   ├── backend/          (Active NodeJS Monolith Server)
│   │   ├── src/          (Controllers, Services, DB schemas)
│   │   └── package.json
│   └── frontend/         (Static HTML/JS Backoffice UI)
├── pos/                  (Point of Sale)
│   ├── backend/          (Inactive/Orphaned workspace)
│   └── frontend/         (Static HTML/JS POS UI)
├── kds/                  (Kitchen Display System)
│   ├── backend/          (Inactive/Orphaned workspace)
│   └── frontend/         (Static HTML/JS KDS UI)
├── crm/                  (Customer Relationship Management)
│   └── dist/             (Compiled SPA)
├── cost/                 (Cost Management System)
│   └── dist/             (Compiled SPA)
├── data/                 (Local Databases)
│   └── nashtypos.db      (SQLite WAL Mode active db)
└── start-local.ps1       (Primary Execution Script)
```

## Layer Mapping

**1. Presentation Layer (Frontend Apps)**
All frontends are currently served statically by the monolith backend via Express static routes.
- **POS:** Vanilla JS architecture (`pos/frontend`)
- **KDS:** Vanilla JS architecture (`kds/frontend`)
- **Backoffice:** Vanilla JS architecture (`backoffice/frontend`)
- **CRM:** Vite/React SPA (`crm/dist`)
- **Cost:** Vite/React SPA (`cost/dist`)

**2. Service / Controller Layer (Backend)**
All logic is consolidated inside `backoffice/backend/src`.
- **Controllers:** Map routes to services (e.g., `routes/orders.ts`, `routes/menu.ts`, `routes/crm.ts`)
- **Services:** Implement domain logic (`CostService`, `FinancialCalculationService`, `OrderService`)
- **Shared Modules:** Reusable utilities (e.g., `api-client-v2.js` at root level but primarily frontend utilities)

**3. Database Layer**
- **Primary:** SQLite via `better-sqlite3` located at `data/nashtypos.db`.
- **Mode:** WAL (Write-Ahead Logging) mode is activated.
- **ORM/Query Builder:** Raw SQL statements heavily utilized in services.

## Structural Findings
The structure implies a past microservice architecture (`pos/backend`, `kds/backend`), but the current runtime state reveals a **Monolithic Architecture** where `backoffice/backend` orchestrates all API endpoints and static file serving for the entire suite.
