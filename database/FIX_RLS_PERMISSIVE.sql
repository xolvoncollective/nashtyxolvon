-- Enable ALL operations for anon because the frontend relies on anon direct client access
-- Products
DROP POLICY IF EXISTS "Allow anon all" ON products;
CREATE POLICY "Allow anon all" ON products FOR ALL USING (true) WITH CHECK (true);

-- Categories
DROP POLICY IF EXISTS "Allow anon all" ON categories;
CREATE POLICY "Allow anon all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Members
DROP POLICY IF EXISTS "Allow anon all" ON members;
CREATE POLICY "Allow anon all" ON members FOR ALL USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Allow anon all" ON settings;
CREATE POLICY "Allow anon all" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Staff
DROP POLICY IF EXISTS "Allow anon all" ON staff;
CREATE POLICY "Allow anon all" ON staff FOR ALL USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Allow anon all" ON orders;
CREATE POLICY "Allow anon all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "Allow anon all" ON order_items;
CREATE POLICY "Allow anon all" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Shifts
DROP POLICY IF EXISTS "Allow anon all" ON shifts;
CREATE POLICY "Allow anon all" ON shifts FOR ALL USING (true) WITH CHECK (true);
