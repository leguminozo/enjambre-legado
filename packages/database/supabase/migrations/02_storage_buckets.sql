-- Buckets: colmenas, productos, árboles (imágenes / trazabilidad)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('colmenas', 'colmenas', true),
  ('productos', 'productos', true),
  ('arboles', 'arboles', true),
  ('fuentes', 'fuentes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_colmenas_read ON storage.objects;
DROP POLICY IF EXISTS storage_colmenas_insert ON storage.objects;
DROP POLICY IF EXISTS storage_colmenas_update ON storage.objects;
DROP POLICY IF EXISTS storage_colmenas_delete ON storage.objects;
DROP POLICY IF EXISTS storage_productos_read ON storage.objects;
DROP POLICY IF EXISTS storage_productos_insert ON storage.objects;
DROP POLICY IF EXISTS storage_productos_update ON storage.objects;
DROP POLICY IF EXISTS storage_productos_delete ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_read ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_insert ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_update ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_delete ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_read ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_insert ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_update ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_delete ON storage.objects;

CREATE POLICY storage_colmenas_read ON storage.objects
  FOR SELECT USING (bucket_id = 'colmenas');
CREATE POLICY storage_colmenas_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'colmenas');
CREATE POLICY storage_colmenas_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'colmenas') WITH CHECK (bucket_id = 'colmenas');
CREATE POLICY storage_colmenas_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'colmenas');
CREATE POLICY storage_productos_read ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');
CREATE POLICY storage_productos_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'productos');
CREATE POLICY storage_productos_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'productos') WITH CHECK (bucket_id = 'productos');
CREATE POLICY storage_productos_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'productos');
CREATE POLICY storage_arboles_read ON storage.objects
  FOR SELECT USING (bucket_id = 'arboles');
CREATE POLICY storage_arboles_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'arboles');
CREATE POLICY storage_arboles_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'arboles') WITH CHECK (bucket_id = 'arboles');
CREATE POLICY storage_arboles_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'arboles');
CREATE POLICY storage_fuentes_read ON storage.objects
  FOR SELECT USING (bucket_id = 'fuentes' AND (public.is_gerente() OR public.current_role() = 'tienda_admin'));
CREATE POLICY storage_fuentes_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fuentes' AND (public.is_gerente() OR public.current_role() = 'tienda_admin'));
CREATE POLICY storage_fuentes_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'fuentes' AND (public.is_gerente() OR public.current_role() = 'tienda_admin'))
  WITH CHECK (bucket_id = 'fuentes' AND (public.is_gerente() OR public.current_role() = 'tienda_admin'));
CREATE POLICY storage_fuentes_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'fuentes' AND (public.is_gerente() OR public.current_role() = 'tienda_admin'));
