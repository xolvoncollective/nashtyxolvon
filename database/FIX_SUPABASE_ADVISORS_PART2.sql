-- ========================================
-- FIX REMAINING SUPABASE ADVISORS WARNINGS
-- Date: 2026-06-22 Part 2
-- Purpose: Complete fix for all security warnings
-- ========================================

-- ===== PART 1: PROPERLY REVOKE DANGEROUS FUNCTIONS =====

-- First, check current grants
SELECT 
  p.proname,
  array_agg(DISTINCT r.rolname) as has_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_roles r ON has_function_privilege(r.oid, p.oid, 'EXECUTE')
WHERE n.nspname = 'public'
  AND p.proname IN ('execute_sql', 'rls_auto_enable')
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
GROUP BY p.proname;

-- Revoke ALL privileges first, then grant only to service_role
REVOKE ALL ON FUNCTION public.execute_sql(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- Grant only to service_role
GRANT EXECUTE ON FUNCTION public.execute_sql(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- ===== PART 2: OPTIMIZE RLS POLICIES - USE (select auth.uid()) =====

-- 1. Fix system_users_superadmin_access policy
DROP POLICY IF EXISTS system_users_superadmin_access ON public.system_users;

CREATE POLICY system_users_superadmin_access ON public.system_users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())  -- Optimized: evaluated once
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())  -- Optimized: evaluated once
      AND su.role = 'superadmin'
    )
  );

-- 2. Fix user_system_access_superadmin policy
DROP POLICY IF EXISTS user_system_access_superadmin ON public.user_system_access;

CREATE POLICY user_system_access_superadmin ON public.user_system_access
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())  -- Optimized: evaluated once
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())  -- Optimized: evaluated once
      AND su.role = 'superadmin'
    )
  );

-- ===== PART 3: MERGE DUPLICATE POLICIES (PERFORMANCE OPTIMIZATION) =====

-- Strategy: Combine superadmin policies with user policies using OR condition
-- This eliminates "multiple permissive policies" warning

-- 1. Merge system_users policies
DROP POLICY IF EXISTS users_see_self ON public.system_users;
DROP POLICY IF EXISTS system_users_superadmin_access ON public.system_users;

-- Single merged policy for SELECT
CREATE POLICY system_users_read ON public.system_users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    -- User can see themselves
    id = (select auth.uid())
    OR
    -- OR superadmin can see all
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  );

-- Separate policies for UPDATE/DELETE (more secure)
CREATE POLICY system_users_update ON public.system_users
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  );

-- 2. Merge user_system_access policies
DROP POLICY IF EXISTS users_see_own_access ON public.user_system_access;
DROP POLICY IF EXISTS user_system_access_superadmin ON public.user_system_access;

-- Single merged policy for SELECT
CREATE POLICY user_system_access_read ON public.user_system_access
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own access
    user_id = (select auth.uid())
    OR
    -- OR superadmin can see all
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  );

-- Separate policies for other operations
CREATE POLICY user_system_access_manage ON public.user_system_access
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = (select auth.uid())
      AND su.role = 'superadmin'
    )
  );

-- ===== VERIFICATION =====

-- Check function permissions (should only show service_role)
SELECT 
  p.proname AS function_name,
  r.rolname AS role_with_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON has_function_privilege(r.oid, p.oid, 'EXECUTE')
WHERE n.nspname = 'public'
  AND p.proname IN ('execute_sql', 'rls_auto_enable')
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY p.proname, r.rolname;

-- Check policies (should be no duplicates per role/action)
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies,
  roles[1] as role,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('system_users', 'user_system_access')
GROUP BY tablename, roles[1], cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- ========================================
-- EXPECTED OUTCOME:
-- - execute_sql and rls_auto_enable: service_role ONLY
-- - system_users: 2 policies (system_users_read, system_users_update) - NO DUPLICATES
-- - user_system_access: 2 policies (user_system_access_read, user_system_access_manage) - NO DUPLICATES
-- - All policies use (select auth.uid()) for performance
-- ========================================
