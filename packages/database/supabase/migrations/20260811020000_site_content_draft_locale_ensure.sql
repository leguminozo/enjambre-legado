-- =============================================================================
-- Ensure CMS draft/publish + locale columns exist on site_content.
--
-- Contexto: las migraciones 1000_cms_draft_publish y 1001_cms_content_locale
-- colisionan en versión numérica con 1000_fix_admin_roles / 1001_security_events
-- (dos archivos "1000" / "1001"). En prod a veces solo se aplicó uno de cada par,
-- y el Editor Tienda fallaba: "Could not find the 'draft_content' column".
--
-- Idempotente: seguro re-ejecutar.
-- =============================================================================

ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS draft_content jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

COMMENT ON COLUMN public.site_content.draft_content IS
  'Ediciones pendientes de publicar (null = sin cambios); content es lo publicado.';
COMMENT ON COLUMN public.site_content.published_at IS
  'Última publicación explícita (draft → content).';

ALTER TABLE public.site_content
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'es';

-- Backfill seguro si la columna se acaba de crear con default
UPDATE public.site_content
SET locale = 'es'
WHERE locale IS NULL OR locale = '';

CREATE INDEX IF NOT EXISTS site_content_section_order_locale_key
  ON public.site_content (section_key, item_order, locale);

COMMENT ON COLUMN public.site_content.locale IS
  'Idioma del contenido CMS (es/en).';
