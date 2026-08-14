-- =============================================================================
-- 20260812086000 — Tasa de puntos configurable (clp_por_punto)
--
-- Huérfano #2 del inventario: la tasa 1pt/$100 estaba fija en SQL
-- (calcular_puntos_compra). Ahora se lee de beneficios_enjambre con fallback
-- 100, así admin puede corregirla desde núcleo sin migración. Mismo
-- comportamiento actual si no se toca la config.
-- =============================================================================

INSERT INTO public.beneficios_enjambre (clave, valor_numerico, descripcion)
VALUES ('clp_por_punto', 100, 'CLP por punto — 1 punto por cada $100')
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.calcular_puntos_compra(
  p_user_id UUID,
  p_empresa_id UUID,
  p_monto_compra INT
)
RETURNS INT AS $$
DECLARE
  v_nivel TEXT;
  v_multiplicador NUMERIC(3, 2);
  v_clp_por_punto INT;
  v_puntos_base INT;
  v_puntos_finales INT;
BEGIN
  -- Obtener nivel actual del usuario
  SELECT nivel_actual INTO v_nivel
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;

  IF v_nivel IS NULL THEN
    v_nivel := 'bronze';
  END IF;

  -- Obtener multiplicador del nivel
  SELECT multiplicador_puntos INTO v_multiplicador
  FROM niveles_fidelizacion
  WHERE empresa_id = p_empresa_id AND nivel = v_nivel AND activo = true;

  IF v_multiplicador IS NULL THEN
    v_multiplicador := 1.00;
  END IF;

  -- Tasa configurable desde beneficios_enjambre (fallback 100 = 1pt/$100).
  -- CREATE OR REPLACE conserva los GRANTs existentes.
  SELECT valor_numerico::int INTO v_clp_por_punto
  FROM public.beneficios_enjambre
  WHERE clave = 'clp_por_punto';

  IF v_clp_por_punto IS NULL OR v_clp_por_punto <= 0 THEN
    v_clp_por_punto := 100;
  END IF;

  -- Calcular puntos (1 punto por cada $100 CLP por defecto, ajustado por multiplicador)
  v_puntos_base := p_monto_compra / v_clp_por_punto;
  v_puntos_finales := ROUND(v_puntos_base * v_multiplicador);

  RETURN v_puntos_finales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
