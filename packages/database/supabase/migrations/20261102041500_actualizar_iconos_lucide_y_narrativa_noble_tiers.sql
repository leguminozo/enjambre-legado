-- =============================================================================
-- 20261102041500 — Actualización de íconos Lucide, nombres nobles y narrativa de niveles
--
-- Reemplaza emojis ('🌱', '🌿', etc.) por slugs de íconos Lucide ('sprout', 'tree-pine', etc.),
-- sanea nombres y propuestas narrativas de valor con tono de lujo territorial,
-- y dinamiza los fallbacks en guardian_tier_configs y user_tier_view.
-- =============================================================================

-- 1. Actualizar el valor por defecto de la columna icono
ALTER TABLE public.guardian_tier_configs
  ALTER COLUMN icono SET DEFAULT 'sprout';

-- 2. Actualizar las filas base con nombres de alta gama, slugs Lucide y narrativa noble
UPDATE public.guardian_tier_configs
SET
  nombre_display = CASE
    WHEN tier = 'OBRERA' THEN 'Iniciador'
    WHEN tier = 'ZÁNGANO' THEN 'Aliado del Enjambre'
    WHEN tier = 'REINA' THEN 'Círculo de la Reina'
    WHEN tier = 'COLMENA' THEN 'Socio Legado'
    ELSE nombre_display
  END,
  icono = CASE
    WHEN tier = 'OBRERA' OR icono = '🌱' THEN 'sprout'
    WHEN tier = 'ZÁNGANO' OR icono = '🌿' THEN 'tree-pine'
    WHEN tier = 'REINA' OR icono = '👑' THEN 'crown'
    WHEN tier = 'COLMENA' OR icono IN ('✨', '🏛️', '🪵') THEN 'gem'
    ELSE COALESCE(icono, 'sprout')
  END,
  etiqueta_narrativa = CASE
    WHEN tier = 'OBRERA' OR etiqueta_narrativa ILIKE '%aventura%' THEN 'Acceso fundacional y registro de vínculo territorial en el bosque nativo.'
    WHEN tier = 'ZÁNGANO' OR etiqueta_narrativa ILIKE '%preferencia%' THEN 'Vínculo activo con acceso preferente a recolecciones estacionales limitadas.'
    WHEN tier = 'REINA' OR etiqueta_narrativa ILIKE '%búsqueda%' THEN 'Presencia consolidada con asignación prioritaria en partidas de origen.'
    WHEN tier = 'COLMENA' OR etiqueta_narrativa ILIKE '%naturalmente%' THEN 'Máxima distinción territorial con reserva directa sobre lotes de autor y censo.'
    ELSE etiqueta_narrativa
  END
WHERE tier IN ('OBRERA', 'ZÁNGANO', 'REINA', 'COLMENA');

-- 3. Actualizar la vista dinámica user_tier_view con fallback Lucide 'sprout'
DROP VIEW IF EXISTS public.user_tier_view;

CREATE OR REPLACE VIEW public.user_tier_view WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  COALESCE(lb.ciclos_historicos, (SELECT COALESCE(SUM(c.cantidad), 0) FROM public.ciclos c WHERE c.user_id = p.id)) AS ciclos_historicos,
  COALESCE(lb.tier_actual, p.nivel_guardian, 'OBRERA') AS tier,
  COALESCE(gtc.nombre_display, lb.tier_actual, p.nivel_guardian, 'Iniciador') AS tier_nombre,
  COALESCE(gtc.icono, 'sprout') AS tier_icono,
  COALESCE(gtc.color_token, 'accent') AS tier_color_token,
  COALESCE(gtc.etiqueta_narrativa, '') AS tier_narrativa,
  COALESCE(gtc.priority, 1) AS tier_priority
FROM public.profiles p
LEFT JOIN public.loyalty_balances lb ON lb.user_id = p.id
LEFT JOIN public.guardian_tier_configs gtc ON gtc.tier = COALESCE(lb.tier_actual, p.nivel_guardian, 'OBRERA');

COMMENT ON VIEW public.user_tier_view IS
  'Vista dinámica de estado de nivel por usuario conectada con guardian_tier_configs y slugs Lucide.';
