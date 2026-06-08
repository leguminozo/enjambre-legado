-- Canje Impacto: silent loyalty system
-- No gamification, no badges, no pop-ups. Points grow silently like a pension fund.
-- Actions generate impact points that translate to access to exclusive harvests and territorial content.

-- Loyalty tiers (not displayed as badges — just internal classification)
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  min_points integer NOT NULL,
  description text,
  benefits jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Transaction ledger: every earn/redeem event
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type public.accion_tipo NOT NULL,
  points integer NOT NULL,
  balance_after integer NOT NULL,
  source_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Redemption catalog: what points can unlock
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('exclusive_harvest', 'territorial_content', 'early_access', 'experience')),
  metadata jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User reward redemptions
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id),
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired')),
  fulfilled_at timestamptz,
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

-- Pre-orders (validate demand before producing)
CREATE TABLE IF NOT EXISTS public.pre_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  email text,
  quantity integer NOT NULL DEFAULT 1,
  deposit_amount integer DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'converted', 'cancelled', 'refunded')),
  converted_venta_id uuid REFERENCES public.ventas(id),
  created_at timestamptz DEFAULT now()
);

-- Palate profile (evolves over time, not a funnel)
CREATE TABLE IF NOT EXISTS public.palate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  discovery_count integer DEFAULT 0,
  last_quiz_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Regenerative footprint per order
