-- UAT: Create Orders 3, 4, 5 for testing
-- This simulates orders created through POS

-- Get user ID
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID := 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab';
  v_outlet_id UUID := '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e';
  v_order_3_id UUID;
  v_order_4_id UUID;
  v_order_5_id UUID;
BEGIN
  -- Get a user ID for Galaxy Mall
  SELECT id INTO v_user_id FROM staff WHERE outlet_id = v_outlet_id LIMIT 1;
  
  -- Order 3: Green Tea + Thai Tea (Non-Coffee)
  INSERT INTO orders (
    tenant_id, outlet_id, user_id, order_number,
    order_type, subtotal, tax, discount, total,
    payment_method, payment_status, order_status, kitchen_status
  ) VALUES (
    v_tenant_id, v_outlet_id, v_user_id, 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
    'dine-in', 50000, 5500, 0, 57500,
    'cash', 'paid', 'pending', 'pending'
  ) RETURNING id INTO v_order_3_id;
  
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
  VALUES
    (v_order_3_id, 'e6b9edb3-94e0-414a-a671-34f7bf0ae183', 'Green Tea', 1, 22000, 22000),
    (v_order_3_id, '28d68f80-b5fb-43ba-950c-bf5683a43e3c', 'Thai Tea', 1, 28000, 28000);
  
  -- Order 4: Croissant + Sandwich (Food)
  INSERT INTO orders (
    tenant_id, outlet_id, user_id, order_number,
    order_type, subtotal, tax, discount, total,
    payment_method, payment_status, order_status, kitchen_status
  ) VALUES (
    v_tenant_id, v_outlet_id, v_user_id, 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
    'dine-in', 60000, 6600, 0, 69600,
    'cash', 'paid', 'pending', 'pending'
  ) RETURNING id INTO v_order_4_id;
  
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
  VALUES
    (v_order_4_id, 'e28faf59-a95b-4330-85b1-b56d37a888ea', 'Croissant', 1, 18000, 18000),
    (v_order_4_id, 'b7f0ff3c-4312-498b-a3a5-d14e8dcb92b1', 'Sandwich', 1, 42000, 42000);
  
  -- Order 5: Matcha Latte + Chocolate (Mixed Non-Coffee)
  INSERT INTO orders (
    tenant_id, outlet_id, user_id, order_number,
    order_type, subtotal, tax, discount, total,
    payment_method, payment_status, order_status, kitchen_status
  ) VALUES (
    v_tenant_id, v_outlet_id, v_user_id, 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
    'takeaway', 58000, 6380, 0, 67280,
    'cash', 'paid', 'pending', 'pending'
  ) RETURNING id INTO v_order_5_id;
  
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
  VALUES
    (v_order_5_id, 'bae82d75-4d61-493f-ad72-f326e83f7bc2', 'Matcha Latte', 1, 28000, 28000),
    (v_order_5_id, 'bb91b42d-aead-4a06-880e-5b0271919e4f', 'Chocolate', 1, 30000, 30000);
  
  RAISE NOTICE 'Created 3 orders successfully';
END $$;

-- Verify orders
SELECT 
  order_number,
  order_type,
  total,
  payment_status,
  order_status,
  kitchen_status,
  created_at,
  (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as item_count
FROM orders
WHERE outlet_id = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'
  AND created_at > '2026-06-22 11:00:00'
ORDER BY created_at DESC
LIMIT 10;
