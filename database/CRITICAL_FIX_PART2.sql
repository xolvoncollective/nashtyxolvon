-- =====================================================
-- CRITICAL DATABASE FIXES - PART 2: FUNCTION FIXES
-- Date: 2026-06-22
-- Execute after Part 1
-- =====================================================

-- =====================================================
-- FIX 3: Drop and recreate generate_order_number with fix
-- =====================================================
DROP FUNCTION IF EXISTS generate_order_number();

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

-- =====================================================
-- FIX 4: Fix function search paths
-- =====================================================

-- Fix update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
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
DROP FUNCTION IF EXISTS cleanup_expired_tokens() CASCADE;
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
DROP FUNCTION IF EXISTS cleanup_expired_cache() CASCADE;
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
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
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

SELECT 'FUNCTION FIXES:' as status, 'COMPLETE ✓' as result;
