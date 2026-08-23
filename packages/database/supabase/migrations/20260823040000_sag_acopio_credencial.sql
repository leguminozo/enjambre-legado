-- =============================================================================
-- Bloque restante del entrelazado territorial — auditoría 2026-08-23
-- 1. sag_declaraciones: histórico de presentación SAG (hoy el PDF es
--    desechable; no queda rastro de "presentado").
-- 2. acopio_declaraciones: intención de acopio por temporada (comercial_acopio).
-- 3. evaluar_nivel_acreditacion(): credencial DERIVADA de actividad
--    documentada, no copy estático.
-- =============================================================================

-- ── 1. Histórico SAG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sag_declaraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.actores_registro(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  periodo TEXT NOT NULL,
  n_colmenas_declaradas INTEGER NOT NULL DEFAULT 0,
  n_colmenas_vivas INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'presentada', 'rechazada')),
  presentado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sag_declaraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY sag_declaraciones_own ON public.sag_declaraciones
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_gerente()
  );

CREATE INDEX IF NOT EXISTS sag_declaraciones_actor_idx
  ON public.sag_declaraciones (actor_id);

DROP TRIGGER IF EXISTS sag_declaraciones_updated_at ON public.sag_declaraciones;
CREATE TRIGGER sag_declaraciones_updated_at
  BEFORE UPDATE ON public.sag_declaraciones
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 2. Intención de acopio ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.acopio_declaraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.actores_registro(id) ON DELETE CASCADE,
  temporada TEXT NOT NULL,
  volumen_kg NUMERIC NOT NULL DEFAULT 0 CHECK (volumen_kg >= 0),
  zona TEXT,
  estado TEXT NOT NULL DEFAULT 'propuesta'
    CHECK (estado IN ('propuesta', 'confirmada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.acopio_declaraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY acopio_declaraciones_own ON public.acopio_declaraciones
  FOR ALL USING (
    actor_id IN (SELECT id FROM public.actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  );

CREATE INDEX IF NOT EXISTS acopio_declaraciones_actor_idx
  ON public.acopio_declaraciones (actor_id);

DROP TRIGGER IF EXISTS acopio_declaraciones_updated_at ON public.acopio_declaraciones;
CREATE TRIGGER acopio_declaraciones_updated_at
  BEFORE UPDATE ON public.acopio_declaraciones
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 3. Credencial derivada de actividad ───────────────────────────────────────
-- base         → censo completo
-- trazable     → ≥1 apiario activo declarado Y ≥1 cosecha real vinculada
--                (vía apiario_origen_id → colmenas → cosechas)
-- comprometido → trazable Y consentimiento mapa_comunitario
-- referente    → solo admin (validación por pares; no automatizable)
CREATE OR REPLACE FUNCTION public.evaluar_nivel_acreditacion(p_actor_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_completo boolean;
  v_apiarios_activos integer;
  v_cosechas integer;
  v_mapa boolean;
BEGIN
  SELECT ar.completo, ar.consentimientos->>'mapa_comunitario' = 'true'
    INTO v_completo, v_mapa
  FROM public.actores_registro ar
  WHERE ar.id = p_actor_id;

  IF v_completo IS NULL OR NOT v_completo THEN
    RETURN 'base';
  END IF;

  SELECT count(*) INTO v_apiarios_activos
  FROM public.apiarios_registro ar
  WHERE ar.actor_id = p_actor_id AND ar.activo = true;

  SELECT count(*) INTO v_cosechas
  FROM public.cosechas c
  JOIN public.colmenas co ON co.id = c.colmena_id
  JOIN public.apiarios_registro ar
    ON ar.apiario_origen_id = co.apiario_id
  WHERE ar.actor_id = p_actor_id;

  IF v_apiarios_activos < 1 OR v_cosechas < 1 THEN
    RETURN 'base';
  END IF;

  IF v_mapa THEN
    RETURN 'comprometido';
  END IF;

  RETURN 'trazable';
END;
$$;

-- Backfill: recalcular credencial de los actores existentes.
UPDATE public.actores_registro ar
SET nivel_acreditacion = public.evaluar_nivel_acreditacion(ar.id)
WHERE ar.completo = true
  AND ar.nivel_acreditacion NOT IN ('referente');