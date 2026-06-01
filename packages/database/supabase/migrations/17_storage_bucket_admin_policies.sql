-- 17: Restrict storage bucket uploads to admin roles only
-- Previously: any authenticated user could upload to productos, colmenas, arboles buckets
-- Now: only gerente and tienda_admin can upload/delete

-- Drop permissive policies if they exist
DROP POLICY IF EXISTS "Any authenticated user can upload productos" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can upload colmenas" ON storage.objects;
DROP POLICY IF EXISTS "Any authenticated user can upload arboles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload fuentes" ON storage.objects;

-- Create admin-only upload policies
DROP POLICY IF EXISTS "Admin can upload productos" ON storage.objects;
CREATE POLICY "Admin can upload productos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'productos'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete productos" ON storage.objects;
CREATE POLICY "Admin can delete productos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'productos'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can upload colmenas" ON storage.objects;
CREATE POLICY "Admin can upload colmenas" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'colmenas'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete colmenas" ON storage.objects;
CREATE POLICY "Admin can delete colmenas" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'colmenas'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can upload arboles" ON storage.objects;
CREATE POLICY "Admin can upload arboles" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'arboles'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete arboles" ON storage.objects;
CREATE POLICY "Admin can delete arboles" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'arboles'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can upload fuentes" ON storage.objects;
CREATE POLICY "Admin can upload fuentes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fuentes'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete fuentes" ON storage.objects;
CREATE POLICY "Admin can delete fuentes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fuentes'
    AND auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('gerente', 'tienda_admin')
    )
  );
