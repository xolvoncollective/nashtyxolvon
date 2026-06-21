-- Complete Supabase Deployment Migration
-- Adds missing tables and indexes
-- Date: 2026-06-21

-- Create missing tables
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL UNIQUE REFERENCES outlets(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_position ON favorites(user_id, position);
CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet_id ON outlet_settings(outlet_id);
CREATE INDEX IF NOT EXISTS idx_outlet_settings_json ON outlet_settings USING gin(settings_json);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_outlet ON analytics_cache(outlet_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_orders_outlet_date ON orders(outlet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_status ON orders(outlet_id, order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_kitchen ON orders(outlet_id, kitchen_status, created_at) 
  WHERE kitchen_status IN ('pending', 'preparing');
CREATE INDEX IF NOT EXISTS idx_orders_composite ON orders(tenant_id, outlet_id, order_status, payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON orders(shift_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kitchen_status ON order_items(kitchen_status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_date ON order_items(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_outlet_active ON products(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_categories_tenant_order ON categories(tenant_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role, status);
CREATE INDEX IF NOT EXISTS idx_users_outlet ON users(outlet_id) WHERE outlet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shifts_outlet_date ON shifts(outlet_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_open ON shifts(outlet_id, status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_date ON activity_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(tenant_id, action, created_at DESC);

-- Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS favorites_updated_at ON favorites;
CREATE TRIGGER favorites_updated_at BEFORE UPDATE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS outlet_settings_updated_at ON outlet_settings;
CREATE TRIGGER outlet_settings_updated_at BEFORE UPDATE ON outlet_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS analytics_cache_updated_at ON analytics_cache;
CREATE TRIGGER analytics_cache_updated_at BEFORE UPDATE ON analytics_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

DROP POLICY IF EXISTS "outlet_settings_service_role" ON outlet_settings;
CREATE POLICY "outlet_settings_service_role" ON outlet_settings
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "outlet_settings_read_all" ON outlet_settings;
CREATE POLICY "outlet_settings_read_all" ON outlet_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "token_blacklist_service_role" ON token_blacklist;
CREATE POLICY "token_blacklist_service_role" ON token_blacklist
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "analytics_cache_service_role" ON analytics_cache;
CREATE POLICY "analytics_cache_service_role" ON analytics_cache
  USING (auth.role() = 'service_role');
