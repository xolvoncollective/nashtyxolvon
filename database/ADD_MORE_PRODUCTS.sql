-- ADD MORE PRODUCTS FOR UAT
-- Using existing categories

-- Add more Coffee products
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, is_favorite, status, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'b33bef24-ded2-4e77-a62b-54146102d98f', 'Cappuccino', 'cappuccino', 'Espresso with steamed milk foam', 32000, 7000, 'COF-CAP', 1, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'b33bef24-ded2-4e77-a62b-54146102d98f', 'Caffe Latte', 'caffe-latte', 'Espresso with steamed milk', 35000, 8000, 'COF-LAT', 1, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'b33bef24-ded2-4e77-a62b-54146102d98f', 'Mocha', 'mocha', 'Chocolate espresso', 38000, 9000, 'COF-MOC', 1, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'b33bef24-ded2-4e77-a62b-54146102d98f', 'Flat White', 'flat-white', 'Smooth espresso with microfoam', 36000, 8500, 'COF-FLT', 1, 'active', NOW(), NOW())
ON CONFLICT (slug, tenant_id) DO NOTHING;

-- Add Non-Coffee products
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, is_favorite, status, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '56932714-b10d-4f2d-83c6-dd0b62d12893', 'Green Tea', 'green-tea', 'Fresh green tea', 22000, 4000, 'TEA-GRN', 0, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '56932714-b10d-4f2d-83c6-dd0b62d12893', 'Thai Tea', 'thai-tea', 'Sweet Thai milk tea', 28000, 6000, 'TEA-THI', 1, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '56932714-b10d-4f2d-83c6-dd0b62d12893', 'Lemon Tea', 'lemon-tea', 'Refreshing lemon tea', 25000, 5000, 'TEA-LEM', 0, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '56932714-b10d-4f2d-83c6-dd0b62d12893', 'Chocolate', 'chocolate', 'Hot chocolate', 30000, 7000, 'CHC-HOT', 1, 'active', NOW(), NOW())
ON CONFLICT (slug, tenant_id) DO NOTHING;

-- Add new category: Food
INSERT INTO categories (id, tenant_id, name, slug, description, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', 'Food', 'food', 'Snacks and meals', 'active', NOW(), NOW())
ON CONFLICT (tenant_id, slug) DO NOTHING
RETURNING id;

-- Add Food products (using the food category ID)
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, status, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab',
    c.id,
    'Croissant',
    'croissant',
    'Buttery French pastry',
    18000,
    5000,
    'FD-CRS',
    'active',
    NOW(),
    NOW()
FROM categories c WHERE c.slug = 'food' AND c.tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
ON CONFLICT (slug, tenant_id) DO NOTHING;

INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, sku, status, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab',
    c.id,
    'Sandwich',
    'sandwich',
    'Club sandwich',
    42000,
    15000,
    'FD-SND',
    'active',
    NOW(),
    NOW()
FROM categories c WHERE c.slug = 'food' AND c.tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
ON CONFLICT (slug, tenant_id) DO NOTHING;

-- Show results
SELECT 
    c.name as category,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.tenant_id = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'
GROUP BY c.name
ORDER BY c.name;
