-- 66: Ledger unificado de incentivos + cierre de arqueo feria
-- Ver docs/RED_INTERCAMBIO_LEGAL.md §5 y §8

DO $$ BEGIN
  CREATE TYPE public.incentivo_tipo AS ENUM (
    'comision_venta',
    'bono_puntualidad',
    'bono_volumen',
    'honorario_feria',
    'comision_creador',
    'liquidacion_creador',
    'ajuste_admin'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.incentivo_estado AS ENUM ('pendiente', 'aprobado', 'pagado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.incentivo_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participante_tipo TEXT NOT NULL CHECK (participante_tipo IN ('creador', 'rep_ventas', 'operador_feria')),
  tipo public.incentivo_tipo NOT NULL,
  monto NUMERIC(19,4) NOT NULL CHECK (monto >= 0),
  moneda TEXT NOT NULL DEFAULT 'CLP',
  estado public.incentivo_estado NOT NULL DEFAULT 'pendiente',
  referencia_tabla TEXT,
  referencia_id UUID,
  evento_id UUID REFERENCES public.participante_evento(id) ON DELETE SET NULL,
  contrato_id UUID REFERENCES public.participante_contrato(id) ON DELETE SET NULL,
  notas TEXT,
  aprobado_por UUID REFERENCES auth.users(id),
  aprobado_at TIMESTAMPTZ,
  pagado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentivo_ledger_user ON public.incentivo_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_incentivo_ledger_estado ON public.incentivo_ledger(estado);
CREATE INDEX IF NOT EXISTS idx_incentivo_ledger_evento ON public.incentivo_ledger(evento_id);

COMMENT ON TABLE public.incentivo_ledger IS
  'Ledger de incentivos/honorarios fuera de commission_records y creador_comisiones. Pagos requieren revisión admin.';

ALTER TABLE public.incentivo_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve su ledger" ON public.incentivo_ledger;
CREATE POLICY "Usuario ve su ledger" ON public.incentivo_ledger
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin gestiona ledger" ON public.incentivo_ledger;
CREATE POLICY "Admin gestiona ledger" ON public.incentivo_ledger
  FOR ALL USING (public.is_admin());

-- Vista unificada (solo lectura) para panel admin
CREATE OR REPLACE VIEW public.incentivo_unificado_view AS
SELECT
  cr.id,
  cr.rep_id AS user_id,
  'rep_ventas'::text AS participante_tipo,
  'comision_venta'::public.incentivo_tipo AS tipo,
  cr.total_commission AS monto,
  'CLP'::text AS moneda,
  CASE WHEN cr.paid THEN 'pagado'::public.incentivo_estado ELSE 'pendiente'::public.incentivo_estado END AS estado,
  'commission_records'::text AS origen_tabla,
  cr.created_at
FROM public.commission_records cr
UNION ALL
SELECT
  cc.id,
  c.user_id,
  'creador'::text,
  'comision_creador'::public.incentivo_tipo,
  cc.monto,
  'CLP'::text,
  CASE cc.estado
    WHEN 'pagada' THEN 'pagado'::public.incentivo_estado
    WHEN 'aprobada' THEN 'aprobado'::public.incentivo_estado
    WHEN 'rechazada' THEN 'rechazado'::public.incentivo_estado
    ELSE 'pendiente'::public.incentivo_estado
  END,
  'creador_comisiones'::text,
  cc.created_at
FROM public.creador_comisiones cc
JOIN public.creadores c ON c.id = cc.creador_id
UNION ALL
SELECT
  il.id,
  il.user_id,
  il.participante_tipo,
  il.tipo,
  il.monto,
  il.moneda,
  il.estado,
  'incentivo_ledger'::text,
  il.created_at
FROM public.incentivo_ledger il;

-- Cierre de arqueo: registra diferencias y ajusta score de confianza
CREATE OR REPLACE FUNCTION public.cerrar_arqueo_feria(
  p_evento_id UUID,
  p_stock_teorico NUMERIC,
  p_stock_contado NUMERIC,
  p_efectivo_teorico NUMERIC,
  p_efectivo_contado NUMERIC,
  p_notas TEXT DEFAULT NULL,
  p_cerrado_por UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_arqueo_id UUID;
  v_contrato_id UUID;
  v_diff_stock NUMERIC;
  v_diff_efectivo NUMERIC;
  v_penalty INT := 0;
BEGIN
  SELECT e.contrato_id INTO v_contrato_id
  FROM participante_evento e
  JOIN participante_contrato c ON c.id = e.contrato_id
  WHERE e.id = p_evento_id
    AND e.estado IN ('programado', 'en_curso')
    AND (c.user_id = COALESCE(p_cerrado_por, auth.uid()) OR public.is_admin());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENTO_NO_DISPONIBLE';
  END IF;

  v_diff_stock := p_stock_contado - p_stock_teorico;
  v_diff_efectivo := p_efectivo_contado - p_efectivo_teorico;

  IF v_diff_stock < 0 THEN v_penalty := v_penalty + LEAST(20, ABS(v_diff_stock)::int); END IF;
  IF v_diff_efectivo < 0 THEN v_penalty := v_penalty + LEAST(30, (ABS(v_diff_efectivo) / 10000)::int); END IF;

  INSERT INTO participante_arqueo (
    evento_id, stock_teorico, stock_contado, efectivo_teorico, efectivo_contado,
    notas, cerrado_at, cerrado_por
  )
  VALUES (
    p_evento_id, p_stock_teorico, p_stock_contado, p_efectivo_teorico, p_efectivo_contado,
    p_notas, NOW(), p_cerrado_por
  )
  RETURNING id INTO v_arqueo_id;

  UPDATE participante_evento SET estado = 'cerrado' WHERE id = p_evento_id;

  IF v_penalty > 0 THEN
    UPDATE participante_contrato
    SET score_confianza = GREATEST(0, score_confianza - v_penalty)
    WHERE id = v_contrato_id;
  END IF;

  RETURN v_arqueo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cerrar_arqueo_feria TO authenticated;

-- FK a profiles para joins en UI (user_id = profiles.id)
ALTER TABLE public.participante_contrato
  DROP CONSTRAINT IF EXISTS participante_contrato_profiles_fkey;

ALTER TABLE public.participante_contrato
  ADD CONSTRAINT participante_contrato_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;