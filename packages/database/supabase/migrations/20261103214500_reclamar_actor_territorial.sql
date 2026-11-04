-- Migration: Reclamar actor territorial en signup
-- Si el usuario se registra con reclamar_actor_id en user_metadata, se vincula
-- el actor pre-cargado existente (user_id IS NULL) en lugar de duplicar la fila.

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
  v_birth_date date;
  v_reclamar_id uuid;
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

  -- Fecha de cumpleaños (YYYY-MM-DD). Formato inválido => NULL, sin interrumpir el registro.
  BEGIN
    v_birth_date := NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_birth_date := NULL;
  END;

  -- 2. Insertar en profiles
  INSERT INTO public.profiles (id, email, full_name, role, birth_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    v_birth_date
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
    BEGIN
      v_reclamar_id := NULLIF(NEW.raw_user_meta_data->>'reclamar_actor_id', '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_reclamar_id := NULL;
    END;

    IF v_reclamar_id IS NOT NULL THEN
      -- Reclamar actor pre-cargado asociando identidad, consentimientos y trazabilidad
      UPDATE public.actores_registro
      SET user_id = NEW.id,
          rut = COALESCE(NULLIF(NEW.raw_user_meta_data->>'rut', ''), rut),
          telefono = COALESCE(NULLIF(NEW.raw_user_meta_data->>'telefono', ''), telefono),
          acepta_carta = COALESCE((NEW.raw_user_meta_data->>'territorial_acepta_carta')::boolean, true),
          acepta_politica_datos = COALESCE((NEW.raw_user_meta_data->>'territorial_acepta_politica_datos')::boolean, true),
          consentimientos = COALESCE((NEW.raw_user_meta_data->>'territorial_consentimientos')::jsonb, consentimientos),
          observaciones = COALESCE(observaciones || ' · ', '') || 'Reclamado en signup por ' || NEW.email || ' (' || NOW()::date || ')',
          updated_at = NOW()
      WHERE id = v_reclamar_id
        AND user_id IS NULL;
    ELSE
      -- Insertar nuevo actor si no reclamó
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
  END IF;

  -- 5. Sistema de Referidos (Invitaciones)
  IF NEW.raw_user_meta_data->>'referrer_id' IS NOT NULL THEN
    BEGIN
      v_referrer_id := (NEW.raw_user_meta_data->>'referrer_id')::uuid;
      PERFORM public.complete_referral_signup(v_referrer_id, NEW.id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
