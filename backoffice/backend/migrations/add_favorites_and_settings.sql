-- =============================================
-- POS Enhancement - Database Migrations
-- Version: 2.0.0
-- Date: 2024
-- =============================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_position ON favorites(user_id, position);

-- Add receipt settings columns to outlets
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_logo TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_font_size VARCHAR(20) DEFAULT 'medium';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_qr_feedback TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_social_facebook TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_social_instagram TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_social_twitter TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_social_tiktok TEXT;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS receipt_promos JSONB DEFAULT '[]';

-- Add customer display settings columns to outlets
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS display_background_color VARCHAR(20) DEFAULT '#0B0F19';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS display_text_color VARCHAR(20) DEFAULT '#F8FAFC';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS display_accent_color VARCHAR(20) DEFAULT '#FF5A1F';
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS display_promo_images JSONB DEFAULT '[]';

-- Create analytics function for top products
CREATE OR REPLACE FUNCTION get_top_products(
  outlet_id UUID,
  since TIMESTAMPTZ,
  limit_count INT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  image TEXT,
  sales_count BIGINT,
  revenue NUMERIC,
  trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image,
    COUNT(oi.id) as sales_count,
    SUM(oi.price * oi.quantity) as revenue,
    'stable' as trend
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.outlet_id = get_top_products.outlet_id
    AND o.created_at >= since
  GROUP BY p.id, p.name, p.price, p.image
  ORDER BY sales_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE favorites IS 'Stores user favorite products for quick access in POS';
COMMENT ON COLUMN outlets.receipt_logo IS 'Logo URL for receipt customization';
COMMENT ON COLUMN outlets.display_background_color IS 'Customer display background color (hex)';
COMMENT ON FUNCTION get_top_products IS 'Returns top selling products by outlet and time period';
