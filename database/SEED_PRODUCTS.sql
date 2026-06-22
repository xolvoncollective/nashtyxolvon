-- Seed Categories and Products for UAT
-- Target tenant: b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab

DO $$
DECLARE
    v_tenant_id UUID := 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab';
    v_cat_coffee_id UUID := gen_random_uuid();
    v_cat_noncoffee_id UUID := gen_random_uuid();
BEGIN
    -- Insert Categories
    INSERT INTO categories (id, tenant_id, name, slug, status, display_order)
    VALUES 
    (v_cat_coffee_id, v_tenant_id, 'Coffee', 'coffee', 'active', 1),
    (v_cat_noncoffee_id, v_tenant_id, 'Non-Coffee', 'non-coffee', 'active', 2)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Products
    INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, sku, status, has_modifiers)
    VALUES
    (gen_random_uuid(), v_tenant_id, v_cat_coffee_id, 'Espresso', 'espresso', 15000, 5000, 'SKU-001', 'active', 0),
    (gen_random_uuid(), v_tenant_id, v_cat_coffee_id, 'Cafe Latte', 'cafe-latte', 25000, 10000, 'SKU-002', 'active', 1),
    (gen_random_uuid(), v_tenant_id, v_cat_noncoffee_id, 'Ice Tea', 'ice-tea', 12000, 3000, 'SKU-003', 'active', 0),
    (gen_random_uuid(), v_tenant_id, v_cat_noncoffee_id, 'Matcha Latte', 'matcha-latte', 28000, 12000, 'SKU-004', 'active', 1)
    ON CONFLICT (id) DO NOTHING;
END $$;
