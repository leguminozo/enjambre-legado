-- Migration 997 — Rol territorial para apicultores externos del Registro
-- Permite que el trigger handle_new_user() y las políticas RLS acepten
-- el rol 'territorial' como un valor válido en public.profiles.

-- 1. Ampliar constraint de roles en profiles si existe
DO $$
BEGIN
  -- Eliminar constraint existente si lo hay
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  -- Re-crear constraint incluyendo 'territorial'
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'cliente', 'creador', 'rep_ventas', 'territorial'));
END $$;

-- 2. Actualizar handle_new_user() para detectar app_source = 'nucleo_territorial'
--    y asignar rol 'territorial' automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := 'cliente';
  v_guardian text := 'brotes';
  v_email_clean text;
  v_app_source text;
BEGIN
  v_email_clean := LOWER(TRIM(NEW.email));
  v_app_source := NEW.raw_user_meta_data->>'app_source';

  -- Whitelist inmutable de Fundadores / Administradores raíz
  IF v_email_clean IN (
    'gabriel.cuevas01@alumnos.uach.cl',
    'contacto@enjambrelegado.cl'
  ) THEN
    v_role := 'admin';
    v_guardian := 'COLMENA';

  -- Registro desde Núcleo como apicultor territorial
  ELSIF v_app_source = 'nucleo_territorial' THEN
    v_role := 'territorial';

  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, tier_override)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    v_guardian
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si es fundador/admin, vincularlo como owner en usuarios_empresas
  IF v_role = 'admin' THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol_empresa)
    SELECT NEW.id, id, 'owner'
    FROM public.empresas
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. RLS: el usuario territorial puede ver y editar su propio perfil
-- (ya debería estar cubierto por políticas existentes de profiles,
--  pero lo aseguramos explícitamente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'territorial_own_profile'
  ) THEN
    CREATE POLICY territorial_own_profile ON public.profiles
      FOR ALL
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
