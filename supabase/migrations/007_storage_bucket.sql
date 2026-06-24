-- Create the product-images storage bucket.
-- NOTE: Supabase supports bucket creation via SQL migrations.
-- If this migration fails (some hosted plans restrict storage schema access),
-- create the bucket manually in the Supabase Dashboard:
--   Storage → New bucket → Name: "product-images" → Public: ON → Save
-- Then run only the policy statements below.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access (bucket is public, but explicit policy is best practice)
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated users (admin) can upload
CREATE POLICY "Authenticated upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can replace/update existing objects
CREATE POLICY "Authenticated update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Authenticated users can delete objects
CREATE POLICY "Authenticated delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
