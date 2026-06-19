-- P0 Tienda: permitir idempotencia de abandono de carrito (SELECT propio)
-- Sin esta policy, el check .maybeSingle() en /api/cart/abandonment falla bajo RLS
-- y los usuarios insertaban eventos duplicados en cada visita.

CREATE POLICY "Users read own abandonment"
  ON public.cart_abandonment_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());