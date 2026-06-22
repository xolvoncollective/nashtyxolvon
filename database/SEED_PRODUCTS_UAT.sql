-- SEED PRODUCTS FOR UAT TESTING
-- Tenant: b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab (Nashty)
-- This will create categories and products for testing

-- First, verify tenant exists
DO $$
DECLARE
    v_tenant_id uuid := 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
        RAISE EXCEPTION 'Tenant % not found', v_tenant_id;
    END IF;
END $$;

-- Insert Categories
INSERT INTO categories (id, tenant_id, name, slug, description, color, icon, display_order, status, created_at, updated_at)
VALUES
    ('cat-001', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Coffee', 'coffee', 'Hot and Cold Coffee', '#8B4513', 'coffee', 1, 'active', NOW(), NOW()),
    ('cat-002', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Tea', 'tea', 'Various Tea Selection', '#4B8B3B', 'leaf', 2, 'active', NOW(), NOW()),
    ('cat-003', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Food', 'food', 'Snacks and Meals', '#FF6B35', 'utensils', 3, 'active', NOW(), NOW()),
    ('cat-004', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Dessert', 'dessert', 'Sweet Treats', '#FF69B4', 'ice-cream', 4, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Coffee Category
INSERT INTO products (id, tenant_id, category_id, name, description, price, cost, sku, barcode, image_url, is_available, is_featured, stock_tracking, stock_quantity, low_stock_threshold, preparation_time, calories, allergens, tags, sort_order, created_at, updated_at)
VALUES
    ('prod-001', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-001', 'Americano', 'Classic black coffee', 25000, 5000, 'COF-AMR', '1001', NULL, true, true, false, 0, 0, 5, 5, NULL, ARRAY['hot', 'signature'], 1, NOW(), NOW()),
    ('prod-002', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-001', 'Cappuccino', 'Espresso with steamed milk foam', 32000, 7000, 'COF-CAP', '1002', NULL, true, true, false, 0, 0, 5, 120, ARRAY['milk'], ARRAY['hot', 'signature'], 2, NOW(), NOW()),
    ('prod-003', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-001', 'Caffe Latte', 'Espresso with steamed milk', 35000, 8000, 'COF-LAT', '1003', NULL, true, true, false, 0, 0, 5, 150, ARRAY['milk'], ARRAY['hot', 'cold'], 3, NOW(), NOW()),
    ('prod-004', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-001', 'Iced Coffee', 'Cold black coffee with ice', 28000, 6000, 'COF-ICE', '1004', NULL, true, false, false, 0, 0, 3, 10, NULL, ARRAY['cold', 'iced'], 4, NOW(), NOW()),
    ('prod-005', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-001', 'Mocha', 'Espresso with chocolate and milk', 38000, 9000, 'COF-MOC', '1005', NULL, true, true, false, 0, 0, 6, 200, ARRAY['milk', 'chocolate'], ARRAY['hot', 'signature'], 5, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Tea Category
INSERT INTO products (id, tenant_id, category_id, name, description, price, cost, sku, barcode, is_available, is_featured, stock_tracking, stock_quantity, low_stock_threshold, preparation_time, sort_order, created_at, updated_at)
VALUES
    ('prod-006', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-002', 'Green Tea', 'Fresh green tea', 22000, 4000, 'TEA-GRN', '2001', true, false, false, 0, 0, 4, 1, NOW(), NOW()),
    ('prod-007', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-002', 'Thai Tea', 'Sweet Thai milk tea', 28000, 6000, 'TEA-THI', '2002', true, true, false, 0, 0, 5, 2, NOW(), NOW()),
    ('prod-008', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-002', 'Lemon Tea', 'Refreshing lemon tea', 25000, 5000, 'TEA-LEM', '2003', true, false, false, 0, 0, 4, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Food Category
INSERT INTO products (id, tenant_id, category_id, name, description, price, cost, sku, barcode, is_available, stock_tracking, stock_quantity, low_stock_threshold, preparation_time, sort_order, created_at, updated_at)
VALUES
    ('prod-009', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-003', 'Croissant', 'Buttery French pastry', 18000, 5000, 'FD-CRS', '3001', true, true, 50, 10, 3, 1, NOW(), NOW()),
    ('prod-010', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-003', 'Sandwich', 'Club sandwich with fries', 42000, 15000, 'FD-SND', '3002', true, true, 30, 5, 10, 2, NOW(), NOW()),
    ('prod-011', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-003', 'French Fries', 'Crispy potato fries', 22000, 7000, 'FD-FRI', '3003', true, true, 100, 20, 7, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Dessert Category
INSERT INTO products (id, tenant_id, category_id, name, description, price, cost, sku, barcode, is_available, is_featured, preparation_time, sort_order, created_at, updated_at)
VALUES
    ('prod-012', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-004', 'Tiramisu', 'Italian coffee dessert', 35000, 12000, 'DES-TIR', '4001', true, true, 2, 1, NOW(), NOW()),
    ('prod-013', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-004', 'Cheesecake', 'New York style cheesecake', 38000, 13000, 'DES-CHK', '4002', true, true, 2, 2, NOW(), NOW()),
    ('prod-014', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'cat-004', 'Ice Cream', 'Vanilla ice cream scoop', 20000, 6000, 'DES-ICE', '4003', true, false, 2, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
DO $$
BEGIN
    RAISE NOTICE 'Categories inserted: %', (SELECT COUNT(*) FROM categories WHERE tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab');
    RAISE NOTICE 'Products inserted: %', (SELECT COUNT(*) FROM products WHERE tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab');
END $$;

-- Show summary
SELECT 
    c.name as category,
    COUNT(p.id) as product_count,
    STRING_AGG(p.name, ', ' ORDER BY p.sort_order) as products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;
