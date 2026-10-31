-- ═══════════════════════════════════════════════════════════════════════════
-- 1010_cuaderno_crud.sql — Cuaderno de Campo v2: dueño administra sus datos
-- + capa manual de la red semántica (cuaderno_nodos / cuaderno_aristas).
--
-- Referencias:
--   - docs/BITACORA_APICOLA.md §9 (cuaderno CRUD + red semántica)
--   - Auditoría RLS completa (565 políticas en ~55 migraciones, 2026-08-04)
--
-- AUDITORÍA RLS — resultado documentado:
--   RELAJADO (el dueño de la cuenta administra sus propios datos):
--     * colmenas_delete / inspecciones_delete / varroa_records_delete /
--       peso_records_delete (migración 40) eran solo-gerente; el borrado del
--       apicultor fallaba en silencio (ApiarioManager, CuadernoCampoPanel).
--       Ahora: user_id = auth.uid() OR public.is_gerente(), consistente con
--       tratamientos/muestras (FOR ALL dueño, migración 1006).
--     * actores_registro no tenía política DELETE (migración 991); se crea
--       "actores_own_delete" para que cada actor elimine su perfil.
--
--   MANTENIDO INTACTO (por diseño o por ser datos de empresa/sistema):
--     * Ledgers inmutables: qr_audit_trail, puntos_transacciones, ciclos,
--       resenas_sensoriales (políticas USING (false) para UPDATE/DELETE).
--     * cosechas / lotes: anclados en blockchain (blockchain_hash UNIQUE) y
--       referenciados por qr_codes — borrarlos huérfanaría anchors y QR
--       pasaportes; escritura gerente-only (migración 40).
--     * Datos de empresa/sistema: bank_movements, boletas_ingest,
--       sii_sync_runs, source_files, integrations, configuracion_ia,
--       descuentos, crm_*, qr_codes, evento_rep_assignments (admin/gerente).
--     * Ya owner-based correctos: apiarios (FOR ALL dueño), calendario_eventos,
--       storage, y el módulo territorial (predios_*, apiarios_externos,
--       alertas_*, apiarios_registro).
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 1. RELAJACIÓN DE POLÍTICAS DELETE (migración 40 era solo-gerente)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS colmenas_delete ON public.colmenas;
CREATE POLICY colmenas_delete ON public.colmenas
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

DROP POLICY IF EXISTS inspecciones_delete ON public.inspecciones;
CREATE POLICY inspecciones_delete ON public.inspecciones
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

DROP POLICY IF EXISTS varroa_records_delete ON public.varroa_records;
CREATE POLICY varroa_records_delete ON public.varroa_records
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

DROP POLICY IF EXISTS peso_records_delete ON public.peso_records;
CREATE POLICY peso_records_delete ON public.peso_records
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

-- actores_registro (991): faltaba DELETE — cada actor elimina su perfil
DROP POLICY IF EXISTS "actores_own_delete" ON public.actores_registro;
CREATE POLICY "actores_own_delete" ON public.actores_registro
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

-- ---------------------------------------------------------------------------
-- 2. CAPA MANUAL DE LA RED SEMÁNTICA DEL CUADERNO
--    Nodos/aristas libres (observaciones, decisiones, tensiones)
--    adaptados al dominio apícola territorial.
--    Los nodos derivados (colmenas, hojas, tratamientos…) NO se persisten:
--    el BFF los compone desde las tablas canónicas. Solo la capa manual vive
--    en estas tablas.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cuaderno_nodos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colmena_id  UUID REFERENCES public.colmenas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL DEFAULT 'observacion'
              CHECK (tipo IN ('observacion', 'decision', 'tension', 'otro')),
  label       TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  descripcion TEXT,
  x           DOUBLE PRECISION,
  y           DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cuaderno_nodos_user_idx   ON public.cuaderno_nodos (user_id);
CREATE INDEX IF NOT EXISTS cuaderno_nodos_colmena_idx ON public.cuaderno_nodos (colmena_id);

CREATE TABLE IF NOT EXISTS public.cuaderno_aristas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- source/target pueden apuntar a cualquier nodo de la red (colmena, hoja,
  -- tratamiento, muestra, varroa, cuaderno_nodos): sin FK por heterogeneidad.
  source_id  UUID NOT NULL,
  target_id  UUID NOT NULL,
  relacion   TEXT NOT NULL DEFAULT 'observa'
             CHECK (relacion IN ('deriva_de', 'observa', 'tension', 'analogia', 'otro')),
  label      TEXT CHECK (char_length(label) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cuaderno_aristas_user_idx   ON public.cuaderno_aristas (user_id);
CREATE INDEX IF NOT EXISTS cuaderno_aristas_source_idx ON public.cuaderno_aristas (source_id);

ALTER TABLE public.cuaderno_nodos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuaderno_aristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cuaderno_nodos_own" ON public.cuaderno_nodos;
CREATE POLICY "cuaderno_nodos_own" ON public.cuaderno_nodos
  FOR ALL USING (user_id = auth.uid() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

DROP POLICY IF EXISTS "cuaderno_aristas_own" ON public.cuaderno_aristas;
CREATE POLICY "cuaderno_aristas_own" ON public.cuaderno_aristas
  FOR ALL USING (user_id = auth.uid() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

COMMENT ON TABLE  public.cuaderno_nodos  IS 'Capa manual de la red semántica del cuaderno de campo (observaciones/decisiones/tensiones). Los nodos derivados no se persisten aquí.';
COMMENT ON TABLE  public.cuaderno_aristas IS 'Aristas manuales entre nodos de la red del cuaderno (deriva_de, observa, tension, analogia, otro).';
COMMENT ON COLUMN public.cuaderno_nodos.x IS 'Posición X en el lienzo (solo nodos manuales; los derivados usan auto-layout).';
COMMENT ON COLUMN public.cuaderno_nodos.y IS 'Posición Y en el lienzo (solo nodos manuales).';
