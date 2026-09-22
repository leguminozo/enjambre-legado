-- Centro de Correos: variantes por idioma + envío a segmento.
-- 1) email_templates pasa a clave (key, locale): 'es' por defecto, variantes 'en'/'pt'.
-- 2) Sin cambios en notification_queue: el envío a segmento encola filas pending.

ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_pkey'
  ) THEN
    ALTER TABLE public.email_templates DROP CONSTRAINT email_templates_pkey;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_key_locale_pkey'
  ) THEN
    ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_key_locale_pkey PRIMARY KEY (key, locale);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_email_templates_locale ON public.email_templates (locale);
