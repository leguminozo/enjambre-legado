-- =============================================================================
-- Migration 20260908120000: Optimización de Rendimiento — Entrelazado & Monorepo
-- 1. Índices críticos para el entrelazado territorial y grafo (colmenas, cosechas, cuaderno_aristas)
--    que alimentan sync_apiario_registro_n_colmenas, evaluar_nivel_acreditacion y recorridos de red.
-- 2. Índices para claves foráneas de alto tráfico en cuaderno/sanidad/trazabilidad/árboles.
-- 3. Índices para RPC get_sidebar_badges() v2 (destilaciones, crm, eventos, invitaciones).
-- 4. Índice de alto rendimiento para site_content (elimina seq scans en carga pública de tienda).
-- 5. Podado exhaustivo de supabase_realtime: remueve tablas sin suscriptores activos (poll-on-focus),
--    deteniendo el loop de Logical Replication / WAL decoding en disco.
-- =============================================================================

-- ── 1. Entrelazado territorial y grafo de relaciones ─────────────────────────
-- colmenas.apiario_id: requerido por sync_apiario_registro_n_colmenas() y joins
CREATE INDEX IF NOT EXISTS idx_colmenas_apiario_id
  ON public.colmenas (apiario_id)
  WHERE apiario_id IS NOT NULL;

-- cosechas.colmena_id: requerido por recalcular_credencial_por_cosecha() y evaluar_nivel_acreditacion()
CREATE INDEX IF NOT EXISTS idx_cosechas_colmena_id
  ON public.cosechas (colmena_id)
  WHERE colmena_id IS NOT NULL;

-- cuaderno_aristas.target_id & relacion: entrelazado del grafo de colmenas/nodos
CREATE INDEX IF NOT EXISTS idx_cuaderno_aristas_target_id
  ON public.cuaderno_aristas (target_id);

CREATE INDEX IF NOT EXISTS idx_cuaderno_aristas_relacion
  ON public.cuaderno_aristas (relacion);

-- ── 2. Claves foráneas operacionales (cuaderno, sanidad, trazabilidad, árboles)
CREATE INDEX IF NOT EXISTS idx_inspecciones_colmena_id
  ON public.inspecciones (colmena_id);

CREATE INDEX IF NOT EXISTS idx_varroa_records_colmena_id
  ON public.varroa_records (colmena_id);

CREATE INDEX IF NOT EXISTS idx_peso_records_colmena_id
  ON public.peso_records (colmena_id);

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_status
  ON public.arboles_plantados (status);

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_fecha
  ON public.arboles_plantados (fecha);

CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON public.notification_queue (created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_events_created_by
  ON public.notification_events (created_by)
  WHERE created_by IS NOT NULL;

-- ── 3. Rendimiento en lecturas públicas (CMS / Tienda) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_site_content_active_section_order
  ON public.site_content (section_key, is_active, item_order);

-- ── 4. Índices para RPC get_sidebar_badges() v2 ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_destilaciones_estado_activas
  ON public.destilaciones (estado)
  WHERE estado IN ('en_proceso', 'planificada');

CREATE INDEX IF NOT EXISTS idx_crm_leads_activos
  ON public.crm_leads (estado)
  WHERE estado NOT IN ('cerrado_ganado', 'cerrado_perdido');

CREATE INDEX IF NOT EXISTS idx_participante_evento_en_curso
  ON public.participante_evento (estado)
  WHERE estado = 'en_curso';

CREATE INDEX IF NOT EXISTS idx_invitation_codes_activos
  ON public.invitation_codes (active, expires_at)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_creadores_pendientes
  ON public.creadores (estado)
  WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_participante_arqueo_abiertos
  ON public.participante_arqueo (cerrado_at)
  WHERE cerrado_at IS NULL;

-- ── 5. Podado de supabase_realtime (detiene generación de WAL innecesario) ────
-- Conserva únicamente: carrito_items (carrito multi-dispositivo),
-- notification_events (campana de notificaciones) y ventas (monitor de feria / caja).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE 
    public.site_content,
    public.crm_tareas,
    public.crm_leads,
    public.destilaciones,
    public.calendario_eventos,
    public.participante_arqueo,
    public.participante_evento,
    public.invitation_codes,
    public.creadores,
    public.hidromiel_etapas,
    public.hidromiel_ingredientes,
    public.hidromiel_lotes,
    public.hidromiel_mediciones,
    public.integrations,
    public.varroa_records,
    public.colmenas,
    public.apiarios,
    public.productos,
    public.facturas_emitidas,
    public.logistica_envios,
    public.eventos;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
