-- 65: Red de Intercambio — capabilities creador + contratos operador feria
-- Ver docs/RED_INTERCAMBIO_LEGAL.md para decisiones jurídicas asociadas.

-- ═══ 1. CAPABILITIES CONFIGURABLES EN CREADORES ═══
ALTER TABLE public.creadores
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{
    "puede_retirar": true,
    "tope_retiro_mensual": 500000,
    "puede_ver_ranking": false,
    "material_descargable": ["ficha_producto"],
    "canales_permitidos": ["instagram", "tiktok", "youtube", "blog", "podcast", "otro"]
  }'::jsonb;

COMMENT ON COLUMN public.creadores.capabilities IS
  'Flags configurables por admin. Ver docs/RED_INTERCAMBIO_LEGAL.md §2.';

-- ═══ 2. AMPLIAR solicitar_retiro_creador CON CAPABILITIES ═══
CREATE OR REPLACE FUNCTION public.solicitar_retiro_creador(
  p_user_id UUID,
  p_monto NUMERIC,
  p_metodo_pago TEXT,
  p_datos_pago JSONB
)
RETURNS TABLE(id UUID, monto_solicitado NUMERIC, estado TEXT) AS $$
DECLARE
  v_creador_id UUID;
  v_balance NUMERIC;
  v_retiros_pendientes INT;
  v_caps JSONB;
  v_puede_retirar BOOLEAN;
  v_tope_mensual NUMERIC;
  v_retirado_mes NUMERIC;
BEGIN
  SELECT c.id, c.capabilities
  INTO v_creador_id, v_caps
  FROM public.creadores c
  WHERE c.user_id = p_user_id AND c.estado = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_CREATOR';
  END IF;

  v_puede_retirar := COALESCE((v_caps->>'puede_retirar')::boolean, true);
  IF NOT v_puede_retirar THEN
    RAISE EXCEPTION 'RETIROS_DISABLED';
  END IF;

  v_tope_mensual := COALESCE((v_caps->>'tope_retiro_mensual')::numeric, 500000);

  PERFORM pg_advisory_xact_lock(hashtext(v_creador_id::text));

  SELECT balance_disponible INTO v_balance
  FROM public.creador_balance_view
  WHERE creador_id = v_creador_id;

  IF v_balance < p_monto THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  SELECT COALESCE(SUM(r.monto_solicitado), 0) INTO v_retirado_mes
  FROM public.creador_retiros r
  WHERE r.creador_id = v_creador_id
    AND r.estado IN ('pendiente', 'aprobado', 'pagado')
    AND r.created_at >= date_trunc('month', NOW());

  IF v_retirado_mes + p_monto > v_tope_mensual THEN
    RAISE EXCEPTION 'MONTHLY_LIMIT_EXCEEDED';
  END IF;

  SELECT COUNT(*) INTO v_retiros_pendientes
  FROM public.creador_retiros
  WHERE creador_id = v_creador_id AND estado = 'pendiente';

  IF v_retiros_pendientes >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY_PENDING';
  END IF;

  INSERT INTO public.creador_retiros (creador_id, monto_solicitado, metodo_pago, datos_pago)
  VALUES (v_creador_id, p_monto, p_metodo_pago, p_datos_pago)
  RETURNING creador_retiros.id, creador_retiros.monto_solicitado, creador_retiros.estado
  INTO id, monto_solicitado, estado;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══ 3. OPERADOR FERIA — CONTRATOS ═══
DO $$ BEGIN
  CREATE TYPE participante_contrato_estado AS ENUM ('borrador', 'activo', 'suspendido', 'terminado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE participante_evento_estado AS ENUM ('programado', 'en_curso', 'cerrado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.participante_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('feria', 'evento', 'popup')),
  estado participante_contrato_estado NOT NULL DEFAULT 'borrador',
  comision_base_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00
    CHECK (comision_base_pct >= 0 AND comision_base_pct <= 50),
  bono_puntualidad_clp NUMERIC DEFAULT 0 CHECK (bono_puntualidad_clp >= 0),
  bono_volumen_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  tope_stock_consignado NUMERIC DEFAULT 0 CHECK (tope_stock_consignado >= 0),
  tope_efectivo_caja NUMERIC DEFAULT 0 CHECK (tope_efectivo_caja >= 0),
  honorario_fijo_mensual NUMERIC DEFAULT 0 CHECK (honorario_fijo_mensual >= 0),
  score_confianza INT NOT NULL DEFAULT 100 CHECK (score_confianza BETWEEN 0 AND 100),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  acepto_terminos_at TIMESTAMPTZ,
  acepto_terminos_version TEXT,
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participante_contrato_user ON public.participante_contrato(user_id);
CREATE INDEX IF NOT EXISTS idx_participante_contrato_estado ON public.participante_contrato(estado);

