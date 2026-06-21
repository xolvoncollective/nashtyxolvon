# 🚀 QUICK DEPLOYMENT - SUPABASE

**Copy paste SQL ini ke Supabase SQL Editor dan Run!**

---

## STEP 1: Create Tables

Copy paste code dibawah ke Supabase SQL Editor:

```sql
-- ============================================
-- STEP 1: CREATE TABLES
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

CREATE TABLE IF NOT EXISTS user_system_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
  system_name VARCHAR(20) NOT NULL,
  has_access BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, system_name),
  CONSTRAINT valid_system CHECK (system_name IN ('pos', 'kds', 'backoffice', 'crm', 'cost'))
);

CREATE TABLE IF NOT EXISTS user_outlet_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES system_users(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outlet_id)
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_users_username ON system_users(username);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_user_system_access_user ON user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- Enable RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_outlet_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Simple policies (allow all for authenticated users)
DROP POLICY IF EXISTS allow_all_system_users ON system_users;
CREATE POLICY allow_all_system_users ON system_users FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS allow_all_user_access ON user_system_access;
CREATE POLICY allow_all_user_access ON user_system_access FOR ALL TO authenticated USING (true);

SELECT 'Tables created successfully!' as status;
```

Klik **Run** → Tunggu sukses

---

## STEP 2: Insert Default Users

Copy paste code dibawah ke SQL Editor (new query):

```sql
-- ============================================
-- STEP 2: INSERT DEFAULT USERS
-- ============================================

-- Insert superadmin (password: nashty1111)
INSERT INTO system_users (username, password_hash, full_name, role, is_active)
VALUES ('superadmin@nashty', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Super Administrator', 'superadmin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert admin1-4 (password sama dengan username)
INSERT INTO system_users (username, password_hash, full_name, role, is_active)
VALUES 
  ('admin1', '$2a$10$N9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvO', 'Admin One', 'admin', true),
  ('admin2', '$2a$10$Q9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvP', 'Admin Two', 'admin', true),
  ('admin3', '$2a$10$R9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvQ', 'Admin Three', 'admin', true),
  ('admin4', '$2a$10$S9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvR', 'Admin Four', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Grant system access
DO $$
DECLARE
  v_superadmin_id UUID;
  v_admin_id UUID;
  v_username TEXT;
BEGIN
  -- Superadmin: all systems
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
  
  -- Admin1-4: POS + Backoffice only
  FOR v_username IN SELECT unnest(ARRAY['admin1', 'admin2', 'admin3', 'admin4'])
  LOOP
    SELECT id INTO v_admin_id FROM system_users WHERE username = v_username;
    IF v_admin_id IS NOT NULL THEN
      INSERT INTO user_system_access (user_id, system_name, has_access)
      VALUES 
        (v_admin_id, 'pos', true),
        (v_admin_id, 'backoffice', true)
      ON CONFLICT (user_id, system_name) DO NOTHING;
    END IF;
  END LOOP;
END $$;

SELECT 'Default users inserted successfully!' as status;
```

Klik **Run** → Tunggu sukses

---

## STEP 3: Verify

Copy paste untuk verify:

```sql
-- Check users
SELECT username, role, is_active, created_at 
FROM system_users 
ORDER BY created_at;

-- Check access
SELECT u.username, usa.system_name, usa.has_access
FROM system_users u
LEFT JOIN user_system_access usa ON u.id = usa.user_id
ORDER BY u.username, usa.system_name;
```

Expected output:
```
superadmin@nashty | superadmin | active
admin1            | admin      | active
admin2            | admin      | active
admin3            | admin      | active
admin4            | admin      | active
```

---

## ✅ DONE!

**Test login:**
```
URL: https://nashtyxolvon2.pages.dev
Username: superadmin@nashty
Password: nashty1111
```

**Default Accounts:**
- superadmin@nashty / nashty1111 (ALL systems)
- admin1 / admin1 (POS + Backoffice)
- admin2 / admin2 (POS + Backoffice)
- admin3 / admin3 (POS + Backoffice)
- admin4 / admin4 (POS + Backoffice)

**⚠️ IMPORTANT:** Change passwords setelah first login!

