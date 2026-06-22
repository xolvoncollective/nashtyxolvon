-- Add staff for POS login (Galaxy Mall)
INSERT INTO staff (id, tenant_id, outlet_id, name, pin, role, is_active, color)
VALUES
  (
    'a2000000-0000-0000-0000-000000000001'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Citra Kusuma',
    '1234',
    'kasir',
    true,
    '#FF6B6B'
  ),
  (
    'a2000000-0000-0000-0000-000000000002'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Budi Santoso',
    '2345',
    'kasir',
    true,
    '#4ECDC4'
  ),
  (
    'a2000000-0000-0000-0000-000000000003'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
    'Ani Wijaya',
    '3456',
    'kasir',
    true,
    '#95E1D3'
  ),
  (
    'a2000000-0000-0000-0000-000000000004'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Dina Permata',
    '4567',
    'kasir',
    true,
    '#F38181'
  ),
  (
    'a2000000-0000-0000-0000-000000000005'::uuid,
    'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
    '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
    'Eko Prasetyo',
    '5678',
    'kasir',
    true,
    '#AA96DA'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 
  s.name,
  s.pin,
  s.role,
  o.name as outlet_name
FROM staff s
JOIN outlets o ON s.outlet_id = o.id
ORDER BY o.name, s.name;
