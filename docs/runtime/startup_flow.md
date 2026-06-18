# Startup Flow Trace

## Execution Trigger
Command: `powershell -ExecutionPolicy Bypass -File .\start-local.ps1`

## Step-by-Step Flow

**Step 1: Environment Check**
- The script checks if Node.js v18 or higher is installed via `node --version`.
- Fails script if missing.

**Step 2: Port Clearing**
- Probes local port `3099` using `Get-NetTCPConnection`.
- If occupied, issues `Stop-Process` to forcefully terminate the existing process, ensuring a clean binding state.

**Step 3: Directory Navigation**
- Sets execution context to `backoffice/backend`.
- **Note:** Ignores `pos/backend` and `kds/backend`.

**Step 4: Dependency Installation**
- Checks for existence of `node_modules`.
- If missing, executes `npm install`.

**Step 5: Compilation**
- Executes `npm run build` (`tsc`) inside `backoffice/backend` to compile TypeScript down to JavaScript.

**Step 6: Database Initialization & Seeding**
- Checks for the existence of `../../data/nashtypos.db`.
- If missing, executes `npm run db:seed`.
- `db:seed.ts` executes table creation schemas and populates default categories, products, system users, and configurations.

**Step 7: Backend Startup (Background Job)**
- Sets temporary environment variables: `$env:PORT="3099"`, `$env:NODE_ENV="development"`.
- Launches `npm run dev` (`tsx watch src/index.ts`) as a background PowerShell Job (`Start-Job`).
- The backend initializes `better-sqlite3` in WAL mode.
- The backend attempts to connect to Supabase. Upon failure (due to missing environment variables), it gracefully logs a warning and proceeds with local SQLite.
- Binds to port `3099`.

**Step 8: Health Check Polling**
- Script polls `http://localhost:3099/api/health` up to 15 times with a 1-second interval.
- Waits for a `200 OK` response ensuring database and API are healthy.

**Step 9: Browser Opening**
- Executes `Start-Process "http://localhost:3099/"` launching the default browser.
- Displays a success summary and attaches to the background job output stream using `Receive-Job`.
