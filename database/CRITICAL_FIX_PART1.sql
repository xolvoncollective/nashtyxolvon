-- =====================================================
-- CRITICAL DATABASE FIXES - PART 1: IMMEDIATE ACTIONS
-- Date: 2026-06-22
-- Execute this first for critical security fixes
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
-- VERIFICATION
-- =====================================================
SELECT 'USERS TABLE RLS:' as check_name, 
       CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

SELECT 'CRITICAL FIXES PART 1:' as status, 'COMPLETE ✓' as result;
