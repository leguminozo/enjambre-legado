-- CMS bilingüe: cada fila de site_content pertenece a un idioma (es/en).
-- La tienda resuelve el locale activo en la capa de datos (lib/cms.ts) y cae
-- a 'es' por item cuando la versión solicitada no existe (degradación suave).
-- El editor copia items ES → EN ("crear desde ES") y edita cada versión.
alter table public.site_content
  add column if not exists locale text not null default 'es';

-- Una fila por (sección, orden, idioma); el orden es independiente por idioma.
-- No único: datos legacy pueden tener item_order repetidos y la migración no
-- debe fallar al aplicar — la unicidad la resuelve la app (editor/tienda).
create index if not exists site_content_section_order_locale_key
  on public.site_content (section_key, item_order, locale);

comment on column public.site_content.locale is
  'Idioma del contenido: es (default) o en. La tienda usa NEXT_LOCALE (next-intl) y cae a es por item si la versión no existe.';
