-- 39: Consolidate nucleo roles into 'admin'
-- In nucleo, all internal users (gerente, tienda_admin, vendedor, logistica, marketing, apicultor)
-- are now unified under a single 'admin' role. Only 'cliente' and 'creador' remain as separate roles.
-- This simplifies RLS policies, storage policies, and middleware route guards.

-- Step 1: Drop old constraint FIRST (it blocks UPDATE to 'admin')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Migrate existing nucleo roles to 'admin'
UPDATE profiles SET role = 'admin'
WHERE role IN ('gerente', 'tienda_admin', 'vendedor', 'logistica', 'marketing', 'apicultor');

-- Step 2b: Fix any NULL roles to 'admin' default + make NOT NULL
UPDATE profiles SET role = 'admin' WHERE role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Step 3: Add new CHECK constraint (now safe — all rows valid)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'cliente', 'creador', 'rep_ventas'));

-- Step 3: Update handle_new_user() trigger default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'admin')
  );
  RETURN new;
EXCEPTION WHEN others THEN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, '', 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Replace is_gerente() with is_admin()
CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Step 5: Update current_role() (no change needed, it just reads the column)

-- Step 6: Consolidate storage policies for productos bucket
DROP POLICY IF EXISTS "Admin can upload productos" ON storage.objects;
CREATE POLICY "Admin can upload productos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'productos'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admin can update productos" ON storage.objects;
CREATE POLICY "Admin can update productos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'productos' AND public.is_admin())
WITH CHECK (bucket_id = 'productos' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete productos" ON storage.objects;
CREATE POLICY "Admin can delete productos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'productos' AND public.is_admin());

-- Step 7: Consolidate storage policies for colmenas bucket
DROP POLICY IF EXISTS "Admin can upload colmenas" ON storage.objects;
CREATE POLICY "Admin can upload colmenas" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'colmenas'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admin can update colmenas" ON storage.objects;
CREATE POLICY "Admin can update colmenas" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'colmenas' AND public.is_admin())
WITH CHECK (bucket_id = 'colmenas' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete colmenas" ON storage.objects;
CREATE POLICY "Admin can delete colmenas" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'colmenas' AND public.is_admin());

-- Step 8: Consolidate storage policies for arboles bucket
DROP POLICY IF EXISTS "Admin can upload arboles" ON storage.objects;
CREATE POLICY "Admin can upload arboles" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'arboles'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admin can update arboles" ON storage.objects;
CREATE POLICY "Admin can update arboles" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'arboles' AND public.is_admin())
WITH CHECK (bucket_id = 'arboles' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete arboles" ON storage.objects;
CREATE POLICY "Admin can delete arboles" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'arboles' AND public.is_admin());

-- Step 9: Consolidate storage policies for fuentes bucket
DROP POLICY IF EXISTS "Admin can upload fuentes" ON storage.objects;
CREATE POLICY "Admin can upload fuentes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fuentes'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Admin can update fuentes" ON storage.objects;
CREATE POLICY "Admin can update fuentes" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'fuentes' AND public.is_admin())
WITH CHECK (bucket_id = 'fuentes' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete fuentes" ON storage.objects;
CREATE POLICY "Admin can delete fuentes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'fuentes' AND public.is_admin());

-- Step 10: Consolidate storage policies for avatars bucket
DROP POLICY IF EXISTS storage_avatars_insert ON storage.objects;
CREATE POLICY storage_avatars_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS storage_avatars_update ON storage.objects;
CREATE POLICY storage_avatars_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS storage_avatars_delete ON storage.objects;
CREATE POLICY storage_avatars_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- Step 11: Update productos table RLS to use is_admin()
DROP POLICY IF EXISTS productos_admin_all ON public.productos;
CREATE POLICY productos_admin_all ON public.productos
FOR ALL
USING (public.is_admin());

-- Step 12: Update user_roles CHECK constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('comprador', 'suscriptor', 'revendedor', 'embajador', 'creador', 'rep_ventas'));

-- Step 13: Update default role for profiles
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'admin';
