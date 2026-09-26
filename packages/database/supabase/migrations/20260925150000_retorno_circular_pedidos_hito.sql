-- =============================================================================
-- 20260925150000 — Retorno Circular en Despacho & Hito de 10 Frascos
--
-- Conecta la logística inversa de envases de vidrio entre Tienda Web, Núcleo
-- Despacho y Campo POS, registrando el compromiso de entrega de frascos limpios
-- y su posterior validación conforme con acreditación de saldo/puntos.
-- =============================================================================

-- ── 1. Columnas de Retorno Circular en Ventas ─────────────────────────────────
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS retorno_frascos_declarados INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retorno_frascos_recibidos INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retorno_frascos_estado TEXT NOT NULL DEFAULT 'ninguno'
    CHECK (retorno_frascos_estado IN ('ninguno', 'pendiente_retiro', 'recibido_conforme', 'rechazado'));

CREATE INDEX IF NOT EXISTS idx_ventas_retorno_circular
  ON public.ventas (retorno_frascos_estado)
  WHERE retorno_frascos_estado <> 'ninguno';

COMMENT ON COLUMN public.ventas.retorno_frascos_declarados IS
  'Cantidad de frascos de vidrio que el cliente declaró que entregará al repartidor en este pedido.';

COMMENT ON COLUMN public.ventas.retorno_frascos_recibidos IS
  'Cantidad de frascos efectivamente recibidos limpios y con tapa por el repartidor u operador.';

COMMENT ON COLUMN public.ventas.retorno_frascos_estado IS
  'Estado del ciclo de retorno circular en despacho: ninguno, pendiente_retiro, recibido_conforme o rechazado.';
