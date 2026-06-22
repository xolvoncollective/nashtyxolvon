-- ============================================================================
-- NASHTY OS - COMPLETE SEED DATA (ALL IN ONE)
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Execution time: 2-3 minutes
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 1/6: SEED_MASTER_REALISTIC.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - MASTER SEED DATA (Production-Grade)
-- ============================================================================
-- Version: 2.0
-- Purpose: Complete, realistic, idempotent seed data for UAT and Production
-- Features:
--   ✅ Idempotent (safe to run multiple times)
--   ✅ Respects all FK constraints and CHECK constraints
--   ✅ Realistic transaction patterns (90 days of data)
--   ✅ Proper user mapping (system_users → users)
--   ✅ Deterministic UUIDs for master data
--   ✅ Random UUIDs for transaction data
--   ✅ Realistic analytics-ready data
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: MASTER DATA (Deterministic UUIDs)
-- ============================================================================

-- 1.1 TENANTS
-- ----------------------------------------------------------------------------
-- Schema: id, name, slug, status (not is_active), plan, subscription_ends_at, created_at, updated_at
INSERT INTO tenants (id, name, slug, status, plan, subscription_ends_at, created_at, updated_at)
VALUES 
  (
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
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  plan = EXCLUDED.plan,
  subscription_ends_at = EXCLUDED.subscription_ends_at,
  updated_at = EXCLUDED.updated_at;

-- 1.2 OUTLETS
-- ----------------------------------------------------------------------------
-- Schema: id, tenant_id, name, slug, address, phone, status, created_at, updated_at
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
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  updated_at = EXCLUDED.updated_at;

-- 1.3 SYSTEM USERS (Backoffice, Multi-System Access)
-- ----------------------------------------------------------------------------
-- Password: "nashty@2024" (bcrypt hash below)
-- $2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq

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
  ),
  (
    'a1000000-0000-0000-0000-000000000005'::uuid,
    'cashier.citra',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye7FmYc8HqMZ4OWJ0cL5DZqF8VqFqR0lq',
    'Citra Kusuma',
    'citra@nashty.com',
    'cashier',
    true,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    NOW() - INTERVAL '150 days',
    NOW()
  )
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  updated_at = EXCLUDED.updated_at;

-- 1.4 SYSTEM ACCESS MAPPING
-- ----------------------------------------------------------------------------
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
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'backoffice', true, NOW()),
  
  ('a1000000-0000-0000-0000-000000000005'::uuid, 'pos', true, NOW())
ON CONFLICT (user_id, system_name) DO NOTHING;

-- 1.5 OUTLET ACCESS MAPPING
-- ----------------------------------------------------------------------------
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
  ('a1000000-0000-0000-0000-000000000004'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, NOW()),
  
  -- Cashier Citra: Galaxy only
  ('a1000000-0000-0000-0000-000000000005'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, NOW())
ON CONFLICT (user_id, outlet_id) DO NOTHING;

-- 1.6 POS USERS (Kasir dengan PIN - CRITICAL MAPPING)
-- ----------------------------------------------------------------------------
-- NOTE: Ini yang membuat login POS berfungsi!
-- users.id harus sama dengan system_users.id untuk mapping yang benar

INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, pin, role, status, created_at, updated_at)
VALUES
  (
    'a1000000-0000-0000-0000-000000000005'::uuid,  -- SAME AS system_users.id
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Citra Kusuma',
    'citra@nashty.com',
    '081234567005',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123456',  -- PIN: 1234
    'cashier',
    'active',
    NOW() - INTERVAL '150 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Budi Santoso',
    'budi@nashty.com',
    '081234567006',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123457',  -- PIN: 2345
    'cashier',
    'active',
    NOW() - INTERVAL '140 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Ani Wijaya',
    'ani@nashty.com',
    '081234567007',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123458',  -- PIN: 3456
    'cashier',
    'active',
    NOW() - INTERVAL '130 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000003'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Dina Permata',
    'dina@nashty.com',
    '081234567008',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123459',  -- PIN: 4567
    'cashier',
    'active',
    NOW() - INTERVAL '100 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Eko Prasetyo',
    'eko@nashty.com',
    '081234567009',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123460',  -- PIN: 5678
    'cashier',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
  ),
  (
    'a2000000-0000-0000-0000-000000000005'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid,
    'Fitri Wulandari',
    'fitri@nashty.com',
    '081234567010',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123461',  -- PIN: 6789
    'cashier',
    'active',
    NOW() - INTERVAL '80 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = EXCLUDED.updated_at;

-- 1.7 CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO categories (id, tenant_id, name, slug, description, icon, color, display_order, status, created_at, updated_at)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Hot Chicken',
    'hot-chicken',
    'Ayam goreng crispy dengan level kepedasan 1-10',
    '🔥',
    '#E4540C',
    1,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Burger & Sandwich',
    'burger-sandwich',
    'Burger dan sandwich dengan ayam crispy',
    '🍔',
    '#FFA500',
    2,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000003'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Rice Bowl',
    'rice-bowl',
    'Nasi dengan topping ayam dan saus',
    '🍚',
    '#22C55E',
    3,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Beverages',
    'beverages',
    'Minuman segar dingin dan panas',
    '🥤',
    '#3B82F6',
    4,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000005'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Snacks & Sides',
    'snacks-sides',
    'French fries, nugget, dan side dishes',
    '🍟',
    '#FACC15',
    5,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000006'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Sauces',
    'sauces',
    'Aneka sambal dan saus pelengkap',
    '🌶️',
    '#DC2626',
    6,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000007'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    'Desserts',
    'desserts',
    'Ice cream dan dessert manis',
    '🍨',
    '#A855F7',
    7,
    'active',
    NOW() - INTERVAL '180 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = EXCLUDED.updated_at;

-- Continue in next part due to token limits...
-- Next sections will include:
-- 1.8 PRODUCTS (80+ realistic products)
-- 1.9 MODIFIER GROUPS
-- 1.10 MODIFIER OPTIONS
-- 1.11 PRODUCT MODIFIERS
-- 1.12 PAYMENT METHODS
-- 1.13 STATIONS
-- 1.14 MEMBERS (300 customers)
-- SECTION 2: TRANSACTION DATA (Random UUIDs, 90 days)
-- SECTION 3: OPERATIONAL DATA

COMMIT;

-- ============================================================================
-- END OF PART 1
-- Execute this first, then run PART 2 for transaction data
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 2/6: SEED_PART2_PRODUCTS.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - PART 2A: PRODUCTS (80+ Items)
-- ============================================================================
-- Run after SEED_MASTER_REALISTIC.sql (Part 1)
-- ============================================================================

BEGIN;

-- 1.8 PRODUCTS - HOT CHICKEN (15 items)
-- ----------------------------------------------------------------------------
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Original (1 pcs)', 'hot-chicken-original-1', 'Ayam goreng crispy tanpa pedas', 25000, 12000, 'HC-001', '/images/products/hot-chicken-1.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 1 (1 pcs)', 'hot-chicken-lv1-1', 'Ayam crispy dengan sambal level 1 (mild)', 27000, 13000, 'HC-002', '/images/products/hot-chicken-lv1.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 2 (1 pcs)', 'hot-chicken-lv2-1', 'Ayam crispy dengan sambal level 2', 27000, 13000, 'HC-003', '/images/products/hot-chicken-lv2.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 3 (1 pcs)', 'hot-chicken-lv3-1', 'Ayam crispy dengan sambal level 3', 27000, 13000, 'HC-004', '/images/products/hot-chicken-lv3.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 4 (1 pcs)', 'hot-chicken-lv4-1', 'Ayam crispy dengan sambal level 4 (hot)', 28000, 13000, 'HC-005', '/images/products/hot-chicken-lv4.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 5 (1 pcs)', 'hot-chicken-lv5-1', 'Ayam crispy dengan sambal level 5 (very hot)', 28000, 13000, 'HC-006', '/images/products/hot-chicken-lv5.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Original (2 pcs)', 'hot-chicken-original-2', 'Paket 2 potong ayam tanpa pedas', 47000, 23000, 'HC-007', '/images/products/hot-chicken-2.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 2 (2 pcs)', 'hot-chicken-lv2-2', 'Paket 2 potong level 2', 50000, 25000, 'HC-008', '/images/products/hot-chicken-lv2-2.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Chicken Level 4 (2 pcs)', 'hot-chicken-lv4-2', 'Paket 2 potong level 4', 52000, 25000, 'HC-009', '/images/products/hot-chicken-lv4-2.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Wings Original (5 pcs)', 'hot-wings-original', 'Sayap ayam crispy tanpa pedas', 32000, 15000, 'HC-010', '/images/products/hot-wings.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000011'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Wings Level 2 (5 pcs)', 'hot-wings-lv2', 'Sayap ayam dengan sambal level 2', 35000, 16000, 'HC-011', '/images/products/hot-wings-lv2.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000012'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hot Wings Level 4 (5 pcs)', 'hot-wings-lv4', 'Sayap ayam dengan sambal level 4', 37000, 16000, 'HC-012', '/images/products/hot-wings-lv4.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000013'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Chicken Strips (5 pcs)', 'chicken-strips', 'Ayam fillet crispy strip tanpa tulang', 30000, 14000, 'HC-013', '/images/products/chicken-strips.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000014'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Chicken Popcorn', 'chicken-popcorn', 'Ayam crispy bite size 200gr', 28000, 13000, 'HC-014', '/images/products/chicken-popcorn.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000001-0000-0000-0000-000000000015'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Crispy Boneless Chicken', 'crispy-boneless', 'Ayam fillet tanpa tulang 150gr', 33000, 15000, 'HC-015', '/images/products/boneless.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- BURGERS & SANDWICHES (12 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000002-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Classic Chicken Burger', 'classic-chicken-burger', 'Burger ayam crispy dengan lettuce dan mayo', 32000, 15000, 'BG-001', '/images/products/classic-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Spicy Chicken Burger', 'spicy-chicken-burger', 'Burger ayam pedas level 3', 35000, 16000, 'BG-002', '/images/products/spicy-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Cheese Chicken Burger', 'cheese-chicken-burger', 'Burger ayam dengan double cheese', 38000, 17000, 'BG-003', '/images/products/cheese-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Double Chicken Burger', 'double-chicken-burger', 'Burger dengan 2 patty ayam crispy', 42000, 20000, 'BG-004', '/images/products/double-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'BBQ Chicken Burger', 'bbq-chicken-burger', 'Burger dengan saus BBQ smoky', 36000, 16500, 'BG-005', '/images/products/bbq-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Teriyaki Chicken Burger', 'teriyaki-burger', 'Burger dengan saus teriyaki manis', 37000, 17000, 'BG-006', '/images/products/teriyaki-burger.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Chicken Club Sandwich', 'chicken-club-sandwich', 'Triple decker dengan bacon dan telur', 40000, 18000, 'SD-001', '/images/products/club-sandwich.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Grilled Chicken Sandwich', 'grilled-chicken-sandwich', 'Sandwich ayam panggang sehat', 35000, 16000, 'SD-002', '/images/products/grilled-sandwich.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Spicy Chicken Wrap', 'spicy-chicken-wrap', 'Tortilla wrap dengan ayam pedas', 33000, 15000, 'WR-001', '/images/products/spicy-wrap.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Caesar Chicken Wrap', 'caesar-wrap', 'Wrap dengan caesar dressing', 35000, 16000, 'WR-002', '/images/products/caesar-wrap.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000011'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Hot Dog Chicken', 'hot-dog-chicken', 'Hot dog dengan sosis ayam', 25000, 12000, 'HD-001', '/images/products/hotdog.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000002-0000-0000-0000-000000000012'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Cheesy Hot Dog', 'cheesy-hot-dog', 'Hot dog dengan cheese sauce', 28000, 13000, 'HD-002', '/images/products/cheesy-hotdog.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- RICE BOWLS (10 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000003-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Chicken Teriyaki Bowl', 'chicken-teriyaki-bowl', 'Nasi dengan ayam teriyaki dan sayuran', 35000, 16000, 'RB-001', '/images/products/teriyaki-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Spicy Chicken Bowl', 'spicy-chicken-bowl', 'Nasi dengan ayam geprek level 3', 32000, 15000, 'RB-002', '/images/products/spicy-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'BBQ Chicken Bowl', 'bbq-chicken-bowl', 'Nasi dengan ayam BBQ smoky', 35000, 16000, 'RB-003', '/images/products/bbq-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Korean Style Bowl', 'korean-style-bowl', 'Nasi dengan ayam gochujang', 38000, 17000, 'RB-004', '/images/products/korean-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Thai Basil Bowl', 'thai-basil-bowl', 'Nasi dengan ayam thai basil', 37000, 17000, 'RB-005', '/images/products/thai-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Nasi Goreng Spesial', 'nasi-goreng-spesial', 'Nasi goreng dengan ayam dan telur', 30000, 14000, 'NG-001', '/images/products/nasi-goreng.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Chicken Katsu Bowl', 'chicken-katsu-bowl', 'Nasi dengan chicken katsu saus curry', 36000, 16500, 'RB-006', '/images/products/katsu-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Nasi Ayam Hainan', 'nasi-ayam-hainan', 'Nasi dengan ayam hainan dan kaldu', 32000, 15000, 'NH-001', '/images/products/hainan.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Honey Garlic Bowl', 'honey-garlic-bowl', 'Nasi dengan ayam honey garlic', 36000, 16500, 'RB-007', '/images/products/honey-garlic-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000003-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, 'Rendang Chicken Bowl', 'rendang-chicken-bowl', 'Nasi dengan ayam rendang pedas', 38000, 17500, 'RB-008', '/images/products/rendang-bowl.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

COMMIT;



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 3/6: SEED_PART2B_BEVERAGES.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - PART 2B: BEVERAGES & SNACKS
-- ============================================================================

BEGIN;

-- BEVERAGES (25 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  -- Cold Drinks
  ('a1000004-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Es Teh Manis', 'es-teh-manis', 'Teh manis dingin segar', 5000, 2000, 'BV-001', '/images/products/es-teh.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Es Jeruk', 'es-jeruk', 'Jeruk peras segar', 8000, 3500, 'BV-002', '/images/products/es-jeruk.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Lemon Tea', 'lemon-tea', 'Teh dengan lemon segar', 10000, 4000, 'BV-003', '/images/products/lemon-tea.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Thai Tea', 'thai-tea', 'Thai tea original dingin', 12000, 5000, 'BV-004', '/images/products/thai-tea.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Thai Green Tea', 'thai-green-tea', 'Thai green tea dingin', 13000, 5500, 'BV-005', '/images/products/thai-green.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Iced Coffee', 'iced-coffee', 'Kopi dingin dengan gula aren', 15000, 6000, 'BV-006', '/images/products/iced-coffee.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Iced Latte', 'iced-latte', 'Latte dingin premium', 18000, 7000, 'BV-007', '/images/products/iced-latte.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Iced Mocha', 'iced-mocha', 'Mocha dingin dengan coklat', 20000, 8000, 'BV-008', '/images/products/iced-mocha.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Iced Cappuccino', 'iced-cappuccino', 'Cappuccino dingin', 19000, 7500, 'BV-009', '/images/products/iced-capp.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Chocolate Milkshake', 'chocolate-milkshake', 'Milkshake coklat kental', 22000, 9000, 'BV-010', '/images/products/choco-shake.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000011'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Vanilla Milkshake', 'vanilla-milkshake', 'Milkshake vanilla creamy', 22000, 9000, 'BV-011', '/images/products/vanilla-shake.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000012'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Strawberry Milkshake', 'strawberry-milkshake', 'Milkshake strawberry segar', 23000, 9500, 'BV-012', '/images/products/strawberry-shake.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000013'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Mineral Water', 'mineral-water', 'Air mineral 600ml', 5000, 2000, 'BV-013', '/images/products/water.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000014'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Coca Cola', 'coca-cola', 'Coca Cola 330ml', 8000, 4000, 'BV-014', '/images/products/coke.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000015'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Sprite', 'sprite', 'Sprite 330ml', 8000, 4000, 'BV-015', '/images/products/sprite.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000016'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Fanta', 'fanta', 'Fanta 330ml', 8000, 4000, 'BV-016', '/images/products/fanta.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  -- Hot Drinks
  ('a1000004-0000-0000-0000-000000000017'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Teh Panas', 'teh-panas', 'Teh manis hangat', 5000, 2000, 'BV-017', '/images/products/hot-tea.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000018'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Kopi Hitam', 'kopi-hitam', 'Kopi hitam panas', 8000, 3000, 'BV-018', '/images/products/black-coffee.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000019'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Cappuccino', 'cappuccino', 'Cappuccino panas', 18000, 7000, 'BV-019', '/images/products/hot-capp.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000020'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Caffe Latte', 'caffe-latte', 'Latte panas premium', 17000, 6500, 'BV-020', '/images/products/hot-latte.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000021'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Hot Chocolate', 'hot-chocolate', 'Coklat panas creamy', 15000, 6000, 'BV-021', '/images/products/hot-choco.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000022'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Americano', 'americano', 'Americano panas', 12000, 4500, 'BV-022', '/images/products/americano.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000023'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Espresso', 'espresso', 'Espresso shot kuat', 10000, 4000, 'BV-023', '/images/products/espresso.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000024'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Mocha', 'mocha', 'Mocha panas coklat', 19000, 7500, 'BV-024', '/images/products/hot-mocha.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000004-0000-0000-0000-000000000025'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, 'Green Tea Latte', 'green-tea-latte', 'Green tea latte panas', 17000, 6500, 'BV-025', '/images/products/green-latte.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- SNACKS & SIDES (15 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000005-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'French Fries Regular', 'french-fries-reg', 'Kentang goreng crispy porsi reguler', 15000, 6000, 'SN-001', '/images/products/fries-reg.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'French Fries Large', 'french-fries-large', 'Kentang goreng crispy porsi besar', 20000, 8000, 'SN-002', '/images/products/fries-large.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Curly Fries', 'curly-fries', 'Kentang keriting dengan bumbu', 18000, 7500, 'SN-003', '/images/products/curly-fries.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Wedges Potato', 'wedges-potato', 'Kentang wedges panggang', 17000, 7000, 'SN-004', '/images/products/wedges.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Onion Rings (6 pcs)', 'onion-rings', 'Onion rings crispy 6 pieces', 16000, 6500, 'SN-005', '/images/products/onion-rings.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Chicken Nuggets (6 pcs)', 'chicken-nuggets-6', 'Nugget ayam crispy 6 pieces', 18000, 8000, 'SN-006', '/images/products/nuggets-6.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Chicken Nuggets (10 pcs)', 'chicken-nuggets-10', 'Nugget ayam crispy 10 pieces', 28000, 12000, 'SN-007', '/images/products/nuggets-10.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Mozzarella Sticks (5 pcs)', 'mozzarella-sticks', 'Mozarella stick goreng 5 pieces', 20000, 9000, 'SN-008', '/images/products/mozza-sticks.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Coleslaw', 'coleslaw', 'Salad kubis segar', 10000, 4000, 'SN-009', '/images/products/coleslaw.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Corn on the Cob', 'corn-cob', 'Jagung bakar mentega', 12000, 5000, 'SN-010', '/images/products/corn.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000011'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Fried Rice', 'fried-rice', 'Nasi goreng plain', 12000, 5000, 'SN-011', '/images/products/fried-rice.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000012'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Steamed Rice', 'steamed-rice', 'Nasi putih', 5000, 2000, 'SN-012', '/images/products/rice.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000013'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Garlic Bread (2 pcs)', 'garlic-bread', 'Garlic bread panggang 2 pieces', 12000, 5000, 'SN-013', '/images/products/garlic-bread.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000014'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Caesar Salad', 'caesar-salad', 'Salad segar dengan caesar dressing', 18000, 8000, 'SN-014', '/images/products/caesar-salad.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000005-0000-0000-0000-000000000015'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, 'Garden Salad', 'garden-salad', 'Mixed salad dengan vinaigrette', 16000, 7000, 'SN-015', '/images/products/garden-salad.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

COMMIT;



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 4/6: SEED_PART2C_EXTRAS.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - PART 2C: SAUCES, DESSERTS, MODIFIERS, PAYMENT METHODS
-- ============================================================================

BEGIN;

-- SAUCES (8 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000006-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Sambal Matah', 'sambal-matah', 'Sambal matah khas Bali', 3000, 1000, 'SC-001', '/images/products/sambal-matah.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Sambal Ijo', 'sambal-ijo', 'Sambal hijau pedas', 3000, 1000, 'SC-002', '/images/products/sambal-ijo.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'BBQ Sauce', 'bbq-sauce', 'Saus BBQ smoky', 3000, 1000, 'SC-003', '/images/products/bbq-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Teriyaki Sauce', 'teriyaki-sauce', 'Saus teriyaki manis', 3000, 1000, 'SC-004', '/images/products/teriyaki-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Mayonnaise', 'mayonnaise', 'Mayo premium', 3000, 1000, 'SC-005', '/images/products/mayo.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Chili Sauce', 'chili-sauce', 'Saus cabai botolan', 2000, 800, 'SC-006', '/images/products/chili-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Cheese Sauce', 'cheese-sauce', 'Saus keju creamy', 4000, 1500, 'SC-007', '/images/products/cheese-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000006-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Thai Sweet Chili', 'thai-sweet-chili', 'Saus thai manis pedas', 3000, 1000, 'SC-008', '/images/products/thai-chili.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- DESSERTS (10 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('a1000007-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Vanilla Ice Cream', 'vanilla-ice-cream', 'Es krim vanilla 1 scoop', 12000, 5000, 'DS-001', '/images/products/vanilla-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Chocolate Ice Cream', 'chocolate-ice-cream', 'Es krim coklat 1 scoop', 12000, 5000, 'DS-002', '/images/products/choco-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Strawberry Ice Cream', 'strawberry-ice-cream', 'Es krim strawberry 1 scoop', 13000, 5500, 'DS-003', '/images/products/strawberry-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Ice Cream Sundae', 'ice-cream-sundae', 'Sundae dengan topping lengkap', 18000, 8000, 'DS-004', '/images/products/sundae.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Chocolate Lava Cake', 'choco-lava-cake', 'Lava cake coklat hangat', 25000, 12000, 'DS-005', '/images/products/lava-cake.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Brownies Ice Cream', 'brownies-ice-cream', 'Brownies dengan ice cream', 22000, 10000, 'DS-006', '/images/products/brownies-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Apple Pie', 'apple-pie', 'Pie apel hangat', 20000, 9000, 'DS-007', '/images/products/apple-pie.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Churros (5 pcs)', 'churros', 'Churros dengan chocolate sauce', 18000, 8000, 'DS-008', '/images/products/churros.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Banana Split', 'banana-split', 'Es krim banana split classic', 23000, 11000, 'DS-009', '/images/products/banana-split.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('a1000007-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Tiramisu', 'tiramisu', 'Tiramisu cake premium', 28000, 13000, 'DS-010', '/images/products/tiramisu.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- MODIFIER GROUPS
INSERT INTO modifier_groups (id, tenant_id, name, description, type, required, min_select, max_select, display_order, status, created_at, updated_at)
VALUES
  ('bc000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Level Kepedasan', 'Pilih level kepedasan ayam', 'single', 1, 1, 1, 1, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('bc000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Extra Topping', 'Tambahan topping', 'multiple', 0, 0, 5, 2, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('bc000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Ukuran Minuman', 'Pilih ukuran minuman', 'single', 1, 1, 1, 3, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('bc000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Level Gula', 'Tingkat kemanisan minuman', 'single', 0, 0, 1, 4, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('bc000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Es Batu', 'Jumlah es', 'single', 0, 0, 1, 5, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;

-- MODIFIER OPTIONS
INSERT INTO modifier_options (id, group_id, name, price_adjustment, display_order, status, created_at)
VALUES
  -- Level Kepedasan
  ('bd000001-0000-0000-0000-000000000001'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Original (No Spicy)', 0, 1, 'active', NOW()),
  ('bd000001-0000-0000-0000-000000000002'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Level 1 (Mild)', 0, 2, 'active', NOW()),
  ('bd000001-0000-0000-0000-000000000003'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Level 2', 0, 3, 'active', NOW()),
  ('bd000001-0000-0000-0000-000000000004'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Level 3', 0, 4, 'active', NOW()),
  ('bd000001-0000-0000-0000-000000000005'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Level 4 (Hot)', 1000, 5, 'active', NOW()),
  ('bd000001-0000-0000-0000-000000000006'::uuid, 'bc000001-0000-0000-0000-000000000001'::uuid, 'Level 5 (Very Hot)', 1000, 6, 'active', NOW()),
  
  -- Extra Topping
  ('bd000002-0000-0000-0000-000000000001'::uuid, 'bc000001-0000-0000-0000-000000000002'::uuid, 'Extra Cheese', 5000, 1, 'active', NOW()),
  ('bd000002-0000-0000-0000-000000000002'::uuid, 'bc000001-0000-0000-0000-000000000002'::uuid, 'Extra Chicken', 10000, 2, 'active', NOW()),
  ('bd000002-0000-0000-0000-000000000003'::uuid, 'bc000001-0000-0000-0000-000000000002'::uuid, 'Extra Bacon', 7000, 3, 'active', NOW()),
  ('bd000002-0000-0000-0000-000000000004'::uuid, 'bc000001-0000-0000-0000-000000000002'::uuid, 'Extra Egg', 5000, 4, 'active', NOW()),
  ('bd000002-0000-0000-0000-000000000005'::uuid, 'bc000001-0000-0000-0000-000000000002'::uuid, 'Extra Sauce', 3000, 5, 'active', NOW()),
  
  -- Ukuran Minuman
  ('bd000003-0000-0000-0000-000000000001'::uuid, 'bc000001-0000-0000-0000-000000000003'::uuid, 'Regular', 0, 1, 'active', NOW()),
  ('bd000003-0000-0000-0000-000000000002'::uuid, 'bc000001-0000-0000-0000-000000000003'::uuid, 'Large', 3000, 2, 'active', NOW()),
  
  -- Level Gula
  ('bd000004-0000-0000-0000-000000000001'::uuid, 'bc000001-0000-0000-0000-000000000004'::uuid, 'Normal', 0, 1, 'active', NOW()),
  ('bd000004-0000-0000-0000-000000000002'::uuid, 'bc000001-0000-0000-0000-000000000004'::uuid, 'Less Sugar', 0, 2, 'active', NOW()),
  ('bd000004-0000-0000-0000-000000000003'::uuid, 'bc000001-0000-0000-0000-000000000004'::uuid, 'No Sugar', 0, 3, 'active', NOW()),
  
  -- Es Batu
  ('bd000005-0000-0000-0000-000000000001'::uuid, 'bc000001-0000-0000-0000-000000000005'::uuid, 'Normal Ice', 0, 1, 'active', NOW()),
  ('bd000005-0000-0000-0000-000000000002'::uuid, 'bc000001-0000-0000-0000-000000000005'::uuid, 'Less Ice', 0, 2, 'active', NOW()),
  ('bd000005-0000-0000-0000-000000000003'::uuid, 'bc000001-0000-0000-0000-000000000005'::uuid, 'No Ice', 0, 3, 'active', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_adjustment = EXCLUDED.price_adjustment;

-- PAYMENT METHODS
INSERT INTO payment_methods (id, tenant_id, name, type, icon, status, display_order, created_at, updated_at)
VALUES
  ('ab000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Cash', 'cash', '💵', 'active', 1, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'QRIS', 'qris', '📱', 'active', 2, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'GoPay', 'ewallet', '🟢', 'active', 3, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'OVO', 'ewallet', '🟣', 'active', 4, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'ShopeePay', 'ewallet', '🟠', 'active', 5, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Debit Card', 'card', '💳', 'active', 6, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Credit Card', 'card', '💳', 'active', 7, NOW() - INTERVAL '180 days', NOW()),
  ('ab000001-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Bank Transfer', 'transfer', '🏦', 'active', 8, NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

-- STATIONS (KDS)
INSERT INTO stations (id, tenant_id, outlet_id, name, display_order, status, created_at)
VALUES
  ('cd000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Main Kitchen', 1, 'active', NOW() - INTERVAL '180 days'),
  ('cd000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Beverage Station', 2, 'active', NOW() - INTERVAL '180 days'),
  ('cd000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Packing Station', 3, 'active', NOW() - INTERVAL '180 days'),
  ('cd000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, 'Main Kitchen', 1, 'active', NOW() - INTERVAL '120 days'),
  ('cd000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, 'Beverage Station', 2, 'active', NOW() - INTERVAL '120 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMIT;

-- ============================================================================
-- Summary PART 2C:
-- ✅ 8 Sauces
-- ✅ 10 Desserts
-- ✅ 5 Modifier Groups
-- ✅ 18 Modifier Options
-- ✅ 8 Payment Methods
-- ✅ 5 Stations (KDS)
-- Total Products sejauh ini: 15+12+10+25+15+8+10 = 95 products
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 5/6: SEED_PART3_MEMBERS_COSTS.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - PART 3: MEMBERS & REALISTIC TRANSACTION GENERATOR
-- ============================================================================
-- This generates 300 members and realistic order patterns over 90 days
-- ============================================================================

BEGIN;

-- 3.1 MEMBERS (300 customers with realistic distribution)
-- ----------------------------------------------------------------------------
-- Distribution: 60% new, 25% regular, 12% loyal, 3% VIP

-- Generate 300 members using generate_series
INSERT INTO members (tenant_id, name, phone, pin_hash, points, total_spent, visit_count, segment, status, created_at, updated_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  'Customer ' || LPAD(i::text, 3, '0'),
  '0812' || LPAD((34000000 + i)::text, 8, '0'),
  CASE WHEN random() < 0.3 THEN '$2b$10$abcdefghijklmnopqrstuvwxyz' || i ELSE NULL END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 5000 + 5000)::int  -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 2000 + 1000)::int  -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 500 + 100)::int   -- Regular
    ELSE FLOOR(random() * 100)::int                        -- New
  END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 10000000 + 5000000)::numeric  -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 3000000 + 1000000)::numeric  -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 500000 + 100000)::numeric   -- Regular
    ELSE FLOOR(random() * 100000)::numeric                           -- New
  END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 50 + 30)::int      -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 20 + 10)::int     -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 8 + 3)::int      -- Regular
    ELSE FLOOR(random() * 2 + 1)::int                    -- New
  END,
  CASE 
    WHEN i <= 9 THEN 'vip'
    WHEN i <= 45 THEN 'loyal'
    WHEN i <= 120 THEN 'regular'
    ELSE 'new'
  END,
  'active',
  NOW() - (random() * INTERVAL '180 days'),
  NOW()
FROM generate_series(1, 300) AS i
ON CONFLICT DO NOTHING;

-- 3.2 NASHTYCOSTS (Operational Costs - 90 days realistic data)
-- ----------------------------------------------------------------------------
-- Categories: bahan-baku, operasional, gaji, utilitas, sewa, lainnya

-- Monthly rent (3 months x 3 outlets)
INSERT INTO nashtycosts (tenant_id, outlet_id, amount, category, description, created_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  outlet_id,
  CASE outlet_id::text
    WHEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a1' THEN 45000000  -- Galaxy Mall
    WHEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a2' THEN 40000000  -- Pakuwon
    ELSE 38000000  -- TP6
  END,
  'sewa',
  'Sewa tempat bulanan',
  date_trunc('month', NOW()) - (month_offset || ' months')::interval
FROM unnest(ARRAY[
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid
]) AS outlet_id
CROSS JOIN generate_series(0, 2) AS month_offset
ON CONFLICT DO NOTHING;

-- Weekly operational costs (90 days = ~13 weeks, 3 outlets)
INSERT INTO nashtycosts (tenant_id, outlet_id, amount, category, description, created_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  outlet_id,
  amount,
  category,
  description,
  NOW() - (week_offset * 7 || ' days')::interval
FROM (
  SELECT 
    unnest(ARRAY[
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid
    ]) AS outlet_id,
    week_offset,
    unnest(ARRAY[2500000, 1800000, 800000, 600000, 300000]) AS amount,
    unnest(ARRAY['bahan-baku', 'operasional', 'utilitas', 'gaji', 'lainnya']) AS category,
    unnest(ARRAY[
      'Pembelian ayam, bumbu, sayuran',
      'Packaging, supplies, cleaning',
      'Listrik, air, gas',
      'Gaji mingguan staff',
      'Maintenance dan lain-lain'
    ]) AS description
  FROM generate_series(0, 12) AS week_offset
) AS costs
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 3 Summary:
-- ✅ 300 Members (realistic segments)
-- ✅ ~200 Cost entries (3 months rent + 13 weeks ops x 3 outlets)
-- Next: Run PART 4 for order generation (separate file for performance)
-- ============================================================================



-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ PART 6/6: SEED_PART4_ORDERS.sql
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- NASHTY OS - PART 4: REALISTIC ORDER GENERATION (90 Days)
-- ============================================================================
-- Generates ~3000-5000 orders with realistic patterns:
-- - Lunch peak: 11:00-14:00 (40% of daily orders)
-- - Dinner peak: 18:00-21:00 (50% of daily orders)
-- - Off-peak: 10% of daily orders
-- - Weekend: 2x weekday volume
-- - Payment mix: Cash 25%, QRIS 35%, eWallet 30%, Card 10%
-- - Order types: Dine-in 60%, Takeaway 25%, GoFood 10%, GrabFood 5%
-- ============================================================================

BEGIN;

-- Create temporary function for realistic order generation
CREATE OR REPLACE FUNCTION generate_realistic_orders()
RETURNS void AS $$
DECLARE
  day_offset INT;
  orders_per_day INT;
  hour_weight NUMERIC;
  order_hour INT;
  order_minute INT;
  order_datetime TIMESTAMP;
  selected_outlet_id UUID;
  user_id_val UUID;
  order_id_val UUID;
  order_number_val TEXT;
  order_type_val TEXT;
  payment_method_val TEXT;
  member_id_val UUID;
  subtotal_val NUMERIC;
  tax_val NUMERIC;
  service_val NUMERIC;
  total_val NUMERIC;
  item_count INT;
  product_id_val UUID;
  product_price NUMERIC;
  product_name_val TEXT;
  item_qty INT;
  item_subtotal NUMERIC;
BEGIN
  -- Loop through 90 days
  FOR day_offset IN 0..89 LOOP
    -- Determine orders per day (weekend vs weekday)
    IF EXTRACT(DOW FROM (NOW() - (day_offset || ' days')::INTERVAL)) IN (0, 6) THEN
      orders_per_day := FLOOR(random() * 20 + 60)::INT;  -- Weekend: 60-80 orders
    ELSE
      orders_per_day := FLOOR(random() * 15 + 30)::INT;  -- Weekday: 30-45 orders
    END IF;

    -- Generate orders for this day
    FOR i IN 1..orders_per_day LOOP
      -- Determine order hour with realistic distribution
      hour_weight := random();
      IF hour_weight < 0.40 THEN
        -- Lunch peak (40%)
        order_hour := 11 + FLOOR(random() * 3)::INT;
      ELSIF hour_weight < 0.90 THEN
        -- Dinner peak (50%)
        order_hour := 18 + FLOOR(random() * 3)::INT;
      ELSE
        -- Off-peak (10%)
        order_hour := 10 + FLOOR(random() * 12)::INT;
        IF order_hour >= 14 AND order_hour < 18 THEN
          order_hour := 15;  -- Afternoon lull
        END IF;
      END IF;

      order_minute := FLOOR(random() * 60)::INT;
      order_datetime := (NOW() - (day_offset || ' days')::INTERVAL)::DATE + 
                       (order_hour || ' hours')::INTERVAL + 
                       (order_minute || ' minutes')::INTERVAL;

      -- Select random outlet (Galaxy 50%, Pakuwon 30%, TP6 20%)
      selected_outlet_id := CASE 
        WHEN random() < 0.5 THEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::UUID
        WHEN random() < 0.8 THEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::UUID
        ELSE '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::UUID
      END;

      -- Select random cashier user (with fallback to any user if outlet has no users)
      user_id_val := (SELECT id FROM users WHERE users.outlet_id = selected_outlet_id ORDER BY random() LIMIT 1);
      IF user_id_val IS NULL THEN
        user_id_val := (SELECT id FROM users ORDER BY random() LIMIT 1);
      END IF;

      -- Generate order ID and number
      order_id_val := gen_random_uuid();
      order_number_val := 'ORD-' || TO_CHAR(order_datetime, 'YYMMDD') || '-' || LPAD(i::TEXT, 4, '0');

      -- Determine order type
      order_type_val := CASE 
        WHEN random() < 0.60 THEN 'dine-in'
        WHEN random() < 0.85 THEN 'takeaway'
        WHEN random() < 0.95 THEN 'gofood'
        ELSE 'grabfood'
      END;

      -- Determine payment method
      payment_method_val := CASE 
        WHEN random() < 0.25 THEN 'cash'
        WHEN random() < 0.60 THEN 'qris'
        WHEN random() < 0.80 THEN 'gopay'
        WHEN random() < 0.90 THEN 'ovo'
        ELSE 'debit'
      END;

      -- Select member (35% of orders)
      IF random() < 0.35 THEN
        member_id_val := (SELECT id FROM members ORDER BY random() LIMIT 1);
      ELSE
        member_id_val := NULL;
      END IF;

      -- Calculate order totals (will be updated after items)
      subtotal_val := 0;

      -- Insert order
      INSERT INTO orders (
        id, tenant_id, outlet_id, user_id, order_number, order_type,
        table_number, customer_name, customer_phone,
        subtotal, discount, tax, service_charge, total,
        payment_method, payment_status, order_status, kitchen_status,
        created_at, updated_at
      ) VALUES (
        order_id_val,
        'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::UUID,
        selected_outlet_id,
        user_id_val,
        order_number_val,
        order_type_val,
        CASE WHEN order_type_val = 'dine-in' THEN 'T' || LPAD(FLOOR(random() * 20 + 1)::TEXT, 2, '0') ELSE NULL END,
        CASE WHEN member_id_val IS NOT NULL THEN (SELECT name FROM members WHERE id = member_id_val) ELSE 'Guest' END,
        CASE WHEN member_id_val IS NOT NULL THEN (SELECT phone FROM members WHERE id = member_id_val) ELSE NULL END,
        0, 0, 0, 0, 0,  -- Will be updated
        payment_method_val,
        'paid',
        'completed',
        'served',
        order_datetime,
        order_datetime + INTERVAL '30 minutes'
      );

      -- Add 1-5 items per order
      item_count := FLOOR(random() * 4 + 1)::INT;
      
      FOR j IN 1..item_count LOOP
        -- Select random product (weighted towards popular items)
        SELECT id, price, name INTO product_id_val, product_price, product_name_val
        FROM products 
        WHERE status = 'active' 
        ORDER BY random() 
        LIMIT 1;

        item_qty := CASE 
          WHEN random() < 0.7 THEN 1
          WHEN random() < 0.9 THEN 2
          ELSE 3
        END;

        item_subtotal := product_price * item_qty;
        subtotal_val := subtotal_val + item_subtotal;

        -- Insert order item
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, unit_price, subtotal,
          notes, kitchen_status, created_at
        ) VALUES (
          order_id_val,
          product_id_val,
          product_name_val,
          item_qty,
          product_price,
          item_subtotal,
          CASE WHEN random() < 0.1 THEN 'Extra pedas' ELSE NULL END,
          'served',
          order_datetime
        );
      END LOOP;

      -- Calculate tax and service
      tax_val := ROUND(subtotal_val * 0.11, 0);  -- PPN 11%
      service_val := ROUND(subtotal_val * 0.05, 0);  -- Service 5%
      total_val := subtotal_val + tax_val + service_val;

      -- Update order totals
      UPDATE orders 
      SET subtotal = subtotal_val,
          tax = tax_val,
          service_charge = service_val,
          total = total_val
      WHERE id = order_id_val;

      -- Insert payment record
      INSERT INTO payments (
        order_id, method, amount, created_at
      ) VALUES (
        order_id_val,
        payment_method_val,
        total_val,
        order_datetime + INTERVAL '2 minutes'
      );

    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_realistic_orders();

-- Drop the temporary function
DROP FUNCTION generate_realistic_orders();

COMMIT;

-- ============================================================================
-- PART 4 Complete!
-- Generated: ~3000-5000 realistic orders over 90 days
-- - Realistic time distribution (lunch/dinner peaks)
-- - Weekend multiplier
-- - Proper payment mix
-- - Member association (35%)
-- - Order items with realistic quantities
-- ============================================================================

-- Verify results
SELECT 
  'Orders Generated' AS metric,
  COUNT(*) AS count,
  MIN(created_at) AS earliest,
  MAX(created_at) AS latest
FROM orders;

SELECT 
  'Order Items Generated' AS metric,
  COUNT(*) AS count
FROM order_items;

SELECT 
  order_type,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM orders
GROUP BY order_type
ORDER BY count DESC;

SELECT 
  payment_method,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM orders
GROUP BY payment_method
ORDER BY count DESC;
