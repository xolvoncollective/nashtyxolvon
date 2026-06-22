-- =====================================================
-- CRITICAL DATABASE FIXES - PART 3: POLICY CLEANUP
-- Date: 2026-06-22
-- Execute after Part 1 and 2
-- =====================================================

-- =====================================================
-- FIX 5: Clean up duplicate RLS policies
-- =====================================================

-- Products: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON products;

-- Categories: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON categories;

-- Orders: Remove old "Allow anon read" policy  
DROP POLICY IF EXISTS "Allow anon read" ON orders;

-- Order Items: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON order_items;

-- Staff: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON staff;

-- Outlets: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON outlets;

-- Tenants: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON tenants;

-- Shifts: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON shifts;

-- Members: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON members;

-- Payments: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON payments;

-- Modifier Groups: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON modifier_groups;

-- Modifier Options: Remove old "Allow anon read" policy
DROP POLICY IF EXISTS "Allow anon read" ON modifier_options;

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

-- =====================================================
-- FIX 6: Optimize auth RLS policies
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

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Count remaining duplicate policies
SELECT 'DUPLICATE POLICIES REMAINING:' as check_name,
       COUNT(*) as count
FROM (
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%Allow anon read%'
) sub;

SELECT 'POLICY CLEANUP:' as status, 'COMPLETE ✓' as result;

SELECT '=====================================' as separator;
SELECT 'ALL CRITICAL FIXES COMPLETE ✓' as final_status;
SELECT 'Date: ' || CURRENT_TIMESTAMP::TEXT as timestamp;
SELECT '=====================================' as separator;
