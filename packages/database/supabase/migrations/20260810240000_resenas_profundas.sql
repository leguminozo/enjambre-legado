-- =============================================================================
-- Capa 4 — Reseñas profundas: ampliación de resenas_producto
--
-- Una sola fuente de verdad: la reseña guarda SOLO la FK a la sesión de
-- percepción; los chips, pares y la respuesta abierta se resuelven por join
-- (perc_sesiones → perc_chips/perc_pares/perc_abiertas).
--
-- Flujo: sesión completa con producto → se genera resena_producto con estado
-- 'pendiente' (moderación existente) → aprobada: aparece en tienda con los
-- chips sensoriales; rechazada: la sesión SÍ queda en agregados anónimos
-- (perc_sesiones.moderada_flag = true).
-- =============================================================================

ALTER TABLE public.resenas_producto
  ADD COLUMN IF NOT EXISTS percepcion_sesion_id UUID REFERENCES public.perc_sesiones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resenas_producto_percepcion
  ON public.resenas_producto (percepcion_sesion_id);

COMMENT ON COLUMN public.resenas_producto.percepcion_sesion_id IS
  'Sesión de percepción que origina la reseña profunda (única fuente: chips/pares/abierta vía join).';
