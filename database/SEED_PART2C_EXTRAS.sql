-- ============================================================================
-- NASHTY OS - PART 2C: SAUCES, DESSERTS, MODIFIERS, PAYMENT METHODS
-- ============================================================================

BEGIN;

-- SAUCES (8 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('p1000006-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Sambal Matah', 'sambal-matah', 'Sambal matah khas Bali', 3000, 1000, 'SC-001', '/images/products/sambal-matah.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Sambal Ijo', 'sambal-ijo', 'Sambal hijau pedas', 3000, 1000, 'SC-002', '/images/products/sambal-ijo.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'BBQ Sauce', 'bbq-sauce', 'Saus BBQ smoky', 3000, 1000, 'SC-003', '/images/products/bbq-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Teriyaki Sauce', 'teriyaki-sauce', 'Saus teriyaki manis', 3000, 1000, 'SC-004', '/images/products/teriyaki-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Mayonnaise', 'mayonnaise', 'Mayo premium', 3000, 1000, 'SC-005', '/images/products/mayo.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Chili Sauce', 'chili-sauce', 'Saus cabai botolan', 2000, 800, 'SC-006', '/images/products/chili-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Cheese Sauce', 'cheese-sauce', 'Saus keju creamy', 4000, 1500, 'SC-007', '/images/products/cheese-sauce.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000006-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000006'::uuid, 'Thai Sweet Chili', 'thai-sweet-chili', 'Saus thai manis pedas', 3000, 1000, 'SC-008', '/images/products/thai-chili.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- DESSERTS (10 items)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, stock_qty, status, created_at, updated_at)
VALUES
  ('p1000007-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Vanilla Ice Cream', 'vanilla-ice-cream', 'Es krim vanilla 1 scoop', 12000, 5000, 'DS-001', '/images/products/vanilla-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Chocolate Ice Cream', 'chocolate-ice-cream', 'Es krim coklat 1 scoop', 12000, 5000, 'DS-002', '/images/products/choco-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Strawberry Ice Cream', 'strawberry-ice-cream', 'Es krim strawberry 1 scoop', 13000, 5500, 'DS-003', '/images/products/strawberry-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Ice Cream Sundae', 'ice-cream-sundae', 'Sundae dengan topping lengkap', 18000, 8000, 'DS-004', '/images/products/sundae.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Chocolate Lava Cake', 'choco-lava-cake', 'Lava cake coklat hangat', 25000, 12000, 'DS-005', '/images/products/lava-cake.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Brownies Ice Cream', 'brownies-ice-cream', 'Brownies dengan ice cream', 22000, 10000, 'DS-006', '/images/products/brownies-ic.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Apple Pie', 'apple-pie', 'Pie apel hangat', 20000, 9000, 'DS-007', '/images/products/apple-pie.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Churros (5 pcs)', 'churros', 'Churros dengan chocolate sauce', 18000, 8000, 'DS-008', '/images/products/churros.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Banana Split', 'banana-split', 'Es krim banana split classic', 23000, 11000, 'DS-009', '/images/products/banana-split.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('p1000007-0000-0000-0000-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'c1000000-0000-0000-0000-000000000007'::uuid, 'Tiramisu', 'tiramisu', 'Tiramisu cake premium', 28000, 13000, 'DS-010', '/images/products/tiramisu.jpg', 999, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- MODIFIER GROUPS
INSERT INTO modifier_groups (id, tenant_id, name, description, type, required, min_select, max_select, display_order, status, created_at, updated_at)
VALUES
  ('mg000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Level Kepedasan', 'Pilih level kepedasan ayam', 'single', 1, 1, 1, 1, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('mg000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Extra Topping', 'Tambahan topping', 'multiple', 0, 0, 5, 2, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('mg000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Ukuran Minuman', 'Pilih ukuran minuman', 'single', 1, 1, 1, 3, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('mg000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Level Gula', 'Tingkat kemanisan minuman', 'single', 0, 0, 1, 4, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('mg000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Es Batu', 'Jumlah es', 'single', 0, 0, 1, 5, 'active', NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;

-- MODIFIER OPTIONS
INSERT INTO modifier_options (id, group_id, name, price_adjustment, display_order, status, created_at)
VALUES
  -- Level Kepedasan
  ('mo000001-0000-0000-0000-000000000001'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Original (No Spicy)', 0, 1, 'active', NOW()),
  ('mo000001-0000-0000-0000-000000000002'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Level 1 (Mild)', 0, 2, 'active', NOW()),
  ('mo000001-0000-0000-0000-000000000003'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Level 2', 0, 3, 'active', NOW()),
  ('mo000001-0000-0000-0000-000000000004'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Level 3', 0, 4, 'active', NOW()),
  ('mo000001-0000-0000-0000-000000000005'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Level 4 (Hot)', 1000, 5, 'active', NOW()),
  ('mo000001-0000-0000-0000-000000000006'::uuid, 'mg000001-0000-0000-0000-000000000001'::uuid, 'Level 5 (Very Hot)', 1000, 6, 'active', NOW()),
  
  -- Extra Topping
  ('mo000002-0000-0000-0000-000000000001'::uuid, 'mg000001-0000-0000-0000-000000000002'::uuid, 'Extra Cheese', 5000, 1, 'active', NOW()),
  ('mo000002-0000-0000-0000-000000000002'::uuid, 'mg000001-0000-0000-0000-000000000002'::uuid, 'Extra Chicken', 10000, 2, 'active', NOW()),
  ('mo000002-0000-0000-0000-000000000003'::uuid, 'mg000001-0000-0000-0000-000000000002'::uuid, 'Extra Bacon', 7000, 3, 'active', NOW()),
  ('mo000002-0000-0000-0000-000000000004'::uuid, 'mg000001-0000-0000-0000-000000000002'::uuid, 'Extra Egg', 5000, 4, 'active', NOW()),
  ('mo000002-0000-0000-0000-000000000005'::uuid, 'mg000001-0000-0000-0000-000000000002'::uuid, 'Extra Sauce', 3000, 5, 'active', NOW()),
  
  -- Ukuran Minuman
  ('mo000003-0000-0000-0000-000000000001'::uuid, 'mg000001-0000-0000-0000-000000000003'::uuid, 'Regular', 0, 1, 'active', NOW()),
  ('mo000003-0000-0000-0000-000000000002'::uuid, 'mg000001-0000-0000-0000-000000000003'::uuid, 'Large', 3000, 2, 'active', NOW()),
  
  -- Level Gula
  ('mo000004-0000-0000-0000-000000000001'::uuid, 'mg000001-0000-0000-0000-000000000004'::uuid, 'Normal', 0, 1, 'active', NOW()),
  ('mo000004-0000-0000-0000-000000000002'::uuid, 'mg000001-0000-0000-0000-000000000004'::uuid, 'Less Sugar', 0, 2, 'active', NOW()),
  ('mo000004-0000-0000-0000-000000000003'::uuid, 'mg000001-0000-0000-0000-000000000004'::uuid, 'No Sugar', 0, 3, 'active', NOW()),
  
  -- Es Batu
  ('mo000005-0000-0000-0000-000000000001'::uuid, 'mg000001-0000-0000-0000-000000000005'::uuid, 'Normal Ice', 0, 1, 'active', NOW()),
  ('mo000005-0000-0000-0000-000000000002'::uuid, 'mg000001-0000-0000-0000-000000000005'::uuid, 'Less Ice', 0, 2, 'active', NOW()),
  ('mo000005-0000-0000-0000-000000000003'::uuid, 'mg000001-0000-0000-0000-000000000005'::uuid, 'No Ice', 0, 3, 'active', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_adjustment = EXCLUDED.price_adjustment;

-- PAYMENT METHODS
INSERT INTO payment_methods (id, tenant_id, name, type, icon, is_active, display_order, created_at, updated_at)
VALUES
  ('pm000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Cash', 'cash', '💵', true, 1, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'QRIS', 'qris', '📱', true, 2, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'GoPay', 'ewallet', '🟢', true, 3, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'OVO', 'ewallet', '🟣', true, 4, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'ShopeePay', 'ewallet', '🟠', true, 5, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Debit Card', 'card', '💳', true, 6, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Credit Card', 'card', '💳', true, 7, NOW() - INTERVAL '180 days', NOW()),
  ('pm000001-0000-0000-0000-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, 'Bank Transfer', 'transfer', '🏦', true, 8, NOW() - INTERVAL '180 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;

-- STATIONS (KDS)
INSERT INTO stations (id, tenant_id, outlet_id, name, description, type, display_order, status, created_at, updated_at)
VALUES
  ('st000001-0000-0000-0000-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Main Kitchen', 'Dapur utama untuk hot chicken', 'kitchen', 1, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('st000001-0000-0000-0000-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Beverage Station', 'Stasiun minuman', 'beverage', 2, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('st000001-0000-0000-0000-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid, 'Packing Station', 'Stasiun packing dan assembly', 'packing', 3, 'active', NOW() - INTERVAL '180 days', NOW()),
  ('st000001-0000-0000-0000-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, 'Main Kitchen', 'Dapur utama Pakuwon', 'kitchen', 1, 'active', NOW() - INTERVAL '120 days', NOW()),
  ('st000001-0000-0000-0000-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid, '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid, 'Beverage Station', 'Stasiun minuman Pakuwon', 'beverage', 2, 'active', NOW() - INTERVAL '120 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;

COMMIT;

-- ============================================================================
-- Summary PART 2C:
-- ✅ 8 Sauces
-- ✅ 10 Desserts
-- ✅ 5 Modifier Groups
-- ✅ 18 Modifier Options
-- ✅ 8 Payment Methods
-- ✅ 5 Stations (KDS)
-- Total Products sejauh ini: 15+12+10+25+15+8+10 = 95 products
-- ============================================================================
