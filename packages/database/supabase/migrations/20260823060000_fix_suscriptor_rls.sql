-- Allow subscribers to read their linked colmenas
CREATE POLICY colmenas_suscriptor_select ON public.colmenas
  FOR SELECT USING (
    id IN (
      SELECT colmena_id FROM public.suscriptor_config WHERE user_id = auth.uid()
    )
  );

-- Allow subscribers to read the apiarios of their linked colmenas
CREATE POLICY apiarios_suscriptor_select ON public.apiarios
  FOR SELECT USING (
    id IN (
      SELECT apiario_id FROM public.colmenas WHERE id IN (
        SELECT colmena_id FROM public.suscriptor_config WHERE user_id = auth.uid()
      )
    )
  );
