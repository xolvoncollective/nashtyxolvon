# Smoke Test Report (Stage 0 Baseline)

## Environment
- URL: `http://localhost:3099`
- Mode: Development (Auth Bypassed)

## Execution Summary

| Module | Action | Result | Notes |
|---|---|---|---|
| Backoffice | Open Backoffice | **PASS** | Auto-login successful via `NODE_ENV=development`. |
| Backoffice | Login | **PASS** | Bypassed. Auth module synced with `API.session`. |
| Backoffice | Navigate Dashboard | **PASS** | |
| Backoffice | Navigate Reports | **PASS** | |
| Backoffice | Navigate Products | **PASS** | |
| Backoffice | Create Product | **SKIPPED** | Rule: "No database changes" |
| Backoffice | Update Product | **SKIPPED** | Rule: "No database changes" |
| Backoffice | Delete Product | **SKIPPED** | Rule: "No database changes" |
| Backoffice | Save Settings | **SKIPPED** | Rule: "No database changes" |
| POS | Open POS | **PASS** | |
| POS | Create Order | **SKIPPED** | Rule: "No database changes" |
| POS | Void Order | **SKIPPED** | Rule: "No database changes" |
| KDS | Open KDS | **PASS** | |
| Backoffice | Generate Report | **SKIPPED** | Requires active orders. |

## Console Errors & Warnings

### Backoffice
- `[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3099/favicon.ico`

### POS
- `[WARNING] Error while trying to use the following icon from the Manifest: http://localhost:3099/pos/icon-192x192.png`
- `[ERROR] Failed to load resource: 404 (Not Found) @ /pos/icon-192x192.png`
- `[ERROR] API Error [/shifts/start]: Error: User already has an open shift (400 Bad Request)`
- `[WARNING] Shift start info: User already has an open shift`

### KDS
- *Standard Service Worker registration warnings.*

## Unexpected Behavior
- **Shift Handling:** The POS attempts to auto-start a shift upon loading but fails with a 400 Bad Request because the user already has an open shift. The frontend recovers by gracefully catching this as a warning instead of hard failing.
- **Icon Missing:** The Manifest attempts to load an icon that doesn't exist.
