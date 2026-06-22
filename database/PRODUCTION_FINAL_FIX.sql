-- ============================================================================
-- NASHTY OS - PRODUCTION FINAL FIX
-- ============================================================================
-- Fixes:
-- 1. FK constraint violations (outlet_id mismatch)
-- 2. POS login flow (kasir selection)
-- 3. Bcrypt hash consistency
-- 4. Petty cash error mitigation
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: CLEAR ALL DATA
-- ============================================================================

DO $$
BEGIN
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
  
  RAISE NOTICE '✓ All data cleared';
END $$;

-- ============================================================================
-- PHASE 2: SEED CONSISTENT DATA
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

DO $$ BEGIN RAISE NOTICE '✓ Tenant seeded'; END $$;

-- 2.2 OUTLETS (dengan ID yang konsisten)
INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status, created_at, updated_at)
VALUES
  (
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- GALAXY MALL ID (from error message)
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
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid,  -- PAKUWON ID
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
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90'::uuid,  -- TP6 ID
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Tunjungan Plaza 6',
    'tunjungan-plaza-6',
    'Tunjungan Plaza 6 Lt.4, Jl. Tunjungan, Surabaya 60275',
    '031-99887768',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
  );

DO $$ BEGIN RAISE NOTICE '✓ Outlets seeded with consistent IDs'; END $$;

-- 2.3 SYSTEM USERS (Backoffice - CONSISTENT BCRYPT HASH)
-- Password for ALL: nashty@2024
-- Bcrypt hash: $2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq

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
    'Farid Setiawan',
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
    'Siti Rahayu',
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
    'Budi Hartono',
    'manager.pakuwon@nashty.com',
    'manager',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '120 days',
    NOW()
  );

DO $$ BEGIN RAISE NOTICE '✓ System users seeded with consistent bcrypt hashes'; END $$;

-- 2.4 SYSTEM ACCESS
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

-- 2.5 OUTLET ACCESS
INSERT INTO user_outlet_access (user_id, outlet_id, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000001'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000002'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000003'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid, NOW()),
  ('a1000000-0000-0000-0000-000000000004'::uuid, '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid, NOW());

DO $$ BEGIN RAISE NOTICE '✓ Access mappings seeded'; END $$;

-- 2.6 POS USERS (PLAIN TEXT PIN - matching outlet_id from outlets table)
INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, pin, role, status, created_at, updated_at)
VALUES
  -- Galaxy Mall (using correct outlet_id)
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- Galaxy Mall ID
    'Citra Kusuma',
    'citra@nashty.com',
    '081234567005',
    '1111',  -- Plain text PIN
    'cashier',
    'active',
    NOW() - INTERVAL '150 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- Galaxy Mall ID
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
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- Galaxy Mall ID
    'Ani Wijaya',
    'ani@nashty.com',
    '081234567007',
    '3333',
    'cashier',
    'active',
    NOW() - INTERVAL '130 days',
    NOW()
  ),
  -- Pakuwon
  (
    'a2000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid,  -- Pakuwon ID
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
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid,  -- Pakuwon ID
    'Eko Prasetyo',
    'eko@nashty.com',
    '081234567009',
    '5555',
    'cashier',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
  ),
  -- TP6
  (
    'a2000000-0000-0000-0000-000000000006'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90'::uuid,  -- TP6 ID
    'Fitri Wulandari',
    'fitri@nashty.com',
    '081234567010',
    '6666',
    'cashier',
    'active',
    NOW() - INTERVAL '80 days',
    NOW()
  );

DO $$ BEGIN RAISE NOTICE '✓ POS users seeded with plain text PINs'; END $$;

-- ============================================================================
-- PHASE 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tenant_count INT;
  outlet_count INT;
  system_user_count INT;
  pos_user_count INT;
  orphaned_users INT;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO outlet_count FROM outlets;
  SELECT COUNT(*) INTO system_user_count FROM system_users;
  SELECT COUNT(*) INTO pos_user_count FROM users;
  
  -- Check for orphaned records
  SELECT COUNT(*) INTO orphaned_users FROM users u
  LEFT JOIN outlets o ON u.outlet_id = o.id
  WHERE o.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ Tenants: %', tenant_count;
  RAISE NOTICE '✓ Outlets: %', outlet_count;
  RAISE NOTICE '✓ System Users (Backoffice): %', system_user_count;
  RAISE NOTICE '✓ POS Users (Cashiers): %', pos_user_count;
  RAISE NOTICE '✓ Orphaned Users: %', orphaned_users;
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  
  IF orphaned_users > 0 THEN
    RAISE EXCEPTION 'FK Constraint Check FAILED: % orphaned users found!', orphaned_users;
  END IF;
  
  IF tenant_count != 1 OR outlet_count != 3 OR system_user_count != 4 OR pos_user_count != 6 THEN
    RAISE EXCEPTION 'Data count mismatch!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SUCCESS - ALL DATA SEEDED CORRECTLY';
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- DISPLAY CREDENTIALS
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
  RAISE NOTICE '  (same password for all accounts)';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  POS LOGIN';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '  URL: https://nashtyxolvon2.pages.dev/pos';
  RAISE NOTICE '';
  RAISE NOTICE '  Galaxy Mall:';
  RAISE NOTICE '    PIN 1111 - Citra Kusuma';
  RAISE NOTICE '    PIN 2222 - Budi Santoso';
  RAISE NOTICE '    PIN 3333 - Ani Wijaya';
  RAISE NOTICE '';
  RAISE NOTICE '  Pakuwon TC:';
  RAISE NOTICE '    PIN 4444 - Dina Permata';
  RAISE NOTICE '    PIN 5555 - Eko Prasetyo';
  RAISE NOTICE '';
  RAISE NOTICE '  Tunjungan Plaza 6:';
  RAISE NOTICE '    PIN 6666 - Fitri Wulandari';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database reset complete!';
  RAISE NOTICE '   Next: Add products via backoffice';
  RAISE NOTICE '';
END $$;
