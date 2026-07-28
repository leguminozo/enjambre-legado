-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 102 — Cierre real CVE-N-004: añade `empresa_id` a `eventos`
-- (legacy monousuario en 00_initial_schema:198 sin scoping multi-tenant).
--
-- El IDOR cross-tenant en POST /api/rep-ventas/admin/feria/:eventoId/{pause,
-- resume,meta} (apps/nucleo/src/api/routes/rep-ventas.ts:653-727) se debe a
-- que `eventos` carece de cualquier FK a `empresas`. La RLS existente:
--   eventos_read   (40:99)  FOR SELECT TO authenticated USING (true)
--   eventos_write  (01:181) FOR ALL USING (is_gerente() OR current_role()='vendedor')
-- usa `is_gerente()` (= is_admin() global tras mig. 39, sin scope) y
-- `current_role()` (profiles.role global). Ambas son **cross-tenant por
-- construcción**.
--
-- Esta migration:
--  1. Añade `eventos.empresa_id UUID REFERENCES empresas(id)` NULLABLE.
--  2. Backfill: asigna empresa_id según el rep con mayor ventas del evento.
--  3. Reemplaza eventos_read/eventos_write con variantes que requieren
--     has_empresa_access(eventos.empresa_id) → fail-closed si NULL.
--  4. Index para acelerar el filtro por empresa.
--
-- NOTA: eventos sin rep asociado (legacy monousuario sin ventas) quedan con
-- empresa_id NULL y son NO-accesibles por RLS para end-users. Acceso via
-- service_role (BFF) sigue sin filtro (debe añadir scoping en el handler).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Añadir columna nullable (no NOT NULL todavía: permite migración sin lock).
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.eventos.empresa_id IS
  'Empresa owner del evento. NULL sólo para eventos legacy sin ventas asociadas; RLS fail-closed en NULL.';

-- 2) Backfill: el rep con más ventas del evento determina la empresa.
--ventas.vendedor_id → rep_profiles.user_id → rep_profiles.empresa_id.
UPDATE public.eventos e
SET empresa_id = sub.empresa_id
FROM (
  SELECT
    v.evento_id AS id,
    rp.empresa_id AS empresa_id,
    ROW_NUMBER() OVER (
      PARTITION BY v.evento_id
      ORDER BY COUNT(*) DESC, MAX(v.created_at) DESC
    ) AS rn
  FROM public.ventas v
  JOIN public.rep_profiles rp ON rp.user_id = v.vendedor_id
  WHERE v.evento_id IS NOT NULL
    AND rp.empresa_id IS NOT NULL
  GROUP BY v.evento_id, rp.empresa_id
) sub
WHERE e.id = sub.id AND sub.rn = 1 AND e.empresa_id IS NULL;

-- 3) Index para el scoping.
CREATE INDEX IF NOT EXISTS idx_eventos_empresa
  ON public.eventos (empresa_id)
  WHERE empresa_id IS NOT NULL;

-- 4) RLS: reemplazar las policies cross-tenant por variantes con
--    has_empresa_access(eventos.empresa_id) fallando-cerradas si NULL.
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eventos_read ON public.eventos;
DROP POLICY IF EXISTS eventos_write ON public.eventos;

-- Lectura: sólo miembros de la empresa owner del evento. NULL → no accesible.
CREATE POLICY eventos_read ON public.eventos
  FOR SELECT TO authenticated
  USING (public.has_empresa_access(eventos.empresa_id));

-- Escritura: miembros de la empresa owner + rol admin o rep_ventas per-tenant.
CREATE POLICY eventos_write ON public.eventos
  FOR ALL TO authenticated
  USING (
    public.has_empresa_access(eventos.empresa_id)
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.usuarios_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id = eventos.empresa_id
          AND ue.rol = 'rep_ventas'
      )
    )
  )
  WITH CHECK (
    public.has_empresa_access(eventos.empresa_id)
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.usuarios_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id = eventos.empresa_id
          AND ue.rol = 'rep_ventas'
      )
    )
  );

-- service_role sigue bypassando RLS. El BFF (apps/nucleo/src/api/routes/
-- rep-ventas.ts) debe añadir .eq('empresa_id', empresaId) en sus handlers
-- para no abusar del bypass — ya cubierto por este hotfix.

-- 5) Trigger-zópper opcional NO añadido: futuros INSERT desde el BFF deben
--    pasar empresa_id explícitamente. No auto-popular aquí para forzar
--    disciplina en los handlers.

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificación post-migration:
--   SELECT id, nombre, empresa_id FROM public.eventos ORDER BY created_at DESC LIMIT 10;
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'eventos';  -- true (ya estaba)
--   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'eventos';
-- ═══════════════════════════════════════════════════════════════════════════
