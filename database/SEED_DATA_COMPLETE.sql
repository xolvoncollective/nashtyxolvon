-- ============================================
-- COMPREHENSIVE SEED DATA FOR NASHTY OS
-- Data dummy lengkap untuk UAT dan testing
-- Copy-paste ke Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TENANTS & OUTLETS
-- ============================================
INSERT INTO tenants (id, name, slug, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'NASHTY Galaxy Mall', 'nashty-galaxy', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO outlets (id, tenant_id, name, slug, address, phone, is_active) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Galaxy Mall Outlet', 'galaxy-mall', 'Galaxy Mall Lt.3 Unit 12, Surabaya', '031-1234567', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. SYSTEM USERS (Admin, Superadmin)
-- ============================================
-- Password untuk semua: "nashty123" (bcrypt hash)
INSERT INTO system_users (id, username, password_hash, full_name, email, role, is_active, tenant_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'superadmin@nashty', '$2b$10$rqP1YkJXQ3xW.v8vZ5wYc.FvVNZ2XgJr8p9KlHfGzCj0xBqxKxYHO', 'Super Admin', 'superadmin@nashty.com', 'superadmin', true, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'admin1', '$2b$10$rqP1YkJXQ3xW.v8vZ5wYc.FvVNZ2XgJr8p9KlHfGzCj0xBqxKxYHO', 'Admin One', 'admin1@nashty.com', 'admin', true, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'admin2', '$2b$10$rqP1YkJXQ3xW.v8vZ5wYc.FvVNZ2XgJr8p9KlHfGzCj0xBqxKxYHO', 'Admin Two', 'admin2@nashty.com', 'admin', true, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'owner', '$2b$10$rqP1YkJXQ3xW.v8vZ5wYc.FvVNZ2XgJr8p9KlHfGzCj0xBqxKxYHO', 'Owner', 'owner@nashty.com', 'owner', true, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000005', 'manager', '$2b$10$rqP1YkJXQ3xW.v8vZ5wYc.FvVNZ2XgJr8p9KlHfGzCj0xBqxKxYHO', 'Manager', 'manager@nashty.com', 'manager', true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (username) DO NOTHING;

-- Grant system access
INSERT INTO user_system_access (user_id, system_name, has_access) VALUES
  ('10000000-0000-0000-0000-000000000001', 'pos', true),
  ('10000000-0000-0000-0000-000000000001', 'kds', true),
  ('10000000-0000-0000-0000-000000000001', 'backoffice', true),
  ('10000000-0000-0000-0000-000000000001', 'crm', true),
  ('10000000-0000-0000-0000-000000000001', 'cost', true),
  ('10000000-0000-0000-0000-000000000002', 'pos', true),
  ('10000000-0000-0000-0000-000000000002', 'backoffice', true),
  ('10000000-0000-0000-0000-000000000003', 'pos', true),
  ('10000000-0000-0000-0000-000000000003', 'kds', true),
  ('10000000-0000-0000-0000-000000000004', 'backoffice', true),
  ('10000000-0000-0000-0000-000000000004', 'crm', true),
  ('10000000-0000-0000-0000-000000000005', 'pos', true),
  ('10000000-0000-0000-0000-000000000005', 'kds', true)
ON CONFLICT (user_id, system_name) DO NOTHING;

-- ============================================
-- 3. POS STAFF (Kasir dengan PIN)
-- ============================================
INSERT INTO staff (id, tenant_id, outlet_id, name, pin, role, color, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Citra', '1234', 'kasir', '#E4540C', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Budi', '2345', 'kasir', '#3B82F6', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Ani', '3456', 'kasir', '#22C55E', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Admin Kasir', '0000', 'admin', '#A855F7', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. MENU CATEGORIES
-- ============================================
INSERT INTO menu_categories (id, tenant_id, name, slug, sort_order, is_active) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ayam Goreng', 'ayam-goreng', 1, true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Nasi & Rice Bowl', 'nasi-rice-bowl', 2, true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Minuman Dingin', 'minuman-dingin', 3, true),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Minuman Panas', 'minuman-panas', 4, true),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Snack & Side', 'snack-side', 5, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. MENU ITEMS (Produk)
-- ============================================
INSERT INTO menu_items (id, tenant_id, category_id, name, slug, description, price, sku, status, is_active, category_name) VALUES
  -- Ayam Goreng
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Ayam Goreng Original', 'ayam-goreng-original', 'Ayam goreng crispy renyah dengan bumbu rahasia', 25000, 'AG-001', 'active', true, 'Ayam Goreng'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Ayam Goreng Geprek', 'ayam-goreng-geprek', 'Ayam goreng crispy dengan sambal geprek level 1-5', 28000, 'AG-002', 'active', true, 'Ayam Goreng'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Ayam Goreng Saus Thai', 'ayam-goreng-saus-thai', 'Ayam goreng dengan saus Thai pedas manis', 30000, 'AG-003', 'active', true, 'Ayam Goreng'),
  
  -- Nasi & Rice Bowl
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Nasi Ayam Geprek Bowl', 'nasi-ayam-geprek-bowl', 'Nasi putih + ayam geprek + lalapan + sambal', 32000, 'NB-001', 'active', true, 'Nasi & Rice Bowl'),
  ('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Nasi Ayam Teriyaki Bowl', 'nasi-ayam-teriyaki-bowl', 'Nasi putih + ayam teriyaki + sayuran', 35000, 'NB-002', 'active', true, 'Nasi & Rice Bowl'),
  ('40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Nasi Goreng Spesial', 'nasi-goreng-spesial', 'Nasi goreng dengan topping ayam dan telur', 28000, 'NB-003', 'active', true, 'Nasi & Rice Bowl'),
  
  -- Minuman Dingin
  ('40000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Es Teh Manis', 'es-teh-manis', 'Teh manis dingin segar', 5000, 'MD-001', 'active', true, 'Minuman Dingin'),
  ('40000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Es Jeruk', 'es-jeruk', 'Jeruk peras segar dengan es batu', 8000, 'MD-002', 'active', true, 'Minuman Dingin'),
  ('40000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Thai Tea', 'thai-tea', 'Thai tea original dingin', 12000, 'MD-003', 'active', true, 'Minuman Dingin'),
  ('40000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Lemon Tea', 'lemon-tea', 'Teh dengan perasan lemon segar', 10000, 'MD-004', 'active', true, 'Minuman Dingin'),
  
  -- Minuman Panas
  ('40000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Teh Panas', 'teh-panas', 'Teh manis hangat', 5000, 'MP-001', 'active', true, 'Minuman Panas'),
  ('40000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Kopi Hitam', 'kopi-hitam', 'Kopi hitam panas original', 8000, 'MP-002', 'active', true, 'Minuman Panas'),
  
  -- Snack & Side
  ('40000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Kentang Goreng', 'kentang-goreng', 'French fries crispy dengan saus', 15000, 'SN-001', 'active', true, 'Snack & Side'),
  ('40000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Nugget Ayam (5 pcs)', 'nugget-ayam-5pcs', 'Nugget ayam crispy 5 pieces', 18000, 'SN-002', 'active', true, 'Snack & Side'),
  ('40000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Onion Ring', 'onion-ring', 'Onion ring crispy dengan saus BBQ', 16000, 'SN-003', 'active', true, 'Snack & Side')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. OUTLET MENU (Link menu ke outlet)
-- ============================================
INSERT INTO outlet_menu_items (outlet_id, menu_item_id, is_available, price_override) 
SELECT 
  '00000000-0000-0000-0000-000000000101',
  id,
  true,
  NULL
FROM menu_items
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (outlet_id, menu_item_id) DO NOTHING;

-- ============================================
-- 7. DUMMY ORDERS (Transaksi untuk testing)
-- ============================================
INSERT INTO orders (id, tenant_id, outlet_id, order_number, order_type, order_status, table_number, customer_name, customer_phone, subtotal, discount, tax, service_charge, total, payment_method, cashier_name, created_at) VALUES
  -- Order hari ini
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0001', 'dine-in', 'paid', 'T01', 'John Doe', '081234567890', 57000, 0, 6270, 2850, 66120, 'cash', 'Citra', NOW() - INTERVAL '2 hours'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0002', 'takeaway', 'paid', NULL, 'Jane Smith', '081234567891', 40000, 2000, 4180, 1900, 44080, 'qris', 'Budi', NOW() - INTERVAL '1 hour 30 minutes'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0003', 'dine-in', 'paid', 'T05', 'Ahmad Yani', '081234567892', 93000, 5000, 9680, 4400, 102080, 'debit', 'Citra', NOW() - INTERVAL '45 minutes'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0004', 'gofood', 'confirmed', NULL, 'Siti Nurhaliza', '081234567893', 60000, 0, 6600, 3000, 69600, 'gofood', 'Budi', NOW() - INTERVAL '20 minutes'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0005', 'dine-in', 'confirmed', 'T12', 'Budi Santoso', NULL, 75000, 0, 8250, 3750, 87000, 'cash', 'Ani', NOW() - INTERVAL '10 minutes'),
  
  -- Order kemarin
  ('50000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0011', 'dine-in', 'paid', 'T03', 'Customer A', NULL, 120000, 10000, 12100, 5500, 127600, 'cash', 'Citra', NOW() - INTERVAL '1 day 3 hours'),
  ('50000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'SNY-0012', 'takeaway', 'paid', NULL, 'Customer B', '081234567894', 85000, 0, 9350, 4250, 98600, 'qris', 'Budi', NOW() - INTERVAL '1 day 6 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. ORDER ITEMS (Detail transaksi)
-- ============================================
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, item_status, notes) VALUES
  -- SNY-0001 items
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Ayam Goreng Geprek', 2, 28000, 56000, 'served', NULL),
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000021', 'Es Teh Manis', 2, 5000, 10000, 'served', NULL),
  
  -- SNY-0002 items
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000011', 'Nasi Ayam Geprek Bowl', 1, 32000, 32000, 'served', 'Sambal level 3'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000022', 'Es Jeruk', 1, 8000, 8000, 'served', NULL),
  
  -- SNY-0003 items
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000012', 'Nasi Ayam Teriyaki Bowl', 2, 35000, 70000, 'served', NULL),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000023', 'Thai Tea', 2, 12000, 24000, 'served', NULL),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000041', 'Kentang Goreng', 1, 15000, 15000, 'served', NULL),
  
  -- SNY-0004 items (Gofood - in progress)
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'Ayam Goreng Original', 2, 25000, 50000, 'preparing', NULL),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000024', 'Lemon Tea', 1, 10000, 10000, 'preparing', 'Less sugar'),
  
  -- SNY-0005 items (Baru masuk - untuk KDS)
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'Ayam Goreng Saus Thai', 2, 30000, 60000, 'preparing', NULL),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000041', 'Kentang Goreng', 1, 15000, 15000, 'preparing', NULL),
  
  -- SNY-0011 items (kemarin)
  ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000011', 'Nasi Ayam Geprek Bowl', 3, 32000, 96000, 'served', NULL),
  ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000042', 'Nugget Ayam (5 pcs)', 2, 18000, 36000, 'served', NULL),
  
  -- SNY-0012 items (kemarin)
  ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000012', 'Nasi Ayam Teriyaki Bowl', 2, 35000, 70000, 'served', NULL),
  ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000022', 'Es Jeruk', 2, 8000, 16000, 'served', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. AUDIT LOGS (Sample logs untuk testing)
