-- ═══════════════════════════════════════════════════════════════════
-- NASHTY OS - Check Existing Data
-- ═══════════════════════════════════════════════════════════════════

-- Check Tenants
SELECT 'Tenants' as table_name, COUNT(*) as count FROM tenants;

-- Check Outlets
SELECT 'Outlets' as table_name, COUNT(*) as count FROM outlets;

-- Check Users
SELECT 'Users' as table_name, COUNT(*) as count, 
       STRING_AGG(name || ' (PIN: ' || pin || ')', ', ') as users
FROM users 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Check Categories
SELECT 'Categories' as table_name, COUNT(*) as count,
       STRING_AGG(name, ', ') as categories
FROM categories 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Check Products
SELECT 'Products' as table_name, COUNT(*) as count
FROM products 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Check Modifier Groups
SELECT 'Modifier Groups' as table_name, COUNT(*) as count,
       STRING_AGG(name, ', ') as groups
FROM modifier_groups 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Check Modifier Options
SELECT 'Modifier Options' as table_name, COUNT(*) as count
FROM modifier_options;

-- Check Product Modifiers Links
SELECT 'Product-Modifier Links' as table_name, COUNT(*) as count
FROM product_modifiers;

-- Check Settings
SELECT 'Settings' as table_name, COUNT(*) as count,
       STRING_AGG(key, ', ') as keys
FROM settings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
