-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - Continue Data Population (Skip what exists)
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- MODIFIER GROUPS (if not exists)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO modifier_groups (id, tenant_id, name, type, required, min_select, max_select) VALUES
  ('00000000-0000-0000-0000-000000000401'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Level Pedas', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000402'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Suhu Minuman', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000403'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Tambahan', 'multiple', 0, 0, 3)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- MODIFIER OPTIONS
-- ───────────────────────────────────────────────────────────────────

-- Level Pedas options
INSERT INTO modifier_options (id, group_id, name, price_adjustment) VALUES
  ('00000000-0000-0000-0000-000000000501'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Original', 0),
  ('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Sedang', 0),
  ('00000000-0000-0000-0000-000000000503'::uuid, '00000000-0000-0000-0000-000000000401'::uuid, 'Pedas Extra', 0)
ON CONFLICT (id) DO NOTHING;

-- Suhu Minuman options
INSERT INTO modifier_options (id, group_id, name, price_adjustment) VALUES
  ('00000000-0000-0000-0000-000000000504'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Dingin', 0),
  ('00000000-0000-0000-0000-000000000505'::uuid, '00000000-0000-0000-0000-000000000402'::uuid, 'Hangat', 0)
ON CONFLICT (id) DO NOTHING;

-- Tambahan options
INSERT INTO modifier_options (id, group_id, name, price_adjustment) VALUES
  ('00000000-0000-0000-0000-000000000506'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Nasi Putih', 6000),
  ('00000000-0000-0000-0000-000000000507'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Extra Sambal', 3000),
  ('00000000-0000-0000-0000-000000000508'::uuid, '00000000-0000-0000-0000-000000000403'::uuid, 'Lalapan', 4000)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Makanan Utama
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000601'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Ayam Bakar Madu', 'ayam-bakar-madu', 55000, 28000, 'Ayam bakar dengan saus madu special', 1, 'active'),
  ('00000000-0000-0000-0000-000000000602'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Nasi Goreng Spesial', 'nasi-goreng-spesial', 35000, 18000, 'Nasi goreng dengan ayam dan telur', 1, 'active'),
  ('00000000-0000-0000-0000-000000000603'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Rawon Spesial', 'rawon-spesial', 42000, 22000, 'Rawon daging sapi dengan bumbu khas', 1, 'active'),
  ('00000000-0000-0000-0000-000000000604'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sop Buntut', 'sop-buntut', 65000, 35000, 'Sop buntut sapi dengan sayuran segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000605'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 'Sate Ayam 10pcs', 'sate-ayam-10pcs', 45000, 23000, 'Sate ayam dengan bumbu kacang', 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Minuman
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000606'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Kopi Susu Aren', 'kopi-susu-aren', 22000, 8000, 'Kopi susu dengan gula aren premium', 1, 'active'),
  ('00000000-0000-0000-0000-000000000607'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Es Teh Manis', 'es-teh-manis', 8000, 2000, 'Es teh manis segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000608'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Alpukat', 'jus-alpukat', 18000, 7000, 'Jus alpukat segar tanpa gula', 1, 'active'),
  ('00000000-0000-0000-0000-000000000609'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Jus Jeruk', 'jus-jeruk', 15000, 6000, 'Jus jeruk peras segar', 1, 'active'),
  ('00000000-0000-0000-0000-000000000610'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000302'::uuid, 'Air Mineral', 'air-mineral', 5000, 2000, 'Air mineral dingin 600ml', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Camilan
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000611'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'French Fries', 'french-fries', 22000, 8000, 'Kentang goreng renyah dengan saus', 0, 'active'),
  ('00000000-0000-0000-0000-000000000612'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Onion Rings', 'onion-rings', 18000, 7000, 'Bawang bombay goreng crispy', 0, 'active'),
  ('00000000-0000-0000-0000-000000000613'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000303'::uuid, 'Chicken Wings 6pcs', 'chicken-wings-6pcs', 35000, 16000, 'Sayap ayam goreng crispy', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Dessert
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000614'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Es Krim Cokelat', 'es-krim-cokelat', 18000, 6000, 'Es krim cokelat premium 2 scoop', 0, 'active'),
  ('00000000-0000-0000-0000-000000000615'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000304'::uuid, 'Pisang Goreng', 'pisang-goreng', 15000, 5000, 'Pisang goreng dengan topping', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Add On
INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, description, has_modifiers, status) VALUES
  ('00000000-0000-0000-0000-000000000616'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Nasi Putih', 'nasi-putih', 6000, 2000, 'Nasi putih porsi reguler', 0, 'active'),
  ('00000000-0000-0000-0000-000000000617'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Extra Sambal', 'extra-sambal', 3000, 1000, 'Sambal pedas extra', 0, 'active'),
  ('00000000-0000-0000-0000-000000000618'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000305'::uuid, 'Lalapan', 'lalapan', 4000, 1500, 'Lalapan segar (timun, kol, tomat)', 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- LINK MODIFIERS TO PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Link "Level Pedas" to Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id) VALUES
  ('00000000-0000-0000-0000-000000000601'::uuid, '00000000-0000-0000-0000-000000000401'::uuid),
  ('00000000-0000-0000-0000-000000000602'::uuid, '00000000-0000-0000-0000-000000000401'::uuid),
  ('00000000-0000-0000-0000-000000000603'::uuid, '00000000-0000-0000-0000-000000000401'::uuid),
  ('00000000-0000-0000-0000-000000000604'::uuid, '00000000-0000-0000-0000-000000000401'::uuid),
  ('00000000-0000-0000-0000-000000000605'::uuid, '00000000-0000-0000-0000-000000000401'::uuid)
ON CONFLICT DO NOTHING;

-- Link "Tambahan" to Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id) VALUES
  ('00000000-0000-0000-0000-000000000601'::uuid, '00000000-0000-0000-0000-000000000403'::uuid),
  ('00000000-0000-0000-0000-000000000602'::uuid, '00000000-0000-0000-0000-000000000403'::uuid),
  ('00000000-0000-0000-0000-000000000603'::uuid, '00000000-0000-0000-0000-000000000403'::uuid),
  ('00000000-0000-0000-0000-000000000604'::uuid, '00000000-0000-0000-0000-000000000403'::uuid),
  ('00000000-0000-0000-0000-000000000605'::uuid, '00000000-0000-0000-0000-000000000403'::uuid)
ON CONFLICT DO NOTHING;

-- Link "Suhu Minuman" to Minuman (except Air Mineral)
INSERT INTO product_modifiers (product_id, modifier_group_id) VALUES
  ('00000000-0000-0000-0000-000000000606'::uuid, '00000000-0000-0000-0000-000000000402'::uuid),
  ('00000000-0000-0000-0000-000000000607'::uuid, '00000000-0000-0000-0000-000000000402'::uuid),
  ('00000000-0000-0000-0000-000000000608'::uuid, '00000000-0000-0000-0000-000000000402'::uuid),
  ('00000000-0000-0000-0000-000000000609'::uuid, '00000000-0000-0000-0000-000000000402'::uuid)
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- SETTINGS
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
-- DONE! Remaining data populated.
-- ═══════════════════════════════════════════════════════════════════
