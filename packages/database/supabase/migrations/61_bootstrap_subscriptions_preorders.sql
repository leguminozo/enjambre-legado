-- Bootstrap tablas de ritual/subscriptions y pre_orders si migration 42 quedó registrada sin DDL en remoto.

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  price_clp integer NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  description text,
  included_items jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'past_due', 'canceled', 'trialing')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  canceled_at timestamptz,
  pause_scheduled_until timestamptz,
  next_selection jsonb,
  stripe_subscription_id text,
  stripe_customer_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  period_number integer NOT NULL,
  scheduled_for timestamptz NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  venta_id text REFERENCES public.ventas(id),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'shipped', 'delivered', 'failed')),
  tracking_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pre_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  email text,
  quantity integer NOT NULL DEFAULT 1,
  deposit_amount integer DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'converted', 'cancelled', 'refunded')),
  converted_venta_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans are publicly readable" ON public.subscription_plans;
CREATE POLICY "Plans are publicly readable"
  ON public.subscription_plans FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Users see own subscriptions" ON public.subscriptions;
CREATE POLICY "Users see own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create subscriptions" ON public.subscriptions;
CREATE POLICY "Users can create subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own deliveries" ON public.subscription_deliveries;
CREATE POLICY "Users see own deliveries"
  ON public.subscription_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users see own pre_orders" ON public.pre_orders;
CREATE POLICY "Users see own pre_orders"
  ON public.pre_orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own pre_orders" ON public.pre_orders;
CREATE POLICY "Users create own pre_orders"
  ON public.pre_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

INSERT INTO public.subscription_plans (name, key, price_clp, frequency, description, included_items)
SELECT * FROM (VALUES
  ('Ritual Mensual', 'monthly', 19990, 'monthly', 'Una selección curada de mieles del bosque nativo, cada mes en tu puerta.', '[{"type": "curated_selection", "quantity": 2}]'::jsonb),
  ('Ritual Trimestral', 'quarterly', 54990, 'quarterly', 'Tres meses de descubrimiento. Cada trimestre, mieles que reflejan la estación.', '[{"type": "curated_selection", "quantity": 3}]'::jsonb),
  ('Legado Anual', 'annual', 199990, 'annual', 'Un año completo de fidelidad al territorio.', '[{"type": "curated_selection", "quantity": 4}]'::jsonb)
) AS v(name, key, price_clp, frequency, description, included_items)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans LIMIT 1);