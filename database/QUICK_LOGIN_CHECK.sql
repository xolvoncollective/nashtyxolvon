-- ============================================================================
-- QUICK CHECK: Verify Login Will Work
-- ============================================================================
-- Run this to verify edge function akan dapat data yang benar
-- ============================================================================

-- CHECK 1: Backoffice login data
SELECT 
  'BACKOFFICE_LOGIN_CHECK' as check_name,
  json_build_object(
    'username', username,
    'password_expected', 'nashty@2024',
    'role', role,
    'is_active', is_active,
    'hash_starts_with', LEFT(password_hash, 30)
  ) as data
FROM system_users
WHERE username = 'superadmin';

-- CHECK 2: POS login data (Galaxy Mall)
SELECT 
  'POS_LOGIN_CHECK' as check_name,
  json_build_object(
    'outlet_name', o.name,
    'outlet_id', o.id,
    'cashier_name', u.name,
    'pin', u.pin,
    'role', u.role,
    'status', u.status
  ) as data
FROM users u
JOIN outlets o ON u.outlet_id = o.id
WHERE o.name = 'Galaxy Mall Surabaya'
ORDER BY u.pin;

-- CHECK 3: Verify exact outlet_id yang digunakan
SELECT 
  'OUTLET_IDS_VERIFICATION' as check_name,
  json_build_object(
    'galaxy_mall_id', (SELECT id FROM outlets WHERE name = 'Galaxy Mall Surabaya'),
    'pakuwon_id', (SELECT id FROM outlets WHERE name = 'Pakuwon Trade Center'),
    'tp6_id', (SELECT id FROM outlets WHERE name = 'Tunjungan Plaza 6'),
    'note', 'Use these IDs in your login API calls'
  ) as data;
