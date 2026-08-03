-- =============================================================================
-- Migration 1009: Bucket privado de audio de la bitácora apícola.
-- Clon del patrón de 1005_certificados_sanitarios_bucket.sql: privado,
-- owner (auth.uid()) o is_admin(). El audio es la fuente de verdad (§5).
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('bitacora-audio', 'bitacora-audio', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_bitacora_audio_read ON storage.objects;
DROP POLICY IF EXISTS storage_bitacora_audio_insert ON storage.objects;
DROP POLICY IF EXISTS storage_bitacora_audio_update ON storage.objects;
DROP POLICY IF EXISTS storage_bitacora_audio_delete ON storage.objects;

CREATE POLICY storage_bitacora_audio_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'bitacora-audio'
    AND (owner = auth.uid() OR public.is_admin())
  );
CREATE POLICY storage_bitacora_audio_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'bitacora-audio'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('m4a', 'mp4', 'webm', 'ogg', 'wav')
  );
CREATE POLICY storage_bitacora_audio_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'bitacora-audio'
    AND (owner = auth.uid() OR public.is_admin())
  ) WITH CHECK (bucket_id = 'bitacora-audio');
CREATE POLICY storage_bitacora_audio_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'bitacora-audio'
    AND (owner = auth.uid() OR public.is_admin())
  );
