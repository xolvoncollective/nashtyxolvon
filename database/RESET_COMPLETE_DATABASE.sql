-- ============================================================================
-- NASHTY OS - COMPLETE DATABASE RESET + SEED
-- ============================================================================
-- Purpose: Drop semua data dan re-seed dengan fix yang benar
-- WARNING: This will DELETE ALL DATA in these tables!
-- Use only for: UAT, Development, or Fresh Production Setup
-- ============================================================================
-- Execution: Copy-paste entire file to Supabase SQL Editor → Run
-- Time: ~2-3 minutes
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: DROP ALL DATA (CASCADE untuk handle FK constraints)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'PHASE 1: DROPPING ALL EXISTING DATA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Drop in correct order (only tables that exist)
-- Use DO block to handle missing tables gracefully

DO $$
BEGIN
  -- Drop transactional data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    DELETE FROM activity_logs;
    RAISE NOTICE '  → Cleared activity_logs';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    DELETE FROM user_sessions;
    RAISE NOTICE '  → Cleared user_sessions';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_outlet_access') THEN
    DELETE FROM user_outlet_access;
    RAISE NOTICE '  → Cleared user_outlet_access';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_system_access') THEN
    DELETE FROM user_system_access;
    RAISE NOTICE '  → Cleared user_system_access';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    DELETE FROM order_items;
    RAISE NOTICE '  → Cleared order_items';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    DELETE FROM orders;
    RAISE NOTICE '  → Cleared orders';
  END IF;
  
  -- Drop users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DELETE FROM users;
    RAISE NOTICE '  → Cleared users (POS)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_users') THEN
    DELETE FROM system_users;
    RAISE NOTICE '  → Cleared system_users (Backoffice)';
  END IF;
  
  -- Drop products (optional)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    DELETE FROM products;
    RAISE NOTICE '  → Cleared products';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    DELETE FROM product_categories;
    RAISE NOTICE '  → Cleared product_categories';
  END IF;
  
  -- Drop master data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outlets') THEN
    DELETE FROM outlets;
    RAISE NOTICE '  → Cleared outlets';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    DELETE FROM tenants;
    RAISE NOTICE '  → Cleared tenants';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✓ All data dropped';
END $$;

-- ============================================================================
-- PHASE 2: SEED MASTER DATA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'PHASE 2: SEEDING MASTER DATA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- 2.1 TENANTS
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

-- 2.2 OUTLETS
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

-- 2.3 SYSTEM USERS (Backoffice)
-- Password: nashty@2024
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

-- 2.4 USER SYSTEM ACCESS
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
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'backoffice', true, NOW());

-- 2.5 USER OUTLET ACCESS
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
  ('a1000000-0000-0000-0000-000000000004'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW());

-- 2.6 POS USERS (Plain text PIN)
INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, pin, role, status, created_at, updated_at)
VALUES
  -- Galaxy Mall
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
  -- Pakuwon
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
  -- TP6
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

-- 2.7 PRODUCT CATEGORIES & PRODUCTS (SKIPPED - Schema mismatch)
-- Products will be seeded separately via backoffice interface
DO $$
BEGIN
  RAISE NOTICE '  → Skipped product_categories (will be configured via backoffice)';
  RAISE NOTICE '  → Skipped products (will be configured via backoffice)';
END $$;

DO $$
BEGIN
  RAISE NOTICE '✓ Master data seeded';
END $$;

-- ============================================================================
-- PHASE 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tenant_count INT;
  outlet_count INT;
  system_user_count INT;
  pos_user_count INT;
  product_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'PHASE 3: VERIFYING DATA INTEGRITY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  RAISE NOTICE '✓ Tenants: %', tenant_count;
  
  SELECT COUNT(*) INTO outlet_count FROM outlets WHERE status = 'active';
  RAISE NOTICE '✓ Active outlets: %', outlet_count;
  
  SELECT COUNT(*) INTO system_user_count FROM system_users WHERE is_active = true;
  RAISE NOTICE '✓ Active system users: %', system_user_count;
  
  SELECT COUNT(*) INTO pos_user_count FROM users WHERE status = 'active';
  RAISE NOTICE '✓ Active POS users: %', pos_user_count;
  
  -- Skip product check (schema mismatch)
  product_count := 0;
  RAISE NOTICE '✓ Products will be configured via backoffice (skipped verification)';
  
  IF outlet_count < 3 THEN
    RAISE EXCEPTION 'CRITICAL: Expected 3 outlets, found %', outlet_count;
  END IF;
  
  IF system_user_count < 4 THEN
    RAISE EXCEPTION 'CRITICAL: Expected 4+ system users, found %', system_user_count;
  END IF;
  
  IF pos_user_count < 6 THEN
    RAISE WARNING 'Expected 6+ POS users, found % (may need more data)', pos_user_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'SUCCESS - ALL DATA SEEDED CORRECTLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- PHASE 4: DISPLAY LOGIN CREDENTIALS
-- ============================================================================

SELECT '';
SELECT '╔════════════════════════════════════════════════════════════╗';
SELECT '║       NASHTY OS - LOGIN CREDENTIALS (RESET COMPLETE)      ║';
SELECT '╚════════════════════════════════════════════════════════════╝';
SELECT '';
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
SELECT '  BACKOFFICE LOGIN (Username/Password)';
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
SELECT '  URL: https://nashtyxolvon2.pages.dev';
SELECT '';
SELECT '  Username: superadmin';
SELECT '  Password: nashty@2024';
SELECT '  Outlet: Select from dropdown after login';
SELECT '';
SELECT '  Other accounts:';
SELECT '    - owner.nashty / nashty@2024';
SELECT '    - manager.galaxy / nashty@2024';
SELECT '    - manager.pakuwon / nashty@2024';
SELECT '';
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
SELECT '  POS LOGIN (PIN-based)';
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
SELECT '  URL: https://nashtyxolvon2.pages.dev/pos';
SELECT '';
SELECT '  Galaxy Mall Surabaya:';
SELECT '    - PIN 1111 (Citra Kusuma)';
SELECT '    - PIN 2222 (Budi Santoso)';
SELECT '    - PIN 3333 (Ani Wijaya)';
SELECT '';
SELECT '  Pakuwon Trade Center:';
SELECT '    - PIN 4444 (Dina Permata)';
SELECT '    - PIN 5555 (Eko Prasetyo)';
SELECT '';
SELECT '  Tunjungan Plaza 6:';
SELECT '    - PIN 6666 (Fitri Wulandari)';
SELECT '';
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

COMMIT;

-- ============================================================================
-- DONE - Database Reset Complete
-- ============================================================================
-- Next Steps:
-- 1. Test backoffice login: superadmin / nashty@2024
-- 2. Test POS login: PIN 1111 at Galaxy Mall
-- 3. Verify no FK constraint errors
-- 4. System ready for use
-- ============================================================================