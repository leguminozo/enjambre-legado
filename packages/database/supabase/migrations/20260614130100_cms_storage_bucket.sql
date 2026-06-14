INSERT INTO storage.buckets (id, name, public)
VALUES ('cms', 'cms', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin can upload cms" ON storage.objects;
CREATE POLICY "Admin can upload cms" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cms' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can update cms" ON storage.objects;
CREATE POLICY "Admin can update cms" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cms' AND public.is_admin())
  WITH CHECK (bucket_id = 'cms' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete cms" ON storage.objects;
CREATE POLICY "Admin can delete cms" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cms' AND public.is_admin());

DROP POLICY IF EXISTS "Public can read cms" ON storage.objects;
CREATE POLICY "Public can read cms" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cms');
