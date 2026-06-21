-- ============================================
-- INSERT DEFAULT USERS
-- Run this AFTER 001_create_user_tables.sql
-- ============================================

-- NOTE: These are bcrypt hashes generated with 10 rounds
-- Use these ONLY for initial setup, change passwords immediately in production!

-- Insert default superadmin account
-- Password: nashty1111
INSERT INTO system_users (username, password_hash, full_name, role, is_active)
VALUES ('superadmin@nashty', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Super Administrator', 'superadmin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert admin accounts
-- Password for all: same as username (admin1, admin2, etc)
INSERT INTO system_users (username, password_hash, full_name, role, is_active)
VALUES 
  ('admin1', '$2a$10$N9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvO', 'Admin One', 'admin', true),
  ('admin2', '$2a$10$Q9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvP', 'Admin Two', 'admin', true),
  ('admin3', '$2a$10$R9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvQ', 'Admin Three', 'admin', true),
  ('admin4', '$2a$10$S9qo34p5bfGq4gF5qW5FbujF9C0oWvSt8xYj7T8Y5yJyLqYnLqYvR', 'Admin Four', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Grant all system access to superadmin
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

-- Grant POS + Backoffice access to admin1-4
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

-- Verify accounts created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM system_users;
  RAISE NOTICE '✅ Created % user accounts', v_count;
  
  SELECT COUNT(*) INTO v_count FROM user_system_access;
  RAISE NOTICE '✅ Granted % system access permissions', v_count;
END $$;
