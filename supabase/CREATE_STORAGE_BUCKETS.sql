-- ====================================================================
-- NASHTY OS - Storage Buckets Setup
-- Run this in Supabase SQL Editor
-- Or create via Dashboard: Storage > New Bucket
-- ====================================================================

-- 1. Create receipts bucket (for logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create promotions bucket (for promo images on customer display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotions',
  'promotions',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Set RLS policies for receipts bucket
CREATE POLICY IF NOT EXISTS "Public can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can update receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts');

-- 4. Set RLS policies for promotions bucket
CREATE POLICY IF NOT EXISTS "Public can view promotions"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotions');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload promotions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotions'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can update promotions"
ON storage.objects FOR UPDATE
USING (bucket_id = 'promotions')
WITH CHECK (bucket_id = 'promotions');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete promotions"
ON storage.objects FOR DELETE
USING (bucket_id = 'promotions');

-- 5. Verify buckets created
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE id IN ('receipts', 'promotions');

-- Expected output:
-- receipts    | receipts    | true | 2097152 | {image/png,image/jpeg,...}
-- promotions  | promotions  | true | 5242880 | {image/png,image/jpeg}
