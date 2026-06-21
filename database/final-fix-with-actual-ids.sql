-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - Final Fix Using Actual IDs from Database
-- ═══════════════════════════════════════════════════════════════════

-- Get actual outlet_id first
DO $$
DECLARE
  v_outlet_id UUID;
BEGIN
  -- Get the actual outlet ID
  SELECT id INTO v_outlet_id FROM outlets WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1;
  
  IF v_outlet_id IS NULL THEN
    RAISE EXCEPTION 'No outlet found for tenant';
  END IF;
  
  -- Fix existing users to use correct outlet_id
  UPDATE users SET outlet_id = v_outlet_id 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Fix roles
  UPDATE users SET role = 'owner', name = 'Super Owner'
  WHERE id = '00000000-0000-0000-0000-000000000003'::uuid;
  
  UPDATE users SET role = 'owner'
  WHERE id = '00000000-0000-0000-0000-000000000005'::uuid;
  
  UPDATE users SET role = 'cashier'
  WHERE id = '00000000-0000-0000-0000-000000000006'::uuid;
  
  -- Add missing Kasir 2 with correct outlet_id
  INSERT INTO users (id, tenant_id, outlet_id, name, pin, role, status) 
  VALUES (
    '00000000-0000-0000-0000-000000000204'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid, 
    v_outlet_id, 
    'Budi Santoso', 
    '7777', 
    'cashier', 
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET outlet_id = v_outlet_id;
  
  -- Add Kitchen user with correct outlet_id
  INSERT INTO users (id, tenant_id, outlet_id, name, pin, role, status) 
  VALUES (
    '00000000-0000-0000-0000-000000000205'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid, 
    v_outlet_id, 
    'Dapur Team', 
    '5555', 
    'kitchen', 
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET outlet_id = v_outlet_id;
  
END $$;

-- ───────────────────────────────────────────────────────────────────
-- ADD MISSING CATEGORIES
-- ───────────────────────────────────────────────────────────────────
INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) VALUES
  ('00000000-0000-0000-0000-000000000303'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Camilan', 'camilan-crispy', '🍟', 3, 'active'),
  ('00000000-0000-0000-0000-000000000304'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Dessert', 'dessert-manis', '🍨', 4, 'active'),
  ('00000000-0000-0000-0000-000000000305'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Add On', 'addon-tambahan', '🍚', 5, 'active')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD MORE PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Makanan Utama (cat-1)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000603'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Rawon Spesial', 'rawon-spesial-surabaya-2026', 42000, 22000, 'Rawon daging sapi dengan bumbu khas', 1, 'active'),
  ('00000000-0000-0000-0000-000000000604'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sop Buntut Premium', 'sop-buntut-premium-2026', 65000, 35000, 'Sop buntut sapi dengan sayuran segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000605'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sate Ayam Bumbu Kacang', 'sate-ayam-10pcs-kacang-2026', 45000, 23000, 'Sate ayam 10 tusuk dengan bumbu kacang', 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Minuman (cat-2)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000606'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Kopi Susu Aren', 'kopi-susu-gula-aren-2026', 22000, 8000, 'Kopi susu dengan gula aren premium', 1, 'active'),
  ('00000000-0000-0000-0000-000000000607'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Es Teh Manis Segar', 'es-teh-manis-segar-2026', 8000, 2000, 'Es teh manis segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000608'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Alpukat Fresh', 'jus-alpukat-fresh-2026', 18000, 7000, 'Jus alpukat segar tanpa gula', 1, 'active'),
  ('00000000-0000-0000-0000-000000000609'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Jeruk Peras', 'jus-jeruk-peras-segar-2026', 15000, 6000, 'Jus jeruk peras segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000610'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Air Mineral Dingin', 'air-mineral-600ml-2026', 5000, 2000, 'Air mineral dingin 600ml', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Camilan (cat-3)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000611'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'French Fries Crispy', 'french-fries-saus-2026', 22000, 8000, 'Kentang goreng renyah dengan saus', 0, 'active'),
  ('00000000-0000-0000-0000-000000000612'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Onion Rings Goreng', 'onion-rings-crispy-2026', 18000, 7000, 'Bawang bombay goreng crispy', 0, 'active'),
  ('00000000-0000-0000-0000-000000000613'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Chicken Wings', 'chicken-wings-6pcs-crispy-2026', 35000, 16000, 'Sayap ayam goreng crispy 6 pcs', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Dessert (cat-4)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000614'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Es Krim Cokelat Premium', 'es-krim-cokelat-2-scoop-2026', 18000, 6000, 'Es krim cokelat premium 2 scoop', 0, 'active'),
  ('00000000-0000-0000-0000-000000000615'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Pisang Goreng Topping', 'pisang-goreng-topping-2026', 15000, 5000, 'Pisang goreng dengan topping', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Add On (cat-5)
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000616'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Nasi Putih Reguler', 'nasi-putih-porsi-reguler-2026', 6000, 2000, 'Nasi putih porsi reguler', 0, 'active'),
  ('00000000-0000-0000-0000-000000000617'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Extra Sambal Pedas', 'extra-sambal-pedas-nambah-2026', 3000, 1000, 'Sambal pedas extra', 0, 'active'),
  ('00000000-0000-0000-0000-000000000618'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Lalapan Segar', 'lalapan-segar-timun-kol-2026', 4000, 1500, 'Lalapan segar (timun, kol, tomat)', 0, 'active')
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
-- LINK MODIFIERS TO PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Link "Level Pedas" to all Makanan Utama
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

-- Link "Suhu Minuman" to Minuman (except Air Mineral)
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, '00000000-0000-0000-0000-000000000402'::uuid
FROM products p
WHERE p.category_id = '00000000-0000-0000-0000-000000000302'::uuid
  AND p.slug NOT LIKE '%air-mineral%'
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ADD SETTINGS
-- ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_outlet_id UUID;
BEGIN
  SELECT id INTO v_outlet_id FROM outlets WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1;
  
  INSERT INTO settings (id, tenant_id, outlet_id, key, value, type) VALUES
    ('00000000-0000-0000-0000-000000000701'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'receipt_restaurant_name', 'Nashty Hot Chicken', 'string'),
    ('00000000-0000-0000-0000-000000000702'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'receipt_address', 'Galaxy Mall Lt. 3, Surabaya', 'string'),
    ('00000000-0000-0000-0000-000000000703'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'receipt_phone', '031-8123456', 'string'),
    ('00000000-0000-0000-0000-000000000704'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'receipt_footer', 'IT AIN''T TASTY IF IT AIN''T NASHTY', 'string'),
    ('00000000-0000-0000-0000-000000000705'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'tax_percentage', '11', 'number'),
    ('00000000-0000-0000-0000-000000000706'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, v_outlet_id, 'service_percentage', '5', 'number')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- DONE! All data fixed and completed with actual outlet_id.
-- ═══════════════════════════════════════════════════════════════════
