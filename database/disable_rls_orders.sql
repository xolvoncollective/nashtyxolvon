-- Run this in Supabase SQL Editor to allow POS inserts with ANON_KEY

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- If you prefer keeping RLS enabled but want to allow inserts from anon, run this instead:
-- CREATE POLICY "Allow anon inserts on orders" ON orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon inserts on order_items" ON order_items FOR INSERT WITH CHECK (true);
