-- Banco Chile Empresas Integration
-- Soporte para APIs: Movimientos y Saldos, Abono en línea, Cotizaciones, Nominas, Documentos, Auth
-- Migración 21 - Mayo 2026

-- 1. Tabla para credenciales y configuración de Banco Chile
CREATE TABLE IF NOT EXISTS public.banco_chile_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla para tokens de autenticación
CREATE TABLE IF NOT EXISTS public.banco_chile_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.banco_chile_config(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla para cuentas bancarias
CREATE TABLE IF NOT EXISTS public.banco_chile_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.banco_chile_config(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_cuenta TEXT NOT NULL,
  tipo_cuenta TEXT NOT NULL CHECK (tipo_cuenta IN ('corriente', 'vista', 'ahorro', 'empresas')),
  moneda TEXT NOT NULL DEFAULT 'CLP',
  saldo_disponible NUMERIC(18, 2) NOT NULL DEFAULT 0,
  saldo_contable NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ultimo_movimiento TIMESTAMPTZ,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_id, numero_cuenta)
);

-- 4. Tabla para movimientos bancarios
CREATE TABLE IF NOT EXISTS public.banco_chile_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES public.banco_chile_cuentas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fecha_contable DATE NOT NULL,
  fecha_valor DATE NOT NULL,
  descripcion TEXT NOT NULL,
  descripcion_detallada TEXT,
  monto NUMERIC(18, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  tipo TEXT NOT NULL CHECK (tipo IN ('abono', 'cargo', 'traspaso', 'nota_debito', 'nota_credito')),
  categoria TEXT,
  subcategoria TEXT,
  referencia TEXT,
  rut_contraparte TEXT,
  nombre_contraparte TEXT,
  banco_contraparte TEXT,
  numero_operacion TEXT,
  saldo_posterior NUMERIC(18, 2),
  conciliado BOOLEAN NOT NULL DEFAULT false,
  conciliacion_id UUID REFERENCES public.ventas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabla para transferencias (abonos en línea)
CREATE TABLE IF NOT EXISTS public.banco_chile_transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.banco_chile_config(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cuenta_origen TEXT NOT NULL,
  cuenta_destino TEXT NOT NULL,
  rut_destinatario TEXT NOT NULL,
  nombre_destinatario TEXT NOT NULL,
  banco_destino TEXT NOT NULL,
  monto NUMERIC(18, 2) NOT NULL,
  concepto TEXT,
  tipo_transferencia TEXT NOT NULL DEFAULT 'normal' CHECK (tipo_transferencia IN ('normal', 'urgente', 'diferida')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesada', 'rechazada', 'fallida')),
  numero_operacion TEXT,
  comprobante TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabla para cotizaciones previsionales (empleados)
CREATE TABLE IF NOT EXISTS public.banco_chile_cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_trabajador TEXT NOT NULL,
  nombre_trabajador TEXT NOT NULL,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  sueldo_base NUMERIC(18, 2) NOT NULL,
  horas_trabajadas NUMERIC(5, 2) DEFAULT 180,
  afp TEXT NOT NULL,
  tramo_afp TEXT,
  monto_afp NUMERIC(18, 2),
  isapre TEXT,
  tramo_isapre TEXT,
  monto_isapre NUMERIC(18, 2),
  seguro_cecesantia NUMERIC(18, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, rut_trabajador, periodo)
);

-- 7. Tabla para rentas depuradas
CREATE TABLE IF NOT EXISTS public.banco_chile_rentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_persona TEXT NOT NULL,
  nombre_persona TEXT NOT NULL,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  renta_bruta NUMERIC(18, 2) NOT NULL,
  renta_liquida NUMERIC(18, 2) NOT NULL,
  ingresos_no_renta NUMERIC(18, 2) DEFAULT 0,
  fuente TEXT NOT NULL DEFAULT 'banco_chile',
  confianza TEXT NOT NULL DEFAULT 'alta' CHECK (confianza IN ('alta', 'media', 'baja')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, rut_persona, periodo)
);

-- 8. Tabla para nóminas (confirming)
CREATE TABLE IF NOT EXISTS public.banco_chile_nominas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.banco_chile_config(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_nomina TEXT NOT NULL,
  periodo TEXT NOT NULL, -- formato YYYY-MM
  total_nominas NUMERIC(18, 2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesada', 'parcial', 'rechazada')),
  archivo_texto TEXT, -- contenido del archivo de nómina
  comprobante TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabla para detalles de nómina
CREATE TABLE IF NOT EXISTS public.banco_chile_nomina_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomina_id UUID NOT NULL REFERENCES public.banco_chile_nominas(id) ON DELETE CASCADE,
  rut_beneficiario TEXT NOT NULL,
  nombre_beneficiario TEXT NOT NULL,
  banco TEXT NOT NULL,
  tipo_cuenta TEXT NOT NULL,
  numero_cuenta TEXT NOT NULL,
  monto NUMERIC(18, 2) NOT NULL,
  concepto TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tabla para documentos (factoring/web confirming)
CREATE TABLE IF NOT EXISTS public.banco_chile_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.banco_chile_config(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('factura', 'pagare', 'letra', 'pagare_electronico')),
  numero_documento TEXT NOT NULL,
  rut_librador TEXT NOT NULL,
  nombre_librador TEXT NOT NULL,
  rut_libratario TEXT,
  nombre_libratario TEXT,
  monto_nominal NUMERIC(18, 2) NOT NULL,
  monto_pagar NUMERIC(18, 2),
  fecha_emision DATE,
  fecha_vencimiento DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'pagado', 'vencido')),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Tabla para montos preaprobados
CREATE TABLE IF NOT EXISTS public.banco_chile_montos_preaprobados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_cliente TEXT NOT NULL,
  nombre_cliente TEXT NOT NULL,
  monto_preaprobado NUMERIC(18, 2) NOT NULL,
  monto_disponible NUMERIC(18, 2) NOT NULL,
  fecha_aprobacion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  producto TEXT, -- ej: "Credito Comercial", "Cartola Verde"
  tasa_interes NUMERIC(5, 2),
  condiciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, rut_cliente)
);

