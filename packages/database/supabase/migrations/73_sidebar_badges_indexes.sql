-- ============================================================
-- Migration 73: índices parciales para get_sidebar_badges()
-- Alineados con filtros del RPC (migration 72)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_varroa_records_level_high
  ON public.varroa_records (level)
  WHERE level > 3;

CREATE INDEX IF NOT EXISTS idx_logistica_envios_status_pendiente
  ON public.logistica_envios (status)
  WHERE status = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_estado_sii_pendiente
  ON public.facturas_emitidas (estado_sii)
  WHERE estado_sii = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_integrations_banco_chile_enabled
  ON public.integrations (key, enabled)
  WHERE key = 'banco_chile' AND enabled = true;