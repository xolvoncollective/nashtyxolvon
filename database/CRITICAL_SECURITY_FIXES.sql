-- =====================================================
-- CRITICAL DATABASE FIXES
-- Date: 2026-06-22
-- Purpose: Fix critical security vulnerabilities found in audit
-- Priority: URGENT - Execute immediately
-- =====================================================

-- =====================================================
-- CRITICAL FIX 1: Enable RLS on users table
-- =====================================================
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on users table';
  
  -- Create policy: users can only read their own data
  DROP POLICY IF EXISTS "users_read_own" ON users;
  CREATE POLICY "users_read_own" ON users
    FOR SELECT
    USING (id = (select auth.uid()));
  
  -- Create policy: users can update their own data
  DROP POLICY IF EXISTS "users_update_own" ON users;
  CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (id = (select auth.uid()));
  
  RAISE NOTICE 'RLS policies created for users table';
END $$;

-- =====================================================
-- CRITICAL FIX 2: Revoke public access to dangerous functions
-- =====================================================
DO $$
BEGIN
  -- Revoke execute from anon and authenticated for execute_sql
  REVOKE EXECUTE ON FUNCTION execute_sql(text, jsonb) FROM anon, authenticated;
  GRANT EXECUTE ON FUNCTION execute_sql(text, jsonb) TO service_role;
  RAISE NOTICE 'Revoked public access to execute_sql function';
  
  -- Revoke execute from anon and authenticated for rls_auto_enable
  REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM anon, authenticated;
  GRANT EXECUTE ON FUNCTION rls_auto_enable() TO service_role;
  RAISE NOTICE 'Revoked public access to rls_auto_enable function';
END $$;

-- =====================================================
-- HIGH PRIORITY FIX 3: Fix generate_order_number ambiguous column
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  today_date TEXT;
  next_number INTEGER;
  order_number TEXT;
BEGIN
  today_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- FIXED: Added table alias 'o' to disambiguate column reference
  SELECT COALESCE(MAX(SUBSTRING(o.order_number FROM 8)::INTEGER), 0) + 1 
  INTO next_number
  FROM orders o
  WHERE o.order_number LIKE 'ORD-' || today_date || '%';
  
  order_number := 'ORD-' || today_date || LPAD(next_number::TEXT, 4, '0');
  
  RETURN order_number;
END;
$$;

COMMENT ON FUNCTION generate_order_number() IS 'Generate unique order number with format ORD-YYMMDD#### (FIXED: ambiguous column reference)';

-- =====================================================
-- HIGH PRIORITY FIX 4: Fix function search paths
-- =====================================================

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix cleanup_expired_tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM token_blacklist
  WHERE expired_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix cleanup_expired_cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_cache
  WHERE expired_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix set_updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- MEDIUM PRIORITY FIX 5: Clean up duplicate RLS policies
-- =====================================================

-- Products: Remove old "Allow anon read" policy, keep new one
DROP POLICY IF EXISTS "Allow anon read" ON products;
COMMENT ON POLICY "anon_select_products" ON products IS 'Allows anonymous users to read products';

-- Categories: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON categories;
COMMENT ON POLICY "anon_select_categories" ON categories IS 'Allows anonymous users to read categories';

-- Orders: Remove old "Allow anon read" policy  
DROP POLICY IF EXISTS "Allow anon read" ON orders;
COMMENT ON POLICY "anon_select_orders" ON orders IS 'Allows anonymous users to read orders';

-- Order Items: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON order_items;
COMMENT ON POLICY "anon_select_order_items" ON order_items IS 'Allows anonymous users to read order items';

-- Staff: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON staff;
COMMENT ON POLICY "anon_select_staff" ON staff IS 'Allows anonymous users to read staff';

-- Outlets: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON outlets;
COMMENT ON POLICY "anon_select_outlets" ON outlets IS 'Allows anonymous users to read outlets';

-- Tenants: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON tenants;
COMMENT ON POLICY "anon_select_tenants" ON tenants IS 'Allows anonymous users to read tenants';

-- Shifts: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON shifts;
COMMENT ON POLICY "anon_select_shifts" ON shifts IS 'Allows anonymous users to read shifts';

-- Members: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON members;
COMMENT ON POLICY "anon_select_members" ON members IS 'Allows anonymous users to read members';

-- Payments: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON payments;
COMMENT ON POLICY "anon_select_payments" ON payments IS 'Allows anonymous users to read payments';

-- Modifier Groups: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON modifier_groups;
COMMENT ON POLICY "anon_select_modifier_groups" ON modifier_groups IS 'Allows anonymous users to read modifier groups';

-- Modifier Options: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON modifier_options;
COMMENT ON POLICY "anon_select_modifier_options" ON modifier_options IS 'Allows anonymous users to read modifier options';

-- Settings: Remove old "Allow anon read" policy  
DROP POLICY IF EXISTS "Allow anon read" ON settings;

-- Activity Logs: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON activity_logs;

-- Stations: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON stations;

-- Nashtycosts: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON nashtycosts;

-- System Users: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON system_users;

DO $$ BEGIN RAISE NOTICE 'Duplicate RLS policies cleaned up'; END $$;

-- =====================================================
-- MEDIUM PRIORITY FIX 6: Optimize auth RLS policies
-- =====================================================

-- Favorites: Optimize all 4 policies
DROP POLICY IF EXISTS "favorites_own_select" ON favorites;
CREATE POLICY "favorites_own_select" ON favorites
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "favorites_own_insert" ON favorites;
CREATE POLICY "favorites_own_insert" ON favorites
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "favorites_own_update" ON favorites;
CREATE POLICY "favorites_own_update" ON favorites
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "favorites_own_delete" ON favorites;
CREATE POLICY "favorites_own_delete" ON favorites
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Outlet Settings: Optimize service role policy
DROP POLICY IF EXISTS "outlet_settings_service_role" ON outlet_settings;
CREATE POLICY "outlet_settings_service_role" ON outlet_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Token Blacklist: Optimize service role policy
DROP POLICY IF EXISTS "token_blacklist_service_role" ON token_blacklist;
CREATE POLICY "token_blacklist_service_role" ON token_blacklist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Analytics Cache: Optimize service role policy
DROP POLICY IF EXISTS "analytics_cache_service_role" ON analytics_cache;
CREATE POLICY "analytics_cache_service_role" ON analytics_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ BEGIN RAISE NOTICE 'Auth RLS policies optimized'; END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify users table RLS enabled
SELECT 'USERS TABLE RLS:' as check_name, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Verify dangerous functions revoked
SELECT 'EXECUTE_SQL ACCESS:' as check_name,
       string_agg(grantee::text, ', ') as granted_to
FROM information_schema.routine_privileges
WHERE routine_name = 'execute_sql'
  AND privilege_type = 'EXECUTE';

-- Verify generate_order_number fixed
SELECT 'GENERATE_ORDER_NUMBER:' as check_name,
       CASE WHEN prosrc LIKE '%o.order_number%' THEN 'FIXED' ELSE 'NOT FIXED' END as status
FROM pg_proc
WHERE proname = 'generate_order_number';

-- Count remaining duplicate policies
SELECT 'DUPLICATE POLICIES:' as check_name,
       COUNT(*) as count
FROM (
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%Allow anon read%'
) sub;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

SELECT '=====================================' as separator;
SELECT 'CRITICAL FIXES EXECUTION COMPLETE' as status;
SELECT 'Date: ' || CURRENT_TIMESTAMP::TEXT as timestamp;
SELECT '=====================================' as separator;
