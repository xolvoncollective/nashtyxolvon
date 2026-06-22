-- ============================================================================
-- CRITICAL FIX: POS PIN Login + Database Integrity Check
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- 1. FIX POS USERS PIN (Change from bcrypt to plain text for testing)
-- ----------------------------------------------------------------------------
-- Update POS users with simple numeric PINs that match edge function expectations

UPDATE users SET pin = '1111' WHERE id = 'a1000000-0000-0000-0000-000000000005'::uuid;  -- Citra Kusuma
UPDATE users SET pin = '2222' WHERE id = 'a2000000-0000-0000-0000-000000000001'::uuid;  -- Budi Santoso
UPDATE users SET pin = '3333' WHERE id = 'a2000000-0000-0000-0000-000000000002'::uuid;  -- Ani Wijaya
UPDATE users SET pin = '4444' WHERE id = 'a2000000-0000-0000-0000-000000000003'::uuid;  -- Dina Permata
UPDATE users SET pin = '5555' WHERE id = 'a2000000-0000-0000-0000-000000000004'::uuid;  -- Eko Prasetyo
UPDATE users SET pin = '6666' WHERE id = 'a2000000-0000-0000-0000-000000000005'::uuid;  -- Fitri Wulandari

-- 2. FIX OUTLET IDS (Correct the UUIDs to match outlets table)
-- ----------------------------------------------------------------------------
-- The seed data has wrong outlet_ids for users

-- Check current outlets
SELECT id, name FROM outlets ORDER BY name;

-- Update users to use correct outlet_ids (based on outlets table)
-- Galaxy Mall Surabaya
UPDATE users 
SET outlet_id = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid 
WHERE id IN (
  'a1000000-0000-0000-0000-000000000005'::uuid,  -- Citra
  'a2000000-0000-0000-0000-000000000001'::uuid,  -- Budi
  'a2000000-0000-0000-0000-000000000002'::uuid   -- Ani
);

-- Pakuwon Trade Center
UPDATE users 
SET outlet_id = (SELECT id FROM outlets WHERE name LIKE '%Pakuwon%' LIMIT 1)
WHERE id IN (
  'a2000000-0000-0000-0000-000000000003'::uuid,  -- Dina
  'a2000000-0000-0000-0000-000000000004'::uuid   -- Eko
);

-- Tunjungan Plaza 6
UPDATE users 
SET outlet_id = (SELECT id FROM outlets WHERE name LIKE '%Tunjungan%' LIMIT 1)
WHERE id = 'a2000000-0000-0000-0000-000000000005'::uuid;  -- Fitri

-- 3. VERIFY DATA INTEGRITY
-- ----------------------------------------------------------------------------

-- Check system_users (backoffice)
SELECT 
  username,
  role,
  is_active,
  email,
  'Backoffice User' as type
FROM system_users
WHERE role IN ('superadmin', 'owner', 'manager')
ORDER BY role, username;

-- Check users (POS)
SELECT 
  u.name,
  u.pin,
  u.role,
  u.status,
  o.name as outlet_name,
  'POS User' as type
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
WHERE u.status = 'active'
ORDER BY o.name, u.name;

-- Check outlets
SELECT id, name, status FROM outlets ORDER BY name;

-- Check for orphaned records
SELECT 
  'users with invalid outlet_id' as issue,
  COUNT(*) as count
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
WHERE o.id IS NULL AND u.outlet_id IS NOT NULL

UNION ALL

SELECT 
  'orders with invalid outlet_id' as issue,
  COUNT(*) as count
FROM orders ord
LEFT JOIN outlets o ON ord.outlet_id = o.id
WHERE o.id IS NULL

UNION ALL

SELECT 
  'order_items with invalid order_id' as issue,
  COUNT(*) as count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test data for login
SELECT 
  '=== BACKOFFICE LOGIN CREDENTIALS ===' as info
UNION ALL
SELECT 'Username: superadmin | Password: nashty@2024 | Outlet: Any'
UNION ALL
SELECT ''
UNION ALL
SELECT '=== POS LOGIN CREDENTIALS ==='
UNION ALL
SELECT 'Outlet: Galaxy Mall Surabaya'
UNION ALL
SELECT 'PIN 1111: Citra Kusuma'
UNION ALL
SELECT 'PIN 2222: Budi Santoso'
UNION ALL
SELECT 'PIN 3333: Ani Wijaya'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Outlet: Pakuwon Trade Center'
UNION ALL
SELECT 'PIN 4444: Dina Permata'
UNION ALL
SELECT 'PIN 5555: Eko Prasetyo'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Outlet: Tunjungan Plaza 6'
UNION ALL
SELECT 'PIN 6666: Fitri Wulandari';

-- ============================================================================
-- DONE!
-- ============================================================================
