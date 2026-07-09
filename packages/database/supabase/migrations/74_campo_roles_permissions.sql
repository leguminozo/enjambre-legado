-- 74_campo_roles_permissions.sql
-- Habilita permisos granulares para rep_ventas en Campo (Mi Feria)

-- 1. Permitir a operadores actualizar (registrar devoluciones) en sus consignaciones
DROP POLICY IF EXISTS "Operador gestiona sus consignaciones" ON public.participante_consignacion;
CREATE POLICY "Operador gestiona sus consignaciones" ON public.participante_consignacion
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.participante_evento pe
      JOIN public.participante_contrato pc ON pc.id = pe.contrato_id
      WHERE pe.id = participante_consignacion.evento_id
        AND pc.user_id = auth.uid()
    )
  );

-- Asegurarse de que el Admin sigue pudiendo gestionar
DROP POLICY IF EXISTS "Admin gestiona consignaciones" ON public.participante_consignacion;
CREATE POLICY "Admin gestiona consignaciones" ON public.participante_consignacion
  FOR ALL USING (public.is_admin());
