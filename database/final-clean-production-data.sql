-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - FINAL CLEAN PRODUCTION DATA
-- Run Date: June 21, 2026
-- Purpose: Clean existing data & populate production-ready database
-- ═══════════════════════════════════════════════════════════════════

\echo '════════════════════════════════════════════════'
\echo 'STEP 1: Clean Existing Incorrect Data'
\echo '════════════════════════════════════════════════'

-- Delete all existing data in reverse dependency order
DELETE FROM order_item_modifiers;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payments;
DELETE FROM product_modifiers;
DELETE FROM modifier_options;
DELETE FROM modifier_groups;
DELETE FROM favorites;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM settings;
DELETE FROM shifts;
DELETE FROM users;
DELETE FROM outlets;
DELETE FROM tenants;

\echo 'All existing data cleaned!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 2: Create Tenant & Outlet'
\echo '════════════════════════════════════════════════'

INSERT INTO tenants (id, name, slug, plan, status) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Nashty Hot Chicken', 'nashty', 'pro', 'active');

INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status) VALUES
  ('00000000-0000-0000-0000-000000000101'::uuid, 
   '00000000-0000-0000-0000-000000000001'::uuid, 
   'Galaxy Mall Surabaya', 
   'galaxy-mall', 
   'Galaxy Mall Lt. 3, Jl. Dharmahusada Indah, Surabaya', 
   '031-8123456', 
   'active');

\echo 'Tenant & Outlet created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 3: Create Users with Correct Roles'
\echo '════════════════════════════════════════════════'

INSERT INTO users (id, tenant_id, outlet_id, name, pin, role, status) VALUES
  -- Superadmin (full system access)
  ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Superadmin', '0000', 'owner', 'active'),
  
  -- Owner (business owner)
  ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Owner', '9999', 'owner', 'active'),
  
  -- Manager
  ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Manager', '1212', 'manager', 'active'),
  
  -- Cashier 1 (Citra)
  ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Citra Kasir', '8888', 'cashier', 'active'),
  
  -- Cashier 2 (Budi)
  ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Budi Santoso', '7777', 'cashier', 'active'),
  
  -- Kitchen Staff
  ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'Dapur Team', '5555', 'kitchen', 'active');

\echo 'Users created with correct roles!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 4: Create Categories'
\echo '════════════════════════════════════════════════'

INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) VALUES
  ('00000000-0000-0000-0000-000000000301'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Makanan Utama', 'makanan-utama', '🍗', 1, 'active'),
  ('00000000-0000-0000-0000-000000000302'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Minuman', 'minuman', '🥤', 2, 'active'),
  ('00000000-0000-0000-0000-000000000303'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Camilan', 'camilan', '🍟', 3, 'active'),
  ('00000000-0000-0000-0000-000000000304'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Dessert', 'dessert', '🍨', 4, 'active'),
  ('00000000-0000-0000-0000-000000000305'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Add On', 'add-on', '🍚', 5, 'active');

\echo 'Categories created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 5: Create Products'
\echo '════════════════════════════════════════════════'

-- Makanan Utama (18 products)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Nasi Goreng Spesial', 'nasi-goreng-spesial', 28000, 12000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Mie Goreng', 'mie-goreng', 25000, 10000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Ayam Geprek', 'ayam-geprek', 32000, 15000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Ayam Bakar', 'ayam-bakar', 35000, 16000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Rawon Spesial', 'rawon-spesial', 42000, 22000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sop Buntut', 'sop-buntut', 65000, 35000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sate Ayam 10pcs', 'sate-ayam', 45000, 23000, 1, 'active');

-- Minuman (6 products)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Es Teh Manis', 'es-teh-manis', 8000, 2000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Es Jeruk', 'es-jeruk', 12000, 4000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Kopi Susu Aren', 'kopi-susu-aren', 22000, 8000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Alpukat', 'jus-alpukat', 18000, 7000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Jeruk', 'jus-jeruk', 15000, 6000, 1, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Air Mineral', 'air-mineral', 5000, 2000, 0, 'active');

-- Camilan (3 products)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'French Fries', 'french-fries', 22000, 8000, 0, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Onion Rings', 'onion-rings', 18000, 7000, 0, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Chicken Wings 6pcs', 'chicken-wings', 35000, 16000, 0, 'active');

-- Dessert (2 products)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Es Krim Cokelat', 'es-krim-cokelat', 18000, 6000, 0, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Pisang Goreng', 'pisang-goreng', 15000, 5000, 0, 'active');

-- Add On (3 products)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Nasi Putih', 'nasi-putih', 6000, 2000, 0, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Extra Sambal', 'extra-sambal', 3000, 1000, 0, 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Lalapan', 'lalapan', 4000, 1500, 0, 'active');

\echo 'Products created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 6: Create Modifier Groups'
\echo '════════════════════════════════════════════════'

INSERT INTO modifier_groups (id, tenant_id, name, type, required, min_select, max_select, status) VALUES
  ('00000000-0000-0000-0000-000000000401'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Level Pedas', 'single', 1, 1, 1, 'active'),
  ('00000000-0000-0000-0000-000000000402'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Suhu Minuman', 'single', 1, 1, 1, 'active'),
  ('00000000-0000-0000-0000-000000000403'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Tambahan', 'multiple', 0, 0, 3, 'active');

\echo 'Modifier groups created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 7: Create Modifier Options'
\echo '════════════════════════════════════════════════'

INSERT INTO modifier_options (id, group_id, name, price_adjustment, status) VALUES
  -- Level Pedas options
  ('00000000-0000-0000-0000-000000000501'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Original', 0, 'active'),
  ('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Sedang', 0, 'active'),
  ('00000000-0000-0000-0000-000000000503'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Extra', 0, 'active'),
  
  -- Suhu Minuman options
  ('00000000-0000-0000-0000-000000000504'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Dingin', 0, 'active'),
  ('00000000-0000-0000-0000-000000000505'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Hangat', 0, 'active'),
  
  -- Tambahan options
  ('00000000-0000-0000-0000-000000000506'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Nasi Putih', 6000, 'active'),
  ('00000000-0000-0000-0000-000000000507'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Extra Sambal', 3000, 'active'),
  ('00000000-0000-0000-0000-000000000508'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Lalapan', 4000, 'active');

\echo 'Modifier options created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 8: Link Modifiers to Products'
\echo '════════════════════════════════════════════════'

-- Link "Level Pedas" to all Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000401'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000301'::uuid;

-- Link "Tambahan" to all Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000403'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000301'::uuid;

-- Link "Suhu Minuman" to Minuman (except Air Mineral)
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000402'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000302'::uuid
  AND p.name != 'Air Mineral';

\echo 'Modifiers linked to products!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'STEP 9: Create Settings'
\echo '════════════════════════════════════════════════'

INSERT INTO settings (id, tenant_id, outlet_id, key, value, type) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_restaurant_name', 'Nashty Hot Chicken', 'string'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_address', 'Galaxy Mall Lt. 3, Surabaya', 'string'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_phone', '031-8123456', 'string'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_footer', 'IT AIN''T TASTY IF IT AIN''T NASHTY', 'string'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'tax_percentage', '11', 'number'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'service_percentage', '5', 'number');

\echo 'Settings created!'

-- ═══════════════════════════════════════════════════════════════════
\echo '════════════════════════════════════════════════'
\echo 'FINAL SUMMARY'
\echo '════════════════════════════════════════════════'

SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM outlets) as outlets,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM modifier_groups) as modifier_groups,
  (SELECT COUNT(*) FROM modifier_options) as modifier_options,
  (SELECT COUNT(*) FROM product_modifiers) as product_modifiers,
  (SELECT COUNT(*) FROM settings) as settings;

\echo '════════════════════════════════════════════════'
\echo '✅ DATABASE READY FOR PRODUCTION!'
\echo ''
\echo 'Test logins:'
\echo '  • PIN 0000 - Superadmin'
\echo '  • PIN 9999 - Owner'
\echo '  • PIN 1212 - Manager'
\echo '  • PIN 8888 - Kasir (Citra)'
\echo '  • PIN 7777 - Kasir (Budi)'
\echo '  • PIN 5555 - Kitchen'
\echo ''
\echo 'Next: Test at https://nashtyxolvon2.pages.dev/pos/frontend'
\echo '════════════════════════════════════════════════'
