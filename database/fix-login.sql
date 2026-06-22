-- ============================================================================
-- QUICK FIX: Activate All Users & Verify Login Data
-- ============================================================================
-- Run this in Supabase SQL Editor to fix login issues
-- ============================================================================

-- 1. ACTIVATE ALL SYSTEM USERS (Backoffice)
UPDATE system_users SET is_active = true;

-- 2. VERIFY SYSTEM USERS
SELECT 
  username,
  role,
  is_active,
  email,
  tenant_id,
  CASE 
    WHEN is_active = true THEN '✅ Active'
    ELSE '❌ Locked'
  END as status
FROM system_users
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'owner' THEN 2
    WHEN 'manager' THEN 3
    ELSE 4
  END,
  username;

-- Expected Output:
-- superadmin    | superadmin | true | superadmin@nashty.com      | ✅ Active
-- owner.nashty  | owner      | true | owner@nashty.com           | ✅ Active
-- manager.galaxy | manager   | true | manager.galaxy@nashty.com  | ✅ Active
-- manager.pakuwon| manager   | true | manager.pakuwon@nashty.com | ✅ Active
-- cashier.citra  | cashier   | true | citra@nashty.com           | ✅ Active

-- 3. VERIFY OUTLETS
SELECT 
  id,
  name,
  slug,
  status,
  SUBSTRING(id::text, 1, 8) || '...' as short_id
FROM outlets
ORDER BY name;

-- Expected Output:
-- Galaxy Mall Surabaya    | galaxy-mall      | active | 71cb7d46...
-- Pakuwon Trade Center    | pakuwon-tc       | active | 71cb7d46...
-- Tunjungan Plaza 6       | tunjungan-plaza-6| active | 71cb7d46...

-- 4. VERIFY POS USERS (for PIN login)
SELECT 
  name,
  role,
  status,
  outlet_id,
  SUBSTRING(pin, 1, 20) || '...' as pin_preview,
  (SELECT name FROM outlets WHERE id = users.outlet_id) as outlet_name
FROM users
WHERE status = 'active'
ORDER BY outlet_name, name;

-- Expected Output:
-- Citra Kusuma  | cashier | active | Galaxy Mall Surabaya
-- Budi Santoso  | cashier | active | Galaxy Mall Surabaya
-- Ani Wijaya    | cashier | active | Galaxy Mall Surabaya
-- Dina Permata  | cashier | active | Pakuwon Trade Center
-- Eko Prasetyo  | cashier | active | Pakuwon Trade Center
-- Fitri Wulandari | cashier | active | Tunjungan Plaza 6

-- 5. TEST DATA INTEGRITY
SELECT 
  'system_users' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive_count
FROM system_users

UNION ALL

SELECT 
  'users (POS)' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as inactive_count
FROM users;

-- Expected Output:
-- system_users | 5 | 5 | 0
-- users (POS)  | 6 | 6 | 0

-- ============================================================================
-- DONE! Now try login with:
-- Username: superadmin
-- Password: nashty@2024
-- Outlet: Select any outlet
-- ============================================================================
