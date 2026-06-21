# CHANGELOG

## 2026-06-21

### Stabilization Task: Backoffice critical flow fixes

What changed:
- Created `REFACTOR_PLAN.md` from the existing architecture, database, business-flow, and problem-report documents.
- Removed a stray closing brace in `backoffice/frontend/js/pages/system.js` so the file can parse.
- Changed Backoffice QRIS upload/removal to use the existing `API.outletSettings` backend methods, while preserving localStorage as compatibility cache/fallback.
- Added a global `exportLogs` alias for the Activity Logs CSV button.

Why:
- Backoffice settings/system scripts had a blocking syntax error.
- QRIS payment configuration was stored only in one browser instead of the outlet source of truth.
- The Activity Logs export button referenced a function name that was not globally available.

Files modified:
- `REFACTOR_PLAN.md`
- `backoffice/frontend/js/pages/system.js`
- `backoffice/frontend/js/pages/activity-logs.js`
- `CHANGELOG.md`

Test result:
- Passed `node --check` for `api-client.js`.
- Passed `node --check` for touched files: `backoffice/frontend/js/pages/system.js`, `backoffice/frontend/js/pages/activity-logs.js`.
- Passed `node --check` for Backoffice page/support scripts: `dashboard.js`, `menu.js`, `kds.js`, `pos.js`, `team.js`, `business.js`, `costs.js`, `engineering.js`, `nav.js`, `data.js`, `utils.js`.
