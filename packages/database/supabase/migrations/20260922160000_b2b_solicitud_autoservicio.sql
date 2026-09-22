-- Portal B2B autoservicio: solicitud enriquecida (volumen, RUT, patente,
-- tier auto, aceptación de contrato) sobre b2b_puntos_venta.

ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS volumen_mensual_clp INT CHECK (volumen_mensual_clp IS NULL OR volumen_mensual_clp >= 0);
ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS rut_empresa TEXT;
ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS patente_path TEXT;
ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS tier_sugerido TEXT;
ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS contrato_version TEXT;
ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS contrato_aceptado_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_b2b_puntos_estado
  ON public.b2b_puntos_venta (estado) WHERE estado = 'prospecto';

-- Bucket privado de patentes (sube el BFF con service role; lectura por URL firmada).
INSERT INTO storage.buckets (id, name, public)
VALUES ('b2b-patentes', 'b2b-patentes', false)
ON CONFLICT (id) DO NOTHING;
