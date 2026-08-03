-- =============================================================================
-- Backfill: tablas de la migración 41 que nunca llegaron a prod.
-- La versión '41' figura como aplicada en el historial de prod, pero su DDL
-- no se ejecutó (historial reparado sin correr el script). Estas 4 tablas
-- quedaron huérfanas: el código de tienda (logros, back-in-stock, footprint,
-- palate) las consulta y hoy responde 500/PGRST205.
-- Este backfill reproduce EXACTAMENTE el DDL de 41_canje_impacto_silent_loyalty.sql
-- para las tablas faltantes, con IF NOT EXISTS (idempotente).
-- =============================================================================

-- Loyalty tiers (clasificación interna silenciosa)
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  min_points integer NOT NULL,
  description text,
  benefits jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Back-in-stock subscriptions (silent, no pop-ups)
CREATE TABLE IF NOT EXISTS public.back_in_stock_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  notified_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'expired')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, producto_id)
);

-- Palate profile (evoluciona, no es funnel)
CREATE TABLE IF NOT EXISTS public.palate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  discovery_count integer DEFAULT 0,
  last_quiz_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Huella regenerativa por orden
CREATE TABLE IF NOT EXISTS public.order_regenerative_footprint (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id text NOT NULL UNIQUE,
  co2_evitado_kg numeric DEFAULT 0,
  bosque_m2_protegido numeric DEFAULT 0,
  azucar_sustituida_g numeric DEFAULT 0,
  irr_score numeric,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS (idéntico a 41)
-- =============================================

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_regenerative_footprint ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tiers are publicly readable" ON public.loyalty_tiers;
CREATE POLICY "Tiers are publicly readable"
  ON public.loyalty_tiers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage tiers" ON public.loyalty_tiers;
CREATE POLICY "Admins can manage tiers"
  ON public.loyalty_tiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users see own subscriptions" ON public.back_in_stock_subscriptions;
CREATE POLICY "Users see own subscriptions"
  ON public.back_in_stock_subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.back_in_stock_subscriptions;
CREATE POLICY "Users can create own subscriptions"
  ON public.back_in_stock_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.back_in_stock_subscriptions;
CREATE POLICY "Users can delete own subscriptions"
  ON public.back_in_stock_subscriptions FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins see all subscriptions" ON public.back_in_stock_subscriptions;
CREATE POLICY "Admins see all subscriptions"
  ON public.back_in_stock_subscriptions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users see own palate profile" ON public.palate_profiles;
CREATE POLICY "Users see own palate profile"
  ON public.palate_profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own palate profile" ON public.palate_profiles;
CREATE POLICY "Users can insert own palate profile"
  ON public.palate_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own palate profile" ON public.palate_profiles;
CREATE POLICY "Users can update own palate profile"
  ON public.palate_profiles FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins see all palate profiles" ON public.palate_profiles;
CREATE POLICY "Admins see all palate profiles"
  ON public.palate_profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users see own order footprints" ON public.order_regenerative_footprint;
CREATE POLICY "Users see own order footprints"
ON public.order_regenerative_footprint FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ventas v
    WHERE v.id = venta_id AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins see all footprints" ON public.order_regenerative_footprint;
CREATE POLICY "Admins see all footprints"
  ON public.order_regenerative_footprint FOR SELECT
  USING (public.is_admin());

-- =============================================
-- Índices (idéntico a 41)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_back_in_stock_user_product ON public.back_in_stock_subscriptions (user_id, producto_id);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_pending ON public.back_in_stock_subscriptions (producto_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_order_footprint_venta ON public.order_regenerative_footprint (venta_id);

-- =============================================
-- Seed: tiers por defecto (idéntico a 41)
-- =============================================

INSERT INTO public.loyalty_tiers (name, key, min_points, description, benefits) VALUES
  ('Polinizador', 'polinizador', 0, 'Inicio del camino. Cada compra genera impacto rastreable.', '{}'),
  ('Apicultor', 'apicultor', 500, 'Conexión profunda con el territorio. Acceso a cosechas anticipadas.', '{"early_access": true}'),
  ('Guardián', 'guardian', 1500, 'Impacto regenerativo consolidado. Acceso a reservas exclusivas y contenido territorial.', '{"exclusive_harvests": true, "territorial_content": true}')
ON CONFLICT (key) DO NOTHING;
