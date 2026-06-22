-- ============================================================
-- Migration 72: RPC get_sidebar_badges()
-- Un solo round-trip para badges del sidebar (respeta RLS del caller)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_sidebar_badges()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_colmenas_risk integer;
  v_envios_pending integer;
  v_facturas_pendientes integer;
  v_banco_enabled integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_colmenas_risk
  FROM varroa_records
  WHERE level > 3;

  SELECT COUNT(*)::integer INTO v_envios_pending
  FROM logistica_envios
  WHERE status = 'pendiente';

  SELECT COUNT(*)::integer INTO v_facturas_pendientes
  FROM facturas_emitidas
  WHERE estado_sii = 'pendiente';

  SELECT COUNT(*)::integer INTO v_banco_enabled
  FROM integrations
  WHERE key = 'banco_chile' AND enabled = true;

  RETURN json_build_object(
    'colmenas_risk', COALESCE(v_colmenas_risk, 0),
    'envios_pending', COALESCE(v_envios_pending, 0),
    'facturas_pendientes', COALESCE(v_facturas_pendientes, 0),
    'banco_enabled', COALESCE(v_banco_enabled, 0)
  );
END;
$$;

COMMENT ON FUNCTION public.get_sidebar_badges IS
  'Conteos agregados para badges del sidebar núcleo. SECURITY INVOKER — aplica RLS del usuario autenticado.';

REVOKE ALL ON FUNCTION public.get_sidebar_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO service_role;