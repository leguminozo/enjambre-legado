-- Endurecer RLS de calendario_eventos: solo el dueño escribe.
-- (por si 91 ya se aplicó con políticas permisivas)

DROP POLICY IF EXISTS calendario_eventos_insert ON public.calendario_eventos;
CREATE POLICY calendario_eventos_insert ON public.calendario_eventos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS calendario_eventos_update ON public.calendario_eventos;
CREATE POLICY calendario_eventos_update ON public.calendario_eventos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS calendario_eventos_delete ON public.calendario_eventos;
CREATE POLICY calendario_eventos_delete ON public.calendario_eventos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
