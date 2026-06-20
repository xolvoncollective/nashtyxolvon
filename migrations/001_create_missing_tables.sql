-- Migration 001: Create Missing Tables for Backend API
-- Description: Add favorites, outlet_settings, token_blacklist, analytics_cache tables
-- Date: 2026-06-21
-- Requires: PostgreSQL 12+

-- ============================================================
-- FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product UNIQUE(user_id, product_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_position ON favorites(user_id, position);

-- ============================================================
-- OUTLET SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_outlet_key UNIQUE(outlet_id, key)
);

-- Indexes for outlet_settings
CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet ON outlet_settings(outlet_id);
CREATE INDEX IF NOT EXISTS idx_outlet_settings_key ON outlet_settings(key);
CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet_key ON outlet_settings(outlet_id, key);

-- ============================================================
-- TOKEN BLACKLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for token_blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON token_blacklist(user_id);

-- ============================================================
-- ANALYTICS CACHE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics_cache
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_outlet ON analytics_cache(outlet_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_tenant ON analytics_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify tables were created:
-- SELECT COUNT(*) FROM favorites;
-- SELECT COUNT(*) FROM outlet_settings;
-- SELECT COUNT(*) FROM token_blacklist;
-- SELECT COUNT(*) FROM analytics_cache;

-- Check indexes:
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('favorites', 'outlet_settings', 'token_blacklist', 'analytics_cache')
-- ORDER BY tablename, indexname;

COMMENT ON TABLE favorites IS 'User favorite products for quick access in POS';
COMMENT ON TABLE outlet_settings IS 'Outlet-specific settings (receipt customization, display colors, etc.)';
COMMENT ON TABLE token_blacklist IS 'Invalidated JWT tokens (logout, force logout, token rotation)';
COMMENT ON TABLE analytics_cache IS 'Cached analytics results to reduce expensive aggregation queries';
