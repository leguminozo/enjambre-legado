-- =============================================================================
-- Limpieza: versión legacy de inventario_aplicar_movimiento (6 args)
-- La firma vigente (9 args, con doc_tipo/doc_numero/doc_fecha) la reemplazó en
-- la migración 1012; la vieja quedó huérfana sin grants tras el hardening.
-- =============================================================================

DROP FUNCTION IF EXISTS public.inventario_aplicar_movimiento(uuid, text, numeric, text, text, text);
