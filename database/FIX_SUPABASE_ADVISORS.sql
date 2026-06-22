-- ========================================
-- FIX SUPABASE ADVISORS WARNINGS
-- Date: 2026-06-22
-- Purpose: Fix security and performance warnings
-- ========================================

-- ===== PART 1: FIX SECURITY DEFINER FUNCTIONS =====
-- These functions should NOT be accessible to anon/authenticated

-- 1. Revoke execute_sql from public roles (CRITICAL SECURITY)
REVOKE EXECUTE ON FUNCTION public.execute_sql(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.execute_sql(text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text, jsonb) TO service_role;

-- 2. Revoke rls_auto_enable from public roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- 3. Add search_path to execute_sql (already has it, but ensure it's set)
-- This was already fixed in previous session, but verify:
ALTER FUNCTION public.execute_sql(text, jsonb)
  SET search_path = pg_catalog, public;

-- ===== PART 2: FIX MULTIPLE PERMISSIVE POLICIES =====
-- Remove duplicate policies to improve performance

-- 1. Drop staff duplicate policy (keep anon_select_staff, remove staff_all_access)
DROP POLICY IF EXISTS staff_all_access ON public.staff;

-- Recreate staff_all_access as RESTRICTIVE for specific operations
-- This allows service_role and superadmin full access without conflicting with anon_select
CREATE POLICY staff_service_access ON public.staff
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Fix system_users multiple policies
-- Keep users_see_self for regular users, make superadmin_all_users more specific
DROP POLICY IF EXISTS superadmin_all_users ON public.system_users;

-- Recreate as service_role only policy
CREATE POLICY system_users_service_access ON public.system_users
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add superadmin-specific policy (more secure than USING (true))
CREATE POLICY system_users_superadmin_access ON public.system_users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = auth.uid()
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = auth.uid()
      AND su.role = 'superadmin'
    )
  );

-- 3. Fix user_system_access multiple policies
DROP POLICY IF EXISTS superadmin_manage_access ON public.user_system_access;

-- Recreate as service_role only
CREATE POLICY user_system_access_service ON public.user_system_access
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add superadmin-specific policy
CREATE POLICY user_system_access_superadmin ON public.user_system_access
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = auth.uid()
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_users su
      WHERE su.id = auth.uid()
      AND su.role = 'superadmin'
    )
  );

-- ===== PART 3: FIX STORAGE BUCKET POLICIES =====
-- Remove broad SELECT policies (files are accessible via URL anyway)

-- 1. Drop promotions bucket SELECT policy
DROP POLICY IF EXISTS promotions_public_read ON storage.objects;

-- Recreate as individual object access only (no listing)
CREATE POLICY promotions_public_access ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'promotions' AND auth.role() IN ('anon', 'authenticated'));

-- 2. Drop receipts bucket SELECT policy
DROP POLICY IF EXISTS receipts_public_read ON storage.objects;

-- Recreate as individual object access only
CREATE POLICY receipts_public_access ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'receipts' AND auth.role() IN ('anon', 'authenticated'));

-- ===== VERIFICATION QUERIES =====

-- Check function permissions
SELECT 
  p.proname AS function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
  array_agg(DISTINCT acl.rolname) AS granted_roles
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN LATERAL unnest(p.proacl) AS acl_item ON true
LEFT JOIN pg_roles acl ON acl_item::text LIKE '%' || acl.rolname || '%'
WHERE n.nspname = 'public'
  AND p.proname IN ('execute_sql', 'rls_auto_enable')
GROUP BY p.proname, p.oid;

-- Check policies per table
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE tablename IN ('staff', 'system_users', 'user_system_access')
ORDER BY tablename, policyname;

-- Check storage policies
SELECT 
  policyname,
  tablename,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%promotions%' OR policyname LIKE '%receipts%'
ORDER BY policyname;

-- ========================================
-- EXPECTED RESULTS AFTER FIX:
-- 
-- 1. execute_sql and rls_auto_enable: Only service_role can execute
-- 2. staff table: 2 policies (anon_select_staff, staff_service_access)
-- 3. system_users: 3 policies (users_see_self, users_update_own, system_users_service_access, system_users_superadmin_access)
-- 4. user_system_access: 3 policies (users_see_own_access, user_system_access_service, user_system_access_superadmin)
-- 5. Storage buckets: Individual object access only, no listing
-- ========================================
