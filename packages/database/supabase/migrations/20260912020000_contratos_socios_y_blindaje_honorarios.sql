-- =============================================================================
-- 20260912020000 — Contratos de Socios, Blindaje Laboral y Boletas de Honorarios
--
-- 1. Documenta bono_puntualidad_clp como "Bono de Apertura de Evento"
--    (meta logística objetiva; no control horario ni de jornada).
-- 2. Añade columnas a participante_contrato para gestión documental de contratos.
-- 3. Crea bucket privado 'contratos_socios' con políticas RLS para lectura y subida.
-- =============================================================================

-- 1. Aclaración semántica sobre Bono de Apertura de Evento (Anti-Subordinación Art. 7 CdT)
COMMENT ON COLUMN public.participante_contrato.bono_puntualidad_clp IS
  'Bono de Apertura de Evento: meta logística objetiva (caja abierta y stock operativo en ventana ferial programada). NO constituye control horario, reloj de asistencia ni directriz laboral.';

-- 2. Extensión de participante_contrato para archivo y ciclo de vida documental
ALTER TABLE public.participante_contrato
  ADD COLUMN IF NOT EXISTS documento_plantilla_url TEXT,
  ADD COLUMN IF NOT EXISTS documento_firmado_url TEXT,
  ADD COLUMN IF NOT EXISTS documento_firmado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documento_version TEXT DEFAULT '2026-v1';

COMMENT ON COLUMN public.participante_contrato.documento_plantilla_url IS
  'Ruta o URL del PDF plantilla/borrador que el operador descarga para revisión y firma.';
COMMENT ON COLUMN public.participante_contrato.documento_firmado_url IS
  'Ruta en storage del contrato firmado y subido por el revendedor/operador.';
COMMENT ON COLUMN public.participante_contrato.documento_firmado_at IS
  'Timestamp de la carga del documento contractual firmado.';
COMMENT ON COLUMN public.participante_contrato.documento_version IS
  'Identificador de versión de los términos contractuales aplicables.';

-- 3. Aprovisionamiento de Storage Bucket Privado 'contratos_socios'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contratos_socios',
  'contratos_socios',
  false,
  10485760, -- 10 MB límite
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Políticas RLS para contratos_socios
DROP POLICY IF EXISTS "storage_contratos_socios_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_contratos_socios_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_contratos_socios_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_contratos_socios_delete" ON storage.objects;

-- SELECT: El socio lee solo su carpeta personal; administradores leen todo
CREATE POLICY "storage_contratos_socios_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contratos_socios'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- INSERT: El socio solo puede subir a su propia carpeta (o admins)
CREATE POLICY "storage_contratos_socios_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contratos_socios'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- UPDATE: Socio sobre su archivo o admin
CREATE POLICY "storage_contratos_socios_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contratos_socios'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (bucket_id = 'contratos_socios');

-- DELETE: Solo admin puede purgar contratos archivados
CREATE POLICY "storage_contratos_socios_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contratos_socios'
    AND public.is_admin()
  );
