# Architecture Discovery (Runtime Truth)

## Validation Methods
- **Serena MCP** and direct filesystem inspection were used to verify current entry points and configuration.

## Observed Evidence
- **Backend Entrypoint:** Executing `backoffice/backend/src/index.ts` is the single true entry point for backend operations. 
- **Frontend Entrypoints:** There are no discrete frontend dev servers. The backoffice server acts as a single static file host mapping `/pos` -> `pos/frontend`, `/kds` -> `kds/frontend`, `/backoffice` -> `backoffice/frontend`, `/crm` -> `crm/dist`, and `/cost` -> `cost/dist`.
- **Dependency Graph:** All applications depend solely on `localhost:3099/api`. No microservices structure is active.
- **Port Usage:** Port 3099 is the only port initialized and utilized. `pos/backend` and `kds/backend` are verifiably dead code.
