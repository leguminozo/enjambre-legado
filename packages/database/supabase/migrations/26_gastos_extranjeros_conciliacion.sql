CREATE TABLE IF NOT EXISTS public.gastos_extranjeros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  factura_compra_id UUID REFERENCES public.facturas_compra(id) ON DELETE SET NULL,
  proveedor_id TEXT NOT NULL,
  proveedor_rut TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  monto_original NUMERIC(19,4) NOT NULL CHECK (monto_original > 0),
  moneda_original TEXT NOT NULL DEFAULT 'USD' CHECK (moneda_original IN ('USD', 'EUR', 'CLP')),
  monto_clp NUMERIC(19,4) NOT NULL CHECK (monto_clp >= 0),
  tasa_cambio NUMERIC(19,6) NOT NULL DEFAULT 1,
  monto_neto NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (monto_neto >= 0),
  monto_exento NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (monto_exento >= 0),
  monto_iva NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (monto_iva >= 0),
  monto_total NUMERIC(19,4) NOT NULL CHECK (monto_total >= 0),
  fecha_emision DATE NOT NULL,
  numero_documento TEXT,
  concepto TEXT NOT NULL,
  detalle TEXT,
  receipt_raw TEXT,
  estado TEXT NOT NULL DEFAULT 'parseado' CHECK (estado IN ('parseado', 'facturado', 'enviado_sii', 'aceptado_sii', 'rechazado_sii')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_empresa ON public.gastos_extranjeros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_proveedor ON public.gastos_extranjeros(empresa_id, proveedor_id);
CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_fecha ON public.gastos_extranjeros(empresa_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_estado ON public.gastos_extranjeros(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_factura ON public.gastos_extranjeros(factura_compra_id);

ALTER TABLE public.gastos_extranjeros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_extranjeros_empresa_access" ON public.gastos_extranjeros
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE TABLE IF NOT EXISTS public.tasas_cambio_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'EUR')),
  valor NUMERIC(19,6) NOT NULL CHECK (valor > 0),
  fecha DATE NOT NULL,
  fuente TEXT NOT NULL DEFAULT 'mindicador.cl',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(moneda, fecha)
);

CREATE INDEX IF NOT EXISTS idx_tasas_cambio_moneda_fecha ON public.tasas_cambio_historial(moneda, fecha DESC);

ALTER TABLE public.tasas_cambio_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasas_cambio_read" ON public.tasas_cambio_historial
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.conciliaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  movimiento_id UUID REFERENCES public.banco_chile_movimientos(id) ON DELETE SET NULL,
  factura_compra_id UUID REFERENCES public.facturas_compra(id) ON DELETE SET NULL,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
  gasto_extranjero_id UUID REFERENCES public.gastos_extranjeros(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('auto', 'manual', 'sin_documento')),
  monto_movimiento NUMERIC(19,4),
  monto_documento NUMERIC(19,4),
  diferencia NUMERIC(19,4) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'desconciliada')),
  conciliado_por UUID REFERENCES auth.users(id),
  conciliado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conciliaciones_empresa ON public.conciliaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_movimiento ON public.conciliaciones(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_factura ON public.conciliaciones(factura_compra_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_venta ON public.conciliaciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_gasto ON public.conciliaciones(gasto_extranjero_id);

ALTER TABLE public.conciliaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conciliaciones_empresa_access" ON public.conciliaciones
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE TABLE IF NOT EXISTS public.proveedores_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  proveedor_id TEXT NOT NULL,
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  giro TEXT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'EUR', 'CLP')),
  con_iva BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, proveedor_id)
);

ALTER TABLE public.proveedores_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proveedores_config_empresa_access" ON public.proveedores_config
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE OR REPLACE FUNCTION public.auto_conciliar_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_factura_id UUID;
  v_monto_factura NUMERIC;
