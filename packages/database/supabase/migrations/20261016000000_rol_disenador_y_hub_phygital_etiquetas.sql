-- =============================================================================
-- Migration: 20261016000000_rol_disenador_y_hub_phygital_etiquetas.sql
--
-- 1. Rol de plataforma 'disenador':
--    Actualiza el check constraint en `profiles` para permitir 'disenador'
--    (Diseñador & Imprenta / Estudio de Producción Gráfica).
-- 2. Extensión de `qr_codes`:
--    Agrega columnas `tipo_destino`, `url_destino`, `metadata` para orquestar
--    la trazabilidad phygital (frasco físico -> experiencia digital).
-- 3. Tabla `etiquetas_artes`:
--    Almacena las especificaciones técnicas de etiquetas por frasco/producto
--    (medidas, sustrato, acabados, QR asociado) y los archivos imprimibles
--    maestros (PDF, AI, PSD, SVG) subibles desde Núcleo para descarga de imprenta.
-- 4. Bucket de Storage `etiquetas`:
--    Garantiza bucket público para artes de etiqueta y archivos de imprenta.
-- 5. RLS y permisos:
--    Políticas seguras para admin y diseñador.
-- =============================================================================

-- ── 1. Actualizar check constraint de roles en profiles ─────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
      'admin',
      'apicultor',
      'territorial',
      'cliente',
      'creador',
      'rep_ventas',
      'operador',
      'colaborador',
      'disenador'
    ));
END $$;

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'Platform RoleKey: admin | apicultor | territorial | cliente | creador | rep_ventas | operador | colaborador | disenador';

-- ── 2. Extender tabla qr_codes con columnas phygital ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'tipo_destino'
  ) THEN
    ALTER TABLE public.qr_codes
      ADD COLUMN tipo_destino TEXT DEFAULT 'cata_sensorial'
      CHECK (tipo_destino IN ('cata_sensorial', 'pasaporte_lote', 'tienda_producto', 'frasco_autenticidad'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'url_destino'
  ) THEN
    ALTER TABLE public.qr_codes
      ADD COLUMN url_destino TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.qr_codes
      ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ── 3. Tabla etiquetas_artes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.etiquetas_artes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id          UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  variante_id          UUID REFERENCES public.producto_variantes(id) ON DELETE SET NULL,
  lote_id              TEXT,
  qr_codigo            TEXT,
  nombre               TEXT NOT NULL,
  tipo                 TEXT NOT NULL DEFAULT 'frontal'
                       CHECK (tipo IN ('frontal', 'dorsal', 'troquel', 'faja_seguridad', 'completa', 'set_completo')),
  dimensiones_mm       TEXT NOT NULL DEFAULT '140 x 55 mm',
  sustrato             TEXT NOT NULL DEFAULT 'Papel autoadhesivo Tintoretto texturado',
  acabados             TEXT DEFAULT 'Barniz UV sectorizado y foil oro metálico',
  archivo_url          TEXT NOT NULL,
  archivo_nombre       TEXT NOT NULL,
  archivo_tamano_bytes BIGINT DEFAULT 0,
  archivo_tipo         TEXT DEFAULT 'pdf'
                       CHECK (archivo_tipo IN ('pdf', 'ai', 'psd', 'svg', 'png', 'zip', 'otro')),
  version              TEXT NOT NULL DEFAULT 'v1.0',
  notas_imprenta       TEXT,
  estado               TEXT NOT NULL DEFAULT 'aprobado_imprenta'
                       CHECK (estado IN ('borrador', 'en_revision', 'aprobado_imprenta', 'en_produccion', 'obsoleto')),
  activo               BOOLEAN NOT NULL DEFAULT true,
  empresa_id           UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_artes_producto
  ON public.etiquetas_artes (producto_id)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_etiquetas_artes_variante
  ON public.etiquetas_artes (variante_id);

CREATE INDEX IF NOT EXISTS idx_etiquetas_artes_lote
  ON public.etiquetas_artes (lote_id);

-- Trigger de updated_at para etiquetas_artes
CREATE OR REPLACE FUNCTION public.touch_etiquetas_artes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_etiquetas_artes_updated_at ON public.etiquetas_artes;
CREATE TRIGGER tr_touch_etiquetas_artes_updated_at
  BEFORE UPDATE ON public.etiquetas_artes
  FOR EACH ROW EXECUTE FUNCTION public.touch_etiquetas_artes_updated_at();

-- ── 4. Storage Bucket para etiquetas ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'etiquetas',
  'etiquetas',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/postscript', 'application/illustrator',
    'application/x-photoshop', 'image/vnd.adobe.photoshop', 'application/zip',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- ── 5. Row Level Security ───────────────────────────────────────────────────
ALTER TABLE public.etiquetas_artes ENABLE ROW LEVEL SECURITY;

-- Lectura: admin, diseñador, operador, colaborador y autenticados con acceso de empresa
DROP POLICY IF EXISTS etiquetas_artes_select_p ON public.etiquetas_artes;
CREATE POLICY etiquetas_artes_select_p ON public.etiquetas_artes
  FOR SELECT
  USING (
    public.is_admin()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('disenador', 'operador', 'colaborador')
    OR public.has_empresa_access(empresa_id)
  );

-- Inserción / Modificación: admin o diseñador con sesión
DROP POLICY IF EXISTS etiquetas_artes_admin_all_p ON public.etiquetas_artes;
CREATE POLICY etiquetas_artes_admin_all_p ON public.etiquetas_artes
  FOR ALL
  USING (
    public.is_admin()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'disenador'
  )
  WITH CHECK (
    public.is_admin()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'disenador'
  );

-- Políticas de Storage para el bucket etiquetas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'storage_etiquetas_public_read'
  ) THEN
    CREATE POLICY storage_etiquetas_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id = 'etiquetas');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'storage_etiquetas_admin_write'
  ) THEN
    CREATE POLICY storage_etiquetas_admin_write ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'etiquetas'
        AND (
          public.is_admin()
          OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('disenador', 'operador')
        )
      );
  END IF;
END $$;
