-- Migration 82: Compras soberanas — confianza de parse, revisión humana, catálogo extendido

ALTER TABLE public.gastos_extranjeros
  ADD COLUMN IF NOT EXISTS parser_id TEXT,
  ADD COLUMN IF NOT EXISTS parse_confidence NUMERIC(4,3) CHECK (parse_confidence IS NULL OR (parse_confidence >= 0 AND parse_confidence <= 1)),
  ADD COLUMN IF NOT EXISTS parse_campos JSONB,
  ADD COLUMN IF NOT EXISTS requires_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE public.gastos_extranjeros DROP CONSTRAINT IF EXISTS gastos_extranjeros_estado_check;
ALTER TABLE public.gastos_extranjeros ADD CONSTRAINT gastos_extranjeros_estado_check
  CHECK (estado IN (
    'parseado',
    'pendiente_revision',
    'facturado',
    'enviado_sii',
    'aceptado_sii',
    'rechazado_sii',
    'rechazado_parse'
  ));

CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_review
  ON public.gastos_extranjeros (empresa_id, requires_review)
  WHERE requires_review = true;

COMMENT ON COLUMN public.gastos_extranjeros.parse_confidence IS
  'Score 0-1 del parser determinista. <0.85 requiere revisión humana antes de emitir.';
COMMENT ON COLUMN public.gastos_extranjeros.parser_id IS
  'Parser usado: uber, meta-ads, generic, etc.';