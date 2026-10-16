-- =============================================================================
-- 20261016180000 — Centralización neutral y dinámica de Tiers de Guardián
--
-- Elimina restricciones rígidas de enum biológico ('OBRERA', 'ZÁNGANO', etc.),
-- añade nombre_display, icono, color_token y activo a guardian_tier_configs,
-- actualiza evaluar_tier_cliente y dinamiza user_tier_view como SSOT de tiers.
-- =============================================================================

-- 1. Relajar restricciones CHECK rígidas en guardian_tier_configs y profiles
ALTER TABLE public.guardian_tier_configs
  DROP CONSTRAINT IF EXISTS guardian_tier_configs_tier_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_override_check;

-- 2. Añadir columnas de marca y presentación dinámica
ALTER TABLE public.guardian_tier_configs
  ADD COLUMN IF NOT EXISTS nombre_display TEXT,
  ADD COLUMN IF NOT EXISTS icono TEXT NOT NULL DEFAULT '🌱',
  ADD COLUMN IF NOT EXISTS color_token TEXT NOT NULL DEFAULT 'accent',
  ADD COLUMN IF NOT EXISTS beneficios JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- 3. Sembrar/actualizar nombres nobles de lujo territorial y purgar vocabulario prohibido
UPDATE public.guardian_tier_configs
SET
  nombre_display = CASE
    WHEN tier = 'OBRERA' THEN 'Iniciador'
    WHEN tier = 'ZÁNGANO' THEN 'Aliado del Enjambre'
    WHEN tier = 'REINA' THEN 'Círculo de la Reina'
    WHEN tier = 'COLMENA' THEN 'Guardián Legado'
    ELSE COALESCE(nombre_display, tier)
  END,
  icono = CASE
    WHEN tier = 'OBRERA' THEN '🌱'
    WHEN tier = 'ZÁNGANO' THEN '🌿'
    WHEN tier = 'REINA' THEN '👑'
    WHEN tier = 'COLMENA' THEN '✨'
    ELSE COALESCE(icono, '🛡️')
  END,
  color_token = CASE
    WHEN tier = 'OBRERA' THEN 'muted'
    WHEN tier = 'ZÁNGANO' THEN 'warning'
    WHEN tier = 'REINA' THEN 'accent'
    WHEN tier = 'COLMENA' THEN 'info'
    ELSE COALESCE(color_token, 'accent')
  END,
  etiqueta_narrativa = CASE
    WHEN tier = 'OBRERA' THEN 'Acceso fundacional y registro de vínculo territorial en el bosque nativo.'
    WHEN tier = 'ZÁNGANO' THEN 'Vínculo activo con acceso preferente a recolecciones estacionales limitadas.'
    WHEN tier = 'REINA' THEN 'Presencia consolidada con asignación prioritaria en partidas de origen.'
    WHEN tier = 'COLMENA' THEN 'Máxima distinción territorial con reserva directa sobre lotes de autor.'
    ELSE etiqueta_narrativa
  END
WHERE tier IN ('OBRERA', 'ZÁNGANO', 'REINA', 'COLMENA');

-- Si hay filas sin nombre_display, asegurar fallback
UPDATE public.guardian_tier_configs
SET nombre_display = tier
WHERE nombre_display IS NULL;

ALTER TABLE public.guardian_tier_configs
  ALTER COLUMN nombre_display SET NOT NULL;