BEGIN
  IF NEW.conciliado = true AND OLD.conciliado = false AND NEW.rut_contraparte IS NOT NULL THEN
    SELECT fc.id, fc.monto_total INTO v_factura_id, v_monto_factura
    FROM public.facturas_compra fc
    WHERE fc.empresa_id = NEW.empresa_id
      AND fc.receptor_rut = NEW.rut_contraparte
      AND fc.monto_total = ABS(NEW.monto)
      AND fc.estado_sii IN ('aceptado', 'pendiente')
    LIMIT 1;

    IF v_factura_id IS NOT NULL THEN
      INSERT INTO public.conciliaciones (empresa_id, movimiento_id, factura_compra_id, tipo, monto_movimiento, monto_documento, diferencia)
      VALUES (NEW.empresa_id, NEW.id, v_factura_id, 'auto', ABS(NEW.monto), v_monto_factura, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_conciliar
  AFTER UPDATE ON public.banco_chile_movimientos
  FOR EACH ROW
  WHEN (NEW.conciliado = true AND OLD.conciliado = false)
  EXECUTE FUNCTION public.auto_conciliar_movimiento();

CREATE TABLE IF NOT EXISTS public.sumup_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  sumup_id TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  monto NUMERIC(19,4) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  estado TEXT NOT NULL DEFAULT 'successful' CHECK (estado IN ('successful', 'failed', 'refunded', 'pending')),
  tipo TEXT NOT NULL DEFAULT 'pos' CHECK (tipo IN ('pos', 'online', 'link')),
  producto TEXT,
  descripcion TEXT,
  rut_contraparte TEXT,
  nombre_contraparte TEXT,
  codigo_autorizacion TEXT,
  conciliado BOOLEAN NOT NULL DEFAULT false,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, sumup_id)
);

CREATE INDEX IF NOT EXISTS idx_sumup_transacciones_empresa ON public.sumup_transacciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sumup_transacciones_fecha ON public.sumup_transacciones(empresa_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_sumup_transacciones_estado ON public.sumup_transacciones(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_sumup_transacciones_conciliado ON public.sumup_transacciones(empresa_id, conciliado);

ALTER TABLE public.sumup_transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sumup_transacciones_empresa_access" ON public.sumup_transacciones
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE OR REPLACE FUNCTION public.auto_conciliar_sumup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_venta_id UUID;
  v_monto_venta NUMERIC;
BEGIN
  IF NEW.conciliado = true AND OLD.conciliado = false AND NEW.venta_id IS NULL THEN
    SELECT v.id, v.total INTO v_venta_id, v_monto_venta
    FROM public.ventas v
    WHERE v.empresa_id = NEW.empresa_id
      AND v.total = NEW.monto
      AND v.estado = 'completada'
    ORDER BY v.created_at DESC
    LIMIT 1;

    IF v_venta_id IS NOT NULL THEN
      UPDATE public.sumup_transacciones SET venta_id = v_venta_id WHERE id = NEW.id;

      INSERT INTO public.conciliaciones (empresa_id, venta_id, tipo, monto_movimiento, monto_documento, diferencia)
      VALUES (NEW.empresa_id, v_venta_id, 'auto', NEW.monto, v_monto_venta, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_conciliar_sumup
  AFTER UPDATE ON public.sumup_transacciones
  FOR EACH ROW
  WHEN (NEW.conciliado = true AND OLD.conciliado = false)
  EXECUTE FUNCTION public.auto_conciliar_sumup();

CREATE TABLE IF NOT EXISTS public.sumup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  merchant_code TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('live', 'test')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 30,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

ALTER TABLE public.sumup_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sumup_config_empresa_access" ON public.sumup_config
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE TABLE IF NOT EXISTS public.sumup_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  sumup_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYOUT', 'CHARGE_BACK_DEDUCTION', 'REFUND_DEDUCTION', 'DD_RETURN_DEDUCTION', 'BALANCE_DEDUCTION')),
  amount NUMERIC(19,4) NOT NULL,
  date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  fee NUMERIC(19,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUCCESSFUL', 'FAILED')),
  reference TEXT,
  transaction_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, sumup_id)
);

CREATE INDEX IF NOT EXISTS idx_sumup_payouts_empresa ON public.sumup_payouts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sumup_payouts_date ON public.sumup_payouts(empresa_id, date DESC);

ALTER TABLE public.sumup_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sumup_payouts_empresa_access" ON public.sumup_payouts
  FOR ALL USING (has_empresa_access(empresa_id));
