-- Migration 999: Integrate territorial signup directly into handle_new_user trigger

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
