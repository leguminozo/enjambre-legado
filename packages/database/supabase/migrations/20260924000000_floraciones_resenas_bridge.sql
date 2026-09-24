-- =============================================================================
-- Migration 20260924000000: Puente reseñas ↔ floraciones
--
-- Vincula el motor de reseñas y catas (resenas_producto, perc_sesiones)
-- a la Biblioteca de Floraciones (especies_fenologicas) de forma aditiva:
--   · especies_fenologicas gana columna slug (identificador público estable)
--   · resenas_producto gana floracion_slug + temporada + campos de cata ampliada
--   · perc_sesiones gana especie_id + floracion_slug + temporada
--   · lotes gana floracion_slug (puente trazabilidad lote → floración)
--
-- Invariantes preservadas:
--   · producto_id sigue funcionando en todos los flujos existentes
--   · La escala 1-7 del rating no cambia
--   · RLS igual o más restrictivo — nunca menos
--   · umbral N≥30 para publicar perfil sensorial: invariante de negocio
-- =============================================================================

-- ─── 1. Slug público para especies fenológicas ────────────────────────────────

ALTER TABLE public.especies_fenologicas
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Índice único parcial: solo filas con slug no nulo deben ser únicos
-- (permite alter idempotente antes de seed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_especies_fenologicas_slug
  ON public.especies_fenologicas (slug)
  WHERE slug IS NOT NULL;

-- Seed de slugs para las 5 especies canónicas ya existentes
UPDATE public.especies_fenologicas
  SET slug = 'ulmo'
  WHERE nombre_cientifico = 'Eucryphia cordifolia' AND slug IS NULL;

UPDATE public.especies_fenologicas
  SET slug = 'tiaca'
  WHERE nombre_cientifico = 'Caldcluvia paniculata' AND slug IS NULL;

UPDATE public.especies_fenologicas
  SET slug = 'quillay'
  WHERE nombre_cientifico = 'Quillaja saponaria' AND slug IS NULL;

UPDATE public.especies_fenologicas
  SET slug = 'avellano-chileno'
  WHERE nombre_cientifico = 'Gevuina avellana' AND slug IS NULL;

UPDATE public.especies_fenologicas
  SET slug = 'tepa-arrayan'
  WHERE (nombre_cientifico ILIKE '%Laureliopsis%' OR nombre_cientifico ILIKE '%Luma apiculata%')
    AND slug IS NULL;

-- ─── 2. resenas_producto: floracion_slug + temporada + campos cata ampliada ───

-- 2a. producto_id: permitir NULL cuando la reseña es de floración (sin SKU asignado aún)
--     El CHECK nuevo garantiza que al menos uno de los dos esté presente.
ALTER TABLE public.resenas_producto
  ALTER COLUMN producto_id DROP NOT NULL;

-- 2b. Modo 'floracion' (discriminado del 'guardian' — no requiere venta_id)
ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_modo_check;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_modo_check
    CHECK (modo IN ('anonima', 'guardian', 'floracion'));

-- 2c. Nuevas columnas aditivas
ALTER TABLE public.resenas_producto
  ADD COLUMN IF NOT EXISTS floracion_slug   TEXT,
  ADD COLUMN IF NOT EXISTS temporada        TEXT,
  ADD COLUMN IF NOT EXISTS momento_recoleccion TEXT
    CHECK (momento_recoleccion IS NULL OR momento_recoleccion IN
      ('primera_extraccion', 'segunda_extraccion', 'tardio')),
  ADD COLUMN IF NOT EXISTS cosecha_fresca   BOOLEAN,
  ADD COLUMN IF NOT EXISTS pairing_botanico TEXT;

-- 2d. CHECK: siempre debe haber un sujeto (producto O floración)
ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_sujeto_check;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_sujeto_check
    CHECK (producto_id IS NOT NULL OR floracion_slug IS NOT NULL);

-- 2e. CHECK guardian ajustado: modo guardian SÍ requiere user_id
--     pero modo floracion NO requiere venta_id (puede ser sin compra)
ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_guardian_requires_user;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_guardian_requires_user
    CHECK (modo NOT IN ('guardian', 'floracion') OR user_id IS NOT NULL);

-- 2f. Índice público para reseñas de floración
CREATE INDEX IF NOT EXISTS idx_resenas_floracion_public
  ON public.resenas_producto (floracion_slug, created_at DESC)
  WHERE estado = 'aprobada' AND floracion_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resenas_floracion_temporada
  ON public.resenas_producto (floracion_slug, temporada, created_at DESC)
  WHERE estado = 'aprobada' AND floracion_slug IS NOT NULL AND temporada IS NOT NULL;

COMMENT ON COLUMN public.resenas_producto.floracion_slug IS
  'Slug de la especie fenológica. Permite reseñas de floración sin SKU asignado (modo floracion).';
COMMENT ON COLUMN public.resenas_producto.temporada IS
  'Temporada melífera (ej. ''2026-ulmo''). Permite segmentar reseñas por año/floración.';
COMMENT ON COLUMN public.resenas_producto.momento_recoleccion IS
  'Momento de la recolección: primera_extraccion, segunda_extraccion o tardio.';
COMMENT ON COLUMN public.resenas_producto.cosecha_fresca IS
  'true = miel acabada de recolectar; false = miel madurada/añejada.';
COMMENT ON COLUMN public.resenas_producto.pairing_botanico IS
  'Sugerencia de maridaje específico de floración (ej. "queso de cabra + pan integral").';

-- ─── 3. perc_sesiones: especie_id + floracion_slug + temporada ───────────────

ALTER TABLE public.perc_sesiones
  ADD COLUMN IF NOT EXISTS especie_id     UUID REFERENCES public.especies_fenologicas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS floracion_slug TEXT,
  ADD COLUMN IF NOT EXISTS temporada      TEXT;

CREATE INDEX IF NOT EXISTS idx_perc_sesiones_especie
  ON public.perc_sesiones (especie_id)
  WHERE especie_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_perc_sesiones_floracion
  ON public.perc_sesiones (floracion_slug, completo)
  WHERE floracion_slug IS NOT NULL;

COMMENT ON COLUMN public.perc_sesiones.especie_id IS
  'FK a especies_fenologicas. Permite agregar perfiles CATA por floración (umbral N≥30).';
COMMENT ON COLUMN public.perc_sesiones.floracion_slug IS
  'Slug de la floración evaluada (redundante con especie_id para consultas de texto).';
COMMENT ON COLUMN public.perc_sesiones.temporada IS
  'Temporada melífera evaluada (ej. ''2026-ulmo'').';

-- ─── 4. lotes: floracion_slug (puente trazabilidad) ──────────────────────────

ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS floracion_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_lotes_floracion_slug
  ON public.lotes (floracion_slug)
  WHERE floracion_slug IS NOT NULL;

COMMENT ON COLUMN public.lotes.floracion_slug IS
  'Floración dominante del lote. Completa la trazabilidad: lote → especie fenológica → biblioteca.';

-- ─── 5. RLS: políticas para el modo floracion ─────────────────────────────────

-- Lectura pública de reseñas de floración aprobadas (anon puede leer)
DROP POLICY IF EXISTS resenas_floracion_public_read ON public.resenas_producto;
CREATE POLICY resenas_floracion_public_read ON public.resenas_producto
  FOR SELECT
  USING (
    estado = 'aprobada'
    AND floracion_slug IS NOT NULL
    AND modo = 'floracion'
  );

-- Inserción de reseña de floración: usuario autenticado + estado pendiente
DROP POLICY IF EXISTS resenas_floracion_insert ON public.resenas_producto;
CREATE POLICY resenas_floracion_insert ON public.resenas_producto
  FOR INSERT
  WITH CHECK (
    modo = 'floracion'
    AND auth.uid() = user_id
    AND estado = 'pendiente'
    AND floracion_slug IS NOT NULL
  );

-- La política admin existente (resenas_producto_admin_all) ya cubre el modo floracion
-- porque aplica FOR ALL sin filtro de modo — no necesita duplicarse.
