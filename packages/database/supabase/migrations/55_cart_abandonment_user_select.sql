-- P0 Tienda: cart_abandonment_events + policy SELECT propio
-- Bootstrap si migration 42 no creó la tabla en este entorno remoto.

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

ALTER TABLE public.cart_abandonment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own abandonment" ON public.cart_abandonment_events;
CREATE POLICY "Users can create own abandonment"
  ON public.cart_abandonment_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own abandonment" ON public.cart_abandonment_events;
CREATE POLICY "Users read own abandonment"
  ON public.cart_abandonment_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());