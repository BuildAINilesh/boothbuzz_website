-- Storage upload policies for exhibitor-images / exhibitor-documents.
-- Do NOT run: ALTER TABLE storage.objects ... (causes 42501: must be owner of table objects).
-- RLS is already enabled on storage.objects in hosted Supabase.
--
-- If SQL still fails, use Dashboard: Storage → bucket → Policies → New policy
-- (templates: public read, public insert).

-- exhibitor-images
DROP POLICY IF EXISTS "Public read access for exhibitor-images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for exhibitor-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for exhibitor-images" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload access for exhibitor-images" ON storage.objects;

CREATE POLICY "Public read access for exhibitor-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'exhibitor-images');

CREATE POLICY "Public upload access for exhibitor-images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'exhibitor-images');

-- exhibitor-documents
DROP POLICY IF EXISTS "Public read access for exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for exhibitor-documents" ON storage.objects;

CREATE POLICY "Public read access for exhibitor-documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'exhibitor-documents');

CREATE POLICY "Public upload access for exhibitor-documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'exhibitor-documents');
