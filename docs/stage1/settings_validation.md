# Settings Persistence Validation

This document summarizes the findings from the audit of the settings persistence mechanism.

## Validation Matrix

| Category | Save | Update | Reload | Refresh | Restart | Status | Notes |
|----------|------|--------|--------|---------|---------|--------|-------|
| General | Pass | Pass | Pass | Pass | Pass | ✅ | Flat key-values persist correctly. |
| Tax | Pass | Pass | Pass | Pass | Pass | ✅ | `tax_enabled`, `tax_rate` persist correctly. |
| Currency | Pass | Pass | Pass | Pass | Pass | ✅ | Flat key-value. |
| Nested Settings | Pass | Pass | Fail | Fail | Fail | ❌ | `SettingsService.resolveSettings` does not parse `type = 'json'`. Reload returns stringified JSON, breaking the UI. |
| Receipt | Pass | Pass | Fail | Fail | Fail | ❌ | If sent as nested object `receipt: { header: '...' }`, it suffers from the JSON bug. If sent as `receipt_header`, it works. The UI typically sends nested. |
| Payment Methods | Fail | Fail | Fail | Fail | Fail | ❌ | `PUT /settings/:outletId` entirely ignores the `payment_methods` array. It only processes key-values for the `settings` table. |

## Detailed Issues
1. **JSON Parsing Omission:** `SettingsService.ts` (`resolveSettings`) lacks a `case 'json':` parser. Data is saved correctly to SQLite but returned to the client as a raw JSON string.
2. **Payment Methods Ignored:** The settings `PUT` endpoint fails to iterate or process payment methods. Modifications made in the frontend are discarded without error.

**Conclusion:** Settings persistence is currently BROKEN and requires immediate fixing before Stage 1 is complete.
