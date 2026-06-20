-- =====================================================================
-- Migration: Create Missing Tables for Backend Deployment
-- Description: Creates favorites, outlet_settings, token_blacklist, 
--              and analytics_cache tables
-- =====================================================================

-- ─── Favorites Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_position ON favorites(user_id, position);

COMMENT ON TABLE favorites IS 'User favorite products for quick access in POS';
COMMENT ON COLUMN favorites.position IS 'Display order (0-based index)';

-- ─── Outlet Settings Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE UNIQUE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet_id ON outlet_settings(outlet_id);
CREATE INDEX IF NOT EXISTS idx_outlet_settings_json ON outlet_settings USING gin(settings_json);

COMMENT ON TABLE outlet_settings IS 'Outlet-specific settings (receipt customization, customer display)';
COMMENT ON COLUMN outlet_settings.settings_json IS 'JSON storage for flexible settings structure';

-- ─── Token Blacklist Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

COMMENT ON TABLE token_blacklist IS 'Revoked JWT tokens for logout and token rotation';
COMMENT ON COLUMN token_blacklist.token_hash IS 'SHA-256 hash of the token (not raw token)';

-- ─── Analytics Cache Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_outlet ON analytics_cache(outlet_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

COMMENT ON TABLE analytics_cache IS 'Cache for expensive analytics queries (top products, trends)';
COMMENT ON COLUMN analytics_cache.cache_key IS 'Unique key for cache lookup';
COMMENT ON COLUMN analytics_cache.expires_at IS 'Cache expiry timestamp (typically 6 hours)';

-- ─── Cleanup Function for Expired Tokens ──────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tokens IS 'Removes expired tokens from blacklist (run via cron job)';

-- ─── Cleanup Function for Expired Cache ───────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired cache entries (run via cron job)';

-- ─── Success Message ──────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 completed: All 4 tables created successfully';
  RAISE NOTICE '   - favorites (with indexes)';
  RAISE NOTICE '   - outlet_settings (with JSONB index)';
  RAISE NOTICE '   - token_blacklist (with expiry management)';
  RAISE NOTICE '   - analytics_cache (with cleanup function)';
END $$;
