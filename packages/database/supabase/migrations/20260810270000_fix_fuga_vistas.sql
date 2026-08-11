-- =============================================================================
-- Fuga real detectada en la auditoría: vistas SIN security_invoker (corren como
-- owner, sin RLS) que tenían SELECT otorgado a anon — cualquier visitante podía
-- leer los incentivos de creadores/rep_ventas/operadores (incentivo_unificado_view)
-- y las ventas pendientes de logística (ventas_pendientes_logistica).
--
-- Fix: se revoca TODO de anon (y se deja solo SELECT para authenticated/service,
-- que es lo que el BFF y OperadoresFeriaPanel necesitan).
-- =============================================================================

REVOKE ALL ON public.incentivo_unificado_view FROM anon, authenticated;
GRANT SELECT ON public.incentivo_unificado_view TO authenticated, service_role;

REVOKE ALL ON public.ventas_pendientes_logistica FROM anon, authenticated;
GRANT SELECT ON public.ventas_pendientes_logistica TO authenticated, service_role;
