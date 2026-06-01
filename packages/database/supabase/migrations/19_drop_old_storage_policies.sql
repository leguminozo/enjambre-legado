-- 19: Drop permissive storage policies from migration 02
-- Migration 02 allowed any authenticated user to INSERT/UPDATE/DELETE on colmenas, productos, arboles
-- Migration 17 added admin-only INSERT/DELETE but didn't drop the old ones
-- Both policies apply (OR logic), so the old ones must be dropped

-- Drop old permissive INSERT policies
DROP POLICY IF EXISTS storage_colmenas_insert ON storage.objects;
DROP POLICY IF EXISTS storage_productos_insert ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_insert ON storage.objects;

-- Drop old permissive UPDATE policies (still any authenticated user)
DROP POLICY IF EXISTS storage_colmenas_update ON storage.objects;
DROP POLICY IF EXISTS storage_productos_update ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_update ON storage.objects;

-- Drop old permissive DELETE policies
DROP POLICY IF EXISTS storage_colmenas_delete ON storage.objects;
DROP POLICY IF EXISTS storage_productos_delete ON storage.objects;
DROP POLICY IF EXISTS storage_arboles_delete ON storage.objects;

-- Drop old fuentes INSERT/UPDATE/DELETE (migration 02 had admin check but via current_role())
DROP POLICY IF EXISTS storage_fuentes_insert ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_update ON storage.objects;
DROP POLICY IF EXISTS storage_fuentes_delete ON storage.objects;

-- Create admin-only UPDATE policies (not covered by migration 17)
DROP POLICY IF EXISTS "Admin can update productos" ON storage.objects;
CREATE POLICY "Admin can update productos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'productos'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
)
WITH CHECK (
  bucket_id = 'productos'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
);

DROP POLICY IF EXISTS "Admin can update colmenas" ON storage.objects;
CREATE POLICY "Admin can update colmenas" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'colmenas'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
)
WITH CHECK (
  bucket_id = 'colmenas'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
);

DROP POLICY IF EXISTS "Admin can update arboles" ON storage.objects;
CREATE POLICY "Admin can update arboles" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'arboles'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
)
WITH CHECK (
  bucket_id = 'arboles'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
);

DROP POLICY IF EXISTS "Admin can update fuentes" ON storage.objects;
CREATE POLICY "Admin can update fuentes" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'fuentes'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
)
WITH CHECK (
  bucket_id = 'fuentes'
  AND auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.role IN ('gerente', 'tienda_admin')
  )
);

-- SELECT policies for public buckets (colmenas, productos, arboles) remain open
-- since these are public=true buckets (images shown on storefront)
-- fuentes SELECT already restricted to admin in migration 02
