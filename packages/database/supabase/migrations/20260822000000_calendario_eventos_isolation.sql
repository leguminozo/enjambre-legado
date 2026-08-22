-- ═══════════════════════════════════════════════════════════════════════════
-- Migración: Aislamiento estructural y RLS estricto para calendario_eventos
--
-- Corrige la fuga de eventos cruzados entre roles.
-- 1. Usuarios no-admin (apicultor, territorial, etc.) solo ven y gestionan
--    sus propios eventos (auth.uid() = user_id).
-- 2. Administradores / dueños de OYZ (is_admin() / is_gerente()) pueden
--    compartir y gestionar eventos vinculados a su empresa (has_empresa_access).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Aislamiento estricto por creador (user_id) o tenant para administradores
DROP POLICY IF EXISTS calendario_eventos_select ON public.calendario_eventos;
CREATE POLICY calendario_eventos_select ON public.calendario_eventos
  FOR SELECT TO authenticated
  USING (
    -- El propio creador siempre puede ver sus eventos
    auth.uid() = user_id
    OR (
      -- Los administradores / dueños del negocio ven eventos de su empresa u huérfanos
      (public.is_admin() OR public.is_gerente())
      AND (
        empresa_id IS NULL
        OR public.has_empresa_access(empresa_id)
      )
    )
  );

-- 2. INSERT: El creador debe coincidir con la sesión autenticada
DROP POLICY IF EXISTS calendario_eventos_insert ON public.calendario_eventos;
CREATE POLICY calendario_eventos_insert ON public.calendario_eventos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND (
      empresa_id IS NULL
      OR public.has_empresa_access(empresa_id)
      OR public.is_admin()
      OR public.is_gerente()
    )
  );

-- 3. UPDATE: El propio creador o un admin con acceso a la empresa
DROP POLICY IF EXISTS calendario_eventos_update ON public.calendario_eventos;
CREATE POLICY calendario_eventos_update ON public.calendario_eventos
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      (public.is_admin() OR public.is_gerente())
      AND (
        empresa_id IS NULL
        OR public.has_empresa_access(empresa_id)
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      (public.is_admin() OR public.is_gerente())
      AND (
        empresa_id IS NULL
        OR public.has_empresa_access(empresa_id)
      )
    )
  );

-- 4. DELETE: El propio creador o un admin con acceso a la empresa
DROP POLICY IF EXISTS calendario_eventos_delete ON public.calendario_eventos;
CREATE POLICY calendario_eventos_delete ON public.calendario_eventos
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      (public.is_admin() OR public.is_gerente())
      AND (
        empresa_id IS NULL
        OR public.has_empresa_access(empresa_id)
      )
    )
  );
