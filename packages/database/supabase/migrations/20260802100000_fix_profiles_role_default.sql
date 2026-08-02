-- ============================================================
-- Migration 20260802100000: fix default de profiles.role + handle_new_user
--
-- Problema de sincronía de cadena: el hotfix `20260601120000`
-- (profiles_role_default_gerente) numéricamente aplica DESPUÉS de las
-- migraciones 39/997/999, pero:
--   1. Deja `profiles.role DEFAULT 'gerente'` — valor que la CHECK
--      constraint de 39/997 (admin|cliente|creador|rep_ventas|territorial)
--      rechaza → todo INSERT de profiles sin role explícito falla.
--   2. Reemplaza handle_new_user() con una versión que inserta 'gerente'
--      y que no conoce el flujo territorial de 997/999 ni el founder de 995.
--
-- En prod la cadena fue cronológica (hotfix antes de 39/997/999), por lo
-- que el trigger quedó sano pero el DEFAULT 'gerente' quedó latente.
-- Esta migración restaura el estado coherente para ambas rutas
-- (fresh apply y prod) sin tocar archivos ya aplicados.
-- ============================================================

-- 1. DEFAULT coherente con la CHECK constraint vigente + NOT NULL
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'admin';
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- 2. Re-afirmar el trigger canónico (versión 999: territorial + founder + referidos).
--    Necesario porque en fresh apply numérico el hotfix 20260601120000
--    pisa la versión de 999; esta re-definición aplica después de ambos.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_app_source text;
  v_referrer_id uuid;
BEGIN
  -- 1. Extraer metadata básica
  v_app_source := NEW.raw_user_meta_data->>'app_source';

  -- Si no existe app_source, inferir según dominios (legado) o forzar cliente
  IF v_app_source IS NULL THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'tienda' THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'campo' THEN
    v_role := 'rep_ventas';
  ELSIF v_app_source = 'nucleo_territorial' THEN
    v_role := 'territorial';
  ELSE
    v_role := 'cliente';
  END IF;

  -- Sobrescribir el rol si viene un rol duro para el equipo (solo para cuentas pre-autorizadas o fundadores)
  IF (NEW.email = 'gabriel.cuevas01@alumnos.uach.cl') THEN
    v_role := 'admin';
  END IF;

  -- 2. Insertar en profiles
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Lógica específica para administradores / dueños de empresa
  IF v_role = 'admin' THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
    SELECT NEW.id, id, 'owner'
    FROM public.empresas
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Lógica de Actor Territorial (si se registró por Núcleo Territorial)
  IF v_app_source = 'nucleo_territorial' THEN
    INSERT INTO public.actores_registro (
      user_id,
      rol,
      nombre_actor,
      comuna,
      region,
      consentimientos
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'territorial_rol', 'api_residente'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'territorial_comuna', 'Desconocida'),
      COALESCE(NEW.raw_user_meta_data->>'territorial_region', 'Los Lagos'),
      COALESCE((NEW.raw_user_meta_data->>'territorial_consentimientos')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Sistema de Referidos (Invitaciones)
  -- Si el usuario ingresó un código de invitación (referrer_id) válido (UUID)
  IF NEW.raw_user_meta_data->>'referrer_id' IS NOT NULL THEN
    BEGIN
      v_referrer_id := (NEW.raw_user_meta_data->>'referrer_id')::uuid;
      -- Usar PERFORM en lugar de SELECT para ignorar el resultado de la función
      PERFORM public.complete_referral_signup(v_referrer_id, NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Si el UUID es inválido o la función falla, ignorar para no interrumpir el registro
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
