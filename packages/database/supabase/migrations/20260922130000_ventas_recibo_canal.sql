-- Recibo multicanal POS: métrica de comprobante compartido por venta.
-- canal: whatsapp | email | sms | share (hoja nativa) | copiado | impreso.

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS recibo_canal TEXT
  CHECK (recibo_canal IN ('whatsapp', 'email', 'sms', 'share', 'copiado', 'impreso'));
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS recibo_enviado_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ventas_recibo_canal
  ON public.ventas (recibo_canal) WHERE recibo_canal IS NOT NULL;
