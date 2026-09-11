-- =============================================================================
-- 20260911000000 — Centralización de incentivos, tiers y condiciones B2B
--
-- Transforma los valores hardcodeados de lealtad, tramos mayoristas y tiers
-- de guardián en tablas Postgres gobernables 100% desde Núcleo sin deploy.
-- =============================================================================

-- 1. Ampliar beneficios_enjambre con tasas de loyalty, reseñas y carrito
INSERT INTO public.beneficios_enjambre (clave, valor_numerico, descripcion) VALUES
  ('puntos_canje_bloque',          100,   'Cantidad de puntos necesarios por cada bloque de canje'),
  ('clp_descuento_bloque',         1000,  'Pesos CLP de descuento aplicados por cada bloque de puntos'),
  ('clp_gasto_por_punto',          100,   'Pesos CLP de compra necesarios para acumular 1 punto'),
  ('ciclos_por_resena',            5,     'Ciclos del Néctar acreditados al aprobar una reseña sensorial'),
  ('cart_abandonment_grace_minutes', 30,  'Minutos de espera antes de enviar recordatorio de carrito abandonado')
ON CONFLICT (clave) DO NOTHING;

-- 2. Tabla de configuración de Tiers de Guardián (Ciclos del Néctar)
CREATE TABLE IF NOT EXISTS public.guardian_tier_configs (
  tier TEXT PRIMARY KEY CHECK (tier IN ('OBRERA', 'ZÁNGANO', 'REINA', 'COLMENA')),
  min_ciclos NUMERIC NOT NULL CHECK (min_ciclos >= 0),
  min_spent NUMERIC NOT NULL DEFAULT 0 CHECK (min_spent >= 0),
  min_trees INT NOT NULL DEFAULT 0 CHECK (min_trees >= 0),
  priority INT NOT NULL UNIQUE CHECK (priority > 0),
  etiqueta_narrativa TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.guardian_tier_configs (tier, min_ciclos, min_spent, min_trees, priority, etiqueta_narrativa) VALUES
  ('OBRERA',  0,    0,       0,  1, 'Nivel inicial de entrada al enjambre'),
  ('ZÁNGANO', 500,  50000,   0,  2, 'Custodio recurrente con acceso a cosechas selectas'),
  ('REINA',   2000, 300000,  5,  3, 'Liderazgo en custodia y acceso preferente anual'),
  ('COLMENA', 5000, 1000000, 10, 4, 'Máximo estatus biocultural con lotes ultra-limitados')
ON CONFLICT (tier) DO NOTHING;

ALTER TABLE public.guardian_tier_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardian_tier_configs_read"
  ON public.guardian_tier_configs FOR SELECT
  USING (true);

CREATE POLICY "guardian_tier_configs_admin"
  ON public.guardian_tier_configs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.guardian_tier_configs TO anon, authenticated;
GRANT ALL ON public.guardian_tier_configs TO authenticated;

-- 3. Actualizar función RPC evaluar_tier_cliente para leer de guardian_tier_configs
CREATE OR REPLACE FUNCTION public.evaluar_tier_cliente(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ciclos NUMERIC;
  v_spent NUMERIC(19,4);
  v_referrals INT;
  v_trees INT;
  v_current_tier TEXT;
  v_override TEXT;
  v_new_tier TEXT := 'OBRERA';
  v_tier_row RECORD;
  v_curr_prio INT := 1;
  v_new_prio INT := 1;
BEGIN
  -- Leer métricas
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

  -- Leer tier actual y override
  SELECT nivel_guardian, tier_override
  INTO v_current_tier, v_override
  FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN 'OBRERA'; END IF;

  -- Admin override
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- Resolución dinámica de tier según guardian_tier_configs en orden de prioridad descendente
  FOR v_tier_row IN
    SELECT tier, min_ciclos, min_spent, min_trees, priority
    FROM public.guardian_tier_configs
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

  -- Solo sube de nivel, nunca desciende
  SELECT priority INTO v_curr_prio
  FROM public.guardian_tier_configs
  WHERE tier = v_current_tier;

  IF COALESCE(v_curr_prio, 1) > v_new_prio THEN
    v_new_tier := COALESCE(v_current_tier, 'OBRERA');
  END IF;

  -- Actualizar si cambió
  IF v_new_tier IS DISTINCT FROM v_current_tier THEN
    UPDATE public.profiles
    SET nivel_guardian = v_new_tier,
        tier_promoted_at = now(),
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Tablas para condiciones comerciales mayoristas B2B
CREATE TABLE IF NOT EXISTS public.b2b_wholesale_rules (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  moq_frascos_mixtos INT NOT NULL DEFAULT 120 CHECK (moq_frascos_mixtos > 0),
  moq_sachets INT NOT NULL DEFAULT 500 CHECK (moq_sachets > 0),
  umbral_despacho_gratis_rm_neto_clp NUMERIC NOT NULL DEFAULT 900000 CHECK (umbral_despacho_gratis_rm_neto_clp >= 0),
  temperatura_minima_celsius INT NOT NULL DEFAULT 15,
  temperatura_maxima_celsius INT NOT NULL DEFAULT 25,
  dias_habiles_inspeccion INT NOT NULL DEFAULT 5,
  dias_maximo_reclamo INT NOT NULL DEFAULT 30,
  dias_garantia_devolucion INT NOT NULL DEFAULT 15,
  porcentaje_contenido_minimo_devolucion INT NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.b2b_wholesale_rules (
  id,
  moq_frascos_mixtos,
  moq_sachets,
  umbral_despacho_gratis_rm_neto_clp,
  temperatura_minima_celsius,
  temperatura_maxima_celsius,
  dias_habiles_inspeccion,
  dias_maximo_reclamo,
  dias_garantia_devolucion,
  porcentaje_contenido_minimo_devolucion
) VALUES (
  1, 120, 500, 900000, 15, 25, 5, 30, 15, 80
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.b2b_wholesale_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "b2b_wholesale_rules_read"
  ON public.b2b_wholesale_rules FOR SELECT
  USING (true);

CREATE POLICY "b2b_wholesale_rules_admin"
  ON public.b2b_wholesale_rules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.b2b_wholesale_rules TO anon, authenticated;
GRANT ALL ON public.b2b_wholesale_rules TO authenticated;

-- Tramos de inversión B2B
CREATE TABLE IF NOT EXISTS public.b2b_investment_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desde_clp NUMERIC NOT NULL CHECK (desde_clp >= 0),
  hasta_clp NUMERIC CHECK (hasta_clp IS NULL OR hasta_clp > desde_clp),
  descuento_pct NUMERIC NOT NULL CHECK (descuento_pct >= 0 AND descuento_pct <= 1),
  etiqueta TEXT NOT NULL,
  prioridad INT NOT NULL UNIQUE CHECK (prioridad > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.b2b_investment_tiers (desde_clp, hasta_clp, descuento_pct, etiqueta, prioridad) VALUES
  (0, 499999, 0.00, 'Base (< $500.000)', 1),
  (500000, 999999, 0.05, 'Volumen 5% ($500.000 – $999.999)', 2),
  (1000000, NULL, 0.10, 'Mayorista Preferente 10% (≥ $1.000.000)', 3)
ON CONFLICT (prioridad) DO NOTHING;

ALTER TABLE public.b2b_investment_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "b2b_investment_tiers_read"
  ON public.b2b_investment_tiers FOR SELECT
  USING (true);

CREATE POLICY "b2b_investment_tiers_admin"
  ON public.b2b_investment_tiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.b2b_investment_tiers TO anon, authenticated;
GRANT ALL ON public.b2b_investment_tiers TO authenticated;

-- 5. Actualizar moderar_resena_producto para parametrizar ciclos según beneficios_enjambre
CREATE OR REPLACE FUNCTION public.moderar_resena_producto(
  p_resena_id UUID,
  p_estado TEXT,
  p_moderator_id UUID,
  p_ciclos_guardian NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resena public.resenas_producto%ROWTYPE;
  v_ciclos NUMERIC := 0;
  v_default_ciclos NUMERIC := 5;
BEGIN
  IF p_estado NOT IN ('aprobada', 'rechazada', 'oculta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_estado');
  END IF;

  SELECT * INTO v_resena
  FROM public.resenas_producto
  WHERE id = p_resena_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_resena.estado = p_estado THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  UPDATE public.resenas_producto
  SET
    estado = p_estado,
    moderated_at = now(),
    moderated_by = p_moderator_id,
    updated_at = now()
  WHERE id = p_resena_id;

  IF p_estado = 'aprobada'
    AND v_resena.modo = 'guardian'
    AND v_resena.user_id IS NOT NULL
    AND v_resena.venta_id IS NOT NULL
    AND v_resena.ciclos_otorgados = 0
  THEN
    IF p_ciclos_guardian IS NOT NULL THEN
      v_ciclos := GREATEST(p_ciclos_guardian, 0);
    ELSE
      SELECT COALESCE(valor_numerico, 5) INTO v_default_ciclos
      FROM public.beneficios_enjambre
      WHERE clave = 'ciclos_por_resena';
      v_ciclos := GREATEST(COALESCE(v_default_ciclos, 5), 0);
    END IF;

    IF v_ciclos > 0 THEN
      INSERT INTO public.ciclos (
        user_id, cantidad, tipo, referencia_id, referencia_tabla
      ) VALUES (
        v_resena.user_id, v_ciclos, 'resena_sensorial', p_resena_id::text, 'resenas_producto'
      );

      UPDATE public.resenas_producto
      SET ciclos_otorgados = v_ciclos
      WHERE id = p_resena_id;
    END IF;
  END IF;

  IF p_estado = 'aprobada'
    AND v_resena.modo = 'guardian'
    AND v_resena.user_id IS NOT NULL
  THEN
    PERFORM bonus_stamp_resena(v_resena.user_id, v_resena.producto_id, p_resena_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'estado', p_estado,
    'ciclos_otorgados', v_ciclos
  );
END;
$$;
