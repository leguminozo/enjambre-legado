-- Migration 50: Sprint 2 (Notifications & Blockchain)
-- Habilita la tabla de cola de notificaciones y la tabla de registros de anclaje de blockchain

-- 1. Tabla de Cola de Notificaciones
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'push', 'system')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla de cola de notificaciones
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_queue
CREATE POLICY notification_queue_select ON public.notification_queue
  FOR SELECT USING (public.is_gerente() OR public.current_role() = 'admin');

CREATE POLICY notification_queue_insert ON public.notification_queue
  FOR INSERT WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

CREATE POLICY notification_queue_update ON public.notification_queue
  FOR UPDATE USING (public.is_gerente() OR public.current_role() = 'admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

CREATE POLICY notification_queue_delete ON public.notification_queue
  FOR DELETE USING (public.is_gerente() OR public.current_role() = 'admin');

-- 2. Tabla de Blockchain Anchors
CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lote', 'colmena', 'inspeccion')),
  entity_id UUID NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'polygon-amoy',
  block_number BIGINT,
  block_timestamp TIMESTAMPTZ,
  merkle_proof JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla de anclajes de blockchain
ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para blockchain_anchors (lectura pública para consumidores de QR, escritura solo para admin/gerente)
CREATE POLICY blockchain_anchors_select ON public.blockchain_anchors
  FOR SELECT USING (true);

CREATE POLICY blockchain_anchors_mutate ON public.blockchain_anchors
  FOR ALL USING (public.is_gerente() OR public.current_role() = 'admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

-- 3. Trigger para updated_at en notification_queue
CREATE OR REPLACE FUNCTION public.actualizar_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_notifications_updated_at();
