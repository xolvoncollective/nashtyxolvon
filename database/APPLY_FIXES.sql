-- 1. Drop constraints causing insertion failures
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_user_id_fkey;

-- 2. Rename Outlets
UPDATE outlets SET name = 'Nashty Pusat (Galaxy)' WHERE id = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e';
UPDATE outlets SET name = 'Nashty Cabang 2' WHERE id = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f';
UPDATE outlets SET name = 'Nashty Cabang 3' WHERE id = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90';

-- 3. Reseed Staff (Cashiers)
DELETE FROM staff;

-- Galaxy Mall
INSERT INTO staff (id, tenant_id, outlet_id, name, role, pin, color, is_active) VALUES
('b2000000-0000-0000-0000-000000000001', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e', 'User 1', 'kasir', '1111', '#1e40af', true),
('b2000000-0000-0000-0000-000000000002', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e', 'User 2', 'kasir', '2222', '#166534', true),
('b2000000-0000-0000-0000-000000000003', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e', 'User 3', 'kasir', '3333', '#991b1b', true),
('b2000000-0000-0000-0000-000000000004', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e', 'User 4', 'kasir', '4444', '#854d0e', true);

-- Cabang 2
INSERT INTO staff (id, tenant_id, outlet_id, name, role, pin, color, is_active) VALUES
('b2000000-0000-0000-0000-000000000005', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f', 'User 1', 'kasir', '1111', '#1e40af', true),
('b2000000-0000-0000-0000-000000000006', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f', 'User 2', 'kasir', '2222', '#166534', true),
('b2000000-0000-0000-0000-000000000007', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f', 'User 3', 'kasir', '3333', '#991b1b', true),
('b2000000-0000-0000-0000-000000000008', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f', 'User 4', 'kasir', '4444', '#854d0e', true);

-- Cabang 3
INSERT INTO staff (id, tenant_id, outlet_id, name, role, pin, color, is_active) VALUES
('b2000000-0000-0000-0000-000000000009', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90', 'User 1', 'kasir', '1111', '#1e40af', true),
('b2000000-0000-0000-0000-000000000010', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90', 'User 2', 'kasir', '2222', '#166534', true),
('b2000000-0000-0000-0000-000000000011', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90', 'User 3', 'kasir', '3333', '#991b1b', true),
('b2000000-0000-0000-0000-000000000012', 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab', '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d90', 'User 4', 'kasir', '4444', '#854d0e', true);

-- 4. Enable RLS and setup permissive SELECT policies
-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON products;
CREATE POLICY "Allow anon read" ON products FOR SELECT USING (true);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON categories;
CREATE POLICY "Allow anon read" ON categories FOR SELECT USING (true);

-- Modifier Groups
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON modifier_groups;
CREATE POLICY "Allow anon read" ON modifier_groups FOR SELECT USING (true);

-- Modifier Options
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON modifier_options;
CREATE POLICY "Allow anon read" ON modifier_options FOR SELECT USING (true);

-- Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON staff;
CREATE POLICY "Allow anon read" ON staff FOR SELECT USING (true);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON orders;
CREATE POLICY "Allow anon read" ON orders FOR SELECT USING (true);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON order_items;
CREATE POLICY "Allow anon read" ON order_items FOR SELECT USING (true);

-- Shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON shifts;
CREATE POLICY "Allow anon read" ON shifts FOR SELECT USING (true);

-- Members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON members;
CREATE POLICY "Allow anon read" ON members FOR SELECT USING (true);

-- System Users
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON system_users;
CREATE POLICY "Allow anon read" ON system_users FOR SELECT USING (true);

-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON tenants;
CREATE POLICY "Allow anon read" ON tenants FOR SELECT USING (true);

-- Outlets
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON outlets;
CREATE POLICY "Allow anon read" ON outlets FOR SELECT USING (true);

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON activity_logs;
CREATE POLICY "Allow anon read" ON activity_logs FOR SELECT USING (true);

-- Settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON settings;
CREATE POLICY "Allow anon read" ON settings FOR SELECT USING (true);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON payments;
CREATE POLICY "Allow anon read" ON payments FOR SELECT USING (true);

-- Stations
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON stations;
CREATE POLICY "Allow anon read" ON stations FOR SELECT USING (true);

-- Nashty Costs
ALTER TABLE nashtycosts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON nashtycosts;
CREATE POLICY "Allow anon read" ON nashtycosts FOR SELECT USING (true);
