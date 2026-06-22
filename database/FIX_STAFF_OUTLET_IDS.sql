-- Delete old staff with wrong outlet IDs
DELETE FROM staff WHERE outlet_id NOT IN (SELECT id FROM outlets);

-- Add staff with CORRECT outlet IDs
INSERT INTO staff (id, tenant_id, outlet_id, name, pin, role, is_active, color)
VALUES
  -- Galaxy Mall Surabaya staff
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- CORRECT Galaxy Mall ID
    'Citra Kusuma',
    '1234',
    'kasir',
    true,
    '#FF6B6B'
  ),
  (
    'a2000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- CORRECT Galaxy Mall ID
    'Budi Santoso',
    '2345',
    'kasir',
    true,
    '#4ECDC4'
  ),
  (
    'a2000000-0000-0000-0000-000000000003'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'::uuid,  -- CORRECT Galaxy Mall ID
    'Ani Wijaya',
    '3456',
    'kasir',
    true,
    '#95E1D3'
  ),
  -- Pakuwon Trade Center staff
  (
    'a2000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid,  -- CORRECT Pakuwon TC ID
    'Dina Permata',
    '4567',
    'kasir',
    true,
    '#F38181'
  ),
  (
    'a2000000-0000-0000-0000-000000000005'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8f'::uuid,  -- CORRECT Pakuwon TC ID
    'Eko Prasetyo',
    '5678',
    'kasir',
    true,
    '#AA96DA'
  )
ON CONFLICT (id) DO UPDATE SET
  outlet_id = EXCLUDED.outlet_id,
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  pin = EXCLUDED.pin,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  color = EXCLUDED.color;

-- Verify
SELECT 
  o.name as outlet_name,
  s.name as staff_name,
  s.pin,
  s.role
FROM staff s
JOIN outlets o ON s.outlet_id = o.id
ORDER BY o.name, s.name;
