-- =============================================================================
-- 20260812080000 — Enum accion_tipo: 'bienvenida' (unión al Enjambre)
--
-- Nueva acción de ledger para el bonus de bienvenida de "Únete al Enjambre".
-- Va en migración separada a propósito: Postgres prohíbe USAR el valor nuevo
-- de un enum en la misma transacción que lo agrega (y Supabase corre cada
-- migración en su propia transacción).
-- =============================================================================

ALTER TYPE public.accion_tipo ADD VALUE IF NOT EXISTS 'bienvenida';
