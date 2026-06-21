-- Check for duplicate data in key tables
-- Run this to identify duplicates before cleanup

-- Check duplicate tenants
SELECT name, COUNT(*) as count 
FROM tenants 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Check duplicate outlets
SELECT tenant_id, name, COUNT(*) as count 
FROM outlets 
GROUP BY tenant_id, name 
HAVING COUNT(*) > 1;

-- Check duplicate users by username
SELECT username, COUNT(*) as count 
FROM users 
WHERE username IS NOT NULL
GROUP BY username 
HAVING COUNT(*) > 1;

-- Check duplicate products
SELECT tenant_id, name, COUNT(*) as count 
FROM products 
GROUP BY tenant_id, name 
HAVING COUNT(*) > 1;

-- Check duplicate categories
SELECT tenant_id, name, COUNT(*) as count 
FROM categories 
GROUP BY tenant_id, name 
HAVING COUNT(*) > 1;

-- Summary counts
SELECT 
  'tenants' as table_name, 
  COUNT(*) as total_records 
FROM tenants
UNION ALL
SELECT 'outlets', COUNT(*) FROM outlets
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'outlet_settings', COUNT(*) FROM outlet_settings
UNION ALL
SELECT 'token_blacklist', COUNT(*) FROM token_blacklist
UNION ALL
SELECT 'analytics_cache', COUNT(*) FROM analytics_cache;
