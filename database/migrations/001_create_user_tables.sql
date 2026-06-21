-- ============================================
-- USER MANAGEMENT SYSTEM - SIMPLIFIED VERSION
-- For immediate deployment to Supabase
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
  created_by UUID,
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

-- Drop existing policies first
DROP POLICY IF EXISTS superadmin_all_users ON system_users;
DROP POLICY IF EXISTS users_see_self ON system_users;
DROP POLICY IF EXISTS users_see_own_access ON user_system_access;
DROP POLICY IF EXISTS superadmin_manage_access ON user_system_access;

-- Create new policies
CREATE POLICY superadmin_all_users ON system_users
  FOR ALL 
  TO authenticated
  USING (true);

CREATE POLICY users_see_self ON system_users
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY users_see_own_access ON user_system_access
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY superadmin_manage_access ON user_system_access
  FOR ALL 
  TO authenticated
  USING (true);

-- Comments
COMMENT ON TABLE system_users IS 'User accounts untuk login ke NASHTY OS';
COMMENT ON TABLE user_system_access IS 'Kontrol akses user ke 5 sistem (POS/KDS/Backoffice/CRM/Cost)';
COMMENT ON TABLE user_outlet_access IS 'Kontrol outlet access per user';
COMMENT ON TABLE user_sessions IS 'Session tracking untuk security dan audit';