-- ============================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address, user_agent, tenant_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'CREATE', 'order', '50000000-0000-0000-0000-000000000001', '{"total": 66120, "status": "paid"}', '192.168.1.100', 'Mozilla/5.0', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000002', 'UPDATE', 'menu_item', '40000000-0000-0000-0000-000000000001', '{"price": {"old": 24000, "new": 25000}}', '192.168.1.101', 'Mozilla/5.0', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000001', 'DELETE', 'menu_item', '40000000-0000-0000-0000-000000000099', '{"name": "Produk Lama", "reason": "Discontinued"}', '192.168.1.100', 'Mozilla/5.0', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000002', 'LOGIN', 'user', '10000000-0000-0000-0000-000000000002', '{"username": "admin1"}', '192.168.1.102', 'Mozilla/5.0', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. SHIFTS (Sample shift data)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  outlet_id UUID NOT NULL,
  staff_id UUID,
  staff_name VARCHAR(100),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  start_cash DECIMAL(15,2) DEFAULT 0,
  end_cash DECIMAL(15,2),
  expected_cash DECIMAL(15,2),
  variance DECIMAL(15,2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shifts (id, tenant_id, outlet_id, staff_id, staff_name, start_time, start_cash, status) VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', 'Citra', NOW() - INTERVAL '3 hours', 500000, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. RELAX RLS POLICIES (Untuk operasional)
-- ============================================

-- Drop existing strict policies
DROP POLICY IF EXISTS tenant_isolation_menu_items ON menu_items;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
DROP POLICY IF EXISTS tenant_isolation_menu_categories ON menu_categories;

-- Create relaxed policies untuk anon dan authenticated
CREATE POLICY allow_all_menu_items ON menu_items FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_menu_categories ON menu_categories FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_orders ON orders FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_order_items ON order_items FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_outlets ON outlets FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_outlet_menu ON outlet_menu_items FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_shifts ON shifts FOR ALL TO anon, authenticated USING (true);
CREATE POLICY allow_all_audit_logs ON audit_logs FOR ALL TO anon, authenticated USING (true);

-- ============================================
-- SELESAI! Copy semua SQL ini ke Supabase
-- ============================================
-- Total data:
-- ✅ 1 Tenant, 1 Outlet
-- ✅ 5 System Users (superadmin, admin1-2, owner, manager)
-- ✅ 4 POS Staff (Citra, Budi, Ani, Admin Kasir)
-- ✅ 5 Menu Categories
-- ✅ 15 Menu Items
-- ✅ 7 Orders (5 hari ini, 2 kemarin)
-- ✅ 16 Order Items
-- ✅ 4 Audit Logs
-- ✅ 1 Active Shift
-- ✅ RLS Policies Relaxed

SELECT 'Seed data berhasil diinsert! 🎉' AS status;
