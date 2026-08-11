-- =============================================================================
-- Restauración de RPC públicas tras el hardening de grants (20260810260000):
-- la contrastación con el código local reveló dos flujos PÚBLICOS que llaman
-- estas funciones con el client anónimo de Supabase:
--   · get_ecosystem_metrics()        → landing, ciencia y perfil de la tienda
--     (createAnonServerClient en SSR público)
--   · obtener_venta_por_claim_token() → página SSR pública del claim de venta
-- Ambas exigen token/validación interna (métricas agregadas y claim token), así
-- que exponerlas a anon no filtra datos individuales.
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.get_ecosystem_metrics() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_venta_por_claim_token(uuid) TO anon, authenticated, service_role;
