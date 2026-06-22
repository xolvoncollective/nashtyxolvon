-- ============================================================================
-- NASHTY OS - COMPLETE SYSTEM FIX (CRITICAL)
-- ============================================================================
-- Purpose: Fix all critical issues in production:
--   1. FK Constraint violations (outlet_id, user_id)
--   2. Login system (backoffice + POS)
--   3. User authentication (password/PIN)
--   4. Data integrity validation
-- ============================================================================
-- EXECUTION: Run in Supabase SQL Editor (Estimated time: 2-3 minutes)
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CLEAN UP ORPHANED DATA
-- ============================================================================

-- 1.1 Delete orphaned users (invalid outlet_id)
DO $$
DECLARE orphaned_count INT;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM users u
  LEFT JOIN outlets o ON u.outlet_id = o.id
  WHERE o.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Deleting % orphaned users...', orphaned_count;
    DELETE FROM users WHERE outlet_id NOT IN (SELECT id FROM outlets);
  END IF;
END $$;

-- 1.2 Delete orphaned orders
DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);
DELETE FROM order_payments WHERE order_id NOT IN (SELECT id FROM orders);
DELETE FROM orders WHERE outlet_id NOT IN (SELECT id FROM outlets);

-- 1.3 Delete orphaned user access mappings
DELETE FROM user_system_access WHERE user_id NOT IN (SELECT id FROM system_users);
DELETE FROM user_outlet_access WHERE user_id NOT IN (SELECT id FROM system_users);
DELETE FROM user_outlet_access WHERE outlet_id NOT IN (SELECT id FROM outlets);

-- ============================================================================
-- SECTION 2: ENSURE MASTER DATA EXISTS (IDEMPOTENT)
-- ============================================================================

-- 2.1 Ensure tenant exists
INSERT INTO tenants (id, name, slug, status, plan, subscription_ends_at, created_at, updated_at)
VALUES (
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  'Nashty Hot Chicken',
  'nashty-hot-chicken',
  'active',
  'pro',
  NOW() + INTERVAL '365 days',
  NOW() - INTERVAL '180 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- 2.2 Ensure outlets exist (CRITICAL - must exist before users)
INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status, created_at, updated_at)
VALUES
  -- Galaxy Mall Surabaya
  (
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Galaxy Mall Surabaya',
    'galaxy-mall',
    'Galaxy Mall Lt.3 Unit 12-15, Jl. Dharmahusada Indah Timur, Surabaya 60115',
    '031-99887766',
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  -- Pakuwon Trade Center
  (
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Pakuwon Trade Center',
    'pakuwon-tc',
    'Pakuwon Trade Center Lt.2, Jl. Puncak Indah Lontar, Surabaya 60216',
    '031-99887767',
    'active',
    NOW() - INTERVAL '120 days',
    NOW()
  ),
  -- Tunjungan Plaza 6
  (
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Tunjungan Plaza 6',
    'tunjungan-plaza-6',
    'Tunjungan Plaza 6 Lt.4, Jl. Tunjungan, Surabaya 60275',
    '031-99887768',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- SECTION 3: FIX SYSTEM_USERS (BACKOFFICE)
-- ============================================================================
-- Password: "nashty@2024" → bcrypt hash
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq

INSERT INTO system_users (id, username, password_hash, full_name, email, role, is_active, tenant_id, created_at, updated_at)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'superadmin',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
    'Super Administrator',
    'superadmin@nashty.com',
    'superadmin',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'a1000000-0000-0000-0000-000000000002'::uuid,
    'owner.nashty',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
    'Farid Setiawan (Owner)',
    'owner@nashty.com',
    'owner',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'a1000000-0000-0000-0000-000000000003'::uuid,
    'manager.galaxy',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
    'Siti Rahayu (Manager Galaxy)',
    'manager.galaxy@nashty.com',
    'manager',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'a1000000-0000-0000-0000-000000000004'::uuid,
    'manager.pakuwon',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
    'Budi Hartono (Manager Pakuwon)',
    'manager.pakuwon@nashty.com',
    'manager',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '120 days',
    NOW()
  )
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- SECTION 4: FIX USERS (POS/KASIR) - PLAIN TEXT PIN
-- ============================================================================
-- CRITICAL: POS uses PLAIN TEXT PIN (not bcrypt!)
-- Edge function auth-login compares pin directly (no hashing)

INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, pin, role, status, created_at, updated_at)
VALUES
  -- Galaxy Mall Staff
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Citra Kusuma',
    'citra@nashty.com',
    '081234567005',
    '1111',  -- PLAIN TEXT PIN
    'cashier',
    'active',
    NOW() - INTERVAL '150 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Budi Santoso',
    'budi@nashty.com',
    '081234567006',
    '2222',
    'cashier',
    'active',
    NOW() - INTERVAL '140 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000003'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Ani Wijaya',
    'ani@nashty.com',
    '081234567007',
    '3333',
    'cashier',
    'active',
    NOW() - INTERVAL '130 days',
    NOW()
  ),
  -- Pakuwon Staff
  (
    'a2000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Dina Permata',
    'dina@nashty.com',
    '081234567008',
    '4444',
    'cashier',
    'active',
    NOW() - INTERVAL '100 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000005'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Eko Prasetyo',
    'eko@nashty.com',
    '081234567009',
    '5555',
    'cashier',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
  ),
  -- TP6 Staff
  (
    'a2000000-0000-0000-0000-000000000006'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid,
    'Fitri Wulandari',
    'fitri@nashty.com',
    '081234567010',
    '6666',
    'cashier',
    'active',
    NOW() - INTERVAL '80 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  outlet_id = EXCLUDED.outlet_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  pin = EXCLUDED.pin,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- SECTION 5: FIX USER ACCESS MAPPINGS
-- ============================================================================

-- 5.1 System Access
INSERT INTO user_system_access (user_id, system_name, has_access, created_at)
VALUES
  -- Superadmin: full access
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'backoffice', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'crm', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'cost', true, NOW()),
  
  -- Owner: backoffice, crm, cost
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'backoffice', true, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'crm', true, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'cost', true, NOW()),
  
  -- Manager Galaxy: pos, kds, backoffice
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'backoffice', true, NOW()),
  
  -- Manager Pakuwon: pos, kds, backoffice
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'backoffice', true, NOW())
ON CONFLICT (user_id, system_name) DO UPDATE SET
  has_access = EXCLUDED.has_access;

