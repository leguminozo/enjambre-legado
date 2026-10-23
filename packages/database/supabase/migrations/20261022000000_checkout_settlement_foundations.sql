-- Checkout settlement foundations (PR-0)
-- 1) facturas_emitidas.numero deja de ser un entero SII: es el código legible
--    del documento (BWEB-..., FWEB-..., BSUB-...). El folio autorizado vive en folio.
-- 2) facturas_emitidas.venta_id permite reconstruir el pedido y habilita lectura
--    del comprador sin abrir la tabla contable completa.
-- 3) checkout_sessions conserva billing y retorno de frascos (hoy se pierden al
--    leer la sesión desde Postgres) y un claim de liquidación para serializar
--    webhook/commit/admin retry.
-- 4) profiles.cart_cleared_at permite que la tienda no re-mezcle un carrito local
--    anterior a una compra ya liquidada.

BEGIN;

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS billing JSONB,
  ADD COLUMN IF NOT EXISTS retorno_frascos_declarados INTEGER NOT NULL DEFAULT 0
    CHECK (retorno_frascos_declarados >= 0),
  ADD COLUMN IF NOT EXISTS fulfillment_started_at TIMESTAMPTZ;

COMMENT ON COLUMN public.checkout_sessions.billing IS
  'Datos de facturación verificados en init; sobreviven cold starts y webhooks.';
COMMENT ON COLUMN public.checkout_sessions.retorno_frascos_declarados IS
  'Frascos declarados por el comprador para retorno circular.';
COMMENT ON COLUMN public.checkout_sessions.fulfillment_started_at IS
  'Claim temporal de liquidación para evitar doble descuento de stock.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cart_cleared_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.cart_cleared_at IS
  'Última compra liquidada; la tienda descarta carritos locales anteriores.';

ALTER TABLE public.facturas_emitidas
  DROP CONSTRAINT IF EXISTS facturas_emitidas_numero_check;

ALTER TABLE public.facturas_emitidas
  ALTER COLUMN numero TYPE TEXT USING numero::text;

-- La boleta web no tiene tercero (el comprador no es una empresa del libro).
ALTER TABLE public.facturas_emitidas
  ALTER COLUMN tercero_id DROP NOT NULL;

ALTER TABLE public.facturas_emitidas
  ADD COLUMN IF NOT EXISTS venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS download_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS download_token_expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (now() + INTERVAL '90 days'),
  ADD COLUMN IF NOT EXISTS xml_disponible BOOLEAN GENERATED ALWAYS AS (
    COALESCE(sii_xml IS NOT NULL AND length(btrim(sii_xml)) > 0, false)
  ) STORED;

COMMENT ON COLUMN public.facturas_emitidas.venta_id IS
  'Venta web que originó el DTE; NULL en documentos manuales o de suscripción.';
COMMENT ON COLUMN public.facturas_emitidas.download_token IS
  'Token opaco para descarga de invitados; no reemplaza la sesión del comprador.';
COMMENT ON COLUMN public.facturas_emitidas.xml_disponible IS
  'Indica si el XML firmado ya está disponible para descarga.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_facturas_emitidas_download_token
  ON public.facturas_emitidas (download_token);

CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_venta_id
  ON public.facturas_emitidas (venta_id)
  WHERE venta_id IS NOT NULL;

-- Backfill conservador: solo cuando la llave de idempotencia o el número
-- legible identifican una venta inequívoca.
UPDATE public.facturas_emitidas AS f
SET venta_id = v.id
FROM public.ventas AS v
WHERE f.venta_id IS NULL
  AND (
    f.idempotency_key = 'venta:' || v.id::text
    OR (
      v.buy_order IS NOT NULL
      AND f.numero IN ('BWEB-' || v.buy_order, 'FWEB-' || v.buy_order)
    )
  );

DROP POLICY IF EXISTS facturas_emitidas_owner_select ON public.facturas_emitidas;
CREATE POLICY facturas_emitidas_owner_select ON public.facturas_emitidas
  FOR SELECT
  TO authenticated
  USING (
    venta_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.ventas AS v
      WHERE v.id = facturas_emitidas.venta_id
        AND v.user_id = auth.uid()
    )
  );

COMMIT;
