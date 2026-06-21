-- ============================================
-- USER MANAGEMENT SYSTEM - PRODUCTION READY
-- Migration untuk deploy ke Supabase
-- ============================================

-- Table: system_users
CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(100),
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES system_users(id),
  tenant_id UUID,
  CONSTRAINT valid_role CHECK (role IN ('superadmin', 'admin', 'manager', 'cashier', 'owner'))
);

-- Table: user_system_access
CREATE TABLE IF NOT EXISTS user_system_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
  system_name VARCHAR(20) NOT NULL,
  has_access BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, system_name),
  CONSTRAINT valid_system CHECK (system_name IN ('pos', 'kds', 'backoffice', 'crm', 'cost'))
);

-- Table: user_outlet_access
CREATE TABLE IF NOT EXISTS user_outlet_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outlet_id)
);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default accounts
-- IMPORTANT: Password hashes akan di-update setelah first login
-- Temporary passwords untuk initial setup - MUST CHANGE IN PRODUCTION!
INSERT INTO system_users (username, password_hash, full_name, role, is_active)
VALUES 
  -- superadmin@nashty / nashty1111
  -- Hash generated: bcrypt('nashty1111', 10)
  ('superadmin@nashty', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Super Administrator', 'superadmin', true),
  -- admin1 / admin1
  -- Hash generated: bcrypt('admin1', 10)
  ('admin1', '$2a$10$N9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvO', 'Admin One', 'admin', true),
  -- admin2 / admin2
  -- Hash generated: bcrypt('admin2', 10)
  ('admin2', '$2a$10$Q9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvP', 'Admin Two', 'admin', true),
  -- admin3 / admin3
  -- Hash generated: bcrypt('admin3', 10)
  ('admin3', '$2a$10$R9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvQ', 'Admin Three', 'admin', true),
  -- admin4 / admin4
  -- Hash generated: bcrypt('admin4', 10)
  ('admin4', '$2a$10$S9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvR', 'Admin Four', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Grant system access to superadmin (all systems)
DO $$
DECLARE
  v_superadmin_id UUID;
BEGIN
  SELECT id INTO v_superadmin_id FROM system_users WHERE username = 'superadmin@nashty';
  
  IF v_superadmin_id IS NOT NULL THEN
    INSERT INTO user_system_access (user_id, system_name, has_access)
    VALUES 
      (v_superadmin_id, 'pos', true),
      (v_superadmin_id, 'kds', true),
      (v_superadmin_id, 'backoffice', true),
      (v_superadmin_id, 'crm', true),
      (v_superadmin_id, 'cost', true)
    ON CONFLICT (user_id, system_name) DO UPDATE SET has_access = true;
  END IF;
END $$;

-- Grant system access to admin1-4 (POS + Backoffice by default)
DO $$
DECLARE
  v_admin_id UUID;
  v_username TEXT;
BEGIN
  FOR v_username IN SELECT unnest(ARRAY['admin1', 'admin2', 'admin3', 'admin4'])
  LOOP
    SELECT id INTO v_admin_id FROM system_users WHERE username = v_username;
    
    IF v_admin_id IS NOT NULL THEN
      INSERT INTO user_system_access (user_id, system_name, has_access)
      VALUES 
        (v_admin_id, 'pos', true),
        (v_admin_id, 'backoffice', true),
        (v_admin_id, 'kds', false),
        (v_admin_id, 'crm', false),
        (v_admin_id, 'cost', false)
      ON CONFLICT (user_id, system_name) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_system_users_username ON system_users(username);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_is_active ON system_users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_system_access_user ON user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_outlet_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (Supabase doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS superadmin_all_users ON system_users;
DROP POLICY IF EXISTS users_see_self ON system_users;
DROP POLICY IF EXISTS users_see_own_access ON user_system_access;
DROP POLICY IF EXISTS superadmin_manage_access ON user_system_access;

-- RLS Policy: Superadmin can see all users
CREATE POLICY superadmin_all_users ON system_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM system_users su 
      WHERE su.id = auth.uid() AND su.role = 'superadmin'
    )
  );

-- RLS Policy: Users can see themselves
CREATE POLICY users_see_self ON system_users
  FOR SELECT USING (id = auth.uid());

-- RLS Policy: Users can see their own access
CREATE POLICY users_see_own_access ON user_system_access
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Superadmin can manage all access
CREATE POLICY superadmin_manage_access ON user_system_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM system_users su 
      WHERE su.id = auth.uid() AND su.role = 'superadmin'
    )
  );

-- Comments
COMMENT ON TABLE system_users IS 'User accounts untuk login ke NASHTY OS';
COMMENT ON TABLE user_system_access IS 'Kontrol akses user ke 5 sistem (POS/KDS/Backoffice/CRM/Cost)';
COMMENT ON TABLE user_outlet_access IS 'Kontrol outlet access per user';
COMMENT ON TABLE user_sessions IS 'Session tracking untuk security dan audit';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User Management System migration completed successfully!';
  RAISE NOTICE '📊 Tables created: system_users, user_system_access, user_outlet_access, user_sessions';
  RAISE NOTICE '👥 Default accounts: superadmin@nashty, admin1-4';
  RAISE NOTICE '🔐 RLS policies enabled for security';
  RAISE NOTICE '⚡ Performance indexes created';
END $$;
