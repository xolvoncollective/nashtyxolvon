-- ============================================================================
-- NASHTY OS - ALL-IN-ONE SEED SCRIPT
-- ============================================================================
-- Execute this single file to seed all data at once
-- Execution time: ~2-3 minutes
-- ============================================================================

\echo '=========================================='
\echo 'NASHTY OS - PRODUCTION SEED DATA'
\echo 'Starting seed process...'
\echo '=========================================='
\echo ''

\echo '[1/6] Seeding Master Data (tenants, outlets, users, categories)...'
\i SEED_MASTER_REALISTIC.sql
\echo '✅ Master Data Complete'
\echo ''

\echo '[2/6] Seeding Products Part A (Hot Chicken, Burgers, Rice Bowls)...'
\i SEED_PART2_PRODUCTS.sql
\echo '✅ Products Part A Complete'
\echo ''

\echo '[3/6] Seeding Products Part B (Beverages, Snacks)...'
\i SEED_PART2B_BEVERAGES.sql
\echo '✅ Products Part B Complete'
\echo ''

\echo '[4/6] Seeding Products Part C (Sauces, Desserts, Modifiers, Payments)...'
\i SEED_PART2C_EXTRAS.sql
\echo '✅ Products Part C Complete'
\echo ''

\echo '[5/6] Seeding Members & Operational Costs...'
\i SEED_PART3_MEMBERS_COSTS.sql
\echo '✅ Members & Costs Complete'
\echo ''

\echo '[6/6] Generating Realistic Orders (this may take 30-60 seconds)...'
\i SEED_PART4_ORDERS.sql
\echo '✅ Orders Generated'
\echo ''

\echo '=========================================='
\echo 'SEED COMPLETE! 🎉'
\echo '=========================================='
\echo ''
\echo 'Summary:'
\echo '--------'

SELECT 'Master Data' AS category, 'Tenants' AS item, COUNT(*)::TEXT AS count FROM tenants
UNION ALL SELECT 'Master Data', 'Outlets', COUNT(*)::TEXT FROM outlets
UNION ALL SELECT 'Master Data', 'System Users', COUNT(*)::TEXT FROM system_users
UNION ALL SELECT 'Master Data', 'POS Users', COUNT(*)::TEXT FROM users
UNION ALL SELECT 'Master Data', 'Categories', COUNT(*)::TEXT FROM categories
UNION ALL SELECT 'Products', 'Total Products', COUNT(*)::TEXT FROM products
UNION ALL SELECT 'Products', 'Modifier Groups', COUNT(*)::TEXT FROM modifier_groups
UNION ALL SELECT 'Products', 'Payment Methods', COUNT(*)::TEXT FROM payment_methods
UNION ALL SELECT 'Customers', 'Members', COUNT(*)::TEXT FROM members
UNION ALL SELECT 'Transactions', 'Orders', COUNT(*)::TEXT FROM orders
UNION ALL SELECT 'Transactions', 'Order Items', COUNT(*)::TEXT FROM order_items
UNION ALL SELECT 'Transactions', 'Payments', COUNT(*)::TEXT FROM payments
UNION ALL SELECT 'Operations', 'Cost Entries', COUNT(*)::TEXT FROM nashtycosts;

\echo ''
\echo 'User Mapping Status:'
\echo '--------------------'

SELECT 
  su.username,
  CASE WHEN u.id IS NOT NULL THEN '✅ Mapped to POS' ELSE '⚠️ No POS mapping' END AS status
FROM system_users su
LEFT JOIN users u ON su.id = u.id
WHERE su.role IN ('cashier', 'manager')
ORDER BY su.username;

\echo ''
\echo 'Next Steps:'
\echo '- Login credentials: username + password "nashty@2024"'
\echo '- Cashier PINs: 1234, 2345, 3456, 4567, 5678'
\echo '- Check README_SEED.md for verification queries'
\echo ''
\echo 'Happy testing! 🚀'
