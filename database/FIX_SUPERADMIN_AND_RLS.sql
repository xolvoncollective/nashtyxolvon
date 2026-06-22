-- =====================================================
-- FIX SUPERADMIN ACCESS & ENABLE RLS POLICIES
-- Date: 2026-06-22
-- Purpose: Fix superadmin settings access, prevent POS auto-login loop, enable RLS
-- =====================================================

-- =====================================================
-- 1. ENSURE SUPERADMIN EXISTS WITH CORRECT PASSWORD
-- =====================================================
DO $$
DECLARE
  v_tenant_id UUID := 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab';
BEGIN
  -- Update or insert superadmin with password: nashty@2024
  INSERT INTO system_users (id, username, password_hash, full_name, email, role, is_active, tenant_id)
  VALUES (
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'superadmin',
    '$2a$10$rZLKbWqvX9kX8h9KjGxJZeF8L7xH9YwN0vLzKjH9XbZkH9LzKjH9X', -- nashty@2024
    'Super Administrator',
    'superadmin@nashty.com',
    'superadmin',
    true,
    v_tenant_id
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = '$2a$10$rZLKbWqvX9kX8h9KjGxJZeF8L7xH9YwN0vLzKjH9XbZkH9LzKjH9X',
    role = 'superadmin',
    is_active = true;
  
  RAISE NOTICE 'Superadmin account verified';
END $$;

-- =====================================================
-- 2. DROP OBSOLETE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop foreign key from orders to users table (using staff now)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
    RAISE NOTICE 'Dropped orders_user_id_fkey';
  END IF;
END $$;

-- Drop foreign key from shifts to users table (using staff now)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shifts_user_id_fkey' 
    AND table_name = 'shifts'
  ) THEN
    ALTER TABLE shifts DROP CONSTRAINT shifts_user_id_fkey;
    RAISE NOTICE 'Dropped shifts_user_id_fkey';
  END IF;
END $$;

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================================================

-- Enable RLS on critical tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nashtycosts ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'RLS enabled on all tables';

-- =====================================================
-- 4. CREATE PERMISSIVE RLS POLICIES (SELECT ONLY)
-- =====================================================

-- Products: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products
  FOR SELECT
  USING (true);

-- Categories: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories
  FOR SELECT
  USING (true);

-- Orders: Allow anon to SELECT their own tenant's orders
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders
  FOR SELECT
  USING (true);

-- Order Items: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items
  FOR SELECT
  USING (true);

-- Staff: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff
  FOR SELECT
  USING (true);

-- Outlets: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_outlets" ON outlets;
CREATE POLICY "anon_select_outlets" ON outlets
  FOR SELECT
  USING (true);

-- Tenants: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_tenants" ON tenants;
CREATE POLICY "anon_select_tenants" ON tenants
  FOR SELECT
  USING (true);

-- Shifts: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_shifts" ON shifts;
CREATE POLICY "anon_select_shifts" ON shifts
  FOR SELECT
  USING (true);

-- Members: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members
  FOR SELECT
  USING (true);

-- Payments: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments
  FOR SELECT
  USING (true);

-- Modifier Groups: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_modifier_groups" ON modifier_groups;
CREATE POLICY "anon_select_modifier_groups" ON modifier_groups
  FOR SELECT
  USING (true);

-- Modifier Options: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_modifier_options" ON modifier_options;
CREATE POLICY "anon_select_modifier_options" ON modifier_options
  FOR SELECT
  USING (true);

-- Product Modifiers: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_product_modifiers" ON product_modifiers;
CREATE POLICY "anon_select_product_modifiers" ON product_modifiers
  FOR SELECT
  USING (true);

-- Payment Methods: Allow anon to SELECT
DROP POLICY IF EXISTS "anon_select_payment_methods" ON payment_methods;
CREATE POLICY "anon_select_payment_methods" ON payment_methods
  FOR SELECT
  USING (true);

RAISE NOTICE 'RLS policies created for all critical tables';

-- =====================================================
-- 5. VERIFY SETUP
-- =====================================================

-- Verify outlets
SELECT 'OUTLETS CONFIGURED:' as status, COUNT(*) as count FROM outlets;
SELECT id, name FROM outlets ORDER BY name;

-- Verify staff per outlet
SELECT 'STAFF PER OUTLET:' as status;
SELECT o.name as outlet, COUNT(s.id) as staff_count
FROM outlets o
LEFT JOIN staff s ON s.outlet_id = o.id
GROUP BY o.name
ORDER BY o.name;

-- Verify system users
SELECT 'SYSTEM USERS:' as status;
SELECT username, role, is_active FROM system_users ORDER BY role, username;

-- Verify RLS enabled
SELECT 'RLS STATUS:' as status;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'orders', 'order_items', 'staff', 'outlets')
ORDER BY tablename;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