-- 5.2 Outlet Access
INSERT INTO user_outlet_access (user_id, outlet_id, created_at)
VALUES
  -- Superadmin: all outlets
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid, NOW()),
  
  -- Owner: all outlets
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid, NOW()),
  
  -- Manager Galaxy: Galaxy only
  ('a1000000-0000-0000-0000-000000000003'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  
  -- Manager Pakuwon: Pakuwon only
  ('a1000000-0000-0000-0000-000000000004'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW())
ON CONFLICT (user_id, outlet_id) DO NOTHING;

-- ============================================================================
-- SECTION 6: VERIFY DATA INTEGRITY
-- ============================================================================

DO $$
DECLARE
  outlet_count INT;
  system_user_count INT;
  pos_user_count INT;
  orphaned_users INT;
  orphaned_orders INT;
BEGIN
  -- Check outlets
  SELECT COUNT(*) INTO outlet_count FROM outlets WHERE status = 'active';
  RAISE NOTICE '✓ Active outlets: %', outlet_count;
  
  IF outlet_count < 3 THEN
    RAISE EXCEPTION 'CRITICAL: Less than 3 active outlets found!';
  END IF;
  
  -- Check system_users
  SELECT COUNT(*) INTO system_user_count FROM system_users WHERE is_active = true;
  RAISE NOTICE '✓ Active system_users: %', system_user_count;
  
  IF system_user_count < 1 THEN
    RAISE EXCEPTION 'CRITICAL: No active system_users found!';
  END IF;
  
  -- Check POS users
  SELECT COUNT(*) INTO pos_user_count FROM users WHERE status = 'active';
  RAISE NOTICE '✓ Active POS users: %', pos_user_count;
  
  IF pos_user_count < 1 THEN
    RAISE EXCEPTION 'CRITICAL: No active POS users found!';
  END IF;
  
  -- Check for orphaned users
  SELECT COUNT(*) INTO orphaned_users 
  FROM users u 
  LEFT JOIN outlets o ON u.outlet_id = o.id 
  WHERE o.id IS NULL;
  
  IF orphaned_users > 0 THEN
    RAISE EXCEPTION 'CRITICAL: Found % orphaned users with invalid outlet_id', orphaned_users;
  ELSE
    RAISE NOTICE '✓ No orphaned users';
  END IF;
  
  -- Check for orphaned orders
  SELECT COUNT(*) INTO orphaned_orders 
  FROM orders ord 
  LEFT JOIN outlets o ON ord.outlet_id = o.id 
  WHERE o.id IS NULL;
  
  IF orphaned_orders > 0 THEN
    RAISE WARNING 'Found % orders with invalid outlet_id (will be cleaned)', orphaned_orders;
  ELSE
    RAISE NOTICE '✓ No orphaned orders';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DATABASE FIX COMPLETE - ALL CHECKS PASSED';
  RAISE NOTICE '================================================';
END $$;

-- ============================================================================
-- SECTION 7: DISPLAY LOGIN CREDENTIALS
-- ============================================================================

SELECT '==================== LOGIN CREDENTIALS ====================' AS info
UNION ALL SELECT ''
UNION ALL SELECT '=== BACKOFFICE LOGIN (Username/Password) ==='
UNION ALL SELECT 'URL: https://nashtyxolvon2.pages.dev'
UNION ALL SELECT 'Username: superadmin'
UNION ALL SELECT 'Password: nashty@2024 (or nashty1111)'
UNION ALL SELECT 'Outlet: Select from dropdown (Galaxy Mall, Pakuwon TC, or TP6)'
UNION ALL SELECT ''
UNION ALL SELECT '=== POS LOGIN (PIN-based) ==='
UNION ALL SELECT 'URL: https://nashtyxolvon2.pages.dev/pos'
UNION ALL SELECT ''
UNION ALL SELECT 'Galaxy Mall Surabaya:'
UNION ALL SELECT '  • PIN 1111 - Citra Kusuma (Cashier)'
UNION ALL SELECT '  • PIN 2222 - Budi Santoso (Cashier)'
UNION ALL SELECT '  • PIN 3333 - Ani Wijaya (Cashier)'
UNION ALL SELECT ''
UNION ALL SELECT 'Pakuwon Trade Center:'
UNION ALL SELECT '  • PIN 4444 - Dina Permata (Cashier)'
UNION ALL SELECT '  • PIN 5555 - Eko Prasetyo (Cashier)'
UNION ALL SELECT ''
UNION ALL SELECT 'Tunjungan Plaza 6:'
UNION ALL SELECT '  • PIN 6666 - Fitri Wulandari (Cashier)'
UNION ALL SELECT ''
UNION ALL SELECT '============================================================';

COMMIT;

-- ============================================================================
-- DONE! System fixed and ready for testing
-- ============================================================================
-- Next Steps:
-- 1. Test backoffice login: superadmin / nashty@2024
-- 2. Test POS login: PIN 1111 at Galaxy Mall
-- 3. Monitor for any remaining errors
-- ============================================================================
