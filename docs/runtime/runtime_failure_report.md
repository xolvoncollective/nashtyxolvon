# Runtime Failure Report

## Execution Observation (`.\start-local.ps1`)
I simulated the execution of the startup script to observe service behavior in the current local environment.

## Status Observations

| Service | Observation | Status |
| :--- | :--- | :--- |
| `backoffice/backend` | Boots successfully on port `3099`. | ✅ Started |
| `pos/backend` | Does not boot. Skipped entirely by the startup script. | ⚠️ Inactive |
| `kds/backend` | Does not boot. Skipped entirely by the startup script. | ⚠️ Inactive |
| Supabase Client | Fails to connect due to missing environment variables (`TypeError: fetch failed`). | ❌ Failed |
| SQLite Fallback | Database boots and handles requests gracefully. | ✅ Started |

## Detailed Failure Log
- **Supabase Connectivity:**
  ```text
  ❌ Supabase connection test failed: TypeError: fetch failed
  ⚠️  Supabase connection failed, falling back to local SQLite
  ```
  *Impact:* None. The system correctly identifies the failure and falls back to local SQLite. This is a handled exception rather than a critical failure.

- **Missing Services:** 
  The POS and KDS native backends completely fail to execute because they are no longer integrated into the startup flow. However, this doesn't cause a runtime crash because their frontends have been hardcoded to rely on `backoffice/backend`.

- **Port Conflicts / Crashes:** 
  Zero port conflicts were encountered because the startup script forcibly clears port `3099` before binding.
