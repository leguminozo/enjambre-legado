-- Reembolsos module migration
-- 20260921160000_reembolsos_module.sql

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS reembolso_estado TEXT CHECK (reembolso_estado IN ('pendiente', 'parcial', 'total'));

CREATE TABLE IF NOT EXISTS public.reembolsos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id),
    checkout_session_id UUID REFERENCES public.checkout_sessions(id),
    idempotency_key TEXT NOT NULL UNIQUE,
    solicitado_por UUID NOT NULL REFERENCES public.profiles(id),
    cliente_id UUID REFERENCES public.profiles(id),
    tipo_documento_origen TEXT NOT NULL DEFAULT 'boleta' CHECK (tipo_documento_origen IN ('boleta', 'factura', 'sin_dte')),
    tipo_dte_origen INT CHECK (tipo_dte_origen IN (39, 33, 41, 34)),
    folio_origen INT,
    nc_tipo_dte INT DEFAULT 61,
    factura_emitida_id UUID REFERENCES public.facturas_emitidas(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('total', 'parcial')),
    motivo TEXT NOT NULL,
    monto_original INT NOT NULL,
    monto_reembolso INT NOT NULL CHECK (monto_reembolso > 0),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completado', 'rechazado', 'error')),
    psp_reversa_ok BOOLEAN DEFAULT false,
    psp_referencia TEXT,
    nc_emitida BOOLEAN DEFAULT false,
    nc_folio TEXT,
    stock_restaurado BOOLEAN DEFAULT false,
    puntos_revertidos BOOLEAN DEFAULT false,
    notas TEXT,
    error_detalle TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reembolsos_venta_id ON public.reembolsos(venta_id);
CREATE INDEX IF NOT EXISTS idx_reembolsos_estado ON public.reembolsos(estado);

-- RLS policies
ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read/write all reembolsos" ON public.reembolsos
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read their own reembolsos" ON public.reembolsos
    FOR SELECT
    TO authenticated
    USING (cliente_id = auth.uid());
