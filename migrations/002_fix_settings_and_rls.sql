-- ============================================================
-- Migration 002: Fix outlet_settings schema & Add RLS + Triggers
-- Date: 2026-06-21
-- Safe to re-run (idempotent)
-- ============================================================

-- ─── Fix outlet_settings: Add settings_json column if missing ─────────────────
-- The original migration used key/value pairs; backend API expects settings_json JSONB
DO $$
BEGIN
  -- Add settings_json column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outlet_settings' AND column_name = 'settings_json'
  ) THEN
    ALTER TABLE outlet_settings ADD COLUMN settings_json JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Remove old key/value constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outlet_settings' AND column_name = 'key'
  ) THEN
    -- Convert to single-row-per-outlet pattern
    -- Migrate existing key-value data into settings_json
    UPDATE outlet_settings os SET settings_json = (
      SELECT jsonb_object_agg(key, value) 
      FROM outlet_settings os2 
      WHERE os2.outlet_id = os.outlet_id
    ) WHERE settings_json = '{}'::jsonb OR settings_json IS NULL;
  END IF;
END $$;

-- Re-add unique constraint on outlet_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'outlet_settings_outlet_unique'
  ) THEN
    ALTER TABLE outlet_settings DROP CONSTRAINT IF EXISTS unique_outlet_key;
    ALTER TABLE outlet_settings ADD CONSTRAINT outlet_settings_outlet_unique UNIQUE (outlet_id);
  END IF;
END $$;

-- ─── Add updated_at to favorites if missing ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorites' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE favorites ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ─── Auto-update trigger function ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS favorites_updated_at ON favorites;
CREATE TRIGGER favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS outlet_settings_updated_at ON outlet_settings;
CREATE TRIGGER outlet_settings_updated_at
  BEFORE UPDATE ON outlet_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS analytics_cache_updated_at ON analytics_cache;
CREATE TRIGGER analytics_cache_updated_at
  BEFORE UPDATE ON analytics_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Enable RLS on all 4 new tables ──────────────────────────────────────────
ALTER TABLE favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlet_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache  ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies: favorites ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "favorites_own_select" ON favorites;
CREATE POLICY "favorites_own_select" ON favorites
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "favorites_own_insert" ON favorites;
CREATE POLICY "favorites_own_insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "favorites_own_update" ON favorites;
CREATE POLICY "favorites_own_update" ON favorites
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "favorites_own_delete" ON favorites;
CREATE POLICY "favorites_own_delete" ON favorites
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ─── RLS Policies: outlet_settings ───────────────────────────────────────────
DROP POLICY IF EXISTS "outlet_settings_service_role" ON outlet_settings;
CREATE POLICY "outlet_settings_service_role" ON outlet_settings
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "outlet_settings_read_all" ON outlet_settings;
CREATE POLICY "outlet_settings_read_all" ON outlet_settings
  FOR SELECT USING (true);

-- ─── RLS Policies: token_blacklist ────────────────────────────────────────────
DROP POLICY IF EXISTS "token_blacklist_service_role" ON token_blacklist;
CREATE POLICY "token_blacklist_service_role" ON token_blacklist
  USING (auth.role() = 'service_role');

-- ─── RLS Policies: analytics_cache ───────────────────────────────────────────
DROP POLICY IF EXISTS "analytics_cache_service_role" ON analytics_cache;
CREATE POLICY "analytics_cache_service_role" ON analytics_cache
  USING (auth.role() = 'service_role');

-- ─── Supabase Storage Buckets ────────────────────────────────────────────────
-- Run in Supabase Dashboard > Storage or via Management API:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 'receipts', true, 2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions', 'promotions', true, 5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS policies for receipts bucket
DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;
CREATE POLICY "receipts_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_auth_insert" ON storage.objects;
CREATE POLICY "receipts_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "receipts_auth_update" ON storage.objects;
CREATE POLICY "receipts_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'receipts' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "receipts_auth_delete" ON storage.objects;
CREATE POLICY "receipts_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND auth.role() = 'service_role');

-- Storage RLS policies for promotions bucket
DROP POLICY IF EXISTS "promotions_public_read" ON storage.objects;
CREATE POLICY "promotions_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'promotions');

DROP POLICY IF EXISTS "promotions_auth_insert" ON storage.objects;
CREATE POLICY "promotions_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'promotions' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "promotions_auth_update" ON storage.objects;
CREATE POLICY "promotions_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'promotions' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- ─── VERIFICATION ─────────────────────────────────────────────────────────────
-- SELECT 'Migration 002 complete' AS status;
-- SELECT table_name, column_name FROM information_schema.columns
--   WHERE table_name = 'outlet_settings' AND column_name = 'settings_json';
