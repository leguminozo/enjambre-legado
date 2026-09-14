-- =============================================================================
-- 20260914120000 — Canales de publicación, categoría y metadatos en subscription_plans
--
-- Permite configurar explícitamente en qué superficies y canales del monorepo
-- se expone cada plan de suscripción (Tienda PDP, Tienda Club, Núcleo Territorial,
-- Campo POS o Privado), su categoría biocultural y metadatos operativos (digital,
-- floración, cupos, etc.).
-- =============================================================================

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'reposicion';

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_category_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_category_check
  CHECK (category IN ('reposicion', 'cosecha', 'territorial', 'pos_campo', 'corporativo'));

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS channels text[] NOT NULL DEFAULT ARRAY['tienda_despensa']::text[];

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_subscription_plans_category_active
  ON public.subscription_plans(category, active);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_channels
  ON public.subscription_plans USING gin(channels);

-- Backfill idempotente de filas existentes según keys históricas
-- 1. Club de la Cosecha
UPDATE public.subscription_plans
SET
  category = 'cosecha',
  channels = ARRAY['tienda_club']::text[],
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'floracion',
    CASE
      WHEN key = 'club_ulmo' THEN 'ulmo'
      WHEN key = 'club_tiaca' THEN 'tiaca'
      WHEN key = 'club_quillay' THEN 'quillay'
      ELSE 'multifloral'
    END,
    'digital', false
  )
WHERE key LIKE 'club_%' OR key = 'multifloral';

-- 2. Planes Territoriales Digitales (Registro Territorial Apícola)
UPDATE public.subscription_plans
SET
  category = 'territorial',
  channels = ARRAY['nucleo_territorial']::text[],
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'digital', true
  )
WHERE key IN ('trazabilidad', 'apiario_pro', 'trazabilidad_temporada', 'apiario_pro_temporada');

-- 3. Reposición de Despensa
UPDATE public.subscription_plans
SET
  category = 'reposicion',
  channels = ARRAY['tienda_despensa']::text[],
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'digital', false
  )
WHERE key IN ('monthly', 'quarterly', 'annual');
