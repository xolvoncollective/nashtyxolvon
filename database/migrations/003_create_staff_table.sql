-- ============================================
-- POS STAFF TABLE
-- Table untuk kasir yang login menggunakan PIN
-- ============================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  outlet_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  pin VARCHAR(4) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'kasir',
  color VARCHAR(7) DEFAULT '#E4540C',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_staff_role CHECK (role IN ('kasir', 'admin'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON staff(outlet_id);
CREATE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS staff_all_access ON staff;

-- Create policies
CREATE POLICY staff_all_access ON staff
  FOR ALL 
  TO authenticated, anon
  USING (true);

-- Insert default staff for testing
INSERT INTO staff (tenant_id, outlet_id, name, pin, role, color) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Citra', '1234', 'kasir', '#E4540C'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Budi', '2345', 'kasir', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Ani', '3456', 'kasir', '#22C55E'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Admin Kasir', '0000', 'admin', '#A855F7')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE staff IS 'Kasir POS yang login menggunakan PIN 4 digit';
