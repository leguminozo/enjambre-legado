-- =============================================================================
-- Migration 20260831120000: Zero-Trust RLS Final Seal & Security Consolidation
--
-- Auditoría integral de seguridad de infraestructura Supabase:
-- 1. Activar RLS en arboles_plantados, cosechas y config_censo.
-- 2. Establecer políticas de seguridad en config_censo (lectura pública, escritura admin).
-- 3. Blindar incentivo_unificado_view y ventas_pendientes_logistica con
--    WITH (security_invoker = true) para prevenir fuga de RLS hacia usuarios autenticados.
-- 4. Fijar SET search_path = public en las funciones SECURITY DEFINER restantes
--    para prevenir ataques de secuestro de ruta de búsqueda (CWE-426).
-- =============================================================================

-- ── 1. ACTIVAR ROW LEVEL SECURITY EN TABLAS FALTANTES ────────────────────────

ALTER TABLE public.arboles_plantados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosechas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_censo ENABLE ROW LEVEL SECURITY;

-- ── 2. POLÍTICAS RLS PARA config_censo ──────────────────────────────────────

DROP POLICY IF EXISTS config_censo_read_p ON public.config_censo;
CREATE POLICY config_censo_read_p ON public.config_censo
  FOR SELECT USING (true);

DROP POLICY IF EXISTS config_censo_admin_p ON public.config_censo;
CREATE POLICY config_censo_admin_p ON public.config_censo
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 3. VISTAS BLINDADAS CON SECURITY INVOKER ─────────────────────────────────

-- incentivo_unificado_view: evalúa RLS del usuario que consulta (admin ve todo, rep/creador lo suyo, cliente 0 filas)
CREATE OR REPLACE VIEW public.incentivo_unificado_view
WITH (security_invoker = true) AS
SELECT
  cr.id,
  cr.rep_id AS user_id,
  'rep_ventas'::text AS participante_tipo,
  'comision_venta'::public.incentivo_tipo AS tipo,
  cr.total_commission AS monto,
  'CLP'::text AS moneda,
  CASE WHEN cr.paid THEN 'pagado'::public.incentivo_estado ELSE 'pendiente'::public.incentivo_estado END AS estado,
  'commission_records'::text AS origen_tabla,
  cr.created_at
FROM public.commission_records cr
UNION ALL
SELECT
  cc.id,
  c.user_id,
  'creador'::text,
  'comision_creador'::public.incentivo_tipo,
  cc.monto,
  'CLP'::text,
  CASE cc.estado
    WHEN 'pagada' THEN 'pagado'::public.incentivo_estado
    WHEN 'aprobada' THEN 'aprobado'::public.incentivo_estado
    WHEN 'rechazada' THEN 'rechazado'::public.incentivo_estado
    ELSE 'pendiente'::public.incentivo_estado
  END,
  'creador_comisiones'::text,
  cc.created_at
FROM public.creador_comisiones cc
JOIN public.creadores c ON c.id = cc.creador_id
UNION ALL
SELECT
  il.id,
  il.user_id,
  il.participante_tipo,
  il.tipo,
  il.monto,
  il.moneda,
  il.estado,
  'incentivo_ledger'::text,
  il.created_at
FROM public.incentivo_ledger il;

CREATE OR REPLACE VIEW public.ventas_pendientes_logistica
WITH (security_invoker = true) AS
SELECT 
    v.id as venta_id,
    v.created_at,
    v.total,
    v.productos as items,
    v.origen,
    v.metodo_pago,
    v.buyer_mode,
    v.is_guest,
    COALESCE(c.name, p.full_name, v.buyer_email) as cliente_nombre,
    (NOT (EXISTS (SELECT 1 FROM public.logistica_envios le WHERE le.venta_id = v.id))) as pendiente_envio
FROM public.ventas v
LEFT JOIN public.clientes c ON (v.cliente_id = c.id)
LEFT JOIN public.profiles p ON (c.user_id = p.id)
WHERE v.estado = ANY (ARRAY['completada'::text, 'paid'::text, 'pending'::text, 'pagada'::text]);

GRANT SELECT ON public.incentivo_unificado_view TO authenticated, service_role;
GRANT SELECT ON public.ventas_pendientes_logistica TO authenticated, service_role;

-- ── 4. FIJAR search_path = public EN FUNCIONES SECURITY DEFINER ──────────────

DO $$
DECLARE
  stmt text;
  statements text[] := ARRAY[
    'ALTER FUNCTION public.actualizar_crm_updated_at() SET search_path = public',
    'ALTER FUNCTION public.actualizar_descuentos_updated_at() SET search_path = public',
    'ALTER FUNCTION public.actualizar_fidelizacion_updated_at() SET search_path = public',
    'ALTER FUNCTION public.actualizar_streak_rep(UUID) SET search_path = public',
    'ALTER FUNCTION public.award_points_on_claim() SET search_path = public',
    'ALTER FUNCTION public.calcular_costo_receta(UUID) SET search_path = public',
    'ALTER FUNCTION public.calcular_metricas_creadores_mes(TEXT) SET search_path = public',
    'ALTER FUNCTION public.decrement_stock_force(UUID, INT) SET search_path = public',
    'ALTER FUNCTION public.decrement_stock_force_batch(JSONB) SET search_path = public',
    'ALTER FUNCTION public.evaluar_tier_rep(UUID) SET search_path = public',
    'ALTER FUNCTION public.expire_checkout_sessions() SET search_path = public',
    'ALTER FUNCTION public.generar_codigo_creador(TEXT) SET search_path = public',
    'ALTER FUNCTION public.generar_codigo_invitacion(UUID) SET search_path = public',
    'ALTER FUNCTION public.generar_codigo_qr() SET search_path = public',
    'ALTER FUNCTION public.generar_hash_audit_trail() SET search_path = public',
    'ALTER FUNCTION public.incrementar_usos_descuento(UUID) SET search_path = public',
    'ALTER FUNCTION public.obtener_historial_qr(UUID) SET search_path = public',
    'ALTER FUNCTION public.obtener_metricas_pipeline(UUID) SET search_path = public',
    'ALTER FUNCTION public.obtener_tareas_vencidas(UUID, UUID) SET search_path = public',
    'ALTER FUNCTION public.on_cash_session_close_streak() SET search_path = public',
    'ALTER FUNCTION public.on_codigo_uso_create_comision() SET search_path = public',
    'ALTER FUNCTION public.on_codigo_uso_update_stats() SET search_path = public',
    'ALTER FUNCTION public.on_rep_profile_tier_check() SET search_path = public',
    'ALTER FUNCTION public.on_venta_calc_comision() SET search_path = public',
    'ALTER FUNCTION public.resolve_payment_failure(UUID) SET search_path = public',
    'ALTER FUNCTION public.schedule_payment_retry(UUID) SET search_path = public',
    'ALTER FUNCTION public.set_crm_tarea_completada_at() SET search_path = public',
    'ALTER FUNCTION public.tier_progress_rep(UUID) SET search_path = public',
    'ALTER FUNCTION public.update_creador_updated_at() SET search_path = public',
    'ALTER FUNCTION public.update_ingredient_precio_ref() SET search_path = public',
    'ALTER FUNCTION public.update_lote_stock_from_product() SET search_path = public',
    'ALTER FUNCTION public.verificar_integridad_audit_trail(UUID) SET search_path = public',
    'ALTER FUNCTION public.weekly_leaderboard(UUID) SET search_path = public'
  ];
BEGIN
  FOREACH stmt IN ARRAY statements LOOP
    BEGIN
      EXECUTE stmt;
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;
