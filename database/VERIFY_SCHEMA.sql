-- ============================================================================
-- NASHTY OS - SCHEMA VERIFICATION SCRIPT
-- ============================================================================
-- Run this before executing seed data to verify table columns match
-- ============================================================================

\echo 'Verifying database schema...'
\echo ''

-- Check tenants table
\echo 'Checking tenants table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking outlets table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'outlets'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking system_users table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'system_users'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking users table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking categories table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking products table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking payment_methods table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_methods'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking orders table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking members table columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo 'Schema verification complete!'
\echo 'Review the columns above to ensure they match the seed data.'
\echo '=========================================='
