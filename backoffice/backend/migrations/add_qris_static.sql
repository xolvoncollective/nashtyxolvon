-- Add QRIS static image URL to outlets table
-- Migration for QRIS payment feature
-- Date: 2024

ALTER TABLE outlets ADD COLUMN IF NOT EXISTS qris_static_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN outlets.qris_static_url IS 'URL to static QRIS image for payment, uploaded via Backoffice and displayed in POS';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_outlets_qris ON outlets(qris_static_url) WHERE qris_static_url IS NOT NULL;
