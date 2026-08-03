-- Movimiento 6 — Trazabilidad real y honesta
-- 1. Payload EXACTO firmado (para que la página pública lo muestre y se pueda
--    recomputar el hash y comparar con data_hash)
ALTER TABLE public.blockchain_anchors
ADD COLUMN IF NOT EXISTS data_payload JSONB;

-- 2. Ampliar tipos de entidad anclables (hoy el CHECK solo admite
--    lote/colmena/inspeccion, pero el módulo ancla cosecha y apiario)
ALTER TABLE public.blockchain_anchors
DROP CONSTRAINT IF EXISTS blockchain_anchors_entity_type_check;

ALTER TABLE public.blockchain_anchors
ADD CONSTRAINT blockchain_anchors_entity_type_check
  CHECK (entity_type IN ('lote', 'colmena', 'cosecha', 'apiario', 'inspeccion'));

-- 3. Índice para consultas públicas por entidad (página de trazabilidad y QR)
CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_entity
  ON public.blockchain_anchors (entity_type, entity_id);
