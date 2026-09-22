-- ============================================================
-- Migration 20260921171000: Web Push Subscriptions (Cross-App)
-- Soporte para notificaciones Push web nativas (RFC 8291 / 8292)
-- para Tienda, Núcleo y Campo sin intermediarios pagos.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  app_source TEXT NOT NULL DEFAULT 'tienda' CHECK (app_source IN ('tienda', 'nucleo', 'campo')),
  user_agent TEXT,
  topics TEXT[] NOT NULL DEFAULT ARRAY['general']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_app_source
  ON public.push_subscriptions (app_source);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY push_subscriptions_select ON public.push_subscriptions
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_admin() OR
    public.is_gerente()
  );

CREATE POLICY push_subscriptions_insert ON public.push_subscriptions
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL) OR
    public.is_admin()
  );

CREATE POLICY push_subscriptions_update ON public.push_subscriptions
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY push_subscriptions_delete ON public.push_subscriptions
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_admin()
  );

-- Función para guardar o actualizar suscripción push de manera idempotente
CREATE OR REPLACE FUNCTION public.save_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_app_source TEXT DEFAULT 'tienda',
  p_user_agent TEXT DEFAULT NULL,
  p_topics TEXT[] DEFAULT ARRAY['general']::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sub_id UUID;
BEGIN
  INSERT INTO public.push_subscriptions (
    user_id, endpoint, p256dh, auth, app_source, user_agent, topics, updated_at
  ) VALUES (
    v_user_id, p_endpoint, p_p256dh, p_auth, p_app_source, p_user_agent, p_topics, now()
  )
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = COALESCE(v_user_id, public.push_subscriptions.user_id),
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    app_source = EXCLUDED.app_source,
    user_agent = COALESCE(EXCLUDED.user_agent, public.push_subscriptions.user_agent),
    topics = EXCLUDED.topics,
    updated_at = now()
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object('success', true, 'subscription_id', v_sub_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_push_subscription TO authenticated, anon;
