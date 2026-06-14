-- Checkout identity foundation: buyer mode, guest tracking, saved addresses
-- Supports D2C legado/privada and future B2B organizacion_id

-- checkout_sessions: persist buyer context through payment flow
ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS buyer_mode TEXT NOT NULL DEFAULT 'legado'
    CHECK (buyer_mode IN ('legado', 'privada', 'b2b')),
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organizacion_id UUID;

COMMENT ON COLUMN checkout_sessions.buyer_mode IS 'legado=registered history, privada=guest, b2b=wholesale org (future)';

-- ventas: traceability per buyer type
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS buyer_mode TEXT CHECK (buyer_mode IN ('legado', 'privada', 'b2b')),
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organizacion_id UUID;

CREATE INDEX IF NOT EXISTS idx_ventas_buyer_mode ON ventas (buyer_mode) WHERE buyer_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_is_guest ON ventas (is_guest) WHERE is_guest = true;

-- Saved shipping addresses for registered guardians (not guest checkout)
CREATE TABLE IF NOT EXISTS cliente_direcciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etiqueta TEXT NOT NULL DEFAULT 'Principal',
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  comuna TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  region TEXT NOT NULL,
  codigo_postal TEXT,
  pais TEXT NOT NULL DEFAULT 'CL',
  instrucciones TEXT,
  es_predeterminada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_direcciones_user ON cliente_direcciones(user_id);

ALTER TABLE cliente_direcciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY cliente_direcciones_select ON cliente_direcciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY cliente_direcciones_insert ON cliente_direcciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY cliente_direcciones_update ON cliente_direcciones
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cliente_direcciones_delete ON cliente_direcciones
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- logistica_envios: venta link (migration 45 may not be on remote yet)
ALTER TABLE logistica_envios ADD COLUMN IF NOT EXISTS venta_id TEXT;
ALTER TABLE logistica_envios ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Fix logistica view: remote ventas uses productos (not items); cliente_id → clientes
DO $$
DECLARE
  v_line_items_expr TEXT;
  v_pendiente_expr TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ventas' AND column_name = 'productos'
  ) THEN
    v_line_items_expr := 'v.productos';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ventas' AND column_name = 'items'
  ) THEN
    v_line_items_expr := 'v.items';
  ELSE
    v_line_items_expr := 'NULL::jsonb';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'logistica_envios' AND column_name = 'venta_id'
  ) THEN
    v_pendiente_expr := 'NOT EXISTS (SELECT 1 FROM logistica_envios le WHERE le.venta_id::text = v.id::text)';
  ELSE
    v_pendiente_expr := 'true';
  END IF;

  EXECUTE format($view$
    CREATE OR REPLACE VIEW ventas_pendientes_logistica AS
    SELECT
        v.id as venta_id,
        v.created_at,
        v.total,
        %s as items,
        v.origen,
        v.metodo_pago,
        v.buyer_mode,
        v.is_guest,
        COALESCE(c.name, p.full_name, v.buyer_email) as cliente_nombre,
        %s as pendiente_envio
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE v.estado IN ('completada', 'paid', 'pending', 'pagada')
  $view$, v_line_items_expr, v_pendiente_expr);
END $$;
