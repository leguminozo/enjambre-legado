-- ==============================================================================
-- FIX DIRECTO PARA SUPABASE SQL EDITOR
-- Habilita cancelación y borrado de reservas (pre_orders) por el propio cliente
-- ==============================================================================

-- 1. Políticas RLS para pre_orders
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users update own pre_orders" ON public.pre_orders;
CREATE POLICY "Users update own pre_orders"
  ON public.pre_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own pre_orders" ON public.pre_orders;
CREATE POLICY "Users delete own pre_orders"
  ON public.pre_orders FOR DELETE
  USING (user_id = auth.uid());

-- 2. Función RPC para cancelación y borrado blindado con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.cancel_or_delete_user_pre_order(
  p_pre_order_id UUID,
  p_action TEXT DEFAULT 'delete'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT status INTO v_status
  FROM public.pre_orders
  WHERE id = p_pre_order_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada o no pertenece al usuario';
  END IF;

  IF v_status IN ('paid', 'fulfilled', 'completed') THEN
    RAISE EXCEPTION 'No se puede modificar una reserva que ya ha sido liquidada o despachada';
  END IF;

  IF p_action = 'delete' THEN
    DELETE FROM public.pre_orders
    WHERE id = p_pre_order_id AND user_id = v_user_id;
  ELSE
    UPDATE public.pre_orders
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_pre_order_id AND user_id = v_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_or_delete_user_pre_order(UUID, TEXT) TO authenticated;
