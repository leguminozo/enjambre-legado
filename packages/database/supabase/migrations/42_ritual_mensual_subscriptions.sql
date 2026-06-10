-- Ritual Mensual: subscription system
-- And agentic commerce: agent order API support

-- Subscription plans catalog
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

-- Active subscriptions
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

-- Subscription deliveries (one per period)
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

-- Agent-delegated auth tokens
CREATE TABLE IF NOT EXISTS public.agent_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read'],
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Cart abandonment tracking (for the single grace email)
CREATE TABLE IF NOT EXISTS public.cart_abandonment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text,
  cart_items jsonb NOT NULL DEFAULT '[]',
  cart_total integer DEFAULT 0,
  email_sent_at timestamptz,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_abandonment_events ENABLE ROW LEVEL SECURITY;

-- subscription_plans: public read, admin manage
CREATE POLICY "Plans are publicly readable"
  ON public.subscription_plans FOR SELECT
  USING (active = true);

CREATE POLICY "Admins manage plans"
  ON public.subscription_plans FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- subscriptions: users see own, admin sees all
CREATE POLICY "Users see own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin());

-- subscription_deliveries: users see own, admin all
CREATE POLICY "Users see own deliveries"
  ON public.subscription_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage deliveries"
  ON public.subscription_deliveries FOR ALL
  USING (public.is_admin());

-- agent_delegations: users see own, admin all
CREATE POLICY "Users see own delegations"
  ON public.agent_delegations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own delegations"
  ON public.agent_delegations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke own delegations"
  ON public.agent_delegations FOR DELETE
  USING (user_id = auth.uid());

-- cart_abandonment_events: admin only
CREATE POLICY "Admins manage cart abandonment"
  ON public.cart_abandonment_events FOR ALL
  USING (public.is_admin());

-- Users can insert own abandonment event
CREATE POLICY "Users can create own abandonment"
  ON public.cart_abandonment_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON public.subscriptions (current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sub_deliveries_subscription ON public.subscription_deliveries (subscription_id, period_number);
CREATE INDEX IF NOT EXISTS idx_sub_deliveries_scheduled ON public.subscription_deliveries (scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_agent_delegations_user ON public.agent_delegations (user_id, agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_delegations_hash ON public.agent_delegations (token_hash) WHERE expires_at > now();
CREATE INDEX IF NOT EXISTS idx_cart_abandonment_pending ON public.cart_abandonment_events (created_at) WHERE email_sent_at IS NULL AND converted = false;

-- =============================================
-- Seed: default subscription plans
-- =============================================

INSERT INTO public.subscription_plans (name, key, price_clp, frequency, description, included_items) VALUES
  ('Ritual Mensual', 'monthly', 19990, 'monthly', 'Una selección curada de mieles del bosque nativo, cada mes en tu puerta.', '[{"type": "curated_selection", "quantity": 2}]'),
  ('Ritual Trimestral', 'quarterly', 54990, 'quarterly', 'Tres meses de descubrimiento. Cada trimestre, mieles que reflejan la estación.', '[{"type": "curated_selection", "quantity": 3}, {"type": "exclusive_access", "note": "Cosecha anticipada"}]'),
  ('Legado Anual', 'annual', 199990, 'annual', 'Un año completo de fidelidad al territorio. Las mejores cosechas reservadas para usted.', '[{"type": "curated_selection", "quantity": 4}, {"type": "exclusive_access", "note": "Cosechas exclusivas"}, {"type": "territorial_content", "note": "Contenido territorial"}]');
