# Settings Source of Truth - Documentation

**Date:** 2026-06-21  
**Status:** ✅ DOCUMENTED

---

## Settings Architecture

### Storage Strategy

| Setting Type | Storage Location | Access Method | Notes |
|-------------|------------------|---------------|-------|
| **Brand Name** | `outlets.name` | `API.outlets.get()` | Core outlet info |
| **Brand Logo** | `outlets.logo_url` | `API.outletSettings.uploadLogo()` | Supabase Storage |
| **QRIS Static** | `outlets.qris_static_url` | `API.outletSettings.uploadQris()` | Supabase Storage |
| **Receipt Settings** | `settings.settings` (JSONB) | `API.outletSettings.get/set()` | Key-value in settings table |
| **Display Settings** | `settings.settings` (JSONB) | `API.outletSettings.get/set()` | Key-value in settings table |
| **KDS Settings** | `settings.settings` (JSONB) | `API.outletSettings.get/set()` | Key-value in settings table |

---

## Database Schema

### outlets table
```sql
CREATE TABLE outlets (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,              -- Brand name
  logo_url TEXT,                   -- Brand logo URL (Supabase Storage)
  qris_static_url TEXT,            -- QRIS static QR URL (Supabase Storage)
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### settings table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  outlet_id UUID REFERENCES outlets(id),
  settings JSONB NOT NULL DEFAULT '{}',  -- Flexible key-value storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id)
);
```

**settings.settings JSONB structure:**
```json
{
  "kds_warn_minutes": 10,
  "kds_urgent_minutes": 20,
  "kds_sound_enabled": true,
  "kds_auto_sort": true,
  "receipt_show_qris": true,
  "receipt_footer_text": "Terima kasih!",
  "display_timeout_seconds": 30,
  ...
}
```

---

## API Methods

### Brand Settings (outlets table)

```javascript
// Get outlet info (including brand name)
const outlet = await API.outlets.getById(outletId);
console.log(outlet.name); // Brand name

// Update brand name
await API.outlets.update(outletId, { name: 'New Brand Name' });
```

### Upload Assets (Supabase Storage)

```javascript
// Upload brand logo
const result = await API.outletSettings.uploadLogo(file);
// Result: { success: true, logo_url: 'https://...' }

// Upload QRIS
const result = await API.outletSettings.uploadQris(file);
// Result: { success: true, qris_static_url: 'https://...' }

// Remove QRIS
await API.outletSettings.removeQris();
```

### Key-Value Settings (settings table)

```javascript
// Get all settings
const result = await API.outletSettings.get(outletId);
console.log(result.settings); // { kds_warn_minutes: 10, ... }

// Update specific setting
await API.outletSettings.set(outletId, {
  kds_warn_minutes: 15,
  receipt_show_qris: true
});
```

---

## Migration Note

**outlet_settings table:** 
- Not currently used in production
- If needed in future, would store outlet-specific overrides
- Current architecture uses `settings.settings` JSONB for flexibility

**No migration required** - current schema is sufficient.

---

## Code References

**Implementation Files:**
- `api-client.js` - Lines ~450-550: `API.outletSettings` methods
- `backoffice/frontend/js/pages/system.js` - Settings UI
- `supabase/functions/settings-api/index.ts` - Settings Edge Function

---

**Last Updated:** 2026-06-21
