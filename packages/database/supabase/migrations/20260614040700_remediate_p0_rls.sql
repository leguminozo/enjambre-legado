-- Migration: 20260614040700_remediate_p0_rls
-- Purpose: Remediate P0 RLS vulnerabilities (ventas INSERT policy, sii-certificados storage, and avatars storage).

-- 1. RLS-01: Remove overly permissive insert policy on public.ventas
-- The web checkout flow runs on the server and uses createAdminClient() (service_role),
-- which bypasses RLS. Keeping this policy open allows anonymous users to inject fake web sales.
DROP POLICY IF EXISTS "Service role can insert web sales" ON public.ventas;

-- 2. RLS-02: Secure storage.objects for 'sii-certificados' bucket
-- The upload policy was open to public/anonymous. We restrict it to authenticated users who belong to the corresponding company.
DROP POLICY IF EXISTS "sii_certificados_upload" ON storage.objects;
CREATE POLICY "sii_certificados_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sii-certificados'
    AND public.has_empresa_access((storage.foldername(name))[1]::UUID)
  );

-- 3. RLS-03: Secure storage.objects for 'avatars' bucket
-- Authenticated users were able to insert, update, or delete any avatar.
-- We restrict this so users can only manage objects in their own directory (where the second folder segment matches their auth.uid() UUID), or if they are admin.
DROP POLICY IF EXISTS storage_avatars_insert ON storage.objects;
CREATE POLICY storage_avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[2]::UUID = auth.uid()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS storage_avatars_update ON storage.objects;
CREATE POLICY storage_avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[2]::UUID = auth.uid()
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[2]::UUID = auth.uid()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS storage_avatars_delete ON storage.objects;
CREATE POLICY storage_avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[2]::UUID = auth.uid()
      OR public.is_admin()
    )
  );
