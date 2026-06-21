-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - INITIAL DATA POPULATION FOR PRODUCTION
-- Target: Galaxy Mall Restaurant Launch (June 22, 2026)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────
-- 1. CREATE DEFAULT TENANT
-- ───────────────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, status, settings) 
VALUES (
  'default-tenant',
  'Nashty Hot Chicken',
  'active',
  jsonb_build_object(
    'tax_percentage', 11,
    'service_percentage', 5,
    'currency', 'IDR',
    'rounding', 100,
    'business_type', 'restaurant'
  )
) ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    settings = EXCLUDED.settings;

-- ───────────────────────────────────────────────────────────────────
-- 2. CREATE OUTLET (Galaxy Mall)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO outlets (tenant_id, name, address, city, phone, status) 
VALUES (
  'default-tenant',
  'Galaxy Mall',
  'Jl. Galaxy Raya No.1, Lt. 3',
  'Surabaya',
  '031-8123456',
  'open'
) ON CONFLICT DO NOTHING
RETURNING id;

-- Get outlet_id for next inserts (assume it's 1 for first outlet)
DO $$
DECLARE
  v_outlet_id INTEGER;
BEGIN
  SELECT id INTO v_outlet_id FROM outlets WHERE tenant_id = 'default-tenant' LIMIT 1;
  
  IF v_outlet_id IS NULL THEN
    v_outlet_id := 1;
  END IF;
  
  -- Store in temp variable for use in subsequent statements
  CREATE TEMP TABLE IF NOT EXISTS temp_vars (outlet_id INTEGER);
  DELETE FROM temp_vars;
  INSERT INTO temp_vars VALUES (v_outlet_id);
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 3. CREATE USERS (Admin + Staff)
-- ───────────────────────────────────────────────────────────────────

-- Super Admin (Username/Password login)
-- Password: nashty1111 (bcrypt hash)
INSERT INTO users (tenant_id, outlet_id, name, username, password_hash, role, active) 
VALUES (
  'default-tenant',
  (SELECT outlet_id FROM temp_vars),
  'Super Admin',
  'admin1',
  '$2a$10$rK8h5xJZQXZ7yGJMv5K5g.Y2YmPvXQxJ8K5K8K8K8K8K8K8K8K8K8O',
  'admin',
  true
) ON CONFLICT (tenant_id, username) DO UPDATE 
SET active = true;

-- Owner (PIN: 9999)
INSERT INTO users (tenant_id, outlet_id, name, pin, role, active) 
VALUES (
  'default-tenant',
  (SELECT outlet_id FROM temp_vars),
  'Bagoes Widhiatama',
  '9999',
  'owner',
  true
) ON CONFLICT (tenant_id, pin) WHERE pin IS NOT NULL DO UPDATE 
SET active = true;

-- Manager (PIN: 1212)
INSERT INTO users (tenant_id, outlet_id, name, pin, role, active) 
VALUES (
  'default-tenant',
  (SELECT outlet_id FROM temp_vars),
  'Ahmad Fauzi',
  '1212',
  'manager',
  true
) ON CONFLICT (tenant_id, pin) WHERE pin IS NOT NULL DO UPDATE 
SET active = true;

-- Kasir 1 (PIN: 8888)
INSERT INTO users (tenant_id, outlet_id, name, pin, role, active) 
VALUES (
  'default-tenant',
  (SELECT outlet_id FROM temp_vars),
  'Citra Dewi',
  '8888',
  'cashier',
  true
) ON CONFLICT (tenant_id, pin) WHERE pin IS NOT NULL DO UPDATE 
SET active = true;

-- Kasir 2 (PIN: 7777)
INSERT INTO users (tenant_id, outlet_id, name, pin, role, active) 
VALUES (
  'default-tenant',
  (SELECT outlet_id FROM temp_vars),
  'Budi Santoso',
  '7777',
  'cashier',
  true
) ON CONFLICT (tenant_id, pin) WHERE pin IS NOT NULL DO UPDATE 
SET active = true;

-- ───────────────────────────────────────────────────────────────────
-- 4. CREATE CATEGORIES
-- ───────────────────────────────────────────────────────────────────
INSERT INTO categories (tenant_id, name, display_order, icon) VALUES
  ('default-tenant', 'Makanan Utama', 1, '🍗'),
  ('default-tenant', 'Minuman', 2, '🥤'),
  ('default-tenant', 'Camilan', 3, '🍟'),
  ('default-tenant', 'Dessert', 4, '🍨'),
  ('default-tenant', 'Add On', 5, '🍚')
ON CONFLICT (tenant_id, name) DO UPDATE 
SET display_order = EXCLUDED.display_order,
    icon = EXCLUDED.icon;

-- ───────────────────────────────────────────────────────────────────
-- 5. CREATE MODIFIER GROUPS
-- ───────────────────────────────────────────────────────────────────
INSERT INTO modifier_groups (tenant_id, name, selection_type, required, min_selection, max_selection) VALUES
  ('default-tenant', 'Level Pedas', 'single', true, 1, 1),
  ('default-tenant', 'Suhu Minuman', 'single', true, 1, 1),
  ('default-tenant', 'Tambahan', 'multiple', false, 0, 3)
ON CONFLICT (tenant_id, name) DO UPDATE 
SET selection_type = EXCLUDED.selection_type,
    required = EXCLUDED.required;

-- ───────────────────────────────────────────────────────────────────
-- 6. CREATE MODIFIERS
-- ───────────────────────────────────────────────────────────────────

-- Level Pedas modifiers
INSERT INTO modifiers (tenant_id, modifier_group_id, name, price) 
SELECT 
  'default-tenant',
  mg.id,
  mod.name,
  mod.price
FROM modifier_groups mg,
LATERAL (VALUES
  ('Original', 0),
  ('Pedas Sedang', 0),
  ('Pedas Extra', 0)
) AS mod(name, price)
WHERE mg.tenant_id = 'default-tenant' AND mg.name = 'Level Pedas'
ON CONFLICT (tenant_id, modifier_group_id, name) DO UPDATE 
SET price = EXCLUDED.price;

-- Suhu Minuman modifiers
INSERT INTO modifiers (tenant_id, modifier_group_id, name, price) 
SELECT 
  'default-tenant',
  mg.id,
  mod.name,
  mod.price
FROM modifier_groups mg,
LATERAL (VALUES
  ('Dingin', 0),
  ('Hangat', 0)
) AS mod(name, price)
WHERE mg.tenant_id = 'default-tenant' AND mg.name = 'Suhu Minuman'
ON CONFLICT (tenant_id, modifier_group_id, name) DO UPDATE 
SET price = EXCLUDED.price;

-- Tambahan modifiers
INSERT INTO modifiers (tenant_id, modifier_group_id, name, price) 
SELECT 
  'default-tenant',
  mg.id,
  mod.name,
  mod.price
FROM modifier_groups mg,
LATERAL (VALUES
  ('Nasi Putih', 6000),
  ('Extra Sambal', 3000),
  ('Lalapan', 4000)
) AS mod(name, price)
WHERE mg.tenant_id = 'default-tenant' AND mg.name = 'Tambahan'
ON CONFLICT (tenant_id, modifier_group_id, name) DO UPDATE 
SET price = EXCLUDED.price;

-- ───────────────────────────────────────────────────────────────────
-- 7. CREATE PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Makanan Utama
INSERT INTO products (tenant_id, category_id, name, price, cost, description, status, stock_tracking) 
SELECT 
  'default-tenant',
  c.id,
  p.name,
  p.price,
  p.cost,
  p.description,
  'active',
  false
FROM categories c,
LATERAL (VALUES
  ('Ayam Bakar Madu', 55000, 28000, 'Ayam bakar dengan saus madu special'),
  ('Nasi Goreng Spesial', 35000, 18000, 'Nasi goreng dengan ayam dan telur'),
  ('Rawon Spesial', 42000, 22000, 'Rawon daging sapi dengan bumbu khas'),
  ('Sop Buntut', 65000, 35000, 'Sop buntut sapi dengan sayuran segar'),
  ('Sate Ayam 10pcs', 45000, 23000, 'Sate ayam dengan bumbu kacang')
) AS p(name, price, cost, description)
WHERE c.tenant_id = 'default-tenant' AND c.name = 'Makanan Utama'
ON CONFLICT (tenant_id, category_id, name) DO UPDATE 
SET price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;

-- Minuman
INSERT INTO products (tenant_id, category_id, name, price, cost, description, status, stock_tracking) 
SELECT 
  'default-tenant',
  c.id,
  p.name,
  p.price,
  p.cost,
  p.description,
  'active',
  false
FROM categories c,
LATERAL (VALUES
  ('Kopi Susu Aren', 22000, 8000, 'Kopi susu dengan gula aren premium'),
  ('Es Teh Manis', 8000, 2000, 'Es teh manis segar'),
  ('Jus Alpukat', 18000, 7000, 'Jus alpukat segar tanpa gula'),
  ('Jus Jeruk', 15000, 6000, 'Jus jeruk peras segar'),
  ('Air Mineral', 5000, 2000, 'Air mineral dingin 600ml')
) AS p(name, price, cost, description)
WHERE c.tenant_id = 'default-tenant' AND c.name = 'Minuman'
ON CONFLICT (tenant_id, category_id, name) DO UPDATE 
SET price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;

-- Camilan
INSERT INTO products (tenant_id, category_id, name, price, cost, description, status, stock_tracking) 
SELECT 
  'default-tenant',
  c.id,
  p.name,
  p.price,
  p.cost,
  p.description,
  'active',
  false
FROM categories c,
LATERAL (VALUES
  ('French Fries', 22000, 8000, 'Kentang goreng renyah dengan saus'),
  ('Onion Rings', 18000, 7000, 'Bawang bombay goreng crispy'),
  ('Chicken Wings 6pcs', 35000, 16000, 'Sayap ayam goreng crispy'),
  ('Tahu Gejrot', 12000, 4000, 'Tahu goreng dengan kuah pedas manis')
) AS p(name, price, cost, description)
WHERE c.tenant_id = 'default-tenant' AND c.name = 'Camilan'
ON CONFLICT (tenant_id, category_id, name) DO UPDATE 
SET price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;

-- Dessert
INSERT INTO products (tenant_id, category_id, name, price, cost, description, status, stock_tracking) 
SELECT 
  'default-tenant',
  c.id,
  p.name,
  p.price,
  p.cost,
  p.description,
  'active',
  false
FROM categories c,
LATERAL (VALUES
  ('Es Krim Cokelat', 18000, 6000, 'Es krim cokelat premium 2 scoop'),
  ('Pisang Goreng', 15000, 5000, 'Pisang goreng dengan topping'),
  ('Puding Cokelat', 12000, 4000, 'Puding cokelat dengan vla')
) AS p(name, price, cost, description)
WHERE c.tenant_id = 'default-tenant' AND c.name = 'Dessert'
ON CONFLICT (tenant_id, category_id, name) DO UPDATE 
SET price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;

-- Add On
INSERT INTO products (tenant_id, category_id, name, price, cost, description, status, stock_tracking) 
SELECT 
  'default-tenant',
  c.id,
  p.name,
  p.price,
  p.cost,
  p.description,
  'active',
  false
FROM categories c,
LATERAL (VALUES
  ('Nasi Putih', 6000, 2000, 'Nasi putih porsi reguler'),
  ('Extra Sambal', 3000, 1000, 'Sambal pedas extra'),
  ('Lalapan', 4000, 1500, 'Lalapan segar (timun, kol, tomat)')
) AS p(name, price, cost, description)
WHERE c.tenant_id = 'default-tenant' AND c.name = 'Add On'
ON CONFLICT (tenant_id, category_id, name) DO UPDATE 
SET price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;

-- ───────────────────────────────────────────────────────────────────
-- 8. LINK MODIFIERS TO PRODUCTS
-- ───────────────────────────────────────────────────────────────────

-- Link "Level Pedas" to Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, mg.id
FROM products p
JOIN categories c ON p.category_id = c.id AND c.tenant_id = p.tenant_id
CROSS JOIN modifier_groups mg
WHERE p.tenant_id = 'default-tenant'
  AND c.name = 'Makanan Utama'
  AND mg.tenant_id = 'default-tenant'
  AND mg.name = 'Level Pedas'
ON CONFLICT DO NOTHING;

-- Link "Suhu Minuman" to Minuman
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, mg.id
FROM products p
JOIN categories c ON p.category_id = c.id AND c.tenant_id = p.tenant_id
CROSS JOIN modifier_groups mg
WHERE p.tenant_id = 'default-tenant'
  AND c.name = 'Minuman'
  AND mg.tenant_id = 'default-tenant'
  AND mg.name = 'Suhu Minuman'
ON CONFLICT DO NOTHING;

-- Link "Tambahan" to Makanan Utama
INSERT INTO product_modifiers (product_id, modifier_group_id)
SELECT p.id, mg.id
FROM products p
JOIN categories c ON p.category_id = c.id AND c.tenant_id = p.tenant_id
CROSS JOIN modifier_groups mg
WHERE p.tenant_id = 'default-tenant'
  AND c.name = 'Makanan Utama'
  AND mg.tenant_id = 'default-tenant'
  AND mg.name = 'Tambahan'
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- 9. CREATE OUTLET SETTINGS
-- ───────────────────────────────────────────────────────────────────
INSERT INTO outlet_settings (outlet_id, setting_key, setting_value)
SELECT 
  (SELECT outlet_id FROM temp_vars),
  s.key,
  s.value
FROM (VALUES
  ('receipt_restaurant_name', '"Nashty Hot Chicken"'),
  ('receipt_address', '"Galaxy Mall Lt. 3, Surabaya"'),
  ('receipt_phone', '"031-8123456"'),
  ('receipt_footer', '"IT AIN''T TASTY IF IT AIN''T NASHTY"'),
  ('receipt_copies', '2'),
  ('receipt_show_logo', 'true'),
  ('tax_percentage', '11'),
  ('service_percentage', '5'),
  ('rounding_enabled', 'true'),
  ('rounding_value', '100'),
  ('payment_methods', '["Tunai","Transfer","QRIS","BCA","Debit","GoFood","GrabFood","ShopeeFood"]'),
  ('default_table_prefix', '"T"'),
  ('auto_print_receipt', 'true'),
  ('customer_display_enabled', 'false'),
  ('kds_alert_time', '600'),
  ('kds_urgent_time', '1200')
) AS s(key, value)
ON CONFLICT (outlet_id, setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value;

-- ───────────────────────────────────────────────────────────────────
-- 10. CREATE SAMPLE FAVORITES (For POS)
-- ───────────────────────────────────────────────────────────────────

-- Get first user (admin) for favorites
DO $$
DECLARE
  v_user_id INTEGER;
  v_product_ids INTEGER[];
BEGIN
  -- Get admin user id
  SELECT id INTO v_user_id FROM users WHERE tenant_id = 'default-tenant' AND role = 'admin' LIMIT 1;
  
  -- Get top 12 products for favorites
  SELECT ARRAY_AGG(id ORDER BY id LIMIT 12) INTO v_product_ids 
  FROM products 
  WHERE tenant_id = 'default-tenant' AND status = 'active';
  
  -- Insert favorites
  IF v_user_id IS NOT NULL AND v_product_ids IS NOT NULL THEN
    FOR i IN 1..LEAST(12, array_length(v_product_ids, 1)) LOOP
      INSERT INTO favorites (user_id, product_id, fkey_position)
      VALUES (v_user_id, v_product_ids[i], i)
      ON CONFLICT (user_id, fkey_position) DO UPDATE
      SET product_id = EXCLUDED.product_id;
    END LOOP;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 11. VERIFICATION QUERIES
-- ───────────────────────────────────────────────────────────────────

-- Summary of created data
DO $$
DECLARE
  v_users_count INTEGER;
  v_categories_count INTEGER;
  v_products_count INTEGER;
  v_modifiers_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users_count FROM users WHERE tenant_id = 'default-tenant';
  SELECT COUNT(*) INTO v_categories_count FROM categories WHERE tenant_id = 'default-tenant';
  SELECT COUNT(*) INTO v_products_count FROM products WHERE tenant_id = 'default-tenant';
  SELECT COUNT(*) INTO v_modifiers_count FROM modifiers WHERE tenant_id = 'default-tenant';
  
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'INITIAL DATA POPULATION COMPLETE ✓';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Users created: %', v_users_count;
  RAISE NOTICE 'Categories created: %', v_categories_count;
  RAISE NOTICE 'Products created: %', v_products_count;
  RAISE NOTICE 'Modifiers created: %', v_modifiers_count;
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- END OF INITIAL DATA SCRIPT
-- ═══════════════════════════════════════════════════════════════════
