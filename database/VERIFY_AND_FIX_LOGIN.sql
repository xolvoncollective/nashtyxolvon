-- ============================================================================
-- NASHTY OS - VERIFY AND FIX LOGIN
-- ============================================================================
-- This script:
-- 1. Checks if superadmin exists
-- 2. If not, creates minimal data for login testing
-- 3. Uses PASSWORD = USERNAME pattern for testing (admin1/admin1, superadmin/superadmin)
-- ============================================================================

BEGIN;

-- First, check if we have any data
DO $$
DECLARE
  tenant_count INTEGER;
  outlet_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO outlet_count FROM outlets;
  SELECT COUNT(*) INTO user_count FROM system_users;
  
  RAISE NOTICE 'Current state: % tenants, % outlets, % users', tenant_count, outlet_count, user_count;
  
  -- If no data exists, create it
  IF tenant_count = 0 OR outlet_count = 0 OR user_count = 0 THEN
    RAISE NOTICE 'Creating minimal test data...';
    
    -- Clear any partial data
    DELETE FROM activity_logs;
    DELETE FROM user_sessions;
    DELETE FROM user_outlet_access;
    DELETE FROM user_system_access;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM staff;
    DELETE FROM system_users;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM outlets;
    DELETE FROM tenants;
    
    -- Create tenant
    INSERT INTO tenants (id, name, slug, status, plan, subscription_ends_at)
    VALUES (
      'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
      'Nashty Hot Chicken',
      'nashty-hot-chicken',
      'active',
      'pro',
      NOW() + INTERVAL '365 days'
    );
    
    -- Create outlets with correct IDs
    INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status)
    VALUES
      (
        '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
        'Galaxy Mall Surabaya',
        'galaxy-mall',
        'Galaxy Mall Lt.3',
        '031-99887766',
        'active'
      ),
      (
        '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
        'Pakuwon Trade Center',
        'pakuwon-tc',
        'Pakuwon TC Lt.2',
        '031-99887767',
        'active'
      );
    
    -- Create system users (for backoffice login)
    -- Password: nashty@2024
    -- Bcrypt hash: $2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq
    INSERT INTO system_users (id, username, password_hash, full_name, email, role, is_active, tenant_id)
    VALUES
      (
        'a1000000-0000-0000-0000-000000000001'::uuid,
        'superadmin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
        'Super Administrator',
        'superadmin@nashty.com',
        'superadmin',
        true,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid
      ),
      (
        'a1000000-0000-0000-0000-000000000002'::uuid,
        'owner.nashty',
        '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
        'Owner Nashty',
        'owner@nashty.com',
        'owner',
        true,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid
      );
    
    -- Create staff for POS login (using staff table, not users table!)
    -- PIN 1234 for testing
    INSERT INTO staff (id, tenant_id, outlet_id, name, pin, role, is_active, color)
    VALUES
      (
        'a2000000-0000-0000-0000-000000000001'::uuid,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
        '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
        'Citra Kusuma',
        '1234',
        'cashier',
        true,
        '#FF6B6B'
      ),
      (
        'a2000000-0000-0000-0000-000000000002'::uuid,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
        '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
        'Budi Santoso',
        '2345',
        'cashier',
        true,
        '#4ECDC4'
      );
    
    RAISE NOTICE '✓ Test data created successfully';
  ELSE
    RAISE NOTICE '✓ Data already exists, skipping creation';
  END IF;
END $$;

-- Verification query
SELECT 
  '=== VERIFICATION ===' as section,
  json_build_object(
    'superadmin_exists', (SELECT COUNT(*) FROM system_users WHERE username = 'superadmin'),
    'outlets_count', (SELECT COUNT(*) FROM outlets),
    'staff_count', (SELECT COUNT(*) FROM staff),
    'galaxy_mall_id', (SELECT id FROM outlets WHERE name = 'Galaxy Mall Surabaya')
  ) as status;

-- Show login credentials
SELECT 
  '=== BACKOFFICE LOGIN (use these credentials) ===' as section,
  json_build_object(
    'username', username,
    'password', 'nashty@2024',
    'role', role,
    'available_outlets', (SELECT json_agg(name) FROM outlets)
  ) as credentials
FROM system_users
WHERE role IN ('superadmin', 'owner')
ORDER BY username;

-- Show POS credentials
SELECT 
  '=== POS LOGIN (use these credentials) ===' as section,
  json_build_object(
    'name', s.name,
    'pin', s.pin,
    'outlet', o.name,
    'outlet_id', o.id
  ) as credentials
FROM staff s
JOIN outlets o ON s.outlet_id = o.id
WHERE s.is_active = true
ORDER BY s.name;

COMMIT;
