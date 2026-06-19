-- Migration 57: carrito persistente multi-dispositivo (usuarios autenticados)

CREATE TABLE IF NOT EXISTS public.carrito_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_carrito_items_user ON public.carrito_items (user_id);

ALTER TABLE public.carrito_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own cart items"
  ON public.carrito_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own cart items"
  ON public.carrito_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own cart items"
  ON public.carrito_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own cart items"
  ON public.carrito_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.actualizar_carrito_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_carrito_items_updated_at
  BEFORE UPDATE ON public.carrito_items
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_carrito_items_updated_at();

COMMENT ON TABLE public.carrito_items IS
  'Carrito activo por usuario autenticado. Guests usan localStorage; sync al login.';