-- ============================================================================
-- NASHTY OS - DATABASE INTEGRITY TEST
-- ============================================================================
-- Run this after PRODUCTION_FINAL_FIX.sql to verify all data is correct
-- Copy output JSON dan berikan ke AI untuk analisis
-- ============================================================================

-- TEST 1: Count all tables
SELECT 
  'TEST_1_COUNTS' as test_name,
  json_build_object(
    'tenants', (SELECT COUNT(*) FROM tenants),
    'outlets', (SELECT COUNT(*) FROM outlets),
    'system_users', (SELECT COUNT(*) FROM system_users WHERE is_active = true),
    'pos_users', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'system_access', (SELECT COUNT(*) FROM user_system_access),
    'outlet_access', (SELECT COUNT(*) FROM user_outlet_access)
  ) as result;

-- TEST 2: Check FK integrity (orphaned records)
SELECT 
  'TEST_2_FK_INTEGRITY' as test_name,
  json_build_object(
    'orphaned_users', (
      SELECT COUNT(*) FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE o.id IS NULL
    ),
    'invalid_system_access', (
      SELECT COUNT(*) FROM user_system_access usa
      LEFT JOIN system_users su ON usa.user_id = su.id
      WHERE su.id IS NULL
    ),
    'invalid_outlet_access', (
      SELECT COUNT(*) FROM user_outlet_access uoa
      LEFT JOIN system_users su ON uoa.user_id = su.id
      LEFT JOIN outlets o ON uoa.outlet_id = o.id
      WHERE su.id IS NULL OR o.id IS NULL
    )
  ) as result;

-- TEST 3: Check outlet IDs match
SELECT 
  'TEST_3_OUTLET_IDS' as test_name,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'status', status
    ) ORDER BY name
  ) as result
FROM outlets;

-- TEST 4: Check system users (backoffice)
SELECT 
  'TEST_4_SYSTEM_USERS' as test_name,
  json_agg(
    json_build_object(
      'username', username,
      'full_name', full_name,
      'role', role,
      'is_active', is_active,
      'password_hash_prefix', LEFT(password_hash, 20)
    ) ORDER BY role, username
  ) as result
FROM system_users;

-- TEST 5: Check POS users (kasir) with outlet names
SELECT 
  'TEST_5_POS_USERS' as test_name,
  json_agg(
    json_build_object(
      'name', u.name,
      'pin', u.pin,
      'role', u.role,
      'status', u.status,
      'outlet_id', u.outlet_id,
      'outlet_name', o.name
    ) ORDER BY o.name, u.name
  ) as result
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id;

-- TEST 6: Check system access mappings
SELECT 
  'TEST_6_SYSTEM_ACCESS' as test_name,
  json_agg(
    json_build_object(
      'username', su.username,
      'systems', (
        SELECT json_agg(usa.system_name ORDER BY usa.system_name)
        FROM user_system_access usa
        WHERE usa.user_id = su.id AND usa.has_access = true
      )
    ) ORDER BY su.username
  ) as result
FROM system_users su;

-- TEST 7: Check outlet access mappings
SELECT 
  'TEST_7_OUTLET_ACCESS' as test_name,
  json_agg(
    json_build_object(
      'username', su.username,
      'role', su.role,
      'outlets', (
        SELECT json_agg(o.name ORDER BY o.name)
        FROM user_outlet_access uoa
        JOIN outlets o ON uoa.outlet_id = o.id
        WHERE uoa.user_id = su.id
      )
    ) ORDER BY su.role, su.username
  ) as result
FROM system_users su;

-- TEST 8: Bcrypt hash consistency check
SELECT 
  'TEST_8_BCRYPT_CONSISTENCY' as test_name,
  json_build_object(
    'unique_hashes', (
      SELECT COUNT(DISTINCT password_hash) 
      FROM system_users
    ),
    'expected', 1,
    'all_hashes_match', (
      SELECT COUNT(DISTINCT password_hash) = 1
      FROM system_users
    ),
    'hash_value', (
      SELECT DISTINCT password_hash 
      FROM system_users 
      LIMIT 1
    )
  ) as result;