CREATE TABLE IF NOT EXISTS public.order_regenerative_footprint (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL UNIQUE REFERENCES public.ventas(id) ON DELETE CASCADE,
  co2_evitado_kg numeric DEFAULT 0,
  bosque_m2_protegido numeric DEFAULT 0,
  azucar_sustituida_g numeric DEFAULT 0,
  irr_score numeric,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS policies
-- =============================================

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_regenerative_footprint ENABLE ROW LEVEL SECURITY;

-- loyalty_tiers: anyone can read, only admin can manage
CREATE POLICY "Tiers are publicly readable"
  ON public.loyalty_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tiers"
  ON public.loyalty_tiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- loyalty_transactions: users see their own, admin sees all, insert via service or triggers
CREATE POLICY "Users see own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (public.is_admin());

-- loyalty_rewards: anyone can read active rewards
CREATE POLICY "Active rewards are publicly readable"
  ON public.loyalty_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage rewards"
  ON public.loyalty_rewards FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- loyalty_redemptions: users see own, admin sees all
CREATE POLICY "Users see own redemptions"
  ON public.loyalty_redemptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own redemptions"
  ON public.loyalty_redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage redemptions"
  ON public.loyalty_redemptions FOR ALL
  USING (public.is_admin());

-- back_in_stock_subscriptions: users manage their own
CREATE POLICY "Users see own subscriptions"
  ON public.back_in_stock_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions"
  ON public.back_in_stock_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON public.back_in_stock_subscriptions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all subscriptions"
  ON public.back_in_stock_subscriptions FOR SELECT
  USING (public.is_admin());

-- pre_orders: users see own
CREATE POLICY "Users see own pre-orders"
  ON public.pre_orders FOR SELECT
  USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can create pre-orders"
  ON public.pre_orders FOR INSERT
  WITH CHECK (user_id = auth.uid() OR email IS NOT NULL);

CREATE POLICY "Users can update own pre-orders"
  ON public.pre_orders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all pre-orders"
  ON public.pre_orders FOR ALL
  USING (public.is_admin());

-- palate_profiles: users see own, admin sees all
CREATE POLICY "Users see own palate profile"
  ON public.palate_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own palate profile"
  ON public.palate_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own palate profile"
  ON public.palate_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all palate profiles"
  ON public.palate_profiles FOR SELECT
  USING (public.is_admin());

-- order_regenerative_footprint: users see own (via venta), admin sees all
CREATE POLICY "Users see own order footprints"
  ON public.order_regenerative_footprint FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ventas v
      WHERE v.id = venta_id AND v.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Admins see all footprints"
  ON public.order_regenerative_footprint FOR SELECT
  USING (public.is_admin());

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON public.loyalty_redemptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_user_product ON public.back_in_stock_subscriptions (user_id, producto_id);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_pending ON public.back_in_stock_subscriptions (producto_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pre_orders_user ON public.pre_orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_pre_orders_product ON public.pre_orders (producto_id, status);
CREATE INDEX IF NOT EXISTS idx_order_footprint_venta ON public.order_regenerative_footprint (venta_id);

-- =============================================
-- Seed: default tiers
-- =============================================

INSERT INTO public.loyalty_tiers (name, key, min_points, description, benefits) VALUES
  ('Polinizador', 'polinizador', 0, 'Inicio del camino. Cada compra genera impacto rastreable.', '{}'),
  ('Apicultor', 'apicultor', 500, 'Conexión profunda con el territorio. Acceso a cosechas anticipadas.', '{"early_access": true}'),
  ('Guardián', 'guardian', 1500, 'Impacto regenerativo consolidado. Acceso a reservas exclusivas y contenido territorial.', '{"exclusive_harvests": true, "territorial_content": true}');

-- =============================================
-- Trigger: award points on purchase
-- =============================================

CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
  v_balance integer;
  v_tier_key text;
BEGIN
  IF NEW.buyer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1 point per 100 CLP spent
  v_points := GREATEST(1, FLOOR(NEW.total / 100));

  -- Get current balance
  SELECT puntos_acumulados INTO v_balance
  FROM profiles WHERE id = NEW.buyer_id;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  v_balance := v_balance + v_points;

  -- Update profile balance
  UPDATE profiles SET puntos_acumulados = v_balance WHERE id = NEW.buyer_id;

  -- Determine tier
  SELECT key INTO v_tier_key FROM loyalty_tiers
  WHERE min_points <= v_balance
  ORDER BY min_points DESC
  LIMIT 1;

  IF v_tier_key IS NOT NULL THEN
    UPDATE profiles SET nivel_guardian = v_tier_key WHERE id = NEW.buyer_id;
  END IF;

  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, action_type, points, balance_after, source_id, description)
  VALUES (
    NEW.buyer_id,
    'compra',
    v_points,
    v_balance,
    NEW.id::text,
    CONCAT('Compra #', NEW.id::text, ' — ', v_points, ' puntos')
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON public.ventas;
CREATE TRIGGER trigger_award_loyalty_points
  AFTER INSERT ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.award_loyalty_points();

-- =============================================
-- Trigger: compute regenerative footprint on sale
-- =============================================

CREATE OR REPLACE FUNCTION public.compute_regenerative_footprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_co2 numeric;
  v_azucar numeric;
  v_irr numeric;
BEGIN
  IF NEW.buyer_id IS NULL OR NEW.producto_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT co2_evitado_kg, sustituye_azucar_g, irr_referencia
  INTO v_co2, v_azucar, v_irr
  FROM productos WHERE id = NEW.producto_id;

  -- Scale by quantity
  v_co2 := COALESCE(v_co2, 0) * NEW.cantidad;
  v_azucar := COALESCE(v_azucar, 0) * NEW.cantidad;

  -- Bosque m2: heuristic — 1m2 per 0.5kg CO2 avoided
  INSERT INTO order_regenerative_footprint (venta_id, co2_evitado_kg, bosque_m2_protegido, azucar_sustituida_g, irr_score)
  VALUES (
    NEW.id,
    v_co2,
    GREATEST(1, v_co2 / 0.5),
    v_azucar,
    v_irr
  )
  ON CONFLICT (venta_id) DO UPDATE SET
    co2_evitado_kg = v_co2,
    bosque_m2_protegido = GREATEST(1, v_co2 / 0.5),
    azucar_sustituida_g = v_azucar,
    irr_score = v_irr;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_compute_footprint ON public.ventas;
CREATE TRIGGER trigger_compute_footprint
  AFTER INSERT ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_regenerative_footprint();
