-- Migration 998 — Fix handle_new_user trigger column error
-- Removes tier_override from public.profiles insert as the column does not exist

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := 'cliente';
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
  -- Registro desde Núcleo como apicultor territorial
  ELSIF v_app_source = 'nucleo_territorial' THEN
    v_role := 'territorial';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si es fundador/admin, vincularlo como owner en usuarios_empresas
  IF v_role = 'admin' THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
    SELECT NEW.id, id, 'owner'
    FROM public.empresas
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