-- 12. Tabla para notificaciones (webhooks)
CREATE TABLE IF NOT EXISTS public.banco_chile_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  cuenta_afectada TEXT,
  monto NUMERIC(18, 2),
  descripcion TEXT,
  datos_raw JSONB,
  procesado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_banco_chile_cuentas_empresa ON public.banco_chile_cuentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_movimientos_cuenta ON public.banco_chile_movimientos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_movimientos_empresa ON public.banco_chile_movimientos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_movimientos_fecha ON public.banco_chile_movimientos(fecha_contable);
CREATE INDEX IF NOT EXISTS idx_banco_chile_transferencias_empresa ON public.banco_chile_transferencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_cotizaciones_empresa ON public.banco_chile_cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_cotizaciones_rut ON public.banco_chile_cotizaciones(rut_trabajador);
CREATE INDEX IF NOT EXISTS idx_banco_chile_rentas_empresa ON public.banco_chile_rentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_rentas_rut ON public.banco_chile_rentas(rut_persona);
CREATE INDEX IF NOT EXISTS idx_banco_chile_nominas_empresa ON public.banco_chile_nominas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_documentos_empresa ON public.banco_chile_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_montos_empresa ON public.banco_chile_montos_preaprobados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_notificaciones_empresa ON public.banco_chile_notificaciones(empresa_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.banco_chile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_banco_chile_config_updated_at
  BEFORE UPDATE ON public.banco_chile_config
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_tokens_updated_at
  BEFORE UPDATE ON public.banco_chile_tokens
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_cuentas_updated_at
  BEFORE UPDATE ON public.banco_chile_cuentas
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_movimientos_updated_at
  BEFORE UPDATE ON public.banco_chile_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_transferencias_updated_at
  BEFORE UPDATE ON public.banco_chile_transferencias
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_cotizaciones_updated_at
  BEFORE UPDATE ON public.banco_chile_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_rentas_updated_at
  BEFORE UPDATE ON public.banco_chile_rentas
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_nominas_updated_at
  BEFORE UPDATE ON public.banco_chile_nominas
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_documentos_updated_at
  BEFORE UPDATE ON public.banco_chile_documentos
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

CREATE TRIGGER trg_banco_chile_montos_preaprobados_updated_at
  BEFORE UPDATE ON public.banco_chile_montos_preaprobados
  FOR EACH ROW EXECUTE FUNCTION public.banco_chile_updated_at();

-- RLS: Row Level Security
ALTER TABLE public.banco_chile_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_rentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_nominas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_nomina_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_montos_preaprobados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_chile_notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (se asume que existe la función has_empresa_access del migration 06)
-- Si no existe, se crean políticas básicas por ahora

-- Políticas para banco_chile_config
CREATE POLICY "Usuarios con acceso a empresa pueden ver config"
  ON public.banco_chile_config
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Gerentes pueden insertar config"
  ON public.banco_chile_config
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

CREATE POLICY "Gerentes pueden actualizar config de su empresa"
  ON public.banco_chile_config
  FOR UPDATE
  USING (public.has_empresa_access(empresa_id));

-- Políticas para banco_chile_tokens (solo lectura para el dueño)
CREATE POLICY "Usuarios con acceso a empresa pueden ver tokens"
  ON public.banco_chile_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.banco_chile_config bc
      WHERE bc.id = banco_chile_tokens.config_id
      AND public.has_empresa_access(bc.empresa_id)
    )
  );

