-- ==============================================================================
-- Migración: 20260921170000_roles_personalizados_engine.sql
-- Motor estructural de roles y perfiles de acceso configurables en Núcleo
-- Permite a los administradores crear roles con selección granular de módulos
-- y asignarlos a cualquier usuario (ej. convertir cliente a Ayudante de Inventario).
-- ==============================================================================

-- 1. Tabla de roles personalizados
CREATE TABLE IF NOT EXISTS public.roles_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  color TEXT NOT NULL DEFAULT 'amber',
  modulos TEXT[] NOT NULL DEFAULT '{}',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_roles_personalizados_empresa_slug UNIQUE (empresa_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_roles_personalizados_empresa 
  ON public.roles_personalizados(empresa_id);

-- 2. Habilitar RLS en roles_personalizados
ALTER TABLE public.roles_personalizados ENABLE ROW LEVEL SECURITY;

-- Política lectura: miembros de la empresa o administradores
DROP POLICY IF EXISTS "roles_personalizados_select_policy" ON public.roles_personalizados;
CREATE POLICY "roles_personalizados_select_policy"
  ON public.roles_personalizados
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    public.has_empresa_access(empresa_id)
  );

-- Política mutación (INSERT/UPDATE/DELETE): solo administradores
DROP POLICY IF EXISTS "roles_personalizados_admin_mutation" ON public.roles_personalizados;
CREATE POLICY "roles_personalizados_admin_mutation"
  ON public.roles_personalizados
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Vincular perfil_acceso_id en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS perfil_acceso_id UUID REFERENCES public.roles_personalizados(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_perfil_acceso 
  ON public.profiles(perfil_acceso_id);

-- 4. Actualizar constraint de roles en profiles para incluir 'colaborador'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
      'admin',
      'apicultor',
      'territorial',
      'cliente',
      'creador',
      'rep_ventas',
      'operador',
      'colaborador'
    ));
END $$;

-- 5. Seed inicial del rol "Ayudante de Bodega e Inventario" para la empresa principal
DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  SELECT id INTO v_empresa_id FROM public.empresas LIMIT 1;
  IF v_empresa_id IS NOT NULL THEN
    INSERT INTO public.roles_personalizados (
      empresa_id,
      nombre,
      slug,
      descripcion,
      color,
      modulos
    ) VALUES (
      v_empresa_id,
      'Ayudante de Inventario',
      'ayudante-inventario',
      'Apoyo en conteo físico de stock, recepción de materias y revisión de lotes',
      'emerald',
      ARRAY['inventario', 'lotes', 'recoleccion']
    ) ON CONFLICT (empresa_id, slug) DO NOTHING;
  END IF;
END $$;
