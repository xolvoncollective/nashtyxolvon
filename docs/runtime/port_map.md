# Port Map

## Overview
All services are currently unified under a single running port mapped by the backend monolith server. 

## Active Ports

| Application | Port | Source File | Environment Variable | Consumer |
| :--- | :--- | :--- | :--- | :--- |
| **Monolith Backend** | `:3099` | `backoffice/backend/src/index.ts` | `process.env.PORT` | API Clients, All Frontends |
| **POS Frontend** | `:3099` | `pos/frontend/js/api.js` | N/A (Hardcoded `API_BASE`) | Local Browser (`/pos`) |
| **KDS Frontend** | `:3099` | `kds/frontend/js/api.js` | N/A (Hardcoded `API_BASE`) | Local Browser (`/kds`) |
| **Backoffice Frontend** | `:3099` | `backoffice/frontend/js/api.js` | N/A (Hardcoded `API_BASE`) | Local Browser (`/backoffice`) |
| **CRM SPA** | `:3099` | `backoffice/backend/src/index.ts` | N/A | Local Browser (`/crm`) |
| **Cost SPA** | `:3099` | `backoffice/backend/src/index.ts` | N/A | Local Browser (`/cost`) |

## Obsolete / Inactive Ports
*No other ports are bound during local runtime.* The original intention might have been separate ports (e.g., `:3001`, `:5173`, etc.) as common in React/Vite setups, but the `start-local.ps1` script explicitly funnels all traffic through `:3099` utilizing Express static file serving.
