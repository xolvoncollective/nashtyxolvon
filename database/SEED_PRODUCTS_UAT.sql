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
    ('11111111-1111-1111-1111-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Coffee', 'coffee', 'Hot and Cold Coffee', '#8B4513', 'coffee', 1, 'active', NOW(), NOW()),
    ('11111111-1111-1111-1111-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Tea', 'tea', 'Various Tea Selection', '#4B8B3B', 'leaf', 2, 'active', NOW(), NOW()),
    ('11111111-1111-1111-1111-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Food', 'food', 'Snacks and Meals', '#FF6B35', 'utensils', 3, 'active', NOW(), NOW()),
    ('11111111-1111-1111-1111-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Dessert', 'dessert', 'Sweet Treats', '#FF69B4', 'ice-cream', 4, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Coffee Category
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, image_url, is_favorite, has_modifiers, stock_tracking, stock_qty, production_time, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-000000000001'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000001'::uuid, 'Americano', 'americano', 'Classic black coffee', 25000, 5000, 'COF-AMR', NULL, 1, 0, 0, 0, 5, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000002'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000001'::uuid, 'Cappuccino', 'cappuccino', 'Espresso with steamed milk foam', 32000, 7000, 'COF-CAP', NULL, 1, 0, 0, 0, 5, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000003'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000001'::uuid, 'Caffe Latte', 'caffe-latte', 'Espresso with steamed milk', 35000, 8000, 'COF-LAT', NULL, 1, 0, 0, 0, 5, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000004'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000001'::uuid, 'Iced Coffee', 'iced-coffee', 'Cold black coffee with ice', 28000, 6000, 'COF-ICE', NULL, 0, 0, 0, 0, 3, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000005'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000001'::uuid, 'Mocha', 'mocha', 'Espresso with chocolate and milk', 38000, 9000, 'COF-MOC', NULL, 1, 0, 0, 0, 6, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Tea Category
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, is_favorite, stock_tracking, stock_qty, production_time, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-000000000006'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000002'::uuid, 'Green Tea', 'green-tea', 'Fresh green tea', 22000, 4000, 'TEA-GRN', 0, 0, 0, 4, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000007'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000002'::uuid, 'Thai Tea', 'thai-tea', 'Sweet Thai milk tea', 28000, 6000, 'TEA-THI', 1, 0, 0, 5, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000008'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000002'::uuid, 'Lemon Tea', 'lemon-tea', 'Refreshing lemon tea', 25000, 5000, 'TEA-LEM', 0, 0, 0, 4, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Food Category
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, stock_tracking, stock_qty, production_time, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-000000000009'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000003'::uuid, 'Croissant', 'croissant', 'Buttery French pastry', 18000, 5000, 'FD-CRS', 1, 50, 3, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000010'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000003'::uuid, 'Sandwich', 'sandwich', 'Club sandwich with fries', 42000, 15000, 'FD-SND', 1, 30, 10, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000011'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000003'::uuid, 'French Fries', 'french-fries', 'Crispy potato fries', 22000, 7000, 'FD-FRI', 1, 100, 7, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Products for Dessert Category
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, is_favorite, production_time, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-000000000012'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000004'::uuid, 'Tiramisu', 'tiramisu', 'Italian coffee dessert', 35000, 12000, 'DES-TIR', 1, 2, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000013'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000004'::uuid, 'Cheesecake', 'cheesecake', 'New York style cheesecake', 38000, 13000, 'DES-CHK', 1, 2, 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-000000000014'::uuid, 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '11111111-1111-1111-1111-000000000004'::uuid, 'Ice Cream', 'ice-cream', 'Vanilla ice cream scoop', 20000, 6000, 'DES-ICE', 0, 2, 'active', NOW(), NOW())
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
    STRING_AGG(p.name, ', ' ORDER BY p.name) as products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
GROUP BY c.name, c.display_order
ORDER BY c.display_order;
