-- Migration 20261103223500: Sanear copy de Reserva Anual y beneficios del Club Legado
-- Elimina promesas de "floraciones efímeras escasas", "Ulmo puro de altura" y "Tiaca silvestre"
-- y las reemplaza por la verdad de la marca: "recolección anual de miel de bosque nativo de Chiloé".

-- 1. Actualizar club_page_settings si contiene texto antiguo
UPDATE public.site_content
SET content = (
  replace(
    replace(
      replace(
        replace(
          content::text,
          'Reserva Anticipada de Floraciones Efímeras',
          'Reserva Anticipada de la Recolección Anual'
        ),
        'Early Reservation of Ephemeral Blooms',
        'Early Reservation of the Annual Harvest'
      ),
      'Acceso prioritario a floraciones silvestres de volumen limitado antes de su apertura pública. Asegura tu cupo en recolecciones escasas de alta pureza botánica —como Ulmo puro de altura o Tiaca silvestre— recolectadas en ventanas climáticas únicas del archipiélago.',
      'Acceso prioritario a la partida anual de miel cruda antes de su apertura pública. Asegura tu cupo en la recolección estacional del bosque nativo de Chiloé con trazabilidad de origen y análisis de laboratorio.'
    ),
    'Priority access to limited-volume wild blooms before public opening. Secure your spot in scarce harvests of high botanical purity —such as high-altitude pure Ulmo or wild Tiaca— harvested in unique climatic windows of the archipelago.',
    'Priority access to the annual raw honey batch before public release. Secure your spot in the seasonal harvest of the Chiloé native forest with origin traceability and laboratory analysis.'
  )
)::jsonb
WHERE section_key = 'club_page_settings';

-- 2. Limpieza general en site_content de menciones a Ulmo puro de altura / Tiaca silvestre como promesa escasa
UPDATE public.site_content
SET content = (
  replace(
    replace(
      content::text,
      'Ulmo puro de altura o Tiaca silvestre',
      'miel de bosque nativo de Chiloé'
    ),
    'Ulmo puro de altura y Tiaca silvestre',
    'miel de bosque nativo de Chiloé'
  )
)::jsonb
WHERE content::text LIKE '%Ulmo puro de altura%';

-- 3. Actualizar reserva_anual defaults en site_content si existen filas guardadas con títulos desactualizados
UPDATE public.site_content
SET content = jsonb_set(
  jsonb_set(
    content,
    '{title}',
    '"Reserva Anual de Recolección"'
  ),
  '{subtitle}',
  '"Asegura tu parte de la recolección estacional del bosque nativo antes de que concluya la temporada"'
)
WHERE section_key = 'reserva_anual'
  AND (content->>'title' = 'Reserva Anual' OR content->>'title' IS NULL);

-- 4. Permitir que usuarios autenticados cancelen o modifiquen sus propias pre-órdenes
DROP POLICY IF EXISTS "Users update own pre_orders" ON public.pre_orders;
CREATE POLICY "Users update own pre_orders"
  ON public.pre_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own pre_orders" ON public.pre_orders;
CREATE POLICY "Users delete own pre_orders"
  ON public.pre_orders FOR DELETE
  USING (user_id = auth.uid());

-- 5. RPC seguro para que un usuario pueda cancelar o eliminar su propia pre-orden
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


