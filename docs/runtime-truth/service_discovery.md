# Service Discovery (Runtime Truth)

## Verification Mechanism
- Validated active ports via PowerShell's `Get-NetTCPConnection`.
- Validated executing service via `Win32_Process`.

## Captured Evidence
- **PID:** `275912`
- **Port:** `3099` (State: Listen / Established)
- **Startup Command:** `"C:\Program Files\nodejs\node.exe" --require C:\Users\zaidu\OneDrive\Documents\nashtylite\node_modules\tsx\dist\pref...`
- **Active Service:** Monolith Backend (`backoffice/backend/src/index.ts`)

## Conclusion
A single Node process is handling the entire application load. There are no secondary services, containers, or supplementary processes running.
