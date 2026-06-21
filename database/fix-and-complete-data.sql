-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - Fix Existing Data + Complete Missing Data
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- FIX USERS: Update roles to match schema
-- ───────────────────────────────────────────────────────────────────

-- Fix Superadmin → make it Owner with PIN 0000
UPDATE users 
SET role = 'owner', name = 'Super Owner'
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid;

-- Fix Manager → keep as manager (already correct)
-- PIN 1212 - Ahmad Fauzi

-- Fix Owner → should be owner not manager
UPDATE users 
SET role = 'owner'
WHERE id = '00000000-0000-0000-0000-000000000005'::uuid;

-- Fix Kasir → should be cashier not manager  
UPDATE users 
SET role = 'cashier'
WHERE id = '00000000-0000-0000-0000-000000000006'::uuid;

-- Add missing Kasir 2
INSERT INTO users (id, tenant_id, outlet_id, name, pin, role, status) 
VALUES (
  '00000000-0000-0000-0000-000000000204'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, 
  '00000000-0000-0000-0000-000000000101'::uuid, 
  'Budi Santoso', 
  '7777', 
  'cashier', 
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Add Kitchen user
INSERT INTO users (id, tenant_id, outlet_id, name, pin, role, status) 
VALUES (
  '00000000-0000-0000-0000-000000000205'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, 
  '00000000-0000-0000-0000-000000000101'::uuid, 
  'Dapur Team', 
  '5555', 
  'kitchen', 
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD MISSING CATEGORIES (need 3 more: Camilan, Dessert, Add On)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) VALUES
  ('00000000-0000-0000-0000-000000000303'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Camilan', 'camilan', '🍟', 3, 'active'),
  ('00000000-0000-0000-0000-000000000304'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Dessert', 'dessert', '🍨', 4, 'active'),
  ('00000000-0000-0000-0000-000000000305'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Add On', 'add-on', '🍚', 5, 'active')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD MORE PRODUCTS (avoid duplicate slugs - use different slugs)
-- ───────────────────────────────────────────────────────────────────

-- Makanan Utama (avoid existing: nasi-goreng-spesial, ayam-bakar-madu-2)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000603'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Rawon Spesial', 'rawon-spesial-surabaya', 42000, 22000, 'Rawon daging sapi dengan bumbu khas', 1, 'active'),
  ('00000000-0000-0000-0000-000000000604'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sop Buntut Premium', 'sop-buntut-premium', 65000, 35000, 'Sop buntut sapi dengan sayuran segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000605'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sate Ayam Bumbu Kacang', 'sate-ayam-10pcs-kacang', 45000, 23000, 'Sate ayam 10 tusuk dengan bumbu kacang', 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Minuman (category 302)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000606'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Kopi Susu Aren', 'kopi-susu-gula-aren', 22000, 8000, 'Kopi susu dengan gula aren premium', 1, 'active'),
  ('00000000-0000-0000-0000-000000000607'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Es Teh Manis Segar', 'es-teh-manis-segar', 8000, 2000, 'Es teh manis segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000608'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Alpukat Fresh', 'jus-alpukat-fresh', 18000, 7000, 'Jus alpukat segar tanpa gula', 1, 'active'),
  ('00000000-0000-0000-0000-000000000609'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Jeruk Peras', 'jus-jeruk-peras-segar', 15000, 6000, 'Jus jeruk peras segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000610'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Air Mineral Dingin', 'air-mineral-600ml', 5000, 2000, 'Air mineral dingin 600ml', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Camilan (category 303)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000611'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'French Fries Crispy', 'french-fries-saus', 22000, 8000, 'Kentang goreng renyah dengan saus', 0, 'active'),
  ('00000000-0000-0000-0000-000000000612'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Onion Rings Goreng', 'onion-rings-crispy', 18000, 7000, 'Bawang bombay goreng crispy', 0, 'active'),
  ('00000000-0000-0000-0000-000000000613'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Chicken Wings', 'chicken-wings-6pcs-crispy', 35000, 16000, 'Sayap ayam goreng crispy 6 pcs', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Dessert (category 304)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000614'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Es Krim Cokelat Premium', 'es-krim-cokelat-2-scoop', 18000, 6000, 'Es krim cokelat premium 2 scoop', 0, 'active'),
  ('00000000-0000-0000-0000-000000000615'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Pisang Goreng Topping', 'pisang-goreng-topping', 15000, 5000, 'Pisang goreng dengan topping', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Add On (category 305)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000616'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Nasi Putih Reguler', 'nasi-putih-porsi-reguler', 6000, 2000, 'Nasi putih porsi reguler', 0, 'active'),
  ('00000000-0000-0000-0000-000000000617'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Extra Sambal Pedas', 'extra-sambal-pedas-nambah', 3000, 1000, 'Sambal pedas extra', 0, 'active'),
  ('00000000-0000-0000-0000-000000000618'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Lalapan Segar', 'lalapan-segar-timun-kol', 4000, 1500, 'Lalapan segar (timun, kol, tomat)', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD MODIFIER GROUPS
-- ───────────────────────────────────────────────────────────────────
INSERT INTO modifier_groups (id, tenant_id, name, type, required, min_select, max_select) VALUES
  ('00000000-0000-0000-0000-000000000401'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Level Pedas', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000402'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Suhu Minuman', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000403'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Tambahan', 'multiple', 0, 0, 3)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD MODIFIER OPTIONS
-- ───────────────────────────────────────────────────────────────────
INSERT INTO modifier_options (id, group_id, name, price_adjustment) VALUES
  ('00000000-0000-0000-0000-000000000501'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Original', 0),
  ('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Sedang', 0),
  ('00000000-0000-0000-0000-000000000503'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Extra', 0),
  ('00000000-0000-0000-0000-000000000504'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Dingin', 0),
  ('00000000-0000-0000-0000-000000000505'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Hangat', 0),
  ('00000000-0000-0000-0000-000000000506'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Nasi Putih', 6000),
  ('00000000-0000-0000-0000-000000000507'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Extra Sambal', 3000),
  ('00000000-0000-0000-0000-000000000508'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Lalapan', 4000)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- LINK MODIFIERS TO PRODUCTS (use existing product IDs from cat-1, cat-2)
-- ───────────────────────────────────────────────────────────────────

-- Link "Level Pedas" to all Makanan Utama (cat-1)
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000401'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000301'::uuid
ON CONFLICT DO NOTHING;

-- Link "Tambahan" to all Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000403'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000301'::uuid
ON CONFLICT DO NOTHING;

-- Link "Suhu Minuman" to Minuman (cat-2, except Air Mineral)
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000402'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000302'::uuid
  AND p.slug NOT LIKE '%air-mineral%'
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD SETTINGS
-- ───────────────────────────────────────────────────────────────────
INSERT INTO settings (id, tenant_id, outlet_id, key, value, type) VALUES
  ('00000000-0000-0000-0000-000000000701'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_restaurant_name', 'Nashty Hot Chicken', 'string'),
  ('00000000-0000-0000-0000-000000000702'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_address', 'Galaxy Mall Lt. 3, Surabaya', 'string'),
  ('00000000-0000-0000-0000-000000000703'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_phone', '031-8123456', 'string'),
  ('00000000-0000-0000-0000-000000000704'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'receipt_footer', 'IT AIN''T TASTY IF IT AIN''T NASHTY', 'string'),
  ('00000000-0000-0000-0000-000000000705'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'tax_percentage', '11', 'number'),
  ('00000000-0000-0000-0000-000000000706'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'service_percentage', '5', 'number')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- DONE! All data fixed and completed.
-- ═══════════════════════════════════════════════════════════════════
