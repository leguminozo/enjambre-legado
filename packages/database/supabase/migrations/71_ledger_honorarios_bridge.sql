-- 71: Puente incentivo_ledger → honorarios (F29 / retención art. 42 N°2)
-- Ver docs/RED_INTERCAMBIO_LEGAL.md §5

ALTER TABLE public.honorarios
  ADD COLUMN IF NOT EXISTS incentivo_ledger_id UUID
    REFERENCES public.incentivo_ledger(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_honorarios_incentivo_ledger_unique
  ON public.honorarios(incentivo_ledger_id)
  WHERE incentivo_ledger_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.preparar_honorario_desde_ledger(
  p_ledger_id UUID,
  p_empresa_id UUID,
  p_fecha TIMESTAMPTZ,
  p_tercero_rut TEXT,
  p_tercero_nombre TEXT,
  p_numero_bhe TEXT DEFAULT NULL,
  p_tasa_retencion NUMERIC DEFAULT 0.1525
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ledger RECORD;
  v_tercero_id UUID;
  v_periodo_id UUID;
  v_honorario_id UUID;
  v_monto_retencion NUMERIC;
  v_mes INT;
  v_anio INT;
  v_rut TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_tercero_rut IS NULL OR btrim(p_tercero_rut) = '' THEN
    RAISE EXCEPTION 'TERCERO_RUT_REQUIRED';
  END IF;

  IF p_tercero_nombre IS NULL OR btrim(p_tercero_nombre) = '' THEN
    RAISE EXCEPTION 'TERCERO_NOMBRE_REQUIRED';
  END IF;

  IF p_tasa_retencion IS NULL OR p_tasa_retencion < 0 OR p_tasa_retencion > 1 THEN
    RAISE EXCEPTION 'INVALID_TASA_RETENCION';
  END IF;

  SELECT * INTO v_ledger
  FROM incentivo_ledger
  WHERE id = p_ledger_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEDGER_NOT_FOUND';
  END IF;

  IF v_ledger.estado IS DISTINCT FROM 'aprobado' THEN
    RAISE EXCEPTION 'LEDGER_NOT_APPROVED';
  END IF;

  IF v_ledger.referencia_tabla = 'honorarios' AND v_ledger.referencia_id IS NOT NULL THEN
    RAISE EXCEPTION 'LEDGER_ALREADY_BRIDGED';
  END IF;

  IF v_ledger.tipo NOT IN ('honorario_feria', 'bono_puntualidad', 'bono_volumen', 'ajuste_admin') THEN
    RAISE EXCEPTION 'LEDGER_TIPO_NOT_HONORARIO';
  END IF;

  IF EXISTS (
    SELECT 1 FROM honorarios h WHERE h.incentivo_ledger_id = p_ledger_id
  ) THEN
    RAISE EXCEPTION 'HONORARIO_ALREADY_EXISTS';
  END IF;

  v_rut := upper(replace(btrim(p_tercero_rut), '.', ''));

  INSERT INTO terceros (empresa_id, tipo, rut, nombre)
  VALUES (p_empresa_id, 'proveedor', v_rut, btrim(p_tercero_nombre))
  ON CONFLICT (empresa_id, rut) DO UPDATE
    SET nombre = EXCLUDED.nombre,
        updated_at = NOW()
  RETURNING id INTO v_tercero_id;

  v_mes := EXTRACT(MONTH FROM p_fecha)::int;
  v_anio := EXTRACT(YEAR FROM p_fecha)::int;

  SELECT id INTO v_periodo_id
  FROM periodos_contables
  WHERE empresa_id = p_empresa_id
    AND mes = v_mes
    AND anio = v_anio
  LIMIT 1;

  IF v_periodo_id IS NULL THEN
    INSERT INTO periodos_contables (empresa_id, mes, anio, estado)
    VALUES (p_empresa_id, v_mes, v_anio, 'abierto')
    RETURNING id INTO v_periodo_id;
  END IF;

  v_monto_retencion := round(v_ledger.monto * p_tasa_retencion);

  INSERT INTO honorarios (
    empresa_id,
    periodo_id,
    tercero_id,
    fecha,
    monto_bruto,
    monto_retencion,
    tasa_retencion,
    numero_bhe,
    descripcion,
    estado,
    incentivo_ledger_id
  )
  VALUES (
    p_empresa_id,
    v_periodo_id,
    v_tercero_id,
    p_fecha,
    v_ledger.monto,
    v_monto_retencion,
    p_tasa_retencion,
    NULLIF(btrim(p_numero_bhe), ''),
    COALESCE(
      NULLIF(btrim(v_ledger.notas), ''),
      'Honorario feria — ' || v_ledger.tipo::text || ' (ledger ' || left(p_ledger_id::text, 8) || ')'
    ),
    'pendiente',
    p_ledger_id
  )
  RETURNING id INTO v_honorario_id;

  UPDATE incentivo_ledger
  SET referencia_tabla = 'honorarios',
      referencia_id = v_honorario_id
  WHERE id = p_ledger_id;

  RETURN jsonb_build_object(
    'honorario_id', v_honorario_id,
    'ledger_id', p_ledger_id,
    'monto_bruto', v_ledger.monto,
    'monto_retencion', v_monto_retencion,
    'tercero_id', v_tercero_id,
    'periodo_id', v_periodo_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preparar_honorario_desde_ledger(
  UUID, UUID, TIMESTAMPTZ, TEXT, TEXT, TEXT, NUMERIC
) TO authenticated;

COMMENT ON FUNCTION public.preparar_honorario_desde_ledger IS
  'Admin: crea registro honorarios (borrador F29) desde incentivo_ledger aprobado. No marca pagado ni emite DTE automáticamente.';