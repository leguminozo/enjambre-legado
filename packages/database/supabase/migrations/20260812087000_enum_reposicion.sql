-- =============================================================================
-- 20260812087000 — Enum accion_tipo: 'reposicion' (bienvenida de Reposición)
--
-- Acción de ledger para el bonus "100 pts al activar la Reposición" (copy de
-- canje-impacto-client que nunca se implementó). Va en migración separada:
-- Postgres prohíbe USAR el valor nuevo de un enum en la misma transacción
-- que lo agrega. No reutiliza 'bienvenida' a propósito: el índice único
-- parcial de unirse_al_enjambre bloquearía el segundo bono.
-- =============================================================================

ALTER TYPE public.accion_tipo ADD VALUE IF NOT EXISTS 'reposicion';