-- 4. Actualizar función RPC evaluar_tier_cliente para ser 100% dinámica
CREATE OR REPLACE FUNCTION public.evaluar_tier_cliente(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ciclos NUMERIC;
  v_spent NUMERIC(19,4);
  v_referrals INT;
  v_trees INT;
  v_current_tier TEXT;
  v_override TEXT;
  v_initial_tier TEXT := 'OBRERA';
  v_new_tier TEXT;
  v_tier_row RECORD;
  v_curr_prio INT := 1;
  v_new_prio INT := 1;
BEGIN
  -- 1. Determinar tier inicial según menor prioridad activa
  SELECT tier INTO v_initial_tier
  FROM public.guardian_tier_configs
  WHERE activo = true
  ORDER BY priority ASC
  LIMIT 1;

  v_initial_tier := COALESCE(v_initial_tier, 'OBRERA');
  v_new_tier := v_initial_tier;

  -- 2. Leer métricas acumuladas del usuario
  SELECT COALESCE(SUM(c.cantidad), 0)
  INTO v_ciclos
  FROM public.ciclos c WHERE c.user_id = p_user_id;

  SELECT COALESCE(SUM(v.total), 0)
  INTO v_spent
  FROM public.ventas v WHERE v.user_id = p_user_id;

  SELECT COUNT(*)
  INTO v_referrals
  FROM public.profiles p WHERE p.referred_by = p_user_id;

  SELECT COALESCE(SUM(ap.cantidad), 0)
  INTO v_trees
  FROM public.arboles_plantados ap WHERE ap.user_id = p_user_id;

  -- 3. Leer tier actual y override manual
  SELECT nivel_guardian, tier_override
  INTO v_current_tier, v_override
  FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN v_initial_tier; END IF;

  -- Admin override directo
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- 4. Evaluación dinámica según guardian_tier_configs en orden de prioridad descendente
  FOR v_tier_row IN
    SELECT tier, min_ciclos, min_spent, min_trees, priority
    FROM public.guardian_tier_configs
    WHERE activo = true
    ORDER BY priority DESC
  LOOP
    IF v_ciclos >= v_tier_row.min_ciclos
       AND v_spent >= v_tier_row.min_spent
       AND v_trees >= v_tier_row.min_trees
    THEN
      v_new_tier := v_tier_row.tier;
      v_new_prio := v_tier_row.priority;
      EXIT;
    END IF;
  END LOOP;

  -- 5. Regla de oro: solo sube de nivel, nunca desciende
  IF v_current_tier IS NOT NULL THEN
    SELECT priority INTO v_curr_prio
    FROM public.guardian_tier_configs
    WHERE tier = v_current_tier;

    IF COALESCE(v_curr_prio, 1) > v_new_prio THEN
      v_new_tier := v_current_tier;
    END IF;
  END IF;

  -- 6. Actualizar perfiles y balances si hubo promoción
  IF v_new_tier IS DISTINCT FROM v_current_tier THEN
    UPDATE public.profiles
    SET nivel_guardian = v_new_tier,
        tier_promoted_at = now(),
        updated_at = now()
    WHERE id = p_user_id;

    UPDATE public.loyalty_balances
    SET tier_actual = v_new_tier,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Dinamizar user_tier_view eliminando el CASE hardcodeado
DROP VIEW IF EXISTS public.user_tier_view;

CREATE OR REPLACE VIEW public.user_tier_view WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  COALESCE(lb.ciclos_historicos, (SELECT COALESCE(SUM(c.cantidad), 0) FROM public.ciclos c WHERE c.user_id = p.id)) AS ciclos_historicos,
  COALESCE(lb.tier_actual, p.nivel_guardian, 'OBRERA') AS tier,
  COALESCE(gtc.nombre_display, lb.tier_actual, p.nivel_guardian, 'Iniciador') AS tier_nombre,
  COALESCE(gtc.icono, '🌱') AS tier_icono,
  COALESCE(gtc.color_token, 'accent') AS tier_color_token,
  COALESCE(gtc.etiqueta_narrativa, '') AS tier_narrativa,
  COALESCE(gtc.priority, 1) AS tier_priority
FROM public.profiles p
LEFT JOIN public.loyalty_balances lb ON lb.user_id = p.id
LEFT JOIN public.guardian_tier_configs gtc ON gtc.tier = COALESCE(lb.tier_actual, p.nivel_guardian, 'OBRERA');

COMMENT ON VIEW public.user_tier_view IS
  'Vista dinámica de estado de tier por usuario conectada con guardian_tier_configs como SSOT.';
