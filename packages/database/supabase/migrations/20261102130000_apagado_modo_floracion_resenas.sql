-- Migration 20261102130000: Apagado del modo "floracion" en reseñas + limpieza de copy que prometía floraciones escasas.
-- Decisión de producto: no se vende miel monofloral en el corto plazo. El modo floración (reseñas por especie/temporada)
-- se desactiva. La trazabilidad interna (lotes.floracion_slug, análisis de laboratorio, fenología) se conserva.
-- La Biblioteca de Floraciones (/ciencia) se mantiene como contenido educativo.

-- ── 1. Limpieza de reseñas de floración (no debería haber filas) ─────────────
DELETE FROM public.resenas_producto WHERE modo = 'floracion';

-- ── 2. Políticas RLS del modo floracion ──────────────────────────────────────
DROP POLICY IF EXISTS resenas_floracion_public_read ON public.resenas_producto;
DROP POLICY IF EXISTS resenas_floracion_insert ON public.resenas_producto;

-- ── 3. Índices del modo floracion ────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_resenas_floracion_public;
DROP INDEX IF EXISTS public.idx_resenas_floracion_temporada;
DROP INDEX IF EXISTS public.idx_perc_sesiones_especie;
DROP INDEX IF EXISTS public.idx_perc_sesiones_floracion;

-- ── 4. Restaurar constraints de resenas_producto ─────────────────────────────
ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_sujeto_check;

ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_modo_check;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_modo_check
    CHECK (modo IN ('anonima', 'guardian'));

ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_guardian_requires_user;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_guardian_requires_user
    CHECK (modo <> 'guardian' OR user_id IS NOT NULL);

-- ── 5. Restaurar NOT NULL en producto_id ─────────────────────────────────────
ALTER TABLE public.resenas_producto
  ALTER COLUMN producto_id SET NOT NULL;

-- ── 6. Drop columnas de floración en resenas_producto ────────────────────────
ALTER TABLE public.resenas_producto
  DROP COLUMN IF EXISTS floracion_slug,
  DROP COLUMN IF EXISTS temporada,
  DROP COLUMN IF EXISTS momento_recoleccion,
  DROP COLUMN IF EXISTS cosecha_fresca,
  DROP COLUMN IF EXISTS pairing_botanico;

-- ── 7. Drop columnas de floración en perc_sesiones (nunca pobladas) ─────────
ALTER TABLE public.perc_sesiones
  DROP COLUMN IF EXISTS especie_id,
  DROP COLUMN IF EXISTS floracion_slug,
  DROP COLUMN IF EXISTS temporada;

-- ── 8. Drop columnas de floración en pre_orders (passthrough sin uso) ────────
ALTER TABLE public.pre_orders
  DROP COLUMN IF EXISTS floracion_slug,
  DROP COLUMN IF EXISTS temporada;

-- ── 9. Scrub de copy que prometía floraciones escasas/limitadas ──────────────
-- (Solo se tocan filas cuyo texto contenga las frases antiguas; edits manuales en CMS se preservan.)
UPDATE public.site_content
SET content = (replace(content::text, 'reservas prioritarias de floraciones escasas', 'reservas prioritarias de la recolección de temporada'))::jsonb
WHERE content::text LIKE '%reservas prioritarias de floraciones escasas%';

UPDATE public.site_content
SET content = (replace(content::text, 'priority reservations for scarce blooms', 'priority reservations for the seasonal harvest'))::jsonb
WHERE content::text LIKE '%priority reservations for scarce blooms%';

UPDATE public.site_content
SET content = (replace(content::text, 'o asegura cupos preferentes en floraciones limitadas.', 'o reserva con precio preferente tu cuota de la recolección del próximo verano.'))::jsonb
WHERE content::text LIKE '%o asegura cupos preferentes en floraciones limitadas.%';

UPDATE public.site_content
SET content = (replace(content::text, 'or secure priority spots in limited seasonal blooms.', 'or secure a preferential reservation of the seasonal harvest.'))::jsonb
WHERE content::text LIKE '%or secure priority spots in limited seasonal blooms.%';

UPDATE public.site_content
SET content = (replace(content::text, 'Acceso preferente y anticipado a floraciones escasas de temporada (Ulmo puro de altura y Tiaca silvestre) antes de cualquier apertura general.', 'Reserva anticipada de la recolección de temporada y acceso preferente a ediciones limitadas antes de cualquier apertura general.'))::jsonb
WHERE content::text LIKE '%Acceso preferente y anticipado a floraciones escasas de temporada%';

UPDATE public.site_content
SET content = (replace(content::text, 'Preferred early access to scarce seasonal blooms (high-altitude pure Ulmo and wild Tiaca) before any general opening.', 'Early reservation of the seasonal harvest and preferred access to limited editions before any general opening.'))::jsonb
WHERE content::text LIKE '%Preferred early access to scarce seasonal blooms%';

UPDATE public.site_content
SET content = (replace(content::text, 'Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas.', 'Desbloquea mayores márgenes y reserva anticipado de la recolección anual.'))::jsonb
WHERE content::text LIKE '%Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas.%';

UPDATE public.site_content
SET content = (replace(content::text, 'accede a las floraciones limitadas del Predio Pureo: ulmo, tiaca y quillay con trazabilidad de colmena y cata de origen.', 'accede a reposición a tu ritmo, reservas preferentes de la recolección anual y trazabilidad de colmena con cata de origen.'))::jsonb
WHERE content::text LIKE '%accede a las floraciones limitadas del Predio Pureo%';

-- (lotes.floracion_slug, especies_fenologicas.slug y alertas_floracion se conservan: trazabilidad interna y fenología educativa.)
