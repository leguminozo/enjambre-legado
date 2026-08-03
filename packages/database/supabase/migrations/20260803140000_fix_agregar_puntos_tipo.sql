-- =============================================================================
-- Fix: agregar_puntos_usuario registraba SIEMPRE tipo='ganado', incluso cuando
-- p_puntos < 0 (ajustes, penalizaciones, devoluciones). Eso corrompía el ledger:
-- una devolución aparecía como "ganado" negativo en vez de "ajuste".
-- Además, los puntos negativos inflaban puntos_acumulados_total (que debe
-- reflejar SOLO ganancias reales, no el neto).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.agregar_puntos_usuario(
  p_user_id uuid,
  p_empresa_id uuid,
  p_puntos integer,
  p_venta_id text DEFAULT NULL::text,
  p_motivo text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_saldo_anterior INT;
  v_saldo_nuevo INT;
  v_nivel_anterior TEXT;
  v_nuevo_nivel TEXT;
  v_tipo TEXT;
  v_transaccion_id UUID;
BEGIN
  -- Tipo semántico del ledger: negativo = ajuste (no ganancia)
  IF p_puntos < 0 THEN
    v_tipo := 'ajuste';
  ELSE
    v_tipo := 'ganado';
  END IF;

  -- Obtener saldo anterior
  SELECT COALESCE(puntos, 0), nivel_actual INTO v_saldo_anterior, v_nivel_anterior
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;

  IF v_saldo_anterior IS NULL THEN
    v_saldo_anterior := 0;
    v_nivel_anterior := 'bronze';

    -- Crear registro si no existe (los puntos negativos jamás crean saldo negativo de cero)
    IF p_puntos < 0 THEN
      INSERT INTO puntos_fidelizacion (user_id, empresa_id, puntos, nivel_actual, puntos_acumulados_total)
      VALUES (p_user_id, p_empresa_id, 0, 'bronze', 0);
      v_saldo_nuevo := 0;
    ELSE
      INSERT INTO puntos_fidelizacion (user_id, empresa_id, puntos, nivel_actual, puntos_acumulados_total)
      VALUES (p_user_id, p_empresa_id, p_puntos, 'bronze', p_puntos);
      v_saldo_nuevo := p_puntos;
    END IF;
  ELSE
    -- Actualizar puntos; acumulado total solo suma ganancias reales
    UPDATE puntos_fidelizacion
    SET
      puntos = puntos + p_puntos,
      puntos_acumulados_total = puntos_acumulados_total + GREATEST(p_puntos, 0),
      updated_at = now()
    WHERE user_id = p_user_id AND empresa_id = p_empresa_id;

    v_saldo_nuevo := v_saldo_anterior + p_puntos;
  END IF;

  -- Registrar transacción con el tipo correcto
  INSERT INTO puntos_transacciones (
    user_id, empresa_id, venta_id, tipo, puntos,
    saldo_anterior, saldo_nuevo, motivo, metadata
  ) VALUES (
    p_user_id, p_empresa_id, p_venta_id, v_tipo, p_puntos,
    v_saldo_anterior, v_saldo_nuevo, p_motivo, p_metadata
  ) RETURNING id INTO v_transaccion_id;

  -- Verificar si el usuario subió de nivel (solo aplica con ganancias)
  IF p_puntos > 0 THEN
    SELECT nivel INTO v_nuevo_nivel
    FROM (
      SELECT nivel
      FROM niveles_fidelizacion
      WHERE empresa_id = p_empresa_id AND activo = true AND puntos_requeridos <= v_saldo_nuevo
      ORDER BY puntos_requeridos DESC
      LIMIT 1
    ) sub;

    IF v_nuevo_nivel IS NULL THEN
      v_nuevo_nivel := 'bronze';
    END IF;

    -- Actualizar nivel si cambió
    IF v_nuevo_nivel != v_nivel_anterior THEN
      UPDATE puntos_fidelizacion
      SET nivel_actual = v_nuevo_nivel, updated_at = now()
      WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
    END IF;
  END IF;

  RETURN v_transaccion_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.agregar_puntos_usuario(uuid, uuid, integer, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agregar_puntos_usuario(uuid, uuid, integer, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agregar_puntos_usuario(uuid, uuid, integer, text, text, jsonb) TO service_role;
