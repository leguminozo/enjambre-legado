-- Migración: Canje de unidades de sellos de guardián y sincronización de programas por producto
-- Permite redimir 10 sellos de cualquier producto por 1 unidad de cortesía y reiniciar el ciclo.

-- 1. Tabla de canjes de sellos
CREATE TABLE IF NOT EXISTS public.guardian_stamp_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.guardian_stamp_programs(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  unidades_canjeadas INT NOT NULL DEFAULT 10,
  unidad_gratis INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'aprobado' CHECK (status IN ('pendiente', 'aprobado', 'entregado', 'cancelado')),
  origen TEXT NOT NULL DEFAULT 'billetera' CHECK (origen IN ('billetera', 'feria', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stamp_redemptions_user ON public.guardian_stamp_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stamp_redemptions_program ON public.guardian_stamp_redemptions(program_id);

ALTER TABLE public.guardian_stamp_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stamp_redemptions_own ON public.guardian_stamp_redemptions;
CREATE POLICY stamp_redemptions_own ON public.guardian_stamp_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS stamp_redemptions_admin ON public.guardian_stamp_redemptions;
CREATE POLICY stamp_redemptions_admin ON public.guardian_stamp_redemptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- 2. Función RPC para canjear sellos y reiniciar el ciclo
CREATE OR REPLACE FUNCTION public.canjear_unidad_sello_guardian(
  p_program_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_target_user UUID;
  v_program RECORD;
  v_progress RECORD;
  v_net INT;
  v_redemption_id UUID;
BEGIN
  v_caller := auth.uid();
  v_target_user := COALESCE(p_user_id, v_caller);

  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Debes iniciar sesión para canjear sellos.');
  END IF;

  -- Seguridad: usuarios estándar solo pueden canjear sus propios sellos
  IF v_caller IS NOT NULL AND v_caller <> v_target_user THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_caller AND role IN ('admin', 'gerente')) THEN
      RETURN jsonb_build_object('success', false, 'error', 'forbidden', 'message', 'No tienes permiso para canjear en nombre de otro usuario.');
    END IF;
  END IF;

  -- 1. Obtener programa activo
  SELECT * INTO v_program
  FROM guardian_stamp_programs
  WHERE id = p_program_id AND activo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'program_not_found', 'message', 'El programa de sellos no existe o no está activo.');
  END IF;

  -- 2. Obtener progreso del usuario con bloqueo para consistencia concurrente
  SELECT * INTO v_progress
  FROM guardian_stamp_progress
  WHERE user_id = v_target_user AND program_id = p_program_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_stamps', 'message', 'Aún no tienes sellos acumulados en este producto.');
  END IF;

  v_net := GREATEST(0, v_progress.unidades_acumuladas - v_progress.unidades_canjeadas);

  IF v_net < v_program.unidades_requeridas THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'sellos_insuficientes',
      'message', 'Necesitas ' || v_program.unidades_requeridas || ' sellos para canjear este producto (llevas ' || v_net || ').',
      'net', v_net,
      'requeridas', v_program.unidades_requeridas
    );
  END IF;

  -- 3. Reiniciar ciclo deduciendo las unidades requeridas
  UPDATE guardian_stamp_progress
  SET
    unidades_canjeadas = guardian_stamp_progress.unidades_canjeadas + v_program.unidades_requeridas,
    updated_at = now()
  WHERE user_id = v_target_user AND program_id = p_program_id;

  -- 4. Registrar la redención
  INSERT INTO guardian_stamp_redemptions (
    user_id,
    program_id,
    producto_id,
    unidades_canjeadas,
    unidad_gratis,
    status,
    origen
  )
  VALUES (
    v_target_user,
    p_program_id,
    v_program.producto_id,
    v_program.unidades_requeridas,
    v_program.unidad_gratis,
    'aprobado',
    'billetera'
  )
  RETURNING id INTO v_redemption_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Unidad de cortesía canjeada con éxito! Tu ciclo se ha reiniciado.',
    'redemption_id', v_redemption_id,
    'producto_id', v_program.producto_id,
    'unidades_canjeadas_total', v_progress.unidades_canjeadas + v_program.unidades_requeridas,
    'nuevo_saldo_ciclo', v_net - v_program.unidades_requeridas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.canjear_unidad_sello_guardian(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.canjear_unidad_sello_guardian(UUID, UUID) TO authenticated, service_role;

-- 3. Enriquecer increment_guardian_stamps para resolver variantes de productos
CREATE OR REPLACE FUNCTION public.increment_guardian_stamps(
  p_user_id UUID,
  p_venta_id TEXT,
  p_channel TEXT,
  p_lineas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line JSONB;
  v_product_id UUID;
  v_qty INT;
  v_program RECORD;
  v_updated JSONB := '[]'::jsonb;
BEGIN
  IF p_user_id IS NULL OR p_lineas IS NULL OR jsonb_typeof(p_lineas) <> 'array' THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lineas)
  LOOP
    v_product_id := COALESCE(
      NULLIF(v_line->>'productId', '')::uuid,
      NULLIF(v_line->>'producto_id', '')::uuid
    );
    v_qty := GREATEST(COALESCE((v_line->>'quantity')::int, (v_line->>'cantidad')::int, 1), 0);

    IF v_product_id IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;

    -- Resuelve programa tanto por ID directo como por variante vinculada al producto matriz
    FOR v_program IN
      SELECT gsp.*
      FROM guardian_stamp_programs gsp
      LEFT JOIN producto_variantes pv ON pv.id = v_product_id
      WHERE (gsp.producto_id = v_product_id OR gsp.producto_id = pv.producto_id)
        AND gsp.activo = true
        AND (p_channel = ANY(gsp.canales) OR p_channel IS NULL)
    LOOP
      IF EXISTS (
        SELECT 1 FROM guardian_stamp_events
        WHERE venta_id = p_venta_id AND program_id = v_program.id
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO guardian_stamp_progress (user_id, program_id, unidades_acumuladas, ultima_venta_id)
      VALUES (p_user_id, v_program.id, v_qty, p_venta_id)
      ON CONFLICT (user_id, program_id) DO UPDATE
      SET
        unidades_acumuladas = guardian_stamp_progress.unidades_acumuladas + EXCLUDED.unidades_acumuladas,
        ultima_venta_id = EXCLUDED.ultima_venta_id,
        updated_at = now();

      INSERT INTO guardian_stamp_events (user_id, program_id, venta_id, unidades, source)
      VALUES (
        p_user_id,
        v_program.id,
        p_venta_id,
        v_qty,
        CASE
          WHEN p_channel IN ('feria', 'local') THEN p_channel
          ELSE 'web'
        END
      );

      v_updated := v_updated || jsonb_build_object(
        'program_id', v_program.id,
        'producto_id', v_product_id,
        'unidades', v_qty
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

-- 4. Semilla de programas canónicos para productos visibles sin programa activo
INSERT INTO public.guardian_stamp_programs (
  producto_id,
  nombre,
  unidades_requeridas,
  unidad_gratis,
  activo,
  canales,
  wallet_label,
  bonus_resena
)
SELECT
  p.id,
  'Tarjeta de Sellos · ' || COALESCE(p.nombre, 'Miel de Autor'),
  10,
  1,
  true,
  ARRAY['web', 'feria', 'local'],
  COALESCE(p.nombre, 'Miel de Autor'),
  true
FROM public.productos p
WHERE p.visible = true
  AND NOT EXISTS (
    SELECT 1 FROM public.guardian_stamp_programs gsp
    WHERE gsp.producto_id = p.id
  );
