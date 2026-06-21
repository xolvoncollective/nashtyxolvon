-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - Final Fix Using Existing Data IDs
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- PART 1: Fix Users with Actual Outlet ID
-- ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_outlet_id UUID;
BEGIN
  -- Get the actual outlet ID
  SELECT id INTO v_outlet_id FROM outlets WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1;
  
  -- Fix existing users to use correct outlet_id
  UPDATE users SET outlet_id = v_outlet_id 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Fix roles to match schema
  UPDATE users SET role = 'owner'
  WHERE pin IN ('0000', '9999') AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  UPDATE users SET role = 'cashier'
  WHERE pin IN ('8888') AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Add missing users if they don't exist
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
  ON CONFLICT (id) DO UPDATE SET outlet_id = v_outlet_id, role = 'cashier';
  
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
  ON CONFLICT (id) DO UPDATE SET outlet_id = v_outlet_id, role = 'kitchen';
  
  RAISE NOTICE 'Users fixed with outlet_id: %', v_outlet_id;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- PART 2: Add Missing Categories (use different IDs to avoid conflicts)
-- ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Add Camilan if not exists
  IF NOT EXISTS (SELECT 1 FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Camilan') THEN
    INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'Camilan', 'camilan', '🍟', 3, 'active');
  END IF;
  
  -- Add Dessert if not exists
  IF NOT EXISTS (SELECT 1 FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Dessert') THEN
    INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'Dessert', 'dessert', '🍨', 4, 'active');
  END IF;
  
  -- Add Add On if not exists
  IF NOT EXISTS (SELECT 1 FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Add On') THEN
    INSERT INTO categories (id, tenant_id, name, slug, icon, display_order, status) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, 'Add On', 'add-on', '🍚', 5, 'active');
  END IF;
  
  RAISE NOTICE 'Categories completed';
END $$;

-- ───────────────────────────────────────────────────────────────────
-- PART 3: Add Products Using Actual Category IDs
-- ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_cat_makanan UUID;
  v_cat_minuman UUID;
  v_cat_camilan UUID;
  v_cat_dessert UUID;
  v_cat_addon UUID;
BEGIN
  -- Get actual category IDs
  SELECT id INTO v_cat_makanan FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name LIKE '%Makanan%' LIMIT 1;
  SELECT id INTO v_cat_minuman FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name LIKE '%Minuman%' LIMIT 1;
  SELECT id INTO v_cat_camilan FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Camilan' LIMIT 1;
  SELECT id INTO v_cat_dessert FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Dessert' LIMIT 1;
  SELECT id INTO v_cat_addon FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'Add On' LIMIT 1;
  
  -- Add Makanan Utama products
  IF v_cat_makanan IS NOT NULL THEN
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) 
    SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, v_cat_makanan, prod.name, prod.slug, prod.price, prod.cost, 1, 'active'
    FROM (VALUES
      ('Rawon Spesial', 'rawon-spesial-2026', 42000, 22000),
      ('Sop Buntut', 'sop-buntut-2026', 65000, 35000),
      ('Sate Ayam 10pcs', 'sate-ayam-2026', 45000, 23000)
    ) AS prod(name, slug, price, cost)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = prod.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add Minuman products
  IF v_cat_minuman IS NOT NULL THEN
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) 
    SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, v_cat_minuman, prod.name, prod.slug, prod.price, prod.cost, 1, 'active'
    FROM (VALUES
      ('Kopi Susu Aren', 'kopi-susu-aren-2026', 22000, 8000),
      ('Es Teh Manis', 'es-teh-manis-2026', 8000, 2000),
      ('Jus Alpukat', 'jus-alpukat-2026', 18000, 7000),
      ('Jus Jeruk', 'jus-jeruk-2026', 15000, 6000),
      ('Air Mineral', 'air-mineral-2026', 5000, 2000)
    ) AS prod(name, slug, price, cost)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = prod.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add Camilan products
  IF v_cat_camilan IS NOT NULL THEN
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) 
    SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, v_cat_camilan, prod.name, prod.slug, prod.price, prod.cost, 0, 'active'
    FROM (VALUES
      ('French Fries', 'french-fries-2026', 22000, 8000),
      ('Onion Rings', 'onion-rings-2026', 18000, 7000),
      ('Chicken Wings 6pcs', 'chicken-wings-2026', 35000, 16000)
    ) AS prod(name, slug, price, cost)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = prod.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add Dessert products
  IF v_cat_dessert IS NOT NULL THEN
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) 
    SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, v_cat_dessert, prod.name, prod.slug, prod.price, prod.cost, 0, 'active'
    FROM (VALUES
      ('Es Krim Cokelat', 'es-krim-cokelat-2026', 18000, 6000),
      ('Pisang Goreng', 'pisang-goreng-2026', 15000, 5000)
    ) AS prod(name, slug, price, cost)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = prod.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add Add On products
  IF v_cat_addon IS NOT NULL THEN
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, status) 
    SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::uuid, v_cat_addon, prod.name, prod.slug, prod.price, prod.cost, 0, 'active'
    FROM (VALUES
      ('Nasi Putih', 'nasi-putih-2026', 6000, 2000),
      ('Extra Sambal', 'extra-sambal-2026', 3000, 1000),
      ('Lalapan', 'lalapan-2026', 4000, 1500)
    ) AS prod(name, slug, price, cost)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = prod.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Products completed';