COMMENT ON TABLE public.participante_contrato IS
  'Contrato de prestación de servicios para operadores de feria/evento. Ver docs/RED_INTERCAMBIO_LEGAL.md §5.';

-- Trigger: activo requiere aceptación de términos
CREATE OR REPLACE FUNCTION public.check_participante_contrato_terminos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'activo' AND (NEW.acepto_terminos_at IS NULL OR NEW.acepto_terminos_version IS NULL) THEN
    RAISE EXCEPTION 'TERMS_NOT_ACCEPTED';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participante_contrato_terminos ON public.participante_contrato;
CREATE TRIGGER trg_participante_contrato_terminos
  BEFORE INSERT OR UPDATE ON public.participante_contrato
  FOR EACH ROW EXECUTE FUNCTION public.check_participante_contrato_terminos();

CREATE TABLE IF NOT EXISTS public.participante_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.participante_contrato(id) ON DELETE CASCADE,
  nombre_evento TEXT NOT NULL,
  ubicacion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado participante_evento_estado NOT NULL DEFAULT 'programado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participante_evento_contrato ON public.participante_evento(contrato_id);

CREATE TABLE IF NOT EXISTS public.participante_consignacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.participante_evento(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  cantidad_entregada NUMERIC NOT NULL CHECK (cantidad_entregada > 0),
  cantidad_vendida NUMERIC NOT NULL DEFAULT 0 CHECK (cantidad_vendida >= 0),
  cantidad_devuelta NUMERIC NOT NULL DEFAULT 0 CHECK (cantidad_devuelta >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT consignacion_balance CHECK (
    cantidad_vendida + cantidad_devuelta <= cantidad_entregada
  )
);

CREATE INDEX IF NOT EXISTS idx_participante_consignacion_evento ON public.participante_consignacion(evento_id);

CREATE TABLE IF NOT EXISTS public.participante_arqueo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.participante_evento(id) ON DELETE CASCADE,
  stock_teorico NUMERIC NOT NULL DEFAULT 0,
  stock_contado NUMERIC NOT NULL DEFAULT 0,
  efectivo_teorico NUMERIC NOT NULL DEFAULT 0,
  efectivo_contado NUMERIC NOT NULL DEFAULT 0,
  diferencia_stock NUMERIC GENERATED ALWAYS AS (stock_contado - stock_teorico) STORED,
  diferencia_efectivo NUMERIC GENERATED ALWAYS AS (efectivo_contado - efectivo_teorico) STORED,
  notas TEXT,
  cerrado_at TIMESTAMPTZ,
  cerrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participante_arqueo_evento ON public.participante_arqueo(evento_id);

-- ═══ 4. RLS ═══
ALTER TABLE public.participante_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participante_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participante_consignacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participante_arqueo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operador ve su contrato" ON public.participante_contrato;
CREATE POLICY "Operador ve su contrato" ON public.participante_contrato
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin gestiona contratos feria" ON public.participante_contrato;
CREATE POLICY "Admin gestiona contratos feria" ON public.participante_contrato
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Operador ve sus eventos" ON public.participante_evento;
CREATE POLICY "Operador ve sus eventos" ON public.participante_evento
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.participante_contrato c
      WHERE c.id = contrato_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin gestiona eventos feria" ON public.participante_evento;
CREATE POLICY "Admin gestiona eventos feria" ON public.participante_evento
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona consignaciones" ON public.participante_consignacion;
CREATE POLICY "Admin gestiona consignaciones" ON public.participante_consignacion
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Operador ve consignaciones de sus eventos" ON public.participante_consignacion;
CREATE POLICY "Operador ve consignaciones de sus eventos" ON public.participante_consignacion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.participante_evento e
      JOIN public.participante_contrato c ON c.id = e.contrato_id
      WHERE e.id = evento_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin gestiona arqueos" ON public.participante_arqueo;
CREATE POLICY "Admin gestiona arqueos" ON public.participante_arqueo
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Operador ve arqueos de sus eventos" ON public.participante_arqueo;
CREATE POLICY "Operador ve arqueos de sus eventos" ON public.participante_arqueo
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.participante_evento e
      JOIN public.participante_contrato c ON c.id = e.contrato_id
      WHERE e.id = evento_id AND c.user_id = auth.uid()
    )
  );