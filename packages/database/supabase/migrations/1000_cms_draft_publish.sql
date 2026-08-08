-- Draft/publish para el Editor de Tienda.
-- `content` sigue siendo lo PUBLICADO (la tienda lee esto y no cambia nada).
-- `draft_content` acumula ediciones pendientes; PATCH escribe acá y
-- POST /api/cms/publish copia draft → content + revalida.
-- Secciones de diseño (chrome) se publican solas (ver AUTO_PUBLISH_SECTIONS en cms.ts).

alter table public.site_content
  add column if not exists draft_content jsonb,
  add column if not exists published_at timestamptz;

comment on column public.site_content.draft_content is
  'Ediciones pendientes de publicar (null = sin cambios); content es lo publicado.';
comment on column public.site_content.published_at is
  'Última publicación explícita (draft → content).';
