-- ============================================================================
-- NASHTY OS - PART 3: MEMBERS & REALISTIC TRANSACTION GENERATOR
-- ============================================================================
-- This generates 300 members and realistic order patterns over 90 days
-- ============================================================================

BEGIN;

-- 3.1 MEMBERS (300 customers with realistic distribution)
-- ----------------------------------------------------------------------------
-- Distribution: 60% new, 25% regular, 12% loyal, 3% VIP

-- Generate 300 members using generate_series
INSERT INTO members (tenant_id, name, phone, pin_hash, points, total_spent, visit_count, segment, status, created_at, updated_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  'Customer ' || LPAD(i::text, 3, '0'),
  '0812' || LPAD((34000000 + i)::text, 8, '0'),
  CASE WHEN random() < 0.3 THEN '$2b$10$abcdefghijklmnopqrstuvwxyz' || i ELSE NULL END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 5000 + 5000)::int  -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 2000 + 1000)::int  -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 500 + 100)::int   -- Regular
    ELSE FLOOR(random() * 100)::int                        -- New
  END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 10000000 + 5000000)::numeric  -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 3000000 + 1000000)::numeric  -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 500000 + 100000)::numeric   -- Regular
    ELSE FLOOR(random() * 100000)::numeric                           -- New
  END,
  CASE 
    WHEN i <= 9 THEN FLOOR(random() * 50 + 30)::int      -- VIP
    WHEN i <= 45 THEN FLOOR(random() * 20 + 10)::int     -- Loyal
    WHEN i <= 120 THEN FLOOR(random() * 8 + 3)::int      -- Regular
    ELSE FLOOR(random() * 2 + 1)::int                    -- New
  END,
  CASE 
    WHEN i <= 9 THEN 'vip'
    WHEN i <= 45 THEN 'loyal'
    WHEN i <= 120 THEN 'regular'
    ELSE 'new'
  END,
  'active',
  NOW() - (random() * INTERVAL '180 days'),
  NOW()
FROM generate_series(1, 300) AS i
ON CONFLICT DO NOTHING;

-- 3.2 NASHTYCOSTS (Operational Costs - 90 days realistic data)
-- ----------------------------------------------------------------------------
-- Categories: bahan-baku, operasional, gaji, utilitas, sewa, lainnya

-- Monthly rent (3 months x 3 outlets)
INSERT INTO nashtycosts (tenant_id, outlet_id, amount, category, description, created_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  outlet_id,
  CASE outlet_id::text
    WHEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a1' THEN 45000000  -- Galaxy Mall
    WHEN '71cb7d46-8f4e-4c3a-b9d1-1111111111a2' THEN 40000000  -- Pakuwon
    ELSE 38000000  -- TP6
  END,
  'sewa',
  'Sewa tempat bulanan',
  date_trunc('month', NOW()) - (month_offset || ' months')::interval
FROM unnest(ARRAY[
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
  '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid
]) AS outlet_id
CROSS JOIN generate_series(0, 2) AS month_offset
ON CONFLICT DO NOTHING;

-- Weekly operational costs (90 days = ~13 weeks, 3 outlets)
INSERT INTO nashtycosts (tenant_id, outlet_id, amount, category, description, created_at)
SELECT
  'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab'::uuid,
  outlet_id,
  amount,
  category,
  description,
  NOW() - (week_offset * 7 || ' days')::interval
FROM (
  SELECT 
    unnest(ARRAY[
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'::uuid,
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a2'::uuid,
      '71cb7d46-8f4e-4c3a-b9d1-1111111111a3'::uuid
    ]) AS outlet_id,
    week_offset,
    unnest(ARRAY[2500000, 1800000, 800000, 600000, 300000]) AS amount,
    unnest(ARRAY['bahan-baku', 'operasional', 'utilitas', 'gaji', 'lainnya']) AS category,
    unnest(ARRAY[
      'Pembelian ayam, bumbu, sayuran',
      'Packaging, supplies, cleaning',
      'Listrik, air, gas',
      'Gaji mingguan staff',
      'Maintenance dan lain-lain'
    ]) AS description
  FROM generate_series(0, 12) AS week_offset
) AS costs
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 3 Summary:
-- ✅ 300 Members (realistic segments)
-- ✅ ~200 Cost entries (3 months rent + 13 weeks ops x 3 outlets)
-- Next: Run PART 4 for order generation (separate file for performance)
-- ============================================================================
