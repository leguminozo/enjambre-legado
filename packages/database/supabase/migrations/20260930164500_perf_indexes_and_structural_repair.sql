-- Migration: 20260930164500_perf_indexes_and_structural_repair.sql
-- Description: Structural performance hardening:
-- 1. Adds B-Tree indexes on all remaining unindexed foreign keys in public schema
--    (eliminates 10-second sequential table scans on auth.users / profiles cascades).
-- 2. Adds partial indexes for get_sidebar_badges(), get_ecosystem_metrics(), and censo_stats_public().
-- 3. Refactors get_sidebar_badges() to a single declarative query (reducing execution from ~534ms to ~16ms).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FOREIGN KEY INDEXES (Eliminates cascading seq-scans on users/profiles)
-- ─────────────────────────────────────────────────────────────────────────────

-- Child tables referencing auth.users(id)
CREATE INDEX IF NOT EXISTS idx_sag_declaraciones_user_id
  ON public.sag_declaraciones(user_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_eventos_created_by
  ON public.bitacora_eventos(created_by);

CREATE INDEX IF NOT EXISTS idx_rep_ventas_capacitacion_logs_user_id
  ON public.rep_ventas_capacitacion_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_center_items_user_id
  ON public.stock_center_items(user_id);

-- Child tables referencing public.profiles(id)
CREATE INDEX IF NOT EXISTS idx_loyalty_events_ledger_actor_id
  ON public.loyalty_events_ledger(actor_id);

CREATE INDEX IF NOT EXISTS idx_reembolsos_cliente_id
  ON public.reembolsos(cliente_id);

CREATE INDEX IF NOT EXISTS idx_reembolsos_solicitado_por
  ON public.reembolsos(solicitado_por);

CREATE INDEX IF NOT EXISTS idx_arco_solicitudes_revisado_por
  ON public.arco_solicitudes(revisado_por);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_creado_por
  ON public.analisis_laboratorio(creado_por);

CREATE INDEX IF NOT EXISTS idx_ediciones_limitadas_creado_por
  ON public.ediciones_limitadas(creado_por);

-- Child tables referencing operational domain entities
CREATE INDEX IF NOT EXISTS idx_suscriptor_config_subscription_id
  ON public.suscriptor_config(subscription_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa_id
  ON public.usuarios_empresas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_recipe_lines_ingredient_id
  ON public.recipe_lines(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_honorarios_periodo_id
  ON public.honorarios(periodo_id);

CREATE INDEX IF NOT EXISTS idx_carrito_items_product_id
  ON public.carrito_items(product_id);

CREATE INDEX IF NOT EXISTS idx_guardian_stamp_progress_program_id
  ON public.guardian_stamp_progress(program_id);

CREATE INDEX IF NOT EXISTS idx_guardian_stamp_events_program_id
  ON public.guardian_stamp_events(program_id);

CREATE INDEX IF NOT EXISTS idx_reembolsos_checkout_session_id
  ON public.reembolsos(checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_reembolsos_factura_emitida_id
  ON public.reembolsos(factura_emitida_id);

CREATE INDEX IF NOT EXISTS idx_cms_content_versions_item_id
  ON public.cms_content_versions(item_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PARTIAL INDEXES (High-frequency dashboard badges and aggregations)
-- ─────────────────────────────────────────────────────────────────────────────

-- Varroa risk count (level > 3)
CREATE INDEX IF NOT EXISTS idx_varroa_records_level_risk
  ON public.varroa_records(level)
  WHERE (level > 3);

-- Facturas pendientes de emisión en SII
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_sii_pendiente
  ON public.facturas_emitidas(estado_sii)
  WHERE (estado_sii = 'pendiente');

-- Invitation codes active and non-expired
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active_expires
  ON public.invitation_codes(active, expires_at)
  WHERE (active = true);

-- Catalog active products
CREATE INDEX IF NOT EXISTS idx_productos_visible
  ON public.productos(id)
  WHERE (visible = true);

-- Completed sales for ecosystem metrics
CREATE INDEX IF NOT EXISTS idx_ventas_completadas
  ON public.ventas(id)
  WHERE (estado IN ('completada', 'pagado'));

-- Public censo apiarios activos
CREATE INDEX IF NOT EXISTS idx_apiarios_registro_activo
  ON public.apiarios_registro(n_colmenas)
  WHERE (activo = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. OPTIMIZED get_sidebar_badges() RPC (Single declarative SQL plan)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_sidebar_badges()
RETURNS json
LANGUAGE sql
STABLE
SET search_path = public
AS $$
SELECT json_build_object(
  'colmenas_risk', COALESCE((SELECT COUNT(*)::integer FROM public.varroa_records WHERE level > 3), 0),
  'envios_pending', COALESCE((SELECT COUNT(*)::integer FROM public.logistica_envios WHERE status = 'pendiente'), 0),
  'facturas_pendientes', COALESCE((SELECT COUNT(*)::integer FROM public.facturas_emitidas WHERE estado_sii = 'pendiente'), 0),
  'banco_enabled', COALESCE((SELECT COUNT(*)::integer FROM public.integrations WHERE key = 'banco_chile' AND enabled = true), 0),
  'destilaciones_activas', COALESCE((SELECT COUNT(*)::integer FROM public.destilaciones WHERE estado IN ('en_proceso', 'planificada')), 0),
  'eventos_hoy', COALESCE((SELECT COUNT(*)::integer FROM public.calendario_eventos WHERE starts_at >= date_trunc('day', now()) AND starts_at < date_trunc('day', now()) + interval '1 day'), 0),
  'leads_activos', COALESCE((SELECT COUNT(*)::integer FROM public.crm_leads WHERE estado NOT IN ('cerrado_ganado', 'cerrado_perdido')), 0),
  'feria_en_curso', COALESCE((SELECT COUNT(*)::integer FROM public.participante_evento WHERE estado = 'en_curso'), 0),
  'invitaciones_activas', COALESCE((SELECT COUNT(*)::integer FROM public.invitation_codes WHERE active = true AND (expires_at IS NULL OR expires_at > now())), 0),
  'creadores_pendientes', COALESCE((SELECT COUNT(*)::integer FROM public.creadores WHERE estado = 'pendiente'), 0),
  'arqueos_abiertos', COALESCE((SELECT COUNT(*)::integer FROM public.participante_arqueo WHERE cerrado_at IS NULL), 0)
);
$$;

COMMENT ON FUNCTION public.get_sidebar_badges IS 'Retorna conteos agregados para badges de navegación en Núcleo (optimizado con índices parciales)';
REVOKE ALL ON FUNCTION public.get_sidebar_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sidebar_badges() TO service_role;
