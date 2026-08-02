-- 1004: Bucket privado para certificaciones sanitarias apícolas.
-- Acceso: solo el actor que sube el documento y el admin (is_admin).

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-sanitarios', 'certificados-sanitarios', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_certificados_sanitarios_read ON storage.objects;
DROP POLICY IF EXISTS storage_certificados_sanitarios_insert ON storage.objects;
DROP POLICY IF EXISTS storage_certificados_sanitarios_update ON storage.objects;
DROP POLICY IF EXISTS storage_certificados_sanitarios_delete ON storage.objects;

CREATE POLICY storage_certificados_sanitarios_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certificados-sanitarios'
    AND (owner = auth.uid() OR public.is_admin())
  );
CREATE POLICY storage_certificados_sanitarios_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'certificados-sanitarios'
    AND owner = auth.uid()
  );
CREATE POLICY storage_certificados_sanitarios_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'certificados-sanitarios'
    AND (owner = auth.uid() OR public.is_admin())
  ) WITH CHECK (bucket_id = 'certificados-sanitarios');
CREATE POLICY storage_certificados_sanitarios_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'certificados-sanitarios'
    AND (owner = auth.uid() OR public.is_admin())
  );
