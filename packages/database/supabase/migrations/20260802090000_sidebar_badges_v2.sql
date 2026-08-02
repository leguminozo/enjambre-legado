-- ============================================================
-- Migration 1006: get_sidebar_badges v2 — badges operativos ampliados
-- Un solo round-trip para badges del sidebar (respeta RLS del caller).
-- Añade 7 conteos a los 4 existentes: alambique, calendario, pipeline,
-- monitor-feria, invitaciones, creadores y operadores-feria.
-- Deliberadamente fuera: `pagos` (checkout_sessions es service_role-only,
-- invisible al SECURITY INVOKER) y `produccion` (lotes sin CHECK versionado).
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
  v_destilaciones_activas integer;
  v_eventos_hoy integer;
  v_leads_activos integer;
  v_feria_en_curso integer;
  v_invitaciones_activas integer;
  v_creadores_pendientes integer;
  v_arqueos_abiertos integer;
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

  -- Alambique: destilaciones en proceso o planificadas (CHECK versionado en 1003)
  SELECT COUNT(*)::integer INTO v_destilaciones_activas
  FROM destilaciones
  WHERE estado IN ('en_proceso', 'planificada');

  -- Calendario: eventos que empiezan hoy (hora local del servidor)
  SELECT COUNT(*)::integer INTO v_eventos_hoy
  FROM calendario_eventos
  WHERE starts_at >= date_trunc('day', now())
    AND starts_at < date_trunc('day', now()) + interval '1 day';

  -- Pipeline: leads sin cerrar
  SELECT COUNT(*)::integer INTO v_leads_activos
  FROM crm_leads
  WHERE estado NOT IN ('cerrado_ganado', 'cerrado_perdido');

  -- Monitor de Feria: ferias en curso (dot de atención)
  SELECT COUNT(*)::integer INTO v_feria_en_curso
  FROM participante_evento
  WHERE estado = 'en_curso';

  -- Invitaciones: códigos activos sin vencer
  SELECT COUNT(*)::integer INTO v_invitaciones_activas
  FROM invitation_codes
  WHERE active = true
    AND (expires_at IS NULL OR expires_at > now());

  -- Creadores: pendientes de moderar
  SELECT COUNT(*)::integer INTO v_creadores_pendientes
  FROM creadores
  WHERE estado = 'pendiente';

  -- Operadores Feria: arqueos abiertos
  SELECT COUNT(*)::integer INTO v_arqueos_abiertos
  FROM participante_arqueo
  WHERE cerrado_at IS NULL;

  RETURN json_build_object(
    'colmenas_risk', COALESCE(v_colmenas_risk, 0),
    'envios_pending', COALESCE(v_envios_pending, 0),
    'facturas_pendientes', COALESCE(v_facturas_pendientes, 0),
    'banco_enabled', COALESCE(v_banco_enabled, 0),
    'destilaciones_activas', COALESCE(v_destilaciones_activas, 0),
    'eventos_hoy', COALESCE(v_eventos_hoy, 0),
    'leads_activos', COALESCE(v_leads_activos, 0),
    'feria_en_curso', COALESCE(v_feria_en_curso, 0),
    'invitaciones_activas', COALESCE(v_invitaciones_activas, 0),
    'creadores_pendientes', COALESCE(v_creadores_pendientes, 0),
    'arqueos_abiertos', COALESCE(v_arqueos_abiertos, 0)
  );
END;
$$;

COMMENT ON FUNCTION public.get_sidebar_badges IS
  'Conteos agregados para badges del sidebar núcleo (v2 — módulos operativos). SECURITY INVOKER — aplica RLS del usuario autenticado.';

REVOKE ALL ON FUNCTION public.get_sidebar_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO service_role;
