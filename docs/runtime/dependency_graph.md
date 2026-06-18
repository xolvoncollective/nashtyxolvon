# Dependency Graph

## Runtime Interaction Graph
This graph illustrates how the applications communicate in the active runtime.

```text
[Browser]
  ├── /pos         -> [POS Frontend (Vanilla JS)]
  ├── /kds         -> [KDS Frontend (Vanilla JS)]
  ├── /backoffice  -> [Backoffice Frontend (Vanilla JS)]
  ├── /crm         -> [CRM Frontend (React SPA)]
  └── /cost        -> [Cost Frontend (React SPA)]
           │
           │ (HTTP/REST via hardcoded API_BASE on port 3099)
           ▼
[backoffice/backend/src/index.ts (Express Monolith)]
           │
           ├──► [Controllers] -> [Services]
           │
           ▼
[SQLite DB (data/nashtypos.db)]
```

## Import Flow Details
- **POS `api.js`**: Hardcodes `API_BASE = 'http://localhost:3099/api'`
- **KDS `api.js`**: Hardcodes `API_BASE = 'http://localhost:3099/api'`
- **Backoffice `api.js`**: Hardcodes `API_BASE = 'http://localhost:3099/api'`

## Dependency Anomalies Discovered
1. **Orphaned Backends:** The graph explicitly excludes `pos/backend` and `kds/backend`. There are no active edges pointing to these workspaces. They are broken from the active dependency chain.
2. **Hardcoded Ports:** The frontends have `http://localhost:3099` statically hardcoded in their `api.js` files. If the backend `PORT` environment variable shifts, the frontends will suffer broken imports/connections immediately.
3. **Missing Modules:** No critical missing dependencies were identified that halt execution, thanks to the robust local fallback mechanisms (e.g., Supabase failing gracefully to SQLite).