-- Políticas para cuentas
CREATE POLICY "Usuarios con acceso a empresa pueden ver cuentas"
  ON public.banco_chile_cuentas
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Usuarios con acceso a empresa pueden insertar cuentas"
  ON public.banco_chile_cuentas
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

-- Políticas para movimientos
CREATE POLICY "Usuarios con acceso a empresa pueden ver movimientos"
  ON public.banco_chile_movimientos
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Usuarios con acceso a empresa pueden actualizar movimientos"
  ON public.banco_chile_movimientos
  FOR UPDATE
  USING (public.has_empresa_access(empresa_id));

-- Políticas para transferencias
CREATE POLICY "Usuarios con acceso a empresa pueden ver transferencias"
  ON public.banco_chile_transferencias
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Usuarios con acceso a empresa pueden insertar transferencias"
  ON public.banco_chile_transferencias
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

-- Políticas para cotizaciones
CREATE POLICY "Usuarios con acceso a empresa pueden ver cotizaciones"
  ON public.banco_chile_cotizaciones
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

-- Políticas para rentas
CREATE POLICY "Usuarios con acceso a empresa pueden ver rentas"
  ON public.banco_chile_rentas
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

-- Políticas para nóminas
CREATE POLICY "Usuarios con acceso a empresa pueden ver nóminas"
  ON public.banco_chile_nominas
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Usuarios con acceso a empresa pueden insertar nóminas"
  ON public.banco_chile_nominas
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

-- Políticas para detalles de nómina
CREATE POLICY "Usuarios con acceso a empresa pueden ver detalles de nómina"
  ON public.banco_chile_nomina_detalles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.banco_chile_nominas n
      WHERE n.id = banco_chile_nomina_detalles.nomina_id
      AND public.has_empresa_access(n.empresa_id)
    )
  );

-- Políticas para documentos
CREATE POLICY "Usuarios con acceso a empresa pueden ver documentos"
  ON public.banco_chile_documentos
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Usuarios con acceso a empresa pueden insertar documentos"
  ON public.banco_chile_documentos
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

-- Políticas para montos preaprobados
CREATE POLICY "Usuarios con acceso a empresa pueden ver montos preaprobados"
  ON public.banco_chile_montos_preaprobados
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

-- Políticas para notificaciones
CREATE POLICY "Usuarios con acceso a empresa pueden ver notificaciones"
  ON public.banco_chile_notificaciones
  FOR SELECT
  USING (public.has_empresa_access(empresa_id));

CREATE POLICY "Sistema puede insertar notificaciones"
  ON public.banco_chile_notificaciones
  FOR INSERT
  WITH CHECK (public.has_empresa_access(empresa_id));

-- Función para actualizar configuración de integraciones
INSERT INTO public.integrations (key, name, enabled, config)
VALUES 
  ('banco_chile', 'Banco Chile Empresas', false, '{"provider": "banco_chile", "apis": ["movimientos", "transferencias", "cotizaciones", "rentas", "nominas", "documentos", "montos_preaprobados", "notificaciones"]}'::jsonb)
ON CONFLICT (key) DO UPDATE 
SET config = EXCLUDED.config, updated_at = now();
