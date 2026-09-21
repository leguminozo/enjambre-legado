-- RPC: Tamaño actual de la base de datos
CREATE OR REPLACE FUNCTION public.admin_db_health()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only admin can call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'db_size_mb', round(pg_database_size(current_database()) / 1048576.0, 2),
    'db_limit_mb', 500,
    'db_usage_pct', round(pg_database_size(current_database()) / (500.0 * 1048576) * 100, 1),
    'table_sizes', (
      SELECT jsonb_agg(jsonb_build_object(
        'table', schemaname || '.' || tablename,
        'size_mb', round(pg_total_relation_size(schemaname || '.' || tablename) / 1048576.0, 2)
      ) ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC)
      FROM pg_tables
      WHERE schemaname = 'public'
      LIMIT 15
    ),
    'total_rows', (
      SELECT jsonb_object_agg(relname, n_live_tup)
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
      LIMIT 15
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC: Estado de la cola de sincronización de Campo
CREATE OR REPLACE FUNCTION public.admin_sync_queue_health()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'ventas_hoy', (SELECT count(*) FROM public.ventas WHERE created_at >= CURRENT_DATE),
    'ventas_semana', (SELECT count(*) FROM public.ventas WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'ventas_offline', (SELECT count(*) FROM public.ventas WHERE offline_synced = true AND created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'checkout_pendientes', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'pending'),
    'checkout_expirados_hoy', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'expired' AND created_at >= CURRENT_DATE)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC: Métricas de lealtad y usuarios activos
CREATE OR REPLACE FUNCTION public.admin_loyalty_health()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
  v_reembolsos INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.reembolsos WHERE estado = ''pendiente''' INTO v_reembolsos;
  EXCEPTION WHEN undefined_table THEN
    v_reembolsos := 0;
  END;

  SELECT jsonb_build_object(
    'total_usuarios', (SELECT count(*) FROM public.profiles),
    'clientes_activos_30d', (
      SELECT count(DISTINCT cliente_id)
      FROM public.ventas
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND cliente_id IS NOT NULL
    ),
    'eventos_lealtad_7d', (SELECT count(*) FROM public.loyalty_events_ledger WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'reembolsos_pendientes', v_reembolsos,
    'arco_pendientes', (
      SELECT count(*) FROM public.profiles WHERE deletion_requested_at IS NOT NULL
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_db_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_queue_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_loyalty_health() TO authenticated;
