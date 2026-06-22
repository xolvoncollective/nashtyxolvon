-- ============================================================================
-- NASHTY OS - FINAL PRODUCTION RESET (Corrected Schema)
-- ============================================================================
-- Purpose: Complete database reset matching actual schema
-- WARNING: This will DELETE ALL DATA
-- Execution: Copy-paste to Supabase SQL Editor → Run
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: DROP ALL DATA
-- ============================================================================

DELETE FROM activity_logs WHERE true;
DELETE FROM user_sessions WHERE true;
DELETE FROM user_outlet_access WHERE true;
DELETE FROM user_system_access WHERE true;
DELETE FROM order_items WHERE true;
DELETE FROM orders WHERE true;
DELETE FROM users WHERE true;
DELETE FROM system_users WHERE true;
DELETE FROM products WHERE true;
DELETE FROM categories WHERE true;
DELETE FROM outlets WHERE true;
DELETE FROM tenants WHERE true;

-- ============================================================================
-- PHASE 2: SEED MASTER DATA
-- ============================================================================

-- 2.1 TENANT
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
);

-- 2.2 OUTLETS (3 outlets)
INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status, created_at, updated_at)
VALUES
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
  );

-- 2.3 SYSTEM USERS (Backoffice - bcrypt hashed password)
-- Password: nashty@2024
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
  );

-- 2.4 SYSTEM ACCESS MAPPING
INSERT INTO user_system_access (user_id, system_name, has_access, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'backoffice', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'crm', true, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'cost', true, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'backoffice', true, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'crm', true, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'cost', true, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'backoffice', true, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'pos', true, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'kds', true, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'backoffice', true, NOW());

-- 2.5 OUTLET ACCESS MAPPING
INSERT INTO user_outlet_access (user_id, outlet_id, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW());

-- 2.6 POS USERS (Plain text PIN - as required)
INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, pin, role, status, created_at, updated_at)
VALUES
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Citra Kusuma',
    'citra@nashty.com',
    '081234567005',
    '1111',
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
  );

-- ============================================================================
-- PHASE 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tenant_count INT;
  outlet_count INT;
  system_user_count INT;
  pos_user_count INT;
  system_access_count INT;
  outlet_access_count INT;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO outlet_count FROM outlets;
  SELECT COUNT(*) INTO system_user_count FROM system_users;
  SELECT COUNT(*) INTO pos_user_count FROM users;
  SELECT COUNT(*) INTO system_access_count FROM user_system_access;
  SELECT COUNT(*) INTO outlet_access_count FROM user_outlet_access;
  
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ Tenants: %', tenant_count;
  RAISE NOTICE '✓ Outlets: %', outlet_count;
  RAISE NOTICE '✓ System Users (Backoffice): %', system_user_count;
  RAISE NOTICE '✓ POS Users: %', pos_user_count;
  RAISE NOTICE '✓ System Access Mappings: %', system_access_count;
  RAISE NOTICE '✓ Outlet Access Mappings: %', outlet_access_count;
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  
  IF tenant_count != 1 OR outlet_count != 3 OR system_user_count != 4 OR pos_user_count != 6 THEN
    RAISE EXCEPTION 'Data seeding verification FAILED!';
  END IF;
  
  RAISE NOTICE 'SUCCESS - ALL DATA SEEDED CORRECTLY';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- DISPLAY FINAL STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║            NASHTY OS - LOGIN CREDENTIALS                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  BACKOFFICE LOGIN';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  URL: https://nashtyxolvon2.pages.dev';
  RAISE NOTICE '  Username: superadmin';
  RAISE NOTICE '  Password: nashty@2024';
  RAISE NOTICE '';
  RAISE NOTICE '  Other accounts (same password):';
  RAISE NOTICE '    - owner.nashty';
  RAISE NOTICE '    - manager.galaxy';
  RAISE NOTICE '    - manager.pakuwon';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  POS LOGIN';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  URL: https://nashtyxolvon2.pages.dev/pos';
  RAISE NOTICE '';
  RAISE NOTICE '  Galaxy Mall (3 cashiers):';
  RAISE NOTICE '    PIN 1111 - Citra Kusuma';
  RAISE NOTICE '    PIN 2222 - Budi Santoso';
  RAISE NOTICE '    PIN 3333 - Ani Wijaya';
  RAISE NOTICE '';
  RAISE NOTICE '  Pakuwon TC (2 cashiers):';
  RAISE NOTICE '    PIN 4444 - Dina Permata';
  RAISE NOTICE '    PIN 5555 - Eko Prasetyo';
  RAISE NOTICE '';
  RAISE NOTICE '  Tunjungan Plaza 6 (1 cashier):';
  RAISE NOTICE '    PIN 6666 - Fitri Wulandari';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database reset complete - ready to use!';
  RAISE NOTICE '   Next: Add products via backoffice interface';
  RAISE NOTICE '';
END $$;