-- TEST 9: PIN format check (should be plain text 4-digit)
SELECT 
  'TEST_9_PIN_FORMAT' as test_name,
  json_agg(
    json_build_object(
      'name', name,
      'pin', pin,
      'pin_length', LENGTH(pin),
      'is_numeric', pin ~ '^[0-9]+$',
      'is_valid', LENGTH(pin) = 4 AND pin ~ '^[0-9]+$'
    ) ORDER BY outlet_id, name
  ) as result
FROM users;

-- TEST 10: Expected login credentials
SELECT 
  'TEST_10_LOGIN_CREDENTIALS' as test_name,
  json_build_object(
    'backoffice', json_build_object(
      'url', 'https://nashtyxolvon2.pages.dev',
      'accounts', (
        SELECT json_agg(
          json_build_object(
            'username', username,
            'password', 'nashty@2024',
            'role', role
          ) ORDER BY role, username
        )
        FROM system_users
      )
    ),
    'pos', json_build_object(
      'url', 'https://nashtyxolvon2.pages.dev/pos',
      'cashiers', (
        SELECT json_agg(
          json_build_object(
            'outlet', o.name,
            'pin', u.pin,
            'name', u.name
          ) ORDER BY o.name, u.pin
        )
        FROM users u
        JOIN outlets o ON u.outlet_id = o.id
      )
    )
  ) as result;

-- FINAL SUMMARY
SELECT 
  'FINAL_SUMMARY' as test_name,
  json_build_object(
    'status', CASE 
      WHEN (SELECT COUNT(*) FROM users u LEFT JOIN outlets o ON u.outlet_id = o.id WHERE o.id IS NULL) = 0
        AND (SELECT COUNT(*) FROM tenants) = 1
        AND (SELECT COUNT(*) FROM outlets) = 3
        AND (SELECT COUNT(*) FROM system_users WHERE is_active = true) = 4
        AND (SELECT COUNT(*) FROM users WHERE status = 'active') = 6
        AND (SELECT COUNT(DISTINCT password_hash) FROM system_users) = 1
      THEN 'PASS'
      ELSE 'FAIL'
    END,
    'checks', json_build_object(
      'no_orphaned_records', (SELECT COUNT(*) FROM users u LEFT JOIN outlets o ON u.outlet_id = o.id WHERE o.id IS NULL) = 0,
      'correct_tenant_count', (SELECT COUNT(*) FROM tenants) = 1,
      'correct_outlet_count', (SELECT COUNT(*) FROM outlets) = 3,
      'correct_system_user_count', (SELECT COUNT(*) FROM system_users WHERE is_active = true) = 4,
      'correct_pos_user_count', (SELECT COUNT(*) FROM users WHERE status = 'active') = 6,
      'bcrypt_hash_consistent', (SELECT COUNT(DISTINCT password_hash) FROM system_users) = 1,
      'all_pins_valid', (SELECT COUNT(*) FROM users WHERE LENGTH(pin) != 4 OR NOT (pin ~ '^[0-9]+$')) = 0
    ),
    'errors', (
      SELECT json_agg(error_desc)
      FROM (
        SELECT 'Orphaned users found' as error_desc
        WHERE (SELECT COUNT(*) FROM users u LEFT JOIN outlets o ON u.outlet_id = o.id WHERE o.id IS NULL) > 0
        UNION ALL
        SELECT 'Tenant count mismatch'
        WHERE (SELECT COUNT(*) FROM tenants) != 1
        UNION ALL
        SELECT 'Outlet count mismatch'
        WHERE (SELECT COUNT(*) FROM outlets) != 3
        UNION ALL
        SELECT 'System user count mismatch'
        WHERE (SELECT COUNT(*) FROM system_users WHERE is_active = true) != 4
        UNION ALL
        SELECT 'POS user count mismatch'
        WHERE (SELECT COUNT(*) FROM users WHERE status = 'active') != 6
        UNION ALL
        SELECT 'Bcrypt hash inconsistent'
        WHERE (SELECT COUNT(DISTINCT password_hash) FROM system_users) != 1
        UNION ALL
        SELECT 'Invalid PIN format found'
        WHERE (SELECT COUNT(*) FROM users WHERE LENGTH(pin) != 4 OR NOT (pin ~ '^[0-9]+$')) > 0
      ) errors
    )
  ) as result;