END $$;

-- ───────────────────────────────────────────────────────────────────
-- PART 4: Add Modifier Groups
-- ───────────────────────────────────────────────────────────────────
INSERT INTO modifier_groups (id, tenant_id, name, type, required, min_select, max_select) VALUES
  ('00000000-0000-0000-0000-000000000401'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Level Pedas', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000402'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Suhu Minuman', 'single', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000403'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Tambahan', 'multiple', 0, 0, 3)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- PART 5: Add Modifier Options
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
-- PART 6: Link Modifiers to Products
-- ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_cat_makanan UUID;
  v_cat_minuman UUID;
BEGIN
  -- Get actual category IDs
  SELECT id INTO v_cat_makanan FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name LIKE '%Makanan%' LIMIT 1;
  SELECT id INTO v_cat_minuman FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND name LIKE '%Minuman%' LIMIT 1;
  
  -- Link "Level Pedas" to all Makanan Utama
  IF v_cat_makanan IS NOT NULL THEN
    INSERT INTO product_modifiers (product_id, modifier_group_id)
    SELECT p.id, '00000000-0000-0000-0000-000000000401'::uuid
    FROM products p
    WHERE p.category_id = v_cat_makanan
    ON CONFLICT DO NOTHING;
    
    -- Link "Tambahan" to all Makanan Utama
    INSERT INTO product_modifiers (product_id, modifier_group_id)
    SELECT p.id, '00000000-0000-0000-0000-000000000403'::uuid
    FROM products p
    WHERE p.category_id = v_cat_makanan
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Link "Suhu Minuman" to Minuman
  IF v_cat_minuman IS NOT NULL THEN
    INSERT INTO product_modifiers (product_id, modifier_group_id)
    SELECT p.id, '00000000-0000-0000-0000-000000000402'::uuid
    FROM products p
    WHERE p.category_id = v_cat_minuman
      AND p.name NOT LIKE '%Air Mineral%'
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Modifiers linked to products';
END $$;

-- ───────────────────────────────────────────────────────────────────
-- PART 7: Add Settings
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
  
  RAISE NOTICE 'Settings completed with outlet_id: %', v_outlet_id;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'DATA POPULATION COMPLETE!';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Users: % (Fixed roles)', (SELECT COUNT(*) FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
  RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
  RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
  RAISE NOTICE 'Modifier Groups: %', (SELECT COUNT(*) FROM modifier_groups WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
  RAISE NOTICE 'Modifier Options: %', (SELECT COUNT(*) FROM modifier_options);
  RAISE NOTICE 'Settings: %', (SELECT COUNT(*) FROM settings WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'READY FOR TESTING!';
  RAISE NOTICE 'Test login with PIN: 9999 (Owner) or 8888 (Kasir)';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════════
