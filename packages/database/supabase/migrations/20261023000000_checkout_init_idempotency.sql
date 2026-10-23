-- Checkout init idempotency (hallazgo de exploración 2026-10-23)
-- 1) attempt_key: clave de intento que genera la tienda para que un reintento
--    (respuesta perdida, doble clic, retorno del PSP sin pagar) recupere la
--    misma sesión en vez de crear otra orden + hold de stock.
-- 2) psp_url/psp_token: redirección original del proveedor para reanudar el
--    mismo pago sin volver a iniciarlo en el PSP.

BEGIN;

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS attempt_key TEXT,
  ADD COLUMN IF NOT EXISTS psp_url TEXT,
  ADD COLUMN IF NOT EXISTS psp_token TEXT;

COMMENT ON COLUMN public.checkout_sessions.attempt_key IS
  'Clave efímera del intento de pago; reintentos dentro de la ventana de reanudación devuelven la misma sesión.';
COMMENT ON COLUMN public.checkout_sessions.psp_url IS
  'URL de redirección del PSP emitida en init; permite reanudar sin re-iniciar el pago.';
COMMENT ON COLUMN public.checkout_sessions.psp_token IS
  'Token del PSP emitido en init; solo sirve para reanudar el mismo pago en curso.';

CREATE UNIQUE INDEX IF NOT EXISTS checkout_sessions_attempt_key_key
  ON public.checkout_sessions (attempt_key)
  WHERE attempt_key IS NOT NULL;

COMMIT;
