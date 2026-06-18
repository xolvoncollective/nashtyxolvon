# Semantic Dependency Analysis (Stage 0 Baseline)

## Module Dependencies
The backend structure is primarily defined by the routers in the `/routes` directories.

**Backoffice Backend Modules:**
- Activity Logs, Auth, Categories, Costs, CRM, Dashboard, KDS, Main Auth, Members, Menu, Modifiers, Orders, Outlets, Products, Reports, Settings, Shifts, Users.

**POS Backend Modules:**
- Auth, Categories, Orders, Products, Shifts.

**KDS Backend Modules:**
- Auth, Orders.

## Service Dependencies
- **CacheManager**: Found in `/backoffice/backend/src/services/CacheManager.ts`. It's used by the Backoffice application (e.g. `app.get('/api/menu/:outletId', cacheMiddleware(300), getMenuHandler);`).

## Shared Business Logic
- `/shared/auth.js`: Implements generic authentication helpers.
- `api-client-v2.js`: Appears to be the shared frontend HTTP client used to interact with these backend endpoints.

## Database Dependencies
- All modules appear to connect to `data/nashtypos.db`. This creates a tight data coupling where separate isolated services (POS, KDS) bypass APIs to directly mutate the shared SQLite database.

## Duplicate Implementations & Hidden Coupling

### Duplicate API Routers
There is massive duplication of API route handlers across the "microservices" (which are actually ghost architecture since backoffice serves everything anyway).
- `auth.ts`: Duplicated in Backoffice, POS, and KDS.
- `orders.ts`: Duplicated in Backoffice, POS, and KDS.
- `categories.ts`: Duplicated in Backoffice and POS.
- `products.ts`: Duplicated in Backoffice and POS.
- `shifts.ts`: Duplicated in Backoffice and POS.

### Code Silos
- The `crm` and `cost` modules are effectively silos. They have their own compiled `dist` folders, while the Backoffice backend serves their `dist` outputs statically and has rudimentary API routes (`crm.ts`, `costs.ts`) to interact with their data logic.

### Call Hierarchy
The frontends primarily rely on the monolith endpoints exposed by `backoffice/backend/src/index.ts`. However, the existence of `pos/backend` and `kds/backend` implies that historically or conceptually, the frontends might have tried to call their own backends. The `start-local.ps1` script reveals the true call hierarchy: all frontend calls go to the Backoffice process on port 3099.
