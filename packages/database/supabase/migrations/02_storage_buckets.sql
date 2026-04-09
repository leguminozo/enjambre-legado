-- Buckets: colmenas, productos, árboles (imágenes / trazabilidad)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('colmenas', 'colmenas', true),
  ('productos', 'productos', true),
  ('arboles', 'arboles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_colmenas_read ON storage.objects;
DROP POLICY IF EXISTS storage_colmenas_insert ON storage.objects;
DROP POLICY IF EXISTS storage_productos_read ON storage.objects;
DROP POLICY IF EXISTS storage_productos_insert ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_read ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_insert ON storage.objects;

CREATE POLICY storage_colmenas_read ON storage.objects
  FOR SELECT USING (bucket_id = 'colmenas');
CREATE POLICY storage_colmenas_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'colmenas');
CREATE POLICY storage_productos_read ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');
CREATE POLICY storage_productos_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'productos');
CREATE POLICY storage_arboles_read ON storage.objects
  FOR SELECT USING (bucket_id = 'arboles');
CREATE POLICY storage_arboles_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'arboles');
